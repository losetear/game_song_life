<template>
  <div class="inventory-panel">
    <div class="panel-header">
      <h2>背包</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="inventory-content">
      <div class="inventory-grid">
        <div
          v-for="slot in inventoryItems"
          :key="slot.itemId"
          class="inventory-slot"
          :class="{ usable: slot.itemDef.usable }"
          @click="handleItemClick(slot)"
        >
          <div class="item-icon">{{ slot.itemDef.icon }}</div>
          <div class="item-info">
            <div class="item-name">{{ slot.itemDef.name }}</div>
            <div class="item-count">x{{ slot.count }}</div>
          </div>
          <div v-if="slot.itemDef.rarity !== 'common'" class="rarity-badge" :class="slot.itemDef.rarity">
            {{ rarityText(slot.itemDef.rarity) }}
          </div>
        </div>

        <div v-if="inventoryItems.length === 0" class="empty-message">
          背包是空的
        </div>
      </div>

      <div class="panel-footer">
        <div class="capacity-info">
          {{ inventoryItems.length }} / {{ capacity }} 格子
        </div>
      </div>
    </div>

    <!-- 使用物品反馈 -->
    <div v-if="useMessage" class="message-overlay" @click="useMessage = ''">
      <div class="message-box">
        {{ useMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import type { ItemDef } from '@/core/data/ItemDefs';

defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const inventoryItems = computed(() => {
  if (!gameStore.engine) return [];
  return gameStore.engine.getInventory();
});

const capacity = computed(() => {
  if (!gameStore.engine) return 20;
  const playerId = gameStore.engine.getPlayerId();
  if (!playerId) return 20;
  // 通过EntityManager获取背包容量
  return 20; // 默认20格
});

const useMessage = ref('');

function rarityText(rarity: string): string {
  const map: Record<string, string> = {
    common: '',
    uncommon: '优',
    rare: '稀',
    legendary: '传',
  };
  return map[rarity] || '';
}

function handleItemClick(slot: { itemId: string; itemDef: ItemDef; count: number }) {
  if (!slot.itemDef.usable) {
    useMessage.value = `${slot.itemDef.name}无法直接使用`;
    setTimeout(() => useMessage.value = '', 2000);
    return;
  }

  if (!gameStore.engine) return;

  const result = gameStore.engine.useItem(slot.itemId);
  if (result.success) {
    useMessage.value = result.message;
    gameStore.addLog(result.message);
  } else {
    useMessage.value = result.message;
  }

  setTimeout(() => useMessage.value = '', 3000);
}
</script>

<style scoped>
.inventory-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-height: 80vh;
  background: linear-gradient(135deg, #2c1810 0%, #1a0f0a 100%);
  border: 3px solid #8b6914;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(90deg, #4a2c17 0%, #2c1810 100%);
  border-bottom: 2px solid #8b6914;
}

.panel-header h2 {
  margin: 0;
  color: #d4a574;
  font-size: 1.5rem;
  font-weight: bold;
}

.close-btn {
  background: #8b0000;
  color: #f0e6d2;
  border: 2px solid #a00000;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #a00000;
  transform: scale(1.1);
}

.inventory-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.inventory-slot {
  background: linear-gradient(135deg, #3d2817 0%, #2a1a0f 100%);
  border: 2px solid #5c4033;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100px;
}

.inventory-slot:hover {
  border-color: #d4a574;
  background: linear-gradient(135deg, #4d3827 0%, #3a2a1f 100%);
  transform: translateY(-2px);
}

.inventory-slot.usable {
  border-color: #6b8e23;
}

.inventory-slot.usable:hover {
  border-color: #9acd32;
}

.item-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.item-info {
  text-align: center;
  width: 100%;
}

.item-name {
  color: #f0e6d2;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.item-count {
  color: #d4a574;
  font-size: 0.8rem;
}

.rarity-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
}

.rarity-badge.uncommon {
  background: #4a90d9;
  color: white;
}

.rarity-badge.rare {
  background: #9b59b6;
  color: white;
}

.rarity-badge.legendary {
  background: #f39c12;
  color: white;
  animation: legendary-pulse 2s infinite;
}

@keyframes legendary-pulse {
  0%, 100% {
    box-shadow: 0 0 5px #f39c12;
  }
  50% {
    box-shadow: 0 0 15px #f39c12, 0 0 25px #f39c12;
  }
}

.empty-message {
  grid-column: 1 / -1;
  text-align: center;
  color: #888;
  padding: 40px;
  font-size: 1.1rem;
}

.panel-footer {
  padding: 15px 20px;
  border-top: 2px solid #8b6914;
  background: linear-gradient(90deg, #4a2c17 0%, #2c1810 100%);
}

.capacity-info {
  color: #d4a574;
  text-align: center;
  font-size: 0.9rem;
}

.message-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.message-box {
  background: linear-gradient(135deg, #2c1810 0%, #1a0f0a 100%);
  border: 2px solid #d4a574;
  border-radius: 8px;
  padding: 20px 30px;
  color: #f0e6d2;
  font-size: 1.1rem;
  max-width: 80%;
  text-align: center;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 滚动条样式 */
.inventory-content::-webkit-scrollbar,
.inventory-grid::-webkit-scrollbar {
  width: 8px;
}

.inventory-content::-webkit-scrollbar-track,
.inventory-grid::-webkit-scrollbar-track {
  background: #1a0f0a;
  border-radius: 4px;
}

.inventory-content::-webkit-scrollbar-thumb,
.inventory-grid::-webkit-scrollbar-thumb {
  background: #5c4033;
  border-radius: 4px;
}

.inventory-content::-webkit-scrollbar-thumb:hover,
.inventory-grid::-webkit-scrollbar-thumb:hover {
  background: #6b5043;
}
</style>
