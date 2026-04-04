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
import { VitalComponent, WalletComponent, PositionComponent } from '../ecs/types';

// === 世界事件日志（含因果链） ===
export interface WorldEvent {
  tick: number;
  time: string;       // ISO timestamp
  type: 'npc' | 'player' | 'economy' | 'state' | 'move' | 'weather' | 'ecology';
  category: string;   // 子分类
  message: string;    // 描述
  cause?: string;     // 因果标记（触发原因）
  source?: string;    // 来源分类
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
    events: number;
    npcActions: number;
    priceChanges: Record<string, string>;
    weather: string;
    weatherDesc: string;
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
  private lastTickEvents = 0;
  private previousWeather: string = '晴';

  // 世界事件环形缓冲区
  private eventLog: WorldEvent[] = [];
  private readonly maxEvents = 500;
  readonly startTime: number = Date.now();

  // NPC 行为历史记录（L0 NPC）
  private npcHistory: Map<number, NPCHistoryEntry[]> = new Map();

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

  /** 在 Tick 中生成事件 */
  private generateTickEvents(): void {
    // 随机生成 L0 NPC 行为事件
    for (const entityId of this.l0Entities) {
      if (Math.random() > 0.3) continue;
      const identity = this.em.getComponent(entityId, 'Identity');
      const wallet = this.em.getComponent(entityId, 'Wallet');
      const vital = this.em.getComponent(entityId, 'Vital');
      const pos = this.em.getComponent(entityId, 'Position');
      if (!identity) continue;

      const actions = [
        () => `${identity.name}在${this.gridDisplayName(pos?.gridId)}叫卖${identity.profession === '商贩' ? '货物' : '手艺'}`,
        () => `${identity.name}${vital && vital.hunger < 40 ? '肚子饿了，去买炊饼' : '在忙着手头的活'}`,
        () => `${identity.name}${wallet && wallet.copper > 100 ? '数了数钱袋，满意地点点头' : '翻遍了口袋，叹了口气'}`,
        () => `${identity.name}和路人攀谈了几句`,
        () => `${identity.name}在${this.gridDisplayName(pos?.gridId)}来回踱步`,
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      this.logEvent('npc', identity.profession, action());
    }

    // 随机生成 L1 NPC 行为事件（采样，避免过多日志）
    for (const entityId of this.l1Entities) {
      if (Math.random() > 0.99) continue;
      const identity = this.em.getComponent(entityId, 'Identity');
      const pos = this.em.getComponent(entityId, 'Position');
      if (!identity) continue;

      const templates = [
        `一个${identity.profession}在${this.gridDisplayName(pos?.gridId)}忙碌着`,
        `${identity.name}在街边歇脚`,
        `一个${identity.profession}推着小车叫卖`,
      ];
      this.logEvent('npc', identity.profession, templates[Math.floor(Math.random() * templates.length)]);
    }

    // 经济事件
    if (Math.random() > 0.8) {
      const prices = this.economy.getPrices();
      const goods = Object.keys(prices);
      if (goods.length > 0) {
        const good = goods[Math.floor(Math.random() * goods.length)];
        const price = prices[good];
        const basePrices: Record<string, number> = { food: 10, herbs: 15, cloth: 20, material: 8, cargo: 12 };
        const base = basePrices[good] || 10;
        const change = ((price - base) / base * 100).toFixed(0);
        const dir = price > base ? '涨' : '跌';
        this.logEvent('economy', '物价', `${good}价${dir}了${Math.abs(parseFloat(change))}%，现价${price.toFixed(1)}文`);
      }
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
    const entityIds = this.worldMap.getEntitiesInGrid(gridId);

    const result: any[] = [];
    for (const id of entityIds) {
      if (id === playerId) continue; // 跳过玩家自己
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
      }
      // 建筑特有信息
      else if (type === 'building') {
        entity.buildingType = building?.type || 'house';
        entity.openHours = building?.openHours || '';
      }

      result.push(entity);
    }
    return result;
  }

  /** 根据实体类型和属性动态计算可用行为 */
  calculateEntityActions(playerId: number, targetId: number): { targetId: number; targetName: string; actions: any[] } {
    const targetType = this.em.getType(targetId);
    const targetIdentity = this.em.getComponent(targetId, 'Identity');
    const targetName = targetIdentity?.name || this.getTypeDisplayName(targetId, targetType);

    const playerWallet = this.em.getComponent(playerId, 'Wallet');
    const playerVital = this.em.getComponent(playerId, 'Vital');
    const playerInventory = this.em.getComponent(playerId, 'Inventory');
    const playerAP = this.getPlayerAP(playerId);

    const copper = playerWallet?.copper ?? 0;
    const fatigue = playerVital?.fatigue ?? 100;
    const hasItems = playerInventory && playerInventory.items.length > 0;
    const hasFood = playerInventory && playerInventory.items.some(i => i.itemType === 'food');
    const ap = playerAP.current;

    const targetPos = this.em.getComponent(targetId, 'Position');
    const playerPos = this.em.getComponent(playerId, 'Position');
    const sameGrid = targetPos?.gridId === playerPos?.gridId;

    // 获取目标grid的人数
    const targetGridId = targetPos?.gridId || '';
    const nearbyCount = this.worldMap.getEntitiesInGrid(targetGridId).length;

    const actions: any[] = [];

    switch (targetType) {
      case 'npc': {
        const memory = this.em.getComponent(targetId, 'Memory');
        const impression = memory?.impressions?.[playerId] ?? 0;

        actions.push({
          id: 'talk_to', name: '攀谈', icon: '💬', apCost: 1,
          conditions: { met: ap >= 1, reason: ap < 1 ? '行动点不足' : '' },
          effects: '增加好感度，可能获得信息',
        });
        actions.push({
          id: 'trade', name: '交易', icon: '💰', apCost: 2,
          conditions: { met: ap >= 2 && copper > 0, reason: ap < 2 ? '行动点不足' : copper <= 0 ? '没有铜钱' : '' },
          effects: '买卖物品',
        });
        actions.push({
          id: 'steal', name: '偷窃', icon: '🤏', apCost: 2,
          conditions: { met: ap >= 2 && nearbyCount < 5, reason: ap < 2 ? '行动点不足' : nearbyCount >= 5 ? '周围人太多' : '' },
          effects: '偷取铜钱，失败会被抓',
        });
        actions.push({
          id: 'ask_advice', name: '请教', icon: '📖', apCost: 1,
          conditions: { met: ap >= 1 && impression > 0, reason: ap < 1 ? '行动点不足' : impression <= 0 ? '好感度不够' : '' },
          effects: '学习技能或获取情报',
        });
        actions.push({
          id: 'provoke', name: '挑衅', icon: '👊', apCost: 2,
          conditions: { met: ap >= 2, reason: ap < 2 ? '行动点不足' : '' },
          effects: '引发冲突',
        });
        actions.push({
          id: 'gift', name: '赠礼', icon: '🎁', apCost: 1,
          conditions: { met: ap >= 1 && hasItems, reason: ap < 1 ? '行动点不足' : !hasItems ? '背包没有物品' : '' },
          effects: '增加好感度',
        });
        break;
      }
      case 'building': {
        const building = this.em.getComponent(targetId, 'Building');
        const bType = building?.type || 'house';
        actions.push({
          id: 'enter_building', name: '进入', icon: '🚪', apCost: 0,
          conditions: { met: true, reason: '' },
          effects: '进入建筑内部',
        });
        actions.push({
          id: 'buy_from_shop', name: '购买', icon: '💰', apCost: 1,
          conditions: { met: ap >= 1 && copper > 0, reason: ap < 1 ? '行动点不足' : copper <= 0 ? '没有铜钱' : '' },
          effects: '购买商品',
        });
        actions.push({
          id: 'ask_around', name: '打听', icon: '👂', apCost: 1,
          conditions: { met: ap >= 1, reason: ap < 1 ? '行动点不足' : '' },
          effects: '获取附近消息',
        });
        break;
      }
      case 'animal': {
        actions.push({
          id: 'observe', name: '观察', icon: '👁', apCost: 0,
          conditions: { met: true, reason: '' },
          effects: '观察动物的习性',
        });
        actions.push({
          id: 'hunt', name: '捕猎', icon: '🏹', apCost: 2,
          conditions: { met: ap >= 2, reason: ap < 2 ? '行动点不足' : '' },
          effects: '尝试捕获或猎杀',
        });
        actions.push({
          id: 'feed', name: '喂食', icon: '🌾', apCost: 1,
          conditions: { met: ap >= 1 && hasFood, reason: ap < 1 ? '行动点不足' : !hasFood ? '没有食物' : '' },
          effects: '增加动物好感',
        });
        actions.push({
          id: 'tame', name: '驯服', icon: '🤲', apCost: 3,
          conditions: { met: ap >= 3, reason: ap < 3 ? '行动点不足' : '' },
          effects: '尝试驯化（需多次尝试）',
        });
        break;
      }
      case 'plant': {
        actions.push({
          id: 'gather', name: '采摘', icon: '✋', apCost: 1,
          conditions: { met: ap >= 1, reason: ap < 1 ? '行动点不足' : '' },
          effects: '采摘植物产品',
        });
        actions.push({
          id: 'chop', name: '砍伐', icon: '🪓', apCost: 2,
          conditions: { met: ap >= 2, reason: ap < 2 ? '行动点不足' : '' },
          effects: '获取木材',
        });
        actions.push({
          id: 'water', name: '浇水', icon: '💧', apCost: 1,
          conditions: { met: ap >= 1, reason: ap < 1 ? '行动点不足' : '' },
          effects: '促进植物生长',
        });
        break;
      }
      case 'mineral': {
        actions.push({
          id: 'collect', name: '采集', icon: '⛏', apCost: 2,
          conditions: { met: ap >= 2, reason: ap < 2 ? '行动点不足' : '' },
          effects: '收集矿石碎片',
        });
        actions.push({
          id: 'mine', name: '开采', icon: '🔨', apCost: 3,
          conditions: { met: ap >= 3, reason: ap < 3 ? '行动点不足' : '' },
          effects: '深度开采',
        });
        break;
      }
      case 'item': {
        actions.push({
          id: 'pickup', name: '拾取', icon: '✋', apCost: 1,
          conditions: { met: ap >= 1, reason: ap < 1 ? '行动点不足' : '' },
          effects: '拾起物品放入背包',
        });
        actions.push({
          id: 'inspect', name: '检查', icon: '🔍', apCost: 0,
          conditions: { met: true, reason: '' },
          effects: '仔细查看物品',
        });
        actions.push({
          id: 'use_item', name: '使用', icon: '👆', apCost: 1,
          conditions: { met: ap >= 1, reason: ap < 1 ? '行动点不足' : '' },
          effects: '使用该物品',
        });
        break;
      }
    }

    return { targetId, targetName, actions };
  }

  /** 获取类型显示图标 */
  private getTypeIcon(id: number, type: string | undefined): string {
    switch (type) {
      case 'npc': return '👤';
      case 'animal': return '🐾';
      case 'building': {
        const b = this.em.getComponent(id, 'Building');
        return b?.type === 'shop' ? '🏪' : b?.type === 'teahouse' ? '🍵' : '🏠';
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
        const b = this.em.getComponent(id, 'Building');
        return b?.type === 'shop' ? '店铺' : '房屋';
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
      case 'item': return '物品';
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

  /** 回合模拟：全世界推进一回合 */
  private simulateTurn(): { npcActions: number; priceChanges: Record<string, string>; causalEvents: CausalEvent[] } {
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
      this.simulateL0Action(entityId);
    }

    // 4. L1 NPC 批量行动 (简化模拟)
    this.simulateL1Batch();

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
    // 将因果事件写入事件日志
    for (const ce of causalEvents) {
      this.logEvent(ce.source === 'weather' ? 'weather' : ce.source === 'economy' ? 'economy' : ce.source === 'ecology' ? 'ecology' : 'npc',
        ce.source, ce.message);
      // 填充 cause 字段到最近一条事件
      if (this.eventLog.length > 0) {
        this.eventLog[this.eventLog.length - 1].cause = ce.cause;
        this.eventLog[this.eventLog.length - 1].source = ce.source;
      }
    }

    // 9. 随机事件（旧逻辑）
    this.generateTickEvents();

    // 计算物价变动
    const priceChanges: Record<string, string> = {};
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
        this.economy.recordChange(name, changeStr, priceReasons[name] || '市场波动');
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

    return { npcActions: this.lastTickEvents, priceChanges, causalEvents };
  }

  /** L0 NPC 单个行动模拟（状态驱动决策） */
  private simulateL0Action(entityId: number): void {
    const vital = this.em.getComponent(entityId, 'Vital');
    const wallet = this.em.getComponent(entityId, 'Wallet');
    const identity = this.em.getComponent(entityId, 'Identity');
    if (!vital || !identity) return;

    const name = identity.name;
    const hunger = vital.hunger;
    const fatigue = vital.fatigue;
    const mood = vital.mood ?? 50;
    const copper = wallet?.copper ?? 0;

    // 记录状态快照（决策前）
    const stateBefore = { hunger, fatigue, copper, mood };

    let action: string;
    let actionCause = '';

    // 状态驱动决策：按优先级检查
    if (hunger < 30) {
      // 饿了 → 吃饭
      action = 'eat';
      actionCause = `饥饿(${hunger})`;
      vital.hunger = Math.min(100, hunger + 30);
      if (wallet) wallet.copper = Math.max(0, copper - 10);
    } else if (fatigue > 80) {
      // 太累 → 休息
      action = 'rest';
      actionCause = `疲劳(${fatigue})`;
      vital.fatigue = Math.max(0, fatigue - 30);
    } else if (copper < 20 && Math.random() < 0.6) {
      // 没钱 → 找活赚钱
      const jobs = ['work_dock', 'work_teahouse', 'work_errand'];
      action = jobs[Math.floor(Math.random() * jobs.length)];
      actionCause = `铜钱(${copper})`;
      if (wallet) wallet.copper += Math.floor(Math.random() * 20) + 15;
      vital.fatigue = Math.min(100, fatigue + Math.floor(Math.random() * 11) + 15); // +15~25
      vital.hunger = Math.max(0, hunger - Math.floor(Math.random() * 3) - 8);       // -8~10
    } else if (copper > 200 && Math.random() < 0.4) {
      // 有钱 → 消费
      const shops = ['consume_cloth', 'consume_food', 'consume_tea'];
      action = shops[Math.floor(Math.random() * shops.length)];
      actionCause = `富裕(${copper})`;
      if (wallet) wallet.copper -= Math.floor(Math.random() * 50) + 20;
      vital.mood = Math.min(100, mood + Math.floor(Math.random() * 10) + 5);
      vital.hunger = Math.min(100, hunger + 10);
    } else if (mood < 30) {
      // 心情差 → 社交/去茶馆
      action = 'socialize';
      actionCause = `心情(${mood})`;
      vital.mood = Math.min(100, mood + Math.floor(Math.random() * 15) + 10);
      if (wallet) wallet.copper = Math.max(0, copper - 5);
      vital.hunger = Math.min(100, hunger + 5);
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
      // 工作收入随机
      if (wallet && action !== 'wander' && action !== 'stroll' && action !== 'chat') {
        wallet.copper += Math.floor(Math.random() * 40) + 10;
      }
      vital.fatigue = Math.min(100, fatigue + Math.floor(Math.random() * 11) + 15); // +15~25
      vital.hunger = Math.max(0, hunger - Math.floor(Math.random() * 3) - 8);       // -8~10
    }

    // 记录叙事事件
    const eventTemplates: Record<string, string[]> = {
      eat: [`${name}在路边买了两个炊饼，蹲着吃起来。`, `${name}去茶馆吃了一碗热汤面。`, `${name}啃着冷馒头，就着咸菜。`],
      rest: [`${name}找了个阴凉处歇了一会儿。`, `${name}打了个盹。`, `${name}靠在墙根眯了一小会儿。`],
      work_dock: [`${name}去码头扛了几包货，赚了些辛苦钱。`, `${name}在码头帮人卸了一船货。`],
      work_teahouse: [`${name}在茶楼帮忙跑堂。`, `${name}去茶楼帮工端茶倒水。`],
      work_errand: [`${name}帮人跑腿送了封信。`, `${name}在集市帮人搬了一车货。`],
      consume_cloth: [`${name}在布庄挑了匹好布，眉开眼笑。`, `${name}买了块新帕子，高兴得不得了。`],
      consume_food: [`${name}在酒楼点了一桌子好菜。`, `${name}买了只烧鸡，美滋滋地啃着。`],
      consume_tea: [`${name}在茶楼叫了一壶好茶，悠闲地品着。`, `${name}请朋友喝了壶碧螺春。`],
      socialize: [`${name}去找朋友串门聊天。`, `${name}在茶馆里和人大声说笑。`, `${name}和邻家大婶聊了半天闲话。`],
      sell: [`${name}卖出了一批货物，笑得合不拢嘴。`, `${name}在铺子里招呼客人。`],
      buy_stock: [`${name}去码头进了一批新货。`, `${name}和供货商讨价还价半天。`],
      bargain: [`${name}和客商谈了一笔大买卖。`, `${name}在柜台后面拨算盘，精打细算。`],
      farm: [`${name}在田间忙碌了一个时辰。`, `${name}弯腰在田里除草。`],
      water: [`${name}挑水浇了一亩菜地。`, `${name}在田埂上修水渠。`],
      harvest: [`${name}收割了一筐庄稼。`, `${name}在田里忙着收麦子。`],
      patrol: [`${name}在街上巡逻，目光警惕。`, `${name}检查了几个摊位的执照。`],
      inspect: [`${name}在城门口盘查过往行人。`, `${name}挨家挨户查火烛。`],
      guard_gate: [`${name}在城门口站岗。`, `${name}守在府衙门口。`],
      heal: [`${name}给一个病人开了药方。`, `${name}在药铺里配药。`],
      gather_herbs: [`${name}背着药篓上山采药去了。`, `${name}在城墙根找草药。`],
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
  }

  /** L1 NPC 批量模拟 */
  private simulateL1Batch(): void {
    let actions = 0;
    for (const entityId of this.l1Entities) {
      const vital = this.em.getComponent(entityId, 'Vital');
      if (!vital) continue;
      vital.hunger = Math.max(0, vital.hunger - 5);
      vital.fatigue = Math.min(100, vital.fatigue + 3);
      actions++;
    }
    this.lastTickEvents = actions + this.l0Entities.length;

    // 生成 L1 汇总事件
    const npcCount = this.l1Entities.length;
    if (npcCount > 0) {
      const summaries = [
        `城中有${Math.min(npcCount, Math.floor(npcCount * 0.3))}人在忙碌地干活。`,
        `街上来来往往${Math.floor(npcCount * 0.1)}个行人。`,
        `码头上${Math.floor(Math.random() * 30 + 10)}个搬运工在扛货。`,
      ];
      this.logEvent('npc', 'l1_summary', summaries[Math.floor(Math.random() * summaries.length)]);
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

    // 确保 AP 组件存在
    this.resetAP(playerId);

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
        options: template.getOptions(sceneCtx),
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
        turnSummary: { shichen: this.time.shichenName, day: this.time.day, events: 0, npcActions: 0, priceChanges: {}, weather: this.weather.weather, weatherDesc: this.weather.getDescription() },
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
    const options = template.getOptions(sceneCtx);
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
      options,
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
        events: tickEvents,
        npcActions: simResult.npcActions,
        priceChanges: simResult.priceChanges,
        weather: this.weather.weather,
        weatherDesc: this.weather.getDescription(),
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
      options: template.getOptions(ctx),
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
    const options = template.getOptions(sceneCtx);

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
      options,
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
        shichen: this.time.shichenName, day: this.time.day,
        events: tickEvents, npcActions: simResult.npcActions,
        priceChanges: simResult.priceChanges,
        weather: this.weather.weather, weatherDesc: this.weather.getDescription(),
      },
      distantNews,
      briefing,
    };
  }

  /** 获取行动的 AP 消耗 */
  private getActionAPCost(actionId: string): number {
    // 移动类行动消耗 0 AP
    const freeActions = ['go_center', 'go_east_market', 'go_tea_house', 'go_dock', 'go_residential',
      'enter_cloth_shop', 'enter_pharmacy', 'leave_cloth_shop', 'leave_pharmacy', 'leave_home'];
    if (freeActions.includes(actionId)) return 0;

    // 交互类行动（来自实体行为系统）
    const apCosts: Record<string, number> = {
      talk_to: 1, trade: 2, steal: 2, ask_advice: 1, provoke: 2, gift: 1,
      enter_building: 0, buy_from_shop: 1, ask_around: 1,
      observe: 0, hunt: 2, feed: 1, tame: 3,
      gather: 1, chop: 2, water: 1,
      collect: 2, mine: 3,
      pickup: 1, inspect: 0, use_item: 1,
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

      default:
        // 尝试处理基于实体的交互行动
        return this.executeEntityAction(playerId, actionId, params, vital, wallet, pos);
    }
  }

  /** 执行基于实体的交互行动 */
  private executeEntityAction(playerId: number, actionId: string, params: any, vital: VitalComponent | undefined, wallet: WalletComponent | undefined, pos: PositionComponent | undefined): string {
    const targetId = params?.targetId ? Number(params.targetId) : 0;
    if (!targetId || !this.em.isAlive(targetId)) {
      return `执行了 ${actionId}`;
    }

    const targetType = this.em.getType(targetId);
    const targetIdentity = this.em.getComponent(targetId, 'Identity');
    const targetName = targetIdentity?.name || this.getTypeDisplayName(targetId, targetType);

    switch (actionId) {
      // NPC 交互
      case 'talk_to': {
        if (vital) vital.mood = Math.min(100, vital.mood + 5);
        const memory = this.em.getComponent(targetId, 'Memory');
        if (memory) {
          memory.impressions[playerId] = (memory.impressions[playerId] || 0) + 5;
        }
        this.logEvent('player', '社交', `你和${targetName}攀谈了几句`);
        return `你和${targetName}聊了几句。${targetName}点了点头，似乎对你印象不错。`;
      }
      case 'trade': {
        const cost = 10 + Math.floor(Math.random() * 20);
        if (!wallet || wallet.copper < cost) return '铜钱不够交易。';
        wallet.copper -= cost;
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) {
          const itemTypes = ['food', 'cloth', 'herbs', 'material'];
          const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          inventory.items.push({ itemType, amount: 1 });
        }
        this.logEvent('player', '交易', `你和${targetName}完成了一笔交易`);
        return `你和${targetName}讨价还价一番，花${cost}文买了一些东西。`;
      }
      case 'steal': {
        const success = Math.random() > 0.4;
        if (success) {
          const amount = 5 + Math.floor(Math.random() * 20);
          const targetWallet = this.em.getComponent(targetId, 'Wallet');
          if (targetWallet && targetWallet.copper >= amount) {
            targetWallet.copper -= amount;
            if (wallet) wallet.copper += amount;
            this.logEvent('player', '偷窃', `你从${targetName}那里偷了${amount}文`);
            return `你趁${targetName}不注意，摸走了${amount}文铜钱。心里砰砰直跳。`;
          }
        }
        if (vital) { vital.mood = Math.max(0, vital.mood - 10); vital.health = Math.max(0, vital.health - 5); }
        this.logEvent('player', '偷窃', `你偷窃${targetName}被发现了`);
        return `你的手刚伸出去就被${targetName}发现了！${targetName}怒目而视，周围的人都看过来了。`;
      }
      case 'ask_advice': {
        if (vital) vital.mood = Math.min(100, vital.mood + 8);
        return `${targetName}想了想说："最近城里不太平，买东西要趁早。听说布价还要涨。"`;
      }
      case 'provoke': {
        if (vital) { vital.mood = Math.max(0, vital.mood - 5); vital.health = Math.max(0, vital.health - 10); }
        return `你故意挑衅${targetName}。对方脸色一沉，推了你一把。旁边的人赶紧把你们拉开。`;
      }
      case 'gift': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory && inventory.items.length > 0) {
          const item = inventory.items.pop();
          const memory = this.em.getComponent(targetId, 'Memory');
          if (memory) {
            memory.impressions[playerId] = (memory.impressions[playerId] || 0) + 15;
          }
          this.logEvent('player', '赠礼', `你送给${targetName}一件${item?.itemType || '物品'}`);
          return `你把一件${item?.itemType || '物品'}送给了${targetName}。${targetName}感激地说："多谢多谢，你是个好人。"`;
        }
        return '你翻遍背包，没找到什么可以送的。';
      }

      // 建筑交互
      case 'enter_building': {
        const targetPos = this.em.getComponent(targetId, 'Position');
        if (pos && targetPos) {
          this.worldMap.moveEntity(playerId, targetPos.gridId);
          pos.gridId = targetPos.gridId;
          pos.areaId = targetPos.areaId;
        }
        return `你走进了${targetName}。`;
      }
      case 'buy_from_shop': {
        const cost = 8 + Math.floor(Math.random() * 15);
        if (!wallet || wallet.copper < cost) return '铜钱不够。';
        wallet.copper -= cost;
        if (vital) vital.mood = Math.min(100, vital.mood + 3);
        return `你花了${cost}文买了些东西。`;
      }
      case 'ask_around': {
        if (vital) vital.mood = Math.min(100, vital.mood + 2);
        return pickChatter();
      }

      // 动物交互
      case 'observe': {
        return `你仔细观察了一下${targetName}。它似乎没有注意到你。`;
      }
      case 'hunt': {
        const success = Math.random() > 0.5;
        if (success) {
          if (vital) { vital.hunger = Math.min(100, vital.hunger + 20); vital.fatigue = Math.max(0, vital.fatigue - 15); }
          return `你费了一番功夫，成功捕获了${targetName}。`;
        }
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 10);
        return `你追了半天，${targetName}太灵活了，跑掉了。`;
      }
      case 'feed': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) {
          const foodIdx = inventory.items.findIndex(i => i.itemType === 'food');
          if (foodIdx >= 0) {
            inventory.items.splice(foodIdx, 1);
            return `你拿出一块食物喂给${targetName}。它嗅了嗅，吃了下去，看起来对你亲近了些。`;
          }
        }
        return '你没有食物可以喂。';
      }
      case 'tame': {
        const success = Math.random() > 0.7;
        if (success) return `${targetName}似乎接受了你，温顺地靠近了些。驯服取得了一些进展。`;
        return `${targetName}还是对你有些警惕，跑开了几步。你需要更多耐心。`;
      }

      // 植物交互
      case 'gather': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 5);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'herbs', amount: 1 });
        return `你采摘了一些${targetName}的产品。`;
      }
      case 'chop': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 15);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'material', amount: 1 });
        return `你砍伐了${targetName}，获得了一些木材。`;
      }
      case 'water': {
        return `你给${targetName}浇了些水，它看起来更加精神了。`;
      }

      // 矿物交互
      case 'collect': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 10);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'material', amount: 1 });
        return `你采集了一些${targetName}的碎片。`;
      }
      case 'mine': {
        if (vital) vital.fatigue = Math.max(0, vital.fatigue - 20);
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) inventory.items.push({ itemType: 'material', amount: 2 });
        return `你努力开采${targetName}，获得了一些矿石。`;
      }

      // 物品交互
      case 'pickup': {
        const inventory = this.em.getComponent(playerId, 'Inventory');
        if (inventory) {
          inventory.items.push({ itemType: 'misc', amount: 1 });
          // 移除物品实体
          this.worldMap.removeEntity(targetId);
          this.em.destroy(targetId);
        }
        return `你捡起了${targetName}。`;
      }
      case 'inspect': {
        return `你仔细检查了一下${targetName}。看起来是个普通的东西，但保存得还算完好。`;
      }
      case 'use_item': {
        if (vital) {
          vital.mood = Math.min(100, vital.mood + 3);
          vital.health = Math.min(100, vital.health + 5);
        }
        return `你使用了${targetName}。感觉好了些。`;
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
