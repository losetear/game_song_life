// --- MVP 组件定义 ---

export interface PositionComponent {
  locationId: string;
}

export interface VitalComponent {
  hunger: number;   // 0-100, 100=饱
  fatigue: number;  // 0-100, 100=精力充沛
  health: number;   // 0-100, 0=死亡
  mood: number;     // 0-100
}

export interface IdentityComponent {
  name: string;
  profession: string;
  age: number;
  personality: string[];  // 性格标签
  origin?: string;        // 出身（仅玩家）
  isPlayer?: boolean;
}

export interface WalletComponent {
  copper: number;  // 文钱
}

export interface ActionPointsComponent {
  current: number;
  max: number;
}

export interface NeedsComponent {
  hunger: number;
  fatigue: number;
  health: number;
  mood: number;
  social: number;
}

export interface MemoryComponent {
  recentEvents: EventRecord[];
  impressions: Record<number, number>;  // targetId -> 好感度 (-100~100)
  narrativeTags: string[];
  choiceHistory: string[];  // 过去做过的选择ID
}

export interface EventRecord {
  day: number;
  text: string;
}

export interface ActionStateComponent {
  lastActionId: string | null;
  actionHistory: string[];  // 最近5个行动ID（重复惩罚用）
}

export interface NpcScheduleComponent {
  schedule: Record<string, string>;  // 时段 -> locationId
}

// --- 类型映射 ---

export type ComponentTypeMap = {
  Position: PositionComponent;
  Vital: VitalComponent;
  Identity: IdentityComponent;
  Wallet: WalletComponent;
  ActionPoints: ActionPointsComponent;
  Needs: NeedsComponent;
  Memory: MemoryComponent;
  ActionState: ActionStateComponent;
  NpcSchedule: NpcScheduleComponent;
};

export type ComponentName = keyof ComponentTypeMap;
export type ComponentOf<N extends ComponentName> = ComponentTypeMap[N];

export enum EntityType {
  PLAYER = 'player',
  NPC = 'npc',
}
