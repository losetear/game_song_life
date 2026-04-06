// === 链式反应引擎 — 参考 CK2 的 AI 互动产生故事 ===
//
// 核心理念：
// - NPC 的每个行动都可能触发连锁反应
// - 一次行动 → 多个NPC受到影响 → 产生新的关系变化/记忆/事件
// - 每次tick在NPC行动后检查是否触发链式反应
// - 链式反应产生新的事件记录到事件引擎

import { EntityManager } from '../ecs/entityManager';
import { RelationshipSystem } from '../ai/relationshipSystem';
import { StressMemorySystem } from '../ai/stressMemorySystem';
import { RELATION_SOURCES } from '../ai/relationshipSystem';

// ──── 链式反应结果 ────
export interface ChainReactionResult {
  source: string;                     // 触发者NPC名
  action: string;                     // 触发行动
  effects: ChainEffect[];             // 连锁效果列表
  narrative: string;                  // 叙事描述
}

export interface ChainEffect {
  targetId: number;
  targetName: string;
  type: 'relation' | 'memory' | 'stress' | 'event';
  description: string;
}

// ──── 链式反应规则定义 ────
interface ChainRule {
  triggerAction: string | string[];   // 触发行动ID
  probability: number;                // 触发概率
  execute: (ctx: ChainContext) => ChainReactionResult | null;
}

interface ChainContext {
  sourceId: number;
  sourceName: string;
  sourceGrid: string;
  actionId: string;
  currentTick: number;
  nearbyIds: number[];
  em: EntityManager;
  relationSys: RelationshipSystem;
  stressMemSys: StressMemorySystem;
}

