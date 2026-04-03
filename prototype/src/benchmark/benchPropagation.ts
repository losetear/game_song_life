// === 基准测试：信息传播 ===

import { PropagationEngine, PropagationEvent } from '../propagation/propagationEngine';
import { BenchmarkItem } from '../server/protocol';

export function benchPropagation(): BenchmarkItem {
  const engine = new PropagationEngine();

  // 构建 500 NPC 关系网
  const npcIds = Array.from({ length: 500 }, (_, i) => i + 1);
  engine.buildRandomRelations(npcIds, 5);

  // 10 个事件 × 5 层传播
  const events: PropagationEvent[] = Array.from({ length: 10 }, (_, i) => ({
    source: i + 1,
    importance: 3 + Math.floor(Math.random() * 7),
    content: `事件${i + 1}`,
    currentHop: 0,
    detailLoss: 0,
  }));

  const start = performance.now();
  const results = engine.propagateBatch(events, 5);
  const elapsed = performance.now() - start;

  const totalReached = results.reduce((sum, r) =>
    sum + r.hops.reduce((s, h) => s + h.reached.length, 0), 0);

  return {
    id: 10,
    name: '信息传播',
    target: '10 事件 × 5 层传播 < 5ms',
    actual: Math.round(elapsed * 1000) / 1000,
    unit: 'ms',
    passed: elapsed < 5,
    detail: `${events.length}事件: ${elapsed.toFixed(3)}ms | 总触达: ${totalReached}人次 | 平均 ${(elapsed / events.length).toFixed(3)}ms/事件`,
  };
}
