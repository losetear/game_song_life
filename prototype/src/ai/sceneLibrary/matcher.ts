// === 多粒度演出匹配算法 ===
//
// L0: 精细匹配（个体NPC，按goalCategory索引，扩展评分）
// L1: 批量匹配（群体NPC，按profession索引，确定性）
// L2: 区域匹配（统计阈值，每区域取最高分）

import {
  L0Scene, L0SceneCondition, L0ActorContext, NearbyNpcInfo,
  L1Scene, L1MatchContext, L1MatchResult,
  L2Scene, L2RegionStats, L2MatchResult,
  GoalCategory,
} from './types';

// ════════════════════════════════════════
// 通用工具函数
// ════════════════════════════════════════

function matchesTrait(npcTraits: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some(t => npcTraits.includes(t));
}

function matchesRelation(relationType: string, required: string): boolean {
  if (!required || required === 'any') return true;
  if (required === 'friend') return ['friend', 'closeFriend', 'close_friend'].includes(relationType);
  if (required === 'enemy') return ['enemy'].includes(relationType);
  if (required === 'stranger') return ['stranger', 'acquaintance'].includes(relationType);
  return relationType === required;
}

function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

function isDawn(shichen: string): boolean {
  return ['寅', '卯'].includes(shichen);
}

function isDusk(shichen: string): boolean {
  return ['酉', '戌'].includes(shichen);
}

function checkTimeOfDay(shichen: string, required?: string): boolean {
  if (!required) return true;
  switch (required) {
    case 'day': return isDaytime(shichen);
    case 'night': return !isDaytime(shichen);
    case 'dawn': return isDawn(shichen);
    case 'dusk': return isDusk(shichen);
    default: return true;
  }
}

// ════════════════════════════════════════
// L0 精细匹配（扩展当前算法）
// ════════════════════════════════════════

function matchesL0Condition(
  cond: L0SceneCondition,
  ctx: L0ActorContext,
  nearbyNpcs: NearbyNpcInfo[],
): NearbyNpcInfo | null {
  // 发起者性格
  if (!matchesTrait(ctx.traits, cond.actorTraits)) return null;
  if (cond.actorForbiddenTraits.some(t => ctx.traits.includes(t))) return null;

  // 发起者职业
  if (cond.actorProfession && cond.actorProfession.length > 0 && !cond.actorProfession.includes(ctx.profession)) return null;

  // 发起者铜钱
  if (cond.actorMinCopper !== undefined && ctx.copper < cond.actorMinCopper) return null;
  if (cond.actorMaxCopper !== undefined && ctx.copper > cond.actorMaxCopper) return null;

  // 发起者健康
  if (cond.actorMinHealth !== undefined && ctx.health < cond.actorMinHealth) return null;

  // 发起者情绪
  if (cond.actorEmotion && cond.actorEmotion !== ctx.emotion) return null;

  // 发起者压力（新增）
  if (cond.actorMinStress !== undefined && ctx.stress < cond.actorMinStress) return null;
  if (cond.actorMaxStress !== undefined && ctx.stress > cond.actorMaxStress) return null;

  // 地点
  if (cond.location && cond.location.length > 0 && !cond.location.includes(ctx.currentGrid)) return null;

  // 时段
  if (!checkTimeOfDay(ctx.shichen, cond.timeOfDay)) return null;

  // 天气
  if (cond.weather && cond.weather.length > 0 && !cond.weather.includes(ctx.weather)) return null;

  // 季节
  if (cond.season && cond.season.length > 0 && !cond.season.includes(ctx.season)) return null;

  // 天数范围（新增）
  if (cond.dayRange && (ctx.day < cond.dayRange[0] || ctx.day > cond.dayRange[1])) return null;

  // 附近NPC数量（新增）
  if (cond.minNearbyNpcs !== undefined && ctx.nearbyCount < cond.minNearbyNpcs) return null;
  if (cond.maxNearbyNpcs !== undefined && ctx.nearbyCount > cond.maxNearbyNpcs) return null;

  // 目标NPC
  if (!cond.targetRequired) return nearbyNpcs.length > 0 ? nearbyNpcs[0] : null; // 占位，不实际使用

  const target = nearbyNpcs.find(npc => {
    if (cond.targetTraits && !matchesTrait(npc.personality, cond.targetTraits!)) return false;
    if (cond.targetProfession && cond.targetProfession.length > 0 && !cond.targetProfession.includes(npc.profession)) return false;
    if (cond.targetMinCopper !== undefined && npc.copper < cond.targetMinCopper) return false;
    if (cond.targetMaxCopper !== undefined && npc.copper > cond.targetMaxCopper) return false;
    if (cond.targetRelationType && !matchesRelation(npc.relationType, cond.targetRelationType)) return false;
    if (cond.targetMinHealth !== undefined && npc.health < cond.targetMinHealth) return false;
    // 阵营匹配（新增）
    if (cond.targetSameFaction && ctx.factionId !== undefined && npc.factionId !== ctx.factionId) return false;
    if (cond.targetDifferentFaction && ctx.factionId !== undefined && npc.factionId === ctx.factionId) return false;
    return true;
  });

  return target || null;
}

