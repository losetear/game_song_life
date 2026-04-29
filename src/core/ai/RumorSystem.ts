import type { EntityManager } from '../ecs/EntityManager';
import { EntityType } from '../ecs/types';
import type { SeededRandom } from '../utils/random';

/** 传闻条目 */
export interface Rumor {
  text: string;
  sourceNpcId: number;
  day: number;
  /** 传播次数 */
  spreadCount: number;
}

/** 延迟后果 */
export interface DelayedConsequence {
  /** 触发天数 */
  triggerDay: number;
  /** 目标：'player' | npcId */
  targetId: number | 'player';
  /** 后果类型 */
  type: string;
  /** 参数 */
  params: Record<string, unknown>;
}

/** 传闻与延迟后果系统 */
export class RumorSystem {
  private activeRumors: Rumor[] = [];
  private delayedConsequences: DelayedConsequence[] = [];

  /** 添加传闻 */
  addRumor(rumor: Rumor): void {
    // 同一天同一个NPC的相同传闻不重复
    const exists = this.activeRumors.some(
      (r) => r.text === rumor.text && r.sourceNpcId === rumor.sourceNpcId,
    );
    if (!exists) {
      this.activeRumors.push(rumor);
      // 最多保留20条传闻
      if (this.activeRumors.length > 20) {
        this.activeRumors.shift();
      }
    }
  }

  /** 添加延迟后果 */
  addDelayed(dc: DelayedConsequence): void {
    this.delayedConsequences.push(dc);
  }

  /** 每天更新：传播传闻 + 处理延迟后果 */
  update(em: EntityManager, currentDay: number, rng: SeededRandom): string[] {
    const events: string[] = [];

    // 1. 传闻传播
    events.push(...this.spreadRumors(em, currentDay, rng));

    // 2. 清理过期传闻（超过10天）
    this.activeRumors = this.activeRumors.filter((r) => currentDay - r.day <= 10);

    // 3. 触发到期延迟后果
    events.push(...this.processDelayed(em, currentDay));

    return events;
  }

  /** 传闻传播 */
  private spreadRumors(em: EntityManager, currentDay: number, rng: SeededRandom): string[] {
    const events: string[] = [];

    // 获取所有NPC实体
    const npcs = em.getEntitiesByType(EntityType.NPC);
    if (npcs.length === 0) return events;

    for (const rumor of this.activeRumors) {
      if (currentDay - rumor.day > 5) continue; // 超过5天的不再传播
      if (rumor.spreadCount >= 5) continue; // 最多传播5次

      // 30%概率传播
      if (rng.next() > 0.3) continue;

      // 找到源NPC的位置
      const sourcePos = em.getComponent(rumor.sourceNpcId, 'Position');
      if (!sourcePos) continue;

      // 找同地点NPC
      const candidates: number[] = [];
      for (const npcId of npcs) {
        if (npcId === rumor.sourceNpcId) continue;
        const pos = em.getComponent(npcId, 'Position');
        if (pos && pos.locationId === sourcePos.locationId) {
          candidates.push(npcId);
        }
      }

      if (candidates.length === 0) continue;

      // 随机选一个NPC传播
      const targetId = candidates[rng.nextInt(0, candidates.length)]!;
      const targetMemory = em.getComponent(targetId, 'Memory');
      if (targetMemory) {
        const tag = `听说:${rumor.text}`;
        if (!targetMemory.narrativeTags.includes(tag)) {
          targetMemory.narrativeTags.push(tag);
          rumor.spreadCount++;
          const identity = em.getComponent(targetId, 'Identity');
          if (identity) {
            events.push(`${identity.name}听说了"${rumor.text}"的消息。`);
          }
        }
      }
    }

    return events;
  }

  /** 处理延迟后果 */
  private processDelayed(em: EntityManager, currentDay: number): string[] {
    const events: string[] = [];
    const triggered: number[] = [];

    for (let i = 0; i < this.delayedConsequences.length; i++) {
      const dc = this.delayedConsequences[i]!;
      if (dc.triggerDay <= currentDay) {
        triggered.push(i);

        // 解析目标ID
        const targetId = dc.targetId === 'player'
          ? this.findPlayerId(em)
          : dc.targetId;

        if (targetId === null) continue;

        // 根据类型应用后果
        const result = this.applyDelayed(em, targetId, dc);
        if (result) events.push(result);
      }
    }

    // 移除已触发的
    for (let i = triggered.length - 1; i >= 0; i--) {
      this.delayedConsequences.splice(triggered[i]!, 1);
    }

    return events;
  }

  private findPlayerId(em: EntityManager): number | null {
    // 简单查找：有ActionPoints组件的就是玩家
    const entities = em.query('ActionPoints');
    for (const id of entities) {
      const ap = em.getComponent(id, 'ActionPoints');
      if (ap && (ap as any).max === 4) return id; // 玩家AP max=4
    }
    return null;
  }

  private applyDelayed(em: EntityManager, targetId: number, dc: DelayedConsequence): string | null {
    const identity = em.getComponent(targetId, 'Identity');
    const name = identity?.name ?? '某人';

    switch (dc.type) {
      case 'mood_change': {
        const vital = em.getComponent(targetId, 'Vital');
        if (vital) {
          const delta = dc.params.delta as number ?? 0;
          vital.mood = Math.max(0, Math.min(100, vital.mood + delta));
          return delta > 0
            ? `${name}的心情变好了。`
            : `${name}的心情变差了。`;
        }
        break;
      }
      case 'health_change': {
        const vital = em.getComponent(targetId, 'Vital');
        if (vital) {
          const delta = dc.params.delta as number ?? 0;
          vital.health = Math.max(0, Math.min(100, vital.health + delta));
          return `${name}的身体状况${delta > 0 ? '有所好转' : '变差了'}。`;
        }
        break;
      }
      case 'copper_change': {
        const wallet = em.getComponent(targetId, 'Wallet');
        if (wallet) {
          const delta = dc.params.delta as number ?? 0;
          wallet.copper = Math.max(0, wallet.copper + delta);
          return delta > 0
            ? `${name}得到了一笔铜钱。`
            : `${name}损失了一些铜钱。`;
        }
        break;
      }
      case 'tag_add': {
        const memory = em.getComponent(targetId, 'Memory');
        const tag = dc.params.tag as string;
        if (memory && tag && !memory.narrativeTags.includes(tag)) {
          memory.narrativeTags.push(tag);
          return `${name}获得了新的经历。`;
        }
        break;
      }
    }
    return null;
  }

  /** 导出存档 */
  exportState() {
    return {
      rumors: this.activeRumors,
      delayed: this.delayedConsequences,
    };
  }

  /** 导入存档 */
  importState(data: { rumors: Rumor[]; delayed: DelayedConsequence[] }): void {
    this.activeRumors = data.rumors ?? [];
    this.delayedConsequences = data.delayed ?? [];
  }
}
