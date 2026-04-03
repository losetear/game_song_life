// === 6 种职业行为树模板 ===

import { BTNode, BTContext, NodeStatus } from './tree';

// Helper: 条件节点
function cond(fn: (ctx: BTContext) => boolean): BTNode {
  return { type: 'condition', condition: fn };
}
// Helper: 行动节点
function act(fn: (ctx: BTContext) => NodeStatus): BTNode {
  return { type: 'action', action: fn };
}

// 时辰范围检查（辰=7-9, 巳=9-11, 午=11-13, 未=13-15, 申=15-17, 酉=17-19）
function isWorkHour(ctx: BTContext): boolean {
  return ctx.currentHour >= 7 && ctx.currentHour <= 19;
}

// === 商贩 ===
export const MERCHANT_TREE: BTNode = {
  type: 'selector',
  children: [
    // 饥饿 → 买食物
    { type: 'sequence', children: [
      cond(ctx => ctx.hunger < 30),
      act(() => NodeStatus.Success), // buy_food
    ]},
    // 疲劳 → 回家睡觉
    { type: 'sequence', children: [
      cond(ctx => ctx.fatigue > 80),
      act(() => NodeStatus.Success), // sleep
    ]},
    // 工作时间
    { type: 'sequence', children: [
      cond(isWorkHour),
      { type: 'selector', children: [
        { type: 'sequence', children: [
          cond(ctx => ctx.hasStock),
          act(() => NodeStatus.Success), // sell_goods
        ]},
        { type: 'sequence', children: [
          cond(ctx => !ctx.hasStock),
          act(() => NodeStatus.Success), // restock
        ]},
        { type: 'random', children: [
          { type: 'action', action: () => NodeStatus.Success, weight: 85 }, // continue work
          { type: 'action', action: () => NodeStatus.Success, weight: 15 }, // go_teahouse
        ]},
      ]},
    ]},
    // 默认 → 回家
    act(() => NodeStatus.Success),
  ],
};

// === 农夫 ===
export const FARMER_TREE: BTNode = {
  type: 'selector',
  children: [
    { type: 'sequence', children: [
      cond(ctx => ctx.hunger < 30),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(ctx => ctx.fatigue > 80),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      cond(ctx => ctx.currentGrid === 'east_farm' || ctx.currentGrid === 'south_farm'),
      act(() => NodeStatus.Success), // farm_work
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      act(() => NodeStatus.Success), // go_farm
    ]},
    act(() => NodeStatus.Success),
  ],
};

// === 衙役 ===
export const GUARD_TREE: BTNode = {
  type: 'selector',
  children: [
    { type: 'sequence', children: [
      cond(ctx => ctx.hunger < 30),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      act(() => NodeStatus.Success), // patrol
    ]},
    { type: 'sequence', children: [
      cond(ctx => ctx.health < 50),
      act(() => NodeStatus.Success), // flee / go_safe
    ]},
    act(() => NodeStatus.Success),
  ],
};

// === 大夫 ===
export const DOCTOR_TREE: BTNode = {
  type: 'selector',
  children: [
    { type: 'sequence', children: [
      cond(ctx => ctx.hunger < 30),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      { type: 'selector', children: [
        { type: 'sequence', children: [
          cond(ctx => ctx.hasHerbs),
          act(() => NodeStatus.Success), // treat_patient
        ]},
        { type: 'sequence', children: [
          cond(() => Math.random() < 0.3),
          act(() => NodeStatus.Success), // go_mountain → gather_herbs
        ]},
      ]},
    ]},
    act(() => NodeStatus.Success),
  ],
};

// === 猎人 ===
export const HUNTER_TREE: BTNode = {
  type: 'selector',
  children: [
    { type: 'sequence', children: [
      cond(ctx => ctx.hunger < 30),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(ctx => ctx.fatigue > 80),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      cond(ctx => ctx.currentGrid === 'shallow_mountain' || ctx.currentGrid === 'deep_mountain'),
      cond(ctx => ctx.hasWeapon),
      act(() => NodeStatus.Success), // hunt
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      act(() => NodeStatus.Success), // go_mountain
    ]},
    act(() => NodeStatus.Success),
  ],
};

// === 混混 ===
export const ROGUE_TREE: BTNode = {
  type: 'selector',
  children: [
    { type: 'sequence', children: [
      cond(ctx => ctx.hunger < 30),
      act(() => NodeStatus.Success),
    ]},
    { type: 'sequence', children: [
      cond(() => Math.random() < 0.3),
      act(() => NodeStatus.Success), // steal
    ]},
    { type: 'sequence', children: [
      cond(isWorkHour),
      { type: 'random', children: [
        { type: 'action', action: () => NodeStatus.Success, weight: 40 }, // chat
        { type: 'action', action: () => NodeStatus.Success, weight: 30 }, // drink
        { type: 'action', action: () => NodeStatus.Success, weight: 30 }, // wander
      ]},
    ]},
    act(() => NodeStatus.Success),
  ],
};

export const PROFESSION_TREES: Record<string, BTNode> = {
  merchant: MERCHANT_TREE,
  farmer: FARMER_TREE,
  guard: GUARD_TREE,
  doctor: DOCTOR_TREE,
  hunter: HUNTER_TREE,
  rogue: ROGUE_TREE,
};
