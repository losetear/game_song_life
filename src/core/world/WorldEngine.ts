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
import { getItem, type ItemDef } from '../data/ItemDefs';
import { getShop, getShopsAtLocation, type ShopDef } from '../data/ShopDefs';

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
  // 新增字段
  dailyIncome: number;       // 当日收入
  dailyExpense: number;      // 当日支出
  transactions: string[];    // 交易记录（如 "购买羊肉汤 -35文"）
  nightEvent: string | null; // 夜间随机事件
  nextDayWeather: string;    // 次日天气预报
  healthWarnings: string[];  // 健康警告（如 "肚子咕咕叫"）
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
  // 收支追踪
  private dailyIncome = 0;
  private dailyExpense = 0;
  private transactions: string[] = [];  // 今日交易记录

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
    this.em.addComponent(id, 'Inventory', {
      items: [],
      capacity: 20,
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

    // 8.5 生成健康警告
    const healthWarnings = this.generateHealthWarnings();

    // 8.6 生成夜间随机事件
    const nightEvent = this.generateNightEvent();

    // 8.7 生成次日天气预报
    const nextDayWeather = this.generateNextDayWeather(season);

    // 9. 死亡检查
    const deathResults = this.death.check(this.em);
    let playerDied = false;
    let deathCause = '';
    for (const dr of deathResults) {
      if (dr.isDead && this.playerId !== null) {
        playerDied = true;
        deathCause = dr.cause;
      }
    }

    // 10. 汇总当日收支并重置
    const resultIncome = this.dailyIncome;
    const resultExpense = this.dailyExpense;
    const resultTransactions = [...this.transactions];
    this.dailyIncome = 0;
    this.dailyExpense = 0;
    this.transactions = [];

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
      dailyIncome: resultIncome,
      dailyExpense: resultExpense,
      transactions: resultTransactions,
      nightEvent,
      nextDayWeather,
      healthWarnings,
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

  // ==================== 背包系统 ====================

  /** 添加物品到背包 */
  addItem(itemId: string, count: number = 1): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };

    const itemDef = getItem(itemId);
    if (!itemDef) return { success: false, message: '未知物品' };

    const inventory = this.em.getComponent(this.playerId, 'Inventory');
    if (!inventory) return { success: false, message: '背包异常' };

    // 检查是否已存在该物品（可堆叠）
    if (itemDef.stackable) {
      const existingSlot = inventory.items.find(slot => slot.itemId === itemId);
      if (existingSlot) {
        existingSlot.count += count;
        return { success: true, message: `获得了 ${itemDef.name} x${count}` };
      }
    }

    // 检查背包容量
    if (inventory.items.length >= inventory.capacity) {
      return { success: false, message: '背包已满' };
    }

    // 添加新格子
    inventory.items.push({ itemId, count });
    return { success: true, message: `获得了 ${itemDef.name} x${count}` };
  }

  /** 从背包移除物品 */
  removeItem(itemId: string, count: number = 1): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };

    const inventory = this.em.getComponent(this.playerId, 'Inventory');
    if (!inventory) return { success: false, message: '背包异常' };

    const slotIndex = inventory.items.findIndex(slot => slot.itemId === itemId);
    if (slotIndex === -1) {
      return { success: false, message: '背包中没有该物品' };
    }

    const slot = inventory.items[slotIndex]!;
    if (slot.count < count) {
      return { success: false, message: '物品数量不足' };
    }

    // 减少数量或移除
    if (slot.count === count) {
      inventory.items.splice(slotIndex, 1);
    } else {
      slot.count -= count;
    }

    const itemDef = getItem(itemId);
    return { success: true, message: `消耗了 ${itemDef?.name ?? itemId} x${count}` };
  }

  /** 检查背包中是否有某物品（且数量足够） */
  hasItem(itemId: string, count: number = 1): boolean {
    if (this.playerId === null) return false;

    const inventory = this.em.getComponent(this.playerId, 'Inventory');
    if (!inventory) return false;

    const slot = inventory.items.find(s => s.itemId === itemId);
    return slot !== undefined && slot.count >= count;
  }

  /** 使用物品 */
  useItem(itemId: string): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };

    // 检查是否有该物品
    if (!this.hasItem(itemId)) {
      return { success: false, message: '背包中没有该物品' };
    }

    const itemDef = getItem(itemId);
    if (!itemDef) return { success: false, message: '未知物品' };

    if (!itemDef.usable) {
      return { success: false, message: '该物品无法直接使用' };
    }

    // 消耗物品
    const removeResult = this.removeItem(itemId, 1);
    if (!removeResult.success) {
      return removeResult;
    }

    // 应用效果到玩家
    const vital = this.em.getComponent(this.playerId, 'Vital');
    const identity = this.em.getComponent(this.playerId, 'Identity');
    if (!vital || !identity) return { success: false, message: '状态异常' };

    if (itemDef.effects.hunger) vital.hunger = clamp(vital.hunger + itemDef.effects.hunger, 0, 100);
    if (itemDef.effects.fatigue) vital.fatigue = clamp(vital.fatigue + itemDef.effects.fatigue, 0, 100);
    if (itemDef.effects.health) vital.health = clamp(vital.health + itemDef.effects.health, 0, 100);
    if (itemDef.effects.mood) vital.mood = clamp(vital.mood + itemDef.effects.mood, 0, 100);

    // 生成叙事文本
    const narrative = itemDef.useNarrative
      ? itemDef.useNarrative.replace(/{name}/g, identity.name)
      : `使用了${itemDef.name}`;

    return { success: true, message: narrative };
  }

  /** 获取背包内容 */
  getInventory(): Array<{ itemId: string; itemDef: ItemDef; count: number }> {
    if (this.playerId === null) return [];

    const inventory = this.em.getComponent(this.playerId, 'Inventory');
    if (!inventory) return [];

    return inventory.items.map(slot => {
      const itemDef = getItem(slot.itemId);
      return {
        itemId: slot.itemId,
        itemDef: itemDef!,
        count: slot.count,
      };
    }).filter(item => item.itemDef !== undefined);
  }

  // ==================== 店铺交易系统 ====================

  /** 获取店铺信息 */
  getShopInfo(shopId: string): (ShopDef & { sellItemsWithPrice: Array<{ itemId: string; itemDef: ItemDef; price: number }> }) | null {
    if (this.playerId === null) return null;

    const shopDef = getShop(shopId);
    if (!shopDef) return null;

    // 计算季节价格系数
    const season = this.time.getSeason();
    let seasonMultiplier = 1.0;
    if (season === '冬') {
      seasonMultiplier = 1.2; // 冬天物价上涨
    } else if (season === '秋') {
      seasonMultiplier = 0.9; // 秋天收获，物价下跌
    }

    // 计算每个物品的实际售价
    const sellItemsWithPrice = shopDef.sellItems.map(itemId => {
      const itemDef = getItem(itemId);
      if (!itemDef) return null;
      const price = Math.floor(itemDef.basePrice * shopDef.sellPriceMultiplier * seasonMultiplier);
      return {
        itemId,
        itemDef,
        price,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      ...shopDef,
      sellItemsWithPrice,
    };
  }

  /** 获取当前地点的店铺 */
  getShopsAtCurrentLocation(): ShopDef[] {
    if (this.playerId === null) return [];

    const pos = this.em.getComponent(this.playerId, 'Position');
    if (!pos) return [];

    return getShopsAtLocation(pos.locationId);
  }

  /** 购买物品 */
  buyItem(shopId: string, itemId: string): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };

    // 获取店铺信息
    const shopInfo = this.getShopInfo(shopId);
    if (!shopInfo) return { success: false, message: '店铺不存在' };

    // 检查玩家是否在店铺所在地点
    const pos = this.em.getComponent(this.playerId, 'Position');
    if (!pos || pos.locationId !== shopInfo.locationId) {
      return { success: false, message: '你不在该店铺所在地点' };
    }

    // 检查物品是否在该店铺出售
    const sellItem = shopInfo.sellItemsWithPrice.find(item => item.itemId === itemId);
    if (!sellItem) {
      return { success: false, message: '该店铺不出售此物品' };
    }

    // 获取玩家铜钱
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    if (!wallet) return { success: false, message: '状态异常' };

    // 检查铜钱是否足够
    if (wallet.copper < sellItem.price) {
      return { success: false, message: `铜钱不足，需要${sellItem.price}文` };
    }

    // 检查背包容量
    const inventory = this.em.getComponent(this.playerId, 'Inventory');
    if (!inventory) return { success: false, message: '背包异常' };

    const itemDef = sellItem.itemDef;
    const existingSlot = inventory.items.find(slot => slot.itemId === itemId);
    if (!existingSlot && inventory.items.length >= inventory.capacity) {
      return { success: false, message: '背包已满' };
    }

    // 扣除铜钱
    wallet.copper -= sellItem.price;

    // 记录支出和交易
    this.dailyExpense += sellItem.price;
    this.transactions.push(`购买${itemDef.name} -${sellItem.price}文`);

    // 添加到背包
    const addResult = this.addItem(itemId, 1);
    if (!addResult.success) {
      // 回退铜钱
      wallet.copper += sellItem.price;
      // 回退支出记录
      this.dailyExpense -= sellItem.price;
      this.transactions.pop();
      return addResult;
    }

    // 生成叙事文本
    const narrative = `你在${shopInfo.name}花了${sellItem.price}文买了${itemDef.name}，${this.generatePurchaseNarrative(itemDef)}`;

    return { success: true, message: narrative };
  }

  /** 出售物品 */
  sellItem(itemId: string, shopId?: string): { success: boolean; message: string } {
    if (this.playerId === null) return { success: false, message: '无玩家角色' };

    // 检查背包中是否有该物品
    if (!this.hasItem(itemId)) {
      return { success: false, message: '背包中没有该物品' };
    }

    const itemDef = getItem(itemId);
    if (!itemDef) return { success: false, message: '未知物品' };

    // 如果指定了店铺，检查是否在店铺地点
    if (shopId) {
      const shopDef = getShop(shopId);
      if (!shopDef) return { success: false, message: '店铺不存在' };

      const pos = this.em.getComponent(this.playerId, 'Position');
      if (!pos || pos.locationId !== shopDef.locationId) {
        return { success: false, message: '你不在该店铺所在地点' };
      }

      // 检查店铺是否收购该类别
      if (!shopDef.buyCategories.includes(itemDef.category)) {
        return { success: false, message: '该店铺不收购此类物品' };
      }
    }

    // 获取当前地点的店铺（如果没有指定店铺）
    let targetShop: ShopDef | undefined;
    if (shopId) {
      targetShop = getShop(shopId);
    } else {
      const shops = this.getShopsAtCurrentLocation();
      targetShop = shops.find(shop => shop.buyCategories.includes(itemDef.category));
    }

    if (!targetShop) {
      return { success: false, message: '当前地点没有收购此物品的店铺' };
    }

    // 计算收购价
    const buyPrice = Math.floor(itemDef.basePrice * targetShop.buyPriceMultiplier);

    // 从背包移除
    const removeResult = this.removeItem(itemId, 1);
    if (!removeResult.success) {
      return removeResult;
    }

    // 增加铜钱
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    if (!wallet) return { success: false, message: '状态异常' };

    wallet.copper += buyPrice;

    // 记录收入和交易
    this.dailyIncome += buyPrice;
    this.transactions.push(`出售${itemDef.name} +${buyPrice}文`);

    // 生成叙事文本
    const narrative = `你把${itemDef.name}卖给了${targetShop.name}，获得了${buyPrice}文铜钱。`;

    return { success: true, message: narrative };
  }

  /** 生成购买物品的叙事文本 */
  private generatePurchaseNarrative(itemDef: ItemDef): string {
    const narratives: string[] = [
      `东西还算不错。`,
      `掌柜的笑着把你送出门。`,
      `希望这笔买卖划算。`,
      `在手里掂量了几下，还算满意。`,
      `街上人来人往，你小心收好。`,
    ];

    // 根据物品类型添加特定描述
    if (itemDef.category === 'food' || itemDef.category === 'drink') {
      narratives.push(`看着就让人食指大动。`);
      narratives.push(`香味扑鼻而来。`);
    } else if (itemDef.category === 'medicine') {
      narratives.push(`希望能治好身上的不适。`);
      narratives.push(`药香隐隐约约。`);
    } else if (itemDef.category === 'weapon') {
      narratives.push(`沉甸甸的，让人有安全感。`);
      narratives.push(`寒光闪闪，似是把利器。`);
    } else if (itemDef.category === 'luxury') {
      narratives.push(`这可是稀罕货。`);
      narratives.push(`小心翼翼地收起来。`);
    }

    return narratives[Math.floor(this.rng.next() * narratives.length)]!;
  }

  // ==================== 夜间随机事件系统 ====================

  /** 生成夜间随机事件（30%概率触发） */
  private generateNightEvent(): string | null {
    if (this.rng.next() > 0.3) return null; // 30%概率触发

    const roll = this.rng.next();

    // 正面事件（30%）
    if (roll < 0.3) {
      const positiveEvents = [
        { text: '你做了一个美梦，梦中桃花烂漫，醒来时心情格外舒畅。', effects: { mood: 5 } },
        { text: '今夜月色如水，你睡得格外香甜，醒来后精神饱满。', effects: { fatigue: 10 } },
        { text: '半夜邻居来敲门，送来一碗热腾腾的羊肉汤。你喝完后，胃里暖暖的。', effects: { hunger: 10, mood: 3 } },
        { text: '梦中回到了故乡，父母的笑脸历历在目。醒来时，眼角还挂着泪珠。', effects: { mood: 8 } },
        { text: '半夜听到更夫的吆喝声："天干物燥，小心火烛！"这熟悉的声音让你感到安心。', effects: { mood: 3 } },
      ];
      const event = positiveEvents[Math.floor(this.rng.next() * positiveEvents.length)]!;

      // 应用效果（如果需要）
      if (this.playerId !== null) {
        const vital = this.em.getComponent(this.playerId, 'Vital');
        if (vital) {
          if (event.effects.mood) vital.mood = Math.min(100, vital.mood + event.effects.mood);
          if (event.effects.fatigue) vital.fatigue = Math.min(100, vital.fatigue + event.effects.fatigue);
          if (event.effects.hunger) vital.hunger = Math.min(100, vital.hunger + event.effects.hunger);
        }
      }

      return event.text;
    }

    // 负面事件（30%）
    if (roll < 0.6) {
      const negativeEvents = [
        { text: '半夜被蚊子的嗡嗡声吵醒，赶走一波又来一波。你一晚上没睡好。', effects: { fatigue: -5, mood: -3 } },
        { text: '你做了一个噩梦，梦中被怪物追赶，醒来时一身冷汗。', effects: { mood: -5 } },
        { text: '肚子饿得咕咕叫，你翻来覆去睡不着，只能起来喝几口冷水充饥。', effects: { hunger: -10 } },
        { text: '夜里受了凉，醒来时头昏脑涨，嗓子有些发干。', effects: { health: -5 } },
        { text: '半夜被老鼠吵醒，那家伙在房梁上跑来跑去，发出吱吱的叫声。', effects: { mood: -3 } },
      ];
      const event = negativeEvents[Math.floor(this.rng.next() * negativeEvents.length)]!;

      // 应用效果
      if (this.playerId !== null) {
        const vital = this.em.getComponent(this.playerId, 'Vital');
        if (vital) {
          if (event.effects.mood) vital.mood = Math.max(0, vital.mood + event.effects.mood);
          if (event.effects.fatigue) vital.fatigue = Math.max(0, vital.fatigue + event.effects.fatigue);
          if (event.effects.hunger) vital.hunger = Math.max(0, vital.hunger + event.effects.hunger);
          if (event.effects.health) vital.health = Math.max(0, vital.health + event.effects.health);
        }
      }

      return event.text;
    }

    // 中性事件（40%）
    const neutralEvents = [
      '半夜听到远处传来犬吠声，好像是哪家的狗在叫个不停。',
      '你从梦中醒来，听到外面传来淅淅沥沥的雨声。你翻个身继续睡。',
      '你做了一个梦，梦见白天发生的琐事，醒来时已经记不清细节了。',
      '更夫路过窗下："天干物燥，小心火烛！"你知道，又平安度过了一天。',
      '半夜风吹窗户，发出"哐当"一声。你警醒地坐起来，发现只是风。',
    ];
    return neutralEvents[Math.floor(this.rng.next() * neutralEvents.length)]!;
  }

  // ==================== 健康警告系统 ====================

  /** 根据玩家状态生成健康警告 */
  private generateHealthWarnings(): string[] {
    const warnings: string[] = [];

    if (this.playerId === null) return warnings;

    const vital = this.em.getComponent(this.playerId, 'Vital');
    const wallet = this.em.getComponent(this.playerId, 'Wallet');
    if (!vital || !wallet) return warnings;

    // 饥饿警告
    if (vital.hunger < 15) {
      warnings.push('饿得头昏眼花，再不吃东西要出人命了！');
    } else if (vital.hunger < 30) {
      warnings.push('肚子咕咕叫，该找点吃的了。');
    }

    // 疲劳警告
    if (vital.fatigue < 15) {
      warnings.push('累得几乎站不住了，急需休息。');
    } else if (vital.fatigue < 30) {
      warnings.push('疲惫不堪，需要休息。');
    }

    // 健康警告
    if (vital.health < 15) {
      warnings.push('病得很重，随时可能倒下！');
    } else if (vital.health < 30) {
      warnings.push('身体不适，该去看看大夫。');
    }

    // 心情警告
    if (vital.mood < 20) {
      warnings.push('郁郁寡欢，做什么都提不起劲。');
    }

    // 铜钱警告
    if (wallet.copper < 10) {
      warnings.push('囊中羞涩，该想办法赚点钱了。');
    }

    return warnings;
  }

  // ==================== 次日天气预报系统 ====================

  /** 生成次日天气预报 */
  private generateNextDayWeather(currentSeason: string): string {
    const roll = this.rng.next();

    // 基础天气概率
    let sunnyChance = 0.6;
    let rainyChance = 0.25;
    let snowyChance = 0.15;

    // 根据季节调整概率
    if (currentSeason === '夏') {
      sunnyChance = 0.7;
      rainyChance = 0.3;
      snowyChance = 0;
    } else if (currentSeason === '冬') {
      sunnyChance = 0.4;
      rainyChance = 0.3;
      snowyChance = 0.3;
    } else if (currentSeason === '春') {
      sunnyChance = 0.5;
      rainyChance = 0.4;
      snowyChance = 0.1;
    }

    if (roll < sunnyChance) {
      return '明日晴朗';
    } else if (roll < sunnyChance + rainyChance) {
      return '明日有雨';
    } else if (roll < sunnyChance + rainyChance + snowyChance) {
      return '明日有雪';
    } else {
      return '明日晴朗';
    }
  }
}
