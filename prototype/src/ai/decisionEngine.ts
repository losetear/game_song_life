// === NPC 决策引擎 v4 — 模拟人生风格 + 情绪/心愿/抱负/每日计划 ===
//
// 核心理念（参考 The Sims）:
// 1. 不先选目标再选行动，而是直接对所有可用行动打分
// 2. 每个行动的分数 = Σ(需求改善量 × 紧迫曲线) + 职业加成 + 性格加成 + 时段加成
//    + 情绪加成 + 心愿加成 + 抱负加成 + 每日计划加成 - 成本
// 3. 紧迫曲线是指数的（需求越低越紧急）：urgency = (100 - value)^1.5 / 50
// 4. 近期重复行动惩罚（-30%），鼓励行为多样性
// 5. 日常节律：早晨/上午/午间/下午/傍晚/深夜有不同的行为倾向
// 6. softmax 温度选择从 top-5 中选，性格影响温度

import { NeedsComponent, EmotionType, AspirationType, Whim, HiddenTraitsComponent } from '../ecs/types';
import { ALL_ACTIONS, NPCAction } from './actionRegistry';
import { EMOTION_CATEGORY_BIAS } from './emotionSystem';
import { ASPIRATION_CATEGORY_BIAS } from './aspirationSystem';
import { getStressEffects } from './stressMemorySystem';
import {
  SceneLibraryManager,
  SceneDecisionResult,
  GoalCategory,
  NearbyNpcInfo,
  formatNarrative,
} from './sceneLibrary';

export interface DecisionContext {
  needs: NeedsComponent;
  npcName: string;
  profession: string;
  personality: string[];
  factionRole?: string;
  copper: number;
  currentGrid: string;
  weather: string;
  shichen: string;
  day: number;
  tick: number;
  factionId?: number;
  familyNearby: boolean;
  inventory: { itemType: string; amount: number }[];
  nearNpcCount: number;
  recentActions?: string[]; // 最近3回合的行动ID
  // v4 新增
  emotion?: EmotionType;
  whims?: Whim[];
  aspiration?: AspirationType;
  dailyPlanBiases?: Record<string, number>;
  // v5 涌现叙事新增
  stressLevel?: number;
  hiddenTraits?: HiddenTraitsComponent;
  nearbyRelations?: { targetId: number; score: number; type: string }[];
}

export interface DecisionResult {
  goalId: string;
  goalName: string;
  actionId: string;
  actionName: string;
  narrative: string;
  effects: Record<string, number>;
  completedWhim?: { name: string; moodReward: number };
}

// ──── 紧迫度曲线（模拟人生风格）────
// 需求值 100→0 对应紧迫度 0→高
// 指数曲线：越低越紧急，90以上几乎不紧迫，40以下急剧上升
function urgency(value: number): number {
  if (value >= 95) return 0.05;
  if (value >= 80) return 0.15;
  if (value >= 60) return 0.4;
  if (value >= 40) return 0.8;
  if (value >= 25) return 1.5;
  if (value >= 10) return 3.0;
  return 5.0; // 极度紧急
}

// ──── 时段定义 ────
type TimeSlot = 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late_night';

function getTimeSlot(shichen: string): TimeSlot {
  switch (shichen) {
    case '寅': case '卯': return 'early_morning'; // 3-7点
    case '辰': case '巳': return 'morning';        // 7-11点
    case '午': return 'midday';                     // 11-13点
    case '未': case '申': return 'afternoon';       // 13-17点
    case '酉': case '戌': return 'evening';         // 17-21点
    case '亥': case '子': return 'night';           // 21-1点
    case '丑': return 'late_night';                 // 1-3点
    default: return 'morning';
  }
}

