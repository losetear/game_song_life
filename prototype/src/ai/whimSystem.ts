// === 心愿系统 (Whim System) — 参考 Sims 4 Whim ===
//
// 每个NPC同时有3个活跃心愿，基于情绪+性格+时段+近期事件生成。
// 完成心愿时给 mood 加成，给额外行动得分。
// 心愿每 3-5 tick 刷新一次。

import { EmotionType, Whim } from '../ecs/types';

let whimIdCounter = 0;

// ──── 心愿定义模板 ────
interface WhimTemplate {
  name: string;
  relatedCategory: string;    // 关联行动类别
  relatedActionId?: string;   // 关联具体行动ID（可选）
  moodReward: number;
  /** 心愿触发条件，返回匹配优先度（0=不匹配） */
  match: (ctx: WhimMatchCtx) => number;
}

interface WhimMatchCtx {
  emotion: EmotionType;
  personality: string[];
  shichen: string;
  needs: { hunger: number; fatigue: number; social: number; mood: number; safety: number; health: number };
  profession: string;
}

// ═══════════════════════════════════════════
// 心愿池（20+种）
// ═══════════════════════════════════════════
const WHIM_POOL: WhimTemplate[] = [
  // ──── 基于情绪 ────
  { name: '找人分享快乐', relatedCategory: 'social', moodReward: 15,
    match: (c) => c.emotion === 'happy' ? 8 : 0 },
  { name: '找个安全地方', relatedCategory: 'survival', moodReward: 12,
    match: (c) => c.emotion === 'tense' ? 9 : 0 },
  { name: '找人理论一番', relatedCategory: 'social', moodReward: 10,
    match: (c) => c.emotion === 'angry' ? 9 : 0 },
  { name: '一个人静静', relatedCategory: 'leisure', moodReward: 10,
    match: (c) => c.emotion === 'sad' ? 7 : 0 },
  { name: '找点乐子', relatedCategory: 'leisure', moodReward: 12,
    match: (c) => c.emotion === 'bored' ? 8 : 0 },
  { name: '出去跑跑', relatedCategory: 'move', moodReward: 8,
    match: (c) => c.emotion === 'energized' ? 7 : 0 },
  { name: '专心做事', relatedCategory: 'work', moodReward: 10,
    match: (c) => c.emotion === 'focused' ? 8 : 0 },
  { name: '找人聊聊', relatedCategory: 'social', moodReward: 12,
    match: (c) => c.emotion === 'social' ? 8 : 0 },
  { name: '养精蓄锐', relatedCategory: 'survival', moodReward: 8,
    match: (c) => c.emotion === 'uncomfortable' ? 8 : 0 },

  // ──── 基于性格 ────
  { name: '努力工作', relatedCategory: 'work', relatedActionId: 'sell_goods', moodReward: 15,
    match: (c) => c.personality.includes('勤劳') ? 7 : 0 },
  { name: '偷偷懒', relatedCategory: 'leisure', relatedActionId: 'stroll', moodReward: 10,
    match: (c) => c.personality.includes('懒散') ? 7 : 0 },
  { name: '请人吃饭', relatedCategory: 'social', relatedActionId: 'family_dinner', moodReward: 15,
    match: (c) => c.personality.includes('大方') ? 7 : 0 },
  { name: '赚一笔', relatedCategory: 'work', moodReward: 15,
    match: (c) => c.personality.includes('精明') ? 7 : 0 },
  { name: '和人说说话', relatedCategory: 'social', relatedActionId: 'chat', moodReward: 12,
    match: (c) => c.personality.includes('健谈') ? 7 : 0 },
  { name: '自己待着', relatedCategory: 'leisure', relatedActionId: 'study', moodReward: 10,
    match: (c) => c.personality.includes('沉默') ? 6 : 0 },

  // ──── 基于时段 ────
  { name: '晨练一下', relatedCategory: 'move', moodReward: 8,
    match: (c) => (c.shichen === '寅' || c.shichen === '卯') ? 6 : 0 },
  { name: '吃顿早饭', relatedCategory: 'survival', relatedActionId: 'eat_food', moodReward: 10,
    match: (c) => (c.shichen === '辰' || c.shichen === '卯') ? 7 : 0 },
  { name: '回家歇息', relatedCategory: 'move', relatedActionId: 'go_home', moodReward: 10,
    match: (c) => (c.shichen === '亥' || c.shichen === '子' || c.shichen === '丑') ? 8 : 0 },

  // ──── 基于需求 ────
  { name: '吃顿好的', relatedCategory: 'survival', relatedActionId: 'eat_food', moodReward: 12,
    match: (c) => c.needs.hunger < 40 ? 8 : 0 },
  { name: '好好休息', relatedCategory: 'survival', relatedActionId: 'rest', moodReward: 10,
    match: (c) => c.needs.fatigue < 40 ? 7 : 0 },
  { name: '找人说话', relatedCategory: 'social', relatedActionId: 'chat', moodReward: 12,
    match: (c) => c.needs.social < 40 ? 8 : 0 },

  // ──── 基于职业 ────
  { name: '谈一笔大生意', relatedCategory: 'work', relatedActionId: 'bargain', moodReward: 15,
    match: (c) => c.profession === 'merchant' ? 6 : 0 },
  { name: '猎一头大猎物', relatedCategory: 'work', relatedActionId: 'hunt', moodReward: 15,
    match: (c) => c.profession === 'hunter' ? 6 : 0 },
  { name: '治好一个病人', relatedCategory: 'work', relatedActionId: 'treat_patient', moodReward: 15,
    match: (c) => c.profession === 'doctor' ? 6 : 0 },
  { name: '在田里忙碌', relatedCategory: 'work', relatedActionId: 'farm_work', moodReward: 12,
    match: (c) => c.profession === 'farmer' ? 6 : 0 },
  { name: '巡逻一圈', relatedCategory: 'work', relatedActionId: 'patrol', moodReward: 12,
    match: (c) => c.profession === 'guard' ? 6 : 0 },
  { name: '摸点东西', relatedCategory: 'work', relatedActionId: 'steal', moodReward: 12,
    match: (c) => c.profession === 'rogue' ? 6 : 0 },
];

