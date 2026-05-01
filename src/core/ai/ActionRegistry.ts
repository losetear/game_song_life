export interface ActionContext {
  name: string;
  profession: string;
  locationId: string;
  weather: string;
  season: string;
  day: number;
  targetName?: string;
}

export interface GameAction {
  id: string;
  name: string;
  category: 'survival' | 'work' | 'social' | 'leisure' | 'move'
    | 'jianghu' | 'romance' | 'culture' | 'disaster';
  cost: { fatigue?: number; copper?: number; ap?: number };
  effects: Record<string, number>;  // 需求改善量
  conditions: {
    minCopper?: number;
    minHealth?: number;
    minHunger?: number;
    atLocation?: string[];
    profession?: string[];
    weather?: string[];
    season?: string[];
  };
  narrative: (ctx: ActionContext) => string;
}

export class ActionRegistry {
  private actions = new Map<string, GameAction>();

  register(action: GameAction): void {
    this.actions.set(action.id, action);
  }

  getById(id: string): GameAction | undefined {
    return this.actions.get(id);
  }

  /** 获取所有满足条件的可用行动 */
  getAvailable(ctx: {
    copper: number;
    health: number;
    hunger: number;
    locationId: string;
    profession: string;
    weather: string;
    season: string;
  }): GameAction[] {
    const result: GameAction[] = [];
    for (const action of this.actions.values()) {
      const c = action.conditions;
      if (c.minCopper !== undefined && ctx.copper < c.minCopper) continue;
      if (c.minHealth !== undefined && ctx.health < c.minHealth) continue;
      if (c.minHunger !== undefined && ctx.hunger < c.minHunger) continue;
      if (c.atLocation && !c.atLocation.includes(ctx.locationId)) continue;
      if (c.profession && !c.profession.includes(ctx.profession)) continue;
      if (c.weather && !c.weather.includes(ctx.weather)) continue;
      if (c.season && !c.season.includes(ctx.season)) continue;
      result.push(action);
    }
    return result;
  }

  getAll(): GameAction[] {
    return [...this.actions.values()];
  }
}

