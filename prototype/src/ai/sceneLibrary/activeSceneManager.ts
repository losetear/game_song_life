// === 活跃场景管理器 ===
//
// 管理所有进行中的多步演出（L0PhaseScene）。
// NPC-NPC 演出全自动推进（每 tick 一阶段），无需等待玩家。

import type {
  L0PhaseScene,
  L0SceneRuntimeState,
  L0SceneChoice,
  L0SceneConsequence,
} from './types';
import { chooseBestForNPC, type NPCChoiceContext } from './npcChoiceAI';
import { resolveSceneV2, scoreToTier } from './resolver';
import { formatNarrative } from './narrativeFormatter';

let instanceCounter = 0;

export interface PhaseAdvanceResult {
  /** 推进后的状态 */
  state: L0SceneRuntimeState;
  /** 本阶段的叙事 */
  narrative: string;
  /** 本阶段的即时效果（可立即应用） */
  effects?: Record<string, number>;
  /** 目标效果 */
  targetEffects?: Record<string, number>;
  /** 关系变化 */
  relationChange?: number;
  /** 演出是否已结束 */
  finished: boolean;
  /** 结束叙事 */
  endingNarrative?: string;
  /** 结算 tier（如果走了 resolution） */
  tier?: string;
}

export interface TickProcessResult {
  /** 本 tick 自动推进的演出 */
  autoResolved: {
    npcEntityId: number;
    instanceId: string;
    result: PhaseAdvanceResult;
  }[];
  /** 已结束的演出（应用累积效果） */
  finished: {
    npcEntityId: number;
    instanceId: string;
    pendingEffects: Record<string, number>;
    pendingTargetEffects: Record<string, number>;
    pendingRelationChange: number;
    endingNarrative?: string;
  }[];
}

export class ActiveSceneManager {
  /** 活跃演出，以行动者 NPC entity ID 为键 */
  private activeScenes = new Map<number, L0SceneRuntimeState>();
  /** 通过 instanceId 快速查找 */
  private byInstanceId = new Map<string, L0SceneRuntimeState>();

  /** NPC 是否有活跃演出 */
  hasActiveScene(npcEntityId: number): boolean {
    return this.activeScenes.has(npcEntityId);
  }

  /** 获取 NPC 的活跃演出 */
  getActiveScene(npcEntityId: number): L0SceneRuntimeState | null {
    return this.activeScenes.get(npcEntityId) ?? null;
  }

  /** 通过 instanceId 查找 */
  getByInstanceId(instanceId: string): L0SceneRuntimeState | null {
    return this.byInstanceId.get(instanceId) ?? null;
  }

  /** 获取所有活跃演出 */
  getAllActive(): L0SceneRuntimeState[] {
    return Array.from(this.activeScenes.values());
  }

  /** 获取玩家可见的演出（同格） */
  getVisibleScenes(playerGridId: string, getEntityGrid: (id: number) => string | null): L0SceneRuntimeState[] {
    const visible: L0SceneRuntimeState[] = [];
    for (const state of this.activeScenes.values()) {
      const grid = getEntityGrid(state.actorEntityId);
      if (grid === playerGridId) {
        visible.push(state);
      }
    }
    return visible;
  }

  /** 开始一个新的多步演出 */
  startScene(
    scene: L0PhaseScene,
    actorEntityId: number,
    actorName: string,
    targetEntityId?: number,
    targetName?: string,
    tick?: number,
  ): L0SceneRuntimeState {
    const instanceId = `l0ms_${++instanceCounter}_${Date.now()}`;
    const state: L0SceneRuntimeState = {
      instanceId,
      scene,
      actorEntityId,
      actorName,
      targetEntityId,
      targetName,
      currentPhase: scene.entryPhase,
      history: [],
      startTick: tick ?? 0,
      pendingEffects: {},
      pendingTargetEffects: {},
      pendingRelationChange: 0,
      phasesCompleted: 0,
    };
    this.activeScenes.set(actorEntityId, state);
    this.byInstanceId.set(instanceId, state);
    return state;
  }

