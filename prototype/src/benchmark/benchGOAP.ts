// === 基准测试：GOAP 规划 ===

import { plan } from '../ai/goap/planner';
import { GOAP_ACTIONS } from '../ai/goap/actions';
import { BenchmarkItem } from '../server/protocol';

export function benchGOAP(): BenchmarkItem {
  const npcCount = 10;
  const times: number[] = [];

  for (let i = 0; i < npcCount; i++) {
    // 构建不同的初始状态
    const startState: Record<string, any> = {
      hunger: 20 + Math.random() * 40,
      fatigue: 40 + Math.random() * 40,
      mood: 30 + Math.random() * 30,
      at_home: Math.random() > 0.5,
      at_market: Math.random() > 0.5,
      has_money: Math.random() > 0.3,
      has_food: Math.random() > 0.6,
    };

    const goal: Record<string, any> = { hunger: 70 };

    const t0 = performance.now();
    const result = plan(startState, goal, GOAP_ACTIONS);
    const elapsed = performance.now() - t0;
    times.push(elapsed);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);

  return {
    id: 3,
    name: 'L0 GOAP',
    target: '10 NPC + 30 行动, 单次规划 < 10ms',
    actual: Math.round(maxTime * 100) / 100,
    unit: 'ms',
    passed: maxTime < 10,
    detail: `平均: ${avgTime.toFixed(3)}ms | 最大: ${maxTime.toFixed(3)}ms | 各次: [${times.map(t => t.toFixed(2)).join(', ')}]`,
  };
}
