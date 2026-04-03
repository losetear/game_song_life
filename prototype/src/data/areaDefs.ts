// === 20 个 Grid 定义 ===

export const GRID_DEFS = [
  { id: 'center_street', name: '中央大街', areaId: 'city' },
  { id: 'east_market', name: '东市', areaId: 'city' },
  { id: 'west_market', name: '西市', areaId: 'city' },
  { id: 'dock', name: '码头', areaId: 'city' },
  { id: 'cloth_shop', name: '布庄', areaId: 'city' },
  { id: 'tea_house', name: '茶楼', areaId: 'city' },
  { id: 'government', name: '衙门', areaId: 'city' },
  { id: 'temple', name: '寺庙', areaId: 'city' },
  { id: 'residential_north', name: '北城住宅', areaId: 'city' },
  { id: 'residential_south', name: '南城住宅', areaId: 'city' },
  { id: 'east_farm', name: '东田', areaId: 'farmland' },
  { id: 'south_farm', name: '南田', areaId: 'farmland' },
  { id: 'irrigation', name: '水渠', areaId: 'farmland' },
  { id: 'shallow_mountain', name: '浅山', areaId: 'mountain' },
  { id: 'deep_mountain', name: '深山', areaId: 'mountain' },
  { id: 'stream', name: '山溪', areaId: 'mountain' },
  { id: 'mountain_village', name: '山村', areaId: 'mountain' },
  { id: 'upstream', name: '上游', areaId: 'river' },
  { id: 'downstream', name: '下游', areaId: 'river' },
  { id: 'riverbank', name: '河岸', areaId: 'river' },
];

export const CITY_GRIDS: string[] = GRID_DEFS.filter(g => g.areaId === 'city').map(g => g.id);
export const FARM_GRIDS: string[] = GRID_DEFS.filter(g => g.areaId === 'farmland').map(g => g.id);
export const MOUNTAIN_GRIDS: string[] = GRID_DEFS.filter(g => g.areaId === 'mountain').map(g => g.id);
export const RIVER_GRIDS: string[] = GRID_DEFS.filter(g => g.areaId === 'river').map(g => g.id);
export const ALL_GRID_IDS: string[] = GRID_DEFS.map(g => g.id);
