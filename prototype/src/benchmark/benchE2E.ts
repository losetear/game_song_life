// === 基准测试：端到端延迟 ===

import { WorldEngine } from '../world/worldEngine';
import { EntityType } from '../ecs/types';
import { generateEntities } from '../data/entities';
import { BenchmarkItem } from '../server/protocol';

export function benchE2E(): BenchmarkItem {
  // E2E 测试模拟完整流程：服务器收到消息 → 处理 → 返回
  const engine = new WorldEngine();
  const gen = generateEntities(engine.em, engine.worldMap);
  engine.registerL0(gen.l0Ids);
  engine.registerL1(gen.l1Ids);
  engine.regionSim.update('summer', 1.0);

  const playerId = engine.em.create(EntityType.NPC);
  engine.em.addComponent(playerId, 'Position', { x: 50, y: 50, areaId: 'city', gridId: 'center_street' });
  engine.em.addComponent(playerId, 'Vital', { hunger: 80, fatigue: 80, health: 100, mood: 70 });
  engine.em.addComponent(playerId, 'Wallet', { copper: 100 });
  engine.em.addComponent(playerId, 'Inventory', { items: [] });
  engine.em.addComponent(playerId, 'Identity', { name: '你', profession: 'wanderer', age: 25, personality: [] });
  engine.worldMap.addEntity(playerId, 'center_street');

  // 模拟序列化 + 处理 + 序列化
  const times: number[] = [];
  for (let i = 0; i < 10; i++) {
    // 模拟接收消息（JSON parse）
    const msg = `{"type":"action","actionId":"buy_food","params":{},"seqId":${i}}`;
    const parseStart = performance.now();
    const parsed = JSON.parse(msg);

    // 处理
    const result = engine.executePlayerAction(playerId, parsed.actionId, parsed.params);

    // 模拟发送响应（JSON stringify）
    const response = JSON.stringify({
      type: 'actionResult',
      seqId: parsed.seqId,
      data: { message: result.message },
      timings: result.timings,
    });

    const elapsed = performance.now() - parseStart;
    times.push(elapsed);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);

  return {
    id: 9,
    name: '端到端延迟',
    target: '浏览器点击到看到结果 ≤ 250ms',
    actual: Math.round(avgTime * 100) / 100,
    unit: 'ms',
    passed: avgTime <= 250,
    detail: `平均: ${avgTime.toFixed(2)}ms | 最大: ${maxTime.toFixed(2)}ms (含JSON序列化)`,
  };
}
