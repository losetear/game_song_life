// === GOAP 规划器 — A* 搜索（最小堆 + 激进剪枝） ===

import { GOAPAction } from './actions';
import { WorldState, satisfies, applyEffects, heuristic } from './worldState';

const MAX_DEPTH = 6;
const MAX_VISITED = 200;

interface PlanNode {
  state: WorldState;
  actions: string[];
  gCost: number;
  fCost: number;
}

export interface PlanResult {
  success: boolean;
  plan: string[];
  cost: number;
  nodesExplored: number;
}

// 最小堆
class MinHeap {
  private data: PlanNode[] = [];

  push(node: PlanNode): void {
    this.data.push(node);
    this._bubbleUp(this.data.length - 1);
  }

  pop(): PlanNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size(): number { return this.data.length; }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].fCost < this.data[parent].fCost) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  private _sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].fCost < this.data[smallest].fCost) smallest = left;
      if (right < n && this.data[right].fCost < this.data[smallest].fCost) smallest = right;
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else break;
    }
  }
}

/** 数值哈希（快速，允许少量碰撞） */
function hashState(state: WorldState): number {
  let hash = 0;
  for (const k in state) {
    hash = ((hash << 5) - hash + k.charCodeAt(0)) | 0;
    const v = state[k];
    if (typeof v === 'number') hash = ((hash << 5) - hash + (v | 0)) | 0;
    else if (typeof v === 'boolean') hash = ((hash << 5) - hash + (v ? 1 : 0)) | 0;
  }
  return hash;
}

/**
 * GOAP A* 规划器
 */
export function plan(
  startState: WorldState,
  goal: WorldState,
  availableActions: GOAPAction[]
): PlanResult {
  if (satisfies(startState, goal)) {
    return { success: true, plan: [], cost: 0, nodesExplored: 0 };
  }

  const open = new MinHeap();
  const visited = new Set<number>();

  open.push({
    state: startState,
    actions: [],
    gCost: 0,
    fCost: heuristic(startState, goal),
  });

  let nodesExplored = 0;

  while (open.size > 0 && nodesExplored < MAX_VISITED) {
    const current = open.pop()!;
    nodesExplored++;

    if (current.actions.length >= MAX_DEPTH) continue;

    const stateHash = hashState(current.state);
    if (visited.has(stateHash)) continue;
    visited.add(stateHash);

    if (satisfies(current.state, goal)) {
      return { success: true, plan: current.actions, cost: current.gCost, nodesExplored };
    }

    for (const action of availableActions) {
      if (!satisfies(current.state, action.preconditions)) continue;

      const newState = applyEffects(current.state, action.effects);
      const newHash = hashState(newState);
      if (visited.has(newHash)) continue;

      open.push({
        state: newState,
        actions: [...current.actions, action.id],
        gCost: current.gCost + action.cost,
        fCost: current.gCost + action.cost + heuristic(newState, goal),
      });
    }
  }

  return { success: false, plan: [], cost: Infinity, nodesExplored };
}
