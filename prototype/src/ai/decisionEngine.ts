// === NPC 决策引擎 — 目标驱动 + 行动选择 ===

import { NeedsComponent } from '../ecs/types';
import { generateGoals, NPCGoal } from './goalGenerator';
import { ALL_ACTIONS, NPCAction, ActionContext } from './actionRegistry';

// 决策上下文：NPC 当前的全部环境信息
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

// 决策结果
export interface DecisionResult {
  goalId: string;
  goalName: string;
  actionId: string;
  actionName: string;
  narrative: string;
  effects: Record<string, number>;
}

// 判断是否白天
function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

/**
 * 核心决策函数：根据上下文选出最优目标和行动
 *
 * 流程：
 * 1. 调用 goalGenerator.generateGoals() 获取候选目标
 * 2. 取 priority 最高的目标
 * 3. 从 actionRegistry 筛选满足条件的行动
 * 4. 按 utility = 目标需求改善量 - cost 排序
 * 5. 选最优行动
 * 6. 生成叙事文本
 */
export function decide(ctx: DecisionContext): DecisionResult | null {
  // 1. 生成候选目标
  const goals = generateGoals(
    ctx.needs,
    ctx.profession,
    ctx.personality,
    ctx.factionRole,
    ctx.copper,
    ctx.weather,
    ctx.shichen,
  );

  // 没有目标 → 默认闲逛
  if (goals.length === 0) {
    return fallbackStroll(ctx);
  }

  // 2. 对每个目标（从高优先级开始），尝试找到匹配行动
  for (const goal of goals) {
    const action = pickBestAction(ctx, goal);
    if (action) {
      // 生成叙事
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

  // 所有目标都没有可用行动 → 闲逛
  return fallbackStroll(ctx);
}

/** 筛选并排序：为目标选出最优行动 */
function pickBestAction(ctx: DecisionContext, goal: NPCGoal): NPCAction | null {
  const candidates: { action: NPCAction; utility: number }[] = [];

  for (const action of ALL_ACTIONS) {
    // 检查条件是否满足
    if (!checkConditions(ctx, action)) continue;

    // 计算该行动对这个目标的效用值
    const utility = calcUtility(ctx, goal, action);
    candidates.push({ action, utility });
  }

  if (candidates.length === 0) return null;

  // 按效用值降序排列
  candidates.sort((a, b) => b.utility - a.utility);
  return candidates[0].action;
}

/** 检查行动的前置条件 */
function checkConditions(ctx: DecisionContext, action: NPCAction): boolean {
  const cond = action.conditions;

  // 铜钱下限
  if (cond.minCopper !== undefined && ctx.copper < cond.minCopper) return false;

  // 饥饿度下限
  if (cond.minHunger !== undefined && ctx.needs.hunger < cond.minHunger) return false;

  // 健康下限
  if (cond.minHealth !== undefined && ctx.needs.health < cond.minHealth) return false;

  // 位置限制
  if (cond.atLocation && cond.atLocation.length > 0) {
    if (!cond.atLocation.includes(ctx.currentGrid)) return false;
  }

  // 职业限制
  if (cond.profession && cond.profession.length > 0) {
    if (!cond.profession.includes(ctx.profession)) return false;
  }

  // 组织角色限制
  if (cond.factionRole && cond.factionRole.length > 0) {
    if (!ctx.factionRole || !cond.factionRole.includes(ctx.factionRole)) return false;
  }

  // 天气限制
  if (cond.weather && cond.weather.length > 0) {
    if (!cond.weather.includes(ctx.weather)) return false;
  }

  // 昼夜限制
  if (cond.timeOfDay === 'day' && !isDaytime(ctx.shichen)) return false;
  if (cond.timeOfDay === 'night' && isDaytime(ctx.shichen)) return false;

  return true;
}

/**
 * 计算行动效用值
 * utility = 目标需求改善量 - cost
 */
function calcUtility(ctx: DecisionContext, goal: NPCGoal, action: NPCAction): number {
  let benefit = 0;

  // 行动对目标需求的改善量
  if (action.effects[goal.targetNeed] !== undefined) {
    benefit += action.effects[goal.targetNeed];
  }

  // 行动对其他相关需求的改善（减半计算）
  for (const need of action.targetNeeds) {
    if (need !== goal.targetNeed && action.effects[need] !== undefined) {
      benefit += action.effects[need] * 0.3;
    }
  }

  // 铜钱成本惩罚
  let cost = 0;
  if (action.cost.copper && action.cost.copper > 0) {
    cost += action.cost.copper * 0.5;
  }

  // 疲劳成本惩罚
  if (action.cost.fatigue && action.cost.fatigue > 0) {
    // 如果疲劳已经很低，惩罚更大
    const fatiguePenalty = ctx.needs.fatigue < 30 ? 2.0 : 1.0;
    cost += action.cost.fatigue * 0.3 * fatiguePenalty;
  }

  // 类别匹配奖励：目标类别和行动类别一致时有额外加分
  if (goal.category === action.category) {
    benefit += 5;
  }

  return benefit - cost;
}

/** 兜底：闲逛 */
function fallbackStroll(ctx: DecisionContext): DecisionResult {
  return {
    goalId: 'idle',
    goalName: '闲逛',
    actionId: 'stroll',
    actionName: '散步',
    narrative: `${ctx.npcName}在街上闲逛，${ctx.weather === '晴' ? '阳光正好' : '天色阴沉'}，东看看西看看，消磨时光。`,
    effects: { mood: 5, fatigue: -5 },
  };
}
