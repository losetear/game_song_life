// === 世界地图 — 20 Grid 空间索引 ===

import { Grid } from './grid';
import { GRID_ADJACENCY, AREA_DEFINITIONS } from './area';

export class WorldMap {
  private grids: Map<string, Grid> = new Map();
  private entityGrid: Map<number, string> = new Map(); // entityId → gridId

  constructor() {
    this.initGrids();
  }

  private initGrids(): void {
    for (const [gridId, neighbors] of Object.entries(GRID_ADJACENCY)) {
      this.grids.set(gridId, new Grid(gridId, gridId, neighbors));
    }
  }

  /** 获取 Grid */
  getGrid(gridId: string): Grid | undefined {
    return this.grids.get(gridId);
  }

  /** 获取所有 Grid */
  allGrids(): Grid[] {
    return Array.from(this.grids.values());
  }

  /** 实体进入 Grid */
  addEntity(entityId: number, gridId: string): void {
    const grid = this.grids.get(gridId);
    if (!grid) return;
    grid.addEntity(entityId);
    this.entityGrid.set(entityId, gridId);
  }

  /** 移动实体 */
  moveEntity(entityId: number, toGridId: string): boolean {
    const fromGridId = this.entityGrid.get(entityId);
    if (fromGridId === toGridId) return true;

    const fromGrid = this.grids.get(fromGridId!);
    const toGrid = this.grids.get(toGridId);
    if (!toGrid) return false;

    if (fromGrid) fromGrid.removeEntity(entityId);
    toGrid.addEntity(entityId);
    this.entityGrid.set(entityId, toGridId);
    return true;
  }

  /** 移除实体 */
  removeEntity(entityId: number): void {
    const gridId = this.entityGrid.get(entityId);
    if (gridId) {
      const grid = this.grids.get(gridId);
      if (grid) grid.removeEntity(entityId);
      this.entityGrid.delete(entityId);
    }
  }

  /** 单 Grid 查询 */
  getEntitiesInGrid(gridId: string): number[] {
    const grid = this.grids.get(gridId);
    return grid ? grid.getEntities() : [];
  }

  /** 范围查询 — BFS 展开相邻 Grid */
  getEntitiesInRange(gridId: string, range: number): number[] {
    const result: number[] = [];
    const visited = new Set<string>();
    const queue: [string, number][] = [[gridId, 0]];

    while (queue.length > 0) {
      const [current, dist] = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const grid = this.grids.get(current);
      if (grid) result.push(...grid.getEntities());

      if (dist < range) {
        const adj = GRID_ADJACENCY[current] || [];
        for (const next of adj) {
          if (!visited.has(next)) queue.push([next, dist + 1]);
        }
      }
    }
    return result;
  }

  /** 获取实体所在 Grid */
  getEntityGrid(entityId: number): string | undefined {
    return this.entityGrid.get(entityId);
  }

  /** 获取 Area 内所有实体 */
  getEntitiesInArea(areaId: string): number[] {
    const areaDef = AREA_DEFINITIONS.find(a => a.id === areaId);
    if (!areaDef) return [];
    const result: number[] = [];
    for (const gridId of areaDef.gridIds) {
      result.push(...this.getEntitiesInGrid(gridId));
    }
    return result;
  }

  /** 统计各 Grid 实体数量 */
  stats(): Record<string, number> {
    const s: Record<string, number> = {};
    this.grids.forEach((grid, id) => { s[id] = grid.entityCount; });
    return s;
  }

  /** 清空 */
  clear(): void {
    this.grids.forEach(g => g.clear());
    this.entityGrid.clear();
  }
}
