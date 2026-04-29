<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useWorldStore } from '@/stores/worldStore';
import { useUiStore } from '@/stores/uiStore';
import { SaveManager } from '@/core/save/SaveManager';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const worldStore = useWorldStore();
const uiStore = useUiStore();

/** 是否有可用的存档 */
const hasSave = computed(() => SaveManager.hasSave());

/** 存档摘要信息 */
const saveSummary = computed(() => {
  const data = SaveManager.loadSave();
  if (!data) return null;
  const date = new Date(data.timestamp);
  const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return {
    day: data.time?.day ?? 1,
    timeStr,
  };
});

function newGame() {
  gameStore.clearLog();
  gameStore.setGameState('creating');
}

function continueGame() {
  const ok = gameStore.loadSave();
  if (!ok) return;

  // 从引擎恢复玩家名称
  if (gameStore.engine && gameStore.engine.getPlayerId() !== null) {
    const identity = gameStore.engine.em.getComponent(gameStore.engine.getPlayerId()!, 'Identity');
    if (identity && (identity as { name?: string }).name) {
      playerStore.playerName = (identity as { name: string }).name;
    }
  }

  playerStore.syncFromEngine();
  worldStore.syncFromEngine();
  uiStore.refreshLocationData();

  gameStore.addLog('—— 从存档继续 ——');
  gameStore.setGameState('playing');
}
</script>

<template>
  <div class="start-menu">
    <div class="menu-header">
      <h1 class="game-title">市井录</h1>
      <p class="subtitle">北宋汴京 · 生活模拟</p>
      <p class="tagline">漫野奇谭风格 · 文字MUD</p>
    </div>

    <div class="menu-actions">
      <button class="menu-btn primary-btn" @click="newGame">
        <span class="btn-icon">📜</span>
        新游戏
      </button>

      <button
        v-if="hasSave"
        class="menu-btn secondary-btn"
        @click="continueGame"
      >
        <span class="btn-icon">📖</span>
        继续游戏
        <span v-if="saveSummary" class="save-hint">
          第{{ saveSummary.day }}天 · {{ saveSummary.timeStr }}
        </span>
      </button>

      <button
        v-else
        class="menu-btn disabled-btn"
        disabled
      >
        <span class="btn-icon">🔒</span>
        继续游戏
        <span class="save-hint">暂无存档</span>
      </button>
    </div>

    <div class="menu-footer">
      <p>在汴京城中书写你的人生故事</p>
    </div>
  </div>
</template>

<style scoped>
.start-menu {
  text-align: center;
  padding: 40px;
  margin: auto;
  max-width: 480px;
}

.menu-header {
  margin-bottom: 48px;
}

.game-title {
  font-size: 3rem;
  margin-bottom: 12px;
  color: var(--ink);
  letter-spacing: 8px;
}

.subtitle {
  font-size: 1.15rem;
  color: var(--muted);
  margin-bottom: 4px;
}

.tagline {
  font-size: 0.9rem;
  color: #95a5a6;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 48px;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 32px;
  font-size: 1.1rem;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s ease;
  position: relative;
}

.btn-icon {
  font-size: 1.3rem;
}

.primary-btn {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.primary-btn:hover {
  background: #34495e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);
}

.secondary-btn {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--brown);
}
.secondary-btn:hover {
  background: var(--paper-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
}

.disabled-btn {
  background: #f5f5f5;
  color: #bbb;
  border-color: #ddd;
  cursor: not-allowed;
}

.save-hint {
  font-size: 0.8rem;
  color: var(--muted);
  margin-left: 8px;
  font-weight: normal;
}

.menu-footer {
  color: #b0b0b0;
  font-size: 0.85rem;
  font-style: italic;
}
</style>
