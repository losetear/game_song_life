import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useGameStore } from './gameStore';

export const usePlayerStore = defineStore('player', () => {
  const hunger = ref(0);
  const fatigue = ref(0);
  const health = ref(0);
  const mood = ref(0);
  const copper = ref(0);
  const actionPoints = ref(0);
  const locationId = ref('');
  const playerName = ref('');
  const narrativeTags = ref<string[]>([]);

  function syncFromEngine() {
    const gameStore = useGameStore();
    if (!gameStore.engine) return;
    const snapshot = gameStore.engine.getPlayerSnapshot();
    if (!snapshot) return;

    hunger.value = snapshot.hunger;
    fatigue.value = snapshot.fatigue;
    health.value = snapshot.health;
    mood.value = snapshot.mood;
    copper.value = snapshot.copper;
    actionPoints.value = snapshot.actionPoints;
    locationId.value = snapshot.locationId;
  }

  return {
    hunger,
    fatigue,
    health,
    mood,
    copper,
    actionPoints,
    locationId,
    playerName,
    narrativeTags,
    syncFromEngine,
  };
});
