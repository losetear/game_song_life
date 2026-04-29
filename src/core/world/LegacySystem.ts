/**
 * 传承系统
 * 玩家死亡后，下一代可以继承部分属性
 */
export interface LegacyData {
  inheritedCopper: number;     // 继承10-30%金钱
  inheritedTags: string[];    // 继承部分叙事标签
  inheritedRelations: Record<number, number>;  // 继承20-40%人脉
  previousName: string;       // 上一世的名字
  daysLived: number;          // 存活天数
}

export class LegacySystem {
  private static STORAGE_KEY = 'shi_jing_lu_legacy';

  /** 计算传承数据 */
  static calculateLegacy(data: {
    copper: number;
    narrativeTags: string[];
    relations: Record<number, number>;
    name: string;
    daysLived: number;
  }): LegacyData {
    // 只继承正面的标签
    const positiveTags = data.narrativeTags.filter(
      (tag) => !['偷过食物', '捡过钱袋'].includes(tag),
    );

    // 继承20-40%的非零好感
    const inheritedRelations: Record<number, number> = {};
    for (const [targetId, score] of Object.entries(data.relations)) {
      if (score > 0) {
        inheritedRelations[Number(targetId)] = Math.round(score * 0.3);
      }
    }

    return {
      inheritedCopper: Math.round(data.copper * 0.2),
      inheritedTags: positiveTags.slice(0, 3),  // 最多继承3个标签
      inheritedRelations,
      previousName: data.name,
      daysLived: data.daysLived,
    };
  }

  /** 保存传承数据 */
  static saveLegacy(legacy: LegacyData): void {
    try {
      localStorage.setItem(LegacySystem.STORAGE_KEY, JSON.stringify(legacy));
    } catch {
      // ignore
    }
  }

  /** 加载传承数据 */
  static loadLegacy(): LegacyData | null {
    try {
      const raw = localStorage.getItem(LegacySystem.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as LegacyData;
    } catch {
      return null;
    }
  }

  /** 清除传承数据 */
  static clearLegacy(): void {
    localStorage.removeItem(LegacySystem.STORAGE_KEY);
  }

  /** 是否有传承数据 */
  static hasLegacy(): boolean {
    return localStorage.getItem(LegacySystem.STORAGE_KEY) !== null;
  }
}