export function matchL0Scene(
  goalCategories: GoalCategory[],
  actorContext: L0ActorContext,
  nearbyNpcs: NearbyNpcInfo[],
  recentSceneIds: string[],
  allScenes: L0Scene[],
): { scene: L0Scene; target?: NearbyNpcInfo } | null {
  const candidates: { scene: L0Scene; target?: NearbyNpcInfo; score: number }[] = [];

  for (const scene of allScenes) {
    // 类别过滤
    if (!goalCategories.includes(scene.goalCategory)) continue;

    // 冷却检查
    if (recentSceneIds.includes(scene.id)) continue;

    // 条件匹配
    const target = matchesL0Condition(scene.conditions, actorContext, nearbyNpcs);
    if (scene.conditions.targetRequired && !target) continue;
    if (!scene.conditions.targetRequired && target === null && nearbyNpcs.length === 0) {
      // 无目标场景不需要附近NPC，跳过null检查
    }

    // 评分
    let score = scene.weight
      + (scene.priority || 0) * 0.5
      + Math.random() * 2;

    // 情绪-标签协同加分
    const tags = scene.tags || [];
    if (actorContext.emotion === 'tense' && tags.includes('stress')) score += 3;
    if (actorContext.emotion === 'happy' && tags.includes('joyful')) score += 2;
    if (actorContext.emotion === 'angry' && tags.includes('aggressive')) score += 3;
    if (actorContext.emotion === 'social' && tags.includes('social')) score += 2;
    if (actorContext.emotion === 'bored' && tags.includes('exploration')) score += 2;

    // 奇想匹配加分
    if (actorContext.activeWhimCategories?.has(scene.goalCategory)) score += 5;

    // 近期同类惩罚
    const similarCount = recentSceneIds.filter(id => {
      const s = allScenes.find(sc => sc.id === id);
      return s && s.goalCategory === scene.goalCategory;
    }).length;
    score -= similarCount * 2;

    candidates.push({ scene, target: target || undefined, score });
  }

  if (candidates.length === 0) return null;

  // 排序取top-3，随机选一个
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, Math.min(3, candidates.length));
  const chosen = top[Math.floor(Math.random() * top.length)];
  return { scene: chosen.scene, target: chosen.target };
}

// ════════════════════════════════════════
// L1 批量匹配（确定性，每 profession 组）
// ════════════════════════════════════════

