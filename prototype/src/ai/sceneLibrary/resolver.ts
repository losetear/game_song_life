// === 演出结果解析 ===
//
// 判定类型: certain / contested / chance / multi_contested
// 漫野奇谭化：多属性加权判定 + 情境修正 + d20

import { OutcomeType, SceneResolution, TieredOutcome, L0SceneOutcome, OutcomeTier } from './types';

// ════════════════════════════════════════
// 旧版判定（向后兼容）
// ════════════════════════════════════════

export function resolveScene(
  outcomeType: OutcomeType,
  contestedStat: { actor: string; target: string } | undefined,
  successChance: number | undefined,
  actorStats: Record<string, number>,
  targetStats?: Record<string, number>,
): boolean {
  const result = resolveSceneV2(
    { type: outcomeType, contestedStat, successChance },
    actorStats,
    targetStats || {},
    {},
  );
  return result.success;
}

// ════════════════════════════════════════
// 新版多属性判定
// ════════════════════════════════════════

export interface ResolveContext {
  actorPersonality?: string[];
  actorEmotion?: string;
  actorStress?: number;
  actorHiddenTraits?: { greed: number; honor: number; ambition: number; rationality: number; loyalty: number };
  targetPersonality?: string[];
  relationScore?: number;
  nearbyCount?: number;
  weather?: string;
  season?: string;
  timeOfDay?: string;
}

export interface ResolveResult {
  success: boolean;
  score: number;       // 0-100
  tier?: OutcomeTier;
}

/**
 * 多属性加权判定引擎
 *
 * - certain → 直接成功, score=100
 * - chance → 随机, score = 100 if success else 0
 * - contested → 单属性, score = actorVal / (actorVal + targetVal) * 100
 * - multi_contested → 加权求和 + 情境修正 + d20
 */
export function resolveSceneV2(
  resolution: SceneResolution,
  actorStats: Record<string, number>,
  targetStats: Record<string, number>,
  context: ResolveContext,
): ResolveResult {
  switch (resolution.type) {
    case 'certain':
      return { success: true, score: 100, tier: 'success' };

    case 'chance': {
      const roll = Math.random();
      const threshold = resolution.successChance ?? 0.5;
      const success = roll < threshold;
      return {
        success,
        score: success ? 70 + Math.floor(roll * 30) : Math.floor(roll * 40),
        tier: success ? 'success' : 'failure',
      };
    }

    case 'contested': {
      const stat = resolution.contestedStat;
      if (!stat) return { success: true, score: 100, tier: 'success' };

      const actorVal = actorStats[stat.actor] ?? 50;
      const targetVal = targetStats[stat.target] ?? 50;
      // 加 d20 波动
      const actorRoll = actorVal + Math.floor(Math.random() * 20) + 1;
      const targetRoll = targetVal + Math.floor(Math.random() * 10) + 1;
      const score = Math.round(actorRoll / (actorRoll + targetRoll) * 100);

      return {
        success: score >= 50,
        score,
        tier: scoreToTier(score),
      };
    }

    case 'multi_contested': {
      const mc = resolution.multiContested;
      if (!mc) return { success: true, score: 100, tier: 'success' };

      // 加权求和
      let actorTotal = 0;
      for (const { stat, weight } of mc.actorStats) {
        actorTotal += (actorStats[stat] ?? 50) * weight;
      }
      let targetTotal = 0;
      for (const { stat, weight } of mc.targetStats) {
        targetTotal += (targetStats[stat] ?? 50) * weight;
      }

      // 情境修正
      for (const mod of mc.modifiers) {
        if (checkModifierCondition(mod.condition, actorStats, context)) {
          actorTotal += mod.bonus;
        }
      }

      // 关系修正：朋友之间冲突减轻，敌人之间加重
      if (context.relationScore !== undefined) {
        if (context.relationScore >= 61) actorTotal -= 10; // 对朋友手下留情
        if (context.relationScore <= -61) actorTotal += 15; // 对敌人更狠
      }

      // 压力修正：高压力降低表现
      if (context.actorStress !== undefined && context.actorStress > 50) {
        actorTotal -= (context.actorStress - 50) * 0.3;
      }

      // 隐藏特质修正
      if (context.actorHiddenTraits) {
        // 荣誉心高 → 在冲突中倾向公正
        if (context.actorHiddenTraits.honor > 70) actorTotal -= 5;
        // 贪婪高 → 在交易中更积极
        if (context.actorHiddenTraits.greed > 70) actorTotal += 5;
        // 理性高 → 判定更稳定（减少随机性已在d20中体现）
        if (context.actorHiddenTraits.rationality > 70) actorTotal += 3;
      }

      // d20 波动
      const actorRoll = actorTotal + Math.floor(Math.random() * 20) + 1;
      const targetRoll = targetTotal + Math.floor(Math.random() * 10) + 1;
      const score = Math.round(Math.max(0, Math.min(100, actorRoll / (actorRoll + targetRoll) * 100)));

      return {
        success: score >= 50,
        score,
        tier: scoreToTier(score),
      };
    }

    default:
      return { success: true, score: 100, tier: 'success' };
  }
}

