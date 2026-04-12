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

export type OutcomeType = 'certain' | 'contested' | 'chance' | 'multi_contested';

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
  // === 漫野奇谭化扩展 ===
  resolution?: SceneResolution;      // 多属性判定（替代 contestedStat）
  tieredOutcomes?: TieredOutcome[];  // 多层级结果（替代 success/failure 二元）
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
  npcName: string;                    // NPC 真实名字（用于叙事模板）
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
  // === 漫野奇谭化：加强条件约束 ===
  actorTraits?: string[];            // 性格过滤（组内至少1人匹配）
  actorForbiddenTraits?: string[];   // 禁止性格
  requireNearbyProfession?: string[];// 需要附近有指定职业的NPC
  requireNearbyRelation?: string;    // 需要附近有指定关系类型的NPC
  requireFactionType?: string[];     // 需要组内有人属于指定阵营类型
  dominantMood?: string;             // 组内平均情绪要求
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
  // 漫野奇谭化扩展条件
  actorPersonality?: string[];
  nearbyProfessions?: string[];
  nearbyRelationTypes?: string[];
  groupFactionTypes?: string[];
  avgMood?: number;
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
// 多属性判定（漫野奇谭化）
// ════════════════════════════════════════

export interface SceneResolution {
  /** 判定方式 */
  type: OutcomeType;

  /** 传统单属性对抗（向后兼容） */
  contestedStat?: { actor: string; target: string };

  /** 多属性加权对抗 */
  multiContested?: {
    actorStats: { stat: string; weight: number }[];
    targetStats: { stat: string; weight: number }[];
    /** 情境修正 */
    modifiers: {
      condition: { field: string; op: 'gte' | 'lte' | 'includes' | 'notIncludes'; value: any };
      bonus: number;  // -100 到 +100
    }[];
  };

  /** 固定概率 */
  successChance?: number;
}

export type OutcomeTier = 'critical_success' | 'success' | 'partial_success' | 'failure' | 'critical_failure';

export interface TieredOutcome {
  /** 判定分数阈值（0-100），>=此值触发此结果 */
  minScore: number;
  /** 结果等级标签 */
  tier: OutcomeTier;
  /** 结果内容 */
  outcome: L0SceneOutcome;
}

// ════════════════════════════════════════
// 玩家多步骤场景（漫野奇谭式连续事件）
// ════════════════════════════════════════

/** 玩家选项的条件约束 */
export interface PlayerChoiceCondition {
  field: string;                     // 'copper' | 'health' | 'personality' | 'hiddenTrait' | 'inventory' | ...
  operator: 'gte' | 'lte' | 'includes' | 'notIncludes' | 'eq';
  value: number | string;
}

/** 玩家选项的结果 */
export interface PlayerSceneConsequence {
  /** 直接效果（铜钱、生命等） */
  immediateEffects?: Record<string, number>;
  /** 关系变化 */
  relationChange?: number;
  /** 目标效果 */
  targetEffects?: Record<string, number>;
  /** 下一步 phaseId，null 表示场景结束 */
  nextPhase: string | null;
  /** 替换叙事（如果nextPhase=null，直接用这段叙事结束） */
  endingNarrative?: string;
  /** 触发的场景结果 */
  outcome?: L0SceneOutcome;
  /** 判定（可选：选择后仍需判定） */
  resolution?: SceneResolution;
  /** 多层级判定结果（与 resolution 配合） */
  tieredResults?: Record<string, { narrative: string; effects: Record<string, number> }>;
}

/** 玩家场景中的一个选项 */
export interface PlayerSceneChoice {
  id: string;
  text: string;                       // 显示给玩家的选项文字
  /** 选项条件（可选，不满足则不显示） */
  condition?: PlayerChoiceCondition;
  /** 选择后的结果 */
  consequence: PlayerSceneConsequence;
}

/** 玩家场景的每一步 */
export interface PlayerSceneStep {
  phaseId: string;                    // 阶段标识
  narrative: string;                  // 当前阶段的叙事文本（模板变量同 L0）
  choices: PlayerSceneChoice[];       // 玩家可选的操作
}

/** 玩家场景的参与者 */
export interface PlayerSceneParticipant {
  role: string;                       // '对手' | '同伴' | '旁观者' | '受害者' | '向导' 等
  requiredTraits?: string[];          // OR匹配
  requiredProfession?: string[];
  requiredRelationType?: string;      // 与玩家的关系类型
  forbiddenTraits?: string[];         // 禁止性格
  minRelationScore?: number;          // 最低关系分
  maxRelationScore?: number;          // 最高关系分
  minCount: number;
  maxCount?: number;
}

/** 玩家多步骤场景 */
export interface PlayerScene {
  id: string;
  name: string;
  description: string;                // 设计备注
  /** 触发条件（复用 L0SceneCondition） */
  triggerCondition: L0SceneCondition;
  /** 参与者要求 */
  participants: PlayerSceneParticipant[];
  /** 开场叙事 */
  openingNarrative: string;
  /** 所有步骤 */
  phases: Record<string, PlayerSceneStep>;
  /** 起始步骤ID */
  entryPhase: string;
  weight: number;
  cooldownTicks: number;
  priority?: number;
  tags?: string[];
}

/** 玩家场景运行时状态 */
export interface PlayerSceneState {
  sceneId: string;
  currentPhase: string;
  participantNpcIds: number[];
  history: { phaseId: string; choiceId: string; tick: number }[];
  startTick: number;
}

/** 玩家场景匹配结果 */
export interface PlayerSceneMatchResult {
  scene: PlayerScene;
  state: PlayerSceneState;
  openingNarrative: string;
  choices: PlayerSceneChoice[];
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
  // 漫野奇谭化扩展
  tier?: OutcomeTier;
  score?: number;
}
