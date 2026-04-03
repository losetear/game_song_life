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
import { SceneOption } from '../server/protocol';

// === 世界事件日志 ===
export interface WorldEvent {
  tick: number;
  time: string;       // ISO timestamp
  type: 'npc' | 'player' | 'economy' | 'state' | 'move';
  category: string;   // 子分类
  message: string;    // 描述
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
    prices: Record<string, number>;
  };
  playerState: {
    hunger: number;
    fatigue: number;
    health: number;
    mood: number;
    copper: number;
  };
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
}

const NPC_NAMES = ['王掌柜', '刘寡妇', '张三', '李大夫', '赵秀才', '陈猎户', '孙铁匠', '周嫂子'];
const NPC_TITLES = ['掌柜', '寡妇', '混混', '大夫', '秀才', '猎户', '铁匠', '嫂子'];

function pickNPC(): string {
  const i = Math.floor(Math.random() * NPC_NAMES.length);
  return NPC_NAMES[i];
}

function pickChatter(): string {
  const chatters = [
    `一个挑夫擦着汗说："最近粮价涨了不少，一天赚的钱还不够买两斤米。"`,
    `两个商人在角落低声说："听说城南闹了匪，布庄都不敢进货了。"`,
    `一个妇人对邻居说："我家那口子说药铺的药也贵了，这日子…"`,
    `一个书生摇着扇子感叹："这世道，连笔墨纸砚都涨了价。"`,
    `一个老汉叹道："今年雨水多，庄稼不好，米价怕是还要涨。"`,
    `一个小孩跑过喊："快去看！码头来了好大一条船！"`,
    `一个捕快匆匆走过："让开让开！城门那边出事了！"`,
    `一个卖花姑娘怯怯地说："姑娘，买朵花吧？只要两文钱…"`,
  ];
  return chatters[Math.floor(Math.random() * chatters.length)];
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

  private l0Entities: number[] = [];  // GOAP NPC
  private l1Entities: number[] = [];  // 行为树 NPC

  // 世界事件环形缓冲区
  private eventLog: WorldEvent[] = [];
  private readonly maxEvents = 100;
  readonly startTime: number = Date.now();

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

    // 随机生成 L1 NPC 行为事件
    for (const entityId of this.l1Entities) {
      if (Math.random() > 0.95) continue;
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

  /** 获取场景模板 */
  getSceneTemplate(gridId: string): SceneTemplate {
    return SCENE_TEMPLATES[gridId] || SCENE_TEMPLATES['center_street'];
  }

  /** 获取当前场景上下文 */
  private getSceneContext(playerId: number): SceneContext {
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
    };
  }

  /** 执行玩家操作 → 完整 Tick，返回丰富场景描述 */
  executePlayerAction(playerId: number, actionId: string, params: any): TickResult {
    const timings: TickTimings = {
      total: 0, playerAction: 0, l0GOAP: 0, l1BehaviorTree: 0,
      l2Statistics: 0, economy: 0, perception: 0, vitalDecay: 0, assemble: 0,
    };
    const startTotal = performance.now();

    // 1. 执行玩家操作
    let t0 = performance.now();
    const actionMessage = this.executeAction(playerId, actionId, params);
    timings.playerAction = performance.now() - t0;

    // 2. L0 GOAP 更新
    t0 = performance.now();
    this.updateL0();
    timings.l0GOAP = performance.now() - t0;

    // 3. L1 行为树更新
    t0 = performance.now();
    this.updateL1();
    timings.l1BehaviorTree = performance.now() - t0;

    // 记录 L0/L1 事件
    this.generateTickEvents();

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

    // 8. 组装场景描述
    t0 = performance.now();

    const pos = this.em.getComponent(playerId, 'Position');
    const gridId = pos?.gridId || 'center_street';
    const template = this.getSceneTemplate(gridId);
    const sceneCtx = this.getSceneContext(playerId);

    const sceneDescription = template.getDescription(sceneCtx);
    const options = template.getOptions(sceneCtx);
    const sceneLocation = template.locationName;

    // 生成 NPC 消息
    const npcMessages: string[] = [];
    if (Math.random() > 0.3) {
      npcMessages.push(pickChatter());
    }

    const vital = this.em.getComponent(playerId, 'Vital');
    const wallet = this.em.getComponent(playerId, 'Wallet');

    timings.assemble = performance.now() - t0;

    // 时间推进
    this.time.advance();
    timings.total = performance.now() - startTotal;

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
        prices: this.economy.getPrices(),
      },
      playerState: {
        hunger: vital?.hunger ?? 50,
        fatigue: vital?.fatigue ?? 50,
        health: vital?.health ?? 80,
        mood: vital?.mood ?? 50,
        copper: wallet?.copper ?? 0,
      },
    };
  }

  /** 获取初始场景（玩家刚连接时） */
  getInitialScene(playerId: number): { description: string; location: string; options: SceneOption[] } {
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
