// === NPC 多步演出选择 AI ===
//
// 确定性、性格驱动的选项评分。无随机。
// 给定 NPC 上下文和当前阶段的选项列表，返回最佳选择。

import type { L0SceneChoice, L0SceneConsequence } from './types';
import type { EmotionType } from '../../ecs/types';

// ════════════════════════════════════════
// NPC 选择上下文
// ════════════════════════════════════════

export interface NPCChoiceContext {
  traits: string[];
  profession: string;
  emotion: EmotionType;
  needs: { hunger: number; fatigue: number; health: number; mood: number; safety: number; social: number };
  hiddenTraits: { rationality: number; greed: number; honor: number; ambition: number; loyalty: number };
  stress: number;
  copper: number;
  relationToTarget?: number;  // 关系分数 -100 ~ +100
  /** 演出中之前的选择历史 */
  history: { choiceId: string; chooser: string }[];
}

// ════════════════════════════════════════
// 性格→选项关键词映射
// ════════════════════════════════════════

const PERSONALITY_CHOICE_BIAS: Record<string, {
  positiveKeywords: string[];
  negativeKeywords: string[];
  effectPrefs: Record<string, number>;
}> = {
  '勇敢': {
    positiveKeywords: ['追', '打', '对抗', '冲', '搏', '战', '揭', '救', '帮忙', '出面'],
    negativeKeywords: ['逃', '躲', '求', '交钱', '算了', '走开', '不管', '假装'],
    effectPrefs: { mood: 1.3, social: 1.1, health: 0.8, safety: 0.7 },
  },
  '胆小': {
    positiveKeywords: ['逃', '躲', '避开', '算了', '走开', '不关', '等', '求'],
    negativeKeywords: ['追', '打', '对抗', '冲', '搏', '战', '揭'],
    effectPrefs: { safety: 1.5, health: 1.3, mood: 0.8, social: 0.7 },
  },
  '狡猾': {
    positiveKeywords: ['悄悄', '暗中', '设', '计', '趁', '骗', '偷', '绕'],
    negativeKeywords: ['大声', '正面', '冲', '直接', '老实'],
    effectPrefs: { mood: 1.2, copper: 1.3, social: 0.9 },
  },
  '善良': {
    positiveKeywords: ['帮', '救', '施', '给', '请', '劝', '安慰', '提醒'],
    negativeKeywords: ['骗', '偷', '抢', '不管', '走开', '抢夺'],
    effectPrefs: { social: 1.4, mood: 1.2, copper: 0.7 },
  },
  '暴躁': {
    positiveKeywords: ['打', '骂', '冲', '怒', '揍', '揭', '大声', '对质'],
    negativeKeywords: ['忍', '等', '求', '低声', '悄悄', '调解'],
    effectPrefs: { mood: 1.1, social: 0.8, health: 0.9 },
  },
  '温和': {
    positiveKeywords: ['劝', '调解', '商量', '安抚', '请', '温和', '说理'],
    negativeKeywords: ['打', '骂', '冲', '怒', '威胁', '暴力'],
    effectPrefs: { social: 1.4, mood: 1.3, safety: 1.1 },
  },
  '精明': {
    positiveKeywords: ['分析', '想', '计', '等', '观察', '打听', '找', '办法'],
    negativeKeywords: ['冲动', '盲', '贸然', '不管'],
    effectPrefs: { copper: 1.2, mood: 1.1, social: 1.0 },
  },
  '大方': {
    positiveKeywords: ['给', '请', '施', '出钱', '资助', '买'],
    negativeKeywords: ['吝', '省', '计较', '讨价'],
    effectPrefs: { social: 1.5, mood: 1.2, copper: 0.7 },
  },
  '吝啬': {
    positiveKeywords: ['省', '省下', '不花', '讨价', '计较', '自己的'],
    negativeKeywords: ['给', '请', '施', '出钱', '资助', '买'],
    effectPrefs: { copper: 1.5, social: 0.8, mood: 0.9 },
  },
  '正直': {
    positiveKeywords: ['揭', '报', '正', '义', '道理', '评理', '公道'],
    negativeKeywords: ['骗', '偷', '瞒', '包庇', '黑', '假'],
    effectPrefs: { social: 1.2, mood: 1.1, safety: 1.1 },
  },
  '健谈': {
    positiveKeywords: ['说', '劝', '聊', '谈', '讲', '呼', '喊'],
    negativeKeywords: ['沉默', '不说', '忍', '走开'],
    effectPrefs: { social: 1.5, mood: 1.1 },
  },
  '沉默': {
    positiveKeywords: ['看', '观察', '等', '悄悄', '暗'],
    negativeKeywords: ['说', '劝', '聊', '谈', '喊', '大声'],
    effectPrefs: { safety: 1.2, social: 0.7 },
  },
  '机灵': {
    positiveKeywords: ['巧', '智', '妙', '机', '灵', '快', '抓'],
    negativeKeywords: ['硬', '蛮', '冲', '傻'],
    effectPrefs: { mood: 1.2, social: 1.1, copper: 1.1 },
  },
  '勤劳': {
    positiveKeywords: ['帮', '干', '做', '劳动', '努力', '组织'],
    negativeKeywords: ['懒', '闲', '等', '拖'],
    effectPrefs: { mood: 1.1, fatigue: 0.8 },
  },
  '懒散': {
    positiveKeywords: ['算了', '不关', '走开', '再说', '等'],
    negativeKeywords: ['帮', '干', '追', '冲', '努力'],
    effectPrefs: { fatigue: 1.3, mood: 1.0 },
  },
  '贪吃': {
    positiveKeywords: ['吃', '喝', '买', '炊饼', '酒', '茶'],
    negativeKeywords: ['饿', '省'],
    effectPrefs: { hunger: 1.4, mood: 1.1 },
  },
};

