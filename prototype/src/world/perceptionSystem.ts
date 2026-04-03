// === 感知系统 ===

import { EntityManager } from '../ecs/entityManager';
import { WorldMap } from '../spatial/worldMap';

export interface PerceptionResult {
  visibleEntities: number[];
  nearbyEntities: number[];
}

export class PerceptionSystem {
  constructor(
    private em: EntityManager,
    private worldMap: WorldMap,
  ) {}

  /** 计算玩家视野内的实体 */
  computePerception(entityId: number): PerceptionResult {
    const pos = this.em.getComponent(entityId, 'Position');
    if (!pos) return { visibleEntities: [], nearbyEntities: [] };

    // 同 Grid = 可见
    const visibleEntities = this.worldMap.getEntitiesInGrid(pos.gridId)
      .filter(id => id !== entityId);

    // 相邻 Grid = 可闻
    const nearbyEntities = this.worldMap.getEntitiesInRange(pos.gridId, 1)
      .filter(id => id !== entityId && !visibleEntities.includes(id));

    return { visibleEntities, nearbyEntities };
  }

  /** 获取感知范围内实体的简要信息 */
  getPerceptionData(entityId: number): { id: number; name?: string; type?: string }[] {
    const { visibleEntities } = this.computePerception(entityId);
    return visibleEntities.map(id => {
      const identity = this.em.getComponent(id, 'Identity');
      const type = this.em.getType(id);
      return {
        id,
        name: identity?.name,
        type,
      };
    });
  }
}