  /**
   * 推进一个 NPC 的活跃演出（NPC 自动选择）。
   * 每 tick 最多推进一个阶段。
   */
  advanceScene(
    npcEntityId: number,
    npcContext: NPCChoiceContext,
    tick: number,
    actorStats?: Record<string, number>,
    targetStats?: Record<string, number>,
  ): PhaseAdvanceResult | null {
    const state = this.activeScenes.get(npcEntityId);
    if (!state) return null;

    const phase = state.scene.phases[state.currentPhase];
    if (!phase) {
      // 阶段不存在，演出结束
      return this.finishScene(npcEntityId);
    }

    // 过滤当前阶段的选项，只保留当前 chooser 匹配的
    const availableChoices = phase.choices.filter(c => {
      // 暂时只处理 actor 和 target 的选择
      if (c.chooser === 'actor' || c.chooser === 'target') {
        if (c.condition) {
          // 检查条件
          return this.checkConditionForContext(c.condition, npcContext);
        }
        return true;
      }
      return true;
    });

    // NPC AI 选择
    const choiceId = chooseBestForNPC(availableChoices, npcContext);
    if (!choiceId) {
      // 没有可用选项，跳过此阶段，尝试进入下一阶段或结束
      return this.skipPhase(state, tick);
    }

    const chosen = availableChoices.find(c => c.id === choiceId)!;
    return this.applyChoice(state, chosen, npcContext, tick, actorStats, targetStats);
  }

  /** 应用一个选择 */
  private applyChoice(
    state: L0SceneRuntimeState,
    choice: L0SceneChoice,
    _npcContext: NPCChoiceContext,
    tick: number,
    actorStats?: Record<string, number>,
    targetStats?: Record<string, number>,
  ): PhaseAdvanceResult {
    const consequence = choice.consequence;

    // 记录历史
    state.history.push({
      phaseId: state.currentPhase,
      choiceId: choice.id,
      chooser: choice.chooser,
      tick,
    });

    // 检查是否需要判定
    let effects: Record<string, number> = { ...consequence.immediateEffects };
    let targetEffects = consequence.targetEffects ? { ...consequence.targetEffects } : undefined;
    let relationChange = consequence.relationChange;
    let narrative = '';
    let tier: string | undefined;

    if (consequence.resolution) {
      // 需要判定
      const resolveResult = resolveSceneV2(
        consequence.resolution,
        actorStats || {},
        targetStats || {},
        {}, // resolveContext
      );
      tier = scoreToTier(resolveResult.score);

      if (consequence.tieredResults && tier && consequence.tieredResults[tier]) {
        const tierResult = consequence.tieredResults[tier];
        narrative = tierResult.narrative;
        effects = { ...effects, ...tierResult.effects };
      }
    }

    // 累积效果
    if (effects) {
      for (const [k, v] of Object.entries(effects)) {
        state.pendingEffects[k] = (state.pendingEffects[k] || 0) + v;
      }
    }
    if (targetEffects) {
      for (const [k, v] of Object.entries(targetEffects)) {
        state.pendingTargetEffects[k] = (state.pendingTargetEffects[k] || 0) + v;
      }
    }
    if (relationChange) {
      state.pendingRelationChange += relationChange;
    }

    state.phasesCompleted++;

    // 推进到下一阶段或结束
    if (consequence.nextPhase === null) {
      // 演出结束
      const endingNarrative = consequence.endingNarrative || narrative || '';
      return this.finishSceneWithNarrative(state, endingNarrative, effects, targetEffects, relationChange, tier);
    }

    // 推进到下一阶段
    state.currentPhase = consequence.nextPhase;
    const nextPhase = state.scene.phases[consequence.nextPhase];

    return {
      state,
      narrative: narrative || (nextPhase ? formatNarrative(nextPhase.narrative, {
        npcName: state.actorName,
        targetName: state.targetName || '',
      }) : ''),
      effects,
      targetEffects,
      relationChange,
      finished: false,
      tier: tier as any,
    };
  }

  /** 跳过当前阶段（无可用选项时） */
  private skipPhase(state: L0SceneRuntimeState, tick: number): PhaseAdvanceResult {
    const phase = state.scene.phases[state.currentPhase];
    // 尝试第一个选项的 nextPhase
    if (phase && phase.choices.length > 0) {
      const firstConsequence = phase.choices[0].consequence;
      if (firstConsequence.nextPhase === null) {
        return this.finishSceneWithNarrative(state, '', {}, undefined, undefined);
      }
      state.currentPhase = firstConsequence.nextPhase;
      const nextPhase = state.scene.phases[firstConsequence.nextPhase];
      return {
        state,
        narrative: nextPhase ? formatNarrative(nextPhase.narrative, {
          npcName: state.actorName,
          targetName: state.targetName || '',
        }) : '',
        finished: false,
      };
    }
    // 没有任何选项，结束
    return this.finishScene(state.actorEntityId);
  }

