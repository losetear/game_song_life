// === 演出结果解析 ===
//
// 三种判定类型: certain / contested / chance

import { OutcomeType } from './types';

export function resolveScene(
  outcomeType: OutcomeType,
  contestedStat: { actor: string; target: string } | undefined,
  successChance: number | undefined,
  actorStats: Record<string, number>,
  targetStats?: Record<string, number>,
): boolean {
  switch (outcomeType) {
    case 'certain':
      return true;
    case 'contested': {
      if (!contestedStat || !targetStats) return true;
      const actorVal = (actorStats[contestedStat.actor] as number) || 50;
      const targetVal = (targetStats[contestedStat.target] as number) || 50;
      const successRate = actorVal / (actorVal + targetVal + 1);
      return Math.random() < successRate;
    }
    case 'chance':
      return Math.random() < (successChance || 0.5);
    default:
      return true;
  }
}
