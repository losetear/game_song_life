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
  // === 原有4种 ===
  {
    id: 'farmer',
    name: '农家子弟',
    description: '汴京郊外农家的孩子，质朴勤劳，来到城中谋生。',
    startingLocation: 'farmland',
    vital: { hunger: 70, fatigue: 65, health: 85, mood: 60 },
    identity: { name: '', profession: '农夫', age: 18, personality: ['勤劳', '质朴'], origin: 'farmer' },
    copper: 50,
  },
  {
    id: 'merchant',
    name: '商贩之后',
    description: '世代经商之家，耳濡目染，对买卖有天生的敏锐。',
    startingLocation: 'market',
    vital: { hunger: 75, fatigue: 60, health: 80, mood: 70 },
    identity: { name: '', profession: '商贩', age: 20, personality: ['精明', '健谈'], origin: 'merchant' },
    copper: 120,
  },
  {
    id: 'scholar',
    name: '落魄书生',
    description: '寒窗苦读十载，家道中落，入京寻求功名。',
    startingLocation: 'street',
    vital: { hunger: 55, fatigue: 50, health: 65, mood: 45 },
    identity: { name: '', profession: '书生', age: 22, personality: ['才学', '清高'], origin: 'scholar' },
    copper: 30,
  },
  {
    id: 'craftsman',
    name: '手艺人后代',
    description: '祖传手艺在手，一双巧手走天下。',
    startingLocation: 'workshop',
    vital: { hunger: 70, fatigue: 60, health: 85, mood: 65 },
    identity: { name: '', profession: '匠人', age: 19, personality: ['灵巧', '坚韧'], origin: 'craftsman' },
    copper: 80,
  },

  // === 新增：武人系 ===
  {
    id: 'warrior',
    name: '武馆弟子',
    description: '自幼在武馆习得一身好拳脚，初出茅庐闯荡江湖。',
    startingLocation: 'temple',
    vital: { hunger: 75, fatigue: 50, health: 95, mood: 70 },
    identity: { name: '', profession: '武师', age: 20, personality: ['豪爽', '正直'], origin: 'warrior' },
    copper: 40,
  },
  {
    id: 'guard',
    name: '镖局少镖头',
    description: '父亲是老镖师，从小跟着走南闯北，见多识广。',
    startingLocation: 'street',
    vital: { hunger: 80, fatigue: 45, health: 90, mood: 68 },
    identity: { name: '', profession: '镖师', age: 23, personality: ['义气', '沉稳'], origin: 'guard' },
    copper: 100,
  },

  // === 新增：医者系 ===
  {
    id: 'doctor_apprentice',
    name: '郎中学徒',
    description: '跟随师父学了几年医术，略通药理，独自来京城行医。',
    startingLocation: 'clinic',
    vital: { hunger: 65, fatigue: 55, health: 78, mood: 58 },
    identity: { name: '', profession: '郎中', age: 21, personality: ['仁慈', '谨慎'], origin: 'doctor_apprentice' },
    copper: 60,
  },

  // === 新增：底层/江湖 ===
  {
    id: 'beggar',
    name: '流浪乞儿',
    description: '幼年丧亲，流落街头多年，练就了一身察言观色的本事。',
    startingLocation: 'street',
    vital: { hunger: 40, fatigue: 70, health: 60, mood: 35 },
    identity: { name: '', profession: '乞丐', age: 16, personality: ['机灵', '坚韧'], origin: 'beggar' },
    copper: 5,
  },
  {
    id: 'ex_eunuch',
    name: '逃出宫的内侍',
    description: '曾在宫中当差，因卷入宫廷风波仓皇出逃，隐姓埋名来到汴京。',
    startingLocation: 'residential',
    vital: { hunger: 60, fatigue: 55, health: 62, mood: 42 },
    identity: { name: '', profession: '闲人', age: 28, personality: ['阴沉', '机敏'], origin: 'ex_eunuch' },
    copper: 200,
  },

  // === 新增：文艺/技艺 ===
  {
    id: 'actor',
    name: '戏班伶人',
    description: '自小在戏班长大，唱念做打样样精通，却不愿终身困于勾栏。',
    startingLocation: 'brothel',
    vital: { hunger: 68, fatigue: 52, health: 80, mood: 72 },
    identity: { name: '', profession: '优伶', age: 19, personality: ['开朗', '敏感'], origin: 'actor' },
    copper: 45,
  },
  {
    id: 'painter',
    name: '画院画工',
    description: '在翰林图画院当过几年学徒，丹青造诣不俗，却因得罪权贵被逐出。',
    startingLocation: 'academy',
    vital: { hunger: 58, fatigue: 48, health: 72, mood: 50 },
    identity: { name: '', profession: '画师', age: 25, personality: ['清高', '孤傲'], origin: 'painter' },
    copper: 25,
  },

  // === 新增：宗教 ===
  {
    id: 'monk',
    name: '云游僧人',
    description: '相国寺出身，师父圆寂后开始云游四方，来到汴京挂单。',
    startingLocation: 'temple',
    vital: { hunger: 60, fatigue: 40, health: 88, mood: 75 },
    identity: { name: '', profession: '僧人', age: 26, personality: ['慈悲', '淡泊'], origin: 'monk' },
    copper: 15,
  },

  // === 新增：特殊身份 ===
  {
    id: 'fallen_noble',
    name: '落魄贵族',
    description: '祖上曾位列公卿，家道中落后只剩空架子，仍放不下身段。',
    startingLocation: 'residential',
    vital: { hunger: 65, fatigue: 50, health: 70, mood: 40 },
    identity: { name: '', profession: '闲人', age: 24, personality: ['清高', '傲慢'], origin: 'fallen_noble' },
    copper: 150,
  },
  {
    id: 'river_pirate',
    name: '金盆洗手的江洋大盗',
    description: '曾在汴河上劫掠过往商船，如今想做个普通人重新开始。',
    startingLocation: 'dock',
    vital: { hunger: 82, fatigue: 38, health: 92, mood: 55 },
    identity: { name: '', profession: '闲人', age: 30, personality: ['豪爽', '阴沉'], origin: 'river_pirate' },
    copper: 300,
  },
];