  /** 结束演出，返回累积效果 */
  private finishScene(npcEntityId: number): PhaseAdvanceResult {
    const state = this.activeScenes.get(npcEntityId);
    if (!state) return { state: null as any, narrative: '', finished: true };

    const result: PhaseAdvanceResult = {
      state,
      narrative: '',
      finished: true,
      endingNarrative: '',
      effects: { ...state.pendingEffects },
      targetEffects: { ...state.pendingTargetEffects },
      relationChange: state.pendingRelationChange,
    };

    this.activeScenes.delete(npcEntityId);
    this.byInstanceId.delete(state.instanceId);
    return result;
  }

  private finishSceneWithNarrative(
    state: L0SceneRuntimeState,
    endingNarrative: string,
    effects?: Record<string, number>,
    targetEffects?: Record<string, number>,
    relationChange?: number,
    tier?: string,
  ): PhaseAdvanceResult {
    const result: PhaseAdvanceResult = {
      state,
      narrative: endingNarrative,
      finished: true,
      endingNarrative,
      effects: effects || { ...state.pendingEffects },
      targetEffects: targetEffects || { ...state.pendingTargetEffects },
      relationChange: relationChange ?? state.pendingRelationChange,
      tier: tier as any,
    };

    this.activeScenes.delete(state.actorEntityId);
    this.byInstanceId.delete(state.instanceId);
    return result;
  }

  /**
   * 处理本 tick 所有活跃演出。
   * NPC-NPC 演出全自动推进。
   */
  processTick(
    tick: number,
    getNPCContext: (entityId: number) => NPCChoiceContext | null,
    getActorStats: (entityId: number) => Record<string, number>,
    getTargetStats: (entityId: number) => Record<string, number>,
  ): TickProcessResult {
    const result: TickProcessResult = { autoResolved: [], finished: [] };

    // 复制 key 列表避免迭代中修改
    const entityIds = Array.from(this.activeScenes.keys());

    for (const entityId of entityIds) {
      const ctx = getNPCContext(entityId);
      if (!ctx) continue;

      const actorStats = getActorStats(entityId);
      const state = this.activeScenes.get(entityId);
      if (!state) continue;

      const targetStats = state.targetEntityId
        ? getTargetStats(state.targetEntityId)
        : {};

      const advanceResult = this.advanceScene(entityId, ctx, tick, actorStats, targetStats);
      if (!advanceResult) continue;

      result.autoResolved.push({
        npcEntityId: entityId,
        instanceId: advanceResult.state?.instanceId || state.instanceId,
        result: advanceResult,
      });

      if (advanceResult.finished) {
        result.finished.push({
          npcEntityId: entityId,
          instanceId: state.instanceId,
          pendingEffects: advanceResult.effects || state.pendingEffects,
          pendingTargetEffects: advanceResult.targetEffects || state.pendingTargetEffects,
          pendingRelationChange: advanceResult.relationChange ?? state.pendingRelationChange,
          endingNarrative: advanceResult.endingNarrative,
        });
      }
    }

    return result;
  }

  /** 条件检查（复用 npcChoiceAI 的逻辑） */
  private checkConditionForContext(
    cond: { field: string; operator: string; value: number | string },
    ctx: NPCChoiceContext,
  ): boolean {
    const { field, operator, value } = cond;
    let actual: number | string | string[];

    switch (field) {
      case 'copper': actual = ctx.copper; break;
      case 'health': actual = ctx.needs.health; break;
      case 'hunger': actual = ctx.needs.hunger; break;
      case 'fatigue': actual = ctx.needs.fatigue; break;
      case 'mood': actual = ctx.needs.mood; break;
      case 'safety': actual = ctx.needs.safety; break;
      case 'social': actual = ctx.needs.social; break;
      case 'stress': actual = ctx.stress; break;
      case 'personality': actual = ctx.traits; break;
      case 'greed': actual = ctx.hiddenTraits.greed; break;
      case 'honor': actual = ctx.hiddenTraits.honor; break;
      case 'rationality': actual = ctx.hiddenTraits.rationality; break;
      case 'ambition': actual = ctx.hiddenTraits.ambition; break;
      case 'loyalty': actual = ctx.hiddenTraits.loyalty; break;
      default: return true;
    }

    switch (operator) {
      case 'gte': return (actual as number) >= (value as number);
      case 'lte': return (actual as number) <= (value as number);
      case 'eq': return actual === value;
      case 'includes': return Array.isArray(actual) && actual.includes(value as string);
      case 'notIncludes': return Array.isArray(actual) && !actual.includes(value as string);
      default: return true;
    }
  }
}
