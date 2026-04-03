// === 基准测试：空间索引 ===

import { WorldMap } from '../spatial/worldMap';
import { BenchmarkItem } from '../server/protocol';

export function benchSpatial(): BenchmarkItem {
  const worldMap = new WorldMap();

  // 在 20 个 Grid 中分配 10,000 个实体
  const allGrids = worldMap.allGrids();
  const entityCount = 10000;
  const start = performance.now();

  for (let i = 0; i < entityCount; i++) {
    const grid = allGrids[i % allGrids.length];
    worldMap.addEntity(i + 1, grid.id);
  }

  const addTime = performance.now() - start;

  // 查询测试
  const queryStart = performance.now();
  let totalEntities = 0;
  for (const grid of allGrids) {
    totalEntities += worldMap.getEntitiesInGrid(grid.id).length;
  }
  const singleQueryTime = performance.now() - queryStart;

  // 范围查询
  const rangeStart = performance.now();
  const rangeResults = worldMap.getEntitiesInRange('center_street', 2);
  const rangeTime = performance.now() - rangeStart;

  return {
    id: 2,
    name: '空间索引',
    target: '20 Grid, 查询附近实体 < 1ms',
    actual: Math.round(singleQueryTime * 1000) / 1000,
    unit: 'ms',
    passed: singleQueryTime < 1,
    detail: `添加${entityCount}实体: ${addTime.toFixed(2)}ms | 单Grid查询(20个): ${singleQueryTime.toFixed(3)}ms | 范围查询(2层): ${rangeTime.toFixed(3)}ms (${rangeResults.length}实体)`,
  };
}
