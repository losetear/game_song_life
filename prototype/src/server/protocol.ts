// === 消息协议 ===

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
