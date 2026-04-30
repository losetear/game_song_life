<script setup lang="ts">
import { ref, computed } from 'vue';
import { useInteractionStore } from '@/stores/interactionStore';

const interStore = useInteractionStore();

// 分阶段演出控制
const showStage = ref({
  actionNarrative: false,
  stageDirection: false,
  npcResponse: false,
  atmosphere: false,
  resultInfo: false,
});

// 当有新结果时，重置所有阶段并开始分阶段显示
function resetStages() {
  showStage.value = {
    actionNarrative: false,
    stageDirection: false,
    npcResponse: false,
    atmosphere: false,
    resultInfo: false,
  };
}

// 触发分阶段显示
function startStagedDisplay() {
  setTimeout(() => { showStage.value.actionNarrative = true; }, 100);
  setTimeout(() => { showStage.value.stageDirection = true; }, 600);
  setTimeout(() => { showStage.value.npcResponse = true; }, 900);
  setTimeout(() => { showStage.value.atmosphere = true; }, 1200);
  setTimeout(() => { showStage.value.resultInfo = true; }, 1400);
}

// 计算属性：是否有 RichPerformance 数据
const hasRichPerformance = computed(() => !!interStore.lastResult?.richPerformance);

// 计算属性：RichPerformance 数据
const richPerformance = computed(() => interStore.lastResult?.richPerformance);

function relationColor(score: number): string {
  if (score >= 50) return '#27ae60';
  if (score >= 25) return '#2ecc71';
  if (score >= -25) return '#7f8c8d';
  if (score >= -50) return '#e67e22';
  return '#e74c3c';
}

function toneColor(tone: string): string {
  const colors: Record<string, string> = {
    positive: '#27ae60',
    grateful: '#2980b9',
    neutral: '#7f8c8d',
    negative: '#e67e22',
    hostile: '#c0392b',
  };
  return colors[tone] ?? '#7f8c8d';
}

function relevanceColor(score: number): string {
  if (score >= 80) return '#27ae60';
  if (score >= 60) return '#2ecc71';
  if (score >= 40) return '#f39c12';
  return '#95a5a6';
}

function selectOption(optionId: string) {
  resetStages();
  interStore.resolveOption(optionId);
  // 延迟开始分阶段显示
  setTimeout(() => {
    startStagedDisplay();
  }, 50);
}

function close() {
  interStore.endInteraction();
  resetStages();
}

// 初始化时开始分阶段显示（如果有结果）
if (interStore.lastResult) {
  startStagedDisplay();
}
</script>

