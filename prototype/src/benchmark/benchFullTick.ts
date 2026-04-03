// === 基准测试：完整 Tick ===

import { WorldEngine } from '../world/worldEngine';
import { EntityType } from '../ecs/types';
import { generateEntities } from '../data/entities';
import { BenchmarkItem } from '../server/protocol';

export function benchFullTick(): BenchmarkItem {
  const engine = new WorldEngine();

  // 生成实体
  const gen = generateEntities(engine.em, engine.worldMap);
  engine.registerL0(gen.l0Ids);
  engine.registerL1(gen.l1Ids);

  // 创建玩家
  const playerId = engine.em.create(EntityType.NPC);
  engine.em.addComponent(playerId, 'Position', { x: 50, y: 50, areaId: 'city', gridId: 'center_street' });
  engine.em.addComponent(playerId, 'Vital', { hunger: 80, fatigue: 80, health: 100, mood: 70 });
  engine.em.addComponent(playerId, 'Wallet', { copper: 100 });
  engine.em.addComponent(playerId, 'Inventory', { items: [] });
  engine.em.addComponent(playerId, 'Identity', { name: '你', profession: 'wanderer', age: 25, personality: [] });
  engine.worldMap.addEntity(playerId, 'center_street');

  // 初始化区域统计
  engine.regionSim.update('summer', 1.0);

  // 执行 5 次 tick 取平均
  const times: number[] = [];
  let lastResult: any;

  for (let i = 0; i < 5; i++) {
    const result = engine.executePlayerAction(playerId, 'rest', {});
    times.push(result.timings.total);
    lastResult = result;
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const t = lastResult.timings;

  return {
    id: 7,
    name: '完整 Tick',
    target: '一次玩家操作触发全流程 < 150ms',
    actual: Math.round(maxTime * 100) / 100,
    unit: 'ms',
    passed: maxTime < 150,
    detail: `平均: ${avgTime.toFixed(2)}ms | 最大: ${maxTime.toFixed(2)}ms | breakdown: 玩家${t.playerAction.toFixed(1)} L0${t.l0GOAP.toFixed(1)} L1${t.l1BehaviorTree.toFixed(1)} L2${t.l2Statistics.toFixed(2)} 经济${t.economy.toFixed(2)} 感知${t.perception.toFixed(2)} 生命${t.vitalDecay.toFixed(2)}`,
  };
}
