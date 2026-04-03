// === 基准测试：L2 统计 ===

import { RegionSimulator } from '../ai/statistics/regionSim';
import { BenchmarkItem } from '../server/protocol';

export function benchStatistics(): BenchmarkItem {
  const sim = new RegionSimulator();

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    sim.update('summer', 1.0 + Math.random() * 0.5);
  }
  const elapsed = performance.now() - start;

  const singleTime = elapsed / 100;

  return {
    id: 5,
    name: 'L2 统计模拟',
    target: '10 区域统计更新 < 5ms',
    actual: Math.round(singleTime * 1000) / 1000,
    unit: 'ms',
    passed: singleTime < 5,
    detail: `100次更新总计: ${elapsed.toFixed(3)}ms | 单次: ${singleTime.toFixed(4)}ms`,
  };
}
