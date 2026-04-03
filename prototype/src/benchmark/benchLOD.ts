// === 基准测试：LOD 切换 ===

import { EntityManager } from '../ecs/entityManager';
import { WorldMap } from '../spatial/worldMap';
import { RegionSimulator } from '../ai/statistics/regionSim';
import { LODManager } from '../lod/lodManager';
import { EntityType } from '../ecs/types';
import { BenchmarkItem } from '../server/protocol';

export function benchLOD(): BenchmarkItem {
  const em = new EntityManager();
  const worldMap = new WorldMap();
  const regionSim = new RegionSimulator();
  const lod = new LODManager(em, worldMap, regionSim);

  // 创建 100 个 L1 实体
  const ids: number[] = [];
  for (let i = 0; i < 100; i++) {
    const id = em.create(EntityType.NPC);
    em.addComponent(id, 'Position', { x: 50, y: 50, areaId: 'mountain', gridId: 'shallow_mountain' });
    em.addComponent(id, 'Vital', { hunger: 60, fatigue: 70, health: 80, mood: 60 });
    em.addComponent(id, 'AI', { goals: [], currentPlan: [], planCooldown: 0, aiLevel: 1 });
    worldMap.addEntity(id, 'shallow_mountain');
    ids.push(id);
  }

  // 测试升级到 L0
  const start = performance.now();
  for (const id of ids) {
    lod.upgradeToL0(id);
  }
  const upgradeTime = performance.now() - start;

  // 测试降级到 L1
  const start2 = performance.now();
  for (const id of ids) {
    lod.downgradeToL1(id);
  }
  const downgradeTime = performance.now() - start2;

  const totalTime = upgradeTime + downgradeTime;

  return {
    id: 6,
    name: 'LOD 切换',
    target: '切换 100 个实体 LOD < 5ms',
    actual: Math.round(totalTime * 100) / 100,
    unit: 'ms',
    passed: totalTime < 5,
    detail: `升级L1→L0: ${upgradeTime.toFixed(3)}ms | 降级L0→L1: ${downgradeTime.toFixed(3)}ms | 总计: ${totalTime.toFixed(3)}ms`,
  };
}
