<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useWorldStore } from '@/stores/worldStore';
import { useUiStore } from '@/stores/uiStore';
import { getLocation } from '@/core/data/LocationDefs';
import TopBar from '@/components/layout/TopBar.vue';
import StartMenu from '@/components/layout/StartMenu.vue';
import PlayerStatus from '@/components/game/PlayerStatus.vue';
import CharacterCreation from '@/components/panels/CharacterCreation.vue';
import RelationPanel from '@/components/panels/RelationPanel.vue';
import EventPanel from '@/components/game/EventPanel.vue';
import GameOverScreen from '@/components/game/GameOverScreen.vue';
import NpcInteractionOverlay from '@/components/game/NpcInteractionOverlay.vue';
import InventoryPanel from '@/components/game/InventoryPanel.vue';
import ShopPanel from '@/components/game/ShopPanel.vue';
import { SaveManager } from '@/core/save/SaveManager';
import { LegacySystem } from '@/core/world/LegacySystem';
import { useInteractionStore } from '@/stores/interactionStore';
import { ref } from 'vue';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const worldStore = useWorldStore();
const uiStore = useUiStore();
const interStore = useInteractionStore();

function endTurn() {
  if (!gameStore.engine) return;
  const result = gameStore.engine.advanceDay();
  gameStore.currentDayResult = result;
  playerStore.syncFromEngine();
  worldStore.syncFromEngine();
  uiStore.refreshLocationData();

  gameStore.addLog(`—— 第${result.day}天 ——`);

  // NPC行动摘要（只显示同地点的）
  for (const action of result.npcActions) {
    gameStore.addLog(`  ${action.narrative}`);
  }

  if (result.weatherChanged) {
    gameStore.addLog(`天气转为${result.weather}。`);
  }

  // 传闻和延迟后果事件
  for (const evt of result.majorEvents) {
    gameStore.addLog(`  ${evt}`);
  }

  // 检查是否触发分支事件
  const event = gameStore.engine.checkPlayerEvent();
  if (event) {
    gameStore.setGameState('event');
  }

  // 死亡检查
  if (result.playerDied) {
    const memory = gameStore.engine.em.getComponent(gameStore.engine.getPlayerId()!, 'Memory');
    const legacy = LegacySystem.calculateLegacy({
      copper: result.playerState.copper,
      narrativeTags: memory?.narrativeTags ?? [],
      relations: memory?.impressions ?? {},
      name: playerStore.playerName,
      daysLived: worldStore.day,
    });
    LegacySystem.saveLegacy(legacy);
    gameStore.addLog(result.deathCause);
    gameStore.setGameState('dead');
    return;
  }

  // 自动存档
  if (gameStore.engine) {
    const saveData = gameStore.engine.exportSave();
    SaveManager.autoSaveFromData(saveData);
  }
}

function moveTo(locationId: string) {
  if (!gameStore.engine) return;
  const result = gameStore.engine.movePlayer(locationId);
  if (result.success) {
    playerStore.syncFromEngine();
    uiStore.refreshLocationData();
    gameStore.addLog(result.message);
  } else {
    gameStore.addLog(result.message);
  }
}

function doAction(actionId: string) {
  if (!gameStore.engine) return;
  const result = gameStore.engine.executePlayerAction(actionId);
  if (result.success) {
    playerStore.syncFromEngine();
    uiStore.refreshLocationData();
    gameStore.addLog(result.message);
  } else {
    gameStore.addLog(result.message);
  }
}

function getAvailableActions() {
  if (!gameStore.engine) return [];
  return gameStore.engine.getAvailablePlayerActions();
}

function currentLocationName(): string {
  const loc = getLocation(playerStore.locationId);
  return loc?.name ?? playerStore.locationId;
}

// 背包和商店面板控制
const showInventory = ref(false);
const showShop = ref(false);
const selectedShopId = ref<string | null>(null);

function openInventory() {
  showInventory.value = true;
}

function openShop(shopId: string) {
  selectedShopId.value = shopId;
  showShop.value = true;
}

function getCurrentShopId(): string | null {
  if (!gameStore.engine) return null;
  const shops = gameStore.engine.getShopsAtCurrentLocation();
  return shops.length > 0 ? shops[0]!.id : null;
}
</script>

