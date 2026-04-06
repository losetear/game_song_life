// === NPC 关系网络系统 — 参考 CK2 看法系统 ===
//
// 核心机制：
// - NPC 两两之间有 relationship score (-100 到 +100)
// - 关系类型：陌生人/熟人/朋友/密友/不熟/反感/仇敌
// - 关系来源：同区域/交易/偷窃/救助/聊天/冲突
// - 关系影响决策和情绪
// - 关系自然衰减（模拟遗忘）

import { EntityManager } from '../ecs/entityManager';
import { RelationshipComponent } from '../ecs/types';

// ──── 关系类型判定 ────
export function getRelationType(score: number): string {
  if (score >= 61) return 'closeFriend';   // 密友
  if (score >= 21) return 'friend';         // 朋友
  if (score >= 1) return 'acquaintance';    // 熟人
  if (score === 0) return 'stranger';       // 陌生人
  if (score >= -20) return 'unfamiliar';    // 不熟
  if (score >= -60) return 'disliked';      // 反感
  return 'enemy';                           // 仇敌
}

export const RELATION_TYPE_NAMES: Record<string, string> = {
  stranger: '陌生人',
  acquaintance: '熟人',
  friend: '朋友',
  closeFriend: '密友',
  unfamiliar: '不熟',
  disliked: '反感',
  enemy: '仇敌',
};

// ──── 关系变化来源及分值 ────
export const RELATION_SOURCES = {
  sameArea: { delta: 2, desc: '同区域相处' },
  trade: { delta: 8, desc: '交易' },          // +5~15, 用8作为中间值
  steal: { delta: -30, desc: '偷窃' },        // -20~-40
  rescue: { delta: 22, desc: '救助' },        // +15~+30
  chat: { delta: 3, desc: '日常聊天' },        // +2~+5
  conflict: { delta: -15, desc: '冲突' },      // -10~-20
  treatPatient: { delta: 15, desc: '治病' },
  reject: { delta: -5, desc: '被拒绝社交' },
  gift: { delta: 10, desc: '送礼/请客' },
  witnessCrime: { delta: -20, desc: '目睹犯罪' },
  hurtNotHelped: { delta: -10, desc: '受伤未获帮助' },
  accompany: { delta: 3, desc: '同行陪伴' },
} as const;

// ──── 关系对情绪的影响 ────
export function getRelationEmotionEffect(score: number): {
  emotionBias: Record<string, number>;
  description: string;
} {
  if (score >= 61) {
    return {
      emotionBias: { happy: 0.3, social: 0.4 },
      description: '见到密友心情愉悦',
    };
  }
  if (score >= 21) {
    return {
      emotionBias: { happy: 0.15, social: 0.2 },
      description: '和朋友相处愉快',
    };
  }
  if (score <= -61) {
    return {
      emotionBias: { angry: 0.5, tense: 0.3 },
      description: '见到仇敌怒火中烧',
    };
  }
  if (score <= -21) {
    return {
      emotionBias: { angry: 0.2, tense: 0.15 },
      description: '对讨厌的人心生不悦',
    };
  }
  return { emotionBias: {}, description: '' };
}

// ──── 关系对决策的影响 ────
export function getRelationDecisionModifier(score: number): {
  tradeModifier: number;      // 交易倾向
  socialModifier: number;     // 社交倾向
  attackModifier: number;     // 攻击倾向
  shareModifier: number;      // 分享倾向
} {
  if (score >= 61) {
    return { tradeModifier: 0.3, socialModifier: 0.5, attackModifier: -1.0, shareModifier: 0.5 };
  }
  if (score >= 21) {
    return { tradeModifier: 0.15, socialModifier: 0.3, attackModifier: -0.5, shareModifier: 0.2 };
  }
  if (score <= -61) {
    return { tradeModifier: -1.0, socialModifier: -0.8, attackModifier: 0.5, shareModifier: -1.0 };
  }
  if (score <= -21) {
    return { tradeModifier: -0.3, socialModifier: -0.4, attackModifier: 0.2, shareModifier: -0.5 };
  }
  return { tradeModifier: 0, socialModifier: 0, attackModifier: 0, shareModifier: 0 };
}

// ──── 核心关系管理器 ────
export class RelationshipSystem {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  /** 确保NPC有关系组件 */
  ensureRelationshipComponent(npcId: number): RelationshipComponent {
    let rel = this.em.getComponent(npcId, 'Relationship');
    if (!rel) {
      rel = { relations: {} };
      this.em.addComponent(npcId, 'Relationship', rel);
    }
    return rel;
  }

  /** 确保两个NPC之间有关系条目 */
  ensureRelation(npcId: number, targetId: number, currentTick: number): void {
    const rel = this.ensureRelationshipComponent(npcId);
    if (!rel.relations[targetId]) {
      rel.relations[targetId] = {
        score: 0,
        type: 'stranger',
        lastInteractionTick: currentTick,
      };
    }
  }

