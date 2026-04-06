// === 核心引擎：一次 Tick 完整流程 ===

import { EntityManager } from '../ecs/entityManager';
import { WorldMap } from '../spatial/worldMap';
import { plan } from '../ai/goap/planner';
import { GOAP_ACTIONS } from '../ai/goap/actions';
import { WorldState } from '../ai/goap/worldState';
import { executeTree, BTContext } from '../ai/behaviorTree/tree';
import { PROFESSION_TREES } from '../ai/behaviorTree/templates';
import { RegionSimulator } from '../ai/statistics/regionSim';
import { LODManager } from '../lod/lodManager';
import { TimeSystem } from './timeSystem';
import { VitalSystem } from './vitalSystem';
import { EconomySystem } from './economySystem';
import { PerceptionSystem } from './perceptionSystem';
import { WeatherSystem } from './weatherSystem';
import { EventEngine, CausalEvent } from './eventEngine';
import { SceneOption, TurnBriefing } from '../server/protocol';
import { VitalComponent, WalletComponent, PositionComponent, NeedsComponent, ActionStateComponent, ActionRecord, EmotionComponent, WhimComponent, AspirationComponent, DailyPlanComponent, EmotionType, AspirationType } from '../ecs/types';
import { decide, DecisionContext, DecisionResult, decideWithScene, NearbyNpcInfo } from '../ai/decisionEngine';
import { updateEmotionComponent, EMOTION_CATEGORY_BIAS } from '../ai/emotionSystem';
import { generateWhims, shouldRefreshWhims, checkWhimCompletion } from '../ai/whimSystem';
import { ASPIRATION_CATEGORY_BIAS, getDefaultAspiration } from '../ai/aspirationSystem';
import { InteractionContext } from '../server/protocol';
import { getEmergentActions, executeEmergentAction } from './emergenceRules';
import { MAP_CONNECTIONS, GRID_NAMES, GRID_ICONS } from './mapData';
import { FactionComponent, HiddenTraitsComponent } from '../ecs/types';
import { RelationshipSystem } from '../ai/relationshipSystem';
import { StressMemorySystem, getStressEffects } from '../ai/stressMemorySystem';
import { ChainReactionEngine } from '../world/chainReactionEngine';
import { generateNarrativeFragment, NarrativeContext } from '../ai/narrativeFragments';

// === 重大事件 ===
export interface MajorEvent {
  type: 'weather' | 'economy' | 'ecology' | 'npc' | 'player';
  title: string;
  detail: string;
  impact: 'critical' | 'important' | 'minor';
}

// === L0 NPC 行动结果 ===
interface L0ActionResult {
  npcName: string;
  action: string;
  result: string;
  majorEvents: MajorEvent[];
}

// === 世界事件日志（含因果链） ===
export interface WorldEvent {
  tick: number;
  time: string;       // ISO timestamp
  type: 'npc' | 'player' | 'economy' | 'state' | 'move' | 'weather' | 'ecology' | 'international' | 'national' | 'regional' | 'propagation' | 'scene';
  category: string;   // 子分类
  message: string;    // 描述
  cause?: string;     // 因果标记（触发原因）
  source?: string;    // 来源NPC名
  target?: string;    // 目标NPC名（双人演出时）
}

// === NPC 行为历史记录 ===
export interface NPCHistoryEntry {
  tick: number;
  shichen: string;
  action: string;
  description: string;
  result: string;
  cause: string;
  stateBefore: { hunger: number; fatigue: number; copper: number; mood: number };
  stateAfter: { hunger: number; fatigue: number; copper: number; mood: number };
}

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
  sceneDescription: string;
  sceneLocation: string;
  options: SceneOption[];
  npcMessages: string[];
  timings: TickTimings;
  perception: ReturnType<PerceptionSystem['getPerceptionData']>;
  worldState: {
    tick: number;
    shichen: string;
    day: number;
    season: string;
    weather: string;
    weatherDesc: string;
    prices: Record<string, number>;
  };
  playerState: {
    hunger: number;
    fatigue: number;
    health: number;
    mood: number;
    copper: number;
    ap: number;
    apMax: number;
  };
  turnSummary: {
    shichen: string;
    day: number;
    tick: number;
    // L0 NPC 具体行动
    l0Actions: { npcName: string; action: string; result: string }[];
    // L1 批量行动摘要
    l1Summary: { total: number; highlights: string[] };
    // 重大事件（分等级）
    majorEvents: MajorEvent[];
    // 环境变化
    weatherChange: string | null;
    priceChanges: Record<string, { change: string; reason: string }>;
    // 统计
    totalEvents: number;
    npcActions: number;
    // 向后兼容旧字段
    weather: string;
    weatherDesc: string;
    events: number;
  };
  distantNews: { message: string; cause: string; source: string }[];
  briefing: TurnBriefing;
}

// ============================================================
// 场景模板系统 — 古风文字描述
// ============================================================

interface SceneTemplate {
  locationName: string;
  getDescription: (ctx: SceneContext) => string;
  getOptions: (ctx: SceneContext) => SceneOption[];
}

interface SceneContext {
  shichen: string;
  day: number;
  season: string;
  hunger: number;
  fatigue: number;
  copper: number;
  prices: Record<string, number>;
  weather: string;
  weatherDesc: string;
  causalEvents: CausalEvent[];  // 本回合因果事件
}

const NPC_NAMES = ['王掌柜', '刘寡妇', '张三', '李大夫', '赵秀才', '陈猎户', '孙铁匠', '周嫂子'];

function pickNPC(): string {
  return NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
}

const CHATTER_TEMPLATES = [
  '有人在小声议论着粮价的涨跌。',
  '远处传来小贩的吆喝声："炊饼——热乎的炊饼——"',
  '街角几个老人正在下棋，围观的人比下棋的多。',
  '一个卖花的姑娘挑着担子走过，花香飘了一街。',
  '城墙根下有个算命先生在摇头晃脑。',
  '两个小贩在为摊位的事争吵。',
  '一群孩子追逐嬉闹，从你身边跑过。',
  '有个书生在墙上题诗，引来几个人围观。',
  '一支驼队缓缓从街头走过，驼铃声叮叮当当。',
  '一个耍猴人敲着锣，猴子翻着跟头。',
];

function pickChatter(): string {
  return CHATTER_TEMPLATES[Math.floor(Math.random() * CHATTER_TEMPLATES.length)];
}

function seasonDesc(season: string): string {
  switch (season) {
    case 'spring': return '春风拂面，柳絮纷飞';
    case 'summer': return '夏日炎炎，蝉鸣不绝';
    case 'autumn': return '秋高气爽，落叶纷飞';
    case 'winter': return '寒风凛冽，呵气成霜';
    default: return '天朗气清';
  }
}

function timeAtmosphere(shichen: string): string {
  const map: Record<string, string> = {
    '子': '夜深人静，万籁俱寂',
    '丑': '更漏声残，街上空无一人',
    '寅': '天边微明，远处传来鸡鸣',
    '卯': '晨曦初照，早起的摊贩开始张罗',
    '辰': '朝霞满天，市井渐次热闹起来',
    '巳': '日上三竿，街上人流如织',
    '午': '午后的阳光透过街边的酒旗，在青石板上洒下斑驳光影',
    '未': '日影西斜，街上依旧热闹',
    '申': '夕阳西照，金光铺满青石路',
    '酉': '暮色渐浓，店家开始点起灯笼',
    '戌': '华灯初上，夜市的喧嚣渐起',
    '亥': '夜色已深，多数铺子已经打烊',
  };
  return map[shichen] || '街上人来人往';
}

const SCENE_TEMPLATES: Record<string, SceneTemplate> = {
  center_street: {
    locationName: '中心大街',
    getDescription: (ctx) => {
      const atm = timeAtmosphere(ctx.shichen);
      const season = seasonDesc(ctx.season);
      const chatter = pickChatter();
      let extra = '';
      if (ctx.hunger < 30) extra = '\n\n你的肚子咕噜一声，饿得有点发慌。该找点东西吃了。';
      else if (ctx.fatigue < 30) extra = '\n\n你打了哈欠，眼皮有些沉重。该找个地方歇歇了。';
      return `${atm}。${season}，街上人来人往，小贩的吆喝声此起彼伏。远处飘来炊饼的香味。\n\n${chatter}${extra}\n\n—— 你站在中心大街上，该做点什么呢？`;
    },
    getOptions: (ctx) => {
      const opts: SceneOption[] = [
        { id: 'buy_food', icon: '🫓', text: '买炊饼', cost: 5, costLabel: '5文', desc: '炊饼铺的老板娘笑盈盈地看着你' },
        { id: 'go_east_market', icon: '🏪', text: '去东市逛逛', desc: '听说东市今天到了新货' },
        { id: 'go_tea_house', icon: '🍵', text: '去清风茶楼', cost: 2, costLabel: '2文', desc: '茶馆里传来醒木拍桌的声音' },
        { id: 'go_dock', icon: '⚓', text: '去码头看看', desc: '听说来了不少货船' },
      ];
      if (ctx.copper >= 5) {
        opts.push({ id: 'go_residential', icon: '🏠', text: '回家歇息', desc: '家中虽简陋，却能安身' });
      }
      opts.push({ id: 'chat', icon: '💬', text: '和路人闲聊', desc: '旁边一个书生模样的人在踱步' });
      return opts;
    },
  },
  east_market: {
    locationName: '东市',
    getDescription: (ctx) => {
      const atm = timeAtmosphere(ctx.shichen);
      const chatter = pickChatter();
      return `${atm}。东市热闹非凡，各色店铺鳞次栉比。布庄门口挂着各色绸缎，药铺飘出草药的苦香。几个小贩推着板车在叫卖。\n\n${chatter}\n\n—— 你在东市，想去哪家店铺看看？`;
    },
    getOptions: (ctx) => [
      { id: 'enter_cloth_shop', icon: '👘', text: '进锦绣布庄', desc: '"客官，新到的苏绣！"' },
      { id: 'enter_pharmacy', icon: '🌿', text: '去济世堂', desc: '药铺老掌柜正在称量草药' },
      { id: 'chat_market', icon: '🤝', text: '打听消息', desc: '茶摊边几个人在低声议论什么' },
      { id: 'go_center', icon: '🚶', text: '回中心大街', desc: '' },
    ],
  },
  tea_house: {
    locationName: '清风茶楼',
    getDescription: (ctx) => {
      const npc = pickNPC();
      return `茶楼内烟雾缭绕，说书先生正在讲《水浒传》的一段。几个茶客边喝边议论着城里近日的物价。\n\n角落里${npc}在独自品茶，见你进来微微点头。\n\n说书先生一拍醒木："话说那武松打虎…"满堂喝彩。\n\n—— 你在清风茶楼，想做什么？`;
    },
    getOptions: (ctx) => [
      { id: 'drink_tea', icon: '🍵', text: '叫壶龙井', cost: 3, costLabel: '3文', desc: '"小二，来壶龙井！"' },
      { id: 'listen_rumor', icon: '👂', text: '偷听闲话', desc: '邻桌的人在说布价涨了的事' },
      { id: 'talk_npc', icon: '👤', text: `和${pickNPC()}攀谈`, desc: '看起来知道不少事' },
      { id: 'go_center', icon: '🚶', text: '离开茶楼', desc: '' },
    ],
  },
  cloth_shop: {
    locationName: '锦绣布庄',
    getDescription: (ctx) => {
      return `你推开布庄的门，里面挂满了各色绸缎布匹。\n\n王掌柜正在柜台后面拨算盘，抬头看到你，露出一丝笑容。\n\n"哟，稀客啊！今天想看点什么？"\n\n架上有：粗麻布、细棉布、青绸。角落里还堆着一匹泛黄的苏绣残片。\n\n—— 你在锦绣布庄，王掌柜等着你开口。`;
    },
    getOptions: (ctx) => {
      const opts: SceneOption[] = [];
      if (ctx.copper >= 50) opts.push({ id: 'buy_hemp', icon: '🧵', text: '买粗麻布', cost: 5, costLabel: '50文', desc: '粗糙但结实，做衣裳够用' });
      else opts.push({ id: 'buy_hemp', icon: '🧵', text: '买粗麻布', cost: 50, costLabel: '50文', desc: '粗糙但结实' });
      if (ctx.copper >= 200) opts.push({ id: 'buy_cotton', icon: '👘', text: '买细棉布', cost: 200, costLabel: '200文', desc: '上好的棉布，柔软透气' });
      else opts.push({ id: 'buy_cotton', icon: '👘', text: '买细棉布', cost: 200, costLabel: '200文', desc: '上好的棉布' });
      opts.push(
        { id: 'ask_silk', icon: '❓', text: '问苏绣残片', desc: '角落里那匹泛黄的绣品' },
        { id: 'chat_shopkeeper', icon: '💬', text: '和王掌柜闲聊', desc: '"最近生意不太好做啊…"' },
        { id: 'leave_cloth_shop', icon: '🚶', text: '离开布庄', desc: '' },
      );
      return opts;
    },
  },
  pharmacy: {
    locationName: '济世堂',
    getDescription: (ctx) => {
      return `济世堂里药香扑鼻，李大夫正在后堂碾药。伙计迎上来问你需要什么。\n\n柜台后面的药架上整整齐齐摆满了药匣，每个匣子上贴着手写的标签。\n\n"客官哪里不舒服？还是来买点常备药？"\n\n—— 你在济世堂药铺。`;
    },
    getOptions: (ctx) => [
      { id: 'buy_cold_medicine', icon: '💊', text: '买风寒散', cost: 30, costLabel: '30文', desc: '治风寒感冒' },
      { id: 'buy_wound_medicine', icon: '🩹', text: '买金创药', cost: 50, costLabel: '50文', desc: '治外伤' },
      { id: 'see_doctor', icon: '👨‍⚕️', text: '找李大夫看病', cost: 20, costLabel: '20文', desc: '望闻问切' },
      { id: 'chat_pharmacy', icon: '💬', text: '和伙计闲聊', desc: '"最近药材涨了不少…"' },
      { id: 'leave_pharmacy', icon: '🚶', text: '离开药铺', desc: '' },
    ],
  },
  dock: {
    locationName: '汴河码头',
    getDescription: (ctx) => {
      const chatter = pickChatter();
      return `汴河码头上停泊着大大小小的货船。纤夫们喊着号子，把船往上游拉。码头上堆满了麻袋和木箱。\n\n河水波光粼粼，远处一座石桥横跨两岸。一条大船刚靠岸，工人们正在卸货。\n\n${chatter}\n\n—— 你在汴河码头。`;
    },
    getOptions: (ctx) => [
      { id: 'carry_cargo', icon: '💪', text: '扛包打工', desc: '出力挣钱' },
      { id: 'chat_foreman', icon: '💬', text: '和管事闲聊', desc: '管事拿着簿子在记数' },
      { id: 'go_center', icon: '🚶', text: '回中心大街', desc: '' },
    ],
  },
  residential: {
    locationName: '家中',
    getDescription: (ctx) => {
      let desc = '你回到自己那间简陋的小屋。一张旧床，一张瘸腿的桌子，墙角放着几个木箱。窗外能听到邻家孩子的笑声。\n\n';
      if (ctx.fatigue < 50) desc += '你确实有些累了，躺一会儿吧。';
      else desc += '虽然简陋，但到底是自己的窝，心里踏实。';
      desc += '\n\n—— 你在家中。';
      return desc;
    },
    getOptions: (ctx) => [
      { id: 'sleep', icon: '😴', text: '睡觉', desc: '好好休息一觉' },
      { id: 'eat_home', icon: '🍚', text: '吃饭', desc: '家里还有些剩饭' },
      { id: 'check_storage', icon: '📦', text: '查看存物箱', desc: '翻翻家里的家当' },
      { id: 'go_center', icon: '🚶', text: '出门', desc: '' },
    ],
  },
};

export class WorldEngine {
  readonly em: EntityManager;
  readonly worldMap: WorldMap;
  readonly time: TimeSystem;
  readonly vital: VitalSystem;
  readonly economy: EconomySystem;
  readonly perception: PerceptionSystem;
  readonly regionSim: RegionSimulator;
  readonly lod: LODManager;
  readonly weather: WeatherSystem;
  readonly eventEngine: EventEngine;

  private l0Entities: number[] = [];  // GOAP NPC
  private l1Entities: number[] = [];  // 行为树 NPC
  private factions: Map<number, FactionComponent> = new Map();
  private lastTickEvents = 0;
  private previousWeather: string = '晴';

  // 世界事件环形缓冲区
  private eventLog: WorldEvent[] = [];
  private readonly maxEvents = 500;
  readonly startTime: number = Date.now();

  // NPC 行为历史记录（L0 NPC）
  private npcHistory: Map<number, NPCHistoryEntry[]> = new Map();

  // 涌现叙事系统
  private relationshipSys: RelationshipSystem;
  private stressMemorySys: StressMemorySystem;
  private chainReactionEngine: ChainReactionEngine;

  // 天气事件传播链
  private propagationChains: { message: string; source: string; spreadRadius: number; tick: number; cause: string; active: boolean }[] = [];

  constructor() {
    this.em = new EntityManager();
    this.worldMap = new WorldMap();
    this.time = new TimeSystem();
    this.vital = new VitalSystem(this.em);
    this.economy = new EconomySystem();
    this.perception = new PerceptionSystem(this.em, this.worldMap);
    this.regionSim = new RegionSimulator();
    this.lod = new LODManager(this.em, this.worldMap, this.regionSim);
    this.weather = new WeatherSystem();
    this.eventEngine = new EventEngine();

    // 涌现叙事系统初始化
    this.relationshipSys = new RelationshipSystem(this.em);
    this.stressMemorySys = new StressMemorySystem(this.em);
    this.chainReactionEngine = new ChainReactionEngine(this.em, this.relationshipSys, this.stressMemorySys);
  }

  /** 记录世界事件 */
  logEvent(type: WorldEvent['type'], category: string, message: string): void {
    const evt: WorldEvent = {
      tick: this.time.tick,
      time: new Date().toISOString(),
      type,
      category,
      message,
    };
    if (this.eventLog.length >= this.maxEvents) {
      this.eventLog.shift();
    }
    this.eventLog.push(evt);
  }

  /** 获取最近 N 条事件 */
  getEvents(count: number = 50): WorldEvent[] {
    return this.eventLog.slice(-count);
  }

  /** 获取指定回合事件 */
  getEventsByTick(tick: number): WorldEvent[] {
    if (tick === 0) {
      const latestTick = this.eventLog.length > 0 ? this.eventLog[this.eventLog.length - 1].tick : 0;
      return this.eventLog.filter(e => e.tick === latestTick);
    }
    return this.eventLog.filter(e => e.tick === tick);
  }

  /** 获取当前最新 tick */
  getCurrentTick(): number {
    return this.time.tick;
  }

  /** 获取 NPC 行为历史 */
  getNPCHistory(npcId: number): NPCHistoryEntry[] {
    return this.npcHistory.get(npcId) || [];
  }

  /** 获取 NPC 关系图谱 */
  getNPCRelations(npcId: number): { targetId: number; targetName: string; score: number }[] {
    const relations = this.em.getComponent(npcId, 'Relations');
    if (!relations) return [];
    const result: { targetId: number; targetName: string; score: number }[] = [];
    for (const [targetId, score] of Object.entries(relations.relations || {})) {
      const identity = this.em.getComponent(Number(targetId), 'Identity');
      result.push({ targetId: Number(targetId), targetName: identity?.name || '未知', score: score as number });
    }
    return result;
  }

  /** 获取所有 L0 NPC 列表 */
  getL0Entities(): number[] {
    return [...this.l0Entities];
  }

  /** 获取传播链 */
  getPropagationChains(): { message: string; source: string; spreadRadius: number; tick: number; cause: string; active: boolean }[] {
    return [...this.propagationChains];
  }

  /** 获取经济全景数据 */
  getEconomyOverview(): {
    prices: Record<string, number>;
    supplyDemand: Record<string, { supply: number; demand: number }>;
    priceHistory: Record<string, number[]>;
    recentChanges: { item: string; change: string; reason: string }[];
  } {
    const supplyDemand: Record<string, { supply: number; demand: number }> = {};
    const supply = this.economy.getSupply();
    const demand = this.economy.getDemand();
    for (const key of Object.keys(supply)) {
      supplyDemand[key] = { supply: supply[key], demand: demand[key] };
    }
    return {
      prices: this.economy.getPrices(),
      supplyDemand,
      priceHistory: this.economy.getPriceHistory(),
      recentChanges: this.economy.getRecentChanges(),
    };
  }

  /** 获取生态全景数据 */
  getEcologyOverview(): {
    regions: Record<string, { production?: number; normal?: number; status: string; trend: string; animals?: number; capacity?: number; fishCatch?: number; tradeVolume?: number }>;
  } {
    const regions: Record<string, any> = {};
    for (const r of this.regionSim.getAllRegions()) {
      switch (r.regionType) {
        case 'farmland':
          regions[r.regionId] = {
            production: r.yieldAmount,
            normal: r.area * r.baseYield,
            status: r.yieldAmount < r.area * r.baseYield * 0.5 ? '欠收' : r.yieldAmount > r.area * r.baseYield * 1.2 ? '丰收' : '正常',
            trend: r.yieldAmount > r.area * r.baseYield * 0.8 ? '↑' : r.yieldAmount < r.area * r.baseYield * 0.5 ? '↓' : '→',
          };
          break;
        case 'mountain':
          regions[r.regionId] = {
            animals: r.wildAnimalCount,
            capacity: r.maxAnimal,
            status: r.wildAnimalCount < r.maxAnimal * 0.3 ? '稀少' : r.wildAnimalCount > r.maxAnimal * 0.7 ? '丰富' : '正常',
            trend: r.wildAnimalCount > r.maxAnimal * 0.5 ? '↑' : r.wildAnimalCount < r.maxAnimal * 0.3 ? '↓' : '→',
          };
          break;
        case 'river':
          regions[r.regionId] = {
            fishCatch: r.fishAmount,
            tradeVolume: r.fisherCount * 15,
            status: r.fishAmount < r.fishBase * 0.5 ? '偏低' : r.fishAmount > r.fishBase * 1.3 ? '丰收' : '正常',
            trend: r.fishAmount > r.fishBase * 0.8 ? '↑' : r.fishAmount < r.fishBase * 0.5 ? '↓' : '→',
          };
          break;
      }
    }
    return { regions };
  }

  /** 注册 L0 实体 */
  registerL0(ids: number[]): void {
    this.l0Entities.push(...ids);
  }

  /** 注册 L1 实体 */
  registerL1(ids: number[]): void {
    this.l1Entities.push(...ids);
  }

  /** 注册组织实体 */
  registerFactions(factions: { id: number; faction: FactionComponent }[]): void {
    for (const f of factions) this.factions.set(f.id, f.faction);
  }

  /** 获取所有组织 */
  getFactions(): Map<number, FactionComponent> {
    return this.factions;
  }

  /** 根据 NPC ID 查找其所属组织 */
  getNpcFaction(npcId: number): { id: number; name: string; role: string } | null {
    for (const [factionId, faction] of this.factions) {
      if (faction.leaderId === npcId) {
        return { id: factionId, name: faction.name, role: 'leader' };
      }
      if (faction.members.includes(npcId)) {
        return { id: factionId, name: faction.name, role: 'member' };
      }
    }
    return null;
  }

