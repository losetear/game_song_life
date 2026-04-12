// === 演出库管理器 ===
//
// 门面模式：为每层提供一个入口方法
// 管理 cooldown、场景索引、叙事格式化
// 漫野奇谭化：支持多属性判定 + 多层级结果 + 玩家场景

import {
  L0Scene, L0ActorContext, NearbyNpcInfo, SceneDecisionResult,
  L1Scene, L1MatchContext, L1MatchResult,
  L2Scene, L2RegionStats, L2MatchResult,
  GoalCategory,
  PlayerScene, PlayerSceneState, PlayerSceneMatchResult, PlayerSceneChoice,
} from './types';
import { matchL0Scene, matchL1Scene, matchL2Scenes } from './matcher';
import { resolveScene, resolveSceneV2, selectTieredOutcome, ResolveContext } from './resolver';
import { formatNarrative } from './narrativeFormatter';

// 按类别索引的场景缓存
let l0ByCategory: Map<GoalCategory, L0Scene[]> | null = null;
let l1ByProfession: Map<string, L1Scene[]> | null = null;

function indexL0(scenes: L0Scene[]): Map<GoalCategory, L0Scene[]> {
  const map = new Map<GoalCategory, L0Scene[]>();
  for (const s of scenes) {
    if (!map.has(s.goalCategory)) map.set(s.goalCategory, []);
    map.get(s.goalCategory)!.push(s);
  }
  return map;
}

function indexL1(scenes: L1Scene[]): Map<string, L1Scene[]> {
  const map = new Map<string, L1Scene[]>();
  for (const s of scenes) {
    for (const p of s.conditions.profession) {
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(s);
    }
  }
  return map;
}

export class SceneLibraryManager {
  private l0Scenes: L0Scene[] = [];
  private l1Scenes: L1Scene[] = [];
  private l2Scenes: L2Scene[] = [];
  private playerScenes: PlayerScene[] = [];

  // L0 cooldown: per NPC
  private l0Recent: Map<number, string[]> = new Map();
  // L1 cooldown: global
  private l1Recent: string[] = [];
  // L2 cooldown: per region
  private l2Recent: Map<string, string[]> = new Map();

  // L1 每场景每tick触发计数
  private l1TriggerCount: Map<string, number> = new Map();
  // L1 Spotlight cooldown: per L1 entity ID
  private l1SpotlightRecent: Map<number, string[]> = new Map();

  // 玩家场景运行时状态
  private activePlayerScene: PlayerSceneState | null = null;
  private playerSceneCooldown: Map<string, number> = new Map();

  registerL0(scenes: L0Scene[]): void {
    this.l0Scenes = scenes;
    l0ByCategory = indexL0(scenes);
  }

  registerL1(scenes: L1Scene[]): void {
    this.l1Scenes = scenes;
    l1ByProfession = indexL1(scenes);
  }

  registerL2(scenes: L2Scene[]): void {
    this.l2Scenes = scenes;
  }

  /** 注册玩家多步骤场景 */
  registerPlayerScenes(scenes: PlayerScene[]): void {
    this.playerScenes = scenes;
  }

  /** 每tick开始时重置L1计数 */
  resetTickCounters(): void {
    this.l1TriggerCount.clear();
  }

  // ════════════════════════════════════════
  // L0 精细匹配 + 解析（漫野奇谭化）
  // ════════════════════════════════════════

