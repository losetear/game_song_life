// === 随机事件调度器 ===
//
// 在场景转换/空闲 tick 时随机插入轻量级事件
// 检查触发条件（天气/时辰/NPC属性/叙事标签），按权重+冷却调度

import {
  RandomEvent, RandomEventTrigger,
  PlayerScene, PlayerSceneState, PlayerSceneChoice,
  PlayerSceneMatchResult, SceneVisualMeta,
  L0ActorContext, NearbyNpcInfo,
} from './types';

// ════════════════════════════════════════
// 随机事件调度器
// ════════════════════════════════════════

export class RandomEventScheduler {
  private events: RandomEvent[] = [];
  /** 事件冷却：eventId → 上次触发的 tick */
  private lastTriggered: Map<string, number> = new Map();
  /** 全局触发间隔：至少隔多少 tick 才能再触发任何随机事件 */
  private minIntervalTicks = 5;
  private lastAnyEventTick = -100;

  /** 注册随机事件池 */
  registerEvents(events: RandomEvent[]): void {
    this.events = events;
  }

  /** 尝试触发一个随机事件（场景转换/空闲 tick 时调用） */
  tryTrigger(
    ctx: L0ActorContext,
    nearbyNpcs: NearbyNpcInfo[],
    playerStats: Record<string, number>,
    tick: number,
    chance: number = 0.15, // 默认 15% 概率检查
  ): PlayerSceneMatchResult | null {
    // 概率门槛
    if (Math.random() > chance) return null;

    // 全局间隔检查
    if (tick - this.lastAnyEventTick < this.minIntervalTicks) return null;

    // 筛选满足条件的候选事件
    const candidates = this.events.filter(evt => {
      // 冷却检查
      const lastTick = this.lastTriggered.get(evt.id);
      if (lastTick !== undefined && tick - lastTick < evt.cooldownTicks) return false;

      // 触发条件检查
      return this.matchesTrigger(evt.trigger, ctx);
    });

    if (candidates.length === 0) return null;

    // 按权重加权随机选择
    const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen: RandomEvent | null = null;
    for (const evt of candidates) {
      roll -= evt.weight;
      if (roll <= 0) {
        chosen = evt;
        break;
      }
    }
    if (!chosen) chosen = candidates[candidates.length - 1];

    // 标记冷却
    this.lastTriggered.set(chosen.id, tick);
    this.lastAnyEventTick = tick;

    // 构建 PlayerSceneMatchResult
    const scene = chosen.scene;
    const state: PlayerSceneState = {
      sceneId: scene.id,
      currentPhase: scene.entryPhase,
      participantNpcIds: [],
      history: [],
      startTick: tick,
    };

    const entryPhase = scene.phases[scene.entryPhase];
    const availableChoices = this.filterChoices(entryPhase.choices, playerStats);

    return {
      scene,
      state,
      openingNarrative: scene.openingNarrative + '\n\n' + entryPhase.narrative,
      choices: availableChoices,
      visual: entryPhase.visual || scene.openingVisual,
    };
  }

  /** 检查触发条件是否匹配 */
  private matchesTrigger(trigger: RandomEventTrigger, ctx: L0ActorContext): boolean {
    // 时辰
    if (trigger.shichen && trigger.shichen.length > 0) {
      if (!trigger.shichen.includes(ctx.shichen)) return false;
    }
    // 天气
    if (trigger.weather && trigger.weather.length > 0) {
      if (!trigger.weather.includes(ctx.weather)) return false;
    }
    // 季节
    if (trigger.season && trigger.season.length > 0) {
      if (!trigger.season.includes(ctx.season)) return false;
    }
    // 地点
    if (trigger.location && trigger.location.length > 0) {
      if (!trigger.location.includes(ctx.currentGrid)) return false;
    }
    // 铜钱
    if (trigger.minCopper !== undefined && ctx.copper < trigger.minCopper) return false;
    // 健康
    if (trigger.maxHealth !== undefined && ctx.health > trigger.maxHealth) return false;
    // 叙事标签（OR匹配）
    if (trigger.requiredAnyTags && trigger.requiredAnyTags.length > 0) {
      const tags = ctx.narrativeTags || [];
      if (!trigger.requiredAnyTags.some(t => tags.includes(t))) return false;
    }
    // 禁止标签
    if (trigger.forbiddenTags && trigger.forbiddenTags.length > 0) {
      const tags = ctx.narrativeTags || [];
      if (trigger.forbiddenTags.some(t => tags.includes(t))) return false;
    }

    return true;
  }

  /** 过滤满足条件的选项 */
  private filterChoices(
    choices: PlayerSceneChoice[],
    playerStats: Record<string, number>,
  ): PlayerSceneChoice[] {
    return choices.filter(choice => {
      if (!choice.condition) return true;
      const { field, operator, value } = choice.condition;
      const fieldValue = playerStats[field];
      if (fieldValue === undefined) return false;
      switch (operator) {
        case 'gte': return Number(fieldValue) >= Number(value);
        case 'lte': return Number(fieldValue) <= Number(value);
        case 'eq': return Number(fieldValue) === Number(value);
        case 'includes':
          if (Array.isArray(fieldValue)) return fieldValue.includes(value);
          return String(fieldValue).includes(String(value));
        case 'notIncludes':
          if (Array.isArray(fieldValue)) return !fieldValue.includes(value);
          return !String(fieldValue).includes(String(value));
        default: return true;
      }
    });
  }

  /** 重置所有冷却（新游戏时调用） */
  resetCooldowns(): void {
    this.lastTriggered.clear();
    this.lastAnyEventTick = -100;
  }
}
