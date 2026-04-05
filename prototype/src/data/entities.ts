// === 万级实体生成器 ===

import { EntityManager } from '../ecs/entityManager';
import { WorldMap } from '../spatial/worldMap';
import { EntityType } from '../ecs/types';
import { generateNPC } from './npcTemplates';
import { getAnimalType } from './animalTemplates';
import { getPlantType } from './plantTemplates';
import { CITY_GRIDS, FARM_GRIDS, MOUNTAIN_GRIDS, RIVER_GRIDS, ALL_GRID_IDS } from './areaDefs';
import { BUILDING_TEMPLATES, BUILDING_TYPE_LIST, SPECIAL_BUILDING_TYPES, getBuildingName, getBuildingDescription, getBuildingRooms, getBuildingOpenHours } from './buildingTemplates';
import { FactionComponent } from '../ecs/types';

// === 12 个预设组织 ===
const FACTION_DEFS = [
  { name: '开封府', type: 'government' as const, influence: 90, treasury: 50000, territory: ['center_street','east_market','dock','residential_north','residential_south'] },
  { name: '枢密院', type: 'government' as const, influence: 95, treasury: 80000, territory: ['government'] },
  { name: '户部', type: 'government' as const, influence: 85, treasury: 100000, territory: ['government'] },
  { name: '市舶司', type: 'government' as const, influence: 70, treasury: 30000, territory: ['dock','upstream','downstream'] },
  { name: '东市商会', type: 'merchant' as const, influence: 60, treasury: 20000, territory: ['east_market'] },
  { name: '布业行会', type: 'merchant' as const, influence: 45, treasury: 15000, territory: ['east_market','cloth_shop'] },
  { name: '药材行会', type: 'merchant' as const, influence: 40, treasury: 12000, territory: ['east_market'] },
  { name: '大相国寺', type: 'religion' as const, influence: 75, treasury: 25000, territory: ['temple'] },
  { name: '码头帮', type: 'underground' as const, influence: 35, treasury: 8000, territory: ['dock'] },
  { name: '丐帮分舵', type: 'underground' as const, influence: 20, treasury: 2000, territory: ['center_street'] },
  { name: '太学', type: 'scholar' as const, influence: 55, treasury: 10000, territory: ['government'] },
  { name: '禁军', type: 'military' as const, influence: 80, treasury: 40000, territory: ['center_street','government'] },
];

// L0 NPC 职业映射: index 0→merchant, 1→farmer, 2→guard, 3→doctor, 4→hunter, 5→rogue, 6→merchant, 7→farmer, 8→guard, 9→doctor
// 组织与 L0 NPC 职业匹配
const FACTION_LEADER_PROFESSIONS: Record<string, string> = {
  '开封府': 'guard',       // NPC 2 or 8
  '枢密院': 'guard',       // NPC 2 or 8
  '户部': 'merchant',      // NPC 0 or 6
  '市舶司': 'merchant',    // NPC 0 or 6
  '东市商会': 'merchant',   // NPC 0 or 6
  '布业行会': 'merchant',   // NPC 0 or 6
  '药材行会': 'doctor',     // NPC 3 or 9
  '大相国寺': 'doctor',     // NPC 3 or 9
  '码头帮': 'rogue',        // NPC 5
  '丐帮分舵': 'rogue',      // NPC 5
  '太学': 'farmer',         // NPC 1 or 7 (closest to scholar)
  '禁军': 'hunter',         // NPC 4 (closest to military)
};

export interface FactionGenerationResult {
  factions: { id: number; faction: FactionComponent }[];
}

