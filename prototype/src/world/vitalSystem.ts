// === 生命系统 ===

import { EntityManager } from '../ecs/entityManager';

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
}
