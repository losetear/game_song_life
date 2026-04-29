import type { EntityManager } from '../ecs/EntityManager';
import { EntityType } from '../ecs/types';

export interface DeathCheckResult {
  isDead: boolean;
  cause: string;
}

/**
 * 死亡系统
 * 不容易触发：需要健康连续多天处于极低水平
 */
export class DeathSystem {
  /** 连续低健康天数追踪 */
  private lowHealthDays = new Map<number, number>();

  /** 死亡阈值：连续3天健康<10 */
  private static readonly DEATH_THRESHOLD_DAYS = 3;
  private static readonly DEATH_HEALTH = 10;

  check(em: EntityManager): DeathCheckResult[] {
    const results: DeathCheckResult[] = [];
    const entities = em.query('Vital');

    for (const id of entities) {
      const vital = em.getComponent(id, 'Vital');
      if (!vital) continue;

      if (vital.health <= DeathSystem.DEATH_HEALTH) {
        const days = (this.lowHealthDays.get(id) ?? 0) + 1;
        this.lowHealthDays.set(id, days);

        if (days >= DeathSystem.DEATH_THRESHOLD_DAYS) {
          const identity = em.getComponent(id, 'Identity');
          const name = identity?.name ?? '某人';
          results.push({
            isDead: true,
            cause: `${name}因伤病不治，撒手人寰。`,
          });
        }
      } else if (vital.health > 30) {
        // 恢复到30以上才重置计数
        this.lowHealthDays.delete(id);
      }
    }

    return results;
  }

  /** 处理死亡 */
  handleDeath(em: EntityManager, entityId: number): void {
    // 保留关系记忆，标记死亡状态
    const identity = em.getComponent(entityId, 'Identity');
    if (identity) {
      // 不销毁实体，只是标记（保留在关系记录中）
    }
  }
}
