// === 压力-记忆闭环系统 — 参考矮人要塞(Dwarf Fortress) ===
//
// 核心机制：
// - StressComponent: 压力等级 0-100，由需求/社交/环境来源积累
// - 记忆系统：5个短期记忆 + 8个长期记忆，每个带情绪强度
// - 记忆固化：短期记忆强度 > 最弱长期记忆时，替换并可能改变人格
// - 压力效果：影响NPC行为（降低专注→暴躁→崩溃）
// - 人格改变：30%概率在记忆固化工时改变性格

import { EntityManager } from '../ecs/entityManager';
import {
  MemoryComponent, MemoryEntry, StressComponent, HiddenTraitsComponent,
  NeedsComponent, IdentityComponent,
  DYNAMIC_PERSONALITY_TRAITS,
} from '../ecs/types';

// ──── 压力来源定义 ────
interface StressSource {
  amount: number;
  description: string;
}

// ──── 压力效果 ────
export interface StressEffects {
  focusModifier: number;       // 工作类行动得分修正
  socialModifier: number;      // 社交行动得分修正
  aggressionChance: number;    // 攻击/冲突倾向概率
  moodDecay: number;           // 每tick mood衰减
  canWork: boolean;            // 是否能工作
}

export function getStressEffects(stressLevel: number): StressEffects {
  if (stressLevel <= 30) {
    return { focusModifier: 1.0, socialModifier: 1.0, aggressionChance: 0.0, moodDecay: 0, canWork: true };
  }
  if (stressLevel <= 60) {
    return { focusModifier: 0.8, socialModifier: 1.0, aggressionChance: 0.05, moodDecay: 0, canWork: true };
  }
  if (stressLevel <= 80) {
    return { focusModifier: 0.7, socialModifier: 0.7, aggressionChance: 0.15, moodDecay: -1, canWork: true };
  }
  // 81-100: 崩溃
  return { focusModifier: 0.0, socialModifier: 0.3, aggressionChance: 0.3, moodDecay: -2, canWork: false };
}

// ──── 核心系统 ────
export class StressMemorySystem {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  /** 确保NPC有压力组件 */
  ensureStressComponent(npcId: number): StressComponent {
    let stress = this.em.getComponent(npcId, 'Stress');
    if (!stress) {
      stress = { level: 0, stressors: [] };
      this.em.addComponent(npcId, 'Stress', stress);
    }
    return stress;
  }

  /** 确保NPC的记忆组件有短期/长期记忆字段 */
  ensureMemoryExtended(npcId: number): MemoryComponent {
    let mem = this.em.getComponent(npcId, 'Memory');
    if (!mem) {
      mem = { recentEvents: [], impressions: {}, shortTermMemories: [], longTermMemories: [] };
      this.em.addComponent(npcId, 'Memory', mem);
    }
    if (!mem.shortTermMemories) mem.shortTermMemories = [];
    if (!mem.longTermMemories) mem.longTermMemories = [];
    return mem;
  }

  /** 计算并更新压力 */
  updateStress(npcId: number, context: {
    needs: NeedsComponent;
    weather: string;
    currentGrid: string;
    currentTick: number;
    nearbyEnemies: number;    // 附近仇敌数
    nearbyFriends: number;    // 附近密友数
    copper: number;
  }): StressComponent {
    const stress = this.ensureStressComponent(npcId);
    const sources: StressSource[] = [];

    // ──── 需求压力 ────
    if (context.needs.hunger < 20) {
      sources.push({ amount: 8, description: '极度饥饿' });
    }
    if (context.needs.safety < 30) {
      sources.push({ amount: 6, description: '缺乏安全感' });
    }
    if (context.needs.mood < 20) {
      sources.push({ amount: 10, description: '心情极差' });
    }

    // ──── 社交压力 ────
    if (context.nearbyEnemies > 0) {
      sources.push({ amount: 5 * context.nearbyEnemies, description: '仇敌在场' });
    }
    if (context.nearbyFriends > 0) {
      // 朋友在场减轻压力
      sources.push({ amount: -4 * context.nearbyFriends, description: '密友陪伴' });
    }

    // ──── 环境压力 ────
    if (context.weather === '暴雨' || context.weather === '大暴雨') {
      sources.push({ amount: 3, description: '恶劣天气' });
    }
    const dangerousGrids = ['mountain_path', 'forest_deep', 'wilderness'];
    if (dangerousGrids.includes(context.currentGrid)) {
      const timeOfDay = context.currentTick % 12;
      if (timeOfDay >= 9) { // 夜晚
        sources.push({ amount: 4, description: '夜晚在危险区域' });
      }
    }

    // ──── 经济压力 ────
    if (context.copper < 10) {
      sources.push({ amount: 3, description: '极度贫穷' });
    }

    // ──── 计算总压力变化 ────
    const totalDelta = sources.reduce((sum, s) => sum + s.amount, 0);
    stress.stressors = sources.filter(s => s.amount > 0).map(s => s.description);

    // 压力变化（加上自然恢复）
    const naturalRecovery = stress.level > 0 ? -1 : 0;  // 每tick自然恢复1点
    const newDelta = totalDelta + naturalRecovery;
    stress.level = Math.max(0, Math.min(100, stress.level + newDelta));

    return stress;
  }

  /** 添加短期记忆 */
  addShortTermMemory(npcId: number, entry: MemoryEntry): void {
    const mem = this.ensureMemoryExtended(npcId);
    mem.shortTermMemories.push(entry);
    // 保留最近5个
    if (mem.shortTermMemories.length > 5) {
      mem.shortTermMemories.shift();
    }
    // 同时添加到旧格式（兼容）
    mem.recentEvents.push({ content: entry.event, tick: entry.tick });
    if (mem.recentEvents.length > 20) {
      mem.recentEvents.shift();
    }
  }

