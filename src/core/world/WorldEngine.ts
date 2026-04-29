import { EntityManager } from '../ecs/EntityManager';
import { EntityType } from '../ecs/types';
import { TimeSystem } from './TimeSystem';
import { WeatherSystem, type Weather } from './WeatherSystem';
import { VitalSystem } from './VitalSystem';
import { RelationSystem } from './RelationSystem';
import { EconomySystem } from './EconomySystem';
import { DeathSystem } from './DeathSystem';
import { SeededRandom } from '../utils/random';
import type { PlayerOrigin } from '../data/PlayerOrigins';
import { generateNpcTemplates } from '../data/NpcTemplates';
import { getLocation } from '../data/LocationDefs';
import { clamp } from '../utils/clamp';
import { DecisionEngine, type DecisionContext } from '../ai/DecisionEngine';
import { createDefaultActionRegistry, type GameAction } from '../ai/ActionRegistry';
import { matchEvent, isChoiceAvailable, type MatchContext } from '../ai/SceneLibrary/Matcher';
import type { EventConsequence, ActiveEvent } from '../ai/SceneLibrary/types';
import { ALL_EVENTS } from '../data/SceneDefs';
import { NpcInteractionEngine, type InteractionState } from '../ai/NpcInteractionEngine';
import { ConsequenceEngine, type ConsequenceResult } from '../ai/ConsequenceEngine';
import { generateNpcReaction } from '../ai/NpcReactions';
import { RumorSystem } from '../ai/RumorSystem';

export interface DayResult {
  day: number;
  season: string;
  weather: Weather;
  weatherChanged: boolean;
  playerState: PlayerSnapshot;
  npcActions: NpcActionResult[];
  majorEvents: string[];
  playerDied: boolean;
  deathCause: string;
}

export interface PlayerSnapshot {
  hunger: number;
  fatigue: number;
  health: number;
  mood: number;
  copper: number;
  actionPoints: number;
  locationId: string;
}

export interface NpcActionResult {
  npcId: number;
  npcName: string;
  narrative: string;
  locationId: string;
}

export class WorldEngine {
  readonly em: EntityManager;
  readonly time: TimeSystem;
  readonly weather: WeatherSystem;
  readonly vital: VitalSystem;
  readonly rng: SeededRandom;
  readonly ai: DecisionEngine;
  readonly actionRegistry: ReturnType<typeof createDefaultActionRegistry>;
  readonly relations: RelationSystem;
  readonly economy: EconomySystem;
  readonly death: DeathSystem;
  readonly interaction: NpcInteractionEngine;
  readonly consequenceEngine: ConsequenceEngine;
  readonly rumorSystem: RumorSystem;

  private playerId: number | null = null;
  private usedEventIds: string[] = [];  // 冷却中的事件ID
  private activeEvent: ActiveEvent | null = null;

  constructor(seed: number = Date.now()) {
    this.em = new EntityManager();
    this.time = new TimeSystem();
    this.weather = new WeatherSystem();
    this.vital = new VitalSystem();
    this.rng = new SeededRandom(seed);
    this.actionRegistry = createDefaultActionRegistry();
    this.ai = new DecisionEngine(this.actionRegistry);
    this.relations = new RelationSystem();
    this.economy = new EconomySystem();
    this.death = new DeathSystem();
    this.interaction = new NpcInteractionEngine(this.em, this.relations, this.rng);
    this.consequenceEngine = new ConsequenceEngine();
    this.rumorSystem = new RumorSystem();
  }

  /** 生成50个NPC */
  spawnNpcs(): void {
    const templates = generateNpcTemplates(this.rng);
    for (const t of templates) {
      const id = this.em.create(EntityType.NPC);
      this.em.addComponent(id, 'Vital', {
        hunger: t.hunger,
        fatigue: t.fatigue,
        health: t.health,
        mood: t.mood,
      });
      this.em.addComponent(id, 'Identity', {
        name: t.name,
        profession: t.profession,
        age: t.age,
        personality: t.personality,
      });
      this.em.addComponent(id, 'Wallet', { copper: t.copper });
      this.em.addComponent(id, 'Position', { locationId: t.defaultLocation });
      this.em.addComponent(id, 'NpcSchedule', {
        schedule: { day: t.dayLocation, default: t.defaultLocation },
      });
      this.em.addComponent(id, 'Memory', {
        recentEvents: [],
        impressions: {},
        narrativeTags: [],
        choiceHistory: [],
      });
      this.em.addComponent(id, 'ActionState', {
        lastActionId: null,
        actionHistory: [],
      });
    }
  }

