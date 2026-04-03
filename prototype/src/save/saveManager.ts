// === 存档管理 ===

import { EntityManager } from '../ecs/entityManager';
import { EntityType } from '../ecs/types';
import { GameDatabase } from './database';

export class SaveManager {
  constructor(
    private em: EntityManager,
    private db: GameDatabase,
  ) {}

  /** 保存所有实体 */
  saveAll(): number {
    const entities = this.em.allEntities();
    const batch = entities.map(id => {
      const data = this.em.exportEntity(id);
      if (!data) return null;
      const pos = this.em.getComponent(id, 'Position');
      const ai = this.em.getComponent(id, 'AI');
      return {
        id,
        entityType: data.type,
        components: JSON.stringify(data.components),
        areaId: pos?.areaId,
        gridId: pos?.gridId,
        lodLevel: ai?.aiLevel ?? 2,
      };
    }).filter((e): e is NonNullable<typeof e> => e !== null);

    this.db.insertEntitiesBatch(batch);

    // 创建存档快照
    const snapshot = JSON.stringify({
      entityCount: entities.length,
      timestamp: Date.now(),
    });
    return this.db.createSave(1, snapshot);
  }

  /** 加载存档 */
  load(): number {
    this.em.clear();
    const entities = this.db.getAllEntities();
    for (const row of entities) {
      const data = {
        type: row.entity_type as EntityType,
        components: JSON.parse(row.components),
      };
      this.em.importEntity(data);
    }
    return entities.length;
  }
}
