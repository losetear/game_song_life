<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
const gameStore = useGameStore();

/** 当前回合结果 */
const result = computed(() => gameStore.currentDayResult);

/** 按地点分组的NPC行动（只显示玩家所在地点或附近的） */
const groupedNpcActions = computed(() => {
  if (!result.value) return [];
  // 按地点分组，每组最多显示3条
  const groups: Record<string, string[]> = {};
  for (const action of result.value.npcActions) {
    if (!groups[action.locationId]) {
      groups[action.locationId] = [];
    }
    const group = groups[action.locationId];
    if (group && group.length < 3) {
      group.push(action.narrative);
    }
  }
  return Object.entries(groups);
});

/** 重大事件按影响等级分类 */
const criticalEvents = computed(() => {
  if (!result.value) return [];
  return result.value.majorEvents.filter((e) => e.includes('死亡') || e.includes('重症') || e.includes('瘟疫'));
});

const importantEvents = computed(() => {
  if (!result.value) return [];
  return result.value.majorEvents.filter(
    (e) => !e.includes('死亡') && !e.includes('重症') && !e.includes('瘟疫'),
  );
});

/** 计算净收入 */
const netIncome = computed(() => {
  if (!result.value) return 0;
  return (result.value.dailyIncome || 0) - (result.value.dailyExpense || 0);
});

/** 返回游戏 */
function backToGame() {
  gameStore.setGameState('playing');
}
</script>

