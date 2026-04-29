import { defineStore } from 'pinia';
import { ref } from 'vue';
import { WorldEngine, type DayResult } from '@/core/world/WorldEngine';

export type GameState = 'menu' | 'creating' | 'playing' | 'event' | 'interacting' | 'daySummary' | 'dead';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState>('menu');
  const engine = ref<WorldEngine | null>(null);
  const currentDayResult = ref<DayResult | null>(null);
  const logEntries = ref<string[]>([]);

  function initEngine(seed?: number) {
    engine.value = new WorldEngine(seed);
  }

  function setGameState(state: GameState) {
    gameState.value = state;
  }

  function addLog(text: string) {
    logEntries.value.push(text);
  }

  return {
    gameState,
    engine,
    currentDayResult,
    logEntries,
    initEngine,
    setGameState,
    addLog,
  };
});