// ──── 时段对行为类别的倾向加成 ────
// 模拟人生：早晨→吃饭, 上午→工作, 午间→吃饭/休息, 下午→工作/社交, 傍晚→社交/休闲, 夜间→回家/睡觉
const TIME_SLOT_BIAS: Record<TimeSlot, Record<string, number>> = {
  early_morning: { survival: 1.5, work: 0.5, social: 0.3, leisure: 0.3, move: 1.2 },
  morning:       { survival: 1.0, work: 1.6, social: 0.6, leisure: 0.4, move: 1.0 },
  midday:        { survival: 1.8, work: 0.6, social: 1.0, leisure: 0.8, move: 0.8 },
  afternoon:     { survival: 0.8, work: 1.3, social: 0.8, leisure: 0.6, move: 0.9 },
  evening:       { survival: 0.7, work: 0.3, social: 1.5, leisure: 1.4, family: 1.5, move: 0.8 },
  night:         { survival: 0.6, work: 0.2, social: 0.8, leisure: 1.0, family: 1.2, move: 0.6 },
  late_night:    { survival: 1.2, work: 0.1, social: 0.2, leisure: 0.3, move: 0.5 },
};

// ──── 职业对行动类别的倾向 ────
const PROFESSION_BIAS: Record<string, Record<string, number>> = {
  merchant:   { work: 1.6, social: 1.3, leisure: 1.0, survival: 0.7 },
  guard:      { work: 1.5, survival: 1.3, social: 0.8, leisure: 0.6 },
  rogue:      { work: 1.3, survival: 1.2, social: 0.7, leisure: 1.0 },
  doctor:     { work: 1.6, social: 1.1, leisure: 0.7, survival: 0.9 },
  farmer:     { work: 1.5, survival: 1.2, social: 0.6, leisure: 0.7 },
  hunter:     { work: 1.5, survival: 1.4, social: 0.5, leisure: 0.6 },
  laborer:    { work: 1.4, survival: 1.2, social: 0.6, leisure: 0.5 },
  blacksmith: { work: 1.6, survival: 0.8, social: 0.6, leisure: 0.8 },
  teacher:    { work: 1.3, social: 1.5, leisure: 1.2, survival: 0.7 },
  chef:       { work: 1.5, social: 1.0, leisure: 0.8, survival: 0.9 },
};

// ──── 性格对需求类型的放大 ────
const PERSONALITY_NEED_BIAS: Record<string, Record<string, number>> = {
  '胆小': { safety: 1.8, social: 0.7, hunger: 1.0, fatigue: 1.0, health: 1.2, mood: 0.9 },
  '勇敢': { safety: 0.5, social: 1.2, hunger: 1.0, fatigue: 0.8, health: 0.9, mood: 1.1 },
  '大方': { social: 1.6, mood: 1.3, hunger: 1.1, fatigue: 1.0, health: 0.9, safety: 0.8 },
  '沉默': { social: 0.4, mood: 0.8, hunger: 1.0, fatigue: 1.0, health: 1.0, safety: 1.1 },
  '狡猾': { mood: 1.2, safety: 1.3, social: 0.8, hunger: 1.1, fatigue: 0.9, health: 0.9 },
  '温和': { social: 1.4, mood: 1.3, hunger: 1.0, fatigue: 1.0, health: 1.0, safety: 0.9 },
  '暴躁': { safety: 0.7, mood: 1.4, social: 0.6, hunger: 1.2, fatigue: 0.8, health: 1.0 },
  '机灵': { social: 1.2, mood: 1.2, hunger: 1.0, fatigue: 0.9, health: 1.0, safety: 1.0 },
  '正直': { safety: 1.3, social: 1.0, hunger: 1.0, fatigue: 1.0, health: 1.1, mood: 0.9 },
  '精明': { hunger: 1.3, mood: 1.1, social: 0.8, fatigue: 0.9, health: 0.9, safety: 1.0 },
  '勤劳': { fatigue: 0.7, hunger: 1.1, mood: 0.9, social: 0.8, safety: 1.0, health: 1.0 },
  '懒散': { fatigue: 1.4, hunger: 1.0, mood: 1.1, social: 0.9, safety: 1.0, health: 1.0 },
  '健谈': { social: 1.6, mood: 1.2, hunger: 1.0, fatigue: 1.0, safety: 0.9, health: 1.0 },
  '善良': { social: 1.3, mood: 1.2, hunger: 1.0, fatigue: 1.0, safety: 1.0, health: 1.1 },
  '吝啬': { hunger: 1.2, mood: 0.9, social: 0.7, fatigue: 1.0, safety: 1.0, health: 1.0 },
  '贪吃': { hunger: 1.6, mood: 1.1, social: 1.0, fatigue: 1.0, safety: 1.0, health: 1.0 },
};