  getPlayerId(): number | null {
    return this.playerId;
  }

  /** 创建玩家角色 */
  createPlayer(origin: PlayerOrigin, playerName: string): number {
    const id = this.em.create(EntityType.PLAYER);
    this.playerId = id;

    this.em.addComponent(id, 'Vital', { ...origin.vital });
    this.em.addComponent(id, 'Identity', {
      ...origin.identity,
      name: playerName,
      isPlayer: true,
    });
    this.em.addComponent(id, 'Wallet', { copper: origin.copper });
    this.em.addComponent(id, 'ActionPoints', { current: 4, max: 4 });
    this.em.addComponent(id, 'Position', { locationId: origin.startingLocation });
    this.em.addComponent(id, 'Memory', {
      recentEvents: [],
      impressions: {},
      narrativeTags: [],
      choiceHistory: [],
    });
    this.em.addComponent(id, 'ActionState', {
      lastActionId: null,
      actionHistory: [],
    });

    return id;
  }

  /** 获取玩家状态快照 */
  getPlayerSnapshot(): PlayerSnapshot | null {
    if (this.playerId === null) return null;
    const vital = this.em.getComponent(this.playerId, 'Vital');
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    const ap = this.em.getComponent(this.playerId, 'ActionPoints');
    const pos = this.em.getComponent(this.playerId, 'Position');
    if (!vital || !wallet || !ap || !pos) return null;

    return {
      hunger: vital.hunger,
      fatigue: vital.fatigue,
      health: vital.health,
      mood: vital.mood,
      copper: wallet.copper,
      actionPoints: ap.current,
      locationId: pos.locationId,
    };
  }

  /** 结束回合，世界推进一天 */
  advanceDay(): DayResult {
    // 1. 推进时间
    this.time.advanceDay();
    const season = this.time.getSeason();
    const weatherChanged = this.weather.update(season, this.rng);
    const weather = this.weather.get();

    // 2. NPC日程位置更新
    this.updateNpcPositions();

    // 3. NPC决策循环 — 50个NPC各自做一次决策
    const npcActions = this.runNpcDecisions(season, weather);

    // 4. 生存衰减（NPC和玩家都衰减）
    this.vital.update(this.em);

    // 5. 关系衰减
    this.relations.decayAll(this.em);

    // 6. 事件冷却更新
    this.updateEventCooldowns();

    // 7. 经济更新（季节变化时更新价格）
    this.economy.updatePrices(season as any, this.rng);

    // 7.5 传闻传播 + 延迟后果
    const rumorEvents = this.rumorSystem.update(this.em, this.time.getDay(), this.rng);

    // 8. 重置玩家AP
    if (this.playerId !== null) {
      const ap = this.em.getComponent(this.playerId, 'ActionPoints');
      if (ap) ap.current = ap.max;
    }

    // 8. 死亡检查
    const deathResults = this.death.check(this.em);
    let playerDied = false;
    let deathCause = '';
    for (const dr of deathResults) {
      if (dr.isDead && this.playerId !== null) {
        playerDied = true;
        deathCause = dr.cause;
      }
    }

    return {
      day: this.time.getDay(),
      season,
      weather,
      weatherChanged,
      playerState: this.getPlayerSnapshot()!,
      npcActions,
      majorEvents: rumorEvents,
      playerDied,
      deathCause,
    };
  }