  /** 获取玩家的所有家庭成员ID列表 */
  private getFamilyMemberIds(identity: { spouseId?: number; parentIds?: number[]; childIds?: number[]; siblingIds?: number[] } | undefined): number[] {
    if (!identity) return [];
    const ids: number[] = [];
    if (identity.spouseId != null) ids.push(identity.spouseId);
    if (identity.parentIds) ids.push(...identity.parentIds);
    if (identity.childIds) ids.push(...identity.childIds);
    if (identity.siblingIds) ids.push(...identity.siblingIds);
    return ids;
  }

  /** 按名称查找组织 */
  getFactionByName(name: string): FactionComponent | undefined {
    for (const f of this.factions.values()) {
      if (f.name === name) return f;
    }
    return undefined;
  }

  /** 获取单个组织详情（含成员信息） */
  getFactionDetail(id: number): {
    faction: FactionComponent;
    memberInfo: { id: number; name: string; profession: string }[];
  } | null {
    const faction = this.factions.get(id);
    if (!faction) return null;
    const memberInfo = faction.members.map(mid => {
      const ident = this.em.getComponent(mid, 'Identity');
      return { id: mid, name: ident?.name || `NPC#${mid}`, profession: ident?.profession || '' };
    });
    return { faction, memberInfo };
  }

  /** 获取组织历史事件（与组织名相关的事件） */
  getFactionHistory(id: number, limit: number = 10): WorldEvent[] {
    const faction = this.factions.get(id);
    if (!faction) return [];
    const name = faction.name;
    const matched = this.eventLog.filter(e =>
      e.message.includes(name) || (e.category && e.category.includes(name))
    );
    return matched.slice(-limit);
  }

  /** 在 Tick 中生成事件 — 基于实体状态涌现 */
  private generateTickEvents(): void {
    const worldState = this.buildWorldState();
    const rules = this.getEventRules();
    const generated: Set<string> = new Set();

    for (const rule of rules) {
      try {
        if (rule.condition(worldState)) {
          const event = rule.generate(worldState);
          const key = `${event.type}:${event.message}`;
          if (!generated.has(key)) {
            this.logEvent(event.type, event.category, event.message);
            generated.add(key);
          }
        }
      } catch { continue; }
    }

    this.ensureMinimumEvents(worldState);
  }

  /** 构建世界状态快照 */
  private buildWorldState() {
    const day = this.time.day;
    const season = this.time.season;
    const weather = this.weather.weather;
    const prevWeather = this.previousWeather;

    const factionList: FactionComponent[] = [];
    for (const f of this.factions.values()) factionList.push(f);
    const factionByName = (name: string) => factionList.find(f => f.name === name);

    const prices = this.economy.getPrices();
    const basePrices: Record<string, number> = { food: 10, herbs: 15, cloth: 20, material: 8, cargo: 12 };

    const ecology = this.regionSim.getAllRegions();

    let totalMood = 0, totalHunger = 0, npcCount = 0;
    for (const id of this.l0Entities) {
      const vital = this.em.getComponent(id, 'Vital');
      if (vital) {
        totalMood += vital.mood;
        totalHunger += vital.hunger;
        npcCount++;
      }
    }
    const avgMood = npcCount > 0 ? totalMood / npcCount : 50;
    const avgHunger = npcCount > 0 ? totalHunger / npcCount : 50;

    return {
      tick: this.time.tick,
      day,
      season,
      weather: { weather, prevWeather, description: this.weather.getDescription() },
      factions: factionList,
      factionByName,
      economy: { prices, basePrices },
      ecology,
      npcSummary: { totalActions: this.l0Entities.length, avgMood, avgHunger },
    };
  }