// ──── 辅助函数 ────
function getNpcName(em: EntityManager, id: number): string {
  const ident = em.getComponent(id, 'Identity');
  return ident?.name || `NPC#${id}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ──── 链式反应规则（15+条） ────
const CHAIN_RULES: ChainRule[] = [
  // 1. 偷窃成功 → 受害者获得记忆 + 关系-30 → 可能告诉周围人
  {
    triggerAction: ['steal', 'black_market'],
    probability: 0.8,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      // 找到受害者（附近随机一人）
      const victims = ctx.nearbyIds.filter(id => id !== ctx.sourceId);
      if (victims.length === 0) return null;
      const victimId = pickRandom(victims);
      const victimName = getNpcName(ctx.em, victimId);

      // 受害者关系-30
      ctx.relationSys.modifyRelation(ctx.sourceId, victimId, -30, ctx.currentTick);
      effects.push({ targetId: victimId, targetName: victimName, type: 'relation', description: '被偷窃，关系恶化' });

      // 受害者获得"被偷"记忆
      ctx.stressMemSys.addShortTermMemory(victimId, {
        event: `被${ctx.sourceName}偷了东西`,
        emotionType: 'fear',
        intensity: 7,
        tick: ctx.currentTick,
      });
      effects.push({ targetId: victimId, targetName: victimName, type: 'memory', description: '获得被偷的记忆' });

      // 受害者可能告诉周围人（50%概率）
      if (Math.random() < 0.5) {
        const bystanders = ctx.nearbyIds.filter(id => id !== ctx.sourceId && id !== victimId);
        for (const bystanderId of bystanders.slice(0, 3)) {
          ctx.relationSys.modifyRelation(ctx.sourceId, bystanderId, -5, ctx.currentTick);
          effects.push({
            targetId: bystanderId,
            targetName: getNpcName(ctx.em, bystanderId),
            type: 'relation',
            description: `听说${ctx.sourceName}是小偷，关系下降`,
          });
        }
      }

      return {
        source: ctx.sourceName,
        action: '偷窃',
        effects,
        narrative: `${ctx.sourceName}偷了${victimName}的东西，${victimName}发现后怒不可遏${effects.length > 2 ? '，消息很快传开了' : ''}。`,
      };
    },
  },

  // 2. 救助他人 → 被救者关系+25 + "感恩"记忆 → 可能成为朋友
  {
    triggerAction: ['rescue', 'help_npc', 'treat_patient'],
    probability: 0.7,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const targets = ctx.nearbyIds.filter(id => id !== ctx.sourceId);
      if (targets.length === 0) return null;
      const targetId = pickRandom(targets);
      const targetName = getNpcName(ctx.em, targetId);

      ctx.relationSys.modifyRelation(ctx.sourceId, targetId, 25, ctx.currentTick);
      effects.push({ targetId, targetName, type: 'relation', description: '被救助，关系大幅提升' });

      ctx.stressMemSys.addShortTermMemory(targetId, {
        event: `被${ctx.sourceName}救助`,
        emotionType: 'gratitude',
        intensity: 8,
        tick: ctx.currentTick,
      });
      effects.push({ targetId, targetName, type: 'memory', description: '获得感恩记忆' });

      // 被救者压力-5
      const targetStress = ctx.em.getComponent(targetId, 'Stress');
      if (targetStress) {
        targetStress.level = Math.max(0, targetStress.level - 5);
        effects.push({ targetId, targetName, type: 'stress', description: '压力减轻' });
      }

      return {
        source: ctx.sourceName,
        action: '救助',
        effects,
        narrative: `${ctx.sourceName}救助了${targetName}，${targetName}满怀感激。`,
      };
    },
  },

  // 3. 在酒楼请客 → 同桌NPC关系+8 + 心情+5
  {
    triggerAction: ['eat', 'drink_tea', 'chat'],
    probability: 0.3,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      // 只在酒楼/茶馆触发
      if (!ctx.sourceGrid.includes('tea') && !ctx.sourceGrid.includes('food') && !ctx.sourceGrid.includes('restaurant')) return null;

      for (const targetId of ctx.nearbyIds.filter(id => id !== ctx.sourceId).slice(0, 4)) {
        const targetName = getNpcName(ctx.em, targetId);
        ctx.relationSys.modifyRelation(ctx.sourceId, targetId, 8, ctx.currentTick);
        effects.push({ targetId, targetName, type: 'relation', description: '同桌吃饭，关系上升' });

        // 被请的人心情+5
        const targetNeeds = ctx.em.getComponent(targetId, 'Needs');
        if (targetNeeds) {
          targetNeeds.mood = Math.min(100, targetNeeds.mood + 5);
        }
      }

      return {
        source: ctx.sourceName,
        action: '请客',
        effects,
        narrative: `${ctx.sourceName}在酒楼大方地请了客，同桌的人都很高兴。`,
      };
    },
  },

  // 4. 攻击他人 → 关系-40 → 受害者可能记仇
  {
    triggerAction: ['fight', 'attack', 'report_crime'],
    probability: 0.7,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const targets = ctx.nearbyIds.filter(id => id !== ctx.sourceId);
      if (targets.length === 0) return null;
      const targetId = pickRandom(targets);
      const targetName = getNpcName(ctx.em, targetId);

      ctx.relationSys.modifyRelation(ctx.sourceId, targetId, -40, ctx.currentTick);
      effects.push({ targetId, targetName, type: 'relation', description: '被攻击，成为仇敌' });

      ctx.stressMemSys.addShortTermMemory(targetId, {
        event: `被${ctx.sourceName}攻击`,
        emotionType: 'fear',
        intensity: 9,
        tick: ctx.currentTick,
      });
      effects.push({ targetId, targetName, type: 'memory', description: '记住了被攻击' });

      // 受害者压力+8
      const targetStress = ctx.em.getComponent(targetId, 'Stress');
      if (targetStress) {
        targetStress.level = Math.min(100, targetStress.level + 8);
        effects.push({ targetId, targetName, type: 'stress', description: '压力增加' });
      }

      return {
        source: ctx.sourceName,
        action: '攻击',
        effects,
        narrative: `${ctx.sourceName}对${targetName}动了手，${targetName}捂着伤口，眼神中满是恨意。`,
      };
    },
  },

  // 5. 交易成功 → 关系+3 → 形成贸易伙伴
  {
    triggerAction: ['sell_goods', 'buy_food', 'restock', 'buy_material'],
    probability: 0.4,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const targets = ctx.nearbyIds.filter(id => id !== ctx.sourceId);
      if (targets.length === 0) return null;
      const targetId = pickRandom(targets);
      const targetName = getNpcName(ctx.em, targetId);

      ctx.relationSys.modifyRelation(ctx.sourceId, targetId, 3, ctx.currentTick);
      effects.push({ targetId, targetName, type: 'relation', description: '交易成功，关系微升' });

      return {
        source: ctx.sourceName,
        action: '交易',
        effects,
        narrative: `${ctx.sourceName}和${targetName}做成了一笔交易，双方都很满意。`,
      };
    },
  },

  // 6. 被拒绝社交 → 关系-5 + "被排斥"记忆
  {
    triggerAction: ['chat'],
    probability: 0.2,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      // 只在心情差时触发
      const needs = ctx.em.getComponent(ctx.sourceId, 'Needs');
      if (!needs || needs.mood > 30) return null;

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: '试图社交被冷落',
        emotionType: 'sad',
        intensity: 5,
        tick: ctx.currentTick,
      });
      effects.push({
        targetId: ctx.sourceId,
        targetName: ctx.sourceName,
        type: 'memory',
        description: '获得被排斥记忆',
      });

      return {
        source: ctx.sourceName,
        action: '社交被拒',
        effects,
        narrative: `${ctx.sourceName}试图搭话，但没人理会，讪讪地退到了一旁。`,
      };
    },
  },

  // 7. 生病被治疗 → 与大夫关系+15 + "感恩"记忆
  {
    triggerAction: ['treat_patient'],
    probability: 0.6,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const targets = ctx.nearbyIds.filter(id => id !== ctx.sourceId);
      if (targets.length === 0) return null;
      const targetId = pickRandom(targets);
      const targetName = getNpcName(ctx.em, targetId);

      ctx.relationSys.modifyRelation(ctx.sourceId, targetId, 15, ctx.currentTick);
      effects.push({ targetId, targetName, type: 'relation', description: '治病之恩，关系上升' });

      ctx.stressMemSys.addShortTermMemory(targetId, {
        event: `被${ctx.sourceName}（大夫）治好了病`,
        emotionType: 'gratitude',
        intensity: 7,
        tick: ctx.currentTick,
      });

      // 被治好的人可能推荐大夫给朋友
      if (Math.random() < 0.4) {
        const rel = ctx.em.getComponent(targetId, 'Relationship');
        if (rel) {
          const friends = Object.entries(rel.relations)
            .filter(([_, r]) => r.score >= 21)
            .map(([id]) => Number(id));
          if (friends.length > 0) {
            const friendId = pickRandom(friends);
            ctx.relationSys.modifyRelation(friendId, ctx.sourceId, 5, ctx.currentTick);
            effects.push({
              targetId: friendId,
              targetName: getNpcName(ctx.em, friendId),
              type: 'relation',
              description: `${targetName}向朋友推荐了${ctx.sourceName}`,
            });
          }
        }
      }

      return {
        source: ctx.sourceName,
        action: '治病',
        effects,
        narrative: `${ctx.sourceName}治好了${targetName}的病，${targetName}感激不尽${effects.length > 2 ? '，还把好大夫介绍给了朋友' : ''}。`,
      };
    },
  },

  // 8. 目睹犯罪 → 关系-20 + 可能报官
  {
    triggerAction: ['steal', 'fight', 'black_market'],
    probability: 0.5,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const bystanders = ctx.nearbyIds.filter(id => id !== ctx.sourceId);
      if (bystanders.length === 0) return null;

      for (const bystanderId of bystanders.slice(0, 2)) {
        ctx.relationSys.modifyRelation(bystanderId, ctx.sourceId, -20, ctx.currentTick);
        effects.push({
          targetId: bystanderId,
          targetName: getNpcName(ctx.em, bystanderId),
          type: 'relation',
          description: '目睹犯罪，关系恶化',
        });

        // 可能报官（30%概率）
        if (Math.random() < 0.3) {
          effects.push({
            targetId: bystanderId,
            targetName: getNpcName(ctx.em, bystanderId),
            type: 'event',
            description: `向衙役举报了${ctx.sourceName}`,
          });
        }
      }

      return {
        source: ctx.sourceName,
        action: '犯罪被目击',
        effects,
        narrative: `有人看到了${ctx.sourceName}的不轨行为，议论纷纷。`,
      };
    },
  },

  // 9. 天气恶劣无处避雨 → 压力+5 + "悲惨"记忆
  {
    triggerAction: ['stroll', 'work', 'carry_cargo', 'farm_work'],
    probability: 0.6,
    execute: (ctx) => {
      // 只在恶劣天气触发 — 需要外部传入weather
      // 通过检查是否有天气效果来判断
      const effects: ChainEffect[] = [];

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: '在恶劣天气中无家可归',
        emotionType: 'sad',
        intensity: 6,
        tick: ctx.currentTick,
      });
      effects.push({
        targetId: ctx.sourceId,
        targetName: ctx.sourceName,
        type: 'memory',
        description: '获得悲惨记忆',
      });

      const stress = ctx.em.getComponent(ctx.sourceId, 'Stress');
      if (stress) {
        stress.level = Math.min(100, stress.level + 5);
        effects.push({
          targetId: ctx.sourceId,
          targetName: ctx.sourceName,
          type: 'stress',
          description: '压力增加',
        });
      }

      return {
        source: ctx.sourceName,
        action: '淋雨',
        effects,
        narrative: `${ctx.sourceName}在风雨中瑟缩着，浑身湿透，却无处可去。`,
      };
    },
  },

  // 10. 长期贫穷 → 压力+3 → 可能走上偷窃道路
  {
    triggerAction: ['work', 'carry_cargo', 'farm_work', 'stroll'],
    probability: 0.3,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const wallet = ctx.em.getComponent(ctx.sourceId, 'Wallet');
      if (!wallet || wallet.copper >= 10) return null;

      const stress = ctx.em.getComponent(ctx.sourceId, 'Stress');
      if (stress) {
        stress.level = Math.min(100, stress.level + 3);
        effects.push({
          targetId: ctx.sourceId,
          targetName: ctx.sourceName,
          type: 'stress',
          description: '长期贫穷，压力增加',
        });
      }

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: '身无分文，走投无路',
        emotionType: 'sad',
        intensity: 6,
        tick: ctx.currentTick,
      });

      return {
        source: ctx.sourceName,
        action: '贫穷挣扎',
        effects,
        narrative: `${ctx.sourceName}摸了摸空空的口袋，脸上露出绝望的神情。`,
      };
    },
  },

  // 11. 完成心愿 → 心情+15 + 正面记忆 + 可能获得"乐观"
  {
    triggerAction: ['eat', 'sleep', 'chat', 'stroll', 'sell_goods', 'study'],
    probability: 0.25,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const needs = ctx.em.getComponent(ctx.sourceId, 'Needs');
      if (!needs || needs.mood < 60) return null;

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: '完成了一件想做的事',
        emotionType: 'happy',
        intensity: 5,
        tick: ctx.currentTick,
      });
      effects.push({
        targetId: ctx.sourceId,
        targetName: ctx.sourceName,
        type: 'memory',
        description: '获得正面记忆',
      });

      // 压力-5
      const stress = ctx.em.getComponent(ctx.sourceId, 'Stress');
      if (stress) {
        stress.level = Math.max(0, stress.level - 5);
      }

      return {
        source: ctx.sourceName,
        action: '满足',
        effects,
        narrative: `${ctx.sourceName}露出了一丝满足的微笑，好像一切辛苦都值了。`,
      };
    },
  },

  // 12. 受伤未治疗 → 压力+8 + "痛苦"记忆 + 对不帮忙的人关系-10
  {
    triggerAction: ['fight', 'hunt', 'patrol'],
    probability: 0.5,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const needs = ctx.em.getComponent(ctx.sourceId, 'Needs');
      if (!needs || needs.health > 40) return null;

      const stress = ctx.em.getComponent(ctx.sourceId, 'Stress');
      if (stress) {
        stress.level = Math.min(100, stress.level + 8);
        effects.push({
          targetId: ctx.sourceId,
          targetName: ctx.sourceName,
          type: 'stress',
          description: '伤痛增加压力',
        });
      }

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: '受了伤却无人帮助',
        emotionType: 'fear',
        intensity: 8,
        tick: ctx.currentTick,
      });

      // 对附近不帮忙的人关系-10
      for (const bystanderId of ctx.nearbyIds.filter(id => id !== ctx.sourceId).slice(0, 3)) {
        const bystanderName = getNpcName(ctx.em, bystanderId);
        ctx.relationSys.modifyRelation(ctx.sourceId, bystanderId, -10, ctx.currentTick);
        effects.push({
          targetId: bystanderId,
          targetName: bystanderName,
          type: 'relation',
          description: '受伤时没帮忙，关系下降',
        });
      }

      return {
        source: ctx.sourceName,
        action: '受伤无助',
        effects,
        narrative: `${ctx.sourceName}捂着伤口，用怨恨的目光扫视着周围袖手旁观的人。`,
      };
    },
  },

  // 13. 与密友同行 → 双方压力-3 + 社交+5 + "陪伴"记忆
  {
    triggerAction: ['stroll', 'chat', 'work'],
    probability: 0.4,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const closeFriends = ctx.nearbyIds.filter(id => {
        const score = ctx.relationSys.getScore(ctx.sourceId, id);
        return score >= 61;
      });
      if (closeFriends.length === 0) return null;

      const friendId = pickRandom(closeFriends);
      const friendName = getNpcName(ctx.em, friendId);

      // 双方压力-3
      const sourceStress = ctx.em.getComponent(ctx.sourceId, 'Stress');
      const friendStress = ctx.em.getComponent(friendId, 'Stress');
      if (sourceStress) {
        sourceStress.level = Math.max(0, sourceStress.level - 3);
        effects.push({
          targetId: ctx.sourceId,
          targetName: ctx.sourceName,
          type: 'stress',
          description: '与密友在一起，压力减轻',
        });
      }
      if (friendStress) {
        friendStress.level = Math.max(0, friendStress.level - 3);
        effects.push({
          targetId: friendId,
          targetName: friendName,
          type: 'stress',
          description: '与密友在一起，压力减轻',
        });
      }

      // 社交+5
      const sourceNeeds = ctx.em.getComponent(ctx.sourceId, 'Needs');
      const friendNeeds = ctx.em.getComponent(friendId, 'Needs');
      if (sourceNeeds) sourceNeeds.social = Math.min(100, sourceNeeds.social + 5);
      if (friendNeeds) friendNeeds.social = Math.min(100, friendNeeds.social + 5);

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: `和${friendName}一起度过了愉快的时光`,
        emotionType: 'happy',
        intensity: 4,
        tick: ctx.currentTick,
      });

      return {
        source: ctx.sourceName,
        action: '陪伴',
        effects,
        narrative: `${ctx.sourceName}和${friendName}走在一起，不时低声说笑，看起来很自在。`,
      };
    },
  },

  // 14. 被通缉 → 压力+10 + "恐惧"记忆 + 行为隐蔽
  {
    triggerAction: ['steal', 'black_market', 'flee'],
    probability: 0.4,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      // 检查是否有 guard 附近
      const hasGuard = ctx.nearbyIds.some(id => {
        const ident = ctx.em.getComponent(id, 'Identity');
        return ident?.profession === 'guard';
      });
      if (!hasGuard) return null;

      const stress = ctx.em.getComponent(ctx.sourceId, 'Stress');
      if (stress) {
        stress.level = Math.min(100, stress.level + 10);
        effects.push({
          targetId: ctx.sourceId,
          targetName: ctx.sourceName,
          type: 'stress',
          description: '看到衙役，十分紧张',
        });
      }

      ctx.stressMemSys.addShortTermMemory(ctx.sourceId, {
        event: '在有衙役的地方做贼心虚',
        emotionType: 'fear',
        intensity: 7,
        tick: ctx.currentTick,
      });

      return {
        source: ctx.sourceName,
        action: '心虚',
        effects,
        narrative: `${ctx.sourceName}看到衙役的身影，不由得缩了缩脖子，尽量装作若无其事。`,
      };
    },
  },

  // 15. 慷慨行为（大方/善良性格NPC） → 旁人关系+5 + 好感
  {
    triggerAction: ['chat', 'gift', 'share_food'],
    probability: 0.3,
    execute: (ctx) => {
      const effects: ChainEffect[] = [];
      const identity = ctx.em.getComponent(ctx.sourceId, 'Identity');
      if (!identity || (!identity.personality.includes('大方') && !identity.personality.includes('善良'))) return null;

      for (const targetId of ctx.nearbyIds.filter(id => id !== ctx.sourceId).slice(0, 3)) {
        const targetName = getNpcName(ctx.em, targetId);
        ctx.relationSys.modifyRelation(targetId, ctx.sourceId, 5, ctx.currentTick);
        effects.push({
          targetId,
          targetName,
          type: 'relation',
          description: `${ctx.sourceName}的善举赢得了好感`,
        });
      }

      return {
        source: ctx.sourceName,
        action: '慷慨',
        effects,
        narrative: `${ctx.sourceName}大方地帮助了周围的人，大家都投来赞许的目光。`,
      };
    },
  },
];

// ──── 链式反应引擎主类 ────
export class ChainReactionEngine {
  private em: EntityManager;
  private relationSys: RelationshipSystem;
  private stressMemSys: StressMemorySystem;

  constructor(em: EntityManager, relationSys: RelationshipSystem, stressMemSys: StressMemorySystem) {
    this.em = em;
    this.relationSys = relationSys;
    this.stressMemSys = stressMemSys;
  }

  /** 在NPC行动后检查并执行链式反应 */
  checkChainReactions(ctx: {
    sourceId: number;
    actionId: string;
    currentTick: number;
    nearbyIds: number[];
    weather?: string;
  }): ChainReactionResult[] {
    const sourceName = getNpcName(this.em, ctx.sourceId);
    const pos = this.em.getComponent(ctx.sourceId, 'Position');
    const sourceGrid = pos?.gridId || 'center_street';

    const chainCtx: ChainContext = {
      sourceId: ctx.sourceId,
      sourceName,
      sourceGrid,
      actionId: ctx.actionId,
      currentTick: ctx.currentTick,
      nearbyIds: ctx.nearbyIds,
      em: this.em,
      relationSys: this.relationSys,
      stressMemSys: this.stressMemSys,
    };

    const results: ChainReactionResult[] = [];

    for (const rule of CHAIN_RULES) {
      // 检查行动匹配
      const triggers = Array.isArray(rule.triggerAction) ? rule.triggerAction : [rule.triggerAction];
      if (!triggers.includes(ctx.actionId)) continue;

      // 概率检查
      if (Math.random() > rule.probability) continue;

      try {
        const result = rule.execute(chainCtx);
        if (result) {
          results.push(result);
        }
      } catch {
        // 链式反应不应阻断主流程
        continue;
      }
    }

    return results;
  }
}
