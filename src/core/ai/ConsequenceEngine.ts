import type { EntityManager } from '../ecs/EntityManager';
import { clamp } from '../utils/clamp';
import type { InteractionContext, RichPerformance } from './NpcInteractionEngine';
import { RelationSystem } from '../world/RelationSystem';
import type { NpcReaction } from './NpcReactions';

/** 后果定义 */
export interface InteractionConsequence {
  narrative: (ctx: InteractionContext) => string;
  stageDirection?: (ctx: InteractionContext) => string;

  // RichPerformance 多阶段演出数据（可选）
  richPerformance?: (ctx: InteractionContext) => RichPerformance;

  // 玩家自身
  playerVital?: Partial<Record<'hunger' | 'fatigue' | 'health' | 'mood', number>>;
  playerCopper?: number;
  playerGainTag?: string;
  playerLoseTag?: string;

  // NPC自身
  npcVital?: Partial<Record<'hunger' | 'fatigue' | 'health' | 'mood', number>>;
  npcCopper?: number;
  npcGainTag?: string;

  // 关系
  relationChange?: number;

  // 后续幕（null=结束）
  nextAct?: string;
}

/** 后果应用结果 */
export interface ConsequenceResult {
  narrative: string;
  stageDirection?: string;
  playerChanges: string[];
  npcChanges: string[];
  relationChange: number;
  gainedTag?: string;
  nextAct?: string;
  npcReaction?: NpcReaction;
  actionType?: string;
  // RichPerformance 数据
  richPerformance?: RichPerformance;
}

export class ConsequenceEngine {
  apply(
    consequence: InteractionConsequence,
    ctx: InteractionContext,
    em: EntityManager,
  ): ConsequenceResult {
    const result: ConsequenceResult = {
      narrative: consequence.narrative(ctx),
      playerChanges: [],
      npcChanges: [],
      relationChange: consequence.relationChange ?? 0,
      gainedTag: consequence.playerGainTag,
      nextAct: consequence.nextAct,
    };

    if (consequence.stageDirection) {
      result.stageDirection = consequence.stageDirection(ctx);
    }

    // 处理 RichPerformance 数据
    if (consequence.richPerformance) {
      result.richPerformance = consequence.richPerformance(ctx);
    }

    // 应用玩家效果
    const pVital = em.getComponent(ctx.player.id, 'Vital');
    const pWallet = em.getComponent(ctx.player.id, 'Wallet');
    const pMemory = em.getComponent(ctx.player.id, 'Memory');

    if (pVital && consequence.playerVital) {
      for (const [key, val] of Object.entries(consequence.playerVital)) {
        if (val !== undefined) {
          const k = key as keyof typeof pVital;
          (pVital as any)[k] = clamp((pVital as any)[k] + val, 0, 100);
          if (val > 0) result.playerChanges.push(`${key === 'hunger' ? '饱食' : key === 'fatigue' ? '精力' : key === 'health' ? '健康' : '心情'}+${val}`);
          else result.playerChanges.push(`${key === 'hunger' ? '饱食' : key === 'fatigue' ? '精力' : key === 'health' ? '健康' : '心情'}${val}`);
        }
      }
    }
    if (pWallet && consequence.playerCopper) {
      pWallet.copper = Math.max(0, pWallet.copper + consequence.playerCopper);
      if (consequence.playerCopper > 0) result.playerChanges.push(`铜钱+${consequence.playerCopper}`);
      else result.playerChanges.push(`铜钱${consequence.playerCopper}`);
    }
    if (pMemory) {
      if (consequence.playerGainTag && !pMemory.narrativeTags.includes(consequence.playerGainTag)) {
        pMemory.narrativeTags.push(consequence.playerGainTag);
        result.gainedTag = consequence.playerGainTag;
      }
      if (consequence.playerLoseTag) {
        pMemory.narrativeTags = pMemory.narrativeTags.filter((t) => t !== consequence.playerLoseTag);
      }
    }

    // 应用NPC效果
    const nVital = em.getComponent(ctx.npc.id, 'Vital');
    const nWallet = em.getComponent(ctx.npc.id, 'Wallet');
    const nMemory = em.getComponent(ctx.npc.id, 'Memory');

    if (nVital && consequence.npcVital) {
      for (const [key, val] of Object.entries(consequence.npcVital)) {
        if (val !== undefined) {
          const k = key as keyof typeof nVital;
          (nVital as any)[k] = clamp((nVital as any)[k] + val, 0, 100);
        }
      }
    }
    if (nWallet && consequence.npcCopper) {
      nWallet.copper = Math.max(0, nWallet.copper + consequence.npcCopper);
    }
    if (nMemory && consequence.npcGainTag) {
      if (!nMemory.narrativeTags.includes(consequence.npcGainTag)) {
        nMemory.narrativeTags.push(consequence.npcGainTag);
      }
    }

    // 应用好感变化
    if (consequence.relationChange) {
      const rs = new RelationSystem();
      rs.changeRelation(em, ctx.player.id, ctx.npc.id, consequence.relationChange);
      rs.changeRelation(em, ctx.npc.id, ctx.player.id, Math.round(consequence.relationChange * 0.8));
    }

    // 记录事件到双方Memory
    if (pMemory) {
      pMemory.recentEvents.push({
        day: ctx.environment.day,
        text: result.narrative,
      });
      if (pMemory.recentEvents.length > 10) pMemory.recentEvents.shift();
    }
    if (nMemory) {
      nMemory.recentEvents.push({
        day: ctx.environment.day,
        text: result.narrative,
      });
      if (nMemory.recentEvents.length > 10) nMemory.recentEvents.shift();
    }

    return result;
  }
}
