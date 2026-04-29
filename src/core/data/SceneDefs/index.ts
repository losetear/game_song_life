import type { BranchEvent } from '../../ai/SceneLibrary/types';
import { SOCIAL_EVENTS } from './social';
import { SURVIVAL_EVENTS } from './survival';
import { WORK_EVENTS } from './work';
import { SPECIAL_EVENTS } from './special';

export const ALL_EVENTS: BranchEvent[] = [
  ...SOCIAL_EVENTS,
  ...SURVIVAL_EVENTS,
  ...WORK_EVENTS,
  ...SPECIAL_EVENTS,
];