  matchL0(
    goalCategories: GoalCategory[],
    actorContext: L0ActorContext,
    nearbyNpcs: NearbyNpcInfo[],
    actorStats: Record<string, number>,
    targetStatsLookup: (targetId: number) => Record<string, number>,
    resolveContext?: ResolveContext,
  ): SceneDecisionResult | null {
    // 获取该NPC的cooldown列表
    const npcRecent = this.l0Recent.get(actorContext.tick) || [];

    // 从索引中收集候选场景
    let candidateScenes: L0Scene[] = [];
    if (l0ByCategory) {
      for (const cat of goalCategories) {
        const catScenes = l0ByCategory.get(cat);
        if (catScenes) candidateScenes = candidateScenes.concat(catScenes);
      }
    } else {
      candidateScenes = this.l0Scenes.filter(s => goalCategories.includes(s.goalCategory));
    }

    const match = matchL0Scene(goalCategories, actorContext, nearbyNpcs, npcRecent, candidateScenes);
    if (!match) return null;

    const { scene, target } = match;
    const targetStats = target ? targetStatsLookup(target.id) : {};

    // === 新版多属性判定 + 多层级结果 ===
    if (scene.resolution && scene.tieredOutcomes) {
      const resolveResult = resolveSceneV2(
        scene.resolution,
        actorStats,
        targetStats,
        resolveContext || {},
      );

      const tieredResult = selectTieredOutcome(scene.tieredOutcomes, resolveResult.score);
      if (!tieredResult) return null;

      const outcome = tieredResult.outcome;
      const vars: Record<string, string> = {
        npcName: actorContext.npcName,
        targetName: target?.name || '某人',
        location: actorContext.currentGrid,
      };
      const narrative = formatNarrative(outcome.narrative, vars);

      this.updateL0Cooldown(actorContext.tick, scene.id);

      return {
        sceneId: scene.id,
        sceneName: scene.name,
        goalCategory: scene.goalCategory,
        narrative,
        success: resolveResult.score >= 50,
        effects: outcome.effects,
        targetEffects: outcome.targetEffects,
        relationChange: outcome.relationChange,
        targetName: target?.name,
        factionEffects: outcome.factionEffects,
        memoryTag: outcome.memoryTag,
        stressChange: outcome.stressChange,
        traitReveal: outcome.traitReveal,
        triggerChainReaction: outcome.triggerChainReaction,
        tier: tieredResult.tier,
        score: resolveResult.score,
      };
    }

    // === 旧版兼容判定 ===
    const success = resolveScene(
      scene.outcomeType,
      scene.contestedStat,
      scene.successChance,
      actorStats,
      targetStats,
    );

    const outcome = success ? scene.success : scene.failure;
    if (!outcome) return null;

    const vars: Record<string, string> = {
      npcName: actorContext.npcName,
      targetName: target?.name || '某人',
      location: actorContext.currentGrid,
    };
    const narrative = formatNarrative(outcome.narrative, vars);

    this.updateL0Cooldown(actorContext.tick, scene.id);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      goalCategory: scene.goalCategory,
      narrative,
      success,
      effects: outcome.effects,
      targetEffects: outcome.targetEffects,
      relationChange: outcome.relationChange,
      targetName: target?.name,
      factionEffects: outcome.factionEffects,
      memoryTag: outcome.memoryTag,
      stressChange: outcome.stressChange,
      traitReveal: outcome.traitReveal,
      triggerChainReaction: outcome.triggerChainReaction,
    };
  }

  private updateL0Cooldown(tick: number, sceneId: string): void {
    const recent = this.l0Recent.get(tick) || [];
    recent.push(sceneId);
    if (recent.length > 20) recent.shift();
    this.l0Recent.set(tick, recent);
  }

  // ════════════════════════════════════════
  // L1 批量匹配
  // ════════════════════════════════════════

  matchL1(context: L1MatchContext): L1MatchResult | null {
    // 从索引中获取该职业的场景
    const professionScenes = l1ByProfession?.get(context.profession) || [];

    // 检查 maxPerTick
    const filtered: L1Scene[] = [];
    for (const scene of professionScenes) {
      const count = this.l1TriggerCount.get(scene.id) || 0;
      if (count >= scene.maxPerTick) continue;
      filtered.push(scene);
    }

    const result = matchL1Scene(context, filtered, this.l1Recent);
    if (!result) return null;

    // 更新计数和冷却
    this.l1TriggerCount.set(result.sceneId, (this.l1TriggerCount.get(result.sceneId) || 0) + 1);
    this.l1Recent.push(result.sceneId);
    if (this.l1Recent.length > 50) this.l1Recent.shift();

    return result;
  }

  // ════════════════════════════════════════
  // L1 Spotlight: L1 NPC 个体匹配 L0 场景
  // ════════════════════════════════════════

  matchL0ForL1(
    entityId: number,
    goalCategories: GoalCategory[],
    actorContext: L0ActorContext,
    nearbyNpcs: NearbyNpcInfo[],
    actorStats: Record<string, number>,
    targetStatsLookup: (targetId: number) => Record<string, number>,
  ): SceneDecisionResult | null {
    // 使用 L1 spotlight 的独立冷却
    const npcRecent = this.l1SpotlightRecent.get(entityId) || [];

    // 从索引中收集候选场景
    let candidateScenes: L0Scene[] = [];
    if (l0ByCategory) {
      for (const cat of goalCategories) {
        const catScenes = l0ByCategory.get(cat);
        if (catScenes) candidateScenes = candidateScenes.concat(catScenes);
      }
    } else {
      candidateScenes = this.l0Scenes.filter(s => goalCategories.includes(s.goalCategory));
    }

    const match = matchL0Scene(goalCategories, actorContext, nearbyNpcs, npcRecent, candidateScenes);
    if (!match) return null;

    const { scene, target } = match;
    const targetStats = target ? targetStatsLookup(target.id) : {};

    // 使用新版多属性判定（如果场景支持）
    if (scene.resolution && scene.tieredOutcomes) {
      const resolveResult = resolveSceneV2(scene.resolution, actorStats, targetStats, {});
      const tieredResult = selectTieredOutcome(scene.tieredOutcomes, resolveResult.score);
      if (!tieredResult) return null;

      const outcome = tieredResult.outcome;
      const narrative = formatNarrative(outcome.narrative, {
        npcName: actorContext.npcName,
        targetName: target?.name || '某人',
        location: actorContext.currentGrid,
      });

      // 更新 L1 spotlight 冷却
      this.updateL1SpotlightCooldown(entityId, scene.id);

      return {
        sceneId: scene.id,
        sceneName: scene.name,
        goalCategory: scene.goalCategory,
        narrative,
        success: resolveResult.score >= 50,
        effects: outcome.effects,
        targetEffects: outcome.targetEffects,
        relationChange: outcome.relationChange,
        targetName: target?.name,
        factionEffects: outcome.factionEffects,
        memoryTag: outcome.memoryTag,
        stressChange: outcome.stressChange,
        traitReveal: outcome.traitReveal,
        triggerChainReaction: outcome.triggerChainReaction,
        tier: tieredResult.tier,
        score: resolveResult.score,
      };
    }

    // 旧版兼容
    const success = resolveScene(scene.outcomeType, scene.contestedStat, scene.successChance, actorStats, targetStats);
    const outcome = success ? scene.success : scene.failure;
    if (!outcome) return null;

    const narrative = formatNarrative(outcome.narrative, {
      npcName: actorContext.npcName,
      targetName: target?.name || '某人',
      location: actorContext.currentGrid,
    });

    this.updateL1SpotlightCooldown(entityId, scene.id);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      goalCategory: scene.goalCategory,
      narrative,
      success,
      effects: outcome.effects,
      targetEffects: outcome.targetEffects,
      relationChange: outcome.relationChange,
      targetName: target?.name,
      factionEffects: outcome.factionEffects,
      memoryTag: outcome.memoryTag,
      stressChange: outcome.stressChange,
      traitReveal: outcome.traitReveal,
      triggerChainReaction: outcome.triggerChainReaction,
    };
  }

  private updateL1SpotlightCooldown(entityId: number, sceneId: string): void {
    const recent = this.l1SpotlightRecent.get(entityId) || [];
    recent.push(sceneId);
    if (recent.length > 10) recent.shift();
    this.l1SpotlightRecent.set(entityId, recent);
  }

  // ════════════════════════════════════════
  // L2 区域匹配
  // ════════════════════════════════════════

  matchL2All(
    regions: L2RegionStats[],
    worldContext: { weather: string; season: string; tick: number },
  ): L2MatchResult[] {
    const results = matchL2Scenes(regions, worldContext, this.l2Scenes, this.l2Recent);

    // 更新冷却
    for (const r of results) {
      const regionRecent = this.l2Recent.get(r.regionId) || [];
      regionRecent.push(r.scene.id);
      if (regionRecent.length > 10) regionRecent.shift();
      this.l2Recent.set(r.regionId, regionRecent);
    }

    return results;
  }

  // ════════════════════════════════════════
  // 玩家多步骤场景（漫野奇谭化）
  // ════════════════════════════════════════

  /** 检查是否有活跃的玩家场景 */
  hasActivePlayerScene(): boolean {
    return this.activePlayerScene !== null;
  }

  /** 获取当前活跃场景状态 */
  getActivePlayerScene(): PlayerSceneState | null {
    return this.activePlayerScene;
  }

  /** 尝试匹配并启动玩家场景 */
  matchPlayerScene(
    actorContext: L0ActorContext,
    nearbyNpcs: NearbyNpcInfo[],
    playerStats: Record<string, number>,
    tick: number,
  ): PlayerSceneMatchResult | null {
    // 如果已有活跃场景，不能启动新场景
    if (this.activePlayerScene) return null;

    for (const scene of this.playerScenes) {
      // 冷却检查
      const lastTick = this.playerSceneCooldown.get(scene.id) || 0;
      if (tick - lastTick < scene.cooldownTicks) continue;

      // 条件匹配（复用 L0 匹配逻辑）
      const target = matchL0Scene(
        [scene.triggerCondition as any],
        actorContext,
        nearbyNpcs,
        [],
        [{
          id: scene.id,
          name: scene.name,
          goalCategory: 'social' as GoalCategory,
          outcomeType: 'certain',
          conditions: scene.triggerCondition,
          success: { narrative: '', effects: {} },
          weight: scene.weight,
          cooldownTicks: scene.cooldownTicks,
        }],
      );

      if (!target) continue;

      // 参与者匹配
      const participantIds = this.matchParticipants(scene, nearbyNpcs);
      if (participantIds.length === 0) continue;

      // 启动场景
      const state: PlayerSceneState = {
        sceneId: scene.id,
        currentPhase: scene.entryPhase,
        participantNpcIds: participantIds,
        history: [],
        startTick: tick,
      };

      this.activePlayerScene = state;
      const entryPhase = scene.phases[scene.entryPhase];

      // 过滤满足条件的选项
      const availableChoices = this.filterAvailableChoices(entryPhase.choices, playerStats);

      const openingNarrative = formatNarrative(scene.openingNarrative, {
        npcName: actorContext.npcName,
        targetName: nearbyNpcs.find(n => participantIds.includes(n.id))?.name || '某人',
        location: actorContext.currentGrid,
      });

      return {
        scene,
        state,
        openingNarrative: openingNarrative + '\n\n' + entryPhase.narrative,
        choices: availableChoices,
      };
    }

    return null;
  }

  /** 处理玩家选择 */
  resolvePlayerChoice(
    choiceId: string,
    playerStats: Record<string, number>,
    resolveContext?: ResolveContext,
  ): {
    narrative: string;
    effects?: Record<string, number>;
    choices?: PlayerSceneChoice[];
    finished: boolean;
  } | null {
    if (!this.activePlayerScene) return null;

    const scene = this.playerScenes.find(s => s.id === this.activePlayerScene!.sceneId);
    if (!scene) return null;

    const phase = scene.phases[this.activePlayerScene.currentPhase];
    if (!phase) return null;

    const choice = phase.choices.find(c => c.id === choiceId);
    if (!choice) return null;

    // 记录选择
    this.activePlayerScene.history.push({
      phaseId: this.activePlayerScene.currentPhase,
      choiceId,
      tick: this.activePlayerScene.startTick + this.activePlayerScene.history.length,
    });

    const consequence = choice.consequence;

    // 如果有判定，执行判定
    if (consequence.resolution && consequence.tieredResults) {
      const result = resolveSceneV2(
        consequence.resolution,
        playerStats,
        {},
        resolveContext || {},
      );

      // 找到匹配的结果等级
      const tierKey = result.tier || 'success';
      const tierResult = consequence.tieredResults[tierKey];
      if (tierResult) {
        return {
          narrative: tierResult.narrative,
          effects: { ...consequence.immediateEffects, ...tierResult.effects },
          finished: consequence.nextPhase === null,
          choices: undefined,
        };
      }
    }

    // 应用直接效果
    const effects = consequence.immediateEffects;

    // 场景结束
    if (consequence.nextPhase === null) {
      const endTick = this.activePlayerScene.startTick;
      this.activePlayerScene = null;
      this.playerSceneCooldown.set(scene.id, endTick);

      return {
        narrative: consequence.endingNarrative || choice.text,
        effects,
        finished: true,
      };
    }

    // 进入下一阶段
    this.activePlayerScene.currentPhase = consequence.nextPhase;
    const nextPhase = scene.phases[consequence.nextPhase];
    if (!nextPhase) {
      this.activePlayerScene = null;
      return { narrative: consequence.endingNarrative || '场景异常结束。', effects, finished: true };
    }

    const availableChoices = this.filterAvailableChoices(nextPhase.choices, playerStats);

    return {
      narrative: nextPhase.narrative,
      effects,
      choices: availableChoices,
      finished: false,
    };
  }

  /** 取消活跃的玩家场景 */
  cancelPlayerScene(): void {
    if (this.activePlayerScene) {
      this.playerSceneCooldown.set(this.activePlayerScene.sceneId, this.activePlayerScene.startTick);
      this.activePlayerScene = null;
    }
  }

  /** 匹配场景参与者 */
  private matchParticipants(scene: PlayerScene, nearbyNpcs: NearbyNpcInfo[]): number[] {
    const matched: number[] = [];

    for (const participant of scene.participants) {
      let count = 0;
      for (const npc of nearbyNpcs) {
        if (count >= (participant.maxCount || participant.minCount)) break;
        if (matched.includes(npc.id)) continue;

        // 性格要求
        if (participant.requiredTraits && participant.requiredTraits.length > 0) {
          if (!participant.requiredTraits.some(t => npc.personality.includes(t))) continue;
        }
        // 禁止性格
        if (participant.forbiddenTraits && participant.forbiddenTraits.length > 0) {
          if (participant.forbiddenTraits.some(t => npc.personality.includes(t))) continue;
        }
        // 职业要求
        if (participant.requiredProfession && participant.requiredProfession.length > 0) {
          if (!participant.requiredProfession.includes(npc.profession)) continue;
        }
        // 关系分数
        if (participant.minRelationScore !== undefined && npc.relationScore < participant.minRelationScore) continue;
        if (participant.maxRelationScore !== undefined && npc.relationScore > participant.maxRelationScore) continue;

        matched.push(npc.id);
        count++;
      }

      if (count < participant.minCount) return []; // 参与者不足，场景无法触发
    }

    return matched;
  }

  /** 过滤满足条件的选项 */
  private filterAvailableChoices(
    choices: PlayerSceneChoice[],
    playerStats: Record<string, number>,
  ): PlayerSceneChoice[] {
    return choices.filter(choice => {
      if (!choice.condition) return true;

      const { field, operator, value } = choice.condition;
      const fieldValue = playerStats[field];
      if (fieldValue === undefined) return false;

      switch (operator) {
        case 'gte': return Number(fieldValue) >= Number(value);
        case 'lte': return Number(fieldValue) <= Number(value);
        case 'eq': return Number(fieldValue) === Number(value);
        case 'includes':
          if (Array.isArray(fieldValue)) return fieldValue.includes(value);
          return String(fieldValue).includes(String(value));
        case 'notIncludes':
          if (Array.isArray(fieldValue)) return !fieldValue.includes(value);
          return !String(fieldValue).includes(String(value));
        default: return true;
      }
    });
  }
}
