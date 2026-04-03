// === 植物模板 ===

export const PLANT_TYPES = [
  { type: 'rice', name: '水稻', seasonReq: 'summer', growTime: 100 },
  { type: 'wheat', name: '小麦', seasonReq: 'autumn', growTime: 80 },
  { type: 'vegetable', name: '蔬菜', seasonReq: 'spring', growTime: 40 },
  { type: 'herb', name: '草药', seasonReq: 'summer', growTime: 60 },
  { type: 'tree', name: '树木', seasonReq: 'spring', growTime: 200 },
  { type: 'bamboo', name: '竹子', seasonReq: 'spring', growTime: 150 },
  { type: 'flower', name: '野花', seasonReq: 'spring', growTime: 30 },
];

export function getPlantType(isFarm: boolean): typeof PLANT_TYPES[number] {
  const pool = isFarm
    ? PLANT_TYPES.filter(p => ['rice', 'wheat', 'vegetable'].includes(p.type))
    : PLANT_TYPES.filter(p => ['herb', 'tree', 'bamboo', 'flower'].includes(p.type));
  return pool[Math.floor(Math.random() * pool.length)];
}
