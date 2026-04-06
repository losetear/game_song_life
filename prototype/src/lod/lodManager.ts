// === LOD 切换管理器 ===

import { EntityManager } from '../ecs/entityManager';
import { RegionSimulator, RegionStats } from '../ai/statistics/regionSim';
import { WorldMap } from '../spatial/worldMap';

export class LODManager {
  constructor(
    private em: EntityManager,
    private worldMap: WorldMap,
    private regionSim: RegionSimulator,
  ) {}

  /** L2 统计具象化为 L1 实体 */
  materialize(areaId: string, count: number): number[] {
    const stats = this.regionSim.getRegion(areaId);
    if (!stats) return [];

    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      const id = this.em.create('npc' as any);
      this.em.addComponent(id, 'AI', {
        goals: [],
        currentPlan: [],
        planCooldown: 0,
        aiLevel: 1,
      });
      this.em.addComponent(id, 'Vital', {
        hunger: 60 + Math.random() * 30,
        fatigue: 60 + Math.random() * 30,
        health: 80 + Math.random() * 20,
        mood: 50 + Math.random() * 30,
      });
      // 放入区域内的随机 Grid
      const gridId = areaId; // 简化：用 areaId 作为 gridId
      this.em.addComponent(id, 'Position', { x: Math.random() * 100, y: Math.random() * 100, areaId, gridId });
      this.worldMap.addEntity(id, gridId);
      ids.push(id);
    }
    return ids;
  }

  /** L1 升级 L0（添加 AI+Memory 组件，启用 GOAP） */
  upgradeToL0(entityId: number): boolean {
    const ai = this.em.getComponent(entityId, 'AI');
    if (!ai || ai.aiLevel !== 1) return false;

    ai.aiLevel = 0;
    ai.goals = ['survive'];
    ai.currentPlan = [];
    ai.planCooldown = 0;

    // 添加 Memory 和 Relations 组件
    if (!this.em.hasComponent(entityId, 'Memory')) {
      this.em.addComponent(entityId, 'Memory', {
        recentEvents: [],
        impressions: {},
        shortTermMemories: [],
        longTermMemories: [],
      });
    }
    if (!this.em.hasComponent(entityId, 'Relations')) {
      this.em.addComponent(entityId, 'Relations', { relations: {} });
    }
    return true;
  }

  /** L0 降级 L1（移除 GOAP，简化状态） */
  downgradeToL1(entityId: number): boolean {
    const ai = this.em.getComponent(entityId, 'AI');
    if (!ai || ai.aiLevel !== 0) return false;

    ai.aiLevel = 1;
    ai.goals = [];
    ai.currentPlan = [];
    ai.planCooldown = 0;

    // 移除详细组件
    this.em.removeComponent(entityId, 'Memory');
    this.em.removeComponent(entityId, 'Relations');
    return true;
  }

  /** L1 归入 L2 统计 */
  aggregate(areaId: string, entityIds: number[]): { count: number; avgHunger: number; avgMood: number } {
    let totalHunger = 0;
    let totalMood = 0;
    let count = 0;

    for (const id of entityIds) {
      const vital = this.em.getComponent(id, 'Vital');
      if (vital) {
        totalHunger += vital.hunger;
        totalMood += vital.mood;
        count++;
      }
    }

    // 销毁 L1 实体
    for (const id of entityIds) {
      this.worldMap.removeEntity(id);
      this.em.destroy(id);
    }

    return {
      count,
      avgHunger: count > 0 ? totalHunger / count : 0,
      avgMood: count > 0 ? totalMood / count : 0,
    };
  }
}
