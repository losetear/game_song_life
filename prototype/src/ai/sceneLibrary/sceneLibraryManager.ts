// === 演出库管理器 ===
//
// 门面模式：为每层提供一个入口方法
// 管理 cooldown、场景索引、叙事格式化

import {
  L0Scene, L0ActorContext, NearbyNpcInfo, SceneDecisionResult,
  L1Scene, L1MatchContext, L1MatchResult,
  L2Scene, L2RegionStats, L2MatchResult,
  GoalCategory,
} from './types';
import { matchL0Scene, matchL1Scene, matchL2Scenes } from './matcher';
import { resolveScene } from './resolver';
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

  // L0 cooldown: per NPC
  private l0Recent: Map<number, string[]> = new Map();
  // L1 cooldown: global
  private l1Recent: string[] = [];
  // L2 cooldown: per region
  private l2Recent: Map<string, string[]> = new Map();

  // L1 每场景每tick触发计数
  private l1TriggerCount: Map<string, number> = new Map();

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

  /** 每tick开始时重置L1计数 */
  resetTickCounters(): void {
    this.l1TriggerCount.clear();
  }

  // ════════════════════════════════════════
  // L0 精细匹配 + 解析
  // ════════════════════════════════════════

  matchL0(
    goalCategories: GoalCategory[],
    actorContext: L0ActorContext,
    nearbyNpcs: NearbyNpcInfo[],
    actorStats: Record<string, number>,
    targetStatsLookup: (targetId: number) => Record<string, number>,
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

    // 解析成功/失败
    const targetStats = target ? targetStatsLookup(target.id) : undefined;
    const success = resolveScene(
      scene.outcomeType,
      scene.contestedStat,
      scene.successChance,
      actorStats,
      targetStats,
    );

    const outcome = success ? scene.success : scene.failure;
    if (!outcome) return null; // 无失败结局且判定失败

    // 格式化叙事
    const vars: Record<string, string> = {
      npcName: actorContext.profession, // 由worldEngine填充真实名字
      targetName: target?.name || '某人',
      location: actorContext.currentGrid,
    };
    const narrative = formatNarrative(outcome.narrative, vars);

    // 更新cooldown
    const recent = this.l0Recent.get(actorContext.tick) || [];
    recent.push(scene.id);
    if (recent.length > 20) recent.shift();
    this.l0Recent.set(actorContext.tick, recent);

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
}