// 需求名映射（effects中的key → NeedsComponent中的field）
const NEED_KEYS = ['hunger', 'fatigue', 'health', 'mood', 'safety', 'social'];

// ──── softmax 温度选择 ────
function softmaxSelect(candidates: { action: NPCAction; score: number }[], temperature: number): typeof candidates[0] {
  // 取 top-5
  const top = candidates.slice(0, Math.min(5, candidates.length));
  if (top.length === 0) return candidates[0];

  // softmax 概率
  const maxScore = top[0].score;
  const exps = top.map(c => Math.exp((c.score - maxScore) / temperature));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExp);

  // 按概率选择
  let r = Math.random();
  for (let i = 0; i < top.length; i++) {
    r -= probs[i];
    if (r <= 0) return top[i];
  }
  return top[0];
}

// ──── 性格影响温度 ────
// 机灵/健谈 → 高温度（更多随机性），沉默/正直 → 低温度（更确定）
function getTemperature(personality: string[]): number {
  let temp = 1.0; // 基准温度
  const HIGH_TEMP_TRAITS = ['机灵', '健谈'];
  const LOW_TEMP_TRAITS = ['沉默', '正直', '勤劳'];
  for (const trait of personality) {
    if (HIGH_TEMP_TRAITS.includes(trait)) temp += 0.3;
    if (LOW_TEMP_TRAITS.includes(trait)) temp -= 0.2;
  }
  return Math.max(0.3, Math.min(2.0, temp)); // clamp [0.3, 2.0]
}

