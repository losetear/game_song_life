<script setup lang="ts">
import { usePlayerStore } from '@/stores/playerStore';

const player = usePlayerStore();
</script>

<template>
  <div class="player-status">
    <div class="status-name">{{ player.playerName }}</div>
    <div class="status-bars">
      <div class="bar-item">
        <span class="bar-label">饱食</span>
        <div class="bar-track">
          <div
            class="bar-fill hunger"
            :style="{ width: player.hunger + '%' }"
          />
        </div>
        <span class="bar-value">{{ player.hunger }}</span>
      </div>
      <div class="bar-item">
        <span class="bar-label">精力</span>
        <div class="bar-track">
          <div
            class="bar-fill fatigue"
            :style="{ width: player.fatigue + '%' }"
          />
        </div>
        <span class="bar-value">{{ player.fatigue }}</span>
      </div>
      <div class="bar-item">
        <span class="bar-label">健康</span>
        <div class="bar-track">
          <div
            class="bar-fill health"
            :style="{ width: player.health + '%' }"
          />
        </div>
        <span class="bar-value">{{ player.health }}</span>
      </div>
      <div class="bar-item">
        <span class="bar-label">心情</span>
        <div class="bar-track">
          <div
            class="bar-fill mood"
            :style="{ width: player.mood + '%' }"
          />
        </div>
        <span class="bar-value">{{ player.mood }}</span>
      </div>
    </div>
    <div class="status-footer">
      <span>铜钱: {{ player.copper }}文</span>
      <span>行动点: {{ player.actionPoints }}/4</span>
    </div>
  </div>
</template>

<style scoped>
.player-status {
  padding: 10px 16px;
  border-bottom: 1px solid #ddd;
  background: #fafafa;
}
.status-name {
  font-weight: bold;
  margin-bottom: 6px;
}
.status-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}
.bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}
.bar-label {
  width: 30px;
  text-align: right;
}
.bar-track {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.bar-fill.hunger { background: #e67e22; }
.bar-fill.fatigue { background: #3498db; }
.bar-fill.health { background: #e74c3c; }
.bar-fill.mood { background: #9b59b6; }
.bar-value {
  width: 24px;
  text-align: right;
  font-size: 0.8rem;
  color: #666;
}
.status-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.85rem;
  color: #555;
}
</style>
