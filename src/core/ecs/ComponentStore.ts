/**
 * Sparse Set 组件存储
 * O(1) 添加/删除/查询，cache-friendly 遍历
 * 参考原型 prototype/src/ecs/componentStore.ts 设计，从零编写
 */
export class ComponentStore<T> {
  private dense: T[] = [];
  private denseToEntity: number[] = [];
  private entityToDense: Map<number, number> = new Map();

  get size(): number {
    return this.dense.length;
  }

  has(entityId: number): boolean {
    return this.entityToDense.has(entityId);
  }

  get(entityId: number): T | undefined {
    const denseIdx = this.entityToDense.get(entityId);
    if (denseIdx === undefined) return undefined;
    return this.dense[denseIdx];
  }

  set(entityId: number, component: T): void {
    const existingIdx = this.entityToDense.get(entityId);
    if (existingIdx !== undefined) {
      // 更新已有组件
      this.dense[existingIdx] = component;
      return;
    }
    // 新增：append到末尾
    const newIdx = this.dense.length;
    this.dense.push(component);
    this.denseToEntity.push(entityId);
    this.entityToDense.set(entityId, newIdx);
  }

  remove(entityId: number): boolean {
    const denseIdx = this.entityToDense.get(entityId);
    if (denseIdx === undefined) return false;

    const lastIdx = this.dense.length - 1;
    if (denseIdx !== lastIdx) {
      // swap-and-pop：把要删除的元素与末尾交换
      const lastEntity = this.denseToEntity[lastIdx]!;
      this.dense[denseIdx] = this.dense[lastIdx]!;
      this.denseToEntity[denseIdx] = lastEntity;
      this.entityToDense.set(lastEntity, denseIdx);
    }

    this.dense.pop();
    this.denseToEntity.pop();
    this.entityToDense.delete(entityId);
    return true;
  }

  /** 遍历所有 (entityId, component) 对 — cache-friendly */
  forEach(callback: (entityId: number, component: T) => void): void {
    for (let i = 0; i < this.dense.length; i++) {
      callback(this.denseToEntity[i]!, this.dense[i]!);
    }
  }

  /** 获取所有实体ID */
  entities(): number[] {
    return [...this.denseToEntity];
  }
}

/**
 * 组件注册表
 * 按组件名索引多个 ComponentStore，支持多组件联合查询
 */
export class ComponentRegistry {
  private stores: Map<string, ComponentStore<unknown>> = new Map();

  getStore<C>(name: string): ComponentStore<C> {
    let store = this.stores.get(name);
    if (!store) {
      store = new ComponentStore<C>();
      this.stores.set(name, store);
    }
    return store as ComponentStore<C>;
  }

  /** 多组件查询：返回同时拥有所有指定组件的实体ID列表 */
  query(...componentNames: string[]): number[] {
    if (componentNames.length === 0) return [];

    // 从最小的 store 做基数（交集优化）
    let smallestName = componentNames[0]!;
    let smallestSize = Infinity;
    for (const name of componentNames) {
      const store = this.stores.get(name);
      const size = store ? store.size : 0;
      if (size < smallestSize) {
        smallestSize = size;
        smallestName = name;
      }
    }

    const baseStore = this.stores.get(smallestName);
    if (!baseStore || baseStore.size === 0) return [];

    const otherNames = componentNames.filter((n) => n !== smallestName);
    const result: number[] = [];

    baseStore.forEach((entityId) => {
      if (otherNames.every((name) => this.stores.get(name)?.has(entityId))) {
        result.push(entityId);
      }
    });

    return result;
  }

  /** 从所有 store 中移除指定实体的所有组件 */
  removeAllForEntity(entityId: number): void {
    for (const store of this.stores.values()) {
      store.remove(entityId);
    }
  }

  /** 导出指定实体的所有组件 */
  exportEntity(entityId: number): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, store] of this.stores) {
      const comp = store.get(entityId);
      if (comp !== undefined) {
        result[name] = comp;
      }
    }
    return result;
  }
}
