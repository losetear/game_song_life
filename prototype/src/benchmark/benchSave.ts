// === 基准测试：SQLite 存档 ===

import { EntityManager } from '../ecs/entityManager';
import { EntityType } from '../ecs/types';
import { GameDatabase } from '../save/database';
import { SaveManager } from '../save/saveManager';
import { BenchmarkItem } from '../server/protocol';

export function benchSave(): BenchmarkItem {
  const em = new EntityManager();

  // 创建 10,000 实体
  for (let i = 0; i < 10000; i++) {
    const id = em.create(EntityType.NPC);
    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId: 'city', gridId: 'center_street' });
    em.addComponent(id, 'Vital', { hunger: 50, fatigue: 50, health: 80, mood: 60 });
    if (i < 800) {
      em.addComponent(id, 'AI', { goals: [], currentPlan: [], planCooldown: 0, aiLevel: i < 10 ? 0 : 1 });
    }
  }

  const db = new GameDatabase(':memory:');
  const saveManager = new SaveManager(em, db);

  // 写入测试
  const start = performance.now();
  const saveId = saveManager.saveAll();
  const writeTime = performance.now() - start;

  // 读取测试
  const readStart = performance.now();
  const count = saveManager.load();
  const readTime = performance.now() - readStart;

  db.close();

  return {
    id: 8,
    name: 'SQLite 存档',
    target: '写入 10,000 实体 < 500ms',
    actual: Math.round(writeTime * 100) / 100,
    unit: 'ms',
    passed: writeTime < 500,
    detail: `写入${10000}实体: ${writeTime.toFixed(2)}ms | 读取: ${readTime.toFixed(2)}ms (${count}实体)`,
  };
}
