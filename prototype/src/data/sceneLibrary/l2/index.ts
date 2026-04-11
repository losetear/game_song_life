// ════════════════════════════════════════
// L2 粗粒场景 — 统一导出
// 共计 58 个区域级演出场景
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

import { L2_FARMLAND_SCENES } from './farmland';
import { L2_MOUNTAIN_SCENES } from './mountain';
import { L2_RIVER_SCENES } from './river';
import { L2_URBAN_SCENES } from './urban';
import { L2_CATASTROPHE_SCENES } from './catastrophe';
import { L2_PROSPERITY_SCENES } from './prosperity';

export const ALL_L2_SCENES: L2Scene[] = [
  ...L2_FARMLAND_SCENES,
  ...L2_MOUNTAIN_SCENES,
  ...L2_RIVER_SCENES,
  ...L2_URBAN_SCENES,
  ...L2_CATASTROPHE_SCENES,
  ...L2_PROSPERITY_SCENES,
];
