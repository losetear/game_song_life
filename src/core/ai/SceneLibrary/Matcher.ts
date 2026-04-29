import type { BranchEvent, SceneCondition, EventChoice } from './types';
import type { EntityManager } from '../../ecs/EntityManager';
import { EntityType } from '../../ecs/types';
import type { SeededRandom } from '../../utils/random';

export interface MatchContext {
  playerId: number;
  em: EntityManager;
  locationId: string;
  weather: string;
  season: string;
  day: number;
  copper: number;
  health: number;
  hunger: number;
  mood: number;
  fatigue: number;
  narrativeTags: string[];
  usedEventIds: string[];
  rng: SeededRandom;
}

function matchesCondition(cond: SceneCondition, ctx: MatchContext): boolean {
  if (cond.actorMinCopper !== undefined && ctx.copper < cond.actorMinCopper) return false;
  if (cond.actorMaxCopper !== undefined && ctx.copper > cond.actorMaxCopper) return false;
  if (cond.actorMinHealth !== undefined && ctx.health < cond.actorMinHealth) return false;
  if (cond.actorMinHunger !== undefined && ctx.hunger < cond.actorMinHunger) return false;
  if (cond.actorMaxMood !== undefined && ctx.mood > cond.actorMaxMood) return false;

  if (cond.location && !cond.location.includes(ctx.locationId)) return false;
  if (cond.weather && !cond.weather.includes(ctx.weather)) return false;
  if (cond.season && !cond.season.includes(ctx.season)) return false;
  if (cond.dayRange) {
    const [min, max] = cond.dayRange;
    if (ctx.day < min || ctx.day > max) return false;
  }

  if (cond.requiredNarrativeTags) {
    for (const tag of cond.requiredNarrativeTags) {
      if (!ctx.narrativeTags.includes(tag)) return false;
    }
  }
  if (cond.forbiddenNarrativeTags) {
    for (const tag of cond.forbiddenNarrativeTags) {
      if (ctx.narrativeTags.includes(tag)) return false;
    }
  }
  if (cond.requiredAnyNarrativeTags) {
    const hasAny = cond.requiredAnyNarrativeTags.some(
      (tag) => ctx.narrativeTags.includes(tag),
    );
    if (!hasAny) return false;
  }

  if (cond.targetRequired && cond.targetProfession) {
    let found = false;
    for (const npcId of ctx.em.getEntitiesByType(EntityType.NPC)) {
      const pos = ctx.em.getComponent(npcId, 'Position');
      const identity = ctx.em.getComponent(npcId, 'Identity');
      if (pos && identity && pos.locationId === ctx.locationId) {
        if (cond.targetProfession.includes(identity.profession)) {
          found = true;
          break;
        }
      }
    }
    if (!found) return false;
  }

  return true;
}

/** 从事件池中匹配最合适的事件 */
export function matchEvent(
  events: BranchEvent[],
  ctx: MatchContext,
): BranchEvent | null {
  let bestEvent: BranchEvent | null = null;
  let bestScore = -Infinity;

  for (const event of events) {
    if (ctx.usedEventIds.includes(event.id)) continue;
    if (!matchesCondition(event.conditions, ctx)) continue;

    let score = event.weight;
    if (event.priority) score += event.priority * 0.5;

    const weightBonus: Record<string, number> = {
      flavor: 0, minor: 2, major: 5, milestone: 10,
    };
    if (event.narrativeWeight) {
      score += weightBonus[event.narrativeWeight] ?? 0;
    }

    score += ctx.rng.next() * 2;

    if (score > bestScore) {
      bestScore = score;
      bestEvent = event;
    }
  }

  return bestEvent;
}

/** 检查选项条件是否满足 */
export function isChoiceAvailable(
  choice: EventChoice,
  ctx: { copper: number; health: number; hunger: number; mood: number; fatigue: number },
): boolean {
  if (!choice.condition) return true;
  const { field, operator, value } = choice.condition;
  const fieldValue = ctx[field];
  return operator === 'gte' ? fieldValue >= value : fieldValue <= value;
}
