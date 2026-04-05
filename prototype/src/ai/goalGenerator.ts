// === NPC 目标生成器 v2 — 个性化决策 ===

import { NeedsComponent } from '../ecs/types';

export interface NPCGoal {
  id: string;
  name: string;
  priority: number;
  category: 'survival' | 'work' | 'social' | 'family' | 'faction' | 'leisure';
  targetNeed: string;
  targetValue: number;
}

// 职业核心需求：每个职业最关注的1~2个需求
const PROFESSION_CORE_NEEDS: Record<string, string[]> = {
  merchant:   ['mood', 'social'],   // 商人关注心情和社交
  guard:      ['safety', 'mood'],   // 守卫关注安全和心情
  rogue:      ['safety', 'mood'],   // 盗贼关注安全和心情
  doctor:     ['health', 'social'], // 大夫关注健康和社交
  farmer:     ['hunger', 'mood'],   // 农夫关注温饱和心情
  hunter:     ['safety', 'hunger'], // 猎人关注安全和温饱
  laborer:    ['hunger', 'fatigue'],// 苦力关注温饱和休息
  blacksmith: ['mood', 'fatigue'],  // 铁匠关注心情和休息
  teacher:    ['social', 'mood'],   // 先生关注社交和心情
  chef:       ['hunger', 'mood'],   // 厨子关注吃和心情
  scholar:    ['mood', 'social'],   // 学者关注心情和社交
};

// 性格对各类目标的影响
const PERSONALITY_GOAL_BIAS: Record<string, Record<string, number>> = {
  '胆小': { safety: 1.8, social: 0.7, work: 0.8 },
  '勇敢': { safety: 0.6, social: 1.2, work: 1.1 },
  '大方': { social: 1.5, leisure: 1.3, work: 0.8 },
  '沉默': { social: 0.5, leisure: 0.7, work: 1.1 },
  '狡猾': { work: 1.4, safety: 1.2, social: 0.8 },
  '温和': { social: 1.3, leisure: 1.2, work: 0.9 },
  '暴躁': { safety: 0.7, social: 0.7, work: 1.2 },
  '机灵': { social: 1.2, work: 1.3, leisure: 1.1 },
  '正直': { safety: 1.3, social: 1.0, work: 1.1 },
  '精明': { work: 1.5, leisure: 0.7, social: 0.9 },
};

function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

