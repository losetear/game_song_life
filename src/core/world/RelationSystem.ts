import { clamp } from '../utils/clamp';
import type { EntityManager } from '../ecs/EntityManager';

/**
 * 好感度系统
 * 范围 -100 ~ 100
 * 衰减规则：无交互时每天向0靠拢1点
 */
export class RelationSystem {
  /** 交互后好感变化（基础值，会被上下文修正） */
  private static readonly INTERACTION_DELTA: Record<string, number> = {
    chat: 2,
    trade: 1,
    gift: 5,
    help: 8,
    conflict: -10,
    insult: -15,
    cooperation: 6,
    shared_meal: 3,
  };

  /** 获取A对B的好感度 */
  getRelation(em: EntityManager, fromId: number, toId: number): number {
    const memory = em.getComponent(fromId, 'Memory');
    if (!memory) return 0;
    return memory.impressions[toId] ?? 0;
  }

  /** 修改A对B的好感度 */
  changeRelation(
    em: EntityManager,
    fromId: number,
    toId: number,
    delta: number,
  ): number {
    const memory = em.getComponent(fromId, 'Memory');
    if (!memory) return 0;
    const current = memory.impressions[toId] ?? 0;
    const newValue = clamp(current + delta, -100, 100);
    memory.impressions[toId] = newValue;
    return newValue;
  }

  /** 按交互类型修改好感 */
  interact(
    em: EntityManager,
    fromId: number,
    toId: number,
    type: string,
  ): number {
    const base = RelationSystem.INTERACTION_DELTA[type] ?? 1;

    // 性格修正
    const identity = em.getComponent(fromId, 'Identity');
    let modifier = 1.0;
    if (identity) {
      if (identity.personality.includes('善良')) modifier *= 1.3;
      if (identity.personality.includes('暴躁')) modifier *= 0.8;
      if (identity.personality.includes('阴沉')) modifier *= 0.7;
    }

    return this.changeRelation(em, fromId, toId, Math.round(base * modifier));
  }

  /** 每天自然衰减：向0靠拢 */
  decayAll(em: EntityManager): void {
    const entities = em.query('Memory');
    for (const id of entities) {
      const memory = em.getComponent(id, 'Memory');
      if (!memory) continue;
      for (const targetId of Object.keys(memory.impressions)) {
        const val = memory.impressions[Number(targetId)];
        if (val === undefined) continue;
        if (val > 0) memory.impressions[Number(targetId)] = Math.max(0, val - 1);
        else if (val < 0) memory.impressions[Number(targetId)] = Math.min(0, val + 1);
      }
    }
  }

  /** 好感度对应的关系等级 */
  static getRelationLevel(score: number): string {
    if (score >= 80) return '至交';
    if (score >= 50) return '好友';
    if (score >= 25) return '熟人';
    if (score >= -25) return '路人';
    if (score >= -50) return '嫌隙';
    if (score >= -80) return '仇视';
    return '死敌';
  }

  /** 获取某实体的所有关系 */
  getRelations(em: EntityManager, entityId: number): Array<{
    targetId: number;
    targetName: string;
    score: number;
    level: string;
  }> {
    const memory = em.getComponent(entityId, 'Memory');
    if (!memory) return [];

    const result: Array<{
      targetId: number;
      targetName: string;
      score: number;
      level: string;
    }> = [];

    for (const [targetIdStr, score] of Object.entries(memory.impressions)) {
      const targetId = Number(targetIdStr);
      const identity = em.getComponent(targetId, 'Identity');
      if (!identity) continue;
      // 只显示有实际关系的人（不是0）
      if (score === 0) continue;
      result.push({
        targetId,
        targetName: identity.name,
        score,
        level: RelationSystem.getRelationLevel(score),
      });
    }

    return result.sort((a, b) => b.score - a.score);
  }
}