  /** 记忆固化：检查短期记忆是否替换长期记忆 */
  consolidateMemories(npcId: number): {
    consolidated: boolean;
    replacedMemory?: MemoryEntry;
    personalityChanged: boolean;
    newTrait?: string;
    removedTrait?: string;
  } {
    const mem = this.ensureMemoryExtended(npcId);
    const identity = this.em.getComponent(npcId, 'Identity');
    if (!identity) return { consolidated: false, personalityChanged: false };

    let consolidated = false;
    let replacedMemory: MemoryEntry | undefined;
    let personalityChanged = false;
    let newTrait: string | undefined;
    let removedTrait: string | undefined;

    // 检查每个短期记忆
    const toRemove: number[] = [];
    for (let i = 0; i < mem.shortTermMemories.length; i++) {
      const stm = mem.shortTermMemories[i];
      // 长期记忆未满 → 直接加入
      if (mem.longTermMemories.length < 8) {
        mem.longTermMemories.push({ ...stm });
        mem.longTermMemories.sort((a, b) => b.intensity - a.intensity);
        toRemove.push(i);
        consolidated = true;
        // 30%概率改变人格
        if (Math.random() < 0.3) {
          const result = this.tryPersonalityChange(npcId, stm);
          if (result.changed) {
            personalityChanged = true;
            newTrait = result.newTrait;
            removedTrait = result.removedTrait;
          }
        }
        continue;
      }

      // 长期记忆已满 → 检查是否替换最弱的
      const weakest = mem.longTermMemories[mem.longTermMemories.length - 1];
      if (stm.intensity > weakest.intensity) {
        replacedMemory = { ...weakest };
        mem.longTermMemories[mem.longTermMemories.length - 1] = { ...stm };
        mem.longTermMemories.sort((a, b) => b.intensity - a.intensity);
        toRemove.push(i);
        consolidated = true;
        // 30%概率改变人格
        if (Math.random() < 0.3) {
          const result = this.tryPersonalityChange(npcId, stm);
          if (result.changed) {
            personalityChanged = true;
            newTrait = result.newTrait;
            removedTrait = result.removedTrait;
          }
        }
      }
    }

    // 移除已固化的短期记忆
    for (let i = toRemove.length - 1; i >= 0; i--) {
      mem.shortTermMemories.splice(toRemove[i], 1);
    }

    return { consolidated, replacedMemory, personalityChanged, newTrait, removedTrait };
  }

  /** 人格改变逻辑 */
  private tryPersonalityChange(npcId: number, memory: MemoryEntry): {
    changed: boolean;
    newTrait?: string;
    removedTrait?: string;
  } {
    const identity = this.em.getComponent(npcId, 'Identity');
    if (!identity) return { changed: false };

    // 根据记忆类型决定可能获得/失去的特征
    const traitRules: { emotionType: string; gainTrait: string; loseTrait: string }[] = [
      { emotionType: 'fear', gainTrait: '多疑', loseTrait: '勇敢' },
      { emotionType: 'gratitude', gainTrait: '感恩', loseTrait: '暴躁' },
      { emotionType: 'sad', gainTrait: '孤僻', loseTrait: '健谈' },
      { emotionType: 'happy', gainTrait: '乐观', loseTrait: '愤世' },
      { emotionType: 'disgust', gainTrait: '愤世', loseTrait: '善良' },
      { emotionType: 'pride', gainTrait: '侠义', loseTrait: '胆小' },
    ];

    const rule = traitRules.find(r => r.emotionType === memory.emotionType);
    if (!rule) return { changed: false };

    // 已有该特征 → 不再获得
    if (identity.personality.includes(rule.gainTrait)) return { changed: false };

    // 检查是否是动态特征
    const isDynamicTrait = (DYNAMIC_PERSONALITY_TRAITS as readonly string[]).includes(rule.gainTrait);

    // 添加新特征
    if (identity.personality.length < 5 || isDynamicTrait) {
      identity.personality.push(rule.gainTrait);
      newTrait: rule.gainTrait;

      // 尝试移除对立特征
      if (identity.personality.includes(rule.loseTrait)) {
        identity.personality = identity.personality.filter(t => t !== rule.loseTrait);
        return { changed: true, newTrait: rule.gainTrait, removedTrait: rule.loseTrait };
      }

      // 如果特征太多，移除最旧的非核心特征
      if (identity.personality.length > 5) {
        const removable = identity.personality.find(t =>
          (DYNAMIC_PERSONALITY_TRAITS as readonly string[]).includes(t) && t !== rule.gainTrait
        );
        if (removable) {
          identity.personality = identity.personality.filter(t => t !== removable);
          return { changed: true, newTrait: rule.gainTrait, removedTrait: removable };
        }
      }

      return { changed: true, newTrait: rule.gainTrait };
    }

    return { changed: false };
  }

  /** 获取NPC的长期记忆（用于叙事片段选择） */
  getLongTermMemories(npcId: number): MemoryEntry[] {
    const mem = this.em.getComponent(npcId, 'Memory');
    return mem?.longTermMemories || [];
  }

  /** 获取压力描述（用于叙事） */
  getStressDescription(stressLevel: number): string {
    if (stressLevel <= 30) return '平静';
    if (stressLevel <= 60) return '焦虑';
    if (stressLevel <= 80) return '暴躁';
    return '崩溃';
  }
}