// ════════════════════════════════════════
// 情绪→选择偏好修正
// ════════════════════════════════════════

const EMOTION_CHOICE_BIAS: Record<string, {
  preferKeywords: string[];
  avoidKeywords: string[];
}> = {
  happy: {
    preferKeywords: ['帮', '请', '给', '聊', '笑', '分享'],
    avoidKeywords: ['打', '骂', '偷', '抢'],
  },
  sad: {
    preferKeywords: ['走', '离', '独', '安静', '不理'],
    avoidKeywords: ['聊', '说', '帮', '参与'],
  },
  angry: {
    preferKeywords: ['打', '骂', '冲', '揭', '对质', '怒'],
    avoidKeywords: ['忍', '让', '求', '调解'],
  },
  tense: {
    preferKeywords: ['逃', '躲', '防', '小心', '看'],
    avoidKeywords: ['冲', '打', '冒险', '大意'],
  },
  uncomfortable: {
    preferKeywords: ['走', '离', '避开', '休息'],
    avoidKeywords: ['参与', '帮', '社交'],
  },
  energized: {
    preferKeywords: ['追', '冲', '做', '帮', '干', '参加'],
    avoidKeywords: ['等', '懒', '算了', '走开'],
  },
  focused: {
    preferKeywords: ['分析', '想', '计', '观察'],
    avoidKeywords: ['冲', '盲', '随'],
  },
  social: {
    preferKeywords: ['聊', '说', '劝', '谈', '参与', '帮忙'],
    avoidKeywords: ['独', '走开', '不管'],
  },
  bored: {
    preferKeywords: ['看', '凑', '参与', '去', '试试'],
    avoidKeywords: ['待', '等', '算了'],
  },
};

// ════════════════════════════════════════
// 需求紧迫性计算
// ════════════════════════════════════════

function urgency(value: number): number {
  // 值越低越紧迫，指数曲线
  return Math.max(0, (100 - value) / 50) ** 1.5;
}

function consequenceNeedScore(consequence: L0SceneConsequence): number {
  const effects = { ...consequence.immediateEffects };
  let score = 0;
  // 效果越正 → 越有吸引力（但要看当前需求紧迫性）
  for (const [key, val] of Object.entries(effects)) {
    if (val > 0) score += val * 0.1;
    else if (val < 0) score += val * 0.05; // 惩罚更轻（NPC 不是完美的优化器）
  }
  return score;
}

// ════════════════════════════════════════
// 核心：为 NPC 选择最佳选项
// ════════════════════════════════════════

/**
 * 确定性 NPC 选择 AI。
 * 给定上下文和可用选项，返回最高分选项的 ID。
 * 如果没有可用选项，返回 null。
 */
export function chooseBestForNPC(
  choices: L0SceneChoice[],
  context: NPCChoiceContext,
): string | null {
  if (choices.length === 0) return null;

  let bestId = choices[0].id;
  let bestScore = -Infinity;

  for (const choice of choices) {
    // 检查条件
    if (choice.condition && !checkCondition(choice.condition, context)) continue;

    const score = scoreChoice(choice, context);
    if (score > bestScore) {
      bestScore = score;
      bestId = choice.id;
    }
  }

  return bestId;
}

function checkCondition(
  cond: { field: string; operator: string; value: number | string },
  ctx: NPCChoiceContext,
): boolean {
  const { field, operator, value } = cond;
  let actual: number | string | string[];

  switch (field) {
    case 'copper': actual = ctx.copper; break;
    case 'health': actual = ctx.needs.health; break;
    case 'hunger': actual = ctx.needs.hunger; break;
    case 'fatigue': actual = ctx.needs.fatigue; break;
    case 'mood': actual = ctx.needs.mood; break;
    case 'safety': actual = ctx.needs.safety; break;
    case 'social': actual = ctx.needs.social; break;
    case 'stress': actual = ctx.stress; break;
    case 'personality': actual = ctx.traits; break;
    case 'greed': actual = ctx.hiddenTraits.greed; break;
    case 'honor': actual = ctx.hiddenTraits.honor; break;
    case 'rationality': actual = ctx.hiddenTraits.rationality; break;
    case 'ambition': actual = ctx.hiddenTraits.ambition; break;
    case 'loyalty': actual = ctx.hiddenTraits.loyalty; break;
    default: return true; // 未知字段默认通过
  }

  switch (operator) {
    case 'gte': return (actual as number) >= (value as number);
    case 'lte': return (actual as number) <= (value as number);
    case 'eq': return actual === value;
    case 'includes': return Array.isArray(actual) && actual.includes(value as string);
    case 'notIncludes': return Array.isArray(actual) && !actual.includes(value as string);
    default: return true;
  }
}

