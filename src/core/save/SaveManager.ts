import type { WorldEngine } from '../world/WorldEngine';

export interface SaveData {
  version: number;
  timestamp: number;
  seed: number;
  time: { day: number };
  weather: string;
  playerId: number | null;
  usedEventIds: string[];
  entities: Array<{
    id: number;
    type: string;
    components: Record<string, unknown>;
  }>;
}

const SAVE_KEY = 'shi_jing_lu_save';

export class SaveManager {
  /** 自动存档（从引擎） */
  static autoSave(engine: WorldEngine): void {
    const data = engine.exportSave();
    SaveManager.autoSaveFromData(data);
  }

  /** 从导出数据存档 */
  static autoSaveFromData(data: unknown): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // 存储满了就忽略
    }
  }

  /** 加载存档 */
  static loadSave(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  /** 删除存档 */
  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /** 是否有存档 */
  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }
}
