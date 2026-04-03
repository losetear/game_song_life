// === 纯内存数据库 ===
// 使用 Map 实现，无 SQLite 依赖，用于存档基准测试

interface EntityRow {
  id: number;
  world_id: number;
  entity_type: string;
  components: string;
  area_id: string | null;
  grid_id: string | null;
  lod_level: number;
  updated_at: number;
}

interface SaveRow {
  id: number;
  player_id: number;
  snapshot: string;
  created_at: number;
}

export class GameDatabase {
  private entities: Map<number, EntityRow> = new Map();
  private saves: SaveRow[] = [];
  private nextSaveId = 1;

  constructor(_dbPath: string = ':memory:') {
    // 内存实现，无需路径
  }

  /** 插入/更新实体 */
  insertEntity(entity: {
    id: number;
    entityType: string;
    components: string;
    areaId?: string;
    gridId?: string;
    lodLevel?: number;
  }): void {
    this.entities.set(entity.id, {
      id: entity.id,
      world_id: 1,
      entity_type: entity.entityType,
      components: entity.components,
      area_id: entity.areaId ?? null,
      grid_id: entity.gridId ?? null,
      lod_level: entity.lodLevel ?? 1,
      updated_at: Date.now(),
    });
  }

  /** 批量插入实体（事务模拟） */
  insertEntitiesBatch(entities: Array<{
    id: number;
    entityType: string;
    components: string;
    areaId?: string;
    gridId?: string;
    lodLevel?: number;
  }>): void {
    for (const e of entities) {
      this.insertEntity(e);
    }
  }

  /** 读取实体 */
  getEntity(id: number): EntityRow | undefined {
    return this.entities.get(id);
  }

  /** 读取所有实体 */
  getAllEntities(): EntityRow[] {
    return Array.from(this.entities.values());
  }

  /** 创建存档 */
  createSave(playerId: number, snapshot: string): number {
    const id = this.nextSaveId++;
    this.saves.push({
      id,
      player_id: playerId,
      snapshot,
      created_at: Date.now(),
    });
    return id;
  }

  /** 获取最新存档 */
  getLatestSave(playerId: number): SaveRow | undefined {
    const playerSaves = this.saves.filter(s => s.player_id === playerId);
    return playerSaves[playerSaves.length - 1];
  }

  /** 清空 */
  clear(): void {
    this.entities.clear();
    this.saves = [];
    this.nextSaveId = 1;
  }

  /** 关闭 */
  close(): void {
    this.clear();
  }
}