export interface WhimGenInput {
  emotion: EmotionType;
  personality: string[];
  shichen: string;
  needs: { hunger: number; fatigue: number; social: number; mood: number; safety: number; health: number };
  profession: string;
  currentTick: number;
  existingWhims: Whim[];
}

/** 生成 3 个活跃心愿 */
export function generateWhims(input: WhimGenInput): Whim[] {
  const ctx: WhimMatchCtx = {
    emotion: input.emotion,
    personality: input.personality,
    shichen: input.shichen,
    needs: input.needs,
    profession: input.profession,
  };

  // 对所有模板打分
  const scored = WHIM_POOL
    .map(t => ({ template: t, score: t.match(ctx) }))
    .filter(s => s.score > 0)
    // 去掉已存在的同名心愿
    .filter(s => !input.existingWhims.some(w => w.name === s.template.name));

  // 排序
  scored.sort((a, b) => b.score - a.score);

  // 从 top-8 中随机选3个（增加多样性）
  const pool = scored.slice(0, Math.min(8, scored.length));
  const chosen: typeof pool = [];
  while (chosen.length < 3 && pool.length > 0) {
    // 加权随机：分数越高越容易被选中
    const totalScore = pool.reduce((a, b) => a + b.score, 0);
    let r = Math.random() * totalScore;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].score;
      if (r <= 0) { idx = i; break; }
    }
    chosen.push(pool.splice(idx, 1)[0]);
  }

  // 构建 Whim 对象
  const lifespan = 3 + Math.floor(Math.random() * 3); // 3-5 tick
  return chosen.map(c => ({
    id: `whim_${++whimIdCounter}_${input.currentTick}`,
    name: c.template.name,
    relatedCategory: c.template.relatedCategory,
    moodReward: c.template.moodReward,
    expireTick: input.currentTick + lifespan,
  }));
}

/** 检查行动是否完成某个心愿 */
export function checkWhimCompletion(
  whims: Whim[],
  actionId: string,
  actionCategory: string,
): { completed: Whim; moodReward: number } | null {
  for (const w of whims) {
    // 匹配类别或具体行动
    if (w.relatedCategory === actionCategory || w.relatedActionId === actionId) {
      return { completed: w, moodReward: w.moodReward };
    }
  }
  return null;
}

/** 清理过期心愿并返回是否需要刷新 */
export function shouldRefreshWhims(
  whims: Whim[],
  currentTick: number,
  lastRefreshTick: number,
): boolean {
  // 全部过期 → 刷新
  const allExpired = whims.every(w => currentTick >= w.expireTick);
  if (allExpired) return true;
  // 超过5 tick未刷新 → 刷新
  if (currentTick - lastRefreshTick >= 5) return true;
  return false;
}
