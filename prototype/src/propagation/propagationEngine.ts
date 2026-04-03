// === 事件传播链模拟 ===

export interface PropagationEvent {
  source: number;       // 源 NPC ID
  importance: number;   // 1-10
  content: string;
  currentHop: number;
  detailLoss: number;   // 细节丢失程度 0-1
}

export interface PropagationResult {
  event: PropagationEvent;
  hops: { hop: number; reached: number[]; detailLoss: number }[];
}

export class PropagationEngine {
  private relations: Map<number, number[]> = new Map(); // entityId → 关系人列表

  /** 设置关系网（预先构建） */
  setRelations(entityId: number, related: number[]): void {
    this.relations.set(entityId, related);
  }

  /** 批量构建随机关系网 */
  buildRandomRelations(entityIds: number[], avgRelations: number): void {
    for (const id of entityIds) {
      const count = Math.max(1, Math.floor(Math.random() * avgRelations * 2));
      const related: number[] = [];
      for (let i = 0; i < count; i++) {
        const other = entityIds[Math.floor(Math.random() * entityIds.length)];
        if (other !== id && !related.includes(other)) related.push(other);
      }
      this.relations.set(id, related);
    }
  }

  /** 传播单个事件 */
  propagate(event: PropagationEvent, maxHops: number = 5): PropagationResult {
    const hops: { hop: number; reached: number[]; detailLoss: number }[] = [];

    let currentKnowers = [event.source];
    let detailLoss = 0;

    for (let hop = 1; hop <= maxHops; hop++) {
      const newlyReached: number[] = [];
      const decay = 0.7;
      detailLoss += (1 - decay) * (1 - detailLoss); // 累积衰减

      for (const knower of currentKnowers) {
        const relations = this.relations.get(knower) || [];
        // 传播概率随 importance 和 hop 衰减
        const spreadChance = (event.importance / 10) * Math.pow(decay, hop - 1);
        for (const target of relations) {
          if (Math.random() < spreadChance && !newlyReached.includes(target)) {
            newlyReached.push(target);
            // 20% 概率细节丢失
            if (Math.random() < 0.2) detailLoss = Math.min(1, detailLoss + 0.1);
          }
        }
      }

      currentKnowers = newlyReached;
      hops.push({ hop, reached: newlyReached, detailLoss });

      if (newlyReached.length === 0) break;
    }

    return { event, hops };
  }

  /** 批量传播 */
  propagateBatch(events: PropagationEvent[], maxHops: number = 5): PropagationResult[] {
    return events.map(e => this.propagate(e, maxHops));
  }

  getRelationCount(entityId: number): number {
    return this.relations.get(entityId)?.length ?? 0;
  }
}
