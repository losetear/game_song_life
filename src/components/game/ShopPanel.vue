<template>
  <div class="shop-panel">
    <div class="panel-header">
      <h2>{{ shopInfo?.name || '店铺' }}</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div v-if="shopInfo" class="shop-content">
      <div class="shop-description">{{ shopInfo.description }}</div>

      <div class="player-money">
        <span class="money-label">当前铜钱：</span>
        <span class="money-value">{{ playerCopper }}文</span>
      </div>

      <div class="trade-section">
        <!-- 店铺商品列表 -->
        <div class="shop-items">
          <h3>店铺商品</h3>
          <div class="items-list">
            <div
              v-for="item in shopInfo.sellItemsWithPrice"
              :key="item.itemId"
              class="shop-item"
              :class="{ disabled: playerCopper < item.price }"
            >
              <div class="item-icon">{{ item.itemDef.icon }}</div>
              <div class="item-details">
                <div class="item-name">{{ item.itemDef.name }}</div>
                <div class="item-price">{{ item.price }}文</div>
              </div>
              <button
                class="buy-btn"
                :disabled="playerCopper < item.price"
                @click="handleBuy(item)"
              >
                购买
              </button>
            </div>
          </div>
        </div>

        <!-- 玩家背包（可出售的物品） -->
        <div class="player-inventory">
          <h3>我的物品（可出售）</h3>
          <div class="items-list">
            <div
              v-for="item in sellableItems"
              :key="item.itemId"
              class="inventory-item"
            >
              <div class="item-icon">{{ item.itemDef.icon }}</div>
              <div class="item-details">
                <div class="item-name">{{ item.itemDef.name }} x{{ item.count }}</div>
                <div class="sell-price">{{ getSellPrice(item.itemDef) }}文</div>
              </div>
              <button
                class="sell-btn"
                @click="handleSell(item)"
              >
                出售
              </button>
            </div>

            <div v-if="sellableItems.length === 0" class="empty-message">
              没有可出售的物品
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交易反馈 -->
    <div v-if="tradeMessage" class="message-overlay" @click="tradeMessage = ''">
      <div class="message-box">
        {{ tradeMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';

const props = defineProps<{
  shopId: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const tradeMessage = ref('');

const shopInfo = computed(() => {
  if (!gameStore.engine) return null;
  return gameStore.engine.getShopInfo(props.shopId);
});

const playerCopper = computed(() => {
  if (!gameStore.engine) return 0;
  const playerId = gameStore.engine.getPlayerId();
  if (!playerId) return 0;
  // TODO: 从Wallet组件获取正确的铜钱数
  return 100;
});

const inventoryItems = computed(() => {
  if (!gameStore.engine) return [];
  return gameStore.engine.getInventory();
});

// 筛选可出售的物品（店铺收购的类别）
const sellableItems = computed(() => {
  if (!shopInfo.value) return [];
  const buyCategories = shopInfo.value.buyCategories;

  return inventoryItems.value.filter(item =>
    buyCategories.includes(item.itemDef.category)
  );
});

function getSellPrice(itemDef: import('@/core/data/ItemDefs').ItemDef): number {
  if (!shopInfo.value) return 0;
  return Math.floor(itemDef.basePrice * shopInfo.value.buyPriceMultiplier);
}

function handleBuy(item: { itemId: string; itemDef: import('@/core/data/ItemDefs').ItemDef; price: number }) {
  if (!gameStore.engine) return;

  const result = gameStore.engine.buyItem(props.shopId, item.itemId);
  if (result.success) {
    tradeMessage.value = result.message;
    gameStore.addLog(result.message);
  } else {
    tradeMessage.value = result.message;
  }

  setTimeout(() => tradeMessage.value = '', 3000);
}

function handleSell(item: { itemId: string; itemDef: import('@/core/data/ItemDefs').ItemDef; count: number }) {
  if (!gameStore.engine) return;

  const result = gameStore.engine.sellItem(item.itemId, props.shopId);
  if (result.success) {
    tradeMessage.value = result.message;
    gameStore.addLog(result.message);
  } else {
    tradeMessage.value = result.message;
  }

  setTimeout(() => tradeMessage.value = '', 3000);
}
</script>

<style scoped>
.shop-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  max-height: 85vh;
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

.shop-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.shop-description {
  color: #b8966e;
  text-align: center;
  font-size: 1rem;
  margin-bottom: 15px;
  font-style: italic;
}

.player-money {
  background: linear-gradient(90deg, #3d2817 0%, #2a1a0f 100%);
  border: 2px solid #5c4033;
  border-radius: 6px;
  padding: 12px 20px;
  margin-bottom: 20px;
  text-align: center;
}

.money-label {
  color: #d4a574;
  font-size: 1rem;
}

.money-value {
  color: #ffd700;
  font-size: 1.3rem;
  font-weight: bold;
  margin-left: 8px;
}

.trade-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.shop-items,
.player-inventory {
  background: linear-gradient(135deg, #1a0f0a 0%, #2c1810 100%);
  border: 2px solid #5c4033;
  border-radius: 8px;
  padding: 15px;
}

.shop-items h3,
.player-inventory h3 {
  margin: 0 0 15px 0;
  color: #d4a574;
  font-size: 1.2rem;
  text-align: center;
  border-bottom: 1px solid #5c4033;
  padding-bottom: 10px;
}

.items-list {
  max-height: 400px;
  overflow-y: auto;
}

.shop-item,
.inventory-item {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #3d2817 0%, #2a1a0f 100%);
  border: 2px solid #5c4033;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.shop-item:hover,
.inventory-item:hover {
  border-color: #d4a574;
  transform: translateX(3px);
}

.shop-item.disabled {
  opacity: 0.5;
}

.item-icon {
  font-size: 2rem;
  margin-right: 10px;
}

.item-details {
  flex: 1;
}

.item-name {
  color: #f0e6d2;
  font-size: 0.95rem;
  font-weight: bold;
  margin-bottom: 3px;
}

.item-price,
.sell-price {
  color: #d4a574;
  font-size: 0.85rem;
}

.buy-btn,
.sell-btn {
  background: linear-gradient(135deg, #4a7c4e 0%, #3d6640 100%);
  color: #f0e6d2;
  border: 2px solid #5c8f5f;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.buy-btn:hover:not(:disabled),
.sell-btn:hover {
  background: linear-gradient(135deg, #5c8f5f 0%, #4a7c4e 100%);
  transform: scale(1.05);
}

.buy-btn:disabled {
  background: #555;
  border-color: #666;
  cursor: not-allowed;
}

.sell-btn {
  background: linear-gradient(135deg, #8b6914 0%, #6b5010 100%);
  border-color: #a07d18;
}

.sell-btn:hover {
  background: linear-gradient(135deg, #a07d18 0%, #8b6914 100%);
}

.empty-message {
  text-align: center;
  color: #888;
  padding: 30px;
  font-size: 1rem;
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
.shop-content::-webkit-scrollbar,
.items-list::-webkit-scrollbar {
  width: 8px;
}

.shop-content::-webkit-scrollbar-track,
.items-list::-webkit-scrollbar-track {
  background: #1a0f0a;
  border-radius: 4px;
}

.shop-content::-webkit-scrollbar-thumb,
.items-list::-webkit-scrollbar-thumb {
  background: #5c4033;
  border-radius: 4px;
}

.shop-content::-webkit-scrollbar-thumb:hover,
.items-list::-webkit-scrollbar-thumb:hover {
  background: #6b5043;
}
</style>
