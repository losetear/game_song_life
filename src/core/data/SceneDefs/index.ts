import type { BranchEvent } from '../../ai/SceneLibrary/types';
import { SOCIAL_EVENTS } from './social';
import { SURVIVAL_EVENTS } from './survival';
import { WORK_EVENTS } from './work';
import { SPECIAL_EVENTS } from './special';
import { ROMANCE_EVENTS } from './romance';
import { ADVENTURE_EVENTS } from './adventure';
import { JIANGHU_EVENTS } from './jianghu';
import { CULTURE_EVENTS } from './culture';
import { FAMILY_EVENTS } from './family';
import { DISASTER_EVENTS } from './disaster';

export const ALL_EVENTS: BranchEvent[] = [
  ...SOCIAL_EVENTS,
  ...SURVIVAL_EVENTS,
  ...WORK_EVENTS,
  ...SPECIAL_EVENTS,
  ...ROMANCE_EVENTS,
  ...ADVENTURE_EVENTS,
  ...JIANGHU_EVENTS,
  ...CULTURE_EVENTS,
  ...FAMILY_EVENTS,
  ...DISASTER_EVENTS,
];
