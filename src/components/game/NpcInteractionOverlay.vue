<script setup lang="ts">
import { useInteractionStore } from '@/stores/interactionStore';

const interStore = useInteractionStore();

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

function selectOption(optionId: string) {
  interStore.resolveOption(optionId);
}

function close() {
  interStore.endInteraction();
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
        <p class="result-narrative">{{ interStore.lastResult.narrative }}</p>
        <p class="result-stage" v-if="interStore.lastResult.stageDirection">
          【{{ interStore.lastResult.stageDirection }}】
        </p>
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
          :class="{ 'option-drama': opt.depth === 'drama', 'option-scene': opt.depth === 'scene' }"
          @click="selectOption(opt.id)"
        >
          <span class="option-name">{{ opt.text }}</span>
          <span class="option-meta">
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
.result-narrative { line-height: 1.8; margin-bottom: 4px; }
.result-stage { color: #8b4513; font-style: italic; font-size: 0.85rem; margin-bottom: 6px; }
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
  transition: background 0.2s; text-align: left;
}
.option-btn:hover { background: #f0ebe3; }
.option-scene { border-color: #3498db; }
.option-scene:hover { background: #ebf5fb; }
.option-drama { border-color: #c0392b; background: #fdf2f2; }
.option-drama:hover { background: #fce4e4; }
.option-meta {
  display: flex; gap: 6px; align-items: center;
  font-size: 0.75rem; color: #95a5a6;
}
.option-cost { color: #e67e22; }
.option-depth { font-weight: bold; }
</style>
