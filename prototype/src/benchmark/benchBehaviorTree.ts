// === 基准测试：行为树 ===

import { EntityManager } from '../ecs/entityManager';
import { EntityType } from '../ecs/types';
import { executeTree, BTContext } from '../ai/behaviorTree/tree';
import { PROFESSION_TREES } from '../ai/behaviorTree/templates';
import { BenchmarkItem } from '../server/protocol';

export function benchBehaviorTree(): BenchmarkItem {
  const em = new EntityManager();
  const professions = Object.keys(PROFESSION_TREES);
  const npcCount = 500;
  const ids: number[] = [];

  // 创建 500 NPC
  for (let i = 0; i < npcCount; i++) {
    const id = em.create(EntityType.NPC);
    em.addComponent(id, 'Vital', {
      hunger: 20 + Math.random() * 60,
      fatigue: 20 + Math.random() * 60,
      health: 50 + Math.random() * 50,
      mood: 30 + Math.random() * 40,
    });
    em.addComponent(id, 'AI', { goals: [], currentPlan: [], planCooldown: 0, aiLevel: 1 });
    ids.push(id);
  }

  // 批量执行行为树
  const start = performance.now();
  for (const id of ids) {
    const profession = professions[id % professions.length];
    const tree = PROFESSION_TREES[profession];
    const vital = em.getComponent(id, 'Vital')!;
    const ctx: BTContext = {
      entityId: id,
      hunger: vital.hunger,
      fatigue: 100 - vital.fatigue,
      health: vital.health,
      mood: vital.mood,
      copper: Math.floor(Math.random() * 100),
      hasStock: Math.random() > 0.5,
      hasFood: Math.random() > 0.5,
      hasHerbs: Math.random() > 0.7,
      hasWeapon: Math.random() > 0.5,
      isGuard: profession === 'guard',
      currentHour: 10,
      currentGrid: 'east_market',
    };
    executeTree(tree, ctx);
  }
  const elapsed = performance.now() - start;

  return {
    id: 4,
    name: 'L1 行为树',
    target: '500 NPC 批量更新 < 20ms',
    actual: Math.round(elapsed * 100) / 100,
    unit: 'ms',
    passed: elapsed < 20,
    detail: `${npcCount} NPC × 6种职业树: ${elapsed.toFixed(2)}ms | 平均 ${(elapsed / npcCount).toFixed(3)}ms/NPC`,
  };
}
