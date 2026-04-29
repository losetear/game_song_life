<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useUiStore } from '@/stores/uiStore';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const uiStore = useUiStore();

function makeChoice(choiceId: string) {
  if (!gameStore.engine) return;
  const consequence = gameStore.engine.resolveEventChoice(choiceId);
  if (!consequence) return;

  playerStore.syncFromEngine();
  gameStore.addLog(consequence.narrative);

  // 叙事标签提示
  if (consequence.narrativeTag) {
    gameStore.addLog(`【获得标签：${consequence.narrativeTag}】`);
  }
  if (consequence.transformations) {
    for (const t of consequence.transformations) {
      gameStore.addLog(`【${t.description}】`);
    }
  }

  gameStore.setGameState('playing');
  uiStore.refreshLocationData();
}
</script>

<template>
  <div class="event-overlay">
    <div class="event-panel">
      <div class="event-narrative">
        <p v-if="gameStore.engine?.getActiveEvent()">
          {{ gameStore.engine.getActiveEvent()!.openingNarrative }}
        </p>
      </div>
      <div class="event-choices">
        <button
          v-for="choice in gameStore.engine?.getActiveEvent()?.choices ?? []"
          :key="choice.id"
          class="choice-btn"
          :disabled="!gameStore.engine?.isChoiceAvailable(choice.id)"
          @click="makeChoice(choice.id)"
        >
          {{ choice.text }}
          <span v-if="choice.condition" class="choice-hint">
            （需要{{ choice.condition.field === 'copper' ? '铜钱' :
              choice.condition.field === 'health' ? '健康' :
              choice.condition.field === 'mood' ? '心情' :
              choice.condition.field === 'hunger' ? '饱食' : '精力'
            }}{{ choice.condition.operator === 'gte' ? '≥' : '≤' }}{{ choice.condition.value }}）
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.event-panel {
  background: #faf7f0;
  border: 2px solid #8b4513;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  padding: 24px;
}
.event-narrative {
  line-height: 1.8;
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f0e8;
  border-radius: 4px;
}
.event-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.choice-btn {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  border: 1px solid #bbb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.choice-btn:hover:not(:disabled) {
  background: #f0ebe3;
  border-color: #8b4513;
}
.choice-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.choice-hint {
  font-size: 0.8rem;
  color: #e67e22;
  margin-left: 4px;
}
</style>
