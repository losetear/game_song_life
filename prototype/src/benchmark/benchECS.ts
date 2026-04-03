// === 基准测试：ECS 框架 ===

import { EntityManager } from '../ecs/entityManager';
import { EntityType } from '../ecs/types';
import { BenchmarkItem } from '../server/protocol';

export function benchECS(): BenchmarkItem {
  // 先记录基线内存
  global.gc && global.gc();
  const memBefore = process.memoryUsage().heapUsed;

  const em = new EntityManager();
  const start = performance.now();

  // 创建 10,000 实体
  const ids: number[] = [];
  for (let i = 0; i < 10000; i++) {
    const id = em.create(EntityType.NPC);
    ids.push(id);
  }

  // 给每个实体添加多个组件
  for (const id of ids) {
    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId: 'city', gridId: 'center_street' });
    em.addComponent(id, 'Vital', { hunger: 50 + Math.random() * 50, fatigue: 50 + Math.random() * 50, health: 80 + Math.random() * 20, mood: 50 + Math.random() * 30 });
    em.addComponent(id, 'Wallet', { copper: Math.floor(Math.random() * 100) });
    em.addComponent(id, 'AI', { goals: [], currentPlan: [], planCooldown: 0, aiLevel: 1 });
  }

  const elapsed = performance.now() - start;

  // 增量内存估算
  const memAfter = process.memoryUsage().heapUsed;
  const deltaMB = (memAfter - memBefore) / 1024 / 1024;
  const totalHeapMB = memAfter / 1024 / 1024;

  // 查询测试
  const queryStart = performance.now();
  const results = em.query('Position', 'Vital', 'AI');
  const queryTime = performance.now() - queryStart;

  // 通过标准：创建时间 < 100ms，增量内存 < 50MB
  const passed = elapsed < 100 && deltaMB < 50;

  return {
    id: 1,
    name: 'ECS 框架',
    target: '创建 10,000 实体 < 100ms, 内存 < 50MB',
    actual: Math.round(elapsed * 100) / 100,
    unit: 'ms',
    passed,
    detail: `创建+组件: ${elapsed.toFixed(2)}ms | 查询(${results.length}结果): ${queryTime.toFixed(2)}ms | ECS增量内存: ${Math.max(0, deltaMB).toFixed(1)}MB | 总堆: ${totalHeapMB.toFixed(1)}MB`,
  };
}