/** 创建预注册了所有MVP行动的注册表 */
export function createDefaultActionRegistry(): ActionRegistry {
  const reg = new ActionRegistry();

  // === 生存类 ===
  reg.register({
    id: 'eat_street',
    name: '在街上买吃的',
    category: 'survival',
    cost: { copper: 5, ap: 1 },
    effects: { hunger: 25, mood: 5 },
    conditions: { minCopper: 5, atLocation: ['street', 'market'] },
    narrative: (ctx) => `${ctx.name}在路边摊买了一碗热气腾腾的面条，呼哧呼哧吃了起来。`,
  });

  reg.register({
    id: 'eat_teahouse',
    name: '在茶馆喝茶吃点心',
    category: 'survival',
    cost: { copper: 10, ap: 1 },
    effects: { hunger: 20, mood: 10 },
    conditions: { minCopper: 10, atLocation: ['teahouse'] },
    narrative: (ctx) => `${ctx.name}在茶馆坐定，小二端上一壶龙井配几碟点心，悠哉得很。`,
  });

  reg.register({
    id: 'rest',
    name: '休息',
    category: 'survival',
    cost: { ap: 1 },
    effects: { fatigue: 20, mood: 5 },
    conditions: { atLocation: ['residential', 'teahouse'] },
    narrative: (ctx) => `${ctx.name}找了个安静角落歇了歇脚，养了养精神。`,
  });

  reg.register({
    id: 'see_doctor',
    name: '看郎中',
    category: 'survival',
    cost: { copper: 15, ap: 1 },
    effects: { health: 20 },
    conditions: { minCopper: 15, atLocation: ['clinic'], minHealth: 80 },
    narrative: (ctx) => `郎中给${ctx.name}把了脉，开了几副药，嘱咐好好休养。`,
  });

  reg.register({
    id: 'gather_wild',
    name: '采集野菜果腹',
    category: 'survival',
    cost: { fatigue: 10, ap: 1 },
    effects: { hunger: 15 },
    conditions: { atLocation: ['mountain', 'farmland'] },
    narrative: (ctx) => `${ctx.name}在${ctx.locationId === 'mountain' ? '山林间' : '田埂边'}采了些野菜，勉强充饥。`,
  });

  // === 工作类 ===
  reg.register({
    id: 'farm_work',
    name: '下地干活',
    category: 'work',
    cost: { fatigue: 20, ap: 1 },
    effects: { copper: 12, mood: -3 },
    conditions: { atLocation: ['farmland'], profession: ['农夫'] },
    narrative: (ctx) => `${ctx.name}弯腰在田里忙活了一阵，汗水浸透了衣衫。`,
  });

  reg.register({
    id: 'sell_goods',
    name: '卖货',
    category: 'work',
    cost: { fatigue: 10, ap: 1 },
    effects: { copper: 15 },
    conditions: { atLocation: ['market'], profession: ['商贩', '掌柜'] },
    narrative: (ctx) => `${ctx.name}在集市上摆开摊子，吆喝了半天，总算卖出去不少货。`,
  });

  reg.register({
    id: 'smith_work',
    name: '打铁',
    category: 'work',
    cost: { fatigue: 25, ap: 1 },
    effects: { copper: 18 },
    conditions: { atLocation: ['workshop'], profession: ['铁匠'] },
    narrative: (ctx) => `叮叮当当，${ctx.name}抡起铁锤，火星四溅，打出了一把好刀的雏形。`,
  });

  reg.register({
    id: 'carpenter_work',
    name: '做木工',
    category: 'work',
    cost: { fatigue: 20, ap: 1 },
    effects: { copper: 14 },
    conditions: { atLocation: ['workshop'], profession: ['木匠'] },
    narrative: (ctx) => `${ctx.name}刨花飞舞，精雕细琢，又做了一件像样的家具。`,
  });

  reg.register({
    id: 'fishing',
    name: '打鱼',
    category: 'work',
    cost: { fatigue: 15, ap: 1 },
    effects: { copper: 10, hunger: 5 },
    conditions: { atLocation: ['dock'], profession: ['渔民'] },
    narrative: (ctx) => `${ctx.name}撒了几网，虽不算丰收，也算有些收获。`,
  });

  reg.register({
    id: 'study',
    name: '读书',
    category: 'work',
    cost: { fatigue: 10, ap: 1 },
    effects: { mood: 5 },
    conditions: { profession: ['书生'] },
    narrative: (ctx) => `${ctx.name}翻开发黄的书卷，沉浸在字里行间。`,
  });

  reg.register({
    id: 'heal_patient',
    name: '诊治病人',
    category: 'work',
    cost: { fatigue: 15, ap: 1 },
    effects: { copper: 12, mood: 5 },
    conditions: { atLocation: ['clinic'], profession: ['郎中'] },
    narrative: (ctx) => `${ctx.name}给病人开了方子，抓了药，收了诊金。`,
  });

  reg.register({
    id: 'patrol',
    name: '巡逻',
    category: 'work',
    cost: { fatigue: 10, ap: 1 },
    effects: { copper: 8, mood: -2 },
    conditions: { atLocation: ['street', 'market'], profession: ['捕快'] },
    narrative: (ctx) => `${ctx.name}在街上巡视了一圈，维持治安。`,
  });

  reg.register({
    id: 'hunt',
    name: '打猎',
    category: 'work',
    cost: { fatigue: 20, ap: 1 },
    effects: { copper: 15, hunger: 5 },
    conditions: { atLocation: ['mountain'], profession: ['猎户'] },
    narrative: (ctx) => `${ctx.name}在山林中追踪猎物，今日运气不错。`,
  });

  reg.register({
    id: 'run_teahouse',
    name: '经营茶馆',
    category: 'work',
    cost: { fatigue: 10, ap: 1 },
    effects: { copper: 12, mood: 3 },
    conditions: { atLocation: ['teahouse'], profession: ['茶馆老板'] },
    narrative: (ctx) => `${ctx.name}招呼茶客，添茶倒水，生意还算红火。`,
  });

  reg.register({
    id: 'butcher_work',
    name: '卖肉',
    category: 'work',
    cost: { fatigue: 15, ap: 1 },
    effects: { copper: 14 },
    conditions: { atLocation: ['market'], profession: ['屠户'] },
    narrative: (ctx) => `${ctx.name}手起刀落，切了好几斤好肉，主顾们满意离去。`,
  });

  reg.register({
    id: 'labor_work',
    name: '卖苦力',
    category: 'work',
    cost: { fatigue: 25, ap: 1 },
    effects: { copper: 8 },
    conditions: { atLocation: ['dock', 'market'] },
    narrative: (ctx) => `${ctx.name}扛了半天的货，挣了几个辛苦钱。`,
  });

  // === 社交类 ===
  reg.register({
    id: 'chat',
    name: '闲聊',
    category: 'social',
    cost: { ap: 1 },
    effects: { mood: 8, social: 10 },
    conditions: {},
    narrative: (ctx) => `${ctx.name}和旁边的人拉了几句家常，倒也消遣。`,
  });

  reg.register({
    id: 'drink_teahouse',
    name: '喝茶听书',
    category: 'social',
    cost: { copper: 5, ap: 1 },
    effects: { mood: 12, hunger: 5, social: 5 },
    conditions: { minCopper: 5, atLocation: ['teahouse'] },
    narrative: (ctx) => `${ctx.name}在茶馆听着说书人拍案惊堂，端起茶碗慢慢品着。`,
  });

  // === 休闲类 ===
  reg.register({
    id: 'stroll',
    name: '闲逛',
    category: 'leisure',
    cost: { ap: 1 },
    effects: { mood: 5 },
    conditions: {},
    narrative: (ctx) => {
      const descs = [
        `${ctx.name}漫无目的地在街上走走看看，消磨了些时光。`,
        `${ctx.name}驻足看了一会儿杂耍，拍手叫好。`,
        `${ctx.name}溜达了一圈，看看热闹。`,
      ];
      return descs[ctx.day % descs.length]!;
    },
  });

  reg.register({
    id: 'visit_mountain',
    name: '游山',
    category: 'leisure',
    cost: { fatigue: 10, ap: 1 },
    effects: { mood: 10 },
    conditions: { atLocation: ['mountain'] },
    narrative: (ctx) => `${ctx.name}沿着山路拾级而上，呼吸着清新的空气，心旷神怡。`,
  });

  // === 交易类 ===
  reg.register({
    id: 'buy_grain',
    name: '买粮食',
    category: 'survival',
    cost: { copper: 12, ap: 1 },
    effects: { hunger: 30 },
    conditions: { minCopper: 12, atLocation: ['market', 'street'] },
    narrative: (ctx) => `${ctx.name}在集市上买了两斗米，够吃几天的了。`,
  });

  reg.register({
    id: 'buy_herb',
    name: '买药材',
    category: 'survival',
    cost: { copper: 18, ap: 1 },
    effects: { health: 15 },
    conditions: { minCopper: 18, atLocation: ['clinic'] },
    narrative: (ctx) => `${ctx.name}在药铺买了些补身的药材，回去煎服。`,
  });

  reg.register({
    id: 'buy_cloth',
    name: '买布匹',
    category: 'social',
    cost: { copper: 28, ap: 1 },
    effects: { mood: 8 },
    conditions: { minCopper: 28, atLocation: ['market'] },
    narrative: (ctx) => `${ctx.name}在布庄挑了块好料子，打算做件新衣裳。`,
  });

  // === 江湖类 ===
  reg.register({
    id: 'practice_martial_arts',
    name: '练功',
    category: 'jianghu',
    cost: { fatigue: 20, ap: 1 },
    effects: { health: 5, mood: 3 },
    conditions: { minHealth: 30, atLocation: ['mountain', 'residential', 'ruins'] },
    narrative: (ctx) => `${ctx.name}找了个僻静处，扎起马步，一练就是两个时辰。`,
  });

  reg.register({
    id: 'duel_arena',
    name: '擂台比武',
    category: 'jianghu',
    cost: { fatigue: 25, copper: 5, ap: 1 },
    effects: { mood: 10, social: 8 },
    conditions: { minHealth: 50, minCopper: 5, atLocation: ['temple'] },
    narrative: (ctx) => `${ctx.name}登上擂台，与对手过了几招，引得台下叫好连连。`,
  });

  reg.register({
    id: 'steal',
    name: '行窃',
    category: 'jianghu',
    cost: { fatigue: 15, ap: 1 },
    effects: { copper: 20, mood: -5 },
    conditions: { atLocation: ['market', 'street', 'dock'] },
    narrative: (ctx) => `${ctx.name}趁乱摸了几个钱袋，心跳得厉害。`,
  });

  reg.register({
    id: 'gamble_dice',
    name: '赌钱',
    category: 'jianghu',
    cost: { copper: 10, ap: 1 },
    effects: { copper: 2, mood: 1 },
    conditions: { minCopper: 10, atLocation: ['gambling_den'] },
    narrative: (ctx) => `${ctx.name}在赌坊押了注，${ctx.day % 3 !== 0 ? '手气不错！' : '输了个精光……'}`,
  });

  reg.register({
    id: 'beg',
    name: '乞讨',
    category: 'jianghu',
    cost: { fatigue: 5, ap: 1 },
    effects: { copper: 3, mood: -8, social: -2 },
    conditions: { atLocation: ['street', 'market', 'teahouse'] },
    narrative: (ctx) => `${ctx.name}在路边蹲了半天，讨得几文铜钱。`,
  });

  reg.register({
    id: 'spy_info',
    name: '刺探消息',
    category: 'jianghu',
    cost: { fatigue: 10, ap: 1 },
    effects: { social: 5, mood: 2 },
    conditions: { atLocation: ['teahouse', 'brothel', 'street'] },
    narrative: (ctx) => `${ctx.name}装作不经意地打听，从茶客闲谈中拼凑出些有用的消息。`,
  });

  reg.register({
    id: 'escort_caravan',
    name: '走镖',
    category: 'jianghu',
    cost: { fatigue: 25, ap: 1 },
    effects: { copper: 25, mood: 5 },
    conditions: { minHealth: 60, profession: ['猎户', '捕快', '铁匠'], atLocation: ['street', 'dock'] },
    narrative: (ctx) => `${ctx.name}接了一趟镖活儿，护送商队出城，一路小心谨慎。`,
  });

  // === 情感类 ===
  reg.register({
    id: 'write_love_letter',
    name: '写情书',
    category: 'romance',
    cost: { fatigue: 5, ap: 1 },
    effects: { mood: 8 },
    conditions: {},
    narrative: (ctx) => `${ctx.name}铺开信纸，斟酌再三，写下了几行心事。`,
  });

  reg.register({
    id: 'send_fine_gift',
    name: '赠送精品',
    category: 'romance',
    cost: { copper: 30, ap: 1 },
    effects: { mood: 10, social: 12 },
    conditions: { minCopper: 30, atLocation: ['market', 'street'] },
    narrative: (ctx) => `${ctx.name}在首饰铺挑了一支精致的簪子，小心翼翼收好。`,
  });

  reg.register({
    id: 'invite_riverside',
    name: '邀约河畔',
    category: 'romance',
    cost: { copper: 8, ap: 1 },
    effects: { mood: 15, social: 8 },
    conditions: { minCopper: 8, season: ['春', '夏'], atLocation: ['riverside'] },
    narrative: (ctx) => `${ctx.name}约了人来到汴河畔，柳丝轻拂，波光粼粼。`,
  });

  reg.register({
    id: 'visit_brothel',
    name: '逛樊楼',
    category: 'romance',
    cost: { copper: 50, fatigue: 10, ap: 1 },
    effects: { mood: 18, hunger: 10, social: 5 },
    conditions: { minCopper: 50, minHealth: 40, atLocation: ['brothel'] },
    narrative: (ctx) => `${ctx.name}踏入樊楼，笙歌曼舞，脂粉香气扑面而来。`,
  });

  reg.register({
    id: 'moonlight_date',
    name: '月下相会',
    category: 'romance',
    cost: { fatigue: 5, ap: 1 },
    effects: { mood: 20, social: 6 },
    conditions: { weather: ['晴', '多云'], atLocation: ['riverside', 'temple', 'mountain'] },
    narrative: (ctx) => `月色如水，${ctx.name}与人并肩而立，说了许多平日不敢说的话。`,
  });

  // === 文化类 ===
  reg.register({
    id: 'compose_poetry',
    name: '作诗',
    category: 'culture',
    cost: { fatigue: 8, ap: 1 },
    effects: { mood: 12, social: 5 },
    conditions: { profession: ['书生', '匠人', '郎中'], atLocation: ['academy', 'teahouse', 'riverside'] },
    narrative: (ctx) => `${ctx.name}灵感来了，提笔挥毫，一首七绝跃然纸上。`,
  });

  reg.register({
    id: 'attend_lantern',
    name: '赏灯会',
    category: 'culture',
    cost: { copper: 5, fatigue: 10, ap: 1 },
    effects: { mood: 18, social: 12 },
    conditions: { minCopper: 5, season: ['春'], atLocation: ['street', 'temple', 'riverside'] },
    narrative: (ctx) => `元宵灯会，花灯如海。${ctx.name}挤在人群中猜灯谜、看杂耍，好不热闹。`,
  });

  reg.register({
    id: 'drink_wine',
    name: '饮酒',
    category: 'culture',
    cost: { copper: 12, fatigue: 5, ap: 1 },
    effects: { mood: 14, hunger: 8, social: 8 },
    conditions: { minCopper: 12, minHealth: 40, atLocation: ['teahouse', 'brothel', 'riverside'] },
    narrative: (ctx) => `${ctx.name}要了一壶好酒，自斟自饮，渐入佳境。`,
  });

  reg.register({
    id: 'play_instrument',
    name: '奏乐',
    category: 'culture',
    cost: { fatigue: 5, ap: 1 },
    effects: { mood: 16, social: 6 },
    conditions: { atLocation: ['teahouse', 'brothel', 'academy', 'riverside'] },
    narrative: (ctx) => `${ctx.name}取出乐器，指尖流淌出的曲调引来路人驻足倾听。`,
  });

  reg.register({
    id: 'paint_art',
    name: '作画',
    category: 'culture',
    cost: { fatigue: 8, copper: 5, ap: 1 },
    effects: { mood: 12 },
    conditions: { minCopper: 5, atLocation: ['academy', 'riverside', 'residential'] },
    narrative: (ctx) => `${ctx.name}摊开宣纸，研墨运笔，山水花鸟渐渐成形。`,
  });

  reg.register({
    id: 'play_chess',
    name: '下棋',
    category: 'culture',
    cost: { fatigue: 6, ap: 1 },
    effects: { mood: 10, social: 4 },
    conditions: { atLocation: ['teahouse', 'academy', 'temple'] },
    narrative: (ctx) => `${ctx.name}与人对弈，棋盘上杀得难解难分。`,
  });

  reg.register({
    id: 'tea_ceremony',
    name: '斗茶',
    category: 'culture',
    cost: { copper: 8, ap: 1 },
    effects: { mood: 10, social: 8 },
    conditions: { minCopper: 8, atLocation: ['teahouse', 'academy'] },
    narrative: (ctx) => `${ctx.name}与几位雅士比试点茶技艺，汤花细腻，清香四溢。`,
  });

  reg.register({
    id: 'worship_temple',
    name: '拜佛祈福',
    category: 'culture',
    cost: { copper: 5, fatigue: 5, ap: 1 },
    effects: { mood: 12 },
    conditions: { minCopper: 5, atLocation: ['temple'] },
    narrative: (ctx) => `${ctx.name}在相国寺大殿前上了三炷香，默默许下了心愿。`,
  });

  reg.register({
    id: 'watch_opera',
    name: '听戏',
    category: 'culture',
    cost: { copper: 6, fatigue: 5, ap: 1 },
    effects: { mood: 14, social: 4 },
    conditions: { minCopper: 6, atLocation: ['teahouse', 'brothel', 'street'] },
    narrative: (ctx) => `${ctx.name}坐在戏台前，看着台上唱念做打，听得入迷。`,
  });

  reg.register({
    id: 'calligraphy',
    name: '习字',
    category: 'culture',
    cost: { fatigue: 6, ap: 1 },
    effects: { mood: 7 },
    conditions: { atLocation: ['academy', 'residential'] },
    narrative: (ctx) => `${ctx.name}铺纸研墨，一笔一划临摹着碑帖，心神渐渐沉静。`,
  });

  // === 灾变/义举类 ===
  reg.register({
    id: 'donate_relief',
    name: '捐助赈灾',
    category: 'disaster',
    cost: { copper: 30, ap: 1 },
    effects: { mood: 15, social: 20 },
    conditions: { minCopper: 30, atLocation: ['temple', 'government_office', 'street'] },
    narrative: (ctx) => `${ctx.name}将铜钱捐给了赈灾的僧人，对方合十道谢。`,
  });

  reg.register({
    id: 'help_rebuild',
    name: '帮忙重建',
    category: 'disaster',
    cost: { fatigue: 25, ap: 1 },
    effects: { copper: 8, mood: 10, social: 12 },
    conditions: { minHealth: 40, atLocation: ['residential', 'street', 'farmland'] },
    narrative: (ctx) => `${ctx.name}帮邻居修葺被损的房屋，干了大半天，手都磨出了泡。`,
  });

  reg.register({
    id: 'flee_city',
    name: '逃难',
    category: 'disaster',
    cost: { fatigue: 20, copper: 10, ap: 1 },
    effects: { health: -5, mood: -10 },
    conditions: { minCopper: 10, minHealth: 30 },
    narrative: (ctx) => `城内局势不稳，${ctx.name}收拾细软，匆匆出了城门。`,
  });

  reg.register({
    id: 'treat_plague_victim',
    name: '救治病患',
    category: 'disaster',
    cost: { fatigue: 20, copper: 5, ap: 1 },
    effects: { copper: 10, mood: 8, social: 10 },
    conditions: { minHealth: 50, profession: ['郎中'], atLocation: ['clinic', 'residential'] },
    narrative: (ctx) => `${ctx.name}日夜照料染病的百姓，熬了几大碗汤药送过去。`,
  });

  reg.register({
    id: 'fight_fire',
    name: '救火',
    category: 'disaster',
    cost: { fatigue: 30, ap: 1 },
    effects: { health: -10, copper: 15, mood: 12, social: 18 },
    conditions: { minHealth: 50, atLocation: ['street', 'residential', 'market'] },
    narrative: (ctx) => `${ctx.name}冲进火场帮忙递水桶，烟熏火燎却顾不上。`,
  });

  reg.register({
    id: 'patrol_disaster',
    name: '灾后巡逻',
    category: 'disaster',
    cost: { fatigue: 15, ap: 1 },
    effects: { copper: 10, mood: -3 },
    conditions: { profession: ['捕快'], atLocation: ['street', 'market'] },
    narrative: (ctx) => `${ctx.name}在满目疮痍的街上巡视，防止有人趁乱抢劫。`,
  });

  // === 更多休闲/社交 ===
  reg.register({
    id: 'gossip_chat',
    name: '听八卦',
    category: 'social',
    cost: { copper: 2, ap: 1 },
    effects: { mood: 10, social: 6 },
    conditions: { minCopper: 2, atLocation: ['teahouse', 'market'] },
    narrative: (ctx) => `${ctx.name}买了碟瓜子，坐在一旁听街坊们聊最近的奇闻轶事。`,
  });

  reg.register({
    id: 'visit_ruins',
    name: '探废弃宅院',
    category: 'leisure',
    cost: { fatigue: 15, ap: 1 },
    effects: { mood: 8 },
    conditions: { minHealth: 50, atLocation: ['ruins'] },
    narrative: (ctx) => `${ctx.name}壮着胆子走进那座荒废多年的宅院，似乎听到了什么动静……`,
  });

  reg.register({
    id: 'fishing_leisure',
    name: '垂钓',
    category: 'leisure',
    cost: { fatigue: 8, ap: 1 },
    effects: { mood: 12, hunger: 5 },
    conditions: { atLocation: ['riverside', 'dock'] },
    narrative: (ctx) => `${ctx.name}在河边架起鱼竿，静静等待鱼儿上钩。`,
  });

  reg.register({
    id: 'boating',
    name: '泛舟汴河',
    category: 'leisure',
    cost: { copper: 10, fatigue: 5, ap: 1 },
    effects: { mood: 16, social: 4 },
    conditions: { minCopper: 10, season: ['春', '夏'], atLocation: ['riverside', 'dock'] },
    narrative: (ctx) => `${ctx.name}租了条小船，顺流而下，两岸风光尽收眼底。`,
  });

  reg.register({
    id: 'meditate',
    name: '打坐冥想',
    category: 'leisure',
    cost: { fatigue: -5, ap: 1 },
    effects: { mood: 8, health: 3 },
    conditions: { atLocation: ['temple', 'academy', 'mountain'] },
    narrative: (ctx) => `${ctx.name}盘膝而坐，闭目凝神，将纷乱的思绪一一理清。`,
  });

  // ==================== 新增行动系统丰富化 ====================

  // === 工作类（赚钱） ===
  reg.register({
    id: 'work_porter',
    name: '码头搬运',
    category: 'work',
    cost: { fatigue: 20, ap: 1 },
    effects: { copper: 15 },
    conditions: { atLocation: ['dock'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在码头扛了一天的货，汗流浃背，挣了几个辛苦钱。`,
        `码头货物堆积如山，${ctx.name}来回奔波，手臂都酸了。`,
        `${ctx.name}帮商行搬运布匹，掌柜的还算大方。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'work_woodcut',
    name: '砍柴',
    category: 'work',
    cost: { fatigue: 25, ap: 1 },
    effects: { copper: 20 },
    conditions: { atLocation: ['mountain', 'farmland'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在山林里砍了一捆柴，背到集市卖了。`,
        `斧头挥了一整天，${ctx.name}砍了满满一车柴火。`,
        `${ctx.name}砍得手都起泡了，好在柴火能卖个好价钱。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'work_fishing',
    name: '钓鱼',
    category: 'work',
    cost: { fatigue: 15, ap: 1 },
    effects: { copper: 12, hunger: 5 },
    conditions: { atLocation: ['riverside', 'dock'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在汴河边钓了一下午，收获了几条鲜鱼。`,
        `鱼竿一动，${ctx.name}拉起来一条大鱼，今天运气不错！`,
        `守了半天，${ctx.name}总算钓到几条小鱼，勉强换几个钱。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'work_farming',
    name: '种田',
    category: 'work',
    cost: { fatigue: 25, ap: 1 },
    effects: { copper: 18 },
    conditions: { atLocation: ['farmland'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在田间劳作了一整天，腰酸背痛。`,
        `春耕时节，${ctx.name}弯腰插秧，汗水滴入泥土。`,
        `${ctx.name}给庄稼浇水施肥，盼望秋天有好收成。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'work_scribe',
    name: '代写书信',
    category: 'work',
    cost: { fatigue: 10, ap: 1 },
    effects: { copper: 25 },
    conditions: { atLocation: ['teahouse', 'street'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在茶馆摆了张桌子，帮不识字的百姓写家书。`,
        `一位大娘托${ctx.name}给儿子写封信，塞了几个铜板。`,
        `${ctx.name}笔走龙蛇，一封家书写得情真意切。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'work_hawker',
    name: '摆摊叫卖',
    category: 'work',
    cost: { fatigue: 12, ap: 1 },
    effects: { copper: 10 },
    conditions: { atLocation: ['street', 'market'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在街边摆了个小摊，吆喝了半天。`,
        `集市上人潮涌动，${ctx.name}的摊位总算有些生意。`,
        `${ctx.name}沿街叫卖，嗓子都快哑了。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  // === 生活类（维持生存） ===
  reg.register({
    id: 'eat_street_food',
    name: '吃小食',
    category: 'survival',
    cost: { copper: 10, ap: 1 },
    effects: { hunger: 20, mood: 3 },
    conditions: { minCopper: 10, atLocation: ['street', 'market'] },
    narrative: (ctx) => {
      if (ctx.weather === '晴') {
        return `${ctx.name}在路边摊坐下，要了一份炊饼。阳光照在身上暖洋洋的，炊饼刚出炉，外酥里嫩。`;
      } else if (ctx.weather === '雨') {
        return `${ctx.name}冒雨走到一个遮雨棚下，买了一碗热气腾腾的面条。虽然简陋，但雨天里吃碗热面格外舒坦。`;
      } else if (ctx.season === '冬') {
        return `寒风中，${ctx.name}裹紧衣服走向路边摊，一碗羊肉汤下肚，从胃里暖到心里。`;
      }
      return `${ctx.name}在路边摊买了点吃的，简单填饱肚子。`;
    },
  });

  reg.register({
    id: 'eat_restaurant',
    name: '下馆子',
    category: 'survival',
    cost: { copper: 80, ap: 1 },
    effects: { hunger: 50, mood: 15 },
    conditions: { minCopper: 80, atLocation: ['brothel', 'teahouse'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在樊楼点了一桌好菜，酒足饭饱，心满意足。`,
        `小二端上八道菜，${ctx.name}细细品味，虽然贵但值得。`,
        `${ctx.name}难得下馆子，点了些硬菜，好好犒劳自己。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'drink_tea_simple',
    name: '喝茶',
    category: 'survival',
    cost: { copper: 8, ap: 1 },
    effects: { fatigue: -8, mood: 8 },
    conditions: { minCopper: 8, atLocation: ['teahouse'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在茶馆坐定，要了一壶茶，慢慢品着。`,
        `茶香袅袅，${ctx.name}靠在椅子上，放松疲惫的身心。`,
        `${ctx.name}听着茶客闲谈，喝着热茶，悠闲自在。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'rest_inn',
    name: '住客栈',
    category: 'survival',
    cost: { copper: 30, ap: 1 },
    effects: { fatigue: 40, mood: 5 },
    conditions: { minCopper: 30, atLocation: ['inn', 'residential'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}在客栈开了间房，躺在干净的床上沉沉睡去。`,
        `客栈的被褥还算干净，${ctx.name}一觉睡到大天亮。`,
        `${ctx.name}花三十文住了晚客栈，睡得比在家里还香。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'rest_street',
    name: '露宿街头',
    category: 'survival',
    cost: { ap: 1 },
    effects: { fatigue: 10, health: -5 },
    conditions: { atLocation: ['street', 'temple'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}蜷缩在墙角，盖着破衣烂衫睡了一晚，醒来浑身酸痛。`,
        `夜风刺骨，${ctx.name}躲在屋檐下瑟瑟发抖，勉强挨过一夜。`,
        `${ctx.name}在相国寺门口找了个角落，勉强休息了一会儿。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'visit_doctor_advanced',
    name: '看大夫',
    category: 'survival',
    cost: { copper: 50, ap: 1 },
    effects: { health: 35 },
    conditions: { minCopper: 50, atLocation: ['clinic'], minHealth: 60 },
    narrative: (ctx) => {
      const narratives = [
        `郎中给${ctx.name}把了脉，开了几副名贵药材，煎服后感觉好多了。`,
        `${ctx.name}花大价钱看了名医，开了方子抓了药，果然药到病除。`,
        `老郎中仔细检查了${ctx.name}的身子，开了几味补药，嘱咐好生休养。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  // === 社交类 ===
  reg.register({
    id: 'buy_drink_for_npc',
    name: '请客喝酒',
    category: 'social',
    cost: { copper: 15, ap: 1 },
    effects: { mood: 10, social: 15 },
    conditions: { minCopper: 15, atLocation: ['teahouse', 'brothel'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}叫来一壶好酒，请邻座的人共饮，大家相谈甚欢。`,
        `${ctx.name}大方地请客，满座的人都举起酒杯致谢。`,
        `酒过三巡，${ctx.name}和周围的人称兄道弟起来。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'give_gift',
    name: '送礼',
    category: 'social',
    cost: { copper: 30, ap: 1 },
    effects: { mood: 12, social: 20 },
    conditions: { minCopper: 30 },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}送上一份精心挑选的礼物，对方笑逐颜开。`,
        `${ctx.name}送礼送到心坎上，对方连声道谢。`,
        `礼轻情意重，${ctx.name}的礼物让人心生好感。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'play_chess',
    name: '下棋',
    category: 'social',
    cost: { ap: 1 },
    effects: { mood: 12 },
    conditions: { atLocation: ['teahouse', 'academy'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}与人对弈，棋盘上厮杀激烈，围观的人啧啧称奇。`,
        `一局棋下完，${ctx.name}虽败犹荣，约定来日再战。`,
        `${ctx.name}落子如飞，对手渐渐招架不住，周围一片叫好。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'listen_story',
    name: '听书',
    category: 'social',
    cost: { copper: 3, ap: 1 },
    effects: { mood: 15 },
    conditions: { minCopper: 3, atLocation: ['teahouse'] },
    narrative: (ctx) => {
      const narratives = [
        `说书人拍案惊堂，${ctx.name}听得入迷，连喝彩都忘了。`,
        `那书说到精彩处，${ctx.name}和满座听众一起鼓掌叫好。`,
        `${ctx.name}在茶馆听了一场评书，听得津津有味。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  // === 学习类 ===
  reg.register({
    id: 'study_book',
    name: '读书',
    category: 'leisure',
    cost: { fatigue: 8, ap: 1 },
    effects: { mood: 8 },
    conditions: { atLocation: ['academy', 'residential', 'teahouse'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}翻开书卷，沉浸在知识的海洋中。`,
        `灯火下，${ctx.name}认真读书，不知不觉夜深了。`,
        `${ctx.name}读到精彩处，忍不住拍案叫绝。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'practice_calligraphy',
    name: '练字',
    category: 'leisure',
    cost: { fatigue: 6, ap: 1 },
    effects: { mood: 6 },
    conditions: { atLocation: ['academy', 'residential'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}铺纸研墨，一笔一划临摹着碑帖。`,
        `练了一下午字，${ctx.name}的手腕都酸了，但字确实有进步。`,
        `${ctx.name}专注地写着字，心神渐渐沉静下来。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

  reg.register({
    id: 'learn_trade',
    name: '学手艺',
    category: 'work',
    cost: { copper: 40, ap: 1 },
    effects: { mood: 5 },
    conditions: { minCopper: 40, atLocation: ['workshop', 'market'] },
    narrative: (ctx) => {
      const narratives = [
        `${ctx.name}拜了个师傅，交了学费，开始学手艺。`,
        `师傅手把手地教，${ctx.name}学得很认真。`,
        `${ctx.name}花了点钱，向匠人请教了不少门道。`,
      ];
      return narratives[ctx.day % narratives.length]!;
    },
  });

   return reg;
}
