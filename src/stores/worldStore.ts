import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useGameStore } from './gameStore';

export const useWorldStore = defineStore('world', () => {
  const day = ref(1);
  const season = ref('春');
  const weather = ref('晴');
  const prices = ref<Record<string, { name: string; price: number }>>({});

  function syncFromEngine() {
    const gameStore = useGameStore();
    if (!gameStore.engine) return;

    day.value = gameStore.engine.time.getDay();
    season.value = gameStore.engine.time.getSeason();
    weather.value = gameStore.engine.weather.get();
    prices.value = gameStore.engine.economy.getAllPrices();
  }

  return { day, season, weather, prices, syncFromEngine };
});