export function generateFactions(
  em: EntityManager,
  l0Ids: number[],
  l1Ids: number[],
): FactionGenerationResult {
  const factions: { id: number; faction: FactionComponent }[] = [];

  // 建立 L0 NPC 职业索引
  const l0ByProf: Record<string, number[]> = {};
  for (const id of l0Ids) {
    const identity = em.getComponent(id, 'Identity');
    if (!identity) continue;
    if (!l0ByProf[identity.profession]) l0ByProf[identity.profession] = [];
    l0ByProf[identity.profession].push(id);
  }

  // 建立 L1 NPC 职业索引（用于分配 members）
  const l1ByProf: Record<string, number[]> = {};
  for (const id of l1Ids) {
    const type = em.getType(id);
    if (type !== 'npc') continue;
    const identity = em.getComponent(id, 'Identity');
    if (!identity) continue;
    if (!l1ByProf[identity.profession]) l1ByProf[identity.profession] = [];
    l1ByProf[identity.profession].push(id);
  }

  // 分配 L0 leader 的使用记录
  const usedL0 = new Set<number>();
  // 分配 L1 member 的使用记录（避免同一NPC加入多个组织）
  const usedL1 = new Set<number>();

  for (const def of FACTION_DEFS) {
    const id = em.create(EntityType.FACTION);

    // 找匹配职业的 L0 NPC 作 leader
    const prof = FACTION_LEADER_PROFESSIONS[def.name] || 'merchant';
    const candidates = l0ByProf[prof] || [];
    let leaderId = 0;
    for (const c of candidates) {
      if (!usedL0.has(c)) {
        leaderId = c;
        usedL0.add(c);
        break;
      }
    }
    // fallback: 从所有 L0 NPC 中找未使用的
    if (leaderId === 0) {
      for (const c of l0Ids) {
        if (!usedL0.has(c)) {
          leaderId = c;
          usedL0.add(c);
          break;
        }
      }
    }

    // 分配 3-5 个 L1 NPC 作 members（避免复用）
    const memberCandidates = l1ByProf[prof] || l1Ids.filter(mid => em.getType(mid) === 'npc');
    const memberCount = 3 + Math.floor(Math.random() * 3); // 3-5
    const members: number[] = [];
    const shuffled = [...memberCandidates].sort(() => Math.random() - 0.5);
    for (const mid of shuffled) {
      if (members.length >= memberCount) break;
      if (!usedL1.has(mid)) {
        members.push(mid);
        usedL1.add(mid);
      }
    }

    const faction: FactionComponent = {
      name: def.name,
      type: def.type,
      influence: def.influence,
      treasury: def.treasury,
      members,
      leaderId,
      territory: def.territory,
      relations: {},
      mood: 50 + Math.floor(Math.random() * 30), // 50-80
    };

    em.addComponent(id, 'Faction', faction);
    factions.push({ id, faction });

    // 回写 NPC 的 Identity：设置 factionId 和 factionRole
    // leader
    if (leaderId > 0) {
      const leaderIdentity = em.getComponent(leaderId, 'Identity');
      if (leaderIdentity) {
        leaderIdentity.factionId = id;
        leaderIdentity.factionRole = 'leader';
      }
    }
    // members
    for (const mid of members) {
      const memberIdentity = em.getComponent(mid, 'Identity');
      if (memberIdentity) {
        memberIdentity.factionId = id;
        memberIdentity.factionRole = 'member';
      }
    }
  }

  // 初始化组织间关系
  for (let i = 0; i < factions.length; i++) {
    for (let j = i + 1; j < factions.length; j++) {
      const fi = factions[i].faction;
      const fj = factions[j].faction;

      // 同类型组织基础好感高
      let base = 0;
      if (fi.type === fj.type) base = 20 + Math.floor(Math.random() * 30);
      else if (fi.type === 'underground' && fj.type === 'government') base = -(30 + Math.floor(Math.random() * 40));
      else if (fi.type === 'government' && fj.type === 'underground') base = -(30 + Math.floor(Math.random() * 40));
      else base = -10 + Math.floor(Math.random() * 30);

      fi.relations[factions[j].id] = base;
      fj.relations[factions[i].id] = base;
    }
  }

  return { factions };
}

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
  // 5% 特殊建筑（shop/teahouse/clinic/tavern）分布在 CITY_GRIDS
  // 95% 民居，分布在所有 GRID
  const specialCount = 25;  // 5%
  const houseCount = 475;   // 95%
  const buildingIds: number[] = [];

  // 特殊建筑
  for (let i = 0; i < specialCount; i++) {
    const id = em.create(EntityType.BUILDING);
    const bType = SPECIAL_BUILDING_TYPES[i % SPECIAL_BUILDING_TYPES.length];
    const gridId = CITY_GRIDS[Math.floor(Math.random() * CITY_GRIDS.length)];
    const areaId = getAreaByGrid(gridId);
    const bName = getBuildingName(bType, i);
    const bDesc = getBuildingDescription(bType, i);
    const quality = 50 + Math.floor(Math.random() * 50);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Building', { type: bType, ownerId: 0, openHours: getBuildingOpenHours(bType), name: bName, quality, rooms: getBuildingRooms(bType), description: bDesc } as any);
    em.addComponent(id, 'Durability', { max: 100, current: 80 + Math.floor(Math.random() * 20) });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    buildingIds.push(id);
    breakdown.building++;
  }

  // 民居
  for (let i = 0; i < houseCount; i++) {
    const id = em.create(EntityType.BUILDING);
    const gridId = ALL_GRID_IDS[Math.floor(Math.random() * ALL_GRID_IDS.length)];
    const areaId = getAreaByGrid(gridId);
    const bName = getBuildingName('house', i);
    const bDesc = getBuildingDescription('house', i);
    const quality = 30 + Math.floor(Math.random() * 40);

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Building', { type: 'house', ownerId: 0, openHours: '', name: bName, quality, rooms: getBuildingRooms('house'), description: bDesc } as any);
    em.addComponent(id, 'Durability', { max: 100, current: 70 + Math.floor(Math.random() * 30) });

    worldMap.addEntity(id, gridId);
    l1Ids.push(id);
    buildingIds.push(id);
    breakdown.building++;
  }

  // === NPC-建筑关系分配 ===
  // 给前 800 个 NPC 分配住所（homeId），给特殊建筑分配经营者（workplaceId）
  const allNpcIds = [...l0Ids, ...l1Ids.filter(id => em.getType(id) === 'npc')];

  // 每个民居分配一个 NPC 作为主人
  for (let i = 0; i < buildingIds.length && i < allNpcIds.length; i++) {
    const buildingId = buildingIds[i];
    const building = em.getComponent(buildingId, 'Building');
    if (building && building.type === 'house') {
      building.ownerId = allNpcIds[i];
      // 给 NPC 设置 homeId
      const identity = em.getComponent(allNpcIds[i], 'Identity');
      if (identity) {
        (identity as any).homeId = buildingId;
      }
    }
  }

  // 特殊建筑分配给对应职业 NPC 作为工作地点
  const professionBuildingMap: Record<string, string> = {
    merchant: 'shop',
    doctor: 'clinic',
  };
  for (const npcId of allNpcIds) {
    const identity = em.getComponent(npcId, 'Identity');
    if (!identity || !identity.profession) continue;
    const preferredType = professionBuildingMap[identity.profession];
    if (!preferredType) continue;
    // 找一个同区域且没有 workplaceId 的建筑
    const npcPos = em.getComponent(npcId, 'Position');
    const npcGrid = npcPos?.gridId;
    let assigned = false;
    for (const bid of buildingIds) {
      const b = em.getComponent(bid, 'Building');
      if (!b || b.type !== preferredType) continue;
      const bpos = em.getComponent(bid, 'Position');
      if (bpos && bpos.gridId === npcGrid) {
        (identity as any).workplaceId = bid;
        if (b.ownerId === 0) b.ownerId = npcId;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      // fallback: 找任意同类型建筑
      for (const bid of buildingIds) {
        const b = em.getComponent(bid, 'Building');
        if (!b || b.type !== preferredType) continue;
        (identity as any).workplaceId = bid;
        if (b.ownerId === 0) b.ownerId = npcId;
        break;
      }
    }
  }

  // === 物品: 2,500 ===
  for (let i = 0; i < 2500; i++) {
    const id = em.create(EntityType.ITEM);
    const gridId = ALL_GRID_IDS[Math.floor(Math.random() * ALL_GRID_IDS.length)];
    const areaId = getAreaByGrid(gridId);

    // 随机生成物品名字
    const itemNames = [
      '铜钱袋', '旧书卷', '布包袱', '木碗', '陶罐', '竹篮', '麻绳', '油灯',
      '铜镜', '木梳', '瓷碗', '铁钉', '铜锁', '竹简', '纸伞', '蓑衣',
      '草鞋', '布鞋', '茶壶', '酒壶', '香囊', '玉佩', '铜簪', '木簪',
      '砚台', '毛笔', '墨锭', '宣纸', '丝绸帕', '铜手炉', '瓷枕', '铜铃',
    ];
    const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];

    em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
    em.addComponent(id, 'Identity', { name: itemName, profession: '物品', age: 0, personality: [] });
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
