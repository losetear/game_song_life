<script setup lang="ts">
import { useWorldStore } from '@/stores/worldStore';

const world = useWorldStore();

const weatherIcon: Record<string, string> = {
  '晴': '☀',
  '阴': '☁',
  '雨': '🌧',
  '雪': '❄',
};
</script>

<template>
  <div class="top-bar">
    <span class="title">市井录</span>
    <span class="world-info">
      第{{ world.day }}天 · {{ world.season }} · {{ weatherIcon[world.weather] || world.weather }}
    </span>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2c3e50;
  color: #ecf0f1;
  font-size: 0.9rem;
}
.title {
  font-weight: bold;
  font-size: 1rem;
}
</style>
