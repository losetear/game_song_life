export interface LocationDef {
  id: string;
  name: string;
  description: string;
  connections: string[];  // 可直达的地点ID
}

export const LOCATIONS: Record<string, LocationDef> = {
  street: {
    id: 'street',
    name: '大街',
    description: '汴京最热闹的大街，人来人往，商贩云集。',
    connections: ['market', 'teahouse', 'clinic', 'residential', 'workshop'],
  },
  market: {
    id: 'market',
    name: '集市',
    description: '东西两市汇聚之地，百货琳琅，叫卖声不绝。',
    connections: ['street', 'dock', 'workshop'],
  },
  teahouse: {
    id: 'teahouse',
    name: '茶馆',
    description: '街角的茶馆，茶香四溢，是消息灵通之所。',
    connections: ['street'],
  },
  clinic: {
    id: 'clinic',
    name: '药铺',
    description: '李郎中的药铺，草药味弥漫，包治百病。',
    connections: ['street'],
  },
  dock: {
    id: 'dock',
    name: '码头',
    description: '汴河码头，南来北往的货船停泊于此。',
    connections: ['market', 'farmland'],
  },
  farmland: {
    id: 'farmland',
    name: '农田',
    description: '城郊的肥沃农田，四季庄稼不同。',
    connections: ['dock', 'mountain'],
  },
  residential: {
    id: 'residential',
    name: '民宅区',
    description: '普通百姓居住的坊巷，炊烟袅袅。',
    connections: ['street'],
  },
  mountain: {
    id: 'mountain',
    name: '山林',
    description: '城外连绵的丘陵山林，林木茂密。',
    connections: ['farmland'],
  },
  workshop: {
    id: 'workshop',
    name: '作坊区',
    description: '铁匠铺、木匠铺林立，叮叮当当不绝于耳。',
    connections: ['street', 'market'],
  },
  temple: {
    id: 'temple',
    name: '相国寺',
    description: '汴京最大的佛寺，香火鼎盛，也是文人雅士聚会之所。',
    connections: ['street', 'academy'],
  },
  academy: {
    id: 'academy',
    name: '书院',
    description: '太学所在，书声琅琅，是求学问道之地。',
    connections: ['temple', 'street'],
  },
  riverside: {
    id: 'riverside',
    name: '汴河畔',
    description: '汴河边柳树成荫，游人如织，是踏青赏月的好去处。',
    connections: ['dock', 'street'],
  },
  gambling_den: {
    id: 'gambling_den',
    name: '赌坊',
    description: '暗巷中的赌坊，鱼龙混杂，输赢只在一念之间。',
    connections: ['market'],
  },
  brothel: {
    id: 'brothel',
    name: '樊楼',
    description: '汴京最负盛名的酒楼，歌舞升平，达官贵人常来光顾。',
    connections: ['street'],
  },
  government_office: {
    id: 'government_office',
    name: '开封府',
    description: '威严的官署衙门，断案理政之地，百姓敬畏。',
    connections: ['street'],
  },
  ruins: {
    id: 'ruins',
    name: '废弃宅院',
    description: '城郊一处荒废多年的宅院，传闻闹鬼，无人敢近。',
    connections: ['farmland', 'mountain'],
  },
};

export function getLocation(id: string): LocationDef | undefined {
  return LOCATIONS[id];
}

export function getAllLocationIds(): string[] {
  return Object.keys(LOCATIONS);
}