  /** 修改两个NPC之间的关系（双向） */
  modifyRelation(
    npcId: number,
    targetId: number,
    delta: number,
    currentTick: number,
  ): void {
    this.ensureRelation(npcId, targetId, currentTick);
    this.ensureRelation(targetId, npcId, currentTick);

    const npcRel = this.em.getComponent(npcId, 'Relationship')!;
    const targetRel = this.em.getComponent(targetId, 'Relationship')!;

    // 更新 NPC → Target
    npcRel.relations[targetId].score = Math.max(-100, Math.min(100,
      npcRel.relations[targetId].score + delta));
    npcRel.relations[targetId].type = getRelationType(npcRel.relations[targetId].score);
    npcRel.relations[targetId].lastInteractionTick = currentTick;

    // 更新 Target → NPC（非对称：对方获得较小影响）
    const reverseDelta = Math.round(delta * 0.7);
    targetRel.relations[npcId].score = Math.max(-100, Math.min(100,
      targetRel.relations[npcId].score + reverseDelta));
    targetRel.relations[npcId].type = getRelationType(targetRel.relations[npcId].score);
    targetRel.relations[npcId].lastInteractionTick = currentTick;
  }

  /** 获取两个NPC之间的关系分数 */
  getScore(npcId: number, targetId: number): number {
    const rel = this.em.getComponent(npcId, 'Relationship');
    if (!rel || !rel.relations[targetId]) return 0;
    return rel.relations[targetId].score;
  }

  /** 获取两个NPC之间的关系类型 */
  getType(npcId: number, targetId: number): string {
    const score = this.getScore(npcId, targetId);
    return getRelationType(score);
  }

  /** 获取NPC的所有关系 */
  getAllRelations(npcId: number): RelationshipComponent['relations'] {
    const rel = this.em.getComponent(npcId, 'Relationship');
    return rel?.relations || {};
  }

  /** 获取附近NPC的关系信息 */
  getNearbyRelations(npcId: number, nearbyIds: number[]): {
    targetId: number;
    score: number;
    type: string;
  }[] {
    const result: { targetId: number; score: number; type: string }[] = [];
    for (const tid of nearbyIds) {
      if (tid === npcId) continue;
      const score = this.getScore(npcId, tid);
      result.push({ targetId: tid, score, type: getRelationType(score) });
    }
    return result;
  }

  /** 关系自然衰减：每30tick未互动，衰减1点 */
  applyDecay(npcId: number, currentTick: number): void {
    const rel = this.em.getComponent(npcId, 'Relationship');
    if (!rel) return;

    for (const targetId of Object.keys(rel.relations)) {
      const r = rel.relations[Number(targetId)];
      const ticksSinceInteraction = currentTick - r.lastInteractionTick;
      const decayAmount = Math.floor(ticksSinceInteraction / 30);
      if (decayAmount > 0) {
        // 向0衰减
        if (r.score > 0) {
          r.score = Math.max(0, r.score - decayAmount);
        } else if (r.score < 0) {
          r.score = Math.min(0, r.score + decayAmount);
        }
        r.type = getRelationType(r.score);
        // 如果衰减到0，标记为陌生人
        if (r.score === 0) {
          r.type = 'stranger';
        }
      }
    }
  }

  /** 同区域加成：每tick同区域+2 */
  applyProximityBonus(npcId: number, nearbyIds: number[], currentTick: number): void {
    for (const tid of nearbyIds) {
      if (tid === npcId) continue;
      this.ensureRelation(npcId, tid, currentTick);
      const rel = this.em.getComponent(npcId, 'Relationship')!;
      if (rel.relations[tid]) {
        // 只有非仇敌才加亲近
        if (rel.relations[tid].score >= -20) {
          rel.relations[tid].score = Math.min(100, rel.relations[tid].score + 2);
          rel.relations[tid].type = getRelationType(rel.relations[tid].score);
          rel.relations[tid].lastInteractionTick = currentTick;
        }
      }
    }
  }

  /** 检查是否愿意与目标交易 */
  isWillingToTrade(npcId: number, targetId: number): boolean {
    const score = this.getScore(npcId, targetId);
    return score > -21; // 反感及以下拒绝交易
  }

  /** 检查是否愿意与目标社交 */
  isWillingToSocialize(npcId: number, targetId: number): boolean {
    const score = this.getScore(npcId, targetId);
    return score > -61; // 仇敌拒绝社交
  }

  /** 获取NPC的密友列表 */
  getCloseFriends(npcId: number): number[] {
    const rel = this.em.getComponent(npcId, 'Relationship');
    if (!rel) return [];
    return Object.entries(rel.relations)
      .filter(([_, r]) => r.score >= 61)
      .map(([id]) => Number(id));
  }

  /** 获取NPC的仇敌列表 */
  getEnemies(npcId: number): number[] {
    const rel = this.em.getComponent(npcId, 'Relationship');
    if (!rel) return [];
    return Object.entries(rel.relations)
      .filter(([_, r]) => r.score <= -61)
      .map(([id]) => Number(id));
  }
}
