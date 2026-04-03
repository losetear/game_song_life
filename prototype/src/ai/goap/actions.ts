// === GOAP 行动定义 — 30 个行动 ===

import { WorldState } from './worldState';

export interface GOAPAction {
  id: string;
  cost: number;
  preconditions: WorldState;
  effects: WorldState;
}

export const GOAP_ACTIONS: GOAPAction[] = [
  // === 生存 (4) ===
  { id: 'buy_food', cost: 2, preconditions: { at_market: true, has_money: true }, effects: { has_food: true, copper: -5 } },
  { id: 'eat_home', cost: 1, preconditions: { has_food: true, at_home: true }, effects: { hunger: 30, has_food: false, fatigue: -5 } },
  { id: 'sleep', cost: 1, preconditions: { at_home: true }, effects: { fatigue: 50, hunger: -10 } },
  { id: 'rest', cost: 1, preconditions: {}, effects: { fatigue: 15, hunger: -5 } },

  // === 移动 (7) ===
  { id: 'go_home', cost: 2, preconditions: {}, effects: { at_home: true, at_market: false, at_shop: false, at_teahouse: false, at_dock: false, at_farm: false, at_mountain: false } },
  { id: 'go_market', cost: 2, preconditions: {}, effects: { at_market: true, at_home: false, at_shop: false, at_teahouse: false } },
  { id: 'go_shop', cost: 2, preconditions: {}, effects: { at_shop: true, at_home: false, at_market: false } },
  { id: 'go_teahouse', cost: 2, preconditions: {}, effects: { at_teahouse: true, at_home: false, at_market: false } },
  { id: 'go_dock', cost: 3, preconditions: {}, effects: { at_dock: true, at_home: false, at_market: false } },
  { id: 'go_farm', cost: 3, preconditions: {}, effects: { at_farm: true, at_home: false, at_market: false, at_mountain: false } },
  { id: 'go_mountain', cost: 4, preconditions: {}, effects: { at_mountain: true, at_home: false, at_market: false, at_farm: false } },

  // === 工作 (6) ===
  { id: 'sell_goods', cost: 2, preconditions: { has_stock: true, at_market: true }, effects: { copper: 20, has_stock: false, mood: 5 } },
  { id: 'restock', cost: 3, preconditions: { at_market: true, has_money: true }, effects: { has_stock: true, copper: -10 } },
  { id: 'carry_cargo', cost: 4, preconditions: { at_dock: true }, effects: { copper: 8, fatigue: -20 } },
  { id: 'farm_work', cost: 3, preconditions: { at_farm: true }, effects: { copper: 5, fatigue: -25, hunger: -15 } },
  { id: 'treat_patient', cost: 3, preconditions: { has_herbs: true }, effects: { copper: 15, has_herbs: false, mood: 10 } },
  { id: 'patrol', cost: 2, preconditions: { is_guard: true }, effects: { mood: 3, fatigue: -10 } },

  // === 社交 (3) ===
  { id: 'chat', cost: 1, preconditions: { near_people: true }, effects: { mood: 5, fatigue: -3 } },
  { id: 'visit_friend', cost: 2, preconditions: { has_friend: true }, effects: { mood: 10, fatigue: -5 } },
  { id: 'drink', cost: 2, preconditions: { at_teahouse: true, has_money: true }, effects: { mood: 15, copper: -3, fatigue: -10 } },

  // === 特殊 (10) ===
  { id: 'steal', cost: 5, preconditions: { near_people: true, at_market: true }, effects: { copper: 15, mood: -10, is_wanted: true } },
  { id: 'hunt', cost: 4, preconditions: { at_mountain: true, has_weapon: true }, effects: { has_food: true, fatigue: -30 } },
  { id: 'gather_herbs', cost: 3, preconditions: { at_mountain: true }, effects: { has_herbs: true, fatigue: -15 } },
  { id: 'sell_herbs', cost: 2, preconditions: { has_herbs: true, at_market: true }, effects: { copper: 10, has_herbs: false } },
  { id: 'study', cost: 2, preconditions: { at_home: true }, effects: { knowledge: 5, fatigue: -10 } },
  { id: 'practice_craft', cost: 3, preconditions: { has_material: true, at_home: true }, effects: { skill: 5, has_material: false, fatigue: -15 } },
  { id: 'buy_material', cost: 2, preconditions: { at_market: true, has_money: true }, effects: { has_material: true, copper: -8 } },
  { id: 'flee', cost: 3, preconditions: { in_danger: true }, effects: { in_danger: false, at_home: true, fatigue: -20 } },
  { id: 'report_crime', cost: 2, preconditions: { is_guard: true, near_people: true }, effects: { is_wanted_captured: true, mood: 5 } },
  { id: 'go_safe_place', cost: 2, preconditions: { in_danger: true }, effects: { in_danger: false, at_home: true } },
];

export function getActionsByIds(ids: string[]): GOAPAction[] {
  const map = new Map(GOAP_ACTIONS.map(a => [a.id, a]));
  return ids.map(id => map.get(id)).filter((a): a is GOAPAction => a !== undefined);
}
