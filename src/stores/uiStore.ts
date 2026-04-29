import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useGameStore } from './gameStore';

export const useUiStore = defineStore('ui', () => {
  const showMap = ref(false);
  const showRelations = ref(false);
  const showInventory = ref(false);

  const currentNpcs = ref<Array<{ id: number; name: string; profession: string }>>([]);
  const reachableLocations = ref<Array<{ id: string; name: string }>>([]);

  function refreshLocationData() {
    const gameStore = useGameStore();
    if (!gameStore.engine) return;

    const playerPos = gameStore.engine.getPlayerSnapshot();
    if (!playerPos) return;

    currentNpcs.value = gameStore.engine.getNpcsAtLocation(playerPos.locationId);
    reachableLocations.value = gameStore.engine.getReachableLocations();
  }

  function toggleMap() {
    showMap.value = !showMap.value;
  }

  return {
    showMap,
    showRelations,
    showInventory,
    currentNpcs,
    reachableLocations,
    refreshLocationData,
    toggleMap,
  };
});
