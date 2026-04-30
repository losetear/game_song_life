import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useGameStore } from './gameStore';
import { usePlayerStore } from './playerStore';
import { RelationSystem } from '@/core/world/RelationSystem';
import type { InteractionState, InteractionOption } from '@/core/ai/NpcInteractionEngine';
import type { NpcReaction } from '@/core/ai/NpcReactions';

export const useInteractionStore = defineStore('interaction', () => {
  const active = ref(false);
  const state = ref<InteractionState | null>(null);
  const npcInfo = ref<{
    name: string; profession: string; personality: string[];
    health: number; mood: number; relation: number; relationLevel: string;
  } | null>(null);
  const lastResult = ref<{
    narrative: string;
    stageDirection?: string;
    playerChanges: string[];
    relationChange: number;
    gainedTag?: string;
    ended: boolean;
    npcReaction?: NpcReaction;
    actionType?: string;
    // RichPerformance 数据
    richPerformance?: import('@/core/ai/NpcInteractionEngine').RichPerformance;
  } | null>(null);

  /** 安全拷贝 InteractionState，避免 Vue 响应式代理 Set 的问题 */
  function safeCopyState(s: InteractionState): InteractionState {
    return {
      ...s,
      usedOptionIds: s.usedOptionIds instanceof Set
        ? new Set(s.usedOptionIds)
        : new Set<string>(),
    };
  }

  function startInteraction(npcId: number) {
    const gameStore = useGameStore();
    if (!gameStore.engine) return;

    const result = gameStore.engine.startNpcInteraction(npcId);
    if (!result) return;

    state.value = safeCopyState(result);
    refreshNpcInfo(npcId);

    lastResult.value = null;
    active.value = true;
    gameStore.setGameState('interacting');
  }

  function refreshNpcInfo(npcId: number) {
    const gameStore = useGameStore();
    if (!gameStore.engine) return;

    const npcData = gameStore.engine.interaction.getNpcInfo(npcId);
    const playerId = gameStore.engine.getPlayerId();
    const relation = playerId
      ? gameStore.engine.getPlayerNpcRelation(npcId)
      : 0;

    npcInfo.value = npcData ? {
      ...npcData,
      relation,
      relationLevel: RelationSystem.getRelationLevel(relation),
    } : null;
  }

  function resolveOption(optionId: string) {
    const gameStore = useGameStore();
    const playerStore = usePlayerStore();
    if (!gameStore.engine) return;

    const result = gameStore.engine.resolveInteractionOption(optionId);
    if (!result) return;

    // 记录到日志
    gameStore.addLog(result.narrative);
    if (result.stageDirection) {
      gameStore.addLog(`  【${result.stageDirection}】`);
    }
    if (result.npcReaction) {
      gameStore.addLog(`  ${result.npcReaction.text}`);
    }

    // 同步玩家状态
    playerStore.syncFromEngine();

    // 交互已结束（告别或NPC不愿继续）
    if (result.nextAct === '__end__' || !result.npcReaction?.continueDialogue) {
      lastResult.value = {
        narrative: result.narrative,
        stageDirection: result.stageDirection,
        playerChanges: result.playerChanges,
        relationChange: result.relationChange,
        gainedTag: result.gainedTag,
        ended: true,
        npcReaction: result.npcReaction,
        actionType: result.actionType,
      };
      // 延迟关闭，让玩家看到结果
      setTimeout(() => {
        endInteraction();
      }, 1500);
      return;
    }

    // NPC继续对话：刷新交互状态
    const currentState = gameStore.engine.interaction.getState();
    if (currentState) {
      state.value = safeCopyState(currentState);

      // 刷新动态选项（从引擎获取环境信息）
      let refreshedOptions: InteractionOption[] | null = null;
      if (gameStore.engine) {
        const pid = gameStore.engine.getPlayerId();
        if (pid !== null) {
          const pos = gameStore.engine.em.getComponent(pid, 'Position');
          refreshedOptions = gameStore.engine.interaction.refreshOptions({
            locationId: pos?.locationId ?? 'street',
            weather: gameStore.engine.weather.get(),
            season: gameStore.engine.time.getSeason(),
            day: gameStore.engine.time.getDay(),
          });
        }
      }
      if (refreshedOptions) {
        state.value = { ...state.value!, options: refreshedOptions };
      }
    }

    // 显示结果（但交互不关闭）
    lastResult.value = {
      narrative: result.narrative,
      stageDirection: result.stageDirection,
      playerChanges: result.playerChanges,
      relationChange: result.relationChange,
      gainedTag: result.gainedTag,
      ended: false,
      npcReaction: result.npcReaction,
      actionType: result.actionType,
      richPerformance: result.richPerformance,
    };

    // 刷新NPC信息（好感度可能变了）
    const npcId = currentState?.npcId;
    if (npcId !== undefined) {
      refreshNpcInfo(npcId);
    }
  }

  function endInteraction() {
    const gameStore = useGameStore();
    gameStore.engine?.interaction.endInteraction();
    active.value = false;
    state.value = null;
    npcInfo.value = null;
    lastResult.value = null;
    gameStore.setGameState('playing');
  }

  return { active, state, npcInfo, lastResult, startInteraction, resolveOption, endInteraction };
});
