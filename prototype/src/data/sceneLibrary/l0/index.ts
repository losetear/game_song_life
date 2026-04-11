// ════════════════════════════════════════
// L0 精细演出库 — 统一导出
// 共 16 个类别，约 260 个场景
// ════════════════════════════════════════

import { L0Scene } from '../../../ai/sceneLibrary/types';

import { SURVIVAL_SCENES } from './survival';
import { MISCHIEF_SCENES } from './mischief';
import { CONFLICT_SCENES } from './conflict';
import { SOCIAL_SCENES } from './social';
import { WORK_SCENES } from './work';
import { LEISURE_SCENES } from './leisure';
import { TRADE_SCENES } from './trade';
import { MOVE_SCENES } from './move';
import { FAMILY_SCENES } from './family';
import { ROMANCE_SCENES } from './romance';
import { NATURE_SCENES } from './nature';
import { SPIRITUAL_SCENES } from './spiritual';
import { CREATIVITY_SCENES } from './creativity';
import { FACTION_SCENES } from './faction';
import { SECRETS_SCENES } from './secrets';
import { SEASONAL_SCENES } from './seasonal';

export const ALL_L0_SCENES: L0Scene[] = [
  ...SURVIVAL_SCENES,
  ...MISCHIEF_SCENES,
  ...CONFLICT_SCENES,
  ...SOCIAL_SCENES,
  ...WORK_SCENES,
  ...LEISURE_SCENES,
  ...TRADE_SCENES,
  ...MOVE_SCENES,
  ...FAMILY_SCENES,
  ...ROMANCE_SCENES,
  ...NATURE_SCENES,
  ...SPIRITUAL_SCENES,
  ...CREATIVITY_SCENES,
  ...FACTION_SCENES,
  ...SECRETS_SCENES,
  ...SEASONAL_SCENES,
];

export {
  SURVIVAL_SCENES, MISCHIEF_SCENES, CONFLICT_SCENES, SOCIAL_SCENES,
  WORK_SCENES, LEISURE_SCENES, TRADE_SCENES, MOVE_SCENES,
  FAMILY_SCENES, ROMANCE_SCENES, NATURE_SCENES, SPIRITUAL_SCENES,
  CREATIVITY_SCENES, FACTION_SCENES, SECRETS_SCENES, SEASONAL_SCENES,
};