  /** 涌现事件规则列表 */
  private getEventRules() {
    type WS = ReturnType<typeof this.buildWorldState>;
    type ET = WorldEvent['type'];

    const priceNames: Record<string, string> = { food: '粮', herbs: '药', cloth: '布', material: '材', cargo: '货' };

    interface EventRule {
      id: string;
      type: ET;
      category: string;
      condition: (ws: WS) => boolean;
      generate: (ws: WS) => { type: ET; category: string; message: string };
      priority: number;
    }

    const mk = (
      id: string, type: ET, category: string,
      condition: (ws: WS) => boolean,
      generate: (ws: WS) => { type: ET; category: string; message: string },
      priority = 0,
    ): EventRule => ({ id, type, category, condition, generate, priority });

    return [
      // ═══ 国际事件 ═══
      mk('intl_silk_road', 'international', '国际',
        (ws) => {
          const sp = ws.factionByName('市舶司');
          return !!(sp && sp.influence > 60 && ws.season !== 'winter');
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: `海上丝绸之路传来消息：泉州港到岸${Math.random() > 0.5 ? '三艘' : '五艘'}番船，货物堆积如山` }),
      ),
      mk('intl_trade_route', 'international', '国际',
        (ws) => {
          const mt = ws.factionByName('码头帮');
          return ws.season === 'autumn' && !!mt && mt.influence > 30;
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: `丝绸之路商队抵达汴京，带来${Math.random() > 0.5 ? '香料' : '琉璃器'}，东市商贩争相收购` }),
      ),
      mk('intl_tributary', 'international', '国际',
        (ws) => {
          const temple = ws.factionByName('大相国寺');
          return ws.day % 30 === 0 && !!temple && temple.influence > 50;
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: `高丽国遣使来朝，进贡${Math.random() > 0.5 ? '高丽参' : '白瓷器'}百箱` }),
      ),
      mk('intl_border', 'international', '国际',
        (ws) => {
          const army = ws.factionByName('禁军');
          return !!army && army.treasury < 20000;
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: '边境军饷不足，消息传来引发朝野议论' }),
      ),
      mk('intl_border_conflict', 'international', '国际',
        (ws) => {
          const army = ws.factionByName('禁军');
          const sm = ws.factionByName('枢密院');
          return (!!army && army.mood < 30) || (!!sm && sm.influence > 90);
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: `西夏边境传来消息：${Math.random() > 0.5 ? '边境小规模摩擦，商旅暂缓' : '两国互市恢复正常'}` }),
      ),
      mk('intl_peace_treaty', 'international', '国际',
        (ws) => {
          const sm = ws.factionByName('枢密院');
          const army = ws.factionByName('禁军');
          return !!sm && !!army && sm.mood > 70 && army.mood > 60;
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: '枢密院与禁军联合上奏：边境安定，请允通商' }),
      ),
      mk('intl_famine_relief', 'international', '国际',
        (ws) => {
          const hb = ws.factionByName('户部');
          const farmYield = ws.weather.weather === '暴雨' || ws.season === 'winter';
          return !!hb && hb.treasury > 50000 && farmYield;
        },
        () => ({ type: 'international' as ET, category: '国际',
          message: '朝廷拨银赈济受灾州县，户部调度粮草北上' }),
      ),
      // 国际 fallback
      mk('intl_fallback', 'international', '国际',
        () => true,
        (ws) => {
          const fallbacks = [
            `辽国使团抵达汴京，带来上等貂皮${Math.random() > 0.5 ? '与人参' : ''}作为贡品`,
            `大理国进献良马${Math.floor(Math.random() * 200) + 100}匹，充入御马监`,
            '金国使者请求增加互市口岸，朝堂上争论不休',
            '吐蕃商队经川蜀入京，带来药材和毛毡',
            `天竺僧人游历至汴京，在相国寺开坛讲经${Math.random() > 0.5 ? '，听者如云' : ''}`,
            `占城国进贡占城稻种${Math.floor(Math.random() * 50) + 30}石，交司农寺试种`,
            '日本商船在明州靠岸，带来折扇和铜器，换走丝绸和茶叶',
            ws.season === 'winter' ? '北方大雪，辽国边境封锁，商旅断绝' : '南方驿站传报：安南国遣使入贡',
          ];
          return { type: 'international' as ET, category: '国际', message: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
        },
      ),

      // ═══ 国家事件 ═══
      mk('nat_tax', 'national', '国家',
        (ws) => ws.day % 15 === 0,
        (ws) => {
          const hb = ws.factionByName('户部');
          const trend = hb && hb.treasury > 80000 ? '丰盈' : '吃紧';
          return { type: 'national' as ET, category: '国家',
            message: `户部奏报：国库${trend}，${Math.random() > 0.5 ? '减免今年秋税两成' : '加强税收征管'}` };
        },
      ),
      mk('nat_exam', 'national', '国家',
        (ws) => {
          const tx = ws.factionByName('太学');
          return ws.day % 60 === 30 && !!tx && tx.influence > 40;
        },
        () => ({ type: 'national' as ET, category: '国家',
          message: `科举消息：${Math.random() > 0.5 ? '今年恩科定于八月举行' : '太学扩招，各地学子纷纷入京'}` }),
      ),
      mk('nat_military', 'national', '国家',
        (ws) => {
          const army = ws.factionByName('禁军');
          return !!army && (army.mood < 40 || army.influence > 85);
        },
        (ws) => ({ type: 'national' as ET, category: '国家',
          message: `禁军${ws.factionByName('禁军')!.mood < 40 ? '士气低落，将士怨声载道' : '换防，京城各门甲士增派一倍'}` }),
      ),
      mk('nat_justice', 'national', '国家',
        (ws) => {
          const kf = ws.factionByName('开封府');
          return !!kf && kf.influence > 60 && Math.random() > 0.3;
        },
        () => ({ type: 'national' as ET, category: '国家',
          message: `开封府尹巡视城内治安，${Math.random() > 0.5 ? '查处三家违规商铺' : '嘉奖巡城甲士'}` }),
      ),
      mk('nat_food_reserve', 'national', '国家',
        (ws) => {
          const hb = ws.factionByName('户部');
          return !!hb && hb.treasury > 80000;
        },
        () => ({ type: 'national' as ET, category: '国家',
          message: `户部清查各地粮仓：${Math.random() > 0.5 ? '江南粮仓充裕' : '河北数州粮仓亏空，紧急调拨'}` }),
      ),
      mk('nat_imperial_decree', 'national', '国家',
        (ws) => ws.day % 7 === 0,
        () => ({ type: 'national' as ET, category: '国家',
          message: `朝廷颁布新令：${Math.random() > 0.5 ? '减免今年秋税两成' : '加强市舶司管理，严查走私'}` }),
      ),
      mk('nat_astrology', 'national', '国家',
        () => Math.random() > 0.8,
        () => ({ type: 'national' as ET, category: '国家',
          message: `司天监上奏：${Math.random() > 0.5 ? '星象示吉，今年丰收可期' : '近日天象有异，宜斋戒祈福'}` }),
      ),
      mk('nat_infrastructure', 'national', '国家',
        (ws) => {
          const hb = ws.factionByName('户部');
          return !!hb && hb.treasury > 60000 && Math.random() > 0.5;
        },
        () => ({ type: 'national' as ET, category: '国家',
          message: `工部征调民夫修缮黄河堤坝，预计${Math.floor(Math.random() * 3) + 2}月完工` }),
      ),
      mk('nat_anticorruption', 'national', '国家',
        (ws) => {
          const kf = ws.factionByName('开封府');
          return !!kf && kf.mood < 30;
        },
        () => ({ type: 'national' as ET, category: '国家',
          message: `御史台弹劾${Math.random() > 0.5 ? '两江转运使贪墨' : '某知州纵容豪强'}` }),
      ),
      mk('nat_fallback', 'national', '国家',
        () => true,
        (ws) => {
          const msgs = [
            `枢密院奏报：${Math.random() > 0.5 ? '西北边军增兵三千' : '水军在长江操练完毕'}`,
            `翰林院编修完成《${Math.random() > 0.5 ? '太平寰宇记' : '册府元龟'}》新卷`,
            `三司使奏报：本年度税收${Math.random() > 0.5 ? '较去年增长一成' : '与去年持平'}`,
            ws.season === 'winter' ? '朝廷拨银赈济北方受灾州县' : '太医局配发暑药，分送京城各坊',
          ];
          return { type: 'national' as ET, category: '国家', message: msgs[Math.floor(Math.random() * msgs.length)] };
        },
      ),

      // ═══ 地区事件 ═══
      mk('reg_market', 'regional', '地区',
        (ws) => {
          const ds = ws.factionByName('东市商会');
          return !!ds && ds.influence > 50;
        },
        () => ({ type: 'regional' as ET, category: '地区',
          message: `东市今日${Math.random() > 0.5 ? '人声鼎沸，商贩云集' : '略显冷清，传闻有官差巡查'}` }),
      ),
      mk('reg_dock', 'regional', '地区',
        (ws) => {
          const mt = ws.factionByName('码头帮');
          const sp = ws.factionByName('市舶司');
          return !!mt && mt.members.length >= 3 && !!sp && sp.influence > 30;
        },
        () => ({ type: 'regional' as ET, category: '地区',
          message: `汴河码头${Math.random() > 0.5 ? '到岸粮船数十艘，卸货忙碌' : '今日无大船到港'}` }),
      ),
      mk('reg_temple', 'regional', '地区',
        (ws) => {
          const temple = ws.factionByName('大相国寺');
          return !!temple && temple.influence > 50 && ws.day % 7 === 0;
        },
        () => ({ type: 'regional' as ET, category: '地区',
          message: `大相国寺庙会${Math.random() > 0.5 ? '热闹非凡，百戏杂耍齐上' : '僧人做法事，信众络绎不绝'}` }),
      ),
      mk('reg_crime', 'regional', '地区',
        (ws) => {
          const gb = ws.factionByName('丐帮分舵');
          const mt = ws.factionByName('码头帮');
          return (!!gb && gb.influence > 30) || (!!mt && mt.mood < 20);
        },
        () => ({ type: 'regional' as ET, category: '地区',
          message: `南坊住宅区${Math.random() > 0.5 ? '有邻里因宅基纠纷报官' : '街头出现扒手，巡城甲士已接到报官'}` }),
      ),
      mk('reg_residential', 'regional', '地区',
        (ws) => ws.npcSummary.avgMood < 40,
        () => ({ type: 'regional' as ET, category: '地区',
          message: `坊间百姓情绪低落，${Math.random() > 0.5 ? '茶余饭后多抱怨物价' : '街面行人面带愁容'}` }),
      ),
      mk('reg_construction', 'regional', '地区',
        () => Math.random() > 0.6,
        () => ({ type: 'regional' as ET, category: '地区',
          message: `府衙门前${Math.random() > 0.5 ? '告状者排成长队' : '张贴了新的告示'}` }),
      ),
      mk('reg_fallback', 'regional', '地区',
        () => true,
        (ws) => {
          const msgs = [
            `北坊住户${Math.random() > 0.5 ? '自发组织巡夜，防范盗贼' : '传来婴儿啼哭声——又有新生命降临'}`,
            `城西酒肆${Math.random() > 0.5 ? '有文人雅集，吟诗作赋' : '醉汉闹事被巡城甲士带走'}`,
            ws.weather.weather === '暴雨' ? '暴雨致城南低洼处积水盈尺，居民纷纷转移' : '天气晴好，城中百姓纷纷外出',
            `浅山猎户${Math.random() > 0.5 ? '猎到一头野猪，运到东市售卖' : '发现山中来了不常见的鹿群'}`,
          ];
          return { type: 'regional' as ET, category: '地区', message: msgs[Math.floor(Math.random() * msgs.length)] };
        },
      ),

      // ═══ 经济事件 ═══
      mk('eco_price_surge', 'economy', '物价',
        (ws) => {
          for (const [k, p] of Object.entries(ws.economy.prices)) {
            const base = ws.economy.basePrices[k] || 10;
            if (p > base * 1.3) return true;
          }
          return false;
        },
        (ws) => {
          let surging = '';
          for (const [k, p] of Object.entries(ws.economy.prices)) {
            const base = ws.economy.basePrices[k] || 10;
            if (p > base * 1.3) { surging = priceNames[k] || k; break; }
          }
          return { type: 'economy' as ET, category: '物价',
            message: `${surging}价暴涨！东市传来消息，有人囤货居奇，百姓叫苦不迭` };
        },
      ),
      mk('eco_price_drop', 'economy', '物价',
        (ws) => {
          for (const [k, p] of Object.entries(ws.economy.prices)) {
            const base = ws.economy.basePrices[k] || 10;
            if (p < base * 0.7) return true;
          }
          return false;
        },
        (ws) => {
          let dropping = '';
          for (const [k, p] of Object.entries(ws.economy.prices)) {
            const base = ws.economy.basePrices[k] || 10;
            if (p < base * 0.7) { dropping = priceNames[k] || k; break; }
          }
          return { type: 'economy' as ET, category: '物价',
            message: `${dropping}价暴跌至历史低位，商户议论纷纷` };
        },
      ),
      mk('eco_smuggling', 'economy', '物价',
        (ws) => {
          const mt = ws.factionByName('码头帮');
          const sp = ws.factionByName('市舶司');
          return !!mt && !!sp && mt.influence > 40 && sp.influence < 50;
        },
        () => ({ type: 'economy' as ET, category: '物价',
          message: '码头一带出现来路不明的货物，市舶司尚未察觉' }),
      ),

      // ═══ 天气事件 ═══
      mk('weather_main', 'weather', '天气',
        () => true,
        (ws) => {
          const weatherMessages: Record<string, string[]> = {
            '晴': ['万里无云，阳光普照汴京', '晴空如洗，街面上行人如织'],
            '多云': ['天色阴晴不定，云层时聚时散', '薄云遮日，微风拂面'],
            '小雨': ['淅淅沥沥的小雨下了一整天，路面泥泞', '细雨如丝，行人撑伞匆匆而过'],
            '大雨': ['倾盆大雨如注，汴河水涨', '暴雨倾盆，东市商户纷纷收摊避雨'],
            '暴雨': ['暴雨如注，城中多处积水！府衙紧急征调民夫疏通沟渠', '雷鸣电闪，暴雨不歇，低洼处百姓纷纷转移'],
            '雪': ['瑞雪纷飞，银装素裹，孩童在街头堆雪人', '大雪封路，汴河部分河段结冰，船只停航'],
            '大风': ['狂风呼啸，街头招牌被吹落，行人紧贴墙根行走', '朔风凛冽，卷起漫天沙尘'],
          };
          const wMsgs = weatherMessages[ws.weather.weather] || weatherMessages['晴'];
          return { type: 'weather' as ET, category: '天气', message: wMsgs[Math.floor(Math.random() * wMsgs.length)] };
        },
      ),

      // ═══ 生态事件 ═══
      mk('eco_harvest', 'ecology', '生态',
        () => true,
        (ws) => {
          const msgs = [
            ws.season === 'spring' ? '春耕时节，东郊农人忙着播种，秧苗翠绿' : '田间庄稼长势' + (Math.random() > 0.5 ? '喜人' : '一般'),
            `山林中${Math.random() > 0.5 ? '鸟鸣阵阵，野兔出没' : '猎户发现了新的兽径'}`,
            `汴河水质${Math.random() > 0.5 ? '清澈，鱼群活跃' : '因近日降雨略显浑浊'}`,
            ws.season === 'autumn' ? '秋收在即，田野一片金黄，农人喜笑颜开' : `浅山草木${Math.random() > 0.5 ? '葱茏' : '稀疏'}`,
            ws.weather.weather === '暴雨' ? '暴雨冲刷农田，部分低洼田地受灾' : `灌渠水势${Math.random() > 0.5 ? '平稳，农人引水灌田' : '稍有上涨，里正提醒注意防汛'}`,
          ];
          return { type: 'ecology' as ET, category: '生态', message: msgs[Math.floor(Math.random() * msgs.length)] };
        },
      ),
    ].sort((a, b) => b.priority - a.priority);
  }

  /** 保证每天至少有各层级事件 */
  private ensureMinimumEvents(worldState: ReturnType<typeof this.buildWorldState>): void {
    const tick = this.time.tick;
    const tickEvents = this.eventLog.filter(e => e.tick === tick);
    const types = new Set(tickEvents.map(e => e.type));
    const gd = (g?: string) => this.gridDisplayName(g);

    if (!types.has('international')) {
      const msgs = ['辽国使团抵达汴京，带来上等貂皮作为贡品', '金国使者请求增加互市口岸，朝堂上争论不休', '吐蕃商队经川蜀入京，带来药材和毛毡'];
      this.logEvent('international', '国际', msgs[Math.floor(Math.random() * msgs.length)]);
    }
    if (!types.has('national')) {
      const msgs = ['朝廷颁布新令：加强市舶司管理，严查走私', '枢密院奏报：西北边军增兵三千', '三司使奏报：本年度税收与去年持平'];
      this.logEvent('national', '国家', msgs[Math.floor(Math.random() * msgs.length)]);
    }
    if (!types.has('regional')) {
      const msgs = ['东市今日人声鼎沸，商贩云集', '府衙门前张贴了新的告示', '城西酒肆有文人雅集，吟诗作赋'];
      this.logEvent('regional', '地区', msgs[Math.floor(Math.random() * msgs.length)]);
    }
    if (!types.has('economy')) {
      const prices = worldState.economy.prices;
      const goods = Object.keys(prices);
      if (goods.length > 0) {
        const good = goods[Math.floor(Math.random() * goods.length)];
        const price = prices[good];
        this.logEvent('economy', '物价', `${good}现价${price.toFixed(1)}文，市场供需平稳`);
      }
    }
    if (!types.has('weather')) {
      this.logEvent('weather', '天气', worldState.weather.description);
    }
    if (!types.has('ecology')) {
      const msgs = ['各处水渠通畅，灌溉正常', '山林中鸟鸣阵阵，野兔出没', `汴河水质${Math.random() > 0.5 ? '清澈' : '略显浑浊'}`];
      this.logEvent('ecology', '生态', msgs[Math.floor(Math.random() * msgs.length)]);
    }

    // L0 NPC 事件（采样，最多 5 条）
    let l0Count = tickEvents.filter(e => e.type === 'npc').length;
    for (const entityId of this.l0Entities) {
      if (l0Count >= 5) break;
      if (Math.random() > 0.5) continue;
      const identity = this.em.getComponent(entityId, 'Identity');
      const wallet = this.em.getComponent(entityId, 'Wallet');
      const vital = this.em.getComponent(entityId, 'Vital');
      const pos = this.em.getComponent(entityId, 'Position');
      if (!identity) continue;
      const actions = [
        `${identity.name}在${gd(pos?.gridId)}${identity.profession === 'merchant' ? '叫卖货物' : '忙着手头的活'}`,
        `${identity.name}${vital && vital.hunger < 40 ? '饿着肚子去买了炊饼' : '歇了歇脚'}`,
        `${identity.name}${wallet && wallet.copper > 100 ? '数了数钱袋，面露喜色' : '摸了摸空口袋，叹了口气'}`,
        `${identity.name}和邻人闲聊了几句`,
      ];
      this.logEvent('npc', identity.profession, actions[Math.floor(Math.random() * actions.length)]);
      l0Count++;
    }

    // L1 NPC 事件（采样，最多 3 条）
    let l1Count = 0;
    for (const entityId of this.l1Entities) {
      if (l1Count >= 3) break;
      if (Math.random() > 0.995) continue;
      const identity = this.em.getComponent(entityId, 'Identity');
      const pos = this.em.getComponent(entityId, 'Position');
      if (!identity) continue;
      this.logEvent('npc', identity.profession, `${identity.profession}在${gd(pos?.gridId)}忙碌着`);
      l1Count++;
    }
  }

  /** Grid ID 转中文显示名 */
  private gridDisplayName(gridId?: string): string {
    const names: Record<string, string> = {
      center_street: '中心大街', east_market: '东市', west_market: '西市',
      dock: '汴河码头', cloth_shop: '锦绣布庄', tea_house: '清风茶楼',
      government: '府衙', temple: '大相国寺', residential_north: '北坊住宅',
      residential_south: '南坊住宅', east_farm: '东郊农庄', south_farm: '南郊农田',
      irrigation: '灌渠', shallow_mountain: '浅山', deep_mountain: '深山',
      stream: '溪涧', mountain_village: '山村', upstream: '汴河上游',
      downstream: '汴河下游', riverbank: '河岸',
    };
    return names[gridId || ''] || gridId || '某处';
  }

  /** 生成本回合简报 */
  private generateBriefing(playerGridId: string, priceChanges: Record<string, string>, distantNews: { message: string; cause: string; source: string }[]): TurnBriefing {
    // 1. 天气
    const weatherChanged = this.previousWeather !== this.weather.weather;
    const weather = {
      current: this.weather.weather,
      description: this.weather.getDescription(),
      changed: weatherChanged,
      previous: weatherChanged ? this.previousWeather : undefined,
    };

    // 2. 收集本回合事件，按类别分组
    const tickEvents = this.eventLog.filter(e => e.tick === this.time.tick);
    const worldEvents = {
      total: tickEvents.length,
      categories: {
        weather: tickEvents.filter(e => e.type === 'weather').map(e => e.message),
        npc_action: tickEvents.filter(e => e.category === 'npc_action').map(e => e.message),
        economy: tickEvents.filter(e => e.type === 'economy').map(e => e.message),
        ecology: tickEvents.filter(e => e.type === 'ecology').map(e => e.message),
        politics: [] as string[],
      },
    };

    // 3. 同Grid内NPC行为
    const nearbyNpcActions = this.getNearbyNpcActions(playerGridId);

    // 4. 环境描述
    const environment = this.generateEnvironmentDesc(playerGridId);

    // 5. 价格变动（含原因）
    const priceChangeList = this.getPriceChangesWithReason(priceChanges);

    return {
      weather,
      time: { shichen: this.time.shichenName, day: this.time.day },
      worldEvents,
      nearby: { npcActions: nearbyNpcActions, environment },
      distantNews,
      priceChanges: priceChangeList,
    };
  }

  /** 获取同Grid内NPC行为 */
  private getNearbyNpcActions(playerGridId: string): string[] {
    const actions: string[] = [];
    for (const entityId of this.l0Entities) {
      const pos = this.em.getComponent(entityId, 'Position');
      if (pos?.gridId !== playerGridId) continue;
      const identity = this.em.getComponent(entityId, 'Identity');
      if (!identity) continue;
      // 取本回合该NPC的事件
      const npcEvents = this.eventLog.filter(e =>
        e.tick === this.time.tick && e.category === 'npc_action' && e.message.includes(identity.name)
      );
      for (const evt of npcEvents) {
        actions.push(evt.message);
      }
    }
    // 补充：如果同Grid没有NPC事件，随机生成一些身边事
    if (actions.length === 0) {
      const nearbyTemplates = [
        '一个挑夫扛着大包匆匆走过。',
        '一个小贩推着车吆喝着。',
        '一条野狗在街角嗅着什么。',
        '远处传来孩子的嬉笑声。',
        '一个老妇人慢慢走过，手里提着菜篮。',
      ];
      actions.push(nearbyTemplates[Math.floor(Math.random() * nearbyTemplates.length)]);
    }
    return actions.slice(0, 5);
  }

  /** 生成环境描述（天气+时间+位置组合） */
  private generateEnvironmentDesc(gridId: string): string {
    const timeDesc = timeAtmosphere(this.time.shichenName);
    const weatherDesc = this.weather.getDescription();
    const location = this.gridDisplayName(gridId);
    return `${timeDesc}，${weatherDesc}。你身处${location}。`;
  }

  /** 价格变动含原因 */
  private getPriceChangesWithReason(priceChanges: Record<string, string>): { item: string; change: string; reason: string }[] {
    const reasons: Record<string, string> = {
      '粮': this.weather.farmYieldMod < 0.8 ? '天气不佳，农田减产' : this.weather.farmYieldMod > 1.1 ? '风调雨顺，粮食丰收' : '市场供需变动',
      '药': this.weather.isRaining ? '雨天药材运输不便' : '市场供需变动',
      '布': '商路运输变动',
      '材': '矿山开采量变动',
      '货': this.weather.isHeavyRain ? '暴雨导致货运中断' : '码头来货量变动',
    };
    return Object.entries(priceChanges).map(([item, change]) => ({
      item,
      change,
      reason: reasons[item] || '市场波动',
    }));
  }

  /** 获取场景模板 */
  getSceneTemplate(gridId: string): SceneTemplate {
    return SCENE_TEMPLATES[gridId] || SCENE_TEMPLATES['center_street'];
  }

  /** 获取当前场景上下文 */
  private getSceneContext(playerId: number, causalEvents: CausalEvent[] = []): SceneContext {
    const vital = this.em.getComponent(playerId, 'Vital');
    const wallet = this.em.getComponent(playerId, 'Wallet');
    return {
      shichen: this.time.shichenName,
      day: this.time.day,
      season: this.time.season,
      hunger: vital?.hunger ?? 50,
      fatigue: vital?.fatigue ?? 50,
      copper: wallet?.copper ?? 0,
      prices: this.economy.getPrices(),
      weather: this.weather.weather,
      weatherDesc: this.weather.getDescription(),
      causalEvents,
    };
  }

  // ============================================================
  // 行动点系统
  // ============================================================

  private readonly AP_PER_TURN = 5;

  /** 获取玩家当前 AP */
  getPlayerAP(playerId: number): { current: number; max: number } {
    const ap = this.em.getComponent(playerId, 'ActionPoints');
    return { current: ap?.current ?? this.AP_PER_TURN, max: ap?.max ?? this.AP_PER_TURN };
  }

  /** 消耗玩家行动点，返回是否足够 */
  private consumeAP(playerId: number, cost: number): boolean {
    const ap = this.em.getComponent(playerId, 'ActionPoints');
    if (!ap || ap.current < cost) return false;
    ap.current -= cost;
    return true;
  }

  /** 重置玩家 AP 为上限 */
  private resetAP(playerId: number): void {
    let ap = this.em.getComponent(playerId, 'ActionPoints');
    if (!ap) {
      this.em.addComponent(playerId, 'ActionPoints', { current: this.AP_PER_TURN, max: this.AP_PER_TURN });
    } else {
      ap.current = ap.max;
    }
  }

  // ============================================================
  // 周围对象交互系统
  // ============================================================

  /** 获取玩家当前位置附近所有实体 */
  getNearbyEntities(playerId: number): any[] {
    const pos = this.em.getComponent(playerId, 'Position');
    if (!pos) return [];
    const gridId = pos.gridId;

    // 如果在建筑内部（interior_*），只返回与建筑相关的实体
    if (gridId.startsWith('interior_')) {
      const buildingId = parseInt(gridId.replace('interior_', ''));
      return this.getEntitiesInBuilding(buildingId, playerId);
    }

    // 室外：返回当前 grid 的实体
    const entityIds = this.worldMap.getEntitiesInGrid(gridId);
    return this.formatEntityList(entityIds, playerId);
  }

  /** 建筑内实体筛选：所有者 + 工作人员 + 随机访客 + 少量物品，总数 5-15 */
  private getEntitiesInBuilding(buildingId: number, playerId: number): any[] {
    const building = this.em.getComponent(buildingId, 'Building') as any;
    const buildingPos = this.em.getComponent(buildingId, 'Position');
    const parentGrid = buildingPos?.gridId || 'center_street';
    const resolvedParentGrid = parentGrid.startsWith('interior_') ? 'center_street' : parentGrid;
    const bType = building?.type || 'house';

    const selected: number[] = [];
    const parentEntities = this.worldMap.getEntitiesInGrid(resolvedParentGrid);

    for (const eid of parentEntities) {
      if (eid === playerId) continue;
      const type = this.em.getType(eid);
      if (!type) continue;

      if (type === 'npc') {
        // 建筑所有者必选
        if (eid === building?.ownerId) { selected.push(eid); continue; }
        // 工作人员必选
        const identity = this.em.getComponent(eid, 'Identity') as any;
        if (identity?.workplaceId === buildingId) { selected.push(eid); continue; }
        // 住户必选
        if (identity?.homeId === buildingId) { selected.push(eid); continue; }
        // 随机访客（基于建筑类型概率）
        if (bType === 'shop' && Math.random() < 0.08) { selected.push(eid); continue; }
        if (bType === 'teahouse' && Math.random() < 0.12) { selected.push(eid); continue; }
        if (bType === 'tavern' && Math.random() < 0.10) { selected.push(eid); continue; }
        if (bType === 'clinic' && Math.random() < 0.06) { selected.push(eid); continue; }
        if (bType === 'house' && Math.random() < 0.02) { selected.push(eid); continue; }
        if (bType === 'temple' && Math.random() < 0.07) { selected.push(eid); continue; }
        if (bType === 'government' && Math.random() < 0.04) { selected.push(eid); continue; }
      }

      if (type === 'item' && Math.random() < 0.08) {
        selected.push(eid);
      }
    }

    // 控制总数在 5-15
    const minCount = 5;
    const maxCount = 15;
    if (selected.length < minCount) {
      // 补充：从父 grid 的 NPC 中随机选几个凑数
      for (const eid of parentEntities) {
        if (selected.length >= minCount) break;
        if (eid === playerId || selected.includes(eid)) continue;
        const type = this.em.getType(eid);
        if (type === 'npc' || type === 'item') {
          selected.push(eid);
        }
      }
    }
    if (selected.length > maxCount) {
      selected.length = maxCount;
    }

    return this.formatEntityList(selected, playerId);
  }

  /** 格式化实体列表 */
  private formatEntityList(entityIds: number[], playerId: number): any[] {
    const result: any[] = [];
    for (const id of entityIds) {
      if (id === playerId) continue;
      const type = this.em.getType(id);
      if (!type) continue;

      const identity = this.em.getComponent(id, 'Identity');
      const vital = this.em.getComponent(id, 'Vital');
      const wallet = this.em.getComponent(id, 'Wallet');
      const building = this.em.getComponent(id, 'Building');

      const entity: any = {
        id,
        type,
        name: identity?.name || this.getTypeDisplayName(id, type),
        icon: this.getTypeIcon(id, type),
        interactable: true,
      };

      // NPC 特有信息
      if (type === 'npc') {
        entity.profession = identity?.profession || '';
        entity.briefDesc = `${identity?.profession || '路人'}，${this.getAgeDesc(identity?.age)}`;
        entity.vital = vital ? { hunger: vital.hunger, fatigue: vital.fatigue, health: vital.health, mood: vital.mood } : undefined;
        entity.personality = identity?.personality || [];
        entity.wallet = wallet ? { copper: wallet.copper } : undefined;
        // 组织信息 — 从 factions Map 反查（不依赖 Identity.factionId）
        const npcFaction = this.getNpcFaction(id);
        if (npcFaction) {
          const faction = this.factions.get(npcFaction.id);
          if (faction) {
            entity.factionId = npcFaction.id;
            entity.factionName = npcFaction.name;
            entity.factionType = faction.type;
            entity.factionRole = npcFaction.role;
          }
        }
      }
      // 建筑特有信息
      else if (type === 'building') {
        const bExt = building as any;
        entity.buildingType = building?.type || 'house';
        entity.openHours = building?.openHours || '';
        entity.name = bExt?.name || this.getTypeDisplayName(id, type);
        entity.quality = bExt?.quality || 50;
        entity.description = bExt?.description || '';
        if (building?.ownerId && this.em.isAlive(building.ownerId)) {
          const ownerIdentity = this.em.getComponent(building.ownerId, 'Identity');
          entity.ownerName = ownerIdentity?.name || '';
        } else {
          entity.ownerName = '';
        }
        entity.rooms = (bExt?.rooms || []).map((r: any) => ({
          id: r.id, name: r.name, icon: r.icon,
        }));
      }

      result.push(entity);
    }
    return result;
  }

  /** 根据涌现规则动态计算可用行为 */
  calculateEntityActions(playerId: number, targetId: number): { targetId: number; targetName: string; actions: any[] } {
    const targetType = this.em.getType(targetId);
    const targetIdentity = this.em.getComponent(targetId, 'Identity');
    const targetName = targetIdentity?.name || this.getTypeDisplayName(targetId, targetType);

    // 构建涌现上下文
    const ctx = this.buildInteractionContext(playerId, targetId);

    // 使用涌现规则引擎获取行为
    const actions = getEmergentActions(ctx);

    return { targetId, targetName, actions };
  }

  /** 构建交互上下文 */
  private buildInteractionContext(playerId: number, targetId: number): InteractionContext {
    const playerVital = this.em.getComponent(playerId, 'Vital');
    const playerWallet = this.em.getComponent(playerId, 'Wallet');
    const playerInventory = this.em.getComponent(playerId, 'Inventory');
    const playerAP = this.getPlayerAP(playerId);
    const playerPos = this.em.getComponent(playerId, 'Position');
    const playerMemory = this.em.getComponent(playerId, 'Memory');
    const playerIdComp = this.em.getComponent(playerId, 'Identity');

    const targetType = this.em.getType(targetId);
    const targetVital = this.em.getComponent(targetId, 'Vital');
    const targetWallet = this.em.getComponent(targetId, 'Wallet');
    const targetIdentity = this.em.getComponent(targetId, 'Identity');
    const targetPos = this.em.getComponent(targetId, 'Position');
    const targetAI = this.em.getComponent(targetId, 'AI');
    const targetMemory = this.em.getComponent(targetId, 'Memory');
    const targetGrowth = this.em.getComponent(targetId, 'Growth');
    const targetBuilding = this.em.getComponent(targetId, 'Building');

    // 获取附近实体
    const gridId = playerPos?.gridId || '';
    const nearbyIds = this.worldMap.getEntitiesInGrid(gridId);
    const nearbyEntities = nearbyIds
      .filter(id => id !== playerId)
      .map(id => ({ id, type: this.em.getType(id) || 'unknown' }));

    // 获取因果事件
    const recentEvents = this.getEvents(5);
    const causalEvents = recentEvents.map(e => ({
      cause: e.cause || e.category || '',
      effect: e.message,
      tick: e.tick,
    }));

    return {
      player: {
        vital: {
          hunger: playerVital?.hunger ?? 50,
          fatigue: playerVital?.fatigue ?? 50,
          health: playerVital?.health ?? 80,
          mood: playerVital?.mood ?? 50,
        },
        wallet: { copper: playerWallet?.copper ?? 0 },
        inventory: {
          items: playerInventory?.items ? [...playerInventory.items] : [],
        },
        ap: playerAP.current,
        apMax: playerAP.max,
        position: {
          gridId: playerPos?.gridId || '',
          areaId: playerPos?.areaId || '',
        },
        memory: {
          recentEvents: playerMemory?.recentEvents || [],
          impressions: playerMemory?.impressions || {},
        },
        factionId: this.getNpcFaction(playerId)?.id,
        factionRole: this.getNpcFaction(playerId)?.role as 'leader' | 'member' | undefined,
        factionType: (() => { const pf = this.getNpcFaction(playerId); return pf ? this.factions.get(pf.id)?.type : undefined; })(),
        profession: playerIdComp?.profession,
        personality: playerIdComp?.personality,
        familyMembers: this.getFamilyMemberIds(playerIdComp),
        spouseId: playerIdComp?.spouseId,
      },
      target: {
        id: targetId,
        type: targetType || 'unknown',
        vital: targetVital ? { hunger: targetVital.hunger, fatigue: targetVital.fatigue, health: targetVital.health, mood: targetVital.mood } : null,
        wallet: targetWallet ? { copper: targetWallet.copper } : null,
        identity: targetIdentity ? { name: targetIdentity.name, profession: targetIdentity.profession, age: targetIdentity.age, personality: targetIdentity.personality, factionId: this.getNpcFaction(targetId)?.id, factionRole: this.getNpcFaction(targetId)?.role as 'leader' | 'member' | undefined } : null,
        homeId: targetIdentity?.homeId,
        workplaceId: targetIdentity?.workplaceId,
        position: targetPos ? { gridId: targetPos.gridId, areaId: targetPos.areaId } : null,
        ai: targetAI ? { goals: targetAI.goals, currentPlan: targetAI.currentPlan, planCooldown: targetAI.planCooldown, aiLevel: targetAI.aiLevel } : null,
        memory: targetMemory ? { recentEvents: targetMemory.recentEvents, impressions: targetMemory.impressions } : null,
        growth: targetGrowth ? { stage: targetGrowth.stage, growProgress: targetGrowth.growProgress, seasonReq: targetGrowth.seasonReq } : null,
        building: targetBuilding ? { type: targetBuilding.type, ownerId: targetBuilding.ownerId, openHours: targetBuilding.openHours } : null,
      },
      world: {
        weather: this.weather.weather,
        season: this.time.season,
        shichen: this.time.shichenName,
        prices: this.economy.getPrices(),
        nearbyEntities,
        causalEvents,
        tick: this.time.tick,
      },
    };
  }

  /** 获取 Grid 显示名 */
  getGridDisplayName(gridId: string): string {
    return GRID_NAMES[gridId] || gridId;
  }

  /** 获取 Grid 所属区域 */
  private getAreaForGrid(gridId: string): string {
    const AREA_MAP: Record<string, string> = {
      center_street: 'city', east_market: 'city', west_market: 'city',
      dock: 'city', cloth_shop: 'city', tea_house: 'city',
      government: 'city', temple: 'city',
      residential_north: 'city', residential_south: 'city',
      east_farm: 'farmland', south_farm: 'farmland', irrigation: 'farmland',
      shallow_mountain: 'mountain', deep_mountain: 'mountain',
      stream: 'mountain', mountain_village: 'mountain',
      upstream: 'river', downstream: 'river', riverbank: 'river',
    };
    return AREA_MAP[gridId] || 'city';
  }

  /** 获取当前位置的移动选项 */
  getMovementOptions(playerId: number): { id: string; name: string; icon: string; targetGrid: string; type: string }[] {
    const pos = this.em.getComponent(playerId, 'Position');
    const currentGrid = pos?.gridId || 'center_street';

    const options: { id: string; name: string; icon: string; targetGrid: string; type: string }[] = [];

    // 1. 如果在建筑内部，显示"离开"选项
    if (currentGrid.startsWith('interior_')) {
      // 提取建筑 ID，找到原始 grid
      const buildingIdStr = currentGrid.replace('interior_', '');
      const buildingId = parseInt(buildingIdStr);
      // 建筑实体可能也被移到了 interior grid，需要记住原始位置
      // 使用一个简单策略：回到中心大街
      const buildingEntity = this.em.isAlive(buildingId) ? this.em.getComponent(buildingId, 'Position') : null;
      const origGrid = buildingEntity?.gridId || 'center_street';
      // 如果建筑也在 interior grid，说明我们需要一个"记住原始位置"的机制
      // 简单方案：解析 interior 前缀，默认回 center_street
      const exitGrid = origGrid.startsWith('interior_') ? 'center_street' : origGrid;
      options.push({
        id: 'leave_building',
        name: `离开${this.getTypeDisplayName(buildingId, 'building')}`,
        icon: '🚶',
        targetGrid: exitGrid,
        type: 'leave',
      });
      return options;
    }

    // 2. 相邻地点（从 MAP_CONNECTIONS）
    const connections = MAP_CONNECTIONS[currentGrid] || [];
    for (const targetGrid of connections) {
      options.push({
        id: `go_${targetGrid}`,
        name: GRID_NAMES[targetGrid] || targetGrid,
        icon: GRID_ICONS[targetGrid] || '📍',
        targetGrid,
        type: 'move',
      });
    }

    // 2. 当前位置的可进入建筑（从真实实体）
    const entities = this.worldMap.getEntitiesInGrid(currentGrid);
    for (const eid of entities) {
      if (this.em.getType(eid) === 'building') {
        const building = this.em.getComponent(eid, 'Building');
        if (building) {
          const bName = (building as any).name || this.getTypeDisplayName(eid, 'building');
          const iconMap: Record<string, string> = {
            house: '🏠', shop: '🏪', teahouse: '🍵', clinic: '🏥',
            tavern: '🍺', warehouse: '📦', temple: '⛩', government: '🏛',
          };
          options.push({
            id: `enter_building_${eid}`,
            name: bName,
            icon: iconMap[building.type] || '🏠',
            targetGrid: `${currentGrid}`,
            type: 'enter',
          });
        }
      }
    }

    return options;
  }

  /** 获取类型显示图标 */
  private getTypeIcon(id: number, type: string | undefined): string {
    switch (type) {
      case 'npc': return '👤';
      case 'animal': return '🐾';
      case 'building': {
        const b = this.em.getComponent(id, 'Building');
        const iconMap: Record<string, string> = {
          house: '🏠', shop: '🏪', teahouse: '🍵', clinic: '🏥',
          tavern: '🍺', warehouse: '📦', temple: '⛩', government: '🏛',
        };
        return b?.type ? (iconMap[b.type] || '🏠') : '🏠';
      }
      case 'plant': return '🌿';
      case 'mineral': return '🪨';
      case 'item': return '📦';
      default: return '❓';
    }
  }

  /** 获取类型显示名 */
  private getTypeDisplayName(id: number, type: string | undefined): string {
    switch (type) {
      case 'npc': return '路人';
      case 'animal': {
        // 尝试从 AI 组件获取更多信息来推断动物类型
        const vital = this.em.getComponent(id, 'Vital');
        const pos = this.em.getComponent(id, 'Position');
        const isWild = pos?.areaId === 'mountain' || pos?.areaId === 'river';
        const names = isWild
          ? ['野鹿', '灰兔', '赤狐', '野猪', '灰狼', '飞鸟']
          : ['母鸡', '小猪', '老牛'];
        return names[Math.floor(id) % names.length];
      }
      case 'building': {
        const b = this.em.getComponent(id, 'Building') as any;
        // 优先使用建筑组件中存储的 name
        if (b?.name) return b.name;
        const identity = this.em.getComponent(id, 'Identity');
        if (identity?.name) return identity.name;
        const bType = b?.type || 'house';
        // fallback 名字
        const shopNames = ['锦绣布庄', '济世堂药铺', '聚宝斋', '福来杂货', '如意绸缎庄', '丰盛粮铺', '百味酱园', '同福酒楼', '德兴铁铺', '天成银楼'];
        const houseNames = ['张家宅', '李家院', '赵家小院', '孙家旧宅', '周家新居', '吴家老宅', '郑家大院', '王家小楼', '陈家院落', '刘家茅舍'];
        const teahouseNames = ['清风茶楼', '望月茶馆', '醉仙楼', '碧云轩'];
        if (bType === 'shop') return shopNames[id % shopNames.length];
        if (bType === 'teahouse') return teahouseNames[id % teahouseNames.length];
        return houseNames[id % houseNames.length];
      }
      case 'plant': {
        const pos = this.em.getComponent(id, 'Position');
        const areaPlants: Record<string, string[]> = {
          farmland: ['稻苗', '麦穗', '菜秧'],
          mountain: ['松树', '竹子', '药草', '野花'],
          river: ['芦苇', '水草'],
        };
        const pool = areaPlants[pos?.areaId || ''] || ['野草', '灌木'];
        return pool[id % pool.length];
      }
      case 'mineral': {
        const mineralNames = ['铁矿石', '铜矿石', '石块', '燧石'];
        return mineralNames[id % mineralNames.length];
      }
      case 'item': {
        const itemIdentity = this.em.getComponent(id, 'Identity');
        return itemIdentity?.name || '物品';
      }
      default: return '未知';
    }
  }

  /** 年龄描述 */
  private getAgeDesc(age?: number): string {
    if (!age) return '年龄不详';
    if (age < 20) return '年少';
    if (age < 35) return '青年';
    if (age < 50) return '中年';
    return '年长';
  }

  /** 获取建筑内部详情 */
  getBuildingInterior(buildingId: number): any {
    if (!this.em.isAlive(buildingId)) return null;
    const building = this.em.getComponent(buildingId, 'Building');
    if (!building) return null;
    const bExt = building as any;

    const bName = bExt.name || this.getTypeDisplayName(buildingId, 'building');
    let ownerName = '';
    if (building.ownerId && this.em.isAlive(building.ownerId)) {
      const ownerIdentity = this.em.getComponent(building.ownerId, 'Identity');
      ownerName = ownerIdentity?.name || '';
    }

    // 获取建筑原始 grid 中的实体（NPC + 物品）
    const bPos = this.em.getComponent(buildingId, 'Position');
    const gridId = bPos?.gridId || 'center_street';
    const interiorGrid = `interior_${buildingId}`;
    const gridToQuery = gridId.startsWith('interior_') ? 'center_street' : gridId;

    const entityIds = this.worldMap.getEntitiesInGrid(gridToQuery);
    const interiorEntities: any[] = [];
    for (const eid of entityIds) {
      if (eid === buildingId) continue;
      const type = this.em.getType(eid);
      if (!type) continue;
      const identity = this.em.getComponent(eid, 'Identity');

      if (type === 'npc' || type === 'item') {
        const ent: any = {
          id: eid,
          type,
          name: identity?.name || this.getTypeDisplayName(eid, type),
          icon: this.getTypeIcon(eid, type),
          briefDesc: type === 'npc'
            ? `${identity?.profession || '路人'}，${this.getAgeDesc(identity?.age)}`
            : '物品',
        };
        if (type === 'npc' && building.ownerId === eid) {
          ent.briefDesc = '宅子主人';
        }
        interiorEntities.push(ent);
      }
    }

    // 当前房间（默认第一个房间）
    const rooms: any[] = bExt.rooms || [];
    const currentRoom = rooms.length > 0 ? rooms[0].id : '';

    // 当前房间物件
    const currentRoomData = rooms.find((r: any) => r.id === currentRoom);

    return {
      buildingId,
      buildingName: bName,
      buildingType: building.type,
      ownerName,
      currentRoom,
      rooms: rooms.map((r: any) => ({ id: r.id, name: r.name, icon: r.icon, description: r.description, objects: r.objects, capacity: r.capacity })),
      entities: interiorEntities,
      roomObjects: currentRoomData?.objects || [],
      description: bExt.description || '',
      quality: bExt.quality || 50,
    };
  }

  /** 获取建筑详情（监控面板用） */
  getBuildingDetail(buildingId: number): any {
    if (!this.em.isAlive(buildingId)) return null;
    const building = this.em.getComponent(buildingId, 'Building');
    if (!building) return null;
    const bExt = building as any;

    const bName = bExt.name || this.getTypeDisplayName(buildingId, 'building');
    let ownerName = '';
    if (building.ownerId && this.em.isAlive(building.ownerId)) {
      const ownerIdentity = this.em.getComponent(building.ownerId, 'Identity');
      ownerName = ownerIdentity?.name || '';
    }

    const bPos = this.em.getComponent(buildingId, 'Position');
    const gridId = bPos?.gridId || '';

    // 查找当前在建筑内的实体
    const interiorGrid = `interior_${buildingId}`;
    const interiorEntityIds = this.worldMap.getEntitiesInGrid(interiorGrid);
    const entitiesInside = interiorEntityIds.map(eid => {
      const identity = this.em.getComponent(eid, 'Identity');
      return {
        id: eid,
        type: this.em.getType(eid) || 'unknown',
        name: identity?.name || '未知',
      };
    });

    return {
      id: buildingId,
      name: bName,
      type: building.type,
      ownerName,
      quality: bExt.quality || 50,
      gridId,
      openHours: building.openHours || '',
      rooms: (bExt.rooms || []).map((r: any) => ({ id: r.id, name: r.name, icon: r.icon, description: r.description, objects: r.objects, capacity: r.capacity })),
      entitiesInside,
      description: bExt.description || '',
    };
  }

  /** 回合模拟：全世界推进一回合 */
  simulateTurn(): {
    npcActions: number;
    priceChanges: Record<string, string>;
    causalEvents: CausalEvent[];
    l0Actions: { npcName: string; action: string; result: string }[];
    l1Summary: { total: number; highlights: string[] };
    majorEvents: MajorEvent[];
    weatherChange: string | null;
    enrichedPriceChanges: Record<string, { change: string; reason: string }>;
  } {
    // 结算数据收集
    const l0Actions: { npcName: string; action: string; result: string }[] = [];
    const majorEvents: MajorEvent[] = [];

    // 保存当前物价
    const oldPrices = this.economy.getPrices();
    // 1. 时间推进
    this.time.advance();

    // 2. 天气推进（保存前一回合天气）
    this.previousWeather = this.weather.weather;
    this.weather.advance(this.time.season);
    this.weather.advance(this.time.season, this.time.tick, this.time.shichenName);

    // 3. L0 NPC 行动 (优先级规则, 10个核心NPC)
    for (const entityId of this.l0Entities) {
      const l0Result = this.simulateL0Action(entityId);
      if (l0Result) {
        l0Actions.push({ npcName: l0Result.npcName, action: l0Result.action, result: l0Result.result });
        majorEvents.push(...l0Result.majorEvents);
      }
    }

    // 4. L1 NPC 批量行动 (简化模拟)
    const l1Summary = this.simulateL1Batch();

    // 5. L2 区域统计更新
    this.regionSim.update(this.time.season, this.weather.farmYieldMod);

    // 6. 经济系统更新（传入天气和区域统计）
    this.economy.update(this.weather, this.regionSim.getAllRegions());

    // 7. 生命系统衰减
    this.vital.update();

    // 8. 因果事件引擎
    const newPrices = this.economy.getPrices();
    const causalEvents = this.eventEngine.generateEvents({
      tick: this.time.tick,
      weather: this.weather,
      economy: this.economy,
      oldPrices,
      newPrices,
      regions: this.regionSim.getAllRegions(),
      em: this.em,
      l0Entities: this.l0Entities,
    });
    // 将因果事件写入事件日志 + 收集重大事件
    for (const ce of causalEvents) {
      this.logEvent(ce.source === 'weather' ? 'weather' : ce.source === 'economy' ? 'economy' : ce.source === 'ecology' ? 'ecology' : 'npc',
        ce.source, ce.message);
      if (this.eventLog.length > 0) {
        this.eventLog[this.eventLog.length - 1].cause = ce.cause;
        this.eventLog[this.eventLog.length - 1].source = ce.source;
      }
      // 因果事件 -> 重大事件
      if (ce.message.includes('暴雨') || ce.message.includes('洪涝') || ce.message.includes('瘟疫')) {
        majorEvents.push({ type: 'weather', title: ce.message.substring(0, 20), detail: ce.message, impact: 'critical' });
      } else if (ce.spreadRadius >= 3) {
        majorEvents.push({ type: ce.source as any, title: ce.message.substring(0, 20), detail: ce.message, impact: 'important' });
      }
    }
    
    // 天气变化 → 重大事件
    const weatherChanged = this.previousWeather !== this.weather.weather;
    const weatherChange = weatherChanged ? `${this.previousWeather}→${this.weather.weather}` : null;
    if (weatherChanged) {
      if (this.weather.isHeavyRain) {
        majorEvents.push({ type: 'weather', title: `天气突变：${weatherChange}`, detail: `天色骤变，${this.weather.getDescription()}`, impact: 'critical' });
      } else {
        majorEvents.push({ type: 'weather', title: `天气变化：${weatherChange}`, detail: this.weather.getDescription(), impact: 'important' });
      }
    }
    
    // 9. 随机事件（旧逻辑）
    this.generateTickEvents();

    // 计算物价变动
    const priceChanges: Record<string, string> = {};
    const enrichedPriceChanges: Record<string, { change: string; reason: string }> = {};
    const priceNames: Record<string, string> = { food: '粮', herbs: '药', cloth: '布', material: '材', cargo: '货' };
    const priceReasons: Record<string, string> = {
      '粮': this.weather.farmYieldMod < 0.8 ? '天气不佳，农田减产' : this.weather.farmYieldMod > 1.1 ? '风调雨顺，粮食丰收' : '市场供需变动',
      '药': this.weather.isRaining ? '雨天药材运输不便' : '市场供需变动',
      '布': '商路运输变动',
      '材': '矿山开采量变动',
      '货': this.weather.isHeavyRain ? '暴雨导致货运中断' : '码头来货量变动',
    };
    for (const key of Object.keys(newPrices)) {
      const old = oldPrices[key] || 1;
      const diff = ((newPrices[key] - old) / old * 100);
      if (Math.abs(diff) > 0.1) {
        const sign = diff > 0 ? '+' : '';
        const changeStr = `${sign}${diff.toFixed(1)}%`;
        const name = priceNames[key] || key;
        priceChanges[name] = changeStr;
        const reason = priceReasons[name] || '市场波动';
        this.economy.recordChange(name, changeStr, reason);
        enrichedPriceChanges[name] = { change: changeStr, reason };
        // 物价大幅波动 → 重大事件
        const pct = parseFloat(changeStr);
        if (Math.abs(pct) > 20) {
          majorEvents.push({ type: 'economy', title: `${name}价${pct > 0 ? '飙升' : '暴跌'}${changeStr}`, detail: `${name}价变动${changeStr}，${reason}`, impact: 'critical' });
        } else if (Math.abs(pct) > 10) {
          majorEvents.push({ type: 'economy', title: `${name}价${pct > 0 ? '上涨' : '下跌'}${changeStr}`, detail: reason, impact: 'important' });
        }
      }
    }

    // 记录传播链
    for (const ce of causalEvents) {
      if (ce.spreadRadius >= 1) {
        this.propagationChains.push({
          message: ce.message,
          source: ce.sourceLocation || ce.source,
          spreadRadius: ce.spreadRadius,
          tick: this.time.tick,
          cause: ce.cause,
          active: true,
        });
      }
    }
    // 超过5回合的传播链标记为非活跃
    for (const chain of this.propagationChains) {
      if (this.time.tick - chain.tick > 5) {
        chain.active = false;
      }
    }
    // 保留最近30条
    if (this.propagationChains.length > 30) {
      this.propagationChains = this.propagationChains.slice(-30);
    }

    return { npcActions: this.lastTickEvents, priceChanges, causalEvents, l0Actions, l1Summary, majorEvents, weatherChange, enrichedPriceChanges };
  }

  /** L0 NPC 单个行动模拟（需求驱动决策引擎 / 旧GOAP fallback） */
  /** 生成目标视角的行动描述 */
  private getTargetPerspectiveAction(sceneId: string, success: boolean): string {
    const map: Record<string, string> = {
      s_friend_meal: '蹭了顿饭',
      s_steal_food: '偷了食物',
      s_shared_meal: '分了食物',
      s_beg: '讨了些钱',
      mi_pickpocket: '扒了钱包',
      mi_con_game: '骗了钱',
      mi_extort: '勒索了钱',
      mi_rob: '抢了钱',
      mi_spread_rumor: '说了些闲话',
      c_street_fight: '打了一顿',
      c_shout_match: '骂了一顿',
      c_insult: '羞辱了一番',
      c_protect_weak: '保护了',
      c_draw_weapon: '拔刀威胁了',
      so_tea_chat: '聊了聊天',
      so_drink_together: '一起喝了酒',
      so_share_news: '分享了消息',
      so_help_carry: '帮搬了东西',
      w_hard_sell: '推销了东西',
      w_treat_patient: '看了诊',
      t_haggle_hard: '砍了价',
      t_charity: '施舍了些钱',
      r_glance: '偷偷看了',
      r_hold_hand: '牵了手',
      l_chess_game: '下了盘棋',
      f_child_play: '逗着玩了一会儿',
      f_neighbor_chat: '聊了会天',
      cr_teach: '教了些东西',
      fa_secret_meeting: '开了个密会',
    };
    return map[sceneId] || (success ? '做了些什么' : '试图做些什么');
  }

  private simulateL0Action(entityId: number): L0ActionResult {
    const vital = this.em.getComponent(entityId, 'Vital');
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const identity = this.em.getComponent(entityId, 'Identity');
    if (!vital || !identity) return { npcName: '某人', action: '', result: '', majorEvents: [] };

    // 检查是否有新的需求组件 → 使用决策引擎
    const needs = this.em.getComponent(entityId, 'Needs');
    if (needs) {
      return this.simulateL0DecisionEngine(entityId, needs, vital, wallet ?? null, identity);
    }

    // fallback: 旧的 GOAP 决策
    return this.simulateL0Legacy(entityId, vital, wallet ?? null, identity);
  }

  /** 新决策引擎驱动的 L0 NPC 行动 */
  private simulateL0DecisionEngine(
    entityId: number,
    needs: NeedsComponent,
    vital: VitalComponent,
    wallet: WalletComponent | null,
    identity: { name: string; profession: string; personality: string[]; factionRole?: string; factionId?: number; spouseId?: number; parentIds?: number[]; childIds?: number[] },
  ): L0ActionResult {
    const name = identity.name;
    const pos = this.em.getComponent(entityId, 'Position');
    const copper = wallet?.copper ?? 0;

    // 需求衰减：使用个性化衰减（性格影响衰减率）
    this.vital.decayNeedsWithPersonality(needs, identity.personality);

    // ──── 更新情绪系统 ────
    let emotion = this.em.getComponent(entityId, 'Emotion');
    if (!emotion) {
      emotion = { current: 'happy', intensity: 20, ticksInEmotion: 0 };
      this.em.addComponent(entityId, 'Emotion', emotion);
    }
    const actionState = this.em.getComponent(entityId, 'ActionState');
    const recentWorkActions = actionState
      ? actionState.actionHistory.slice(-3).filter((r: ActionRecord) => r.actionId === 'work' || r.goalId?.startsWith('work')).length
      : 0;
    updateEmotionComponent(emotion, {
      needs,
      personality: identity.personality,
      recentWorkActions,
    });

    // ──── 更新压力系统 ────
    const gridId = pos?.gridId || 'center_street';
    const nearNpcIds = this.worldMap.getEntitiesInGrid(gridId).filter((id: number) => id !== entityId);
    const nearEnemies = this.relationshipSys.getNearbyRelations(entityId, nearNpcIds)
      .filter(r => r.score <= -61).length;
    const nearFriends = this.relationshipSys.getNearbyRelations(entityId, nearNpcIds)
      .filter(r => r.score >= 61).length;
    const stress = this.stressMemorySys.updateStress(entityId, {
      needs,
      weather: this.weather.weather,
      currentGrid: gridId,
      currentTick: this.time.tick,
      nearbyEnemies: nearEnemies,
      nearbyFriends: nearFriends,
      copper: wallet?.copper ?? 0,
    });

    // ──── 更新关系系统 ────
    this.relationshipSys.ensureRelationshipComponent(entityId);
    this.relationshipSys.applyProximityBonus(entityId, nearNpcIds, this.time.tick);
    this.relationshipSys.applyDecay(entityId, this.time.tick);

    // ──── 检查/刷新心愿系统 ────
    let whimComp = this.em.getComponent(entityId, 'Whim');
    if (!whimComp) {
      whimComp = { whims: [], lastRefreshTick: 0 };
      this.em.addComponent(entityId, 'Whim', whimComp);
    }
    if (shouldRefreshWhims(whimComp.whims, this.time.tick, whimComp.lastRefreshTick)) {
      whimComp.whims = generateWhims({
        emotion: emotion.current,
        personality: identity.personality,
        shichen: this.time.shichenName,
        needs: { hunger: needs.hunger, fatigue: needs.fatigue, social: needs.social, mood: needs.mood, safety: needs.safety, health: needs.health },
        profession: identity.profession,
        currentTick: this.time.tick,
        existingWhims: whimComp.whims,
      });
      whimComp.lastRefreshTick = this.time.tick;
    }

    // ──── 每日计划系统 ────
    let dailyPlan = this.em.getComponent(entityId, 'DailyPlan');
    if (!dailyPlan || dailyPlan.dayGenerated !== this.time.day) {
      const newPlan = this.generateDailyPlan(entityId, identity.personality, identity.profession);
      if (!dailyPlan) {
        this.em.addComponent(entityId, 'DailyPlan', newPlan);
      } else {
        dailyPlan.biases = newPlan.biases;
        dailyPlan.dayGenerated = newPlan.dayGenerated;
      }
      dailyPlan = this.em.getComponent(entityId, 'DailyPlan');
    }

    // ──── 抱负系统 ────
    let aspiration = this.em.getComponent(entityId, 'Aspiration');
    if (!aspiration) {
      const aspType = getDefaultAspiration(identity.profession);
      aspiration = { type: aspType, progress: 0 };
      this.em.addComponent(entityId, 'Aspiration', aspiration);
    }

    // 检查家庭成员是否在附近
    const familyNearby = this.isFamilyNearby(entityId, identity);

    // 检查附近NPC数量（使用已计算的 nearNpcIds）
    const nearNpcCount = nearNpcIds.length;

    // ──── 隐藏特征初始化 ────
    let hiddenTraits = this.em.getComponent(entityId, 'HiddenTraits');
    if (!hiddenTraits) {
      hiddenTraits = {
        rationality: 30 + Math.floor(Math.random() * 50),
        greed: 20 + Math.floor(Math.random() * 50),
        honor: 30 + Math.floor(Math.random() * 50),
        ambition: 20 + Math.floor(Math.random() * 50),
        loyalty: 30 + Math.floor(Math.random() * 50),
        revealedTo: [],
      };
      this.em.addComponent(entityId, 'HiddenTraits', hiddenTraits);
    }

    // 构建决策上下文（含情绪/心愿/抱负/每日计划）
    const inv = this.em.getComponent(entityId, 'Inventory');
    const recentActions = actionState
      ? actionState.actionHistory.slice(-3).map((r: ActionRecord) => r.actionId)
      : [];
    const ctx: DecisionContext = {
      needs,
      npcName: name,
      profession: identity.profession,
      personality: identity.personality,
      factionRole: identity.factionRole,
      copper,
      currentGrid: gridId,
      weather: this.weather.weather,
      shichen: this.time.shichenName,
      day: this.time.day,
      tick: this.time.tick,
      factionId: identity.factionId,
      familyNearby,
      inventory: inv?.items || [],
      nearNpcCount,
      recentActions,
      // v4 新增
      emotion: emotion.current,
      whims: whimComp.whims,
      aspiration: aspiration.type,
      dailyPlanBiases: dailyPlan?.biases || {},
      // v5 涌现叙事新增
      stressLevel: stress.level,
      hiddenTraits,
      nearbyRelations: this.relationshipSys.getNearbyRelations(entityId, nearNpcIds),
    };

    // ── 优先使用演出库决策（漫野奇谭式）────
    const nearbyNpcInfos: NearbyNpcInfo[] = nearNpcIds.map((nid: number) => {
      const nWallet = this.em.getComponent(nid, 'Wallet') as any;
      const nIdentity = this.em.getComponent(nid, 'Identity') as any;
      const nVital = this.em.getComponent(nid, 'Vital') as any;
      const relScore = this.relationshipSys.getScore(entityId, nid);
      const relType = this.relationshipSys.getType(entityId, nid);
      return {
        id: nid,
        name: nIdentity?.name || `NPC${nid}`,
        profession: nIdentity?.profession || 'laborer',
        personality: nIdentity?.personality || [],
        copper: nWallet?.copper || 0,
        health: nVital?.health || 100,
        relationScore: relScore,
        relationType: relType,
      };
    });

    const sceneResult = decideWithScene(ctx, nearbyNpcInfos);

    // 记录决策前的状态
    const stateBefore = { hunger: vital.hunger, fatigue: vital.fatigue, copper, mood: vital.mood ?? 50 };

    if (sceneResult) {
      // 演出库命中 — 使用演出结果
      for (const [key, value] of Object.entries(sceneResult.effects)) {
        if (key in needs) {
          (needs as any)[key] = Math.max(0, Math.min(100, (needs as any)[key] + value));
        }
      }
      vital.hunger = needs.hunger;
      vital.fatigue = needs.fatigue;
      vital.health = needs.health;
      vital.mood = needs.mood;
      // safety/social 在 NeedsComponent 中但不在 VitalComponent
      if (sceneResult.effects.copper && wallet) {
        wallet.copper = Math.max(0, wallet.copper + sceneResult.effects.copper);
      }

      // 应用目标NPC效果
      if (sceneResult.targetEffects && sceneResult.targetName) {
        const targetNpc = nearbyNpcInfos.find((n: NearbyNpcInfo) => n.name === sceneResult.targetName);
        if (targetNpc) {
          const tVital = this.em.getComponent(targetNpc.id, 'Vital') as any;
          const tWallet = this.em.getComponent(targetNpc.id, 'Wallet') as any;
          if (tVital) {
            for (const [key, value] of Object.entries(sceneResult.targetEffects)) {
              if (key in tVital) tVital[key] = Math.max(0, Math.min(100, tVital[key] + value));
            }
          }
          if (tWallet && sceneResult.targetEffects.copper) {
            tWallet.copper = Math.max(0, tWallet.copper + sceneResult.targetEffects.copper);
          }
        }
      }

      // 关系变化
      if (sceneResult.relationChange && sceneResult.targetName) {
        const targetNpc = nearbyNpcInfos.find((n: NearbyNpcInfo) => n.name === sceneResult.targetName);
        if (targetNpc) {
          this.relationshipSys.modifyRelation(entityId, targetNpc.id, sceneResult.relationChange, this.time.tick);
        }
      }

      // 记录到世界事件日志（发起者视角）
      this.eventLog.push({
        tick: this.time.tick,
        time: new Date().toISOString(),
        type: 'npc',
        category: `scene:${sceneResult.goalCategory}`,
        message: sceneResult.narrative,
        cause: `scene:${sceneResult.sceneId}:${sceneResult.success ? 'success' : 'failure'}`,
        source: identity.name,
        target: sceneResult.targetName,
      });
      this.lastTickEvents++;

      // 更新发起者行为历史
      const history = this.npcHistory.get(entityId) || [];
      history.push({
        tick: this.time.tick,
        shichen: this.time.shichenName,
        action: sceneResult.sceneId,
        description: sceneResult.narrative,
        result: sceneResult.success ? '成功' : '失败',
        cause: sceneResult.goalCategory,
        stateBefore,
        stateAfter: { hunger: vital.hunger, fatigue: vital.fatigue, copper: wallet?.copper ?? 0, mood: vital.mood },
      });
      if (history.length > 20) history.shift();
      this.npcHistory.set(entityId, history);

      // ── 在目标NPC的历史中也写入事件（双向记录）──
      if (sceneResult.targetName) {
        const targetNpc = nearbyNpcInfos.find((n: NearbyNpcInfo) => n.name === sceneResult.targetName);
        if (targetNpc) {
          // 生成目标视角的叙事（从目标的角度描述同一件事）
          const targetNarrative = sceneResult.success
            ? `${identity.name}对${sceneResult.targetName}${this.getTargetPerspectiveAction(sceneResult.sceneId, sceneResult.success)}`
            : `${identity.name}试图对${sceneResult.targetName}${this.getTargetPerspectiveAction(sceneResult.sceneId, sceneResult.success)}`;

          // 目标NPC的事件日志
          this.eventLog.push({
            tick: this.time.tick,
            time: new Date().toISOString(),
            type: 'npc',
            category: `scene_target:${sceneResult.goalCategory}`,
            message: targetNarrative,
            cause: `scene_target:${sceneResult.sceneId}:${sceneResult.success ? 'success' : 'failure'}`,
            source: sceneResult.targetName,
            target: identity.name,
          });
          this.lastTickEvents++;

          // 目标NPC的行为历史
          const targetHistory = this.npcHistory.get(targetNpc.id) || [];
          const tVital = this.em.getComponent(targetNpc.id, 'Vital') as any;
          const tWallet = this.em.getComponent(targetNpc.id, 'Wallet') as any;
          targetHistory.push({
            tick: this.time.tick,
            shichen: this.time.shichenName,
            action: `被${sceneResult.sceneId}`,
            description: targetNarrative,
            result: sceneResult.success ? '受到影响' : '未受影响',
            cause: `被动:${sceneResult.goalCategory}`,
            stateBefore: { hunger: tVital?.hunger ?? 50, fatigue: tVital?.fatigue ?? 50, copper: tWallet?.copper ?? 0, mood: tVital?.mood ?? 50 },
            stateAfter: {
              hunger: tVital?.hunger,
              fatigue: tVital?.fatigue,
              copper: tWallet?.copper ?? 0,
              mood: tVital?.mood,
            },
          });
          if (targetHistory.length > 20) targetHistory.shift();
          this.npcHistory.set(targetNpc.id, targetHistory);
        }
      }

      return {
        npcName: name,
        action: sceneResult.sceneName,
        result: sceneResult.narrative,
        majorEvents: [],
      };
    }

    // ── 演出库未命中，使用旧决策引擎 ──
    // 调用决策引擎
    const decision = decide(ctx);

    if (!decision) {
      // 决策引擎返回空 → 用兜底
      return this.simulateL0Legacy(entityId, vital, wallet, identity as any);
    }

    // 应用效果到 NeedsComponent
    for (const [key, value] of Object.entries(decision.effects)) {
      if (key in needs) {
        (needs as any)[key] = Math.max(0, Math.min(100, (needs as any)[key] + value));
      }
    }

    // 同步 NeedsComponent 到 VitalComponent（保持兼容）
    vital.hunger = needs.hunger;
    vital.fatigue = needs.fatigue;
    vital.health = needs.health;
    vital.mood = needs.mood;

    // 铜钱效果
    if (decision.effects.copper !== undefined && wallet) {
      wallet.copper = Math.max(0, wallet.copper + decision.effects.copper);
    }

    // ──── 心愿完成处理 ────
    if (decision.completedWhim && whimComp) {
      // 移除已完成的心愿
      whimComp.whims = whimComp.whims.filter(w => w.name !== decision.completedWhim!.name);
      this.logEvent('npc', 'whim_complete', `${name}完成了心愿「${decision.completedWhim.name}」！心情变好了。`);
    }

    // 记录行动到 ActionStateComponent
    const actionStateRec = this.em.getComponent(entityId, 'ActionState');
    if (actionStateRec) {
      actionStateRec.currentGoal = decision.goalId;
      actionStateRec.currentAction = decision.actionId;
      actionStateRec.lastActionTurn = this.time.tick;

      const record: ActionRecord = {
        turn: this.time.tick,
        day: this.time.day,
        shichen: this.time.shichenName,
        goalId: decision.goalId,
        actionId: decision.actionId,
        narrative: decision.narrative,
      };
      actionStateRec.actionHistory.push(record);
      if (actionStateRec.actionHistory.length > 50) {
        actionStateRec.actionHistory.shift();
      }
    }

    // 根据行动类型移动 NPC
    const targetGrid = this.getTargetGridForAction(entityId, decision.actionId);
    this.moveNPCToGrid(entityId, targetGrid);

    // 记录叙事事件
    this.logEvent('npc', 'decision_engine', decision.narrative);

    // ──── 链式反应检查 ────
    const chainResults = this.chainReactionEngine.checkChainReactions({
      sourceId: entityId,
      actionId: decision.actionId,
      currentTick: this.time.tick,
      nearbyIds: nearNpcIds,
      weather: this.weather.weather,
    });
    for (const chain of chainResults) {
      this.logEvent('npc', 'chain_reaction', chain.narrative);
    }

    // ──── 生成叙事片段（留白式） ────
    const relationship = this.em.getComponent(entityId, 'Relationship') || null;
    const narrativeFragment = generateNarrativeFragment({
      npcId: entityId,
      npcName: name,
      emotion: emotion.current,
      emotionIntensity: emotion.intensity,
      stress,
      needs,
      relationship,
      hiddenTraits: hiddenTraits || null,
      currentGrid: gridId,
      shichen: this.time.shichenName,
      weather: this.weather.weather,
      nearNpcIds,
      recentAction: decision.actionId,
      em: this.em,
    });
    this.logEvent('npc', 'narrative_fragment', narrativeFragment);

    // ──── 记忆固化检查 ────
    this.stressMemorySys.consolidateMemories(entityId);

    // 记录NPC行为历史
    const stateAfter = {
      hunger: vital.hunger,
      fatigue: vital.fatigue,
      copper: wallet?.copper ?? copper,
      mood: vital.mood ?? 50,
    };
    if (!this.npcHistory.has(entityId)) {
      this.npcHistory.set(entityId, []);
    }
    const hist = this.npcHistory.get(entityId)!;
    hist.push({
      tick: this.time.tick,
      shichen: this.time.shichenName,
      action: decision.actionId,
      description: decision.narrative,
      result: '成功',
      cause: decision.goalName,
      stateBefore,
      stateAfter,
    });
    if (hist.length > 50) hist.shift();

    // 检查重大事件
    const majorEvents: MajorEvent[] = [];
    if (needs.hunger < 15) {
      majorEvents.push({ type: 'npc', title: `${name}快要饿死了`, detail: `${name}已经饿了好几天了，面色蜡黄。`, impact: 'critical' });
    } else if (needs.hunger < 30) {
      majorEvents.push({ type: 'npc', title: `${name}正在挨饿`, detail: `${name}没钱吃饭，饿着肚子干活。`, impact: 'important' });
    }
    if (needs.mood < 20) {
      majorEvents.push({ type: 'npc', title: `${name}心情极差`, detail: `${name}整日愁眉苦脸。`, impact: 'important' });
    }
    if (needs.health <= 0) {
      majorEvents.push({ type: 'npc', title: `${name}倒下了`, detail: `${name}的健康状况急剧恶化。`, impact: 'critical' });
    }

    return { npcName: name, action: decision.actionId, result: decision.narrative, majorEvents };
  }

  /** 检查家庭成员是否在附近 */
  private isFamilyNearby(entityId: number, identity: any): boolean {
    const pos = this.em.getComponent(entityId, 'Position');
    if (!pos) return false;
    const gridId = pos.gridId;
    const familyIds = [
      identity.spouseId,
      ...(identity.parentIds || []),
      ...(identity.childIds || []),
      ...(identity.siblingIds || []),
    ].filter(Boolean);
    for (const fid of familyIds) {
      const fpos = this.em.getComponent(fid, 'Position');
      if (fpos && fpos.gridId === gridId) return true;
    }
    return false;
  }

  /** 生成每日计划 — 基于性格+抱负+当前需求的哈希 */
  private generateDailyPlan(
    entityId: number,
    personality: string[],
    profession: string,
  ): { biases: Record<string, number>; dayGenerated: number } {
    // 简单哈希：基于 entityId + day 产生不同倾向
    const seed = (entityId * 17 + this.time.day * 31) % 100;
    const categories = ['work', 'social', 'leisure', 'survival', 'family'];
    const biases: Record<string, number> = {};

    // 选3-5个倾向
    const numBiases = 3 + (seed % 3);
    const shuffled = categories.sort(() => (seed * 7 + Math.random() * 100) % 2 === 0 ? 1 : -1);

    for (let i = 0; i < Math.min(numBiases, shuffled.length); i++) {
      const cat = shuffled[i];
      // 性格影响倾向权重
      let bias = 0.2;
      if (cat === 'work' && (personality.includes('勤劳') || personality.includes('精明'))) bias = 0.35;
      if (cat === 'leisure' && personality.includes('懒散')) bias = 0.35;
      if (cat === 'social' && (personality.includes('健谈') || personality.includes('大方'))) bias = 0.35;
      if (cat === 'family' && personality.includes('温和')) bias = 0.35;
      biases[cat] = bias;
    }

    return { biases, dayGenerated: this.time.day };
  }

  /** 旧的 L0 NPC 行动模拟（GOAP fallback） */
  private simulateL0Legacy(entityId: number, vital: VitalComponent, wallet: WalletComponent | null, identity: any): L0ActionResult {
    const name = identity.name;
    const hunger = vital.hunger;
    const fatigue = vital.fatigue;
    const mood = vital.mood ?? 50;
    const copper = wallet?.copper ?? 0;

    // 记录状态快照（决策前）
    const stateBefore = { hunger, fatigue, copper, mood };

    let action: string;
    let actionCause = '';
    let resultDesc = '';
    const majorEvents: MajorEvent[] = [];

    // 状态驱动决策：按优先级检查
    if (hunger < 30) {
      // 饿了 → 吃饭
      action = 'eat';
      actionCause = `饥饿(${hunger})`;
      if (wallet && copper >= 10) {
        wallet.copper = Math.max(0, copper - 10);
        vital.hunger = Math.min(100, hunger + 30);
        resultDesc = `${name}花了10文钱买了顿饭，饱腹感恢复了不少。`;
      } else {
        vital.mood = Math.max(0, mood - 10);
        vital.hunger = Math.max(0, hunger - 5);
        resultDesc = `${name}饿得肚子咕噜响，但囊中羞涩，只能忍着。`;
        // 重大事件：NPC 快饿死了
        if (vital.hunger < 15) {
          majorEvents.push({
            type: 'npc', title: `${name}快要饿死了`,
            detail: `${name}已经饿了好几天了，面色蜡黄，走路都打晃。`,
            impact: 'critical',
          });
        } else if (vital.hunger < 30) {
          majorEvents.push({
            type: 'npc', title: `${name}正在挨饿`,
            detail: `${name}没钱吃饭，只能饿着肚子干活。`,
            impact: 'important',
          });
        }
      }
    } else if (fatigue > 80) {
      // 太累 → 休息
      action = 'rest';
      actionCause = `疲劳(${fatigue})`;
      vital.fatigue = Math.max(0, fatigue - 30);
      resultDesc = fatigue > 90
        ? `${name}累得实在撑不住了，找了个角落瘫倒歇息。`
        : `${name}找了个阴凉处歇了一会儿。`;
    } else if (copper < 20 && Math.random() < 0.6) {
      // 没钱 → 找活赚钱
      const jobs = ['work_dock', 'work_teahouse', 'work_errand'];
      action = jobs[Math.floor(Math.random() * jobs.length)];
      actionCause = `铜钱(${copper})`;
      const earned = Math.floor(Math.random() * 20) + 15;
      if (wallet) wallet.copper += earned;
      vital.fatigue = Math.min(100, fatigue + Math.floor(Math.random() * 11) + 15);
      vital.hunger = Math.max(0, hunger - Math.floor(Math.random() * 3) - 8);
      resultDesc = `${name}手头紧，去打零工赚了${earned}文钱。`;
    } else if (copper > 200 && Math.random() < 0.4) {
      // 有钱 → 消费
      const shops = ['consume_cloth', 'consume_food', 'consume_tea'];
      action = shops[Math.floor(Math.random() * shops.length)];
      actionCause = `富裕(${copper})`;
      const spent = Math.floor(Math.random() * 50) + 20;
      if (wallet) wallet.copper -= spent;
      vital.mood = Math.min(100, mood + Math.floor(Math.random() * 10) + 5);
      vital.hunger = Math.min(100, hunger + 10);
      resultDesc = `${name}花了${spent}文钱享受了一番，心情变好了。`;
    } else if (mood < 30) {
      // 心情差 → 社交/去茶馆
      action = 'socialize';
      actionCause = `心情(${mood})`;
      vital.mood = Math.min(100, mood + Math.floor(Math.random() * 15) + 10);
      if (wallet) wallet.copper = Math.max(0, copper - 5);
      vital.hunger = Math.min(100, hunger + 5);
      resultDesc = `${name}心情低落，去找朋友聊天解闷。`;
      if (mood < 20) {
        majorEvents.push({
          type: 'npc', title: `${name}心情极差`,
          detail: `${name}整日愁眉苦脸，看样子遇到了什么难处。`,
          impact: 'important',
        });
      }
    } else {
      // 按职业工作，但每次效果不同
      const profActions: Record<string, string[]> = {
        merchant: ['sell', 'buy_stock', 'bargain'],
        farmer: ['farm', 'water', 'harvest'],
        guard: ['patrol', 'inspect', 'guard_gate'],
        doctor: ['heal', 'gather_herbs', 'prescribe'],
        hunter: ['hunt', 'set_trap', 'skin_game'],
        rogue: ['steal', 'gamble', 'scout'],
        商贩: ['sell', 'buy_stock', 'bargain'],
        农夫: ['farm', 'water', 'harvest'],
        捕快: ['patrol', 'inspect', 'guard_gate'],
        大夫: ['heal', 'gather_herbs', 'prescribe'],
        猎户: ['hunt', 'set_trap', 'skin_game'],
        小偷: ['steal', 'gamble', 'scout'],
      };
      const options = profActions[identity.profession] || ['wander', 'stroll', 'chat'];
      action = options[Math.floor(Math.random() * options.length)];
      actionCause = `职业:${identity.profession}`;
      const earned = Math.floor(Math.random() * 40) + 10;
      if (wallet && action !== 'wander' && action !== 'stroll' && action !== 'chat') {
        wallet.copper += earned;
      }
      vital.fatigue = Math.min(100, fatigue + Math.floor(Math.random() * 11) + 15);
      vital.hunger = Math.max(0, hunger - Math.floor(Math.random() * 3) - 8);
      resultDesc = '';  // 用下方模板生成
    }

    // 检查健康状态重大事件
    if (vital.health <= 0) {
      majorEvents.push({
        type: 'npc', title: `${name}倒下了`,
        detail: `${name}的健康状况急剧恶化，已经无法起身了。`,
        impact: 'critical',
      });
    } else if (vital.health < 20) {
      majorEvents.push({
        type: 'npc', title: `${name}身体堪忧`,
        detail: `${name}面色苍白，看起来病得不轻。`,
        impact: 'important',
      });
    }

    // 记录叙事事件（含位置变化描述）
    const targetGrid = this.getTargetGridForAction(entityId, action);
    const eventTemplates: Record<string, string[]> = {
      eat: [`${name}去中心大街买了两个炊饼，蹲着吃起来。`, `${name}去茶馆吃了一碗热汤面。`, `${name}啃着冷馒头，就着咸菜。`],
      rest: [`${name}回家休息了。`, `${name}回到住处打了个盹。`, `${name}靠在自家墙根眯了一小会儿。`],
      work_dock: [`${name}去码头扛了几包货，赚了些辛苦钱。`, `${name}在码头帮人卸了一船货。`],
      work_teahouse: [`${name}去茶楼帮忙跑堂。`, `${name}去茶楼帮工端茶倒水。`],
      work_errand: [`${name}帮人跑腿送了封信。`, `${name}在东市帮人搬了一车货。`],
      consume_cloth: [`${name}去布庄挑了匹好布，眉开眼笑。`, `${name}买了块新帕子，高兴得不得了。`],
      consume_food: [`${name}在东市买了只烧鸡，美滋滋地啃着。`, `${name}去东市点了一桌子好菜。`],
      consume_tea: [`${name}去茶楼叫了一壶好茶，悠闲地品着。`, `${name}请朋友在茶楼喝了壶碧螺春。`],
      socialize: [`${name}去找朋友串门聊天。`, `${name}去茶馆里和人大声说笑。`, `${name}和邻家大婶聊了半天闲话。`],
      sell: [`${name}在铺子里卖出了一批货物，笑得合不拢嘴。`, `${name}在铺子里招呼客人。`],
      buy_stock: [`${name}去码头进了一批新货。`, `${name}和供货商讨价还价半天。`],
      bargain: [`${name}和客商谈了一笔大买卖。`, `${name}在柜台后面拨算盘，精打细算。`],
      farm: [`${name}去田里忙碌了一个时辰。`, `${name}弯腰在田里除草。`],
      water: [`${name}挑水浇了一亩菜地。`, `${name}在田埂上修水渠。`],
      harvest: [`${name}收割了一筐庄稼。`, `${name}在田里忙着收麦子。`],
      patrol: [`${name}在街上巡逻，目光警惕。`, `${name}检查了几个摊位的执照。`],
      inspect: [`${name}在城门口盘查过往行人。`, `${name}挨家挨户查火烛。`],
      guard_gate: [`${name}在城门口站岗。`, `${name}守在府衙门口。`],
      heal: [`${name}在药铺里给病人开了药方。`, `${name}在药铺里配药。`],
      gather_herbs: [`${name}背着药篓上山采药去了。`, `${name}在山里找草药。`],
      prescribe: [`${name}在灯下翻医书。`, `${name}给老主顾配了几丸补药。`],
      hunt: [`${name}扛着弓进了山林。`, `${name}在溪边设了陷阱。`],
      set_trap: [`${name}在山路上布了几个套子。`, `${name}检查了昨天的陷阱。`],
      skin_game: [`${name}在处理猎物的皮毛。`, `${name}把猎物拿到集市上卖。`],
      steal: [`${name}在人群中挤来挤去，贼眼溜溜。`, `${name}贴着一个客商蹭过去。`],
      gamble: [`${name}和几个混混在后巷推牌九。`, `${name}在赌坊门前转悠。`],
      scout: [`${name}在街上东张西望。`, `${name}在暗巷里窥探富户的院墙。`],
      wander: [`${name}在街上闲逛。`],
      stroll: [`${name}沿着河边散步。`, `${name}在桥上看风景。`],
      chat: [`${name}和街坊邻居拉家常。`, `${name}在路边和人下棋。`],
    };
    const templates = eventTemplates[action] || eventTemplates.wander;
    const description = templates[Math.floor(Math.random() * templates.length)];
    if (!resultDesc) resultDesc = description;
    this.logEvent('npc', 'npc_action', description);

    // 记录NPC行为历史
    const stateAfter = {
      hunger: vital.hunger,
      fatigue: vital.fatigue,
      copper: wallet?.copper ?? copper,
      mood: vital.mood ?? mood,
    };
    const historyEntry: NPCHistoryEntry = {
      tick: this.time.tick,
      shichen: this.time.shichenName,
      action,
      description,
      result: '成功',
      cause: actionCause,
      stateBefore,
      stateAfter,
    };
    if (!this.npcHistory.has(entityId)) {
      this.npcHistory.set(entityId, []);
    }
    const hist = this.npcHistory.get(entityId)!;
    hist.push(historyEntry);
    if (hist.length > 50) hist.shift();

    // 根据行为移动 NPC（targetGrid 已在上方事件模板前计算）
    this.moveNPCToGrid(entityId, targetGrid);

    return { npcName: name, action, result: resultDesc, majorEvents };
  }

  /** L1 NPC 批量模拟 */
  private simulateL1Batch(): { total: number; highlights: string[] } {
    let actions = 0;
    const l1Highlights: string[] = [];

    for (const entityId of this.l1Entities) {
      const vital = this.em.getComponent(entityId, 'Vital');
      if (!vital) continue;

      // L1 NPC 需求衰减（所有 L1 NPC）
      const needs = this.em.getComponent(entityId, 'Needs');
      if (needs) {
        needs.hunger = Math.max(0, needs.hunger - (3 + Math.floor(Math.random() * 3)));
        needs.fatigue = Math.max(0, needs.fatigue - (1 + Math.floor(Math.random() * 3)));
        needs.mood = Math.max(0, needs.mood - (1 + Math.floor(Math.random() * 2)));
        needs.social = Math.max(0, needs.social - (1 + Math.floor(Math.random() * 2)));

        // 同步到 Vital（保持兼容）
        vital.hunger = needs.hunger;
        vital.fatigue = needs.fatigue;
        vital.health = needs.health;
        vital.mood = needs.mood;
      } else {
        // 没有 NeedsComponent 的旧 L1 用简单衰减
        vital.hunger = Math.max(0, vital.hunger - 5);
        vital.fatigue = Math.min(100, vital.fatigue + 3);
      }

      // 有 NeedsComponent 的 L1 NPC → 简化决策引擎
      if (needs) {
        const result = this.simulateL1Decision(entityId, needs, vital);
        if (result) {
          l1Highlights.push(result.narrative);
        }
      } else {
        // fallback: 10% 概率随机移到相邻 grid
        const type = this.em.getType(entityId);
        if (type === 'npc' && Math.random() < 0.1) {
          const pos = this.em.getComponent(entityId, 'Position');
          if (pos && !pos.gridId.startsWith('interior_')) {
            const neighbors = MAP_CONNECTIONS[pos.gridId];
            if (neighbors && neighbors.length > 0) {
              const targetGrid = neighbors[Math.floor(Math.random() * neighbors.length)];
              this.moveNPCToGrid(entityId, targetGrid);
            }
          }
        }
      }

      actions++;
    }
    this.lastTickEvents = actions + this.l0Entities.length;

    // 生成 L1 汇总事件
    const npcCount = this.l1Entities.length;
    const highlights: string[] = [];
    if (npcCount > 0) {
      // 将决策引擎产出的亮点纳入
      highlights.push(...l1Highlights.slice(0, 5));
      const summaries = [
        `城中有${Math.min(npcCount, Math.floor(npcCount * 0.3))}人在忙碌地干活。`,
        `街上来来往往${Math.floor(npcCount * 0.1)}个行人。`,
        `码头上${Math.floor(Math.random() * 30 + 10)}个搬运工在扛货。`,
      ];
      const summary = summaries[Math.floor(Math.random() * summaries.length)];
      this.logEvent('npc', 'l1_summary', summary);
      highlights.push(summary);
    }
    return { total: actions, highlights };
  }

  /** L1 NPC 简化决策引擎（只取最紧急需求，一句话叙事） */
  private simulateL1Decision(entityId: number, needs: NeedsComponent, vital: VitalComponent): { narrative: string } | null {
    const identity = this.em.getComponent(entityId, 'Identity');
    const name = identity?.name || '某人';
    const profession = identity?.profession || 'merchant';
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const pos = this.em.getComponent(entityId, 'Position');
    const copper = wallet?.copper ?? 0;
    const gridId = pos?.gridId || 'center_street';

    // 检查家庭成员是否在附近
    const familyNearby = this.isFamilyNearby(entityId, identity);
    const nearNpcCount = this.worldMap.getEntitiesInGrid(gridId).length;
    const inv = this.em.getComponent(entityId, 'Inventory');

    const ctx = {
      needs,
      npcName: name,
      profession,
      personality: identity?.personality || [],
      factionRole: identity?.factionRole,
      copper,
      currentGrid: gridId,
      weather: this.weather.weather,
      shichen: this.time.shichenName,
      day: this.time.day,
      tick: this.time.tick,
      factionId: identity?.factionId,
      familyNearby,
      inventory: inv?.items || [],
      nearNpcCount,
    } as DecisionContext;

    // 调用决策引擎
    const decision = decide(ctx);
    if (!decision) return null;

    // 应用效果到 NeedsComponent
    for (const [key, value] of Object.entries(decision.effects)) {
      if (key in needs) {
        (needs as any)[key] = Math.max(0, Math.min(100, (needs as any)[key] + value));
      }
    }
    // 同步到 Vital
    vital.hunger = needs.hunger;
    vital.fatigue = needs.fatigue;
    vital.health = needs.health;
    vital.mood = needs.mood;

    // 铜钱效果
    if (decision.effects.copper !== undefined && wallet) {
      wallet.copper = Math.max(0, wallet.copper + decision.effects.copper);
    }

    // 移动 NPC
    const targetGrid = this.getTargetGridForAction(entityId, decision.actionId);
    this.moveNPCToGrid(entityId, targetGrid);

    // 记录行动到 ActionStateComponent（只保留最近5条）
    const actionStateL1 = this.em.getComponent(entityId, 'ActionState');
    if (actionStateL1) {
      actionStateL1.currentGoal = decision.goalId;
      actionStateL1.currentAction = decision.actionId;
      actionStateL1.lastActionTurn = this.time.tick;

      const record = {
        turn: this.time.tick,
        day: this.time.day,
        shichen: this.time.shichenName,
        goalId: decision.goalId,
        actionId: decision.actionId,
        narrative: decision.narrative,
      } as ActionRecord;
      actionStateL1.actionHistory.push(record);
      if (actionStateL1.actionHistory.length > 5) {
        actionStateL1.actionHistory.shift();
      }
    }

    return { narrative: `${name}${decision.narrative}` };
  }

  /** NPC 移动到指定 grid */
  private moveNPCToGrid(entityId: number, targetGrid: string): void {
    const pos = this.em.getComponent(entityId, 'Position');
    if (!pos || pos.gridId === targetGrid) return;
    // interior_ grid 不能作为 NPC 目标，只移动到真实 grid
    if (targetGrid.startsWith('interior_')) return;
    this.worldMap.moveEntity(entityId, targetGrid);
    pos.gridId = targetGrid;
  }

  /** 根据 NPC 的 homeId 获取住宅所在 grid */
  private getHomeGrid(entityId: number): string {
    const identity = this.em.getComponent(entityId, 'Identity') as any;
    const homeId = identity?.homeId;
    if (homeId && this.em.isAlive(homeId)) {
      const bpos = this.em.getComponent(homeId, 'Position');
      if (bpos?.gridId && !bpos.gridId.startsWith('interior_')) return bpos.gridId;
    }
    return 'residential_north';
  }

  /** 根据 NPC 的 workplaceId 获取工作地点所在 grid */
  private getWorkGrid(entityId: number): string {
    const identity = this.em.getComponent(entityId, 'Identity') as any;
    const workplaceId = identity?.workplaceId;
    if (workplaceId && this.em.isAlive(workplaceId)) {
      const bpos = this.em.getComponent(workplaceId, 'Position');
      if (bpos?.gridId && !bpos.gridId.startsWith('interior_')) return bpos.gridId;
    }
    return 'east_market';
  }

  /** 根据 action 确定目标 grid */
  private getTargetGridForAction(entityId: number, action: string): string {
    switch (action) {
      case 'eat': return 'center_street';
      case 'rest': return this.getHomeGrid(entityId);
      case 'work_dock': return 'dock';
      case 'work_teahouse': return 'tea_house';
      case 'work_errand': return 'east_market';
      case 'consume_cloth': return 'cloth_shop';
      case 'consume_food': return 'east_market';
      case 'consume_tea': return 'tea_house';
      case 'socialize': return Math.random() < 0.5 ? 'tea_house' : 'center_street';
      case 'gamble': return 'center_street';
      case 'scout': return 'center_street';
      case 'steal': return 'east_market';
      case 'sell': case 'buy_stock': case 'bargain': return this.getWorkGrid(entityId);
      case 'farm': case 'water': case 'harvest': return Math.random() < 0.5 ? 'east_farm' : 'south_farm';
      case 'patrol': case 'inspect': case 'guard_gate': return 'center_street';
      case 'heal': case 'prescribe': return this.getWorkGrid(entityId);
      case 'gather_herbs': return 'shallow_mountain';
      case 'hunt': case 'set_trap': case 'skin_game': return 'shallow_mountain';
      case 'wander': case 'stroll': case 'chat': return 'center_street';
      default: return this.getWorkGrid(entityId);
    }
  }

  /** 生成远方消息（基于 tick+day 哈希，避免短时间重复） */
  private generateDistantNews(): { message: string; cause: string; source: string }[] {
    const allNews: { message: string; cause: string; source: string }[] = [
      { message: '听说杭州丝绸大涨，苏杭商人都赶着去进货了。', cause: '经济: 杭州丝绸供不应求', source: '远方' },
      { message: '京东路的粮仓遭了水灾，粮价怕是要涨。', cause: '生态: 京东路水灾', source: '京东路' },
      { message: '辽国使团不日到达汴京，市面都要管制。', cause: '政治: 辽国使团进京', source: '边关' },
      { message: '西夏那边又闹起来了，边贸断了。', cause: '政治: 西夏冲突', source: '边关' },
      { message: '听说襄阳那边发现了金矿，好多人赶过去。', cause: '经济: 襄阳金矿发现', source: '襄阳' },
      { message: '漕运的船在淮河搁浅了，布匹要断货。', cause: '物流: 淮河漕运中断', source: '淮河' },
      { message: '陕西大旱，药材产地受了灾。', cause: '生态: 陕西大旱', source: '陕西' },
      { message: '两浙路的茶商组团进京了，茶价要跌。', cause: '经济: 茶叶供应增加', source: '两浙路' },
      { message: '听说朝廷要开恩科，各地举子纷纷进京赶考。', cause: '政治: 恩科开考', source: '京城' },
      { message: '黄河决口了，京东路的庄稼都毁了。', cause: '生态: 黄河决口', source: '黄河' },
      { message: '河北路的马贩子牵了三百匹好马来。', cause: '经济: 马匹供应增加', source: '河北路' },
      { message: '江南的丝绸船到了，布价要降了。', cause: '经济: 丝绸到货', source: '汴河码头' },
      { message: '听说南方有个县令被革职了，贪了上万两。', cause: '政治: 县令革职', source: '南方' },
      { message: '京城的瓦子里来了新的杂技班子。', cause: '文化: 新杂技班子', source: '京城' },
      { message: '岳州楼的酒涨价了，一壶要五十文。', cause: '经济: 酒价上涨', source: '岳州' },
      { message: '成都府的蜀锦今年特别好，太监都来采买了。', cause: '经济: 蜀锦丰收', source: '成都府' },
    ];
    // 用 tick+day 做简单哈希选消息，保证不同回合选到不同条目
    const seed = this.time.tick * 7 + this.time.day * 31;
    const count = (seed % 3) + 1; // 1~3 条
    const result: { message: string; cause: string; source: string }[] = [];
    for (let i = 0; i < count; i++) {
      const idx = (seed + i * 13) % allNews.length;
      const news = allNews[idx];
      if (!result.some(r => r.message === news.message)) {
        result.push(news);
      }
    }
    return result;
  }

  /** 执行玩家操作 → 完整 Tick，返回丰富场景描述 */
  executePlayerAction(playerId: number, actionId: string, params: any): TickResult {
    const timings: TickTimings = {
      total: 0, playerAction: 0, l0GOAP: 0, l1BehaviorTree: 0,
      l2Statistics: 0, economy: 0, perception: 0, vitalDecay: 0, assemble: 0,
    };
    const startTotal = performance.now();

    // 确保 AP 组件存在（仅当没有时才初始化）
    {
      const ap = this.em.getComponent(playerId, 'ActionPoints');
      if (!ap) {
        this.em.addComponent(playerId, 'ActionPoints', { current: this.AP_PER_TURN, max: this.AP_PER_TURN });
      }
    }

    // 检查 AP（移动类和特殊行动消耗不同 AP）
    const apCost = this.getActionAPCost(actionId);
    if (!this.consumeAP(playerId, apCost)) {
      // AP 不足，返回错误但仍然构建场景
      const pos = this.em.getComponent(playerId, 'Position');
      const gridId = pos?.gridId || 'center_street';
      const template = this.getSceneTemplate(gridId);
      const sceneCtx = this.getSceneContext(playerId);
      const vital = this.em.getComponent(playerId, 'Vital');
      const wallet = this.em.getComponent(playerId, 'Wallet');
      const apData = this.getPlayerAP(playerId);
      return {
        success: false,
        message: '行动点不足，请结束回合。',
        sceneDescription: template.getDescription(sceneCtx),
        sceneLocation: template.locationName,
        options: [],
        npcMessages: [],
        timings: { total: 0, playerAction: 0, l0GOAP: 0, l1BehaviorTree: 0, l2Statistics: 0, economy: 0, perception: 0, vitalDecay: 0, assemble: 0 },
        perception: this.perception.getPerceptionData(playerId),
        worldState: {
          tick: this.time.tick, shichen: this.time.shichenName, day: this.time.day,
          season: this.time.season, weather: this.weather.weather,
          weatherDesc: this.weather.getDescription(), prices: this.economy.getPrices(),
        },
        playerState: {
          hunger: vital?.hunger ?? 50, fatigue: vital?.fatigue ?? 50,
          health: vital?.health ?? 80, mood: vital?.mood ?? 50,
          copper: wallet?.copper ?? 0, ap: apData.current, apMax: apData.max,
        },
        turnSummary: { shichen: this.time.shichenName, day: this.time.day, tick: this.time.tick, l0Actions: [], l1Summary: { total: 0, highlights: [] }, majorEvents: [], weatherChange: null, priceChanges: {}, totalEvents: 0, npcActions: 0, weather: this.weather.weather, weatherDesc: this.weather.getDescription(), events: 0 },
        distantNews: [],
        briefing: this.generateBriefing(gridId, {}, []),
      };
    }

    // 1. 执行玩家操作
    let t0 = performance.now();
    const actionMessage = this.executeAction(playerId, actionId, params);
    timings.playerAction = performance.now() - t0;

    // 2. 回合模拟：全世界推进一回合
    t0 = performance.now();
    const simResult = this.simulateTurn();
    timings.l0GOAP = performance.now() - t0;

    // 3. 感知计算
    t0 = performance.now();
    const percData = this.perception.getPerceptionData(playerId);
    timings.perception = performance.now() - t0;

    // 4. 组装场景描述
    t0 = performance.now();

    const pos = this.em.getComponent(playerId, 'Position');
    const gridId = pos?.gridId || 'center_street';
    const template = this.getSceneTemplate(gridId);
    const sceneCtx = this.getSceneContext(playerId, simResult.causalEvents);

    const sceneDescription = template.getDescription(sceneCtx);
    // options removed — 动态提供
    const sceneLocation = template.locationName;

    // 生成 NPC 消息（含因果事件）
    const npcMessages: string[] = [];
    // 将因果事件中 spreadRadius=0 的事件作为近处消息
    for (const ce of simResult.causalEvents) {
      if (ce.spreadRadius <= 1) {
        npcMessages.push(ce.message);
      }
    }
    if (npcMessages.length === 0 && Math.random() > 0.3) {
      npcMessages.push(pickChatter());
    }

    const vital = this.em.getComponent(playerId, 'Vital');
    const wallet = this.em.getComponent(playerId, 'Wallet');
    const apData = this.getPlayerAP(playerId);

    // 远方消息（结构化，含因果标记）
    const distantNews = this.generateDistantNews();

    // 生成回合简报
    const briefing = this.generateBriefing(gridId, simResult.priceChanges, distantNews);

    timings.assemble = performance.now() - t0;
    timings.total = performance.now() - startTotal;

    // 事件计数
    const recentEvents = this.getEvents(20);
    const tickEvents = recentEvents.filter(e => e.tick === this.time.tick).length;

    return {
      success: true,
      message: actionMessage,
      sceneDescription,
      sceneLocation,
      options: [],
      npcMessages,
      timings,
      perception: percData,
      worldState: {
        tick: this.time.tick,
        shichen: this.time.shichenName,
        day: this.time.day,
        season: this.time.season,
        weather: this.weather.weather,
        weatherDesc: this.weather.getDescription(),
        prices: this.economy.getPrices(),
      },
      playerState: {
        hunger: vital?.hunger ?? 50,
        fatigue: vital?.fatigue ?? 50,
        health: vital?.health ?? 80,
        mood: vital?.mood ?? 50,
        copper: wallet?.copper ?? 0,
        ap: apData.current,
        apMax: apData.max,
      },
      turnSummary: {
        shichen: this.time.shichenName,
        day: this.time.day,
        tick: this.time.tick,
        l0Actions: simResult.l0Actions,
        l1Summary: simResult.l1Summary,
        majorEvents: simResult.majorEvents,
        weatherChange: simResult.weatherChange,
        priceChanges: simResult.enrichedPriceChanges,
        totalEvents: tickEvents,
        npcActions: simResult.npcActions,
        weather: this.weather.weather,
        weatherDesc: this.weather.getDescription(),
        events: tickEvents,
      },
      distantNews,
      briefing,
    };
  }

  /** 获取初始场景（玩家刚连接时） */
  getInitialScene(playerId: number): { description: string; location: string; options: SceneOption[] } {
    this.resetAP(playerId);
    const pos = this.em.getComponent(playerId, 'Position');
    const gridId = pos?.gridId || 'center_street';
    const template = this.getSceneTemplate(gridId);
    const ctx = this.getSceneContext(playerId);
    return {
      description: template.getDescription(ctx),
      location: template.locationName,
      options: [],
    };
  }

  /** 结束回合（不执行玩家行动，推进世界） */
  endTurn(playerId: number): TickResult {
    // 重置 AP
    this.resetAP(playerId);

    // 推进世界
    const simResult = this.simulateTurn();

    const pos = this.em.getComponent(playerId, 'Position');
    const gridId = pos?.gridId || 'center_street';
    const template = this.getSceneTemplate(gridId);
    const sceneCtx = this.getSceneContext(playerId, simResult.causalEvents);

    const sceneDescription = template.getDescription(sceneCtx);
    // options removed — 动态提供

    const npcMessages: string[] = [];
    for (const ce of simResult.causalEvents) {
      if (ce.spreadRadius <= 1) npcMessages.push(ce.message);
    }
    if (npcMessages.length === 0 && Math.random() > 0.3) {
      npcMessages.push(pickChatter());
    }

    const vital = this.em.getComponent(playerId, 'Vital');
    const wallet = this.em.getComponent(playerId, 'Wallet');
    const apData = this.getPlayerAP(playerId);
    const distantNews = this.generateDistantNews();
    const briefing = this.generateBriefing(gridId, simResult.priceChanges, distantNews);
    const recentEvents = this.getEvents(20);
    const tickEvents = recentEvents.filter(e => e.tick === this.time.tick).length;

    return {
      success: true,
      message: '你结束了本回合，世界继续运转。',
      sceneDescription,
      sceneLocation: template.locationName,
      options: [],
      npcMessages,
      timings: { total: 0, playerAction: 0, l0GOAP: 0, l1BehaviorTree: 0, l2Statistics: 0, economy: 0, perception: 0, vitalDecay: 0, assemble: 0 },
      perception: this.perception.getPerceptionData(playerId),
      worldState: {
        tick: this.time.tick, shichen: this.time.shichenName, day: this.time.day,
        season: this.time.season, weather: this.weather.weather,
        weatherDesc: this.weather.getDescription(), prices: this.economy.getPrices(),
      },
      playerState: {
        hunger: vital?.hunger ?? 50, fatigue: vital?.fatigue ?? 50,
        health: vital?.health ?? 80, mood: vital?.mood ?? 50,
        copper: wallet?.copper ?? 0, ap: apData.current, apMax: apData.max,
      },
      turnSummary: {
        shichen: this.time.shichenName, day: this.time.day, tick: this.time.tick,
        l0Actions: simResult.l0Actions,
        l1Summary: simResult.l1Summary,
        majorEvents: simResult.majorEvents,
        weatherChange: simResult.weatherChange,
        priceChanges: simResult.enrichedPriceChanges,
        totalEvents: tickEvents, npcActions: simResult.npcActions,
        weather: this.weather.weather, weatherDesc: this.weather.getDescription(), events: tickEvents,
      },
      distantNews,
      briefing,
    };
  }

  /** 获取行动的 AP 消耗 */
  private getActionAPCost(actionId: string): number {
    // 通用移动消耗 1 AP
    if (actionId === 'move') return 1;

    // 旧移动类行动消耗 0 AP
    const freeActions = ['go_center', 'go_east_market', 'go_tea_house', 'go_dock', 'go_residential',
      'enter_cloth_shop', 'enter_pharmacy', 'leave_cloth_shop', 'leave_pharmacy', 'leave_home'];
    if (freeActions.includes(actionId)) return 0;

    // 交互类行动（来自涌现式行为系统）
    const apCosts: Record<string, number> = {
      talk_to: 1, ask_rumor: 1, trade_buy: 2, trade_sell: 2, share_food: 1,
      help_request: 1, steal: 2, learn_skill: 2, invite_travel: 1, heal: 2,
      provoke: 2, sworn_brothers: 3, gift: 1,
      shelter: 0, gather_fruit: 1, fish: 2, scavenge: 1,
      enter_building: 1, buy_from_shop: 1, ask_around: 1,
      observe: 0, feed_animal: 1, chase_away: 1, track_animal: 1, hunt: 2, tame: 3,
      chop: 2, water_plant: 1, gather: 1,
      mine: 3, collect: 2,
      pickup: 1, inspect: 0, use_item: 1,
      // 兼容旧 action ID
      trade: 2, feed: 1, water: 1,
    };
    if (apCosts[actionId] !== undefined) return apCosts[actionId];

    // 默认消耗 1 AP
    return 1;
  }

  /** 执行简单行动 */
  private executeAction(playerId: number, actionId: string, params: any): string {
    const pos = this.em.getComponent(playerId, 'Position');
    const wallet = this.em.getComponent(playerId, 'Wallet');
    const vital = this.em.getComponent(playerId, 'Vital');
    const inventory = this.em.getComponent(playerId, 'Inventory');

    switch (actionId) {
      // ---- 通用移动 ----
      case 'move': {
        const targetGrid = params?.targetGrid;
        if (!pos || !targetGrid) return '无法移动。';
        
        // 离开建筑内部（interior grid → 外部 grid）
        if (pos.gridId.startsWith('interior_') || params?.type === 'leave') {
          // 把建筑内移入的实体移回原处
          const currentInterior = pos.gridId;
          const interiorEntities = this.worldMap.getEntitiesInGrid(currentInterior);
          for (const eid of interiorEntities) {
            if (eid === playerId) continue;
            const epos = this.em.getComponent(eid, 'Position');
            if (epos) {
              // 移回目标 grid
              this.worldMap.moveEntity(eid, targetGrid);
              epos.gridId = targetGrid;
            }
          }
          this.worldMap.moveEntity(playerId, targetGrid);
          pos.gridId = targetGrid;
          pos.areaId = this.getAreaForGrid(targetGrid);
          this.logEvent('player', '移动', `你离开了建筑，回到了${GRID_NAMES[targetGrid] || targetGrid}`);
          return `你推开门走了出来，回到了${GRID_NAMES[targetGrid] || targetGrid}。`;
        }
        
        // 普通移动（检查 MAP_CONNECTIONS）
        if (MAP_CONNECTIONS[pos.gridId]?.includes(targetGrid)) {
          const areaId = this.getAreaForGrid(targetGrid);
          this.worldMap.moveEntity(playerId, targetGrid);
          pos.gridId = targetGrid;
          pos.areaId = areaId;
          this.logEvent('player', '移动', `你来到了${GRID_NAMES[targetGrid] || targetGrid}`);
          return `你来到了${GRID_NAMES[targetGrid] || targetGrid}。`;
        }
        return '无法移动到该地点。';
      }

      // ---- 中心大街 ----
      case 'buy_food': {
        if (!wallet || wallet.copper < 5) return '铜板不够';
        wallet.copper -= 5;
        if (vital) vital.hunger = Math.min(100, vital.hunger + 30);
        if (vital) vital.mood = Math.min(100, vital.mood + 5);
        this.logEvent('player', '交易', '你花5文买了个炊饼');
        return '买了一个热腾腾的炊饼，一口咬下去，外皮酥脆，馅料喷香。';
      }
      case 'go_east_market': {
        if (pos) { this.worldMap.moveEntity(playerId, 'east_market'); pos.gridId = 'east_market'; pos.areaId = 'city'; }
        this.logEvent('player', '移动', '你从中心大街走到了东市');
        return '你沿着大街向东走去，穿过熙熙攘攘的人群，来到了东市。';
      }
      case 'go_tea_house': {
        if (pos) { this.worldMap.moveEntity(playerId, 'tea_house'); pos.gridId = 'tea_house'; pos.areaId = 'city'; }
        if (wallet && wallet.copper >= 2) { wallet.copper -= 2; }
        this.logEvent('player', '移动', '你去了清风茶楼喝茶');
        return '你走进清风茶楼，茶香袅袅，说书先生正讲到精彩处。';
      }
      case 'go_dock': {
        if (pos) { this.worldMap.moveEntity(playerId, 'dock'); pos.gridId = 'dock'; pos.areaId = 'city'; }
        this.logEvent('player', '移动', '你去了汴河码头');
        return '你向城南走去，到了汴河码头。';
      }
      case 'go_residential': {
        if (pos) { this.worldMap.moveEntity(playerId, 'residential_north'); pos.gridId = 'residential'; pos.areaId = 'residential'; }
        this.logEvent('player', '移动', '你回到家中');
        return '你沿着小巷回到家中。';
      }
      case 'chat': {
        if (vital) vital.mood = Math.min(100, vital.mood + 5);
        this.logEvent('player', '社交', '你和路人攀谈了几句');
        return '你和路人攀谈了几句。';
      }

      // ---- 东市 ----
      case 'enter_cloth_shop': {
        if (pos) { this.worldMap.moveEntity(playerId, 'cloth_shop'); pos.gridId = 'cloth_shop'; pos.areaId = 'city'; }
        return '你推开了锦绣布庄的门。';
      }
      case 'enter_pharmacy': {
        if (pos) { this.worldMap.moveEntity(playerId, 'pharmacy'); pos.gridId = 'pharmacy'; pos.areaId = 'city'; }
        return '你走进了济世堂药铺。';
      }
      case 'chat_market': {
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        return '你在茶摊边坐下，竖起耳朵听人说话。';
      }
      case 'go_center': {
        if (pos) { this.worldMap.moveEntity(playerId, 'center_street'); pos.gridId = 'center_street'; pos.areaId = 'city'; }
        return '你回到中心大街。';
      }

      // ---- 布庄 ----
      case 'buy_hemp': {
        if (!wallet || wallet.copper < 50) return '"这点钱…怕是买不了什么。"王掌柜摇头。';
        wallet.copper -= 50;
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        this.logEvent('player', '交易', '你在布庄买了匹粗麻布，花了50文');
        return '你买了匹粗麻布，虽粗糙但结实。王掌柜说："实用就好，实在人。"';
      }
      case 'buy_cotton': {
        if (!wallet || wallet.copper < 200) return '"这个价…您怕是买不起。"王掌柜的笑容淡了几分。';
        wallet.copper -= 200;
        if (vital) vital.mood = Math.min(100, vital.mood + 8);
        this.logEvent('player', '交易', '你在布庄买了匹上好的棉布，花了200文');
        return '你买了匹上好的棉布，柔软透气。王掌柜眉开眼笑："好眼光！"';
      }
      case 'ask_silk':
        return '王掌柜压低声音："这苏绣残片可是好东西，只是沾了水渍，品相差了些。若你不要，隔壁钱掌柜也惦记着呢。"';
      case 'chat_shopkeeper':
        return '王掌柜叹道："最近生意不好做啊，城南闹匪，商路不通，进货都难。"';
      case 'leave_cloth_shop': {
        if (pos) { this.worldMap.moveEntity(playerId, 'east_market'); pos.gridId = 'east_market'; pos.areaId = 'city'; }
        return '你走出布庄，回到东市的热闹中。';
      }

      // ---- 药铺 ----
      case 'buy_cold_medicine': {
        if (!wallet || wallet.copper < 30) return '铜板不够。';
        wallet.copper -= 30;
        return '你买了一帖风寒散。"注意保暖，别再着凉了。"伙计叮嘱道。';
      }
      case 'buy_wound_medicine': {
        if (!wallet || wallet.copper < 50) return '铜板不够。';
        wallet.copper -= 50;
        return '你买了一瓶金创药。"这药效果好，外伤敷上就行。"伙计说。';
      }
      case 'see_doctor': {
        if (!wallet || wallet.copper < 20) return '诊金不够。';
        wallet.copper -= 20;
        if (vital) vital.health = Math.min(100, vital.health + 15);
        return '李大夫给你把了脉，开了副药方。"没什么大碍，注意饮食起居即可。"';
      }
      case 'chat_pharmacy':
        return '伙计说："最近药材涨了不少，听说是产地遭了灾。"';
      case 'leave_pharmacy': {
        if (pos) { this.worldMap.moveEntity(playerId, 'east_market'); pos.gridId = 'east_market'; pos.areaId = 'city'; }
        return '你走出济世堂。';
      }

      // ---- 茶楼 ----
      case 'drink_tea': {
        if (!wallet || wallet.copper < 3) return '你囊中羞涩，只好咽了口唾沫。';
        wallet.copper -= 3;
        if (vital) { vital.mood = Math.min(100, vital.mood + 10); vital.fatigue = Math.min(100, vital.fatigue + 5); }
        return '小二端上一壶龙井，你慢慢品着。说书先生的故事越来越精彩了。';
      }
      case 'listen_rumor': {
        if (vital) vital.mood = Math.min(100, vital.mood + 2);
        return '你假装喝茶，仔细听邻桌的人说话。布价涨了三成，城南闹匪，商路不通。';
      }
      case 'talk_npc': {
        if (vital) vital.mood = Math.min(100, vital.mood + 5);
        return `${pickNPC()}放下茶杯，看了你一眼："年轻人，最近城里不太平，买东西要趁早。"`;
      }

      // ---- 码头 ----
      case 'carry_cargo': {
        if (vital) {
          if (vital.fatigue < 20) return '你已经累得搬不动了，先歇歇吧。';
          vital.fatigue = Math.max(0, vital.fatigue - 20);
          vital.hunger = Math.max(0, vital.hunger - 10);
        }
        if (wallet) wallet.copper += 15;
        this.logEvent('player', '工作', '你在码头扛包赚了15文');
        return '你扛了一下午麻袋，累得腰酸背痛，赚了 15 文。';
      }
      case 'chat_foreman':
        return '管事翻了翻簿子："最近货多，你要是肯出力，不愁没钱赚。"';

      // ---- 家中 ----
      case 'sleep': {
        if (vital) { vital.fatigue = Math.min(100, vital.fatigue + 40); vital.hunger = Math.max(0, vital.hunger - 15); }
        return '你躺下睡了一觉，醒来精神好了不少。肚子倒是更饿了。';
      }
      case 'eat_home': {
        if (vital) vital.hunger = Math.min(100, vital.hunger + 20);
        return '你热了些剩饭吃了。虽然简朴，但聊胜于无。';
      }
      case 'check_storage':
        return '你翻了翻家里的木箱。几件旧衣服，一袋稻种，还有些散碎杂物。';
      case 'leave_home': {
        if (pos) { this.worldMap.moveEntity(playerId, 'center_street'); pos.gridId = 'center_street'; pos.areaId = 'city'; }
        return '你锁好门，走上街去。';
      }

      default: {
        // 移动类行为直接走 executeEntityAction（需要操作世界地图）
        const moveActions = ['enter_building', 'leave_building', 'shelter'];
        if (moveActions.includes(actionId)) {
          return this.executeEntityAction(playerId, actionId, params, vital, wallet, pos);
        }
        
        // 1. 先尝试涌现规则
        const targetId = params?.targetId ? Number(params.targetId) : 0;
        if (targetId && this.em.isAlive(targetId)) {
          const ctx = this.buildInteractionContext(playerId, targetId);
          const feedback = executeEmergentAction(actionId, ctx);
          if (feedback) {
            this.applyActionFeedback(playerId, targetId, feedback);
            return feedback.message;
          }
        }

        // 2. 再尝试旧的行为系统
        return this.executeEntityAction(playerId, actionId, params, vital, wallet, pos);
      }
    }
  }

  /** 将涌现规则的反馈应用到世界状态 */
  private applyActionFeedback(playerId: number, targetId: number, feedback: any): void {
    const playerVital = this.em.getComponent(playerId, 'Vital');
    const playerWallet = this.em.getComponent(playerId, 'Wallet');
    const playerInventory = this.em.getComponent(playerId, 'Inventory');

    // 玩家状态变更
    if (feedback.moodChange && playerVital) {
      playerVital.mood = Math.max(0, Math.min(100, playerVital.mood + feedback.moodChange));
    }
    if (feedback.healthChange && playerVital) {
      playerVital.health = Math.max(0, Math.min(100, playerVital.health + feedback.healthChange));
    }
    if (feedback.fatigueChange && playerVital) {
      playerVital.fatigue = Math.max(0, Math.min(100, playerVital.fatigue + feedback.fatigueChange));
    }
    if (feedback.copperChange && playerWallet) {
      playerWallet.copper = Math.max(0, playerWallet.copper + feedback.copperChange);
    }
    if (feedback.itemsGained && playerInventory) {
      playerInventory.items.push(...feedback.itemsGained);
    }
    if (feedback.itemsLost && playerInventory) {
      for (const lost of feedback.itemsLost) {
        const idx = playerInventory.items.findIndex((i: any) => i.itemType === lost.itemType);
        if (idx !== -1) {
          playerInventory.items[idx].amount -= lost.amount;
          if (playerInventory.items[idx].amount <= 0) {
            playerInventory.items.splice(idx, 1);
          }
        }
      }
    }

    // NPC 好感度变更
    if (feedback.impressionChange && targetId) {
      const targetMemory = this.em.getComponent(targetId, 'Memory');
      if (targetMemory) {
        targetMemory.impressions[String(playerId)] = (targetMemory.impressions[String(playerId)] || 0) + feedback.impressionChange;
      }
    }

    // 记录事件
    this.logEvent('player', '交互', (feedback.message || '').substring(0, 50));
  }

  /** 执行基于实体的交互行动 — 涌现式丰富反馈 */
  private executeEntityAction(playerId: number, actionId: string, params: any, vital: VitalComponent | undefined, wallet: WalletComponent | undefined, pos: PositionComponent | undefined): string {
    const targetId = params?.targetId ? Number(params.targetId) : 0;
    if (!targetId || !this.em.isAlive(targetId)) {
      return `执行了 ${actionId}`;
    }

    const targetType = this.em.getType(targetId);
    const targetIdentity = this.em.getComponent(targetId, 'Identity');
    const targetName = targetIdentity?.name || this.getTypeDisplayName(targetId, targetType);
    const personality = targetIdentity?.personality || [];

    // 获取 NPC 状态信息用于生成情境化反馈
    const targetVital = this.em.getComponent(targetId, 'Vital');
    const targetMood = targetVital?.mood ?? 50;
    const targetHunger = targetVital?.hunger ?? 50;
    const isSad = targetMood < 30;
    const isHungry = targetHunger < 30;
    const isTired = (targetVital?.fatigue ?? 50) < 30;

    // 天气和时间
    const weather = this.weather.weather;
    const shichen = this.time.shichenName;
    const season = this.time.season;

    // 性格特征辅助函数
    const isBrave = personality.includes('勇敢');
    const isTimid = personality.includes('胆小');
    const isShrewd = personality.includes('精明');
    const isKind = personality.includes('善良');
    const isCunning = personality.includes('狡猾');

    // 好感度
    const targetMemory = this.em.getComponent(targetId, 'Memory');
    const impression = targetMemory?.impressions?.[playerId] ?? 0;

    switch (actionId) {

      // ════════════════════════════════════════════
      // NPC 交互 — 情境化反馈
      // ════════════════════════════════════════════

      case 'talk_to': {
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 3;
        }
        this.logEvent('player', '社交', `你和${targetName}攀谈了几句`);

        // 根据 NPC 状态生成对话
        if (isHungry) {
          const hungerTalks = [
            `${targetName}搓着肚子苦笑道："别提了，今天连早饭都没吃上。你闻到那边飘来的饭香没有？馋得我直咽口水。"`,
            `${targetName}有气无力地看了你一眼："话说一半肚子就叫了……你身上带吃的了吗？"他尴尬地笑了笑。`,
            `${targetName}叹了口气："今年收成不好，家里断粮两天了。也不知道官府什么时候开仓放粮。"`,
          ];
          return hungerTalks[Math.floor(Math.random() * hungerTalks.length)];
        }
        if (isSad) {
          if (isTimid) {
            return `${targetName}低着头，眼眶有些红，声音细小："没什么……就是最近不太顺心。"她擦了擦眼角，勉强挤出一丝笑容。`;
          }
          if (isBrave) {
            return `${targetName}攥紧了拳头，咬牙道："别问了。总之，有些人做的那些事，我看不惯。"他深吸一口气，"算了，不说了。"`;
          }
          return `${targetName}长叹一声，望着远方出神。良久才说："人生在世，总有不如意的时候。"`;
        }
        if (isTired) {
          const tiredTalks = [
            `${targetName}打了个哈欠，揉了揉眼睛："抱歉，昨晚没睡好。你有什么事快说吧，我还得回去歇着。"`,
            `${targetName}勉强提起精神："嗯？你说什么？"他晃了晃脑袋，"啊，走神了。最近太忙了，脑子都不好使了。"`,
          ];
          return tiredTalks[Math.floor(Math.random() * tiredTalks.length)];
        }

        // 根据天气/时间
        if (weather === '暴雨') {
          return `${targetName}搓着手说：'这天冷得邪乎，码头今天没船来，货都压着呢。'他看了看天色，又补了句：'我劝你也早点回家。'`;
        }
        if (shichen === '寅' || shichen === '丑' || shichen === '子') {
          return `${targetName}惊讶地看着你："这么晚还在外面？最近夜里不太平，你可小心些。"`;
        }

        // 普通对话
        const talks = [
          `${targetName}点了点头："嗯，今天天气不错。有什么事？"`,
          `${targetName}热情地招呼道："哟，是你啊！最近怎么样？"`,
          `${targetName}想了想："听说东市来了个新的杂耍班子，要不要去看看？"`,
          `${targetName}压低声音："你知道码头上那批货吗？来路不太正，不过价钱倒是便宜。"`,
          `${targetName}聊起了最近的趣事：'前天隔壁王家的鸡跑到县衙去了，把县令老爷吓得够呛。'说完自己也忍不住笑了。`,
          `${targetName}正色道：'最近城里多了不少外乡人，鱼龙混杂的，你出门在外多留个心眼。'`,
        ];
        return talks[Math.floor(Math.random() * talks.length)];
      }

      case 'ask_rumor': {
        const events = targetMemory?.recentEvents || [];
        if (events.length === 0) {
          return `${targetName}摇了摇头："最近倒是没什么特别的事，太平日子。"`;
        }
        if (vital) vital.mood = Math.min(100, vital.mood + 5);
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 2;
        }
        const event = events[Math.floor(Math.random() * events.length)];
        this.logEvent('player', '社交', `你向${targetName}打听了消息`);

        const rumorPrefixes = [
          `${targetName}左右看了看，压低声音说：`,
          `${targetName}凑近了些："我可只跟你说……`,
          `${targetName}清了清嗓子："这个嘛……`,
        ];
        const prefix = rumorPrefixes[Math.floor(Math.random() * rumorPrefixes.length)];
        return `${prefix}"${event.content}"`;
      }

      case 'trade_buy': {
        const cost = 10 + Math.floor(Math.random() * 30);
        if (!wallet || wallet.copper < cost) {
          if (isShrewd) {
            return `${targetName}精明地打量了你一眼："这点钱？怕是连看都看不了什么。回去攒够了再来吧。"`;
          }
          return `${targetName}面露为难之色："这……铜板不太够啊。要不你先回去凑凑？"`;
        }
        wallet.copper -= cost;
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) {
          const itemTypes = ['food', 'cloth', 'herbs', 'material'];
          const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          inventory.items.push({ itemType, amount: 1 });
        }
        this.logEvent('player', '交易', `你从${targetName}处花了${cost}文购买了商品`);

        if (isShrewd) {
          return `你跟${targetName}讨价还价了半天，最终花了${cost}文成交。${targetName}笑着说："成交！你眼光不错，这可是好东西。"`;
        }
        if (isKind) {
          return `${targetName}实诚地说："${cost}文，不赚你钱。下次有什么需要尽管来。"他把东西递给你，又多塞了点小玩意："这个送你了。"`;
        }
        return `你和${targetName}一番交涉，花${cost}文买了一些东西。${targetName}点了点头："慢走，下次再来。"`;
      }

      case 'trade_sell': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (!inventory || inventory.items.length === 0) return '你翻遍背包，什么都没有。';
        const item = inventory.items.pop();
        const sellPrice = 5 + Math.floor(Math.random() * 15);
        if (wallet) wallet.copper += sellPrice;
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 2;
        }
        this.logEvent('player', '交易', `你向${targetName}出售了${item?.itemType || '物品'}，获得${sellPrice}文`);

        if (isShrewd) {
          return `${targetName}翻来覆去看了半天："品相一般，${sellPrice}文，不能再多了。"你虽然觉得价钱低了些，但也只好接受。`;
        }
        return `${targetName}接过你递来的${item?.itemType || '物品'}，看了看说："还行，给你${sellPrice}文。"你把东西交了出去。`;
      }

      case 'share_food': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (!inventory) return '你身上没有食物。';
        const foodIdx = inventory.items.findIndex(i => i.itemType === 'food');
        if (foodIdx < 0) return '你翻遍背包，没找到食物。';
        inventory.items.splice(foodIdx, 1);
        if (targetVital) targetVital.hunger = Math.min(100, targetVital.hunger + 30);
        if (targetVital) targetVital.mood = Math.min(100, targetVital.mood + 15);
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 20;
        }
        this.logEvent('player', '赠礼', `你请${targetName}吃了一顿饭`);

        if (targetHunger < 20) {
          return `你把食物递给${targetName}，他愣了一下，眼眶微微泛红。"你……你是个好人。"他小声说着，大口吃了起来，像是饿了很久。吃完后他郑重地对你抱拳："这份恩情，我记下了。"`;
        }
        if (isKind) {
          return `${targetName}感激地接过食物："谢谢你！这太及时了。"她温和地笑了笑，"改天一定请你吃饭。"`;
        }
        return `你把食物递给${targetName}，他有些意外，但很快接了过去："哦？谢了。"大口吃起来，边吃边点头，"味道不错。"`;
      }

      case 'help_request': {
        if (!targetVital) return '你想要帮忙，但不知道对方需要什么。';
        if (targetVital.health < 30) {
          // 需要药物
          const inventory = this.em.getComponent(playerId, 'Inventory');
          const herbIdx = inventory?.items.findIndex(i => i.itemType === 'herbs' || i.itemType === 'medicine') ?? -1;
          if (herbIdx >= 0 && inventory) {
            inventory.items.splice(herbIdx, 1);
            targetVital.health = Math.min(100, targetVital.health + 25);
            if (targetMemory) {
              targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 25;
            }
            this.logEvent('player', '助人', `你用药帮助了${targetName}`);
            return `你把药材递给${targetName}，他颤抖着接过，眼中满是感激。"这些药……太贵了，你怎么舍得？"他声音哽咽，"等我好了，一定报答你。"`;
          }
          return '你想帮忙，但没有药材。';
        }
        // 饥饿求助
        if (targetVital.hunger < 20) {
          const inventory = this.em.getComponent(playerId, 'Inventory');
          const foodIdx = inventory?.items.findIndex(i => i.itemType === 'food') ?? -1;
          if (foodIdx >= 0 && inventory) {
            inventory.items.splice(foodIdx, 1);
            targetVital.hunger = Math.min(100, targetVital.hunger + 25);
            if (targetMemory) {
              targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 25;
            }
            this.logEvent('player', '助人', `你给了${targetName}食物`);
            return `${targetName}虚弱地看着你，你赶紧把食物递过去。他狼吞虎咽地吃着，吃完后长舒一口气："谢谢你……我已经两天没吃东西了。"`;
          }
          return '你想帮忙，但没有食物可以给他。';
        }
        return `${targetName}看起来还好，暂时不需要帮助。`;
      }

      case 'steal': {
        const targetWallet = this.em.getComponent(targetId, 'Wallet');
        const targetCopper = targetWallet?.copper ?? 0;
        if (targetCopper <= 0) return `${targetName}看起来也没什么钱。`;

        // 成功率：基础50%，周围人少+20%，NPC胆小+10%，NPC精明-15%
        let successRate = 0.5;
        const nearby = this.worldMap.getEntitiesInGrid(pos?.gridId || '');
        if (nearby.length < 3) successRate += 0.2;
        if (isTimid) successRate += 0.1;
        if (isShrewd) successRate -= 0.15;
        if (isBrave) successRate -= 0.1;
        const success = Math.random() < successRate;

        if (success) {
          const amount = Math.min(targetCopper, 5 + Math.floor(Math.random() * 20));
          if (targetWallet) targetWallet.copper -= amount;
          if (wallet) wallet.copper += amount;
          if (targetMemory) {
            targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) - 5;
          }
          this.logEvent('player', '偷窃', `你从${targetName}那里偷了${amount}文`);
          return `你趁${targetName}不注意，手指灵巧地探入钱袋，摸走了${amount}文铜钱。心跳加速，手心微微出汗。赶紧收好，装作若无其事的样子走开。`;
        }

        // 失败
        if (vital) { vital.mood = Math.max(0, vital.mood - 15); vital.health = Math.max(0, vital.health - 8); }
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) - 30;
        }
        this.logEvent('player', '偷窃', `你偷窃${targetName}被发现了`);

        if (isBrave) {
          return `你的手刚伸出去，就被${targetName}一把抓住了！"小贼！"他大喝一声，一把将你推倒在地。你摔了个趔趄，铜钱没偷到，还被结结实实地骂了一顿。周围的人纷纷投来鄙夷的目光。`;
        }
        if (isCunning) {
          return `你的手刚伸出去，${targetName}冷笑一声："早就盯着你了。"他不仅抓住了你的手，还大声喊人来。你挣脱不开，被他扭送到了街坊面前示众。`;
        }
        return `你的手刚伸出去就被${targetName}发现了！${targetName}怒目而视："你干什么！"周围的人都看过来了。你只好讪讪地退开，脸上火辣辣的。`;
      }

      case 'learn_skill': {
        if (vital) vital.mood = Math.min(100, vital.mood + 10);
        const profession = targetIdentity?.profession || '';
        const skillMap: Record<string, { skill: string; desc: string }> = {
          '大夫': { skill: '辨认草药', desc: `${targetName}从药箱中取出一把草药，教你辨认："这种叶子锯齿状的叫活血草，旁边光滑的叫止血蒿，别搞混了。一个救人，一个要命。"` },
          '猎户': { skill: '追踪术', desc: `${targetName}蹲下身，指着地上的痕迹："看这个蹄印，是两小时前留下的，方向朝东。右前蹄深一些，说明是受惊在跑。"` },
          '铁匠': { skill: '锻打技巧', desc: `${targetName}挥了挥锤子："打铁关键在火候和力道。你看这一锤——"铛的一声，火星四溅，"重了就裂，轻了不透。"` },
          '农夫': { skill: '种植知识', desc: `${targetName}弯腰抓起一把土搓了搓："土质松软，湿度正好。种豆子得深耕，种稻子要浅水，这些都是老祖宗传下来的经验。"` },
          '渔夫': { skill: '捕鱼技法', desc: `${targetName}比划着说："鱼最喜欢在回水湾待着。水面有泡泡冒上来的地方，底下肯定有鱼。甩竿的时候要轻，别惊着它们。"` },
          '木匠': { skill: '木工手艺', desc: `${targetName}拿起一块木板："看这纹理，顺着纹路刨才光滑。榫卯讲究的是严丝合缝，差一分都不行。"` },
        };
        const skillInfo = skillMap[profession];
        if (skillInfo) {
          this.logEvent('player', '学习', `你向${targetName}学习了${skillInfo.skill}`);
          return skillInfo.desc;
        }
        return `${targetName}教了你一些实用的技巧。你觉得受益匪浅。`;
      }

      case 'invite_travel': {
        if (isTimid) {
          return `${targetName}犹豫了一下："这……会不会不太安全？"她想了想，又说："不过有你陪着应该没事。好吧，我跟你走。"`;
        }
        if (isBrave) {
          return `${targetName}爽快地拍了拍你的肩膀："好啊！一个人走路也闷得慌，正好做个伴。走，前面带路！"`;
        }
        return `${targetName}点了点头："行，正好我也想出去走走。不过说好了，路上你请客吃饭。"说完嘿嘿一笑。`;
      }

      case 'heal': {
        if (!wallet || wallet.copper < 20) return '诊金不够。';
        wallet.copper -= 20;
        if (vital) vital.health = Math.min(100, vital.health + 20);
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 5;
        }
        this.logEvent('player', '治疗', `你请${targetName}为你诊治`);

        const healthLevel = vital ? vital.health : 50;
        if (healthLevel < 30) {
          return `${targetName}给你把了脉，眉头紧锁："你这是积劳成疾，得好好调养。"他开了副药方，又叮嘱道："这三副药按时吃，忌生冷辛辣。年轻人，别不把身体当回事。"你服下药后，感觉好了一些。`;
        }
        return `${targetName}给你把了脉，松了口气："没什么大碍，调养调养就好。"他开了副药，叮嘱几句注意事项。你服下药后，身体舒服了不少。`;
      }

      case 'provoke': {
        if (vital) { vital.mood = Math.max(0, vital.mood - 8); vital.health = Math.max(0, vital.health - 12); }
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) - 20;
        }
        this.logEvent('player', '冲突', `你挑衅了${targetName}`);

        if (isBrave) {
          return `你故意挑衅${targetName}，他二话不说，一把揪住你的衣领！"你找打？！"他一拳砸在你胸口。旁边的人赶紧拉开你们。你揉着胸口，暗暗叫苦。`;
        }
        if (isTimid) {
          return `你故意找茬，${targetName}吓得往后退了两步。"你……你想干什么？"她声音发颤。旁边的人看不下去了，把你推开："欺负老实人算什么本事？"你讪讪地退开。`;
        }
        if (isCunning) {
          return `你挑衅了${targetName}，但他只是冷冷地看了你一眼："激将法对我没用。"说完转身就走。你反而觉得自己像个傻子。`;
        }
        return `你故意挑衅${targetName}。对方脸色一沉，推了你一把："有病吧？"旁边的人赶紧把你们拉开。你感觉身上被推的地方隐隐作痛。`;
      }

      case 'sworn_brothers': {
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 30;
        }
        if (vital) vital.mood = Math.min(100, vital.mood + 20);
        this.logEvent('player', '结义', `你与${targetName}义结金兰`);

        return `你与${targetName}对视一眼，心中默契已生。你们找来三牲香烛，对天盟誓："皇天在上，厚土在下，今日我与${targetName}义结金兰，此后同甘共苦，不离不弃！"${targetName}红了眼眶，紧紧握住你的手："兄弟，从今往后，你就是我亲人。"`;
      }

      case 'gift': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (!inventory || inventory.items.length === 0) return '你翻遍背包，没找到什么可以送的。';
        const item = inventory.items.pop();
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 15;
        }
        this.logEvent('player', '赠礼', `你送给${targetName}一件${item?.itemType || '物品'}`);

        if (impression >= 50) {
          return `你把${item?.itemType || '物品'}递给${targetName}，他眼睛一亮："哎呀，你怎么知道我正需要这个？"他高兴地收下了，"你真是太了解我了，谢谢你！"`;
        }
        if (isKind) {
          return `${targetName}接过你的礼物，露出温暖的笑容："你太客气了。"她轻轻抚摸着那件${item?.itemType || '物品'}，"谢谢你的心意，我会好好珍惜的。"`;
        }
        if (isShrewd) {
          return `${targetName}接过东西，掂量了一下："嗯，值几个钱。"他嘴角微微上扬，"行，我收下了。你小子还算懂事。"`;
        }
        return `你把${item?.itemType || '物品'}送给了${targetName}。他有些意外，但还是收下了："嗯……谢了。"`;
      }

      // ════════════════════════════════════════════
      // 环境交互
      // ════════════════════════════════════════════

      case 'shelter': {
        // 找到附近的建筑实体
        const nearbyBuildings = this.worldMap.getEntitiesInGrid(pos?.gridId || '')
          .map(id => ({ id, type: this.em.getType(id) }))
          .filter(e => e.type === 'building');
        if (nearbyBuildings.length > 0) {
          const buildingId = nearbyBuildings[0].id;
          const buildingPos = this.em.getComponent(buildingId, 'Position');
          if (pos && buildingPos) {
            this.worldMap.moveEntity(playerId, buildingPos.gridId);
            pos.gridId = buildingPos.gridId;
            pos.areaId = buildingPos.areaId;
          }
        }
        if (vital) vital.mood = Math.max(0, vital.mood - 2);
        this.logEvent('player', '避雨', '你找了个地方避雨');
        return `暴雨如注，你赶紧跑进最近的建筑里。雨水顺着屋檐哗哗流下，你在门口抖了抖身上的水珠。"好大的雨……"你看着外面的雨幕，庆幸自己跑得快。`;
      }

      case 'gather_fruit': {
        const growth = this.em.getComponent(targetId, 'Growth');
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 5);
        const inventory = this.em.getComponent(playerId, 'Inventory');

        const gatherDescs = [
          `你拨开枝叶，挑了几颗饱满的果实摘下。擦了擦，咬了一口——甘甜多汁，味道不错。你把剩下的放进背包。`,
          `你伸手去够最高处的那颗果实，踮着脚终于摘到了。放在手心看了看，颜色鲜亮，看来是熟透了。`,
          `你蹲在地上捡了几个掉落的果实，又从低处的枝桠上摘了些。凑了满满一捧，够吃一阵了。`,
        ];
        if (inventory) {
          const itemTypes = ['food', 'herbs'];
          const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          inventory.items.push({ itemType, amount: 1 });
        }
        // 植物被采摘后降级
        if (growth) {
          growth.growProgress = Math.max(0, growth.growProgress - 30);
        }
        return gatherDescs[Math.floor(Math.random() * gatherDescs.length)];
      }

      case 'fish': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 15);
        const success = Math.random() > 0.45;
        // 季节和时间影响
        const isMorning = '寅卯辰'.includes(shichen);
        const isWinter = season === 'winter';

        if (success) {
          if (vital) vital.hunger = Math.min(100, vital.hunger + 15);
          if (vital) vital.mood = Math.min(100, vital.mood + 8);
          const inventory = this.em.getComponent(playerId, 'Inventory');
          if (inventory) inventory.items.push({ itemType: 'food', amount: 1 });
          this.logEvent('player', '捕鱼', '你成功捕到了鱼');

          if (isWinter) {
            return `你凿开冰面，在刺骨的寒水中耐心等待。终于，鱼线猛地一沉！你用力一拉——一条肥硕的鲤鱼在冰面上翻跳着。"好运气！"你冻得直哆嗦，但心里暖洋洋的。`;
          }
          if (isMorning) {
            return `清晨的河面雾气缭绕，你选了个回水湾撒下网。没过多久就感觉到有鱼入网了。收网一看——三条活蹦乱跳的鲫鱼！晨钓果然是最佳时机。`;
          }
          return `你在河边找了个合适的位置，耐心等待。浮漂动了动，你屏住呼吸……猛地一提竿！一条银白色的鱼在空中划出一道弧线。今晚有鱼吃了！`;
        }

        if (isWinter) {
          return `你蹲在冰窟窿旁边等了很久，手指冻得通红，但鱼就是不咬钩。你叹了口气："天太冷了，鱼都不活动。"只好收拾东西回去。`;
        }
        return `你等了半天，浮漂纹丝不动。正要走的时候，浮漂突然动了一下——可惜你反应慢了半拍，鱼跑了。"下次一定……"你自言自语道。`;
      }

      case 'scavenge': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 5);
        const found = Math.random() > 0.6;
        if (found) {
          const inventory = this.em.getComponent(playerId, 'Inventory');
          if (inventory) {
            const items = ['material', 'herbs', 'misc'];
            const item = items[Math.floor(Math.random() * items.length)];
            inventory.items.push({ itemType: item, amount: 1 });
          }
          const findDescs = [
            `你翻遍了角落里的旧箱子，在底层摸到了一样东西——看起来还有些用处。你把它收进了背包。`,
            `你在废墟中仔细搜寻，在倒塌的柜子下面发现了一些可以用的材料。"没白来。"你心想。`,
            `你掀开一块破布，下面居然藏着一个小包裹。打开一看，有些有用的东西。`,
          ];
          return findDescs[Math.floor(Math.random() * findDescs.length)];
        }
        return `你翻找了半天，除了灰尘和蛛网什么也没找到。这地方大概早就被翻干净了。`;
      }

      // ════════════════════════════════════════════
      // 建筑交互
      // ════════════════════════════════════════════

      case 'enter_building': {
        // 创建建筑内部 grid：interior_{buildingId}
        const interiorGrid = `interior_${targetId}`;
        // 记住建筑的原始 grid（用于 nearby 查询和离开时返回）
        const buildingOrigGrid = this.em.getComponent(targetId, 'Position')?.gridId || 'center_street';
        if (pos) {
          this.worldMap.moveEntity(playerId, interiorGrid);
          pos.gridId = interiorGrid;
          // areaId 保持不变
        }
        // 不移动 NPC —— simulateTurn 会把它们移回去
        // getNearbyEntities 会自动查询父 grid 的实体

        const building = this.em.getComponent(targetId, 'Building');
        const bType = building?.type || 'house';

        const enterDescs: Record<string, string[]> = {
          'shop': [
            `你推开${targetName}的门，一股陈旧木料的气味扑面而来。店内有几个人在挑东西，掌柜的正在招呼客人。`,
            `你走进${targetName}，门口的风铃叮当作响。货架上的商品琳琅满目。`,
          ],
          'teahouse': [
            `你掀开帘子走进${targetName}，茶香扑鼻。说书先生正讲到精彩处，满堂茶客屏息静听。`,
          ],
          'house': [
            `你走进${targetName}，屋内安静整洁。阳光从窗户洒进来，尘埃在光柱中缓缓飘浮。`,
          ],
        };
        const descs = enterDescs[bType] || [`你走进了${targetName}。`];
        return descs[Math.floor(Math.random() * descs.length)];
      }

      case 'ask_around': {
        if (vital) vital.mood = Math.min(100, vital.mood + 2);
        return pickChatter();
      }

      case 'buy_from_shop': {
        const cost = 8 + Math.floor(Math.random() * 15);
        if (!wallet || wallet.copper < cost) return '铜钱不够。';
        wallet.copper -= cost;
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'misc', amount: 1 });
        return `你花了${cost}文买了些东西。掌柜的包好递给你："慢走啊，下次再来。"`;
      }

      // ════════════════════════════════════════════
      // 动物交互
      // ════════════════════════════════════════════

      case 'observe': {
        const animalNames: Record<string, string> = {
          '野鹿': '它正在低头吃草，耳朵不时转动，警惕地听着四周的动静。',
          '灰兔': '它蹲在灌木丛旁，鼻子不停翕动，似乎嗅到了什么。',
          '赤狐': '它站在岩石上，毛茸茸的尾巴在身后轻轻摆动，眼神锐利。',
          '母鸡': '它在地上刨食，不时发出咯咯的叫声。',
          '老牛': '它慢悠悠地咀嚼着，不时抬头看看远方，一副与世无争的样子。',
        };
        const desc = animalNames[targetName];
        if (desc) return `你仔细观察了一下${targetName}。${desc}`;
        return `你仔细观察了一下${targetName}。它似乎没有注意到你，自顾自地活动着。`;
      }

      case 'feed_animal': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (!inventory) return '你没有食物。';
        const foodIdx = inventory.items.findIndex(i => i.itemType === 'food');
        if (foodIdx < 0) return '你没有食物可以喂。';
        inventory.items.splice(foodIdx, 1);
        if (targetMemory) {
          targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 10;
        }
        return `你拿出一块食物，蹲下身子慢慢递过去。${targetName}先是警惕地退后几步，又忍不住诱惑凑上前，小心翼翼地叼走了食物。嚼了几口，它看你的眼神似乎温和了些。`;
      }

      case 'chase_away': {
        if (targetVital) targetVital.mood = Math.max(0, targetVital.mood - 10);
        const chaseDescs = [
          `你拍了拍手，大声吆喝了一声。${targetName}被吓得一激灵，撒腿就跑，跑出好远才停下来回头看你。`,
          `你捡起一颗小石子丢过去，${targetName}嗖地窜了出去。但没过一会儿，你又看到它在不远处探头探脑。`,
          `你挥着手赶走了${targetName}。它不情不愿地走了，走之前还回头看了你一眼，似乎在说"小气鬼"。`,
        ];
        return chaseDescs[Math.floor(Math.random() * chaseDescs.length)];
      }

      case 'track_animal': {
        const success = Math.random() > 0.5;
        if (success) {
          if (vital) vital.mood = Math.min(100, vital.mood + 5);
          return `你悄悄跟上${targetName}，保持一定距离。它穿过灌木丛，沿着小路一直走到了河边。你发现了一条之前不知道的近路！这或许以后能派上用场。`;
        }
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 5);
        return `你跟着${targetName}走了几步，它突然回头看你，然后撒腿就跑，一眨眼就消失在灌木丛中。你只好作罢。`;
      }

      case 'hunt': {
        const success = Math.random() > 0.45;
        if (success) {
          if (vital) { vital.hunger = Math.min(100, vital.hunger + 20); vital.fatigue = Math.max(0, vital.fatigue - 15); }
          this.logEvent('player', '捕猎', `你捕获了${targetName}`);
          return `你屏住呼吸，慢慢靠近……猛地出手！${targetName}来不及反应就被你抓住了。费了一番功夫，但你成功了。今晚有肉吃了。`;
        }
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 10);
        return `你追了半天，${targetName}太灵活了。它左拐右拐就甩掉了你，你累得气喘吁吁却两手空空。"下次一定得想个更好的办法。"`;
      }

      case 'tame': {
        const success = Math.random() > 0.7;
        if (success) {
          if (targetMemory) {
            targetMemory.impressions[playerId] = (targetMemory.impressions[playerId] || 0) + 15;
          }
          return `你慢慢伸出手，${targetName}犹豫了一下，最终凑上来蹭了蹭你的手心。它的毛发柔软温暖，看来已经对你有了些信任。驯服取得了进展！`;
        }
        return `${targetName}还是对你有些警惕，你一靠近它就跑开几步，回头用警惕的眼神看着你。你需要更多耐心和食物。`;
      }

      // ════════════════════════════════════════════
      // 植物交互
      // ════════════════════════════════════════════

      case 'chop': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 15);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'material', amount: 1 });
        this.logEvent('player', '采集', `你砍伐了${targetName}`);
        return `你举起斧头，对准${targetName}砍了下去。木屑纷飞，几斧下去，它轰然倒下。你把能用的木材整理好，背了起来。手臂有些酸，但收获不错。`;
      }

      case 'water_plant': {
        const growth = this.em.getComponent(targetId, 'Growth');
        if (growth) {
          growth.growProgress = Math.min(100, growth.growProgress + 15);
        }
        return `你蹲下来，用双手捧起水浇在${targetName}的根部。水珠顺着叶片滑落，它看起来更加精神了。你默默祝愿它能快些长大。`;
      }

      case 'gather': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 5);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'herbs', amount: 1 });
        return `你小心地从${targetName}上采摘了一些东西。叶子在指间断裂，散发出淡淡的清香。你把收获包好，放进背包。`;
      }

      // ════════════════════════════════════════════
      // 矿物交互
      // ════════════════════════════════════════════

      case 'collect': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 10);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'material', amount: 1 });
        return `你蹲下来，在${targetName}周围仔细寻找。捡了几块品质不错的矿石碎片，掂了掂分量——还行，能换几个钱。`;
      }

      case 'mine': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 20);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'material', amount: 2 });
        return `你用尽全力敲打${targetName}，火星四溅。汗水和灰尘混在一起，但你咬着牙不停手。终于，几块矿石被你敲了下来。虽然累得够呛，但收获不少。`;
      }

      // ════════════════════════════════════════════
      // 物品交互
      // ════════════════════════════════════════════

      case 'pickup': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) {
          inventory.items.push({ itemType: 'misc', amount: 1 });
          this.worldMap.removeEntity(targetId);
          this.em.destroy(targetId);
        }
        return `你弯腰捡起了${targetName}，仔细看了看，虽然不知道有什么用，但先收着总没错。你把它塞进背包。`;
      }

      case 'inspect': {
        const inspectDescs = [
          `你仔细检查了一下${targetName}。虽然蒙了些灰尘，但保存得还算完好。也许能派上用场。`,
          `你翻来覆去地看${targetName}。做工不算精细，但材料不错。如果找个懂行的人看看，或许能知道它的价值。`,
          `你端详了${targetName}一会儿。看起来是被人遗落的，不知道在这里待了多久。`,
        ];
        return inspectDescs[Math.floor(Math.random() * inspectDescs.length)];
      }

      case 'use_item': {
        if (vital) {
          vital.mood = Math.min(100, vital.mood + 5);
          vital.health = Math.min(100, vital.health + 8);
        }
        return `你使用了${targetName}。一股暖意涌遍全身，感觉精神好了些。"还有点用处。"你心想。`;
      }

      // 兼容旧 action ID
      case 'trade': return this.executeEntityAction(playerId, 'trade_buy', params, vital, wallet, pos);
      case 'feed': return this.executeEntityAction(playerId, 'feed_animal', params, vital, wallet, pos);
      case 'water': return this.executeEntityAction(playerId, 'water_plant', params, vital, wallet, pos);

      default:
        return `你尝试做了些什么，但似乎没有效果。`;
    }
  }

  /** L0 GOAP 更新 */
  private updateL0(): void {
    for (const entityId of this.l0Entities) {
      if (!this.em.isAlive(entityId)) continue;
      const ai = this.em.getComponent(entityId, 'AI');
      if (!ai || ai.aiLevel !== 0) continue;
      if (ai.planCooldown > 0) { ai.planCooldown--; continue; }

      const state = this.buildGOAPState(entityId);
      const goal: WorldState = { hunger: 70 };

      const result = plan(state, goal, GOAP_ACTIONS);
      if (result.success) {
        ai.currentPlan = result.plan;
        ai.planCooldown = 3;
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

    state.near_people = true;
    state.has_friend = true;
    return state;
  }

  /** 应用 GOAP 行动效果 */
  private applyGOAPAction(entityId: number, actionId: string): void {
    const vital = this.em.getComponent(entityId, 'Vital');
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const action = GOAP_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

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

      // 有需求组件 → 用简化决策引擎（需求衰减由 simulateL1Batch 处理）
      const needs = this.em.getComponent(entityId, 'Needs') as NeedsComponent | undefined;
      const vital = this.em.getComponent(entityId, 'Vital');
      if (needs && vital) {
        this.simulateL1Decision(entityId, needs, vital);
        continue;
      }

      // fallback: 行为树
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

  // === 上帝模式 — 世界操控方法 ===

  /** 强制天气变更 */
  forceWeather(weather: string): void {
    this.weather.forceWeather(weather as any);
    this.logEvent('weather', '天气', `天降异象，天气突变为：${weather}！`);
  }

  /** 杀死NPC并触发级联事件 */
  killNpc(npcId: number): { success: boolean, message: string, events: string[] } {
    const events: string[] = [];

    if (!this.em.isAlive(npcId) || this.em.getType(npcId) !== 'npc') {
      return { success: false, message: 'NPC不存在或已死亡', events: [] };
    }

    const identity = this.em.getComponent(npcId, 'Identity');
    const name = identity?.name || `NPC#${npcId}`;
    const factionInfo = this.getNpcFaction(npcId);

    // 如果是组织首领，触发继任危机
    if (factionInfo && factionInfo.role === 'leader') {
      const faction = this.factions.get(factionInfo.id);
      if (faction) {
        events.push(`${faction.name}首领${name}(${identity?.profession})遇害！组织陷入混乱！`);
        faction.mood = Math.max(0, faction.mood - 30);

        // 组织成员反应
        for (const mid of faction.members) {
          if (!this.em.isAlive(mid)) continue;
          const mVital = this.em.getComponent(mid, 'Vital');
          if (mVital) mVital.mood = Math.max(0, mVital.mood - 15);
        }

        // 继任：选择与已故首领印象分最高的成员
        let bestSuccessor = -1;
        let bestScore = -Infinity;
        for (const mid of faction.members) {
          if (!this.em.isAlive(mid) || mid === npcId) continue;
          const rel = this.em.getComponent(mid, 'Relations');
          const score = rel?.relations?.[npcId] || 0;
          if (score > bestScore) { bestScore = score; bestSuccessor = mid; }
        }

        if (bestSuccessor > 0) {
          faction.leaderId = bestSuccessor;
          const successorName = this.em.getComponent(bestSuccessor, 'Identity')?.name || '某人';
          events.push(`${successorName}接任${faction.name}首领！`);
          faction.mood = Math.min(100, faction.mood + 10);
        } else {
          faction.leaderId = 0;
          events.push(`${faction.name}群龙无首！`);
        }

        // 从成员列表移除
        faction.members = faction.members.filter(m => m !== npcId);
      }
    } else if (factionInfo) {
      // 普通成员被杀
      const faction = this.factions.get(factionInfo.id);
      if (faction) {
        faction.members = faction.members.filter(m => m !== npcId);
        events.push(`${faction.name}成员${name}遇害。同袍们悲愤不已。`);
        faction.mood = Math.max(0, faction.mood - 10);
      }
    }

    // 家庭成员反应
    if (identity) {
      const spouseId = identity.spouseId;
      if (spouseId && this.em.isAlive(spouseId)) {
        const spouseVital = this.em.getComponent(spouseId, 'Vital');
        if (spouseVital) { spouseVital.mood = Math.max(0, spouseVital.mood - 30); }
        const spouseName = this.em.getComponent(spouseId, 'Identity')?.name || '配偶';
        events.push(`${spouseName}得知${name}的死讯，悲痛欲绝。`);
      }
      for (const cid of (identity.childIds || [])) {
        if (this.em.isAlive(cid)) {
          const cVital = this.em.getComponent(cid, 'Vital');
          if (cVital) { cVital.mood = Math.max(0, cVital.mood - 20); }
        }
      }
    }

    this.em.destroy(npcId);
    this.worldMap.removeEntity(npcId);
    events.push(`${name}被杀死了。`);

    for (const evt of events) {
      this.logEvent('state', '干预', evt);
    }
    return { success: true, message: events.join('\n'), events };
  }

  /** 修改NPC生命属性 */
  setNpcVital(npcId: number, field: string, value: number): boolean {
    if (!this.em.isAlive(npcId)) return false;
    const vital = this.em.getComponent(npcId, 'Vital');
    if (!vital || !(field in vital)) return false;
    (vital as any)[field] = value;
    this.logEvent('state', '干预', `NPC#${npcId}属性${field}被设为${value}`);
    return true;
  }

  /** 增减NPC铜钱 */
  addNpcCopper(npcId: number, amount: number): boolean {
    if (!this.em.isAlive(npcId)) return false;
    const wallet = this.em.getComponent(npcId, 'Wallet');
    if (!wallet) return false;
    wallet.copper = Math.max(0, wallet.copper + amount);
    const name = this.em.getComponent(npcId, 'Identity')?.name || `NPC#${npcId}`;
    this.logEvent('state', '干预', `${name}铜钱${amount >= 0 ? '增加' : '减少'}${Math.abs(amount)}`);
    return true;
  }

  /** 传送NPC */
  teleportNpc(npcId: number, gridId: string): boolean {
    if (!this.em.isAlive(npcId)) return false;
    const pos = this.em.getComponent(npcId, 'Position');
    if (!pos) return false;
    this.worldMap.removeEntity(npcId);
    pos.gridId = gridId;
    this.worldMap.addEntity(npcId, gridId);
    const name = this.em.getComponent(npcId, 'Identity')?.name || `NPC#${npcId}`;
    this.logEvent('move', '干预', `${name}被传送至${gridId}`);
    return true;
  }

  /** 设置组织间关系 */
  setFactionRelation(factionId1: number, factionId2: number, score: number): boolean {
    const f1 = this.factions.get(factionId1);
    const f2 = this.factions.get(factionId2);
    if (!f1 || !f2) return false;
    f1.relations[factionId2] = score;
    f2.relations[factionId1] = score;
    this.logEvent('state', '外交', `${f1.name}与${f2.name}关系变为${score}`);
    return true;
  }

  /** 添加自定义事件 */
  addCustomEvent(message: string, type: string): void {
    this.logEvent('state', type, message);
  }
}
