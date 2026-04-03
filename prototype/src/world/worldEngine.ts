// === 核心引擎：一次 Tick 完整流程 ===

import { EntityManager } from '../ecs/entityManager';
import { WorldMap } from '../spatial/worldMap';
import { plan } from '../ai/goap/planner';
import { GOAP_ACTIONS } from '../ai/goap/actions';
import { WorldState } from '../ai/goap/worldState';
import { executeTree, BTContext, NodeStatus } from '../ai/behaviorTree/tree';
import { PROFESSION_TREES } from '../ai/behaviorTree/templates';
import { RegionSimulator } from '../ai/statistics/regionSim';
import { LODManager } from '../lod/lodManager';
import { TimeSystem } from './timeSystem';
import { VitalSystem } from './vitalSystem';
import { EconomySystem } from './economySystem';
import { PerceptionSystem } from './perceptionSystem';

export interface TickTimings {
  total: number;
  playerAction: number;
  l0GOAP: number;
  l1BehaviorTree: number;
  l2Statistics: number;
  economy: number;
  perception: number;
  vitalDecay: number;
  assemble: number;
}

export interface TickResult {
  success: boolean;
  message: string;
  timings: TickTimings;
  perception: ReturnType<PerceptionSystem['getPerceptionData']>;
  worldState: {
    tick: number;
    shichen: string;
    day: number;
    season: string;
    prices: ReturnType<EconomySystem['getPrices']>;
  };
}

export class WorldEngine {
  readonly em: EntityManager;
  readonly worldMap: WorldMap;
  readonly time: TimeSystem;
  readonly vital: VitalSystem;
  readonly economy: EconomySystem;
  readonly perception: PerceptionSystem;
  readonly regionSim: RegionSimulator;
  readonly lod: LODManager;

  private l0Entities: number[] = [];  // GOAP NPC
  private l1Entities: number[] = [];  // 行为树 NPC

  constructor() {
    this.em = new EntityManager();
    this.worldMap = new WorldMap();
    this.time = new TimeSystem();
    this.vital = new VitalSystem(this.em);
    this.economy = new EconomySystem();
    this.perception = new PerceptionSystem(this.em, this.worldMap);
    this.regionSim = new RegionSimulator();
    this.lod = new LODManager(this.em, this.worldMap, this.regionSim);
  }

  /** 注册 L0 实体 */
  registerL0(ids: number[]): void {
    this.l0Entities.push(...ids);
  }

  /** 注册 L1 实体 */
  registerL1(ids: number[]): void {
    this.l1Entities.push(...ids);
  }

  /** 执行玩家操作 → 完整 Tick */
  executePlayerAction(playerId: number, actionId: string, params: any): TickResult {
    const timings: TickTimings = {
      total: 0, playerAction: 0, l0GOAP: 0, l1BehaviorTree: 0,
      l2Statistics: 0, economy: 0, perception: 0, vitalDecay: 0, assemble: 0,
    };
    const startTotal = performance.now();

    // 1. 执行玩家操作
    let t0 = performance.now();
    const message = this.executeAction(playerId, actionId, params);
    timings.playerAction = performance.now() - t0;

    // 2. L0 GOAP 更新
    t0 = performance.now();
    this.updateL0();
    timings.l0GOAP = performance.now() - t0;

    // 3. L1 行为树更新
    t0 = performance.now();
    this.updateL1();
    timings.l1BehaviorTree = performance.now() - t0;

    // 4. L2 统计更新
    t0 = performance.now();
    if (this.time.isNewDay) {
      this.regionSim.update(this.time.season, 1.0);
    }
    timings.l2Statistics = performance.now() - t0;

    // 5. 经济系统
    t0 = performance.now();
    this.economy.update();
    timings.economy = performance.now() - t0;

    // 6. 生命衰减
    t0 = performance.now();
    this.vital.update();
    timings.vitalDecay = performance.now() - t0;

    // 7. 感知计算
    t0 = performance.now();
    const percData = this.perception.getPerceptionData(playerId);
    timings.perception = performance.now() - t0;

    // 8. 组装响应
    t0 = performance.now();
    timings.assemble = performance.now() - t0;

    // 时间推进
    this.time.advance();

    timings.total = performance.now() - startTotal;

    return {
      success: true,
      message,
      timings,
      perception: percData,
      worldState: {
        tick: this.time.tick,
        shichen: this.time.shichenName,
        day: this.time.day,
        season: this.time.season,
        prices: this.economy.getPrices(),
      },
    };
  }

  /** 执行简单行动 */
  private executeAction(playerId: number, actionId: string, params: any): string {
    const pos = this.em.getComponent(playerId, 'Position');
    const wallet = this.em.getComponent(playerId, 'Wallet');
    const vital = this.em.getComponent(playerId, 'Vital');
    const inventory = this.em.getComponent(playerId, 'Inventory');

    switch (actionId) {
      case 'buy_food': {
        if (!wallet || wallet.copper < 5) return '铜板不够';
        wallet.copper -= 5;
        if (vital) vital.hunger = Math.min(100, vital.hunger + 30);
        return '买了一个炊饼，吃了感觉好多了';
      }
      case 'go_market': {
        if (pos) {
          this.worldMap.moveEntity(playerId, 'east_market');
          pos.gridId = 'east_market';
          pos.areaId = 'city';
        }
        return '来到了东市';
      }
      case 'chat': {
        if (vital) vital.mood = Math.min(100, vital.mood + 5);
        return '和路人聊了几句';
      }
      case 'rest': {
        if (vital) {
          vital.fatigue = Math.min(100, vital.fatigue + 20);
          vital.hunger = Math.max(0, vital.hunger - 5);
        }
        return '休息了一会儿';
      }
      default:
        return `执行了 ${actionId}`;
    }
  }

