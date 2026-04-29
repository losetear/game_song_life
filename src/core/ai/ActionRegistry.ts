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
  category: 'survival' | 'work' | 'social' | 'leisure' | 'move';
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

  return reg;
}
