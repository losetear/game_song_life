// === GOAP 世界状态表示 ===
// 扁平 key-value，支持数值比较和布尔检查

export type WorldStateValue = boolean | number | string;
export type WorldState = Record<string, WorldStateValue>;

/** 检查 state 是否满足 conditions */
export function satisfies(state: WorldState, conditions: WorldState): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (state[key] === undefined) return false;
    if (typeof value === 'boolean') {
      if (state[key] !== value) return false;
    } else if (typeof value === 'number') {
      // 数值条件：>= 比较
      if (typeof state[key] !== 'number' || state[key] < value) return false;
    } else {
      if (state[key] !== value) return false;
    }
  }
  return true;
}

/** 应用 effects 到 state */
export function applyEffects(state: WorldState, effects: WorldState): WorldState {
  const next = { ...state };
  for (const [key, value] of Object.entries(effects)) {
    if (typeof value === 'number' && typeof next[key] === 'number') {
      next[key] = (next[key] as number) + value;
    } else {
      next[key] = value;
    }
  }
  return next;
}

/** 启发式：未满足目标条件数量 */
export function heuristic(state: WorldState, goal: WorldState): number {
  let count = 0;
  for (const [key, value] of Object.entries(goal)) {
    if (typeof value === 'number') {
      if (typeof state[key] !== 'number' || state[key] < value) count++;
    } else {
      if (state[key] !== value) count++;
    }
  }
  return count;
}
