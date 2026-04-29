import { clamp } from '../utils/clamp';
import type { EntityManager } from '../ecs/EntityManager';

/**
 * 生存状态衰减系统
 * 每回合（每天）自动衰减各项生存指标
 */
export class VitalSystem {
  /** 每天衰减量 */
  private static readonly DECAY = {
    hunger: 12,  // 每天饿一点
    fatigue: 8,  // 每天累一点（工作后更多）
    mood: 5,     // 心情自然回落
  };

  /**
   * 健康衰减因子：当饥饿/疲劳极低时健康快速下降
   * 这样死亡不容易触发（需要连续多天不照顾自己）
   */
  private static readonly HEALTH_DECAY_THRESHOLD = 15;
  private static readonly HEALTH_DECAY_RATE = 5;

  update(em: EntityManager): void {
    const entities = em.query('Vital');

    for (const id of entities) {
      const vital = em.getComponent(id, 'Vital');
      if (!vital) continue;

      vital.hunger = clamp(vital.hunger - VitalSystem.DECAY.hunger, 0, 100);
      vital.fatigue = clamp(vital.fatigue - VitalSystem.DECAY.fatigue, 0, 100);
      vital.mood = clamp(vital.mood - VitalSystem.DECAY.mood, 0, 100);

      // 饥饿或疲劳极低时健康缓慢下降
      if (vital.hunger < VitalSystem.HEALTH_DECAY_THRESHOLD ||
          vital.fatigue < VitalSystem.HEALTH_DECAY_THRESHOLD) {
        const severity = (VitalSystem.HEALTH_DECAY_THRESHOLD - Math.min(vital.hunger, vital.fatigue))
          / VitalSystem.HEALTH_DECAY_THRESHOLD;
        vital.health = clamp(
          vital.health - VitalSystem.HEALTH_DECAY_RATE * severity,
          0, 100,
        );
      }

      // 饱食且休息充足时健康缓慢恢复
      if (vital.hunger > 60 && vital.fatigue > 60 && vital.health < 100) {
        vital.health = clamp(vital.health + 2, 0, 100);
      }
    }
  }
}