  /** NPC决策循环 */
  private runNpcDecisions(season: string, weather: string): NpcActionResult[] {
    const results: NpcActionResult[] = [];
    const npcs = this.em.getEntitiesByType(EntityType.NPC);

    for (const npcId of npcs) {
      const vital = this.em.getComponent(npcId, 'Vital');
      const identity = this.em.getComponent(npcId, 'Identity');
      const wallet = this.em.getComponent(npcId, 'Wallet');
      const pos = this.em.getComponent(npcId, 'Position');
      const actionState = this.em.getComponent(npcId, 'ActionState');
      const memory = this.em.getComponent(npcId, 'Memory');
      if (!vital || !identity || !wallet || !pos || !actionState || !memory) continue;

      const ctx: DecisionContext = {
        name: identity.name,
        profession: identity.profession,
        personality: identity.personality,
        copper: wallet.copper,
        hunger: vital.hunger,
        fatigue: vital.fatigue,
        health: vital.health,
        mood: vital.mood,
        locationId: pos.locationId,
        weather,
        season,
        day: this.time.getDay(),
        recentActions: actionState.actionHistory,
        narrativeTags: memory.narrativeTags,
      };

      const decision = this.ai.decide(ctx);

      // 应用效果
      if (decision.effects.hunger) vital.hunger = clamp(vital.hunger + decision.effects.hunger, 0, 100);
      if (decision.effects.fatigue) vital.fatigue = clamp(vital.fatigue + decision.effects.fatigue, 0, 100);
      if (decision.effects.health) vital.health = clamp(vital.health + decision.effects.health, 0, 100);
      if (decision.effects.mood) vital.mood = clamp(vital.mood + decision.effects.mood, 0, 100);
      if (decision.effects.copper) wallet.copper = Math.max(0, wallet.copper + decision.effects.copper);
      if (decision.cost.fatigue) vital.fatigue = clamp(vital.fatigue - decision.cost.fatigue, 0, 100);
      if (decision.cost.copper) wallet.copper = Math.max(0, wallet.copper - decision.cost.copper);

      // 更新行动历史
      actionState.lastActionId = decision.actionId;
      actionState.actionHistory.push(decision.actionId);
      if (actionState.actionHistory.length > 5) {
        actionState.actionHistory.shift();
      }

      // 同地点社交：随机与一个同地点NPC产生好感变化
      if (decision.category === 'social') {
        const sameLocationNpcs = npcs.filter(
          (otherId) => otherId !== npcId &&
            this.em.getComponent(otherId, 'Position')?.locationId === pos.locationId,
        );
        if (sameLocationNpcs.length > 0) {
          const targetNpc = sameLocationNpcs[this.rng.nextInt(0, sameLocationNpcs.length)]!;
          this.relations.interact(this.em, npcId, targetNpc, 'chat');
          this.relations.interact(this.em, targetNpc, npcId, 'chat');
        }
      }

      results.push({
        npcId,
        npcName: identity.name,
        narrative: decision.narrative,
        locationId: pos.locationId,
      });
    }

    return results;
  }

  /** NPC按日程更新位置 */
  private updateNpcPositions(): void {
    const npcs = this.em.getEntitiesByType(EntityType.NPC);
    for (const npcId of npcs) {
      const schedule = this.em.getComponent(npcId, 'NpcSchedule');
      const pos = this.em.getComponent(npcId, 'Position');
      if (schedule && pos) {
        pos.locationId = schedule.schedule['day'] ?? schedule.schedule['default'] ?? 'street';
      }
    }
  }

