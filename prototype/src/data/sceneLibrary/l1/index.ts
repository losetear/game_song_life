// ════════════════════════════════════════
// L1 中等粒度演出库 — 统一导出
// 共 100 个场景
// survival: 15 | work: 20 | social: 15
// trade: 10 | conflict: 8 | leisure: 12
// seasonal: 10 | faction: 10
// ════════════════════════════════════════

import { L1Scene } from '../../../ai/sceneLibrary/types';

import { L1_SURVIVAL_SCENES } from './survival';
import { L1_WORK_SCENES } from './work';
import { L1_SOCIAL_SCENES } from './social';
import { L1_TRADE_SCENES } from './trade';
import { L1_CONFLICT_SCENES } from './conflict';
import { L1_LEISURE_SCENES } from './leisure';
import { L1_SEASONAL_SCENES } from './seasonal';
import { L1_FACTION_SCENES } from './faction';

export const ALL_L1_SCENES: L1Scene[] = [
  ...L1_SURVIVAL_SCENES,
  ...L1_WORK_SCENES,
  ...L1_SOCIAL_SCENES,
  ...L1_TRADE_SCENES,
  ...L1_CONFLICT_SCENES,
  ...L1_LEISURE_SCENES,
  ...L1_SEASONAL_SCENES,
  ...L1_FACTION_SCENES,
];

// Re-export individual arrays for targeted access
export {
  L1_SURVIVAL_SCENES,
  L1_WORK_SCENES,
  L1_SOCIAL_SCENES,
  L1_TRADE_SCENES,
  L1_CONFLICT_SCENES,
  L1_LEISURE_SCENES,
  L1_SEASONAL_SCENES,
  L1_FACTION_SCENES,
};
