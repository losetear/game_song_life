import type { VitalComponent, IdentityComponent } from '../ecs/types';

export interface PlayerOrigin {
  id: string;
  name: string;
  description: string;
  startingLocation: string;
  vital: Omit<VitalComponent, never>;
  identity: Omit<IdentityComponent, 'isPlayer'>;
  copper: number;
}

export const PLAYER_ORIGINS: PlayerOrigin[] = [
  {
    id: 'farmer',
    name: '农家子弟',
    description: '汴京郊外农家的孩子，质朴勤劳，来到城中谋生。',
    startingLocation: 'farmland',
    vital: { hunger: 70, fatigue: 65, health: 85, mood: 60 },
    identity: {
      name: '',
      profession: '农夫',
      age: 18,
      personality: ['勤劳', '质朴'],
      origin: 'farmer',
    },
    copper: 50,
  },
  {
    id: 'merchant',
    name: '商贩之后',
    description: '世代经商之家，耳濡目染，对买卖有天生的敏锐。',
    startingLocation: 'market',
    vital: { hunger: 75, fatigue: 60, health: 80, mood: 70 },
    identity: {
      name: '',
      profession: '商贩',
      age: 20,
      personality: ['精明', '健谈'],
      origin: 'merchant',
    },
    copper: 120,
  },
  {
    id: 'scholar',
    name: '落魄书生',
    description: '寒窗苦读十载，家道中落，入京寻求功名。',
    startingLocation: 'street',
    vital: { hunger: 55, fatigue: 50, health: 65, mood: 45 },
    identity: {
      name: '',
      profession: '书生',
      age: 22,
      personality: ['才学', '清高'],
      origin: 'scholar',
    },
    copper: 30,
  },
  {
    id: 'craftsman',
    name: '手艺人后代',
    description: '祖传手艺在手，一双巧手走天下。',
    startingLocation: 'workshop',
    vital: { hunger: 70, fatigue: 60, health: 85, mood: 65 },
    identity: {
      name: '',
      profession: '匠人',
      age: 19,
      personality: ['灵巧', '坚韧'],
      origin: 'craftsman',
    },
    copper: 80,
  },
];