/** 分数 → 结果等级 */
function scoreToTier(score: number): OutcomeTier {
  if (score >= 90) return 'critical_success';
  if (score >= 60) return 'success';
  if (score >= 40) return 'partial_success';
  if (score >= 20) return 'failure';
  return 'critical_failure';
}

/**
 * 从多层级结果中选取匹配的结果
 */
export function selectTieredOutcome(
  tieredOutcomes: TieredOutcome[],
  score: number,
): { outcome: L0SceneOutcome; tier: OutcomeTier } | null {
  // 从高到低匹配
  const sorted = [...tieredOutcomes].sort((a, b) => b.minScore - a.minScore);
  for (const t of sorted) {
    if (score >= t.minScore) {
      return { outcome: t.outcome, tier: t.tier };
    }
  }
  // 没匹配到，返回最低的
  if (sorted.length > 0) {
    const lowest = sorted[sorted.length - 1];
    return { outcome: lowest.outcome, tier: lowest.tier };
  }
  return null;
}

/** 检查情境修正条件 */
function checkModifierCondition(
  condition: { field: string; op: 'gte' | 'lte' | 'includes' | 'notIncludes'; value: any },
  stats: Record<string, number>,
  context: ResolveContext,
): boolean {
  // 先从 stats 中找，再从 context 中找
  let fieldValue: any = stats[condition.field];

  if (fieldValue === undefined) {
    // 从 context 中查找嵌套字段
    const contextFields: Record<string, any> = {
      actorPersonality: context.actorPersonality,
      actorEmotion: context.actorEmotion,
      actorStress: context.actorStress,
      relationScore: context.relationScore,
      nearbyCount: context.nearbyCount,
      weather: context.weather,
      season: context.season,
      greed: context.actorHiddenTraits?.greed,
      honor: context.actorHiddenTraits?.honor,
      ambition: context.actorHiddenTraits?.ambition,
      rationality: context.actorHiddenTraits?.rationality,
      loyalty: context.actorHiddenTraits?.loyalty,
    };
    fieldValue = contextFields[condition.field];
  }

  if (fieldValue === undefined) return false;

  switch (condition.op) {
    case 'gte': return Number(fieldValue) >= Number(condition.value);
    case 'lte': return Number(fieldValue) <= Number(condition.value);
    case 'includes':
      if (Array.isArray(fieldValue)) return fieldValue.includes(condition.value);
      return String(fieldValue).includes(String(condition.value));
    case 'notIncludes':
      if (Array.isArray(fieldValue)) return !fieldValue.includes(condition.value);
      return !String(fieldValue).includes(String(condition.value));
    default: return false;
  }
}
