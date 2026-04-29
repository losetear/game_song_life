import { describe, it, expect } from 'vitest';
import { ComponentStore, ComponentRegistry } from '../ecs/ComponentStore';
import { EntityManager } from '../ecs/EntityManager';
import type { EntityType } from '../ecs/types';

describe('ComponentStore', () => {
  it('应该能添加和获取组件', () => {
    const store = new ComponentStore<{ hp: number }>();
    store.set(1, { hp: 100 });
    expect(store.get(1)).toEqual({ hp: 100 });
  });

  it('应该能更新已有组件', () => {
    const store = new ComponentStore<{ hp: number }>();
    store.set(1, { hp: 100 });
    store.set(1, { hp: 50 });
    expect(store.get(1)).toEqual({ hp: 50 });
  });

  it('应该能删除组件', () => {
    const store = new ComponentStore<{ hp: number }>();
    store.set(1, { hp: 100 });
    store.set(2, { hp: 80 });
    store.remove(1);
    expect(store.has(1)).toBe(false);
    expect(store.has(2)).toBe(true);
    expect(store.size).toBe(1);
  });

  it('swap-and-pop后应该正确维护索引', () => {
    const store = new ComponentStore<{ hp: number }>();
    store.set(1, { hp: 100 });
    store.set(2, { hp: 80 });
    store.set(3, { hp: 60 });
    // 删除中间的，触发swap
    store.remove(2);
    expect(store.get(1)).toEqual({ hp: 100 });
    expect(store.get(3)).toEqual({ hp: 60 });
    expect(store.has(2)).toBe(false);
    expect(store.size).toBe(2);
  });

  it('forEach应该遍历所有组件', () => {
    const store = new ComponentStore<{ hp: number }>();
    store.set(1, { hp: 100 });
    store.set(2, { hp: 80 });
    const result: number[] = [];
    store.forEach((id, _comp) => {
      result.push(id);
    });
    expect(result.sort()).toEqual([1, 2]);
  });

  it('entities应该返回所有实体ID', () => {
    const store = new ComponentStore<{ hp: number }>();
    store.set(10, { hp: 100 });
    store.set(20, { hp: 80 });
    expect(store.entities().sort()).toEqual([10, 20]);
  });
});

describe('ComponentRegistry', () => {
  it('多组件查询应该返回交集', () => {
    const registry = new ComponentRegistry();
    const posStore = registry.getStore<{ x: number }>('Position');
    const hpStore = registry.getStore<{ hp: number }>('Health');

    posStore.set(1, { x: 0 });
    posStore.set(2, { x: 1 });
    posStore.set(3, { x: 2 });
    hpStore.set(2, { hp: 100 });
    hpStore.set(3, { hp: 80 });

    const result = registry.query('Position', 'Health');
    expect(result.sort()).toEqual([2, 3]);
  });

  it('空查询应返回空数组', () => {
    const registry = new ComponentRegistry();
    expect(registry.query()).toEqual([]);
  });

  it('从最小store做基数', () => {
    const registry = new ComponentRegistry();
    const big = registry.getStore<{ x: number }>('Big');
    const small = registry.getStore<{ y: number }>('Small');
    for (let i = 1; i <= 100; i++) big.set(i, { x: i });
    small.set(50, { y: 1 });
    small.set(51, { y: 2 });
    const result = registry.query('Big', 'Small');
    expect(result.sort()).toEqual([50, 51]);
  });
});

describe('EntityManager', () => {
  it('应该能创建实体并添加组件', () => {
    const em = new EntityManager();
    const id = em.create('npc' as EntityType);
    em.addComponent(id, 'Vital', { hunger: 80, fatigue: 70, health: 100, mood: 60 });
    const vital = em.getComponent(id, 'Vital');
    expect(vital).toEqual({ hunger: 80, fatigue: 70, health: 100, mood: 60 });
  });

  it('应该能销毁实体', () => {
    const em = new EntityManager();
    const id = em.create('npc' as EntityType);
    em.addComponent(id, 'Vital', { hunger: 80, fatigue: 70, health: 100, mood: 60 });
    em.destroy(id);
    expect(em.getComponent(id, 'Vital')).toBeUndefined();
    expect(em.getType(id)).toBeUndefined();
  });

  it('应该能查询多个组件', () => {
    const em = new EntityManager();
    const id1 = em.create('npc' as EntityType);
    const id2 = em.create('npc' as EntityType);
    em.addComponent(id1, 'Vital', { hunger: 80, fatigue: 70, health: 100, mood: 60 });
    em.addComponent(id1, 'Position', { locationId: 'street' });
    em.addComponent(id2, 'Vital', { hunger: 50, fatigue: 40, health: 90, mood: 30 });
    const result = em.query('Vital', 'Position');
    expect(result).toEqual([id1]);
  });

  it('应该能导出和导入实体', () => {
    const em = new EntityManager();
    const id = em.create('npc' as EntityType);
    em.addComponent(id, 'Vital', { hunger: 80, fatigue: 70, health: 100, mood: 60 });
    em.addComponent(id, 'Identity', {
      name: '张三',
      profession: '农夫',
      age: 30,
      personality: ['勤劳'],
    });

    const exported = em.exportEntity(id);

    const em2 = new EntityManager();
    em2.importEntity(exported as Parameters<typeof em2.importEntity>[0]);
    const vital = em2.getComponent(id, 'Vital');
    expect(vital).toEqual({ hunger: 80, fatigue: 70, health: 100, mood: 60 });
    const identity = em2.getComponent(id, 'Identity');
    expect(identity?.name).toBe('张三');
  });

  it('应该能按类型获取实体', () => {
    const em = new EntityManager();
    const npc1 = em.create('npc' as EntityType);
    const npc2 = em.create('npc' as EntityType);
    const player = em.create('player' as EntityType);
    const npcs = em.getEntitiesByType('npc' as EntityType);
    expect(npcs.sort()).toEqual([npc1, npc2]);
    const players = em.getEntitiesByType('player' as EntityType);
    expect(players).toEqual([player]);
  });
});
