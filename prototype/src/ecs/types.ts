// === 组件类型定义 ===

export interface PositionComponent {
  x: number;
  y: number;
  areaId: string;
  gridId: string;
}

export interface VitalComponent {
  hunger: number;   // 0-100, 100=饱
  fatigue: number;  // 0-100, 100=精力充沛
  health: number;   // 0-100
  mood: number;     // 0-100
}

export interface IdentityComponent {
  name: string;
  profession: string;
  age: number;
  personality: string[];
  factionId?: number;        // 所属组织实体 ID
  factionRole?: 'leader' | 'member';  // 组织角色
}

export interface WalletComponent {
  copper: number;
}

export interface InventoryComponent {
  items: { itemType: string; amount: number }[];
}

export interface AIComponent {
  goals: string[];
  currentPlan: string[];
  planCooldown: number;
  aiLevel: 0 | 1 | 2; // 0=GOAP, 1=行为树, 2=统计
}

export interface MemoryComponent {
  recentEvents: { content: string; tick: number }[];
  impressions: Record<string, number>; // targetId → 好感度
}

export interface RelationsComponent {
  relations: Record<number, number>; // targetId → score
}

export interface GrowthComponent {
  stage: number;      // 0=种子, 1=幼苗, 2=成熟, 3=枯萎
  growProgress: number; // 0-100
  seasonReq: string;  // 春|夏|秋|冬
}

export interface ProduceComponent {
  itemType: string;
  interval: number;   // ticks
  amount: number;
}

export interface DurabilityComponent {
  max: number;
  current: number;
}

export interface BuildingComponent {
  type: string;
  ownerId: number;
  openHours: string; // e.g. "辰-酉"
}

export interface ActionPointsComponent {
  current: number;   // 当前行动点
  max: number;       // 每回合上限
}

export interface InteractableComponent {
  actions: string[];
  conditions: Record<string, any>;
}

export interface FactionComponent {
  name: string;
  type: 'government' | 'military' | 'merchant' | 'religion' | 'underground' | 'scholar';
  influence: number;      // 0-100
  treasury: number;       // 文
  members: number[];      // NPC ID列表
  leaderId: number;       // 首领NPC ID
  territory: string[];    // 控制的gridId
  relations: Record<number, number>; // 与其他组织的关系 (-100~100)
  mood: number;           // 组织士气 0-100
}

// 组件名 → 类型映射
export type ComponentTypeMap = {
  Position: PositionComponent;
  Vital: VitalComponent;
  Identity: IdentityComponent;
  Wallet: WalletComponent;
  Inventory: InventoryComponent;
  AI: AIComponent;
  Memory: MemoryComponent;
  Relations: RelationsComponent;
  Growth: GrowthComponent;
  Produce: ProduceComponent;
  Durability: DurabilityComponent;
  Building: BuildingComponent;
  ActionPoints: ActionPointsComponent;
  Interactable: InteractableComponent;
  Faction: FactionComponent;
};

export type ComponentName = keyof ComponentTypeMap;
export type ComponentOf<N extends ComponentName> = ComponentTypeMap[N];

// 实体类型枚举
export enum EntityType {
  NPC = 'npc',
  ANIMAL = 'animal',
  PLANT = 'plant',
  MINERAL = 'mineral',
  BUILDING = 'building',
  ITEM = 'item',
  FACTION = 'faction',
}
