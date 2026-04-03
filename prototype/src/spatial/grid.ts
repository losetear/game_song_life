// === Grid 管理 ===

export class Grid {
  readonly id: string;
  readonly name: string;
  readonly neighbors: string[]; // 相邻 Grid ID

  private entities: Set<number> = new Set();

  constructor(id: string, name: string, neighbors: string[] = []) {
    this.id = id;
    this.name = name;
    this.neighbors = neighbors;
  }

  addEntity(entityId: number): void {
    this.entities.add(entityId);
  }

  removeEntity(entityId: number): void {
    this.entities.delete(entityId);
  }

  getEntities(): number[] {
    return Array.from(this.entities);
  }

  get entityCount(): number {
    return this.entities.size;
  }

  hasEntity(entityId: number): boolean {
    return this.entities.has(entityId);
  }

  clear(): void {
    this.entities.clear();
  }
}
