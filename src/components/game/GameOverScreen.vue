<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useWorldStore } from '@/stores/worldStore';
import { LegacySystem } from '@/core/world/LegacySystem';
import { SaveManager } from '@/core/save/SaveManager';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const worldStore = useWorldStore();

function getLegacyInfo(): string {
  const legacy = LegacySystem.loadLegacy();
  if (!legacy) return '无传承数据。';
  return `${legacy.previousName}存活了${legacy.daysLived}天，留下了${legacy.inheritedCopper}文铜钱和${legacy.inheritedTags.length}个传承印记。`;
}

function newGame() {
  SaveManager.deleteSave();
  gameStore.setGameState('menu');
}

function newGameWithLegacy() {
  // 传承数据保留，回到创建页面
  gameStore.setGameState('creating');
}
</script>

<template>
  <div class="game-over">
    <h1>魂归汴京</h1>
    <p class="obituary">
      {{ playerStore.playerName }}在第{{ worldStore.day }}天离开了人世。
    </p>
    <p class="stats">
      存活 {{ worldStore.day }} 天 · 经历了 {{ Math.floor(worldStore.day / 30) }} 个季节更替
    </p>

    <div class="legacy-info">
      <h3>传承</h3>
      <p>{{ getLegacyInfo() }}</p>
    </div>

    <div class="actions">
      <button @click="newGameWithLegacy" v-if="LegacySystem.hasLegacy()">
        以传承开始新游戏
      </button>
      <button @click="newGame">
        重新开始
      </button>
    </div>
  </div>
</template>

<style scoped>
.game-over {
  text-align: center;
  padding: 60px 20px;
  max-width: 500px;
  margin: 0 auto;
}
.game-over h1 {
  font-size: 2rem;
  color: #8b0000;
  margin-bottom: 20px;
}
.obituary {
  font-size: 1.1rem;
  margin-bottom: 10px;
  line-height: 1.8;
}
.stats {
  color: #7f8c8d;
  margin-bottom: 30px;
}
.legacy-info {
  background: #f5f0e8;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}
.legacy-info h3 {
  margin-bottom: 8px;
  color: #8b4513;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.actions button {
  padding: 10px 24px;
  font-size: 1rem;
  border: 1px solid #8b4513;
  border-radius: 6px;
  background: #faf7f0;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.actions button:hover {
  background: #f0ebe3;
}
.actions button:first-child {
  background: #8b4513;
  color: white;
  border-color: #8b4513;
}
</style>