export function decide(ctx: DecisionContext): DecisionResult {
  const timeSlot = getTimeSlot(ctx.shichen);
  const timeBias = TIME_SLOT_BIAS[timeSlot];
  const profBias = PROFESSION_BIAS[ctx.profession] || PROFESSION_BIAS['merchant'];
  const recentActions = ctx.recentActions || [];

  // 计算性格对需求的综合影响
  const personalityFactors: Record<string, number> = {};
  for (const key of NEED_KEYS) {
    personalityFactors[key] = 1.0;
    for (const trait of ctx.personality) {
      const bias = PERSONALITY_NEED_BIAS[trait];
      if (bias && bias[key]) personalityFactors[key] *= bias[key];
    }
  }

  // 预计算情绪加成
  const emotionBias = ctx.emotion
    ? EMOTION_CATEGORY_BIAS[ctx.emotion] || {}
    : {};

  // 预计算抱负加成
  const aspirationBias = ctx.aspiration
    ? ASPIRATION_CATEGORY_BIAS[ctx.aspiration] || {}
    : {};

  // 预计算每日计划加成
  const dailyBias = ctx.dailyPlanBiases || {};

  // 预计算心愿相关类别
  const whimCategories = new Set<string>();
  const whimActionIds = new Set<string>();
  if (ctx.whims) {
    for (const w of ctx.whims) {
      whimCategories.add(w.relatedCategory);
      if (w.relatedActionId) whimActionIds.add(w.relatedActionId);
    }
  }

  // === 核心算法：对每个可用行动打分 ===
  const candidates: { action: NPCAction; score: number }[] = [];

  for (const action of ALL_ACTIONS) {
    // 1. 检查前置条件
    if (!checkConditions(ctx, action)) continue;

    // 2. 计算综合效用分
    let score = 0;

    // 2a. 需求改善 × 紧迫度 × 性格（核心评分）
    for (const needKey of NEED_KEYS) {
      const effectVal = action.effects[needKey];
      if (effectVal === undefined) continue;

      const currentValue = (ctx.needs as any)[needKey] as number;
      const urg = urgency(currentValue);
      const persFactor = personalityFactors[needKey] || 1.0;

      // 正效果（改善需求）：改善量 × 紧迫度 × 性格
      if (effectVal > 0) {
        score += effectVal * urg * persFactor * 2.0;
      }
      // 负效果（恶化需求）：恶化量 × 紧迫度 × 性格 × 惩罚系数
      if (effectVal < 0) {
        score += effectVal * Math.max(urg, 0.3) * persFactor * 1.5;
      }
    }

    // 2b. 铜钱效果（考虑当前财富）
    if (action.effects.copper) {
      const copperEffect = action.effects.copper;
      if (copperEffect > 0) {
        // 赚钱：越穷越想赚
        score += copperEffect * 0.3 * (ctx.copper < 20 ? 2.0 : ctx.copper < 50 ? 1.2 : 0.6);
      } else {
        // 花钱：越穷越心疼
        score += copperEffect * 0.3 * (ctx.copper < 20 ? 2.5 : ctx.copper < 50 ? 1.5 : 0.5);
      }
    }

    // 2c. 时段加成
    const catBias = timeBias[action.category] || 1.0;
    score *= catBias;

    // 2d. 职业加成
    const profCatBias = profBias[action.category] || 1.0;
    score *= profCatBias;

    // 2e. 具体职业对特定行动的额外加成
    score += getProfessionActionBonus(ctx.profession, action.id);

    // 2f. 近期重复惩罚（-40%每次重复）
    const repeatCount = recentActions.filter(a => a === action.id).length;
    if (repeatCount > 0) {
      score *= Math.pow(0.6, repeatCount);
    }

    // 2g. 疲劳成本惩罚（疲劳低时避免消耗体力的行动）
    if (action.cost.fatigue && action.cost.fatigue > 0) {
      const fatigueMult = ctx.needs.fatigue < 25 ? 0.3 : ctx.needs.fatigue < 40 ? 0.6 : 1.0;
      score *= fatigueMult;
    }

    // 2h. 天气影响
    if (ctx.weather === '暴雨' || ctx.weather === '大暴雨') {
      if (action.category === 'move' || action.id === 'stroll') score *= 0.3;
      if (action.category === 'survival' && action.id !== 'sleep') score *= 1.5;
    }

    // ──── v4 新增加成 ────

    // 2i. 情绪加成：将系数转为乘数
    const eBias = emotionBias[action.category] || 0;
    if (eBias !== 0) {
      score *= (1 + eBias);
    }

    // 2j. 抱负加成
    const aBias = aspirationBias[action.category] || 0;
    if (aBias !== 0) {
      score *= (1 + aBias);
    }

    // 2k. 每日计划加成
    const dBias = dailyBias[action.category] || 0;
    if (dBias !== 0) {
      score *= (1 + dBias);
    }

    // 2l. 心愿加成：如果该行动类别或具体行动匹配某个活跃心愿，+30%加成
    if (whimCategories.has(action.category) || whimActionIds.has(action.id)) {
      score *= 1.3;
    }

    // 2m. 关系加成：帮助朋友+bonus，仇人在场-penalty
    if (ctx.nearbyRelations && ctx.nearbyRelations.length > 0) {
      const hasCloseFriend = ctx.nearbyRelations.some(r => r.score >= 61);
      const hasEnemy = ctx.nearbyRelations.some(r => r.score <= -61);
      // 社交类行动：有朋友在场+bonus
      if (action.category === 'social' && hasCloseFriend) {
        score *= 1.2;
      }
      // 偷窃/攻击：仇人在场时不做（或+penalty）
      if ((action.id === 'steal' || action.id === 'fight' || action.id === 'attack') && hasEnemy) {
        score *= 0.6;
      }
      // 交易类：有朋友在场+bonus
      if (action.category === 'work' && hasCloseFriend) {
        score *= 1.1;
      }
    }

    // 2n. 压力修正：高压力降低工作类/社交类得分
    if (ctx.stressLevel !== undefined && ctx.stressLevel > 60) {
      const stressEffects = getStressEffects(ctx.stressLevel);
      if (action.category === 'work') {
        score *= stressEffects.focusModifier;
      }
      if (action.category === 'social') {
        score *= stressEffects.socialModifier;
      }
    }

    // 2o. 隐藏特征：高贪婪→赚钱行动+bonus，高荣耀→偷窃-penalty
    if (ctx.hiddenTraits) {
      const ht = ctx.hiddenTraits;
      // 贪婪：赚钱行动+bonus
      if (ht.greed > 70 && action.effects.copper && action.effects.copper > 0) {
        score *= 1 + (ht.greed - 70) * 0.005; // 最多 +15%
      }
      // 荣耀：偷窃-penalty
      if (ht.honor > 60 && (action.id === 'steal' || action.id === 'black_market')) {
        score *= 1 - (ht.honor - 60) * 0.01; // 最多 -40%
      }
      // 野心：工作类+bonus
      if (ht.ambition > 70 && action.category === 'work') {
        score *= 1 + (ht.ambition - 70) * 0.004;
      }
      // 理性：高疲劳时更倾向休息
      if (ht.rationality > 70 && ctx.needs.fatigue < 30 && action.category === 'work') {
        score *= 0.8;
      }
    }

    // 2m. 微量随机性（±10%）
    score *= 0.9 + Math.random() * 0.2;

    candidates.push({ action, score });
  }

  // 3. 排序选最优
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return fallbackAction(ctx);
  }

  // 4. softmax 温度选择从 top-5 中选
  const temperature = getTemperature(ctx.personality);
  const chosen = softmaxSelect(candidates, temperature);

  // 5. 检查是否完成心愿
  let completedWhim: { name: string; moodReward: number } | undefined;
  if (ctx.whims && ctx.whims.length > 0) {
    for (const w of ctx.whims) {
      if (w.relatedCategory === chosen.action.category || w.relatedActionId === chosen.action.id) {
        completedWhim = { name: w.name, moodReward: w.moodReward };
        break;
      }
    }
  }

  // 6. 推断目标（从行动反推）
  const goal = inferGoal(ctx, chosen.action);

  // 7. 生成叙事
  const narrative = chosen.action.narrative({
    npcName: ctx.npcName,
    profession: ctx.profession,
    location: ctx.currentGrid,
    weather: ctx.weather,
    shichen: ctx.shichen,
    day: ctx.day,
  });

  const result: DecisionResult = {
    goalId: goal.id,
    goalName: goal.name,
    actionId: chosen.action.id,
    actionName: chosen.action.name,
    narrative,
    effects: { ...chosen.action.effects },
  };
  if (completedWhim) {
    result.completedWhim = completedWhim;
    // 心愿完成：额外 mood 加成
    result.effects.mood = (result.effects.mood || 0) + completedWhim.moodReward;
  }

  return result;
}