  /** L0 GOAP 更新 */
  private updateL0(): void {
    for (const entityId of this.l0Entities) {
      if (!this.em.isAlive(entityId)) continue;
      const ai = this.em.getComponent(entityId, 'AI');
      if (!ai || ai.aiLevel !== 0) continue;
      if (ai.planCooldown > 0) { ai.planCooldown--; continue; }

      // 构建当前世界状态
      const state = this.buildGOAPState(entityId);
      const goal: WorldState = { hunger: 70 }; // 简化：生存目标

      const result = plan(state, goal, GOAP_ACTIONS);
      if (result.success) {
        ai.currentPlan = result.plan;
        ai.planCooldown = 3; // 3 ticks 冷却
        // 执行第一步
        if (result.plan.length > 0) {
          this.applyGOAPAction(entityId, result.plan[0]);
        }
      }
    }
  }

  /** 构建 GOAP 世界状态 */
  private buildGOAPState(entityId: number): WorldState {
    const vital = this.em.getComponent(entityId, 'Vital');
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const pos = this.em.getComponent(entityId, 'Position');
    const inventory = this.em.getComponent(entityId, 'Inventory');
    const identity = this.em.getComponent(entityId, 'Identity');

    const state: WorldState = {};
    if (vital) { state.hunger = vital.hunger; state.fatigue = vital.fatigue; state.mood = vital.mood; }
    if (wallet && wallet.copper > 0) state.has_money = true;
    if (pos) {
      state.at_home = pos.gridId === 'residential_north' || pos.gridId === 'residential_south';
      state.at_market = pos.gridId === 'east_market' || pos.gridId === 'west_market';
      state.at_shop = pos.gridId === 'cloth_shop';
      state.at_teahouse = pos.gridId === 'tea_house';
      state.at_dock = pos.gridId === 'dock';
      state.at_farm = pos.gridId === 'east_farm' || pos.gridId === 'south_farm';
      state.at_mountain = pos.gridId === 'shallow_mountain' || pos.gridId === 'deep_mountain';
    }
    if (inventory) {
      state.has_stock = inventory.items.some(i => i.itemType === 'goods' && i.amount > 0);
      state.has_food = inventory.items.some(i => i.itemType === 'food' && i.amount > 0);
      state.has_herbs = inventory.items.some(i => i.itemType === 'herbs' && i.amount > 0);
      state.has_weapon = inventory.items.some(i => i.itemType === 'weapon' && i.amount > 0);
      state.has_material = inventory.items.some(i => i.itemType === 'material' && i.amount > 0);
    }
    if (identity?.profession === 'guard') state.is_guard = true;

    state.near_people = true; // 简化
    state.has_friend = true;
    return state;
  }

  /** 应用 GOAP 行动效果 */
  private applyGOAPAction(entityId: number, actionId: string): void {
    const vital = this.em.getComponent(entityId, 'Vital');
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const action = GOAP_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    // 简化：直接应用效果
    if (vital) {
      if (action.effects.hunger && typeof action.effects.hunger === 'number') vital.hunger = Math.max(0, Math.min(100, vital.hunger + (action.effects.hunger as number)));
      if (action.effects.fatigue && typeof action.effects.fatigue === 'number') vital.fatigue = Math.max(0, Math.min(100, vital.fatigue + (action.effects.fatigue as number)));
      if (action.effects.mood && typeof action.effects.mood === 'number') vital.mood = Math.max(0, Math.min(100, vital.mood + (action.effects.mood as number)));
    }
    if (wallet && action.effects.copper && typeof action.effects.copper === 'number') {
      wallet.copper = Math.max(0, wallet.copper + (action.effects.copper as number));
    }
  }

  /** L1 行为树更新 */
  private updateL1(): void {
    for (const entityId of this.l1Entities) {
      if (!this.em.isAlive(entityId)) continue;
      const ai = this.em.getComponent(entityId, 'AI');
      if (!ai || ai.aiLevel !== 1) continue;

      const identity = this.em.getComponent(entityId, 'Identity');
      const profession = identity?.profession || 'merchant';
      const tree = PROFESSION_TREES[profession] || PROFESSION_TREES['merchant'];

      const ctx = this.buildBTContext(entityId);
      executeTree(tree, ctx);
    }
  }

  /** 构建行为树上下文 */
  private buildBTContext(entityId: number): BTContext {
    const vital = this.em.getComponent(entityId, 'Vital');
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const pos = this.em.getComponent(entityId, 'Position');
    const inventory = this.em.getComponent(entityId, 'Inventory');
    const identity = this.em.getComponent(entityId, 'Identity');

    return {
      entityId,
      hunger: vital?.hunger ?? 50,
      fatigue: 100 - (vital?.fatigue ?? 50),
      health: vital?.health ?? 80,
      mood: vital?.mood ?? 50,
      copper: wallet?.copper ?? 0,
      hasStock: inventory?.items.some(i => i.itemType === 'goods' && i.amount > 0) ?? false,
      hasFood: inventory?.items.some(i => i.itemType === 'food' && i.amount > 0) ?? false,
      hasHerbs: inventory?.items.some(i => i.itemType === 'herbs' && i.amount > 0) ?? false,
      hasWeapon: inventory?.items.some(i => i.itemType === 'weapon' && i.amount > 0) ?? false,
      isGuard: identity?.profession === 'guard',
      currentHour: this.time.hour,
      currentGrid: pos?.gridId ?? '',
    };
  }
}
