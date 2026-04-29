import { defineStore } from 'pinia';
import { ref } from 'vue';
import { WorldEngine, type DayResult } from '@/core/world/WorldEngine';
import { SaveManager, type SaveData } from '@/core/save/SaveManager';

export type GameState = 'menu' | 'creating' | 'playing' | 'event' | 'interacting' | 'daySummary' | 'dead';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState>('menu');
  const engine = ref<WorldEngine | null>(null);
  const currentDayResult = ref<DayResult | null>(null);
  const logEntries = ref<string[]>([]);
  /** 存档数据缓存（用于显示存档信息） */
  const saveDataCache = ref<SaveData | null>(null);

  function initEngine(seed?: number) {
    engine.value = new WorldEngine(seed);
  }

  function setGameState(state: GameState) {
    gameState.value = state;
  }

  function addLog(text: string) {
    logEntries.value.push(text);
  }

  /** 从存档恢复游戏状态 */
  function loadSave(): boolean {
    const data = SaveManager.loadSave();
    if (!data) return false;

    saveDataCache.value = data;

    // 创建新引擎并从存档数据恢复实体
    initEngine(data.seed || undefined);
    if (!engine.value) return false;

    // 恢复玩家ID
    engine.value.importSave(data);

    return true;
  }

  /** 手动存档 */
  function manualSave(): boolean {
    if (!engine.value) return false;
    const data = engine.value.exportSave();
    SaveManager.autoSaveFromData(data);
    saveDataCache.value = data as SaveData;
    return true;
  }

  /** 清除日志（新游戏时使用） */
  function clearLog() {
    logEntries.value = [];
  }

  return {
    gameState,
    engine,
    currentDayResult,
    logEntries,
    saveDataCache,
    initEngine,
    setGameState,
    addLog,
    loadSave,
    manualSave,
    clearLog,
  };
});
