// === Sparse Set 组件存储 ===
// O(1) 添加/删除（swap-and-pop），O(n) cache-friendly 遍历

import { ComponentName, ComponentOf } from './types';

export class ComponentStore<T> {
  private dense: T[] = [];                   // 连续存储组件数据
  private denseToEntity: number[] = [];       // dense index → entity id
  private entityToDense: Map<number, number> = new Map(); // entity id → dense index

  get size(): number {
    return this.dense.length;
  }

  /** O(1) 添加/更新 */
  set(entityId: number, component: T): void {
    const idx = this.entityToDense.get(entityId);
    if (idx !== undefined) {
      this.dense[idx] = component;
      return;
    }
    const newIdx = this.dense.length;
    this.dense.push(component);
    this.denseToEntity.push(entityId);
    this.entityToDense.set(entityId, newIdx);
  }

  /** O(1) 获取 */
  get(entityId: number): T | undefined {
    const idx = this.entityToDense.get(entityId);
    if (idx === undefined) return undefined;
    return this.dense[idx];
  }

  /** O(1) 删除（swap-and-pop） */
  delete(entityId: number): boolean {
    const idx = this.entityToDense.get(entityId);
    if (idx === undefined) return false;

    const lastIdx = this.dense.length - 1;
    if (idx !== lastIdx) {
      // swap with last
      const lastEntity = this.denseToEntity[lastIdx];
      this.dense[idx] = this.dense[lastIdx];
      this.denseToEntity[idx] = lastEntity;
      this.entityToDense.set(lastEntity, idx);
    }

    // pop last
    this.dense.pop();
    this.denseToEntity.pop();
    this.entityToDense.delete(entityId);
    return true;
  }

  /** 检查实体是否有此组件 */
  has(entityId: number): boolean {
    return this.entityToDense.has(entityId);
  }

  /** O(n) cache-friendly 遍历 */
  forEach(callback: (component: T, entityId: number) => void): void {
    for (let i = 0; i < this.dense.length; i++) {
      callback(this.dense[i], this.denseToEntity[i]);
    }
  }

  /** 获取所有实体 ID（copy） */
  entities(): number[] {
    return Array.from(this.denseToEntity);
  }

  /** 清空 */
  clear(): void {
    this.dense.length = 0;
    this.denseToEntity.length = 0;
    this.entityToDense.clear();
  }
}

// 组件存储注册表 — 按组件类型名索引
export class ComponentRegistry {
  private stores: Map<string, ComponentStore<any>> = new Map();

  getStore<C>(name: string): ComponentStore<C> {
    let store = this.stores.get(name);
    if (!store) {
      store = new ComponentStore<C>();
      this.stores.set(name, store);
    }
    return store;
  }

  getStoreOrNull<C>(name: string): ComponentStore<C> | undefined {
    return this.stores.get(name);
  }

  /** 查询同时拥有所有指定组件的实体 */
  query(...componentNames: string[]): number[] {
    if (componentNames.length === 0) return [];

    // 从最小的 store 开始
    const stores = componentNames
      .map(n => this.stores.get(n))
      .filter((s): s is ComponentStore<any> => s !== undefined);

    if (stores.length !== componentNames.length) return [];

    // 找最小 store 作为基数
    let minStore = stores[0];
    for (let i = 1; i < stores.length; i++) {
      if (stores[i].size < minStore.size) minStore = stores[i];
    }

    const result: number[] = [];
    minStore.forEach((_, entityId) => {
      let hasAll = true;
      for (const store of stores) {
        if (store === minStore) continue;
        if (!store.has(entityId)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) result.push(entityId);
    });
    return result;
  }

  /** 清空所有 store */
  clear(): void {
    this.stores.forEach(s => s.clear());
  }
}
