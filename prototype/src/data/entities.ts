// === 万级实体生成器 ===

import { EntityManager } from '../ecs/entityManager';
import { WorldMap } from '../spatial/worldMap';
import { EntityType } from '../ecs/types';
import { generateNPC } from './npcTemplates';
import { getAnimalType } from './animalTemplates';
import { getPlantType } from './plantTemplates';
import { CITY_GRIDS, FARM_GRIDS, MOUNTAIN_GRIDS, RIVER_GRIDS, ALL_GRID_IDS } from './areaDefs';

export interface EntityGenerationResult {
  totalCount: number;
  l0Ids: number[];
  l1Ids: number[];
  l2GridCount: number;
  breakdown: {
    npc: number;
    animal: number;
    plant: number;
    mineral: number;
    building: number;
    item: number;
  };
}

/**
 * 生成万级实体
 * NPC: 800 (10 L0 + 490 L1 + 300 L2)
 * 动物: 1,200 (200 L1 + 1000 L2)
 * 植物: 4,000 (L2)
 * 矿物: 1,000 (L2)
 * 建筑: 500 (L1)
 * 物品: 2,500 (分散)
 */
export function generateEntities(em: EntityManager, worldMap: WorldMap): EntityGenerationResult {
  const l0Ids: number[] = [];
  const l1Ids: number[] = [];
  const breakdown = { npc: 0, animal: 0, plant: 0, mineral: 0, building: 0, item: 0 };

  // === NPC: 800 ===
  // L0: 10 命名 NPC（GOAP）
  for (let i = 0; i < 10; i++) {
    const id = em.create(EntityType.NPC);
    const npc = generateNPC(i);
    const gridId = CITY_GRIDS[i % CITY_GRIDS.length];

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId: 'city', gridId });
    em.addComponent(id, 'Vital', { hunger: 60 + Math.random() * 30, fatigue: 60 + Math.random() * 30, health: 80 + Math.random() * 20, mood: 50 + Math.random() * 30 });
    em.addComponent(id, 'Identity', { name: npc.name, profession: npc.profession, age: npc.age, personality: npc.personality });
    em.addComponent(id, 'Wallet', { copper: 20 + Math.floor(Math.random() * 80) });
    em.addComponent(id, 'Inventory', { items: [{ itemType: 'food', amount: 1 }] });
    em.addComponent(id, 'AI', { goals: ['survive'], currentPlan: [], planCooldown: 0, aiLevel: 0 });
    em.addComponent(id, 'Memory', { recentEvents: [], impressions: {} });
    em.addComponent(id, 'Relations', { relations: {} });

    worldMap.addEntity(id, gridId);
    l0Ids.push(id);
    breakdown.npc++;
  }

  // L1: 490 行为树 NPC
  for (let i = 10; i < 500; i++) {
    const id = em.create(EntityType.NPC);
    const npc = generateNPC(i);
    const gridId = ALL_GRID_IDS[Math.floor(Math.random() * ALL_GRID_IDS.length)];
    const areaId = getAreaByGrid(gridId);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Vital', { hunger: 40 + Math.random() * 40, fatigue: 40 + Math.random() * 40, health: 70 + Math.random() * 30, mood: 40 + Math.random() * 40 });
    em.addComponent(id, 'Identity', { name: npc.name, profession: npc.profession, age: npc.age, personality: npc.personality });
    em.addComponent(id, 'Wallet', { copper: 10 + Math.floor(Math.random() * 50) });
    em.addComponent(id, 'Inventory', { items: [] });
    em.addComponent(id, 'AI', { goals: [], currentPlan: [], planCooldown: 0, aiLevel: 1 });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    breakdown.npc++;
  }

  // L2: 300 统计 NPC（不创建实体，只在 RegionSim 中统计）
  breakdown.npc += 300;

  // === 动物: 1,200 ===
  // L1: 200 家畜
  for (let i = 0; i < 200; i++) {
    const id = em.create(EntityType.ANIMAL);
    const animal = getAnimalType(false);
    const gridId = [...FARM_GRIDS, ...CITY_GRIDS][Math.floor(Math.random() * (FARM_GRIDS.length + CITY_GRIDS.length))];
    const areaId = getAreaByGrid(gridId);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Vital', { hunger: 50 + Math.random() * 40, fatigue: 70 + Math.random() * 30, health: 80 + Math.random() * 20, mood: 60 });
    em.addComponent(id, 'AI', { goals: [], currentPlan: [], planCooldown: 0, aiLevel: 1 });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    breakdown.animal++;
  }

  // L2: 1000 野生动物（统计）
  breakdown.animal += 1000;

  // === 植物: 4,000 ===
  // L1: 200 农田植物
  for (let i = 0; i < 100; i++) {
    const id = em.create(EntityType.PLANT);
    const plant = getPlantType(true);
    const gridId = FARM_GRIDS[Math.floor(Math.random() * FARM_GRIDS.length)];

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId: 'farmland', gridId });
    em.addComponent(id, 'Identity', { name: plant.name, profession: '', age: 0, personality: [] });
    em.addComponent(id, 'Growth', { stage: Math.floor(Math.random() * 3), growProgress: Math.random() * 100, seasonReq: plant.seasonReq });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    breakdown.plant++;
  }
  // L1: 100 野外植物（山/河边）
  for (let i = 0; i < 100; i++) {
    const id = em.create(EntityType.PLANT);
    const plant = getPlantType(false);
    const gridId = [...MOUNTAIN_GRIDS, ...RIVER_GRIDS][Math.floor(Math.random() * (MOUNTAIN_GRIDS.length + RIVER_GRIDS.length))];
    const areaId = getAreaByGrid(gridId);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Identity', { name: plant.name, profession: '', age: 0, personality: [] });
    em.addComponent(id, 'Growth', { stage: Math.floor(Math.random() * 3), growProgress: Math.random() * 100, seasonReq: plant.seasonReq });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    breakdown.plant++;
  }
  // L2: 3,800 统计
  breakdown.plant += 3800;

  // === 矿物: 1,000 ===
  // L1: 200 山区矿物
  const MINERAL_TYPES = ['铁矿', '铜矿', '石料', '煤矿', '金沙'];
  for (let i = 0; i < 200; i++) {
    const id = em.create(EntityType.MINERAL);
    const mineralName = MINERAL_TYPES[Math.floor(Math.random() * MINERAL_TYPES.length)];
    const gridId = MOUNTAIN_GRIDS[Math.floor(Math.random() * MOUNTAIN_GRIDS.length)];

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId: 'mountain', gridId });
    em.addComponent(id, 'Identity', { name: mineralName, profession: '', age: 0, personality: [] });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    breakdown.mineral++;
  }
  // L2: 800 统计
  breakdown.mineral += 800;

  // === 建筑: 500 (L1) ===
  for (let i = 0; i < 500; i++) {
    const id = em.create(EntityType.BUILDING);
    const gridId = ALL_GRID_IDS[Math.floor(Math.random() * ALL_GRID_IDS.length)];
    const areaId = getAreaByGrid(gridId);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Building', { type: 'house', ownerId: 0, openHours: '辰-酉' });
    em.addComponent(id, 'Durability', { max: 100, current: 80 + Math.floor(Math.random() * 20) });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    breakdown.building++;
  }

  // === 物品: 2,500 ===
  for (let i = 0; i < 2500; i++) {
    const id = em.create(EntityType.ITEM);
    const gridId = ALL_GRID_IDS[Math.floor(Math.random() * ALL_GRID_IDS.length)];
    const areaId = getAreaByGrid(gridId);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Durability', { max: 100, current: 50 + Math.floor(Math.random() * 50) });
    em.addComponent(id, 'Interactable', { actions: ['pickup'], conditions: {} });

    worldMap.addEntity(id, gridId);
    breakdown.item++;
  }

  return {
    totalCount: breakdown.npc + breakdown.animal + breakdown.plant + breakdown.mineral + breakdown.building + breakdown.item,
    l0Ids,
    l1Ids,
    l2GridCount: 20,
    breakdown,
  };
}

function getAreaByGrid(gridId: string): string {
  if (CITY_GRIDS.includes(gridId)) return 'city';
  if (FARM_GRIDS.includes(gridId)) return 'farmland';
  if (MOUNTAIN_GRIDS.includes(gridId)) return 'mountain';
  if (RIVER_GRIDS.includes(gridId)) return 'river';
  return 'city';
}
