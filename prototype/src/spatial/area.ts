// === Area → Grid 映射 ===

export interface AreaDef {
  id: string;
  name: string;
  gridIds: string[];
}

export const AREA_DEFINITIONS: AreaDef[] = [
  { id: 'city', name: '汴京城内', gridIds: [
    'center_street', 'east_market', 'west_market', 'dock',
    'cloth_shop', 'tea_house', 'government', 'temple',
    'residential_north', 'residential_south'
  ]},
  { id: 'farmland', name: '城外农田', gridIds: ['east_farm', 'south_farm', 'irrigation'] },
  { id: 'mountain', name: '山林', gridIds: ['shallow_mountain', 'deep_mountain', 'stream', 'mountain_village'] },
  { id: 'river', name: '河流', gridIds: ['upstream', 'downstream', 'riverbank'] },
];

// Grid 相邻关系（双向）
export const GRID_ADJACENCY: Record<string, string[]> = {
  center_street: ['east_market', 'west_market', 'tea_house', 'government'],
  east_market: ['center_street', 'dock', 'cloth_shop', 'east_farm'],
  west_market: ['center_street', 'residential_south', 'south_farm'],
  dock: ['east_market', 'upstream', 'downstream'],
  cloth_shop: ['east_market', 'residential_north'],
  tea_house: ['center_street', 'government', 'residential_north'],
  government: ['center_street', 'tea_house', 'temple'],
  temple: ['government', 'residential_north', 'shallow_mountain'],
  residential_north: ['cloth_shop', 'tea_house', 'temple', 'mountain_village'],
  residential_south: ['west_market', 'south_farm', 'irrigation'],
  east_farm: ['east_market', 'irrigation', 'south_farm'],
  south_farm: ['west_market', 'residential_south', 'east_farm', 'irrigation'],
  irrigation: ['south_farm', 'east_farm', 'riverbank'],
  shallow_mountain: ['temple', 'mountain_village', 'deep_mountain', 'stream'],
  deep_mountain: ['shallow_mountain', 'stream'],
  stream: ['shallow_mountain', 'deep_mountain', 'upstream', 'mountain_village'],
  mountain_village: ['residential_north', 'shallow_mountain', 'stream'],
  upstream: ['dock', 'stream', 'riverbank'],
  downstream: ['dock', 'riverbank'],
  riverbank: ['irrigation', 'upstream', 'downstream'],
};

export function getAreaIdByGrid(gridId: string): string | undefined {
  for (const area of AREA_DEFINITIONS) {
    if (area.gridIds.includes(gridId)) return area.id;
  }
  return undefined;
}