<template>
  <div class="app-container">
    <TopBar v-if="gameStore.gameState !== 'menu'" />
    <PlayerStatus v-if="gameStore.gameState === 'playing'" />

    <main class="main-area">
      <!-- 主菜单 -->
      <StartMenu v-if="gameStore.gameState === 'menu'" />

      <!-- 角色创建 -->
      <CharacterCreation v-else-if="gameStore.gameState === 'creating'" />

      <!-- 游戏主界面 -->
      <div v-else-if="gameStore.gameState === 'playing'" class="game-area">
        <!-- 三栏布局 -->
        <div class="game-layout">
          <!-- 左侧：事件日志 + 关系 -->
          <aside class="log-panel">
            <h3>事件日志</h3>
            <div class="log-scroll">
              <p v-for="(entry, i) in gameStore.logEntries" :key="i" class="log-entry">
                {{ entry }}
              </p>
              <p v-if="gameStore.logEntries.length === 0" class="log-empty">
                新的一天开始了……
              </p>
            </div>
            <RelationPanel />
          </aside>

          <!-- 中央：场景描述 -->
          <section class="scene-panel">
            <div class="scene-text">
              <p class="location-name">{{ currentLocationName() }}</p>
              <p>{{ getLocation(playerStore.locationId)?.description }}</p>
            </div>

            <!-- 在场NPC -->
            <div class="npc-section">
              <h3>在场的人</h3>
              <div v-if="uiStore.currentNpcs.length === 0" class="npc-empty">
                此处无人。
              </div>
              <div v-else class="npc-list">
                <span
                  v-for="npc in uiStore.currentNpcs"
                  :key="npc.id"
                  class="npc-tag npc-clickable"
                  @click="interStore.startInteraction(npc.id)"
                >
                  {{ npc.name }}（{{ npc.profession }}）
                </span>
              </div>
            </div>

            <!-- 行情 -->
            <div class="price-section">
              <h3>今日行情</h3>
              <div class="price-list">
                <span v-for="(info, id) in worldStore.prices" :key="id" class="price-tag">
                  {{ info.name }}: {{ info.price }}文
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="actions">
              <button
                v-for="action in getAvailableActions()"
                :key="action.id"
                class="action-btn"
                @click="doAction(action.id)"
              >
                {{ action.name }}
                <span v-if="action.cost.copper" class="action-cost">({{ action.cost.copper }}文)</span>
              </button>
              <span class="action-divider">|</span>
              <button
                v-for="loc in uiStore.reachableLocations"
                :key="loc.id"
                class="action-btn move-btn"
                :disabled="playerStore.actionPoints <= 0"
                @click="moveTo(loc.id)"
              >
                去{{ loc.name }}
              </button>
              <button class="action-btn end-turn-btn" @click="endTurn">
                结束回合
              </button>
			  <button class="action-btn inventory-btn" @click="openInventory">
			    背包
			  </button>
			  <button
			    v-if="getCurrentShopId()"
			    class="action-btn shop-btn"
			    @click="openShop(getCurrentShopId()!)"
			  >
			    进店
			  </button>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- 事件弹窗 -->
    <EventPanel v-if="gameStore.gameState === 'event'" />

    <!-- 死亡画面 -->
    <GameOverScreen v-if="gameStore.gameState === 'dead'" />

    <!-- NPC交互面板 -->
    <NpcInteractionOverlay v-if="gameStore.gameState === 'interacting'" />
		<!-- 背包面板 -->
	    <InventoryPanel v-if="showInventory" @close="showInventory = false" />

		<!-- 商店面板 -->
	    <ShopPanel v-if="showShop && selectedShopId" :shop-id="selectedShopId" @close="showShop = false" />
  </div>
</template>

<style>
@import './styles/variables.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: 'SimSun', 'Songti SC', 'Noto Serif SC', serif;
  background: var(--paper-dark);
  color: var(--ink);
  font-size: 16px;
  line-height: 1.6;
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: var(--brown);
  border-radius: 3px;
}
</style>

<style scoped>
.app-container {
  max-width: 960px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #faf7f0;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
}

.main-area {
  flex: 1;
  display: flex;
}

/* 游戏三栏布局 */
.game-area {
  flex: 1;
}
.game-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  min-height: calc(100vh - 160px);
}

/* 左侧日志 */
.log-panel {
  border-right: 1px solid #ddd;
  padding: 12px;
  background: #f8f5ed;
}
.log-panel h3 {
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #7f8c8d;
}
.log-scroll {
  max-height: 400px;
  overflow-y: auto;
}
.log-entry {
  font-size: 0.8rem;
  line-height: 1.6;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}
.log-empty {
  font-size: 0.8rem;
  color: #aaa;
  font-style: italic;
}

/* 中央场景 */
.scene-panel {
  display: flex;
  flex-direction: column;
  padding: 16px;
}
.scene-text {
  padding: 12px;
  line-height: 1.8;
}
.location-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 6px;
}

/* NPC区域 */
.npc-section {
  padding: 12px;
  border-top: 1px solid #eee;
}
.npc-section h3 {
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #7f8c8d;
}
.npc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.npc-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #ecf0f1;
  border-radius: 12px;
  font-size: 0.85rem;
}
.npc-clickable {
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.npc-clickable:hover {
  background: #d5dbdb;
  transform: translateY(-1px);
}
.npc-empty {
  font-size: 0.85rem;
  color: #aaa;
  font-style: italic;
}

/* 行情 */
.price-section {
  padding: 12px;
  border-top: 1px solid #eee;
}
.price-section h3 {
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: #7f8c8d;
}
.price-list {
  display: flex;
  gap: 12px;
}
.price-tag {
  font-size: 0.8rem;
  color: #8b4513;
}

/* 操作栏 */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #ddd;
  margin-top: auto;
}
.action-btn {
  padding: 8px 16px;
  border: 1px solid #bbb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.action-btn:hover:not(:disabled) {
  background: #eee;
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.move-btn {
  border-color: #3498db;
  color: #3498db;
}
.action-cost {
  font-size: 0.75rem;
  color: #e67e22;
}
.action-divider {
  color: #ddd;
  align-self: center;
}
.end-turn-btn {
  background: #2c3e50;
  color: #ecf0f1;
  border-color: #2c3e50;
}
.end-turn-btn:hover {
  background: #34495e;
}
.inventory-btn {
  border-color: #9b59b6;
  color: #9b59b6;
}
.inventory-btn:hover {
  background: #f4ecf7;
}
.shop-btn {
  border-color: #e67e22;
  color: #e67e22;
}
.shop-btn:hover {
  background: #fef5e7;
}
</style>
