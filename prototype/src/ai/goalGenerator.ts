// === NPC 目标生成器 — 需求/职业/身份/环境四维度 ===

import { NeedsComponent } from '../ecs/types';

export interface NPCGoal {
  id: string;
  name: string;
  priority: number;
  category: 'survival' | 'work' | 'social' | 'family' | 'faction' | 'leisure';
  targetNeed: string; // 要改善的需求名
  targetValue: number; // 目标值
}

// 需求权重表（按职业）
const NEED_WEIGHTS: Record<string, Record<string, number>> = {
  merchant:   { hunger: 1.0, fatigue: 0.8, health: 1.0, mood: 0.7, safety: 0.6, social: 0.8 },
  guard:      { hunger: 1.0, fatigue: 0.6, health: 1.2, mood: 0.5, safety: 1.5, social: 0.6 },
  rogue:      { hunger: 1.2, fatigue: 0.7, health: 0.8, mood: 0.9, safety: 1.0, social: 0.5 },
  doctor:     { hunger: 0.8, fatigue: 0.9, health: 1.5, mood: 0.6, safety: 0.7, social: 0.8 },
  farmer:     { hunger: 1.3, fatigue: 0.5, health: 1.0, mood: 0.6, safety: 0.8, social: 0.7 },
  hunter:     { hunger: 1.0, fatigue: 0.6, health: 1.0, mood: 0.5, safety: 1.2, social: 0.4 },
  laborer:    { hunger: 1.3, fatigue: 0.5, health: 1.0, mood: 0.5, safety: 0.7, social: 0.6 },
  blacksmith: { hunger: 1.0, fatigue: 0.6, health: 1.2, mood: 0.5, safety: 0.8, social: 0.5 },
  teacher:    { hunger: 0.8, fatigue: 0.8, health: 1.0, mood: 0.8, safety: 0.6, social: 1.0 },
};

// 性格修正系数
const PERSONALITY_MODIFIERS: Record<string, Record<string, number>> = {
  '胆小': { safety: 1.5, social: 0.8 },
  '勇敢': { safety: 0.7, social: 1.2 },
  '大方': { social: 1.3, mood: 1.1 },
  '沉默': { social: 0.6, mood: 0.9 },
  '狡猾': { mood: 1.1, safety: 1.1 },
  '温和': { social: 1.2, mood: 1.1 },
  '暴躁': { safety: 0.8, mood: 0.8 },
  '机灵': { social: 1.1, mood: 1.2 },
};

// 判断是否为白天
function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

/**
 * 从需求/职业/身份/环境四个维度生成候选目标列表
 * @param needs 需求组件
 * @param profession 职业
 * @param personality 性格特征列表
 * @param factionRole 组织角色
 * @param copper 铜钱数
 * @param weather 当前天气
 * @param shichen 当前时辰
 * @returns 候选目标列表（按优先级降序排列）
 */