export function matchL1Scene(
  context: L1MatchContext,
  allScenes: L1Scene[],
  recentSceneIds: string[],
): L1MatchResult | null {
  const candidates: { scene: L1Scene; score: number }[] = [];

  for (const scene of allScenes) {
    const cond = scene.conditions;

    // 职业过滤
    if (!cond.profession.includes(context.profession)) continue;

    // 需求阈值
    const needValue = (context.needs as Record<string, number>)[cond.dominantNeed];
    if (cond.needThreshold !== undefined && needValue > cond.needThreshold) continue;

    // 组大小
    if (cond.minGroupSize && context.groupSize < cond.minGroupSize) continue;

    // 地点
    if (cond.location && !cond.location.includes(context.gridId)) continue;

    // 时段
    if (!checkTimeOfDay(context.worldContext.shichen, cond.timeOfDay)) continue;

    // 天气
    if (cond.weather && cond.weather.length > 0 && !cond.weather.includes(context.worldContext.weather)) continue;

    // 季节
    if (cond.season && cond.season.length > 0 && !cond.season.includes(context.worldContext.season)) continue;

    // 冷却
    if (recentSceneIds.includes(scene.id)) continue;

    // === 漫野奇谭化：加强条件约束 ===

    // 性格过滤（组内至少1人匹配）
    if (cond.actorTraits && cond.actorTraits.length > 0) {
      if (!context.actorPersonality || !cond.actorTraits.some(t => context.actorPersonality!.includes(t))) continue;
    }

    // 禁止性格
    if (cond.actorForbiddenTraits && cond.actorForbiddenTraits.length > 0) {
      if (context.actorPersonality && cond.actorForbiddenTraits.some(t => context.actorPersonality!.includes(t))) continue;
    }

    // 附近职业要求
    if (cond.requireNearbyProfession && cond.requireNearbyProfession.length > 0) {
      if (!context.nearbyProfessions || !cond.requireNearbyProfession.some(p => context.nearbyProfessions!.includes(p))) continue;
    }

    // 附近关系要求
    if (cond.requireNearbyRelation) {
      if (!context.nearbyRelationTypes || !context.nearbyRelationTypes.includes(cond.requireNearbyRelation)) continue;
    }

    // 阵营类型要求
    if (cond.requireFactionType && cond.requireFactionType.length > 0) {
      if (!context.groupFactionTypes || !cond.requireFactionType.some(f => context.groupFactionTypes!.includes(f))) continue;
    }

    // 平均情绪要求
    if (cond.dominantMood) {
      const avgMood = context.avgMood ?? 50;
      const moodMap: Record<string, [number, number]> = {
        'happy': [60, 100], 'tense': [0, 40], 'angry': [0, 30],
        'sad': [0, 35], 'social': [50, 100], 'bored': [20, 50],
        'fearful': [0, 30],
      };
      const range = moodMap[cond.dominantMood];
      if (range && (avgMood < range[0] || avgMood > range[1])) continue;
    }

    // 评分（降低随机噪声，让权重和属性主导）
    const score = scene.weight
      + (100 - (needValue || 50)) * 0.1
      + Math.random() * 0.5;

    candidates.push({ scene, score });
  }

  if (candidates.length === 0) return null;

  // 取最高分（确定性选择）
  candidates.sort((a, b) => b.score - a.score);
  return {
    sceneId: candidates[0].scene.id,
    sceneName: candidates[0].scene.name,
    outcome: candidates[0].scene.outcome,
  };
}

// ════════════════════════════════════════
// L2 区域匹配（每区域取最高分）
// ════════════════════════════════════════

export function matchL2Scenes(
  regions: L2RegionStats[],
  worldContext: { weather: string; season: string; tick: number },
  allScenes: L2Scene[],
  recentByRegion: Map<string, string[]>,
): L2MatchResult[] {
  const results: L2MatchResult[] = [];

  for (const region of regions) {
    for (const scene of allScenes) {
      // 区域类型
      if (!scene.conditions.regionType.includes(region.regionType)) continue;

      // 阈值检查
      const statValue = region.stats[scene.conditions.thresholdType];
      const matches = scene.conditions.thresholdOperator === 'below'
        ? statValue < scene.conditions.thresholdValue
        : statValue > scene.conditions.thresholdValue;
      if (!matches) continue;

      // 季节
      if (scene.conditions.season && scene.conditions.season.length > 0 && !scene.conditions.season.includes(worldContext.season)) continue;

      // 天气
      if (scene.conditions.weather && scene.conditions.weather.length > 0 && !scene.conditions.weather.includes(worldContext.weather)) continue;

      // 冷却
      const regionRecent = recentByRegion.get(region.regionId) || [];
      if (regionRecent.includes(scene.id)) continue;

      // 评分
      const distance = Math.abs(statValue - scene.conditions.thresholdValue);
      const score = scene.weight * (scene.priority || 1) * (1 + distance);

      // 随机选一个叙事变体
      const outcome = scene.outcomes[Math.floor(Math.random() * scene.outcomes.length)];

      results.push({
        regionId: region.regionId,
        regionName: region.regionName,
        scene,
        outcome,
        score,
        statValue,
      });
    }
  }

  // 每区域取最高分
  const bestPerRegion = new Map<string, L2MatchResult>();
  for (const r of results) {
    const existing = bestPerRegion.get(r.regionId);
    if (!existing || r.score > existing.score) {
      bestPerRegion.set(r.regionId, r);
    }
  }

  return Array.from(bestPerRegion.values());
}
