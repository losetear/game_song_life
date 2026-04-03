// === 实体管理器 ===

import { ComponentName, ComponentOf, EntityType } from './types';
import { ComponentRegistry } from './componentStore';

export class EntityManager {
  private nextId = 1;
  private entityTypes: Map<number, EntityType> = new Map();
  private alive: Set<number> = new Set();
  readonly registry: ComponentRegistry;

  constructor() {
    this.registry = new ComponentRegistry();
  }

  /** 创建实体，返回 ID */
  create(type: EntityType): number {
    const id = this.nextId++;
    this.alive.add(id);
    this.entityTypes.set(id, type);
    return id;
  }

  /** 批量创建实体 */
  createBatch(type: EntityType, count: number): number[] {
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      const id = this.nextId++;
      this.alive.add(id);
      this.entityTypes.set(id, type);
      ids.push(id);
    }
    return ids;
  }

  /** 添加组件 */
  addComponent<N extends ComponentName>(entityId: number, name: N, data: ComponentOf<N>): void {
    if (!this.alive.has(entityId)) return;
    this.registry.getStore(name).set(entityId, data);
  }

  /** 获取组件 */
  getComponent<N extends ComponentName>(entityId: number, name: N): ComponentOf<N> | undefined {
    return this.registry.getStore<ComponentOf<N>>(name).get(entityId) as ComponentOf<N> | undefined;
  }

  /** 移除组件 */
  removeComponent(entityId: number, name: string): void {
    const store = this.registry.getStoreOrNull(name);
    if (store) store.delete(entityId);
  }

  /** 检查是否有组件 */
  hasComponent(entityId: number, name: string): boolean {
    const store = this.registry.getStoreOrNull(name);
    return store ? store.has(entityId) : false;
  }

  /** 多组件查询 */
  query(...names: ComponentName[]): number[] {
    return this.registry.query(...names);
  }

  /** 销毁实体 */
  destroy(entityId: number): void {
    if (!this.alive.has(entityId)) return;
    // 从所有 store 中移除
    const stores = this.registry['stores'] as Map<string, any>;
    stores.forEach(store => store.delete(entityId));
    this.alive.delete(entityId);
    this.entityTypes.delete(entityId);
  }

  /** 获取实体类型 */
  getType(entityId: number): EntityType | undefined {
    return this.entityTypes.get(entityId);
  }

  /** 实体是否存活 */
  isAlive(entityId: number): boolean {
    return this.alive.has(entityId);
  }

  /** 总实体数 */
  get entityCount(): number {
    return this.alive.size;
  }

  /** 获取所有存活实体 ID */
  allEntities(): number[] {
    return Array.from(this.alive);
  }

  /** 清空所有 */
  clear(): void {
    this.registry.clear();
    this.alive.clear();
    this.entityTypes.clear();
    this.nextId = 1;
  }

  /** 导出实体数据（用于存档） */
  exportEntity(entityId: number): { type: EntityType; components: Record<string, any> } | null {
    if (!this.alive.has(entityId)) return null;
    const components: Record<string, any> = {};
    const stores = this.registry['stores'] as Map<string, any>;
    stores.forEach((store, name) => {
      const comp = store.get(entityId);
      if (comp !== undefined) components[name] = comp;
    });
    return { type: this.entityTypes.get(entityId)!, components };
  }

  /** 导入实体数据（用于读档） */
  importEntity(data: { type: EntityType; components: Record<string, any> }): number {
    const id = this.create(data.type);
    for (const [name, comp] of Object.entries(data.components)) {
      this.registry.getStore(name).set(id, comp);
    }
    return id;
  }
}
