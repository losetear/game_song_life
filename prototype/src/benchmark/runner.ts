// === 测试运行器 + 报告生成 ===

import { BenchmarkReport, BenchmarkItem } from '../server/protocol';
import { WorldEngine } from '../world/worldEngine';

import { benchECS } from './benchECS';
import { benchSpatial } from './benchSpatial';
import { benchGOAP } from './benchGOAP';
import { benchBehaviorTree } from './benchBehaviorTree';
import { benchStatistics } from './benchStatistics';
import { benchLOD } from './benchLOD';
import { benchFullTick } from './benchFullTick';
import { benchSave } from './benchSave';
import { benchE2E } from './benchE2E';
import { benchPropagation } from './benchPropagation';

export function runAllBenchmarks(engine?: WorldEngine): BenchmarkReport {
  const results: BenchmarkItem[] = [];

  const benches: Array<() => BenchmarkItem> = [
    benchECS,
    benchSpatial,
    benchGOAP,
    benchBehaviorTree,
    benchStatistics,
    benchLOD,
    benchFullTick,
    benchSave,
    benchE2E,
    benchPropagation,
  ];

  for (const bench of benches) {
    try {
      results.push(bench());
    } catch (err) {
      results.push({
        id: results.length + 1,
        name: bench.name,
        target: '-',
        actual: -1,
        unit: 'ms',
        passed: false,
        detail: `ERROR: ${err}`,
      });
    }
  }

  const passed = results.filter(r => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    results,
    summary: { passed, failed: results.length - passed, total: results.length },
  };
}

export function printReport(report: BenchmarkReport): void {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     市井录 · 第零阶段技术验证 · 基准测试报告                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');

  for (const r of report.results) {
    const icon = r.passed ? '✅' : '❌';
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`║ ${icon} #${String(r.id).padStart(2)} ${r.name.padEnd(12)} | ${status} | ${String(r.actual.toFixed(2)).padStart(8)} ms | ${r.target}`);
    if (r.detail) {
      console.log(`║      ${r.detail}`);
    }
  }

  console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');
  const summaryIcon = report.summary.failed === 0 ? '✅' : '⚠️';
  console.log(`║ ${summaryIcon} 总计: ${report.summary.passed}/${report.summary.total} 通过 | ${report.summary.failed} 失败`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n时间: ${report.timestamp}\n`);
}
