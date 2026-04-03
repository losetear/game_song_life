// === 入口：CS 分离架构 ===
// --server    : 跳过基准测试，初始化世界，启动服务器
// --benchmark : 只运行基准测试，不启动服务器
// (无参数)    : 先运行基准测试，再启动服务器

import { WorldEngine } from './world/worldEngine';
import { GameServer } from './server/gameServer';
import { runAllBenchmarks, printReport } from './benchmark/runner';
import { generateEntities } from './data/entities';
import { PropagationEngine } from './propagation/propagationEngine';
import { BenchmarkReport } from './server/protocol';

const args = process.argv.slice(2);
const isBenchmarkOnly = args.includes('--benchmark');
const isServerOnly = args.includes('--server');
const port = parseInt(args.find(a => a.startsWith('--port='))?.split('=')[1] || '5173', 10);

// ── Step 1: 基准测试（按需） ──────────────────────────────
let benchmarkReport: BenchmarkReport | null = null;

if (!isServerOnly) {
  console.log('🔬 市井录 — 技术验证基准测试\n');
  console.log('正在运行基准测试...\n');
  benchmarkReport = runAllBenchmarks();
  printReport(benchmarkReport);
}

if (isBenchmarkOnly) {
  process.exit(0);
}

// ── Step 2: 初始化世界引擎 ────────────────────────────────
console.log('\n⏳ 初始化世界引擎...\n');
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

// ── Step 3: 启动服务器 ────────────────────────────────────
const server = new GameServer(engine, benchmarkReport);
server.start(port);
