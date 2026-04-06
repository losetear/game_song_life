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
  homeId?: number;           // 住所建筑ID
  workplaceId?: number;      // 工作地点建筑ID
  spouseId?: number;         // 配偶NPC ID
  parentIds?: number[];      // 父母NPC ID列表
  childIds?: number[];       // 子女NPC ID列表
  siblingIds?: number[];     // 兄弟姐妹NPC ID列表
}

export interface FamilyComponent {
  familyName: string;        // 姓氏
  familyId: number;          // 家族ID
  headId: number;            // 家长NPC ID
  members: number[];         // 家族成员NPC ID列表
  generation: number;        // 第几代
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

// NPC 需求组件（模拟人生式需求驱动）
export interface NeedsComponent {
  hunger: number;    // 0~100
  fatigue: number;   // 0~100 (100=精力充沛)
  health: number;    // 0~100
  mood: number;      // 0~100
  safety: number;    // 0~100
  social: number;    // 0~100
}

// NPC 行动状态组件
export interface ActionStateComponent {
  currentGoal: string | null;
  currentAction: string | null;
  actionQueue: string[];
  availableActions: string[];
  lastActionTurn: number;
  actionHistory: ActionRecord[];
}

export interface ActionRecord {
  turn: number;
  day: number;
  shichen: string;
  goalId: string;
  actionId: string;
  narrative: string;
}

// === 情绪系统组件 ===
export type EmotionType =
  | 'happy' | 'sad' | 'angry' | 'tense' | 'uncomfortable'
  | 'energized' | 'focused' | 'social' | 'bored';

export const EMOTION_NAMES: Record<EmotionType, string> = {
  happy: '快乐', sad: '悲伤', angry: '愤怒', tense: '紧张',
  uncomfortable: '不舒服', energized: '精神焕发', focused: '专注',
  social: '想社交', bored: '烦躁',
};

export interface EmotionComponent {
  current: EmotionType;
  intensity: number;        // 0-100
  ticksInEmotion: number;   // 连续处于该情绪的tick数
}

// === 心愿系统组件 ===
export interface Whim {
  id: string;
  name: string;
  relatedCategory: string;    // 关联行动类别
  relatedActionId?: string;   // 关联具体行动ID（可选）
  moodReward: number;         // 完成时 mood 加成
  expireTick: number;         // 过期 tick
}

export interface WhimComponent {
  whims: Whim[];
  lastRefreshTick: number;
}

// === 抱负系统组件 ===
export type AspirationType = 'wealth' | 'knowledge' | 'social' | 'family';

export const ASPIRATION_NAMES: Record<AspirationType, string> = {
  wealth: '财富', knowledge: '知识', social: '社交', family: '家庭',
};

export interface AspirationComponent {
  type: AspirationType;
  progress: number;
}

// === 每日计划组件 ===
export interface DailyPlanComponent {
  biases: Record<string, number>;  // category → bias (如 { work: 1.3, social: 0.8 })
  dayGenerated: number;
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
  Family: FamilyComponent;
  Needs: NeedsComponent;
  ActionState: ActionStateComponent;
  Emotion: EmotionComponent;
  Whim: WhimComponent;
  Aspiration: AspirationComponent;
  DailyPlan: DailyPlanComponent;
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