<template>
  <div class="day-summary-overlay">
    <div class="day-summary-panel">
      <!-- 标题区 -->
      <div class="summary-header">
        <h2>第{{ result?.day ?? '?' }}天 · 夜间结算</h2>
        <span class="season-weather">
          {{ result?.season }} · {{ result?.weather }}
          <span v-if result?.weatherChanged class="weather-changed">(天气变化)</span>
        </span>
      </div>

      <!-- 玩家状态摘要 -->
      <div class="player-summary">
        <h3>自身状况</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">饱食</span>
            <span class="value" :class="{ warning: (result?.playerState.hunger ?? 0) < 30 }">
              {{ result?.playerState.hunger ?? 0 }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">精力</span>
            <span class="value" :class="{ warning: (result?.playerState.fatigue ?? 0) < 30 }">
              {{ result?.playerState.fatigue ?? 0 }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">健康</span>
            <span class="value" :class="{ danger: (result?.playerState.health ?? 0) < 30 }">
              {{ result?.playerState.health ?? 0 }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">心情</span>
            <span class="value">{{ result?.playerState.mood ?? 0 }}</span>
          </div>
          <div class="status-item">
            <span class="label">铜钱</span>
            <span class="value copper">{{ result?.playerState.copper ?? 0 }}文</span>
          </div>
          <div class="status-item">
            <span class="label">行动点</span>
            <span class="value">{{ result?.playerState.actionPoints ?? 0 }}/4</span>
          </div>
        </div>
      </div>

      <!-- 收支明细 -->
      <div class="finance-summary" v-if="result && (result.dailyIncome > 0 || result.dailyExpense > 0)">
        <h3>今日收支</h3>
        <div class="finance-grid">
          <div class="finance-item income">
            <span class="label">收入</span>
            <span class="value">+{{ result.dailyIncome }}文</span>
          </div>
          <div class="finance-item expense">
            <span class="label">支出</span>
            <span class="value">-{{ result.dailyExpense }}文</span>
          </div>
          <div class="finance-item net" :class="{ positive: netIncome > 0, negative: netIncome < 0 }">
            <span class="label">净收支</span>
            <span class="value">{{ netIncome > 0 ? '+' : '' }}{{ netIncome }}文</span>
          </div>
        </div>
        <div class="transaction-list" v-if="result.transactions.length > 0">
          <div class="transaction-header">交易明细</div>
          <ul class="transactions">
            <li v-for="(txn, i) in result.transactions.slice(0, 8)" :key="i" :class="{ income: txn.includes('+'), expense: txn.includes('-') }">
              {{ txn }}
            </li>
            <li v-if="result.transactions.length > 8" class="more-hint">
              ……还有 {{ result.transactions.length - 8 }} 笔交易
            </li>
          </ul>
        </div>
      </div>

      <!-- 健康警告 -->
      <div class="health-warnings" v-if="result && result.healthWarnings.length > 0">
        <h3 class="warning-title">⚠ 健康警告</h3>
        <ul class="warning-list">
          <li v-for="(warning, i) in result.healthWarnings" :key="i" class="warning-item">
            {{ warning }}
          </li>
        </ul>
      </div>

      <!-- 夜间事件 -->
      <div class="night-event" v-if="result && result.nightEvent">
        <h3>🌙 夜间事件</h3>
        <p class="night-event-text">{{ result.nightEvent }}</p>
      </div>

      <!-- 次日天气 -->
      <div class="next-day-weather" v-if="result && result.nextDayWeather">
        <span class="weather-icon">🌤</span>
        <span class="weather-text">{{ result.nextDayWeather }}</span>
      </div>

      <!-- NPC行动摘要 -->
      <div class="npc-actions-section" v-if="groupedNpcActions.length > 0">
        <h3>城中见闻</h3>
        <div v-for="[location, narratives] in groupedNpcActions" :key="location" class="location-group">
          <span class="location-label">{{ location }}</span>
          <ul class="narrative-list">
            <li v-for="(text, i) in narratives" :key="i">{{ text }}</li>
          </ul>
        </div>
        <p v-if="(result?.npcActions.length ?? 0) > 9" class="more-hint">
          ……还有 {{ (result?.npcActions.length ?? 0) - 9 }} 件琐事不一一赘述。
        </p>
      </div>

      <!-- 重大事件 -->
      <div class="major-events-section" v-if="criticalEvents.length > 0">
        <h3 class="critical-title">⚠ 大事记</h3>
        <div class="event-list critical">
          <p v-for="(evt, i) in criticalEvents" :key="i" class="event-item critical-event">
            {{ evt }}
          </p>
        </div>
      </div>

      <div class="major-events-section" v-if="importantEvents.length > 0">
        <h3>消息传闻</h3>
        <div class="event-list">
          <p v-for="(evt, i) in importantEvents" :key="i" class="event-item">
            {{ evt }}
          </p>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-day" v-if="
        (result?.npcActions.length ?? 0) === 0 &&
        (result?.majorEvents.length ?? 0) === 0
      ">
        今夜平安无事，汴京城在沉睡中等待黎明。
      </div>

      <!-- 操作按钮 -->
      <div class="summary-actions">
        <button class="confirm-btn" @click="backToGame">
          进入第{{ (result?.day ?? 0) + 1 }}天
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-summary-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.day-summary-panel {
  background: var(--paper, #faf7f0);
  border: 2px solid var(--brown, #8b4513);
  border-radius: 10px;
  max-width: 640px;
  width: 92%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* 标题区 */
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #8b4513;
}
.summary-header h2 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0;
}
.season-weather {
  font-size: 0.9rem;
  color: #7f8c8d;
}
.weather-changed {
  color: #e67e22;
  font-weight: bold;
}

/* 玩家状态 */
.player-summary {
  margin-bottom: 16px;
}
.player-summary h3 {
  font-size: 1rem;
  color: #8b4513;
  margin-bottom: 8px;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 16px;
}
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 3px 8px;
  background: #f5f0e8;
  border-radius: 4px;
}
.status-item .label {
  color: #666;
}
.status-item .value {
  font-weight: bold;
  color: #2c3e50;
}
.status-item .value.warning {
  color: #e67e22;
}
.status-item .value.danger {
  color: #e74c3c;
}
.status-item .value.copper {
  color: #8b4513;
}

/* NPC行动 */
.npc-actions-section {
  margin-bottom: 16px;
}
.npc-actions-section h3 {
  font-size: 1rem;
  color: #8b4513;
  margin-bottom: 8px;
}
.location-group {
  margin-bottom: 8px;
}
.location-label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 3px;
}
.narrative-list {
  margin: 4px 0 0 16px;
  padding: 0;
}
.narrative-list li {
  font-size: 0.85rem;
  line-height: 1.7;
  color: #555;
  list-style: disc;
}
.more-hint {
  font-size: 0.8rem;
  color: #aaa;
  font-style: italic;
  margin-top: 4px;
}

/* 重大事件 */
.major-events-section {
  margin-bottom: 16px;
}
.major-events-section h3 {
  font-size: 1rem;
  margin-bottom: 8px;
}
.critical-title {
  color: #c0392b !important;
}
.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.event-item {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.88rem;
  line-height: 1.7;
  background: #f5f0e8;
  border-left: 3px solid #8b4513;
}
.critical-event {
  background: #fdf2f2;
  border-left-color: #c0392b;
  color: #a93226;
  font-weight: 500;
}

/* 空状态 */
.empty-day {
  text-align: center;
  padding: 20px;
  font-style: italic;
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

/* 收支明细 */
.finance-summary {
  margin-bottom: 16px;
}
.finance-summary h3 {
  font-size: 1rem;
  color: #8b4513;
  margin-bottom: 8px;
}
.finance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.finance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: #f5f0e8;
}
.finance-item .label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 4px;
}
.finance-item .value {
  font-size: 1rem;
  font-weight: bold;
}
.finance-item.income .value {
  color: #27ae60;
}
.finance-item.expense .value {
  color: #e74c3c;
}
.finance-item.net .value {
  color: #7f8c8d;
}
.finance-item.net.positive .value {
  color: #27ae60;
}
.finance-item.net.negative .value {
  color: #e74c3c;
}
.transaction-list {
  margin-top: 8px;
}
.transaction-header {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #ddd;
}
.transactions {
  margin: 0;
  padding-left: 20px;
}
.transactions li {
  font-size: 0.8rem;
  line-height: 1.8;
  color: #555;
}
.transactions li.income {
  color: #27ae60;
}
.transactions li.expense {
  color: #e74c3c;
}
.transactions li.more-hint {
  color: #999;
  font-style: italic;
  list-style: none;
  margin-left: -20px;
}

/* 健康警告 */
.health-warnings {
  margin-bottom: 16px;
  padding: 12px;
  background: #fdf2f2;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  animation: flash-warning 2s ease-in-out 3;
}
@keyframes flash-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.health-warnings h3 {
  font-size: 1rem;
  color: #c0392b;
  margin-bottom: 8px;
}
.warning-list {
  margin: 0;
  padding-left: 20px;
}
.warning-item {
  font-size: 0.85rem;
  line-height: 1.7;
  color: #a93226;
  list-style: disc;
}

/* 夜间事件 */
.night-event {
  margin-bottom: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}
.night-event h3 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: white;
}
.night-event-text {
  font-size: 0.9rem;
  line-height: 1.7;
  margin: 0;
  font-style: italic;
}

/* 次日天气 */
.next-day-weather {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #ecf0f1;
  border-radius: 6px;
  margin-bottom: 16px;
}
.weather-icon {
  font-size: 1.5rem;
}
.weather-text {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

/* 操作按钮 */
.summary-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #ddd;
}
.confirm-btn {
  padding: 10px 32px;
  font-size: 1rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.confirm-btn:hover {
  background: #34495e;
}
</style>
