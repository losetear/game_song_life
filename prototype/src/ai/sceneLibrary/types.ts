// === 多粒度演出库类型定义 ===
//
// 三层架构：
// L0 - 精细（个体NPC，丰富条件，双视角叙事）
// L1 - 中等（群体NPC，简化条件，群像描写）
// L2 - 粗粒（区域统计，阈值触发，氛围段落）

import { EmotionType } from '../../ecs/types';

// ════════════════════════════════════════
// 通用类型
// ════════════════════════════════════════

export type OutcomeType = 'certain' | 'contested' | 'chance';

export type GoalCategory =
  | 'survival' | 'social' | 'work' | 'leisure' | 'family' | 'move'
  | 'conflict' | 'mischief' | 'trade' | 'romance' | 'nature' | 'spiritual'
  | 'creativity' | 'faction' | 'secrets' | 'seasonal';

export type L1Category = 'survival' | 'work' | 'social' | 'trade' | 'conflict' | 'leisure' | 'seasonal' | 'faction';

export type L2Category = 'harvest' | 'hunting' | 'fishing' | 'disaster' | 'prosperity' | 'atmosphere' | 'seasonal';

export type TimeOfDay = 'day' | 'night' | 'dawn' | 'dusk';

// ════════════════════════════════════════
// L0 精细场景（个体NPC）
// ════════════════════════════════════════

export interface L0SceneCondition {
  // 发起者约束
  actorTraits: string[];             // OR匹配（至少一个）
  actorForbiddenTraits: string[];    // 禁止（不能有任何一个）
  actorProfession?: string[];        // OR匹配
  actorMinCopper?: number;
  actorMaxCopper?: number;
  actorEmotion?: EmotionType;        // 精确匹配情绪类型
  actorMinHealth?: number;
  actorMinStress?: number;           // 压力阈值（新增）
  actorMaxStress?: number;           // 压力上限（新增）
  actorMinAspirationProgress?: number; // 志向进度门槛（新增）

  // 目标约束
  targetRequired: boolean;
  targetTraits?: string[];
  targetProfession?: string[];
  targetMinCopper?: number;
  targetMaxCopper?: number;
  targetRelationType?: string;
  targetMinHealth?: number;
  targetSameFaction?: boolean;       // 同阵营（新增）
  targetDifferentFaction?: boolean;  // 不同阵营（新增）

  // 世界约束
  location?: string[];
  timeOfDay?: TimeOfDay;
  weather?: string[];
  season?: string[];
  dayRange?: [number, number];       // 只在day X到Y之间（新增）

  // 群体场景（新增）
  minNearbyNpcs?: number;            // 同格最少NPC数
  maxNearbyNpcs?: number;            // 同格最多NPC数
}

export interface L0SceneOutcome {
  narrative: string;                 // 模板: {npcName}, {targetName}, {location} 等
  effects: Record<string, number>;   // hunger, fatigue, health, mood, safety, social, copper
  targetEffects?: Record<string, number>;
  relationChange?: number;
  // 扩展效果（新增）
  factionEffects?: { factionName: string; influenceChange: number }[];
  memoryTag?: string;                // 写入NPC记忆的标签
  stressChange?: number;             // 直接压力修改
  traitReveal?: 'greed' | 'honor' | 'ambition' | 'rationality' | 'loyalty';
  triggerChainReaction?: string;     // 触发连锁反应规则ID
}

export interface L0Scene {
  id: string;
  name: string;
  description?: string;              // 设计备注
  goalCategory: GoalCategory;
  outcomeType: OutcomeType;
  contestedStat?: { actor: string; target: string };
  successChance?: number;
  conditions: L0SceneCondition;
  success: L0SceneOutcome;
  failure?: L0SceneOutcome;
  weight: number;
  cooldownTicks: number;
  priority?: number;                 // 匹配优先级（新增）
  tags?: string[];                   // 标签过滤（新增）
}

export interface NearbyNpcInfo {
  id: number;
  name: string;
  profession: string;
  personality: string[];
  copper: number;
  health: number;
  relationScore: number;
  relationType: string;
  factionId?: number;                // 新增
}

