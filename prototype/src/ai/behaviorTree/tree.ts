// === 行为树执行器 ===

export enum NodeStatus {
  Success = 'success',
  Failure = 'failure',
  Running = 'running',
}

// --- 节点类型 ---

export type BTCondition = (ctx: BTContext) => boolean;
export type BTAction = (ctx: BTContext) => NodeStatus;

export interface BTNode {
  type: 'sequence' | 'selector' | 'random' | 'condition' | 'action';
  children?: BTNode[];
  condition?: BTCondition;
  action?: BTAction;
  weight?: number; // for random
}

export interface BTContext {
  entityId: number;
  hunger: number;
  fatigue: number;
  health: number;
  mood: number;
  copper: number;
  hasStock: boolean;
  hasFood: boolean;
  hasHerbs: boolean;
  hasWeapon: boolean;
  isGuard: boolean;
  currentHour: number; // 0-23 (时辰映射)
  currentGrid: string;
  // ... 可扩展
}

/** 执行行为树 */
export function executeTree(node: BTNode, ctx: BTContext): NodeStatus {
  switch (node.type) {
    case 'sequence':
      return executeSequence(node.children!, ctx);
    case 'selector':
      return executeSelector(node.children!, ctx);
    case 'random':
      return executeRandom(node.children!, ctx);
    case 'condition':
      return node.condition!(ctx) ? NodeStatus.Success : NodeStatus.Failure;
    case 'action':
      return node.action!(ctx);
    default:
      return NodeStatus.Failure;
  }
}

function executeSequence(children: BTNode[], ctx: BTContext): NodeStatus {
  for (const child of children) {
    const status = executeTree(child, ctx);
    if (status !== NodeStatus.Success) return status;
  }
  return NodeStatus.Success;
}

function executeSelector(children: BTNode[], ctx: BTContext): NodeStatus {
  for (const child of children) {
    const status = executeTree(child, ctx);
    if (status !== NodeStatus.Failure) return status;
  }
  return NodeStatus.Failure;
}

function executeRandom(children: BTNode[], ctx: BTContext): NodeStatus {
  if (children.length === 0) return NodeStatus.Failure;
  // 加权随机
  const totalWeight = children.reduce((sum, c) => sum + (c.weight ?? 1), 0);
  let r = Math.random() * totalWeight;
  for (const child of children) {
    r -= (child.weight ?? 1);
    if (r <= 0) return executeTree(child, ctx);
  }
  return executeTree(children[children.length - 1], ctx);
}
