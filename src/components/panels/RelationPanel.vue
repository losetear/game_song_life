<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';

const gameStore = useGameStore();

function getRelations() {
  if (!gameStore.engine) return [];
  return gameStore.engine.getPlayerRelations();
}

function scoreColor(score: number): string {
  if (score >= 50) return '#27ae60';
  if (score >= 25) return '#2ecc71';
  if (score >= -25) return '#7f8c8d';
  if (score >= -50) return '#e67e22';
  return '#e74c3c';
}
</script>

<template>
  <div class="relation-panel">
    <h3>人际关系</h3>
    <div v-if="getRelations().length === 0" class="empty">
      尚未与任何人建立关系。
    </div>
    <div v-else class="relation-list">
      <div
        v-for="rel in getRelations()"
        :key="rel.targetId"
        class="relation-item"
      >
        <span class="name">{{ rel.targetName }}</span>
        <span class="profession">{{ rel.profession }}</span>
        <span class="level" :style="{ color: scoreColor(rel.score) }">
          {{ rel.level }}
        </span>
        <span class="score">{{ rel.score > 0 ? '+' : '' }}{{ rel.score }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.relation-panel {
  padding: 12px;
}
.relation-panel h3 {
  font-size: 0.95rem;
  margin-bottom: 10px;
  color: #2c3e50;
}
.empty {
  font-size: 0.85rem;
  color: #aaa;
  font-style: italic;
}
.relation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.relation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f8f5ed;
  font-size: 0.85rem;
}
.name {
  font-weight: bold;
  min-width: 60px;
}
.profession {
  color: #7f8c8d;
  min-width: 50px;
}
.level {
  font-weight: bold;
}
.score {
  margin-left: auto;
  font-size: 0.8rem;
  color: #95a5a6;
}
</style>
