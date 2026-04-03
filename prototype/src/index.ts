// === 入口：运行基准测试 + 启动服务器 ===

import { WorldEngine } from './world/worldEngine';
import { GameServer } from './server/gameServer';
import { runAllBenchmarks, printReport } from './benchmark/runner';
import { generateEntities } from './data/entities';
import { PropagationEngine } from './propagation/propagationEngine';

const args = process.argv.slice(2);
const isBenchmark = args.includes('--benchmark');
const isServer = args.includes('--server');

if (isBenchmark || (!isBenchmark && !isServer)) {
  console.log('🔬 市井录 — 技术验证基准测试\n');
  console.log('正在运行基准测试...\n');

  // 先运行完整基准测试
  const report = runAllBenchmarks();
  printReport(report);
}

if (isServer || (!isBenchmark && !isServer)) {
  // 初始化世界引擎 + 启动服务器
  const engine = new WorldEngine();
  const gen = generateEntities(engine.em, engine.worldMap);
  engine.registerL0(gen.l0Ids);
  engine.registerL1(gen.l1Ids);
  engine.regionSim.update('summer', 1.0);

  // 构建关系网
  const propEngine = new PropagationEngine();
  propEngine.buildRandomRelations(gen.l0Ids, 3);

  console.log(`\n世界初始化完成:`);
  console.log(`  总实体: ${gen.totalCount} (ECS 实体: ${engine.em.entityCount})`);
  console.log(`  L0 NPC: ${gen.l0Ids.length} | L1 NPC: ${gen.l1Ids.length}`);
  console.log(`  ${JSON.stringify(gen.breakdown)}`);

  const server = new GameServer(engine);
  server.start(3000);
}
