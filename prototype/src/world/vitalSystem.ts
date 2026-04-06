// === 生命系统（含个性化需求衰减）===

import { EntityManager } from '../ecs/entityManager';

// ──── 性格对需求衰减率的影响 ────
const PERSONALITY_DECAY_MULT: Record<string, Record<string, number>> = {
  '贪吃':  { hunger: 1.5 },
  '勤劳':  { fatigue: 0.7 },
  '懒散':  { fatigue: 1.5 },
  '健谈':  { social: 1.5 },
  '沉默':  { social: 0.6 },
  '胆小':  { safety: 1.3 },
  '善良':  { social: 1.2 },
  '狡猾':  { safety: 1.1 },
  '大方':  { social: 1.1 },
  '吝啬':  { hunger: 1.2 },
};

export class VitalSystem {
  constructor(private em: EntityManager) {}

  /** 全局生命衰减 — 每个 tick */
  update(): void {
    const store = this.em.registry.getStore<any>('Vital');
    if (!store) return;

    store.forEach((vital, entityId) => {
      vital.hunger = Math.max(0, vital.hunger - 0.5);
      vital.fatigue = Math.max(0, vital.fatigue - 0.3);
      // 心情随饥饿下降
      if (vital.hunger < 20) {
        vital.mood = Math.max(0, vital.mood - 1);
      }
    });
  }

  /**
   * 带性格修正的需求衰减 — 用于 L0/L1 NPC 的 NeedsComponent
   * 返回衰减后的 needs（原地修改）
   */
  decayNeedsWithPersonality(
    needs: { hunger: number; fatigue: number; health: number; mood: number; safety: number; social: number },
    personality: string[],
  ): void {
    // 基础衰减量
    const baseDecay: Record<string, number> = {
      hunger: 3 + Math.floor(Math.random() * 3),   // 3-5
      fatigue: 1 + Math.floor(Math.random() * 3),   // 1-3
      mood: 1 + Math.floor(Math.random() * 2),      // 1-2
      social: 1 + Math.floor(Math.random() * 2),    // 1-2
      safety: Math.floor(Math.random() * 1),         // 0
    };

    // 根据性格调整衰减率
    const mults: Record<string, number> = { hunger: 1.0, fatigue: 1.0, social: 1.0, safety: 1.0 };
    for (const trait of personality) {
      const decayMod = PERSONALITY_DECAY_MULT[trait];
      if (decayMod) {
        for (const [key, val] of Object.entries(decayMod)) {
          if (mults[key] !== undefined) mults[key] *= val;
        }
      }
    }

    // 应用衰减 + ±20% 随机扰动
    for (const key of Object.keys(baseDecay)) {
      if (baseDecay[key] === 0) continue;
      const randomFactor = 0.8 + Math.random() * 0.4; // ±20%
      const decay = Math.round(baseDecay[key] * (mults[key] || 1.0) * randomFactor);
      (needs as any)[key] = Math.max(0, (needs as any)[key] - decay);
    }

    // 心情随饥饿下降（保留旧逻辑）
    if (needs.hunger < 20) {
      needs.mood = Math.max(0, needs.mood - 1);
    }
  }
}