  /** 玩家执行行动 */
  executePlayerAction(actionId: string): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };

    const action = this.actionRegistry.getById(actionId);
    if (!action) return { success: false, message: '未知行动' };

    const ap = this.em.getComponent(this.playerId, 'ActionPoints');
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    const vital = this.em.getComponent(this.playerId, 'Vital');
    const pos = this.em.getComponent(this.playerId, 'Position');
    const identity = this.em.getComponent(this.playerId, 'Identity');
    if (!ap || !wallet || !vital || !pos || !identity) {
      return { success: false, message: '状态异常' };
    }

    // 检查AP
    if (ap.current <= 0) return { success: false, message: '行动点不足' };

    // 检查铜钱
    if (action.cost.copper && wallet.copper < action.cost.copper) {
      return { success: false, message: '铜钱不足' };
    }

    // 检查条件
    const c = action.conditions;
    if (c.atLocation && !c.atLocation.includes(pos.locationId)) {
      const loc = getLocation(pos.locationId);
      return { success: false, message: `在${loc?.name ?? '这里'}无法做这件事` };
    }

    // 执行效果
    ap.current -= 1;
    if (action.cost.copper) wallet.copper -= action.cost.copper;
    if (action.cost.fatigue) vital.fatigue = clamp(vital.fatigue - action.cost.fatigue, 0, 100);

    if (action.effects.hunger) vital.hunger = clamp(vital.hunger + action.effects.hunger, 0, 100);
    if (action.effects.fatigue) vital.fatigue = clamp(vital.fatigue + action.effects.fatigue, 0, 100);
    if (action.effects.health) vital.health = clamp(vital.health + action.effects.health, 0, 100);
    if (action.effects.mood) vital.mood = clamp(vital.mood + action.effects.mood, 0, 100);
    if (action.effects.copper) wallet.copper += action.effects.copper;

    const narrative = action.narrative({
      name: identity.name,
      profession: identity.profession,
      locationId: pos.locationId,
      weather: this.weather.get(),
      season: this.time.getSeason(),
      day: this.time.getDay(),
    });

    return { success: true, message: narrative };
  }

  /** 获取玩家当前可执行的行动 */
  getAvailablePlayerActions(): GameAction[] {
    if (this.playerId === null) return [];
    const ap = this.em.getComponent(this.playerId, 'ActionPoints');
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    const vital = this.em.getComponent(this.playerId, 'Vital');
    const pos = this.em.getComponent(this.playerId, 'Position');
    const identity = this.em.getComponent(this.playerId, 'Identity');
    if (!ap || !wallet || !vital || !pos || !identity) return [];

    if (ap.current <= 0) return [];

    return this.actionRegistry.getAvailable({
      copper: wallet.copper,
      health: vital.health,
      hunger: vital.hunger,
      locationId: pos.locationId,
      profession: identity.profession,
      weather: this.weather.get(),
      season: this.time.getSeason(),
    });
  }

  /** 玩家移动到指定地点，消耗1AP */
  movePlayer(targetLocationId: string): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };
    const pos = this.em.getComponent(this.playerId, 'Position');
    const ap = this.em.getComponent(this.playerId, 'ActionPoints');
    if (!pos || !ap) return { success: false, message: '状态异常' };

    if (ap.current <= 0) return { success: false, message: '行动点不足' };

    const currentLoc = getLocation(pos.locationId);
    if (!currentLoc) return { success: false, message: '当前位置无效' };

    if (!currentLoc.connections.includes(targetLocationId)) {
      return { success: false, message: '无法到达该地点' };
    }

    const targetLoc = getLocation(targetLocationId);
    pos.locationId = targetLocationId;
    ap.current -= 1;

    return {
      success: true,
      message: `你从${currentLoc.name}来到了${targetLoc?.name ?? targetLocationId}。`,
    };
  }

  /** 获取当前地点的所有NPC */
  getNpcsAtLocation(locationId: string): Array<{
    id: number;
    name: string;
    profession: string;
  }> {
    const result: Array<{ id: number; name: string; profession: string }> = [];
    const npcs = this.em.getEntitiesByType(EntityType.NPC);
    for (const npcId of npcs) {
      const pos = this.em.getComponent(npcId, 'Position');
      const identity = this.em.getComponent(npcId, 'Identity');
      if (pos && identity && pos.locationId === locationId) {
        result.push({
          id: npcId,
          name: identity.name,
          profession: identity.profession,
        });
      }
    }
    return result;
  }

  /** 获取玩家与指定NPC的好感度 */
  getPlayerNpcRelation(npcId: number): number {
    if (this.playerId === null) return 0;
    return this.relations.getRelation(this.em, this.playerId, npcId);
  }

  /** 获取玩家可移动的相邻地点 */
  getReachableLocations(): Array<{ id: string; name: string }> {
    if (this.playerId === null) return [];
    const pos = this.em.getComponent(this.playerId, 'Position');
    if (!pos) return [];
    const loc = getLocation(pos.locationId);
    if (!loc) return [];
    return loc.connections
      .map((id) => getLocation(id))
      .filter((l): l is NonNullable<typeof l> => l !== undefined);
  }

  /** 获取玩家与NPC的关系列表 */
  getPlayerRelations(): Array<{
    targetId: number;
    targetName: string;
    profession: string;
    score: number;
    level: string;
  }> {
    if (this.playerId === null) return [];
    const rels = this.relations.getRelations(this.em, this.playerId);
    return rels.map((r) => {
      const identity = this.em.getComponent(r.targetId, 'Identity');
      return {
        ...r,
        profession: identity?.profession ?? '',
      };
    });
  }

  /** 检查并触发玩家分支事件 */
  checkPlayerEvent(): ActiveEvent | null {
    if (this.playerId === null || this.activeEvent) return null;

    const snapshot = this.getPlayerSnapshot();
    if (!snapshot) return null;

    const memory = this.em.getComponent(this.playerId, 'Memory');
    if (!memory) return null;

    const ctx: MatchContext = {
      playerId: this.playerId,
      em: this.em,
      locationId: snapshot.locationId,
      weather: this.weather.get(),
      season: this.time.getSeason(),
      day: this.time.getDay(),
      copper: snapshot.copper,
      health: snapshot.health,
      hunger: snapshot.hunger,
      mood: snapshot.mood,
      fatigue: snapshot.fatigue,
      narrativeTags: memory.narrativeTags,
      usedEventIds: this.usedEventIds,
      rng: this.rng,
    };

    const matched = matchEvent(ALL_EVENTS, ctx);
    if (!matched) return null;

    this.activeEvent = {
      eventId: matched.id,
      openingNarrative: matched.openingNarrative,
      choices: matched.choices,
    };

    return this.activeEvent;
  }

  /** 获取当前活跃事件 */
  getActiveEvent(): ActiveEvent | null {
    return this.activeEvent;
  }

  /** 检查选项是否可用 */
  isChoiceAvailable(choiceId: string): boolean {
    if (!this.activeEvent || !this.playerId) return false;
    const choice = this.activeEvent.choices.find((c) => c.id === choiceId);
    if (!choice) return false;

    const snapshot = this.getPlayerSnapshot();
    if (!snapshot) return false;

    return isChoiceAvailable(choice, {
      copper: snapshot.copper,
      health: snapshot.health,
      hunger: snapshot.hunger,
      mood: snapshot.mood,
      fatigue: snapshot.fatigue,
    });
  }

  /** 玩家选择事件选项 */
  resolveEventChoice(choiceId: string): EventConsequence | null {
    if (!this.activeEvent || !this.playerId) return null;

    const choice = this.activeEvent.choices.find((c) => c.id === choiceId);
    if (!choice) return null;

    const consequence = choice.consequence;

    // 应用效果到玩家
    const vital = this.em.getComponent(this.playerId, 'Vital');
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    const memory = this.em.getComponent(this.playerId, 'Memory');

    if (vital) {
      if (consequence.effects?.hunger) vital.hunger = clamp(vital.hunger + consequence.effects.hunger, 0, 100);
      if (consequence.effects?.fatigue) vital.fatigue = clamp(vital.fatigue + consequence.effects.fatigue, 0, 100);
      if (consequence.effects?.health) vital.health = clamp(vital.health + consequence.effects.health, 0, 100);
      if (consequence.effects?.mood) vital.mood = clamp(vital.mood + consequence.effects.mood, 0, 100);
    }
    if (wallet && consequence.effects?.copper) {
      wallet.copper = Math.max(0, wallet.copper + consequence.effects.copper);
    }

    // 叙事标签
    if (memory && consequence.narrativeTag) {
      if (!memory.narrativeTags.includes(consequence.narrativeTag)) {
        memory.narrativeTags.push(consequence.narrativeTag);
      }
    }

    // 记录选择历史
    if (memory) {
      memory.choiceHistory.push(choiceId);
    }

    // 角色变形
    if (consequence.transformations) {
      for (const t of consequence.transformations) {
        if (t.type === 'gain_tag' && memory) {
          const tag = String(t.value);
          if (!memory.narrativeTags.includes(tag)) {
            memory.narrativeTags.push(tag);
          }
        }
      }
    }

    // 对同地点NPC的好感变化
    if (consequence.relationChange && this.playerId) {
      const pos = this.em.getComponent(this.playerId, 'Position');
      if (pos) {
        const npcs = this.em.getEntitiesByType(EntityType.NPC);
        for (const npcId of npcs) {
          const npcPos = this.em.getComponent(npcId, 'Position');
          if (npcPos && npcPos.locationId === pos.locationId) {
            this.relations.changeRelation(this.em, this.playerId, npcId, consequence.relationChange);
            this.relations.changeRelation(this.em, npcId, this.playerId, consequence.relationChange);
          }
        }
      }
    }

    // 加入冷却
    const matched = ALL_EVENTS.find((e) => e.id === this.activeEvent!.eventId);
    if (matched) {
      this.usedEventIds.push(matched.id);
    }

    this.activeEvent = null;
    return consequence;
  }

  /** 更新事件冷却 */
  updateEventCooldowns(): void {
    // 简化：每天清理过期的冷却（超过cooldownDays的移除）
    const newUsed: string[] = [];
    for (const eventId of this.usedEventIds) {
      const event = ALL_EVENTS.find((e) => e.id === eventId);
      if (event) {
        // 简化冷却：30天后自动过期
        newUsed.push(eventId);
      }
    }
    // 最多保留50条冷却记录
    if (newUsed.length > 50) {
      this.usedEventIds = newUsed.slice(newUsed.length - 50);
    } else {
      this.usedEventIds = newUsed;
    }
  }

  /** 开始与NPC交互 */
  startNpcInteraction(npcId: number): InteractionState | null {
    if (this.playerId === null) return null;
    const pos = this.em.getComponent(this.playerId, 'Position');
    if (!pos) return null;
    return this.interaction.startInteraction(this.playerId, npcId, {
      locationId: pos.locationId,
      weather: this.weather.get(),
      season: this.time.getSeason(),
      day: this.time.getDay(),
    });
  }

  /** 解析交互选项并应用后果 */
  resolveInteractionOption(optionId: string): ConsequenceResult | null {
    if (this.playerId === null) return null;
    const pos = this.em.getComponent(this.playerId, 'Position');
    if (!pos) return null;

    const env = {
      locationId: pos.locationId,
      weather: this.weather.get(),
      season: this.time.getSeason(),
      day: this.time.getDay(),
    };

    // 获取选项信息（在resolve前）
    const state = this.interaction.getState();
    if (!state) return null;
    const option = state.options.find((o) => o.id === optionId);
    if (!option) return null;

    const actionType = option.templateId ?? option.sceneId ?? 'chat';

    const consequence = this.interaction.resolveOption(optionId, env);
    if (!consequence) return null;

    // 获取上下文用于后果应用
    const ctx = this.interaction.buildContext(this.playerId, state.npcId, env);
    if (!ctx) return null;

    const result = this.consequenceEngine.apply(consequence, ctx, this.em);

    // 生成NPC反应
    const reaction = generateNpcReaction(ctx, actionType, true);
    result.npcReaction = reaction;
    result.actionType = actionType;

    // NPC额外情绪变化
    if (reaction.extraMoodDelta) {
      const nVital = this.em.getComponent(ctx.npc.id, 'Vital');
      if (nVital) {
        nVital.mood = clamp(nVital.mood + reaction.extraMoodDelta, 0, 100);
      }
    }

    // 传闻传播：如果NPC获得了标签，创建传闻
    if (consequence.npcGainTag) {
      this.rumorSystem.addRumor({
        text: consequence.npcGainTag,
        sourceNpcId: ctx.npc.id,
        day: env.day,
        spreadCount: 0,
      });
    }

    // 连锁触发：如果后果指定了延迟效果
    if (consequence.relationChange && consequence.relationChange <= -10) {
      // 严重关系恶化，NPC可能3天后报复
      this.rumorSystem.addDelayed({
        triggerDay: env.day + 3,
        targetId: 'player',
        type: 'mood_change',
        params: { delta: -5 },
      });
    }

    // 告别选项直接结束交互
    if (consequence.nextAct === '__end__') {
      this.interaction.endInteraction();
      return result;
    }

    // NPC不愿继续对话
    if (!reaction.continueDialogue) {
      this.interaction.endInteraction();
      return result;
    }

    // 刷新选项：重建交互状态（保持同一个NPC）
    const newState = this.interaction.startInteraction(this.playerId, state.npcId, env);
    if (newState) {
      // 保留NPC反应作为新的"开场白"上下文
      newState.npcGreeting = reaction.text;
    }

    return result;
  }

  /** 导出存档 */
  exportSave() {
    const entities = this.em.getAllEntities().map((id) => this.em.exportEntity(id));
    return {
      version: 1,
      timestamp: Date.now(),
      seed: 0,
      time: { day: this.time.getDay() },
      weather: this.weather.get(),
      playerId: this.playerId,
      usedEventIds: this.usedEventIds,
      entities,
    };
  }

  /** 从存档数据恢复游戏状态 */
  importSave(data: import('../save/SaveManager').SaveData): void {
    // 恢复时间
    const targetDay = data.time.day;
    const currentDay = this.time.getDay();
    if (targetDay > currentDay) {
      for (let i = currentDay; i < targetDay; i++) {
        this.time.advanceDay();
      }
    }

    // 恢复天气
    // （简化处理：直接设置，实际应通过WeatherSystem内部状态恢复）
    this.weather.set(data.weather as any);

    // 恢复玩家ID
    this.playerId = data.playerId;

    // 恢复事件冷却记录
    this.usedEventIds = [...data.usedEventIds];

    // 恢复所有实体
    for (const entityData of data.entities) {
      this.em.importEntity({ id: entityData.id, type: entityData.type as any, components: entityData.components });
    }
  }
}
