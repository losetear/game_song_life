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
};

export function getLocation(id: string): LocationDef | undefined {
  return LOCATIONS[id];
}

export function getAllLocationIds(): string[] {
  return Object.keys(LOCATIONS);
}