export interface L0ActorContext {
  traits: string[];
  profession: string;
  copper: number;
  health: number;
  emotion: string;
  stress: number;
  aspirationType?: string;
  aspirationProgress?: number;
  currentGrid: string;
  shichen: string;
  weather: string;
  season: string;
  day: number;
  tick: number;
  factionId?: number;
  nearbyCount: number;
  activeWhimCategories?: Set<string>;
}

// ════════════════════════════════════════
// L1 中等场景（群体NPC）
// ════════════════════════════════════════

export interface L1SceneCondition {
  profession: string[];              // OR匹配
  dominantNeed: string;              // 主需求驱动: hunger/fatigue/mood/social/safety
  needThreshold?: number;            // 需求低于此值触发（默认50）
  location?: string[];
  timeOfDay?: TimeOfDay;
  season?: string[];
  weather?: string[];
  minGroupSize?: number;             // 同组最少人数（默认1）
}

export interface L1SceneOutcome {
  narrative: string;                 // 模板: {count}, {professionName}, {location} 等
  avgEffects: Record<string, number>; // 每人平均效果
  copperPoolChange?: number;         // 总铜钱分配给组
  atmosphereEffect?: string;         // 氛围标签
}

export interface L1Scene {
  id: string;
  name: string;
  category: L1Category;
  conditions: L1SceneCondition;
  outcome: L1SceneOutcome;           // 无成功/失败——必定触发
  weight: number;
  cooldownTicks: number;
  maxPerTick: number;                // 每tick最多触发次数
}

export interface L1MatchContext {
  profession: string;
  gridId: string;
  needs: { hunger: number; fatigue: number; mood: number; social: number; safety: number };
  groupSize: number;
  worldContext: {
    weather: string;
    shichen: string;
    season: string;
    tick: number;
  };
}

export interface L1MatchResult {
  sceneId: string;
  sceneName: string;
  outcome: L1SceneOutcome;
}

// ════════════════════════════════════════
// L2 粗粒场景（区域统计）
// ════════════════════════════════════════

export type L2RegionType = 'farmland' | 'mountain' | 'river' | 'urban';
export type L2ThresholdType = 'yield' | 'animal' | 'fish' | 'mood' | 'weather';
export type L2ThresholdOp = 'above' | 'below';

export interface L2SceneCondition {
  regionType: L2RegionType[];
  thresholdType: L2ThresholdType;
  thresholdOperator: L2ThresholdOp;
  thresholdValue: number;            // 归一化 0-1
  season?: string[];
  weather?: string[];
}

export interface L2SceneOutcomeVariant {
  narrative: string;                 // 模板: {regionName}, {statValue}, {season} 等
  atmosphereTag?: string;
  economicEffect?: { good: string; priceMultiplier: number }[];
  npcMoraleEffect?: number;          // +/- 区域内NPC心情
}

export interface L2Scene {
  id: string;
  name: string;
  category: L2Category;
  conditions: L2SceneCondition;
  outcomes: L2SceneOutcomeVariant[]; // 多条叙事随机选一条
  weight: number;
  cooldownTicks: number;             // 通常较大 (10-30)
  priority: number;
}

export interface L2RegionStats {
  regionId: string;
  regionName: string;
  regionType: L2RegionType;
  stats: Record<L2ThresholdType, number>; // 归一化 0-1
}

export interface L2MatchResult {
  regionId: string;
  regionName: string;
  scene: L2Scene;
  outcome: L2SceneOutcomeVariant;
  score: number;
  statValue: number;
}

// ════════════════════════════════════════
// 决策结果（兼容旧接口）
// ════════════════════════════════════════

export interface SceneDecisionResult {
  sceneId: string;
  sceneName: string;
  goalCategory: string;
  narrative: string;
  success: boolean;
  effects: Record<string, number>;
  targetEffects?: Record<string, number>;
  relationChange?: number;
  targetName?: string;
  completedWhim?: { name: string; moodReward: number };
  // 扩展效果
  factionEffects?: { factionName: string; influenceChange: number }[];
  memoryTag?: string;
  stressChange?: number;
  traitReveal?: 'greed' | 'honor' | 'ambition' | 'rationality' | 'loyalty';
  triggerChainReaction?: string;
}
