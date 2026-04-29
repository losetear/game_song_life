<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useWorldStore } from '@/stores/worldStore';
import { useUiStore } from '@/stores/uiStore';
import { PLAYER_ORIGINS } from '@/core/data/PlayerOrigins';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const worldStore = useWorldStore();
const uiStore = useUiStore();

const playerName = ref('');
const selectedOrigin = ref(0);
const creating = ref(false);

function createCharacter() {
  if (!playerName.value.trim()) return;
  creating.value = true;

  const origin = PLAYER_ORIGINS[selectedOrigin.value]!;
  gameStore.initEngine();
  gameStore.engine!.createPlayer(origin, playerName.value.trim());
  gameStore.engine!.spawnNpcs();

  playerStore.playerName = playerName.value.trim();
  playerStore.syncFromEngine();
  worldStore.syncFromEngine();
  uiStore.refreshLocationData();

  gameStore.setGameState('playing');
}
</script>

<template>
  <div class="character-creation">
    <h2>创建角色</h2>

    <div class="form-group">
      <label>姓名</label>
      <input
        v-model="playerName"
        type="text"
        placeholder="请输入角色姓名"
        maxlength="8"
        @keyup.enter="createCharacter"
      />
    </div>

    <div class="form-group">
      <label>出身</label>
      <div class="origin-list">
        <div
          v-for="(origin, i) in PLAYER_ORIGINS"
          :key="origin.id"
          class="origin-card"
          :class="{ selected: selectedOrigin === i }"
          @click="selectedOrigin = i"
        >
          <h3>{{ origin.name }}</h3>
          <p>{{ origin.description }}</p>
          <div class="origin-stats">
            <span>起始铜钱: {{ origin.copper }}文</span>
            <span>职业: {{ origin.identity.profession }}</span>
          </div>
        </div>
      </div>
    </div>

    <button
      class="create-btn"
      :disabled="!playerName.trim() || creating"
      @click="createCharacter"
    >
      踏入汴京
    </button>
  </div>
</template>

<style scoped>
.character-creation {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.origin-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.origin-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.origin-card:hover {
  border-color: #999;
}

.origin-card.selected {
  border-color: #c0392b;
  background: #fdf2f2;
}

.origin-card h3 {
  margin: 0 0 6px;
}

.origin-card p {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 8px;
}

.origin-stats {
  font-size: 0.8rem;
  color: #888;
  display: flex;
  gap: 12px;
}

.create-btn {
  display: block;
  width: 100%;
  padding: 12px;
  font-size: 1.1rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
}

.create-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
