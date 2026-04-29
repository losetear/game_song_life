import { ActionRegistry, type GameAction, type ActionContext } from './ActionRegistry';

export interface DecisionContext {
  name: string;
  profession: string;
  personality: string[];
  copper: number;
  hunger: number;
  fatigue: number;
  health: number;
  mood: number;
  locationId: string;
  weather: string;
  season: string;
  day: number;
  recentActions: string[];
  narrativeTags: string[];
}

export interface DecisionResult {
  actionId: string;
  actionName: string;
  category: string;
  narrative: string;
  effects: Record<string, number>;
  cost: Record<string, number>;
}

/**
 * 效用评分AI引擎
 * 参考 Sims 4 风格：对每个可用行动打分，取最高分
 * score = Σ(需求改善量 × 紧迫度) × 性格修正 × 重复惩罚
 */
export class DecisionEngine {
  constructor(private actionRegistry: ActionRegistry) {}

  /** 紧迫度曲线：需求越低越紧迫 */
  private urgency(value: number): number {
    if (value >= 95) return 0.05;
    if (value >= 80) return 0.15;
    if (value >= 60) return 0.4;
    if (value >= 40) return 0.8;
    if (value >= 25) return 1.5;
    if (value >= 10) return 3.0;
    return 5.0; // 极度紧急
  }

  /** 性格对行动类别的偏好修正 */
  private personalityBias(personality: string[], category: string): number {
    let bonus = 1.0;
    if (category === 'social' && personality.includes('健谈')) bonus *= 1.5;
    if (category === 'social' && personality.includes('沉默')) bonus *= 0.5;
    if (category === 'work' && personality.includes('勤劳')) bonus *= 1.4;
    if (category === 'work' && personality.includes('懒惰')) bonus *= 0.6;
    if (category === 'work' && personality.includes('精明')) bonus *= 1.3;
    if (category === 'leisure' && personality.includes('乐观')) bonus *= 1.3;
    if (category === 'survival' && personality.includes('坚韧')) bonus *= 0.8;
    return bonus;
  }

  /** 重复惩罚：最近做过同样的行动降低分数 */
  private repeatPenalty(actionId: string, recentActions: string[]): number {
    let count = 0;
    for (const a of recentActions) {
      if (a === actionId) count++;
    }
    return Math.pow(0.6, count);
  }

  decide(ctx: DecisionContext): DecisionResult {
    const available = this.actionRegistry.getAvailable({
      copper: ctx.copper,
      health: ctx.health,
      hunger: ctx.hunger,
      locationId: ctx.locationId,
      profession: ctx.profession,
      weather: ctx.weather,
      season: ctx.season,
    });

    if (available.length === 0) {
      // 兜底：闲逛
      return {
        actionId: 'idle',
        actionName: '发呆',
        category: 'leisure',
        narrative: `${ctx.name}无所事事，站在原地发了一会儿呆。`,
        effects: {},
        cost: {},
      };
    }

    let bestAction: GameAction | null = null;
    let bestScore = -Infinity;

    for (const action of available) {
      let score = 0;

      // 需求改善 × 紧迫度
      if (action.effects.hunger) {
        score += action.effects.hunger * this.urgency(ctx.hunger);
      }
      if (action.effects.fatigue) {
        score += action.effects.fatigue * this.urgency(ctx.fatigue);
      }
      if (action.effects.health) {
        score += action.effects.health * this.urgency(ctx.health) * 1.5; // 健康更优先
      }
      if (action.effects.mood) {
        score += action.effects.mood * this.urgency(ctx.mood);
      }

      // 赚钱加成（铜钱为正效果时）
      if (action.effects.copper && action.effects.copper > 0) {
        score += action.effects.copper * 0.3;
      }

      // 性格修正
      score *= this.personalityBias(ctx.personality, action.category);

      // 重复惩罚
      score *= this.repeatPenalty(action.id, ctx.recentActions);

      // 疲劳成本惩罚
      if (action.cost.fatigue && ctx.fatigue < 30) {
        score *= 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    if (!bestAction) {
      bestAction = available[0]!;
    }

    const actCtx: ActionContext = {
      name: ctx.name,
      profession: ctx.profession,
      locationId: ctx.locationId,
      weather: ctx.weather,
      season: ctx.season,
      day: ctx.day,
    };

    return {
      actionId: bestAction.id,
      actionName: bestAction.name,
      category: bestAction.category,
      narrative: bestAction.narrative(actCtx),
      effects: bestAction.effects,
      cost: {
        ...(bestAction.cost.copper ? { copper: bestAction.cost.copper } : {}),
        ...(bestAction.cost.fatigue ? { fatigue: bestAction.cost.fatigue } : {}),
      },
    };
  }
}
