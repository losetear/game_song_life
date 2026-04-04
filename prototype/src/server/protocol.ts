// === 消息协议 ===

// === 涌现式行为系统类型 ===

export interface InteractionContext {
  player: {
    vital: { hunger: number; fatigue: number; health: number; mood: number };
    wallet: { copper: number };
    inventory: { items: { itemType: string; amount: number }[] };
    ap: number;
    apMax: number;
    position: { gridId: string; areaId: string };
    memory: { recentEvents: { content: string; tick: number }[]; impressions: Record<string, number> };
  };
  target: {
    id: number;
    type: string;
    vital: { hunger: number; fatigue: number; health: number; mood: number } | null;
    wallet: { copper: number } | null;
    identity: { name: string; profession: string; age: number; personality: string[] } | null;
    position: { gridId: string; areaId: string } | null;
    ai: { goals: string[]; currentPlan: string[]; planCooldown: number; aiLevel: 0 | 1 | 2 } | null;
    memory: { recentEvents: { content: string; tick: number }[]; impressions: Record<string, number> } | null;
    growth: { stage: number; growProgress: number; seasonReq: string } | null;
    building: { type: string; ownerId: number; openHours: string } | null;
  };
  world: {
    weather: string;
    season: string;
    shichen: string;
    prices: Record<string, number>;
    nearbyEntities: { id: number; type: string }[];
    causalEvents: { cause: string; effect: string; tick: number }[];
    tick: number;
  };
}

export interface ActionRule {
  id: string;
  name: string;
  icon: string;
  apCost: number;
  shouldAppear: (ctx: InteractionContext) => boolean;
  canExecute: (ctx: InteractionContext) => { met: boolean; reason: string };
  describeEffects: (ctx: InteractionContext) => string;
  execute?: (ctx: InteractionContext) => any;
}

export interface EntityAction {
  id: string;
  name: string;
  icon: string;
  apCost: number;
  conditions: { met: boolean; reason: string };
  effects: string;
}

export interface ClientMessage {
  type: 'action';
  actionId: string;
  params: Record<string, any>;
  seqId: number;
}

export interface SceneOption {
  id: string;
  icon: string;
  text: string;
  cost?: number;        // 铜钱花费
  costLabel?: string;   // 显示文本如 "5文"
  desc?: string;        // 选项描述
}

export interface ServerMessage {
  type: 'actionResult' | 'error' | 'welcome' | 'benchmarkResult';
  seqId?: number;
  data?: {
    message?: string;
    sceneDescription?: string;   // 古风场景描述文本
    sceneLocation?: string;      // 当前位置名
    options?: SceneOption[];     // 可选行动
    npcMessages?: string[];      // NPC 对话
    worldState?: {
      tick: number;
      shichen: string;
      day: number;
      season: string;
      weather: string;
      weatherDesc: string;
      prices: Record<string, number>;
    };
    perception?: any;
    playerState?: {
      hunger: number;
      fatigue: number;
      health: number;
      mood: number;
      copper: number;
      ap?: number;
      apMax?: number;
    };
    turnSummary?: {
      shichen: string;
      day: number;
      events: number;
      npcActions: number;
      priceChanges: Record<string, string>;
      weather: string;
      weatherDesc: string;
    };
    distantNews?: { message: string; cause: string; source: string }[];
    briefing?: TurnBriefing;
  };
  timings?: {
    total: number;
    l0GOAP: number;
    l1BehaviorTree: number;
    l2Statistics: number;
    economy: number;
    perception: number;
    vitalDecay: number;
    playerAction: number;
    assemble: number;
  };
}

// === 回合简报 ===
export interface TurnBriefing {
  weather: {
    current: string;
    description: string;
    changed: boolean;
    previous?: string;
  };
  time: {
    shichen: string;
    day: number;
  };
  worldEvents: {
    total: number;
    categories: {
      weather: string[];
      npc_action: string[];
      economy: string[];
      ecology: string[];
      politics: string[];
    };
  };
  nearby: {
    npcActions: string[];
    environment: string;
  };
  distantNews: {
    message: string;
    cause: string;
    source: string;
  }[];
  priceChanges: {
    item: string;
    change: string;
    reason: string;
  }[];
}

export interface BenchmarkReport {
  timestamp: string;
  results: BenchmarkItem[];
  summary: { passed: number; failed: number; total: number };
}

export interface BenchmarkItem {
  id: number;
  name: string;
  target: string;
  actual: number;
  unit: string;
  passed: boolean;
  detail?: string;
}