export function generateGoals(
  needs: NeedsComponent,
  profession: string,
  personality: string[],
  factionRole: string | undefined,
  copper: number,
  weather: string,
  shichen: string,
): NPCGoal[] {
  const goals: NPCGoal[] = [];

  // 获取需求权重（职业 + 性格修正）
  const baseWeights = NEED_WEIGHTS[profession] || NEED_WEIGHTS['merchant'];
  const weights = { ...baseWeights };
  for (const trait of personality) {
    const mod = PERSONALITY_MODIFIERS[trait];
    if (mod) {
      for (const [key, val] of Object.entries(mod)) {
        if (weights[key] !== undefined) {
          weights[key] *= val;
        }
      }
    }
  }

  // ──── 维度1: 需求驱动目标 ────
  // 饥饿
  if (needs.hunger < 30) {
    goals.push({
      id: 'find_food', name: '找食物',
      priority: Math.round((80 + (30 - needs.hunger) * 2) * (weights.hunger || 1)),
      category: 'survival', targetNeed: 'hunger', targetValue: 60,
    });
  }
  // 疲劳
  if (needs.fatigue < 25) {
    goals.push({
      id: 'rest_up', name: '休息',
      priority: Math.round((70 + (25 - needs.fatigue) * 2) * (weights.fatigue || 1)),
      category: 'survival', targetNeed: 'fatigue', targetValue: 60,
    });
  }
  // 健康
  if (needs.health < 40) {
    goals.push({
      id: 'seek_medicine', name: '求医',
      priority: Math.round((60 + (40 - needs.health) * 1.5) * (weights.health || 1)),
      category: 'survival', targetNeed: 'health', targetValue: 60,
    });
  }
  // 心情
  if (needs.mood < 30) {
    goals.push({
      id: 'cheer_up', name: '改善心情',
      priority: Math.round((35 + (30 - needs.mood)) * (weights.mood || 1)),
      category: 'leisure', targetNeed: 'mood', targetValue: 50,
    });
  }
  // 安全
  if (needs.safety < 30) {
    goals.push({
      id: 'seek_safety', name: '寻求安全',
      priority: Math.round((40 + (30 - needs.safety)) * (weights.safety || 1)),
      category: 'survival', targetNeed: 'safety', targetValue: 50,
    });
  }
  // 社交
  if (needs.social < 30) {
    goals.push({
      id: 'socialize', name: '社交',
      priority: Math.round((35 + (30 - needs.social)) * (weights.social || 1)),
      category: 'social', targetNeed: 'social', targetValue: 50,
    });
  }

  // ──── 维度2: 职业驱动目标 ────
  if (profession === 'merchant') {
    if (copper < 20) {
      goals.push({ id: 'earn_money', name: '赚钱', priority: 50, category: 'work', targetNeed: 'hunger', targetValue: 60 });
    }
    goals.push({ id: 'sell_merchandise', name: '卖货', priority: 55, category: 'work', targetNeed: 'mood', targetValue: 60 });
  } else if (profession === 'guard') {
    if (isDaytime(shichen)) {
      goals.push({ id: 'patrol_duty', name: '巡逻', priority: 45, category: 'work', targetNeed: 'safety', targetValue: 60 });
    }
  } else if (profession === 'rogue') {
    if (copper < 30) {
      goals.push({ id: 'steal_money', name: '偷窃', priority: 40, category: 'work', targetNeed: 'hunger', targetValue: 55 });
    }
  } else if (profession === 'doctor') {
    goals.push({ id: 'practice_medicine', name: '行医', priority: 45, category: 'work', targetNeed: 'mood', targetValue: 55 });
  } else if (profession === 'farmer') {
    if (isDaytime(shichen)) {
      goals.push({ id: 'work_farm', name: '务农', priority: 45, category: 'work', targetNeed: 'hunger', targetValue: 55 });
    }
  } else if (profession === 'hunter') {
    if (weather !== '暴雨') {
      goals.push({ id: 'go_hunting', name: '打猎', priority: 45, category: 'work', targetNeed: 'hunger', targetValue: 55 });
    }
  } else if (profession === 'laborer') {
    goals.push({ id: 'find_work', name: '找活干', priority: 45, category: 'work', targetNeed: 'hunger', targetValue: 55 });
  } else if (profession === 'blacksmith') {
    goals.push({ id: 'forge_items', name: '锻造', priority: 45, category: 'work', targetNeed: 'mood', targetValue: 55 });
  } else if (profession === 'teacher') {
    if (isDaytime(shichen)) {
      goals.push({ id: 'teach_students', name: '授课', priority: 35, category: 'work', targetNeed: 'social', targetValue: 55 });
    }
  }

  // ──── 维度3: 身份驱动目标 ────
  // 组织首领
  if (factionRole === 'leader') {
    goals.push({ id: 'manage_faction', name: '管理组织', priority: 50, category: 'faction', targetNeed: 'mood', targetValue: 55 });
  }
  // 组织成员
  if (factionRole === 'member') {
    if (copper < 20) {
      goals.push({ id: 'collect_salary', name: '领俸禄', priority: 40, category: 'faction', targetNeed: 'hunger', targetValue: 50 });
    }
  }

  // ──── 维度4: 环境驱动目标 ────
  // 恶劣天气 → 避险
  if (weather === '暴雨' || weather === '大雨') {
    goals.push({ id: 'shelter_from_storm', name: '避雨', priority: 60, category: 'survival', targetNeed: 'safety', targetValue: 60 });
  }
  // 深夜 → 回家
  if (['子', '丑', '寅'].includes(shichen)) {
    goals.push({ id: 'go_home_sleep', name: '回家睡觉', priority: 55, category: 'survival', targetNeed: 'fatigue', targetValue: 60 });
  }
  // 心情一般 + 有钱 → 去茶馆
  if (needs.mood < 50 && copper >= 5) {
    goals.push({ id: 'visit_teahouse', name: '去茶馆', priority: 30, category: 'leisure', targetNeed: 'mood', targetValue: 55 });
  }

  // 按优先级降序排列
  goals.sort((a, b) => b.priority - a.priority);

  return goals;
}