/** 检查行动前置条件 */
function checkConditions(ctx: DecisionContext, action: NPCAction): boolean {
  const cond = action.conditions;
  if (cond.minCopper !== undefined && ctx.copper < cond.minCopper) return false;
  if (cond.minHunger !== undefined && ctx.needs.hunger < cond.minHunger) return false;
  if (cond.minHealth !== undefined && ctx.needs.health < cond.minHealth) return false;
  if (cond.atLocation && cond.atLocation.length > 0 && !cond.atLocation.includes(ctx.currentGrid)) return false;
  if (cond.profession && cond.profession.length > 0 && !cond.profession.includes(ctx.profession)) return false;
  if (cond.factionRole && cond.factionRole.length > 0 && (!ctx.factionRole || !cond.factionRole.includes(ctx.factionRole))) return false;
  if (cond.weather && cond.weather.length > 0 && !cond.weather.includes(ctx.weather)) return false;
  if (cond.timeOfDay === 'day' && !isDaytime(ctx.shichen)) return false;
  if (cond.timeOfDay === 'night' && isDaytime(ctx.shichen)) return false;
  return true;
}

function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

/** 职业对特定行动的额外加成分 */
function getProfessionActionBonus(profession: string, actionId: string): number {
  const BONUS: Record<string, Record<string, number>> = {
    merchant:   { sell_goods: 15, restock: 10, luxury_deal: 12, chat: 5 },
    guard:      { patrol: 15, report_crime: 10, chat: 3 },
    rogue:      { steal: 12, black_market: 10, flee: 5 },
    doctor:     { treat_patient: 15, gather_herbs: 8, sell_herbs: 6 },
    farmer:     { farm_work: 15, sell_goods: 5 },
    hunter:     { hunt: 15, track_animal: 8, gather_herbs: 5 },
    laborer:    { carry_cargo: 12, farm_work: 8 },
    blacksmith: { forge: 15, buy_material: 8, practice_craft: 10 },
    teacher:    { teach: 15, study: 10, chat: 5 },
    chef:       { cook: 15, buy_food: 8, sell_goods: 6 },
  };
  return (BONUS[profession] && BONUS[profession][actionId]) || 0;
}