// 获取性格对目标类别的影响因子
function getPersonalityFactor(personality: string[], category: string): number {
  let factor = 1.0;
  for (const trait of personality) {
    const bias = PERSONALITY_GOAL_BIAS[trait];
    if (bias && bias[category]) factor *= bias[category];
  }
  return factor;
}

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
  const isDay = isDaytime(shichen);
  const isNight = ['子', '丑', '寅', '亥'].includes(shichen);
  const isStorm = weather === '暴雨' || weather === '大暴雨';
  const isRain = isStorm || weather === '小雨';
  const coreNeeds = PROFESSION_CORE_NEEDS[profession] || ['mood'];

  // ──── 紧急生存目标（需求<30时触发，高优先级）────
  if (needs.hunger < 25) {
    const urgency = (25 - needs.hunger) * 3;
    goals.push({
      id: 'find_food', name: '找食物',
      priority: 70 + urgency,
      category: 'survival', targetNeed: 'hunger', targetValue: 60,
    });
  }
  if (needs.fatigue < 20) {
    const urgency = (20 - needs.fatigue) * 3;
    goals.push({
      id: 'rest_up', name: '休息',
      priority: 65 + urgency,
      category: 'survival', targetNeed: 'fatigue', targetValue: 60,
    });
  }
  if (needs.health < 30) {
    const urgency = (30 - needs.health) * 2;
    goals.push({
      id: 'seek_medicine', name: '求医',
      priority: 60 + urgency,
      category: 'survival', targetNeed: 'health', targetValue: 60,
    });
  }

  // ──── 职业日常目标（根据时间和职业动态调整）────
  // 商人：白天卖货，有钱进货
  if (profession === 'merchant') {
    if (isDay && !isRain) {
      goals.push({
        id: 'sell_merchandise', name: '摆摊卖货',
        priority: 50 + Math.min(20, copper < 30 ? 15 : 0) + getPersonalityFactor(personality, 'work') * 10,
        category: 'work', targetNeed: 'mood', targetValue: 60,
      });
    }
    if (copper >= 20) {
      goals.push({
        id: 'restock_goods', name: '进货补货',
        priority: 45 + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'mood', targetValue: 55,
      });
    }
    if (copper >= 100) {
      goals.push({
        id: 'luxury_deal', name: '大笔交易',
        priority: 42 + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'mood', targetValue: 55,
      });
    }
  }

  // 守卫：白天巡逻，夜晚换班/休息
  if (profession === 'guard') {
    if (isDay) {
      goals.push({
        id: 'patrol_duty', name: '巡逻值勤',
        priority: 52 + getPersonalityFactor(personality, 'work') * 10,
        category: 'work', targetNeed: 'safety', targetValue: 60,
      });
    } else {
      goals.push({
        id: 'night_watch', name: '夜间值守',
        priority: 40 + getPersonalityFactor(personality, 'safety') * 8,
        category: 'work', targetNeed: 'safety', targetValue: 55,
      });
    }
    if (isDay && copper < 30) {
      goals.push({
        id: 'collect_salary', name: '领饷',
        priority: 38,
        category: 'work', targetNeed: 'hunger', targetValue: 50,
      });
    }
  }

  // 盗贼：偷窃/黑市
  if (profession === 'rogue') {
    if (isNight || isRain) { // 夜间或雨天作案
      goals.push({
        id: 'steal_undercover', name: '暗中行窃',
        priority: 48 + (copper < 20 ? 15 : 0) + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'hunger', targetValue: 55,
      });
    }
    if (copper >= 10) {
      goals.push({
        id: 'black_market', name: '黑市交易',
        priority: 40 + getPersonalityFactor(personality, 'work') * 6,
        category: 'work', targetNeed: 'mood', targetValue: 50,
      });
    }
  }

  // 大夫：行医/采药
  if (profession === 'doctor') {
    goals.push({
      id: 'practice_medicine', name: '看诊治病',
      priority: 48 + getPersonalityFactor(personality, 'work') * 8,
      category: 'work', targetNeed: 'health', targetValue: 55,
    });
    if (isDay && !isRain) {
      goals.push({
        id: 'gather_herbs', name: '上山采药',
        priority: 42 + getPersonalityFactor(personality, 'work') * 6,
        category: 'work', targetNeed: 'health', targetValue: 50,
      });
    }
  }

  // 农夫：白天务农
  if (profession === 'farmer') {
    if (isDay && !isStorm) {
      goals.push({
        id: 'work_farm', name: '下地干活',
        priority: 50 + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'hunger', targetValue: 55,
      });
    }
    if (!isDay) {
      goals.push({
        id: 'rest_home', name: '在家歇息',
        priority: 40 + getPersonalityFactor(personality, 'leisure') * 5,
        category: 'leisure', targetNeed: 'fatigue', targetValue: 55,
      });
    }
  }

  // 猎人：打猎
  if (profession === 'hunter') {
    if (isDay && !isStorm) {
      goals.push({
        id: 'go_hunting', name: '进山打猎',
        priority: 50 + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'hunger', targetValue: 55,
      });
    }
    if (isDay) {
      goals.push({
        id: 'track_animal', name: '追踪猎物',
        priority: 42 + getPersonalityFactor(personality, 'work') * 6,
        category: 'work', targetNeed: 'safety', targetValue: 50,
      });
    }
  }

  // 苦力：搬货
  if (profession === 'laborer') {
    goals.push({
      id: 'find_labor', name: '找活干',
      priority: 48 + (copper < 15 ? 12 : 0) + getPersonalityFactor(personality, 'work') * 8,
      category: 'work', targetNeed: 'hunger', targetValue: 55,
    });
  }

  // 铁匠：锻造
  if (profession === 'blacksmith') {
    if (isDay) {
      goals.push({
        id: 'forge_items', name: '打铁锻造',
        priority: 50 + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'mood', targetValue: 55,
      });
    }
  }

  // 先生：授课
  if (profession === 'teacher') {
    if (isDay) {
      goals.push({
        id: 'teach_students', name: '教书授课',
        priority: 48 + getPersonalityFactor(personality, 'work') * 8,
        category: 'work', targetNeed: 'social', targetValue: 55,
      });
    }
    goals.push({
      id: 'study_books', name: '研读典籍',
      priority: 35 + getPersonalityFactor(personality, 'leisure') * 5,
      category: 'leisure', targetNeed: 'mood', targetValue: 50,
    });
  }

  // ──── 社交目标（受性格和需求影响）────
  if (needs.social < 40) {
    goals.push({
      id: 'socialize', name: '找人聊天',
      priority: 30 + (40 - needs.social) + getPersonalityFactor(personality, 'social') * 8,
      category: 'social', targetNeed: 'social', targetValue: 50,
    });
  }
  // 去茶馆（心情低或有钱想享受）
  if (needs.mood < 50 && copper >= 5) {
    goals.push({
      id: 'visit_teahouse', name: '去茶馆坐坐',
      priority: 28 + (50 - needs.mood) * 0.5 + getPersonalityFactor(personality, 'leisure') * 6,
      category: 'leisure', targetNeed: 'mood', targetValue: 55,
    });
  }
  // 喝酒（心情很低）
  if (needs.mood < 30 && copper >= 5) {
    goals.push({
      id: 'drink_alcohol', name: '借酒浇愁',
      priority: 32 + (30 - needs.mood) * 0.5 + getPersonalityFactor(personality, 'leisure') * 5,
      category: 'leisure', targetNeed: 'mood', targetValue: 55,
    });
  }

  // ──── 组织目标 ────
  if (factionRole === 'leader') {
    goals.push({
      id: 'manage_faction', name: '管理组织事务',
      priority: 45 + getPersonalityFactor(personality, 'work') * 6,
      category: 'faction', targetNeed: 'mood', targetValue: 55,
    });
  }

  // ──── 环境目标 ────
  if (isStorm) {
    goals.push({
      id: 'shelter_from_storm', name: '躲避暴风雨',
      priority: 58, // 不再压倒一切，职业目标可能更高
      category: 'survival', targetNeed: 'safety', targetValue: 60,
    });
  }
  if (isNight && needs.fatigue < 50) {
    goals.push({
      id: 'go_home_sleep', name: '回家歇息',
      priority: 40 + (50 - needs.fatigue) * 0.3,
      category: 'survival', targetNeed: 'fatigue', targetValue: 60,
    });
  }

  // ──── 个人偏好目标（性格驱动）────
  // 胆小的人想待在安全的地方
  if (personality.includes('胆小') && needs.safety < 60) {
    goals.push({
      id: 'stay_safe', name: '待在安全处',
      priority: 35 + (60 - needs.safety) * 0.5,
      category: 'survival', targetNeed: 'safety', targetValue: 55,
    });
  }
  // 大方的人想请客
  if (personality.includes('大方') && copper >= 30 && needs.social < 60) {
    goals.push({
      id: 'treat_friends', name: '请朋友吃饭',
      priority: 30 + getPersonalityFactor(personality, 'social') * 8,
      category: 'social', targetNeed: 'social', targetValue: 55,
    });
  }
  // 精明的人想赚钱
  if (personality.includes('精明') && copper < 50) {
    goals.push({
      id: 'hustle_money', name: '琢磨赚钱门路',
      priority: 35 + (50 - copper) * 0.2 + getPersonalityFactor(personality, 'work') * 5,
      category: 'work', targetNeed: 'mood', targetValue: 50,
    });
  }

  // 加入微量随机性（±3），打破完全相同的优先级
  for (const g of goals) {
    g.priority += Math.floor(Math.random() * 7) - 3;
  }

  // 按优先级降序排列
  goals.sort((a, b) => b.priority - a.priority);

  return goals;
}