<template>
  <div class="interaction-overlay" v-if="interStore.active">
    <div class="interaction-panel">
      <!-- NPC信息头 -->
      <div class="npc-header">
        <div class="npc-name">{{ interStore.npcInfo?.name }}</div>
        <div class="npc-profession">{{ interStore.npcInfo?.profession }}</div>
        <div class="npc-relation" :style="{ color: relationColor(interStore.npcInfo?.relation ?? 0) }">
          {{ interStore.npcInfo?.relationLevel }}
          <span class="relation-score">({{ interStore.npcInfo?.relation ?? 0 }})</span>
        </div>
        <button class="close-btn" @click="close">X</button>
      </div>

      <!-- NPC开场白（初次） -->
      <div class="npc-greeting" v-if="!interStore.lastResult">
        <p>{{ interStore.state?.npcGreeting }}</p>
      </div>

      <!-- 上一次选项的结果展示 -->
      <div class="result-display" v-if="interStore.lastResult">
        <!-- 阶段1: 行动描述 -->
        <transition name="fade-in">
          <p v-if="showStage.actionNarrative" class="result-narrative">
            {{ interStore.lastResult.narrative }}
          </p>
        </transition>

        <!-- RichPerformance 多阶段演出 -->
        <template v-if="hasRichPerformance && richPerformance">
          <!-- 阶段2: 舞台指示 -->
          <transition name="fade-in">
            <p v-if="showStage.stageDirection && richPerformance.stageDirection" class="result-stage">
              {{ richPerformance.stageDirection }}
            </p>
          </transition>

          <!-- 阶段3: NPC反应 -->
          <transition name="fade-in">
            <div v-if="showStage.npcResponse && richPerformance.npcResponse" class="npc-response-detail">
              <p class="npc-expression">{{ richPerformance.npcResponse.expression }}</p>
              <p class="npc-gesture">{{ richPerformance.npcResponse.gesture }}</p>
              <p class="npc-dialogue">"{{ richPerformance.npcResponse.dialogue }}"</p>
              <p v-if="richPerformance.npcResponse.innerThought" class="npc-inner-thought">
                （{{ richPerformance.npcResponse.innerThought }}）
              </p>
            </div>
          </transition>

          <!-- 阶段4: 氛围描写 -->
          <transition name="fade-in">
            <p v-if="showStage.atmosphere && richPerformance.atmosphere" class="result-atmosphere">
              {{ richPerformance.atmosphere }}
            </p>
          </transition>

          <!-- 阶段5: 后续钩子 -->
          <transition name="fade-in">
            <p v-if="showStage.resultInfo && richPerformance.followUpHint" class="result-followup">
              {{ richPerformance.followUpHint }}
            </p>
          </transition>
        </template>

        <!-- 兼容旧的 stageDirection -->
        <transition name="fade-in">
          <p v-if="showStage.stageDirection && !hasRichPerformance && interStore.lastResult.stageDirection" class="result-stage">
            【{{ interStore.lastResult.stageDirection }}】
          </p>
        </transition>

        <!-- 数值变化和标签 -->
        <transition name="fade-in">
        <div class="result-changes" v-if="interStore.lastResult.playerChanges.length > 0 || interStore.lastResult.relationChange !== 0">
          <span v-for="c in interStore.lastResult.playerChanges" :key="c" class="change-tag">{{ c }}</span>
          <span v-if="interStore.lastResult.relationChange > 0" class="change-tag relation-up">
            好感+{{ interStore.lastResult.relationChange }}
          </span>
          <span v-if="interStore.lastResult.relationChange < 0" class="change-tag relation-down">
            好感{{ interStore.lastResult.relationChange }}
          </span>
          <span v-if="interStore.lastResult.gainedTag" class="change-tag tag-gained">
            获得: {{ interStore.lastResult.gainedTag }}
          </span>
        </div>
      </div>

      <!-- NPC反应 -->
      <div class="npc-reaction" v-if="interStore.lastResult?.npcReaction">
        <p :style="{ color: toneColor(interStore.lastResult.npcReaction.tone) }">
          {{ interStore.lastResult.npcReaction.text }}
        </p>
        <!-- NPC反向请求 -->
        <div class="counter-offer" v-if="interStore.lastResult.npcReaction.counterOffer">
          <p class="counter-text">{{ interStore.lastResult.npcReaction.counterOffer.text }}</p>
        </div>
      </div>

      <!-- NPC状态提示 -->
      <div class="npc-hints">
        <span class="hint-tag" v-for="p in interStore.npcInfo?.personality" :key="p">{{ p }}</span>
        <span class="hint-sep" v-if="interStore.npcInfo?.personality?.length">·</span>
        <span class="hint-text">
          {{ (interStore.npcInfo?.mood ?? 50) > 60 ? '心情不错' :
             (interStore.npcInfo?.mood ?? 50) > 30 ? '心情一般' : '心情不佳' }}
        </span>
      </div>

      <!-- 选项列表 -->
      <div class="option-list">
        <button
          v-for="opt in interStore.state?.options ?? []"
          :key="opt.id"
          class="option-btn"
          :class="{
            'option-drama': opt.depth === 'drama',
            'option-scene': opt.depth === 'scene',
            'option-disabled': !opt.conditionMet
          }"
          :disabled="!opt.conditionMet"
          @click="selectOption(opt.id)"
        >
          <div class="option-content">
            <!-- 动态文案或固定文案 -->
            <span class="option-name">{{ opt.dynamicText || opt.text }}</span>
            <!-- 条件不满足时的提示 -->
            <span v-if="!opt.conditionMet && opt.conditionHint" class="option-hint">
              {{ opt.conditionHint }}
            </span>
          </div>
          <span class="option-meta">
            <!-- 相关度评分（星星显示） -->
            <span v-if="opt.relevanceScore !== undefined" class="option-relevance" :style="{ color: relevanceColor(opt.relevanceScore) }">
              {{ '★'.repeat(Math.ceil(opt.relevanceScore / 20)) }}{{ '☆'.repeat(5 - Math.ceil(opt.relevanceScore / 20)) }}
            </span>
            <span v-if="opt.costAp" class="option-cost">AP{{ opt.costAp }}</span>
            <span v-if="opt.costCopper" class="option-cost">{{ opt.costCopper }}文</span>
            <span class="option-depth">{{ opt.depth === 'drama' ? '!' : opt.depth === 'scene' ? '~' : '' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.interaction-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.interaction-panel {
  background: var(--paper, #faf7f0);
  border: 2px solid var(--brown, #8b4513);
  border-radius: 8px;
  max-width: 520px;
  width: 92%;
  padding: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

/* NPC头 */
.npc-header {
  display: flex; align-items: center; gap: 8px;
  padding-bottom: 12px; border-bottom: 1px solid #ddd; margin-bottom: 12px;
}
.npc-name { font-weight: bold; font-size: 1.1rem; }
.npc-profession { color: #7f8c8d; font-size: 0.85rem; }
.npc-relation { font-weight: bold; font-size: 0.85rem; margin-left: auto; }
.relation-score { font-weight: normal; font-size: 0.75rem; color: #95a5a6; }
.close-btn {
  background: none; border: 1px solid #ccc; border-radius: 4px;
  cursor: pointer; padding: 2px 8px; color: #999; font-size: 0.9rem;
}
.close-btn:hover { background: #eee; }

/* 开场白 */
.npc-greeting {
  padding: 12px; background: #f5f0e8; border-radius: 4px;
  line-height: 1.8; margin-bottom: 10px; font-style: italic;
}

/* 结果展示 */
.result-display {
  padding: 12px; background: #f5f0e8; border-radius: 4px;
  margin-bottom: 8px; border-left: 3px solid #8b4513;
}
.result-narrative { line-height: 1.8; margin-bottom: 8px; }
.result-stage {
  color: #8b4513; font-style: italic; font-size: 0.85rem;
  margin-bottom: 6px; padding-left: 12px;
}

/* RichPerformance 样式 */
.npc-response-detail {
  margin: 10px 0;
  padding: 10px;
  background: rgba(139, 69, 19, 0.05);
  border-radius: 4px;
}
.npc-expression {
  color: #555; font-style: italic; font-size: 0.85rem; margin-bottom: 4px;
}
.npc-gesture {
  color: #666; font-size: 0.85rem; margin-bottom: 6px;
}
.npc-dialogue {
  color: #333; font-weight: 500; line-height: 1.6; margin-bottom: 4px;
}
.npc-inner-thought {
  color: #888; font-style: italic; font-size: 0.8rem;
}
.result-atmosphere {
  color: #777; font-style: italic; font-size: 0.85rem;
  margin: 8px 0; padding-left: 12px;
}
.result-followup {
  color: #2980b9; font-style: italic; font-size: 0.85rem;
  margin: 8px 0; padding-left: 12px;
}

/* 分阶段淡入动画 */
.fade-enter-active { animation: fadeIn 0.5s ease-out; }
.fade-enter-from { opacity: 0; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-changes { display: flex; flex-wrap: wrap; gap: 4px; }
.change-tag {
  font-size: 0.75rem; padding: 1px 6px;
  background: #ecf0f1; border-radius: 8px;
}
.relation-up { color: #27ae60; background: #e8f8f0; }
.relation-down { color: #e74c3c; background: #fdf2f2; }
.tag-gained { color: #8e44ad; background: #f5f0fa; }

/* NPC反应 */
.npc-reaction {
  padding: 8px 12px; margin-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.npc-reaction p { line-height: 1.8; font-size: 0.9rem; }
.counter-offer { margin-top: 4px; }
.counter-text { font-style: italic; color: #555; }

/* 状态提示 */
.npc-hints {
  display: flex; align-items: center; gap: 4px;
  margin-bottom: 16px; font-size: 0.8rem; color: #7f8c8d;
}
.hint-tag { padding: 1px 6px; background: #ecf0f1; border-radius: 8px; }
.hint-sep { color: #ccc; }

/* 选项列表 */
.option-list { display: flex; flex-direction: column; gap: 6px; }
.option-btn {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; padding: 8px 12px; border: 1px solid #bbb; border-radius: 4px;
  background: #fff; cursor: pointer; font-family: inherit; font-size: 0.9rem;
  transition: all 0.2s; text-align: left;
}
.option-btn:hover:not(.option-disabled) { background: #f0ebe3; }
.option-btn:disabled:not(.option-disabled) { cursor: not-allowed; }
.option-scene { border-color: #3498db; }
.option-scene:hover:not(.option-disabled) { background: #ebf5fb; }
.option-drama {
  border-color: #c0392b; background: #fdf2f2;
  animation: pulse 2s infinite;
}
.option-drama:hover:not(.option-disabled) { background: #fce4e4; }
.option-disabled {
  opacity: 0.5; cursor: not-allowed; background: #f5f5f5;
}
.option-content {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
}
.option-hint {
  font-size: 0.75rem; color: #e74c3c; font-style: italic;
}
.option-meta {
  display: flex; gap: 6px; align-items: center;
  font-size: 0.75rem; color: #95a5a6;
}
.option-relevance { font-size: 0.7rem; }
.option-cost { color: #e67e22; }
.option-depth { font-weight: bold; }

/* Drama 选项脉冲动画 */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(192, 57, 43, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(192, 57, 43, 0); }
}
</style>
