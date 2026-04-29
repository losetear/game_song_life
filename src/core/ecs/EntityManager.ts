import {
  type ComponentName,
  type ComponentOf,
  type EntityType,
} from './types';
import { ComponentRegistry } from './ComponentStore';

export class EntityManager {
  private nextId = 1;
  private entityTypes = new Map<number, EntityType>();
  readonly registry = new ComponentRegistry();

  create(type: EntityType): number {
    const id = this.nextId++;
    this.entityTypes.set(id, type);
    return id;
  }

  destroy(entityId: number): void {
    this.entityTypes.delete(entityId);
    this.registry.removeAllForEntity(entityId);
  }

  getType(entityId: number): EntityType | undefined {
    return this.entityTypes.get(entityId);
  }

  addComponent<N extends ComponentName>(
    entityId: number,
    name: N,
    data: ComponentOf<N>,
  ): void {
    this.registry.getStore<ComponentOf<N>>(name).set(entityId, data);
  }

  getComponent<N extends ComponentName>(
    entityId: number,
    name: N,
  ): ComponentOf<N> | undefined {
    return this.registry.getStore<ComponentOf<N>>(name).get(entityId);
  }

  hasComponent(entityId: number, name: string): boolean {
    return this.registry.getStore(name).has(entityId);
  }

  /** 多组件联合查询 */
  query(...names: ComponentName[]): number[] {
    return this.registry.query(...names);
  }

  /** 导出实体（存档用） */
  exportEntity(entityId: number) {
    return {
      id: entityId,
      type: this.entityTypes.get(entityId),
      components: this.registry.exportEntity(entityId),
    };
  }

  /** 导入实体（读档用） */
  importEntity(data: {
    id: number;
    type: EntityType;
    components: Record<string, unknown>;
  }): void {
    this.entityTypes.set(data.id, data.type);
    if (data.id >= this.nextId) this.nextId = data.id + 1;
    for (const [name, comp] of Object.entries(data.components)) {
      this.registry.getStore(name).set(data.id, comp);
    }
  }

  getAllEntities(): number[] {
    return [...this.entityTypes.keys()];
  }

  getEntitiesByType(type: EntityType): number[] {
    const result: number[] = [];
    this.entityTypes.forEach((t, id) => {
      if (t === type) result.push(id);
    });
    return result;
  }
}