function scoreChoice(choice: L0SceneChoice, ctx: NPCChoiceContext): number {
  let score = 0;

  // 1. 性格契合度 (权重 1.5)
  for (const trait of ctx.traits) {
    const bias = PERSONALITY_CHOICE_BIAS[trait];
    if (!bias) continue;

    for (const kw of bias.positiveKeywords) {
      if (choice.text.includes(kw)) score += 3 * 1.5;
    }
    for (const kw of bias.negativeKeywords) {
      if (choice.text.includes(kw)) score -= 3 * 1.5;
    }

    // 效果偏好
    if (choice.consequence.immediateEffects) {
      for (const [effKey, effVal] of Object.entries(choice.consequence.immediateEffects)) {
        const pref = bias.effectPrefs[effKey] || 1.0;
        score += effVal * (pref - 1.0) * 0.5 * 1.5;
      }
    }
  }

  // 2. 需求紧迫性 (权重 2.0)
  const needs = ctx.needs;
  if (choice.consequence.immediateEffects) {
    for (const [key, val] of Object.entries(choice.consequence.immediateEffects)) {
      const needVal = (needs as Record<string, number>)[key];
      if (needVal !== undefined && val > 0) {
        score += val * urgency(needVal) * 0.3 * 2.0;
      }
    }
  }
  // 总体后果吸引力
  score += consequenceNeedScore(choice.consequence) * 2.0;

  // 3. 情绪修正 (权重 1.2)
  const emotionBias = EMOTION_CHOICE_BIAS[ctx.emotion];
  if (emotionBias) {
    for (const kw of emotionBias.preferKeywords) {
      if (choice.text.includes(kw)) score += 2 * 1.2;
    }
    for (const kw of emotionBias.avoidKeywords) {
      if (choice.text.includes(kw)) score -= 2 * 1.2;
    }
  }

  // 4. 隐藏特质 (权重 1.0)
  const ht = ctx.hiddenTraits;
  // 贪婪：铜钱正面效果加分
  if (ht.greed > 60 && choice.consequence.immediateEffects) {
    const copperEffect = choice.consequence.immediateEffects.copper || 0;
    if (copperEffect > 0) score += copperEffect * 0.3 * 1.0;
    if (copperEffect < 0) score += copperEffect * 0.1 * 1.0; // 花钱不太心疼
  }
  // 荣誉：偷窃/欺骗扣分
  if (ht.honor > 60) {
    const dishonorableKw = ['偷', '骗', '抢', '黑', '趁', '假装'];
    for (const kw of dishonorableKw) {
      if (choice.text.includes(kw)) score -= 4 * 1.0;
    }
  }
  // 理性：冲动行为扣分
  if (ht.rationality > 60) {
    const impulsiveKw = ['冲', '贸然', '不管', '直接'];
    for (const kw of impulsiveKw) {
      if (choice.text.includes(kw)) score -= 2 * 1.0;
    }
  }
  // 忠诚：与关系修正联动
  if (ht.loyalty > 60 && ctx.relationToTarget !== undefined) {
    if (ctx.relationToTarget > 0) {
      // 对朋友慷慨
      const generousKw = ['帮', '给', '请', '出'];
      for (const kw of generousKw) {
        if (choice.text.includes(kw)) score += 2 * 1.0;
      }
    }
  }
  // 野心：工作/成就相关加分
  if (ht.ambition > 60) {
    const ambitiousKw = ['追', '争', '赢', '立功', '表现'];
    for (const kw of ambitiousKw) {
      if (choice.text.includes(kw)) score += 2 * 1.0;
    }
  }

  // 5. 关系上下文 (权重 0.8)
  if (ctx.relationToTarget !== undefined) {
    if (ctx.relationToTarget > 20) {
      // 朋友→倾向慷慨、帮助
      const friendlyKw = ['帮', '给', '请', '安慰', '劝'];
      for (const kw of friendlyKw) {
        if (choice.text.includes(kw)) score += 1.5 * 0.8;
      }
    } else if (ctx.relationToTarget < -20) {
      // 敌人→倾向攻击、拒绝
      const hostileKw = ['拒', '揭', '骂', '打', '不管'];
      for (const kw of hostileKw) {
        if (choice.text.includes(kw)) score += 1.5 * 0.8;
      }
    }
  }

  // 6. 一致性 (权重 0.5) — 奖励与之前选择相符的倾向
  if (ctx.history.length > 0) {
    const prevChoice = ctx.history[ctx.history.length - 1];
    // 如果之前的选择倾向与当前选项倾向相同（通过关键词判断）
    const positiveKeywords = ctx.traits.flatMap(t => PERSONALITY_CHOICE_BIAS[t]?.positiveKeywords || []);
    for (const kw of positiveKeywords) {
      if (choice.text.includes(kw)) {
        score += 1 * 0.5;
        break;
      }
    }
  }

  return score;
}