/** 从行动反推目标名 */
function inferGoal(ctx: DecisionContext, action: NPCAction): { id: string; name: string } {
  // 找出该行动改善最紧急需求的那个需求
  let bestNeed = '';
  let bestScore = -Infinity;
  for (const key of NEED_KEYS) {
    const val = action.effects[key];
    if (val && val > 0) {
      const score = val * urgency((ctx.needs as any)[key]);
      if (score > bestScore) { bestScore = score; bestNeed = key; }
    }
  }

  const GOAL_NAMES: Record<string, string> = {
    hunger: '觅食', fatigue: '休息', health: '养生',
    mood: '寻乐', safety: '避险', social: '社交',
  };

  if (bestNeed) {
    return { id: action.category + '_' + bestNeed, name: GOAL_NAMES[bestNeed] || action.category };
  }
  return { id: action.category, name: action.name };
}

// ──── 演出库决策（优先于旧 decide）────
// 注意：SceneDecisionResult, NearbyNpcInfo, GoalCategory 已在文件头部从新模块导入
// SceneLibraryManager 实例由 worldEngine 创建并传入

export type { SceneDecisionResult, NearbyNpcInfo };

const NEED_TO_GOAL: Record<string, GoalCategory> = {
  hunger: 'survival',
  fatigue: 'move',
  health: 'survival',
  mood: 'leisure',
  safety: 'move',
  social: 'social',
};

