// === NPC 决策引擎 v2 — 个性化行动选择 ===

import { NeedsComponent } from '../ecs/types';
import { generateGoals, NPCGoal } from './goalGenerator';
import { ALL_ACTIONS, NPCAction } from './actionRegistry';

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
}

export interface DecisionResult {
  goalId: string;
  goalName: string;
  actionId: string;
  actionName: string;
  narrative: string;
  effects: Record<string, number>;
}

function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

// 职业对行动类别的偏好倍率
const PROFESSION_ACTION_BIAS: Record<string, Record<string, number>> = {
  merchant:   { work: 1.5, social: 1.2, leisure: 1.0, survival: 0.8 },
  guard:      { work: 1.4, survival: 1.3, social: 0.9, leisure: 0.7 },
  rogue:      { work: 1.3, survival: 1.2, social: 0.8, leisure: 0.9 },
  doctor:     { work: 1.5, social: 1.1, leisure: 0.8, survival: 0.9 },
  farmer:     { work: 1.4, survival: 1.2, social: 0.7, leisure: 0.8 },
  hunter:     { work: 1.4, survival: 1.3, social: 0.6, leisure: 0.7 },
  laborer:    { work: 1.3, survival: 1.2, social: 0.7, leisure: 0.6 },
  blacksmith: { work: 1.5, survival: 0.9, social: 0.7, leisure: 0.8 },
  teacher:    { work: 1.3, social: 1.4, leisure: 1.1, survival: 0.8 },
  chef:       { work: 1.4, social: 1.0, leisure: 0.8, survival: 0.9 },
  scholar:    { work: 1.2, social: 1.1, leisure: 1.3, survival: 0.7 },
};

export function decide(ctx: DecisionContext): DecisionResult | null {
  const goals = generateGoals(
    ctx.needs, ctx.profession, ctx.personality, ctx.factionRole,
    ctx.copper, ctx.weather, ctx.shichen,
  );

  if (goals.length === 0) {
    return fallbackAction(ctx);
  }

  // 尝试 top-3 目标（不只是 top-1），找到有可用行动的第一个
  const topGoals = goals.slice(0, Math.min(3, goals.length));
  for (const goal of topGoals) {
    const action = pickBestAction(ctx, goal);
    if (action) {
      const narrative = action.narrative({
        npcName: ctx.npcName,
        profession: ctx.profession,
        location: ctx.currentGrid,
        weather: ctx.weather,
        shichen: ctx.shichen,
        day: ctx.day,
      });
      return {
        goalId: goal.id,
        goalName: goal.name,
        actionId: action.id,
        actionName: action.name,
        narrative,
        effects: { ...action.effects },
      };
    }
  }

  return fallbackAction(ctx);
}

function pickBestAction(ctx: DecisionContext, goal: NPCGoal): NPCAction | null {
  const candidates: { action: NPCAction; utility: number }[] = [];

  for (const action of ALL_ACTIONS) {
    if (!checkConditions(ctx, action)) continue;
    const utility = calcUtility(ctx, goal, action);
    candidates.push({ action, utility });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.utility - a.utility);

  // top-3 行动中按权重随机选择（增加多样性）
  const top = candidates.slice(0, Math.min(3, candidates.length));
  if (top.length === 1) return top[0].action;

  // 90%概率选最优，10%概率选次优（避免完全确定性）
  if (Math.random() < 0.9 || top.length < 2) {
    return top[0].action;
  }
  return top[1].action;
}

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

function calcUtility(ctx: DecisionContext, goal: NPCGoal, action: NPCAction): number {
  let benefit = 0;

  // 1. 目标需求改善量（主要因素）
  if (action.effects[goal.targetNeed] !== undefined) {
    benefit += Math.abs(action.effects[goal.targetNeed]) * 2.0;
  }

  // 2. 附带需求改善（次要因素）
  for (const need of action.targetNeeds) {
    if (need !== goal.targetNeed && action.effects[need] !== undefined) {
      benefit += Math.abs(action.effects[need]) * 0.4;
    }
  }

  // 3. 职业匹配度奖励
  const profBias = PROFESSION_ACTION_BIAS[ctx.profession] || {};
  const catBonus = profBias[action.category] || 1.0;
  benefit *= catBonus;

  // 4. 类别匹配奖励
  if (goal.category === action.category) {
    benefit += 8;
  }

  // 5. 性格对行动的影响
  if (ctx.personality.includes('胆小') && action.category === 'survival') benefit *= 1.3;
  if (ctx.personality.includes('勇敢') && action.category === 'work') benefit *= 1.2;
  if (ctx.personality.includes('大方') && (action.id === 'drink' || action.id === 'chat')) benefit *= 1.3;
  if (ctx.personality.includes('精明') && action.effects.copper && action.effects.copper > 0) benefit *= 1.3;
  if (ctx.personality.includes('暴躁') && action.id === 'steal') benefit *= 1.2;

  // 6. 成本
  let cost = 0;
  if (action.cost.copper && action.cost.copper > 0) {
    // 穷人对花钱更敏感
    cost += action.cost.copper * (ctx.copper < 30 ? 1.0 : 0.3);
  }
  if (action.cost.fatigue && action.cost.fatigue > 0) {
    const fatigueMult = ctx.needs.fatigue < 30 ? 2.5 : ctx.needs.fatigue < 50 ? 1.5 : 1.0;
    cost += action.cost.fatigue * 0.4 * fatigueMult;
  }

  return benefit - cost;
}

function fallbackAction(ctx: DecisionContext): DecisionResult {
  // 根据时间和环境选不同的兜底行动
  const isNight = ['子', '丑', '寅', '亥'].includes(ctx.shichen);
  const isRain = ctx.weather === '暴雨' || ctx.weather === '小雨' || ctx.weather === '大暴雨';

  if (isNight) {
    return {
      goalId: 'idle', goalName: '闲逛',
      actionId: 'rest', actionName: '歇息',
      narrative: `${ctx.npcName}找了个避风处坐下来，${isRain ? '听着雨声' : '看着夜色'}，消磨着漫漫长夜。`,
      effects: { fatigue: 8, mood: 2 },
    };
  }
  if (isRain) {
    return {
      goalId: 'idle', goalName: '闲逛',
      actionId: 'rest', actionName: '避雨歇息',
      narrative: `${ctx.npcName}在屋檐下避雨，百无聊赖地望着灰蒙蒙的天。`,
      effects: { fatigue: 5, mood: -2 },
    };
  }
  return {
    goalId: 'idle', goalName: '闲逛',
    actionId: 'stroll', actionName: '散步',
    narrative: `${ctx.npcName}在街上闲逛，${ctx.weather === '晴' ? '阳光正好' : '天色阴沉'}，东看看西看看，消磨时光。`,
    effects: { mood: 5, fatigue: -3 },
  };
}