export function decideWithScene(
  ctx: DecisionContext,
  nearbyNpcs: NearbyNpcInfo[],
  sceneLib?: SceneLibraryManager,
  season?: string,
  tick?: number,
): SceneDecisionResult | null {
  // 如果没有传入 SceneLibraryManager，回退到空（不使用演出库）
  if (!sceneLib) return null;

  // 1. 找最紧迫的需求 → 映射到 goalCategory
  let worstNeed = '';
  let worstVal = 100;
  for (const key of NEED_KEYS) {
    const val = (ctx.needs as any)[key] as number;
    if (val < worstVal) { worstVal = val; worstNeed = key; }
  }
  const goalCategory = NEED_TO_GOAL[worstNeed] || 'leisure';

  // 也试试社交（如果社交低）
  const categories: GoalCategory[] = [goalCategory];
  if (ctx.needs.social < 40 && goalCategory !== 'social') categories.push('social');
  if (ctx.needs.hunger < 40 && goalCategory !== 'survival') categories.push('survival');

  // 构建 actor 上下文
  const activeWhimCategories = new Set<string>();
  if (ctx.whims) {
    for (const w of ctx.whims) {
      if (w.relatedCategory) activeWhimCategories.add(w.relatedCategory);
    }
  }

  const actorContext = {
    traits: ctx.personality,
    profession: ctx.profession,
    npcName: ctx.npcName,
    copper: ctx.copper,
    health: ctx.needs.health,
    emotion: ctx.emotion || '',
    stress: ctx.stressLevel || 0,
    aspirationType: ctx.aspiration,
    aspirationProgress: undefined as number | undefined,
    currentGrid: ctx.currentGrid,
    shichen: ctx.shichen,
    weather: ctx.weather,
    season: season || '春',
    day: ctx.day,
    tick: tick || 0,
    factionId: ctx.factionId,
    nearbyCount: ctx.nearNpcCount,
    activeWhimCategories,
  };

  // 构建 stat lookup
  const actorStats: Record<string, number> = {
    bravery: ctx.personality.includes('勇敢') ? 80 : 40,
    cunning: ctx.personality.includes('狡猾') ? 80 : 40,
    eloquence: ctx.personality.includes('健谈') ? 80 : 40,
    cleverness: ctx.personality.includes('机灵') ? 80 : 40,
    medicine: ctx.profession === 'doctor' ? 80 : 40,
    patience: ctx.personality.includes('温和') ? 80 : 40,
    courage: ctx.personality.includes('勇敢') ? 80 : 40,
    social: ctx.needs.social,
    pity: ctx.personality.includes('善良') ? 80 : 40,
    aggression: ctx.personality.includes('暴躁') ? 80 : 40,
    strength: ctx.needs.health,
    wallet: ctx.copper,
    loyalty: ctx.hiddenTraits?.loyalty || 50,
    honor: ctx.hiddenTraits?.honor || 50,
  };

  const targetStatsLookup = (targetId: number): Record<string, number> => {
    const target = nearbyNpcs.find(n => n.id === targetId);
    return {
      alertness: target?.personality.includes('精明') ? 80 : 40,
      cleverness: target?.personality.includes('机灵') ? 80 : 40,
      courage: target?.personality.includes('勇敢') ? 80 : 40,
      kindness: target?.personality.includes('善良') ? 80 : 40,
      judgment: target?.personality.includes('精明') ? 80 : 40,
      disease: target ? 100 - target.health : 50,
      wallet: target?.copper || 50,
      shyness: target?.personality.includes('胆小') ? 80 : 40,
      talent: target?.personality.includes('勤劳') ? 80 : 40,
      strength: target?.health || 50,
      stinginess: target?.personality.includes('吝啬') ? 80 : 40,
    };
  };

  // 通过 SceneLibraryManager 匹配
  const result = sceneLib.matchL0(categories, actorContext, nearbyNpcs, actorStats, targetStatsLookup);

  if (result) {
    // 重新格式化叙事，用真实NPC名字
    const vars: Record<string, string> = {
      npcName: ctx.npcName,
      targetName: result.targetName || '路人',
      location: ctx.currentGrid,
      weather: ctx.weather,
      shichen: ctx.shichen,
      day: String(ctx.day),
    };
    result.narrative = formatNarrative(result.narrative, vars);
  }

  return result;
}

function fallbackAction(ctx: DecisionContext): DecisionResult {
  const isNight = ['子', '丑', '寅', '亥'].includes(ctx.shichen);
  const isRain = ctx.weather === '暴雨' || ctx.weather === '小雨';

  if (isNight) {
    return {
      goalId: 'idle', goalName: '闲逛',
      actionId: 'rest', actionName: '歇息',
      narrative: `${ctx.npcName}找了个避风处坐下来，${isRain ? '听着雨声' : '看着夜色'}，消磨时光。`,
      effects: { fatigue: 8, mood: 2 },
    };
  }
  return {
    goalId: 'idle', goalName: '闲逛',
    actionId: 'stroll', actionName: '散步',
    narrative: `${ctx.npcName}在街上闲逛，东看看西看看。`,
    effects: { mood: 5, fatigue: -3 },
  };
}
