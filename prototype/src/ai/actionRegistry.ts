// === NPC 行动注册表 — 需求驱动行动系统 ===

// 行动上下文：执行行动时的环境信息
export interface ActionContext {
  npcName: string;
  profession: string;
  location: string;
  weather: string;
  shichen: string;
  day: number;
  targetName?: string;
}

// NPC 行动定义
export interface NPCAction {
  id: string;
  name: string;
  icon: string;
  category: 'survival' | 'work' | 'social' | 'family' | 'faction' | 'leisure' | 'move';
  cost: { fatigue?: number; copper?: number; hunger?: number };
  effects: Record<string, number>;
  targetNeeds: string[];
  conditions: {
    minHunger?: number;
    minHealth?: number;
    minCopper?: number;
    atLocation?: string[];
    hasItem?: string[];
    profession?: string[];
    factionRole?: string[];
    weather?: string[];
    timeOfDay?: 'day' | 'night';
  };
  narrative: (ctx: ActionContext) => string;
}

// ═══════════════════════════════════════════
// 叙事模板辅助函数
// ═══════════════════════════════════════════

const weatherDesc = (w: string): string => {
  const map: Record<string, string> = {
    '晴': '阳光正好', '多云': '天色阴沉', '阴': '乌云密布',
    '小雨': '细雨绵绵', '大雨': '大雨倾盆', '暴雨': '暴雨如注',
    '雪': '雪花纷飞', '雾': '晨雾弥漫',
  };
  return map[w] || '天朗气清';
};

const timeDesc = (s: string): string => {
  const map: Record<string, string> = {
    '子': '夜深人静', '丑': '更漏声残', '寅': '天边微白',
    '卯': '晨曦初照', '辰': '朝阳初升', '巳': '日上三竿',
    '午': '正午时分', '未': '午后时分', '申': '日影西斜',
    '酉': '暮色渐浓', '戌': '华灯初上', '亥': '夜色深沉',
  };
  return map[s] || '街头人来人往';
};

const profAdverb = (p: string): string => {
  const map: Record<string, string> = {
    merchant: '精明地', guard: '警觉地', rogue: '鬼鬼祟祟地',
    doctor: '仔细地', farmer: '辛勤地', hunter: '小心翼翼地',
    laborer: '卖力地', blacksmith: '专注地', teacher: '耐心地',
  };
  return map[p] || '认真地';
};

// ═══════════════════════════════════════════
// 完整行动注册表（40+ 行动）
// ═══════════════════════════════════════════

export const ALL_ACTIONS: NPCAction[] = [
  // ──── 生存类 (Survival) ────
  {
    id: 'eat_food',
    name: '吃饭',
    icon: '🍚',
    category: 'survival',
    cost: { copper: 5, fatigue: -3 },
    effects: { hunger: 30, mood: 3 },
    targetNeeds: ['hunger'],
    conditions: { minCopper: 5 },
    narrative: (ctx) => `${timeDesc(ctx.shichen)}，${ctx.npcName}去街边买了两个炊饼，蹲在墙根下大口吃起来。`,
  },
  {
    id: 'eat_home',
    name: '在家吃饭',
    icon: '🍲',
    category: 'survival',
    cost: { fatigue: -2 },
    effects: { hunger: 25, mood: 5 },
    targetNeeds: ['hunger'],
    conditions: { atLocation: ['residential_north', 'residential_south'] },
    narrative: (ctx) => `${ctx.npcName}回到家中，热了些剩饭剩菜，吃了起来。虽然简单，但也算填饱了肚子。`,
  },
  {
    id: 'sleep',
    name: '睡觉',
    icon: '😴',
    category: 'survival',
    cost: {},
    effects: { fatigue: 40, hunger: -8 },
    targetNeeds: ['fatigue'],
    conditions: { atLocation: ['residential_north', 'residential_south'] },
    narrative: (ctx) => `${ctx.npcName}回到住处，倒头便睡。${weatherDesc(ctx.weather)}，窗外偶有声响，却也不曾惊扰。`,
  },
  {
    id: 'rest',
    name: '休息',
    icon: '🪑',
    category: 'survival',
    cost: {},
    effects: { fatigue: 15, hunger: -5 },
    targetNeeds: ['fatigue'],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}找了个阴凉处歇了一会儿，${weatherDesc(ctx.weather)}，吹了阵风，精神好了一些。`,
  },
  {
    id: 'buy_food',
    name: '买食物',
    icon: '🛒',
    category: 'survival',
    cost: { copper: 8 },
    effects: { hunger: 20 },
    targetNeeds: ['hunger'],
    conditions: { minCopper: 8, atLocation: ['center_street', 'east_market'] },
    narrative: (ctx) => `${ctx.npcName}在市集上花了八文钱买了些干粮，揣在怀里备用。`,
  },
  {
    id: 'seek_doctor',
    name: '求医',
    icon: '👨‍⚕️',
    category: 'survival',
    cost: { copper: 15, fatigue: 5 },
    effects: { health: 25, mood: 5 },
    targetNeeds: ['health'],
    conditions: { minCopper: 15, atLocation: ['center_street', 'east_market'] },
    narrative: (ctx) => `${ctx.npcName}觉得身子不舒服，去济世堂看了大夫，抓了几服药，花了十五文。`,
  },
  {
    id: 'find_shelter',
    name: '避雨',
    icon: '🏠',
    category: 'survival',
    cost: { fatigue: -3 },
    effects: { safety: 20, health: 5 },
    targetNeeds: ['safety'],
    conditions: { weather: ['大雨', '暴雨', '雪'] },
    narrative: (ctx) => `天降${ctx.weather}，${ctx.npcName}赶紧跑到屋檐下躲避，等雨势小些再走。`,
  },

  // ──── 工作类 (Work) — 职业专属 ────
  {
    id: 'sell_goods',
    name: '卖货',
    icon: '🏪',
    category: 'work',
    cost: { fatigue: 15 },
    effects: { copper: 20, mood: 5 },
    targetNeeds: ['hunger', 'mood'],
    conditions: { profession: ['merchant'], atLocation: ['east_market', 'center_street'] },
    narrative: (ctx) => `${timeDesc(ctx.shichen)}，${ctx.npcName}${profAdverb(ctx.profession)}在摊位前招呼客人，把丝绸瓷器一一摆出。吆喝了一阵，卖出去几件货。`,
  },
  {
    id: 'restock',
    name: '进货',
    icon: '📦',
    category: 'work',
    cost: { copper: 10, fatigue: 10 },
    effects: { mood: 3 },
    targetNeeds: ['mood'],
    conditions: { profession: ['merchant'], minCopper: 10, atLocation: ['east_market', 'dock'] },
    narrative: (ctx) => `${ctx.npcName}去码头看了新到的货，挑挑拣拣，花十文钱进了一批布匹。`,
  },
  {
    id: 'farm_work',
    name: '务农',
    icon: '🌾',
    category: 'work',
    cost: { fatigue: 25, hunger: -10 },
    effects: { copper: 8, mood: 3 },
    targetNeeds: ['hunger'],
    conditions: { profession: ['farmer'], atLocation: ['east_farm', 'south_farm'] },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}在田里忙碌了一整个时辰。${weatherDesc(ctx.weather)}，${ctx.npcName}擦了擦汗，看着庄稼长势不错，心里踏实了些。`,
  },
  {
    id: 'patrol',
    name: '巡逻',
    icon: '🛡️',
    category: 'work',
    cost: { fatigue: 10 },
    effects: { mood: 3, safety: 5 },
    targetNeeds: ['safety', 'mood'],
    conditions: { profession: ['guard'], timeOfDay: 'day' },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}在街上巡逻，目光扫视着来往行人。${timeDesc(ctx.shichen)}，一切看似太平。`,
  },
  {
    id: 'treat_patient',
    name: '看诊',
    icon: '💊',
    category: 'work',
    cost: { fatigue: 15 },
    effects: { copper: 15, mood: 8 },
    targetNeeds: ['mood'],
    conditions: { profession: ['doctor'], atLocation: ['center_street', 'east_market'] },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}给病人把脉问诊，开了一副药方。病人千恩万谢地去了。`,
  },
  {
    id: 'steal',
    name: '偷窃',
    icon: '🤫',
    category: 'work',
    cost: { fatigue: 10 },
    effects: { copper: 15, mood: 5, safety: -10 },
    targetNeeds: ['hunger'],
    conditions: { profession: ['rogue'], atLocation: ['east_market', 'center_street'] },
    narrative: (ctx) => `${ctx.npcName}在人群中${profAdverb(ctx.profession)}挤来挤去，趁着人不注意，顺走了一个钱袋。`,
  },
  {
    id: 'carry_cargo',
    name: '搬货',
    icon: '💪',
    category: 'work',
    cost: { fatigue: 20, hunger: -5 },
    effects: { copper: 6 },
    targetNeeds: ['hunger'],
    conditions: { profession: ['laborer'], atLocation: ['dock'] },
    narrative: (ctx) => `${ctx.npcName}在码头${profAdverb(ctx.profession)}扛了几包货，累得满头大汗，赚了六文辛苦钱。`,
  },
  {
    id: 'hunt',
    name: '打猎',
    icon: '🏹',
    category: 'work',
    cost: { fatigue: 25 },
    effects: { hunger: 15 },
    targetNeeds: ['hunger'],
    conditions: { profession: ['hunter'], atLocation: ['shallow_mountain', 'deep_mountain'] },
    narrative: (ctx) => `${ctx.npcName}扛着弓进了山林。${weatherDesc(ctx.weather)}，${profAdverb(ctx.profession)}在溪边设了陷阱，运气不错，猎到了一只野兔。`,
  },
  {
    id: 'forge',
    name: '锻造',
    icon: '🔨',
    category: 'work',
    cost: { fatigue: 20, copper: -5 },
    effects: { mood: 8 },
    targetNeeds: ['mood'],
    conditions: { profession: ['blacksmith'], atLocation: ['center_street', 'east_market'] },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}在铁匠铺里锤打铁器，火花四溅。忙了一阵，打出了一把还不错的菜刀。`,
  },
  {
    id: 'teach',
    name: '授课',
    icon: '📚',
    category: 'work',
    cost: { fatigue: 15 },
    effects: { copper: 10, social: 5 },
    targetNeeds: ['social', 'mood'],
    conditions: { profession: ['teacher'], atLocation: ['center_street', 'government'] },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}给学生讲课，从《论语》讲到《孟子》，学生们听得津津有味。`,
  },
  {
    id: 'bargain',
    name: '讨价还价',
    icon: '🤝',
    category: 'work',
    cost: { fatigue: 5 },
    effects: { copper: 10, mood: 3 },
    targetNeeds: ['mood'],
    conditions: { profession: ['merchant'], atLocation: ['east_market', 'dock'] },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}和客商谈了一笔买卖，唇枪舌剑半个时辰，总算谈妥了价钱。`,
  },
  {
    id: 'gather_herbs',
    name: '采药',
    icon: '🌿',
    category: 'work',
    cost: { fatigue: 20 },
    effects: { health: 5, mood: 3 },
    targetNeeds: ['health', 'mood'],
    conditions: { profession: ['doctor'], atLocation: ['shallow_mountain'] },
    narrative: (ctx) => `${ctx.npcName}背着药篓上山采药去了。${weatherDesc(ctx.weather)}，在溪边发现了几株上好的金银花。`,
  },
  {
    id: 'set_trap',
    name: '设陷阱',
    icon: '🪤',
    category: 'work',
    cost: { fatigue: 10 },
    effects: { mood: 3 },
    targetNeeds: ['mood'],
    conditions: { profession: ['hunter'], atLocation: ['shallow_mountain', 'deep_mountain'] },
    narrative: (ctx) => `${ctx.npcName}在山路上布了几个套子，又在树丛间设了绊绳，等着猎物上门。`,
  },
  {
    id: 'inspect',
    name: '盘查',
    icon: '🔍',
    category: 'work',
    cost: { fatigue: 8 },
    effects: { safety: 8, mood: 3 },
    targetNeeds: ['safety'],
    conditions: { profession: ['guard'], atLocation: ['center_street', 'dock'] },
    narrative: (ctx) => `${ctx.npcName}在城门口盘查过往行人，${profAdverb(ctx.profession)}检查了几个可疑人的包袱。`,
  },

  // ──── 社交类 (Social) ────
  {
    id: 'chat',
    name: '闲聊',
    icon: '💬',
    category: 'social',
    cost: { fatigue: -3 },
    effects: { mood: 5, social: 10 },
    targetNeeds: ['social', 'mood'],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}在街上碰到熟人，两人站在路边${ctx.targetName ? `聊起了${ctx.targetName}` : '家长里短聊了一通'}，心情好了不少。`,
  },
  {
    id: 'drink',
    name: '喝茶',
    icon: '🍵',
    category: 'social',
    cost: { copper: 3, fatigue: -5 },
    effects: { mood: 12, social: 5 },
    targetNeeds: ['mood', 'social'],
    conditions: { minCopper: 3, atLocation: ['center_street', 'east_market'] },
    narrative: (ctx) => `${timeDesc(ctx.shichen)}，${ctx.npcName}去茶馆叫了一壶碧螺春，悠闲地品着。听旁边的人说东道西，倒也解了闷。`,
  },
  {
    id: 'visit_friend',
    name: '访友',
    icon: '🚶',
    category: 'social',
    cost: { fatigue: -5 },
    effects: { mood: 8, social: 15 },
    targetNeeds: ['social', 'mood'],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}去老朋友家串门，两人坐在院子里${weatherDesc(ctx.weather)}，聊了半日。临走时朋友还硬塞了几个炊饼。`,
  },
  {
    id: 'family_dinner',
    name: '家宴',
    icon: '🍽️',
    category: 'social',
    cost: { copper: 10 },
    effects: { mood: 15, social: 20 },
    targetNeeds: ['social', 'mood'],
    conditions: { minCopper: 10 },
    narrative: (ctx) => `${ctx.npcName}在家里摆了一桌饭菜，请了几个亲人来吃。觥筹交错间，笑声不断。`,
  },
  {
    id: 'ask_rumor',
    name: '打听消息',
    icon: '👂',
    category: 'social',
    cost: { fatigue: -2 },
    effects: { social: 5, mood: 3 },
    targetNeeds: ['social'],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}在茶摊边坐下，竖起耳朵听旁人议论。听说粮价又要涨了，也不知道真假。`,
  },

  // ──── 组织类 (Faction) ────
  {
    id: 'faction_manage',
    name: '管理组织',
    icon: '📋',
    category: 'faction',
    cost: { fatigue: 10 },
    effects: { mood: 5 },
    targetNeeds: ['mood'],
    conditions: { factionRole: ['leader'] },
    narrative: (ctx) => `${ctx.npcName}${profAdverb(ctx.profession)}处理组织事务，清点账目、安排人手，忙了整整一个时辰。`,
  },
  {
    id: 'faction_salary',
    name: '领俸禄',
    icon: '💰',
    category: 'faction',
    cost: {},
    effects: { copper: 15, mood: 5 },
    targetNeeds: ['hunger', 'mood'],
    conditions: { factionRole: ['leader', 'member'] },
    narrative: (ctx) => `${ctx.npcName}去领了这个月的份子钱，十五文，虽然不多，但好歹够吃饭了。`,
  },
  {
    id: 'faction_meeting',
    name: '开会',
    icon: '🏛️',
    category: 'faction',
    cost: { fatigue: 8 },
    effects: { mood: 5, social: 10 },
    targetNeeds: ['social', 'mood'],
    conditions: { factionRole: ['leader'] },
    narrative: (ctx) => `${ctx.npcName}召集了几个信得过的人，关起门来密议了一番。具体说了什么，外人不得而知。`,
  },
  {
    id: 'faction_patrol',
    name: '组织巡逻',
    icon: '⚔️',
    category: 'faction',
    cost: { fatigue: 10 },
    effects: { safety: 5, mood: 3 },
    targetNeeds: ['safety'],
    conditions: { factionRole: ['leader', 'member'] },
    narrative: (ctx) => `${ctx.npcName}跟着兄弟们在势力范围内巡视了一圈，确认没有外人来找茬。`,
  },

  // ──── 休闲类 (Leisure) ────
  {
    id: 'temple_pray',
    name: '拜佛',
    icon: '🙏',
    category: 'leisure',
    cost: { copper: 2 },
    effects: { mood: 8, safety: 5 },
    targetNeeds: ['mood', 'safety'],
    conditions: { minCopper: 2, atLocation: ['temple'] },
    narrative: (ctx) => `${ctx.npcName}去大相国寺拜了拜佛祖，捐了二文香火钱。在佛前跪了半炷香，心中安宁了不少。`,
  },
  {
    id: 'gamble',
    name: '赌博',
    icon: '🎲',
    category: 'leisure',
    cost: { copper: 20 },
    effects: { mood: -10, safety: -5 },
    targetNeeds: ['mood'],
    conditions: { minCopper: 20, atLocation: ['center_street'] },
    narrative: (ctx) => {
      const won = Math.random() > 0.5;
      return won
        ? `${ctx.npcName}在后巷和人推牌九，运气不错，赢了四十文！笑得合不拢嘴。`
        : `${ctx.npcName}在后巷和人推牌九，手气差得很，输了二十文。垂头丧气地走了。`;
    },
  },
  {
    id: 'study',
    name: '读书',
    icon: '📖',
    category: 'leisure',
    cost: { fatigue: 10 },
    effects: { mood: 5 },
    targetNeeds: ['mood'],
    conditions: { atLocation: ['residential_north', 'residential_south', 'government'] },
    narrative: (ctx) => `${ctx.npcName}在家中翻出一卷旧书，就着油灯读了起来。读到精彩处，不觉拍案叫好。`,
  },
  {
    id: 'stroll',
    name: '散步',
    icon: '🌅',
    category: 'leisure',
    cost: {},
    effects: { mood: 5, fatigue: -5 },
    targetNeeds: ['mood'],
    conditions: {},
    narrative: (ctx) => `${timeDesc(ctx.shichen)}，${weatherDesc(ctx.weather)}。${ctx.npcName}沿着河边慢慢走着，看水面上波光粼粼，心中舒坦。`,
  },
  {
    id: 'listen_story',
    name: '听书',
    icon: '📣',
    category: 'leisure',
    cost: { copper: 2 },
    effects: { mood: 10, social: 3 },
    targetNeeds: ['mood'],
    conditions: { minCopper: 2, atLocation: ['center_street'] },
    narrative: (ctx) => `${ctx.npcName}去茶馆听了会儿说书，今天讲的是《水浒传》，听到武松打虎那段，满堂喝彩。`,
  },

  // ──── 移动类 (Move) — 位置转移 ────
  {
    id: 'go_home',
    name: '回家',
    icon: '🏠',
    category: 'move',
    cost: { fatigue: -3 },
    effects: { safety: 10 },
    targetNeeds: ['safety'],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}沿着小巷走回家去。${timeDesc(ctx.shichen)}，路上行人渐少。`,
  },
  {
    id: 'go_market',
    name: '去市集',
    icon: '🏪',
    category: 'move',
    cost: { fatigue: -3 },
    effects: {},
    targetNeeds: [],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}朝东市走去，远远就能听到叫卖声。`,
  },
  {
    id: 'go_teahouse',
    name: '去茶馆',
    icon: '🍵',
    category: 'move',
    cost: { fatigue: -2 },
    effects: {},
    targetNeeds: [],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}信步往茶馆走去。`,
  },
  {
    id: 'go_dock',
    name: '去码头',
    icon: '⚓',
    category: 'move',
    cost: { fatigue: -4 },
    effects: {},
    targetNeeds: [],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}往汴河码头方向走去。`,
  },
  {
    id: 'go_farm',
    name: '去农田',
    icon: '🌾',
    category: 'move',
    cost: { fatigue: -4 },
    effects: {},
    targetNeeds: [],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}出了城，朝农田方向走去。`,
  },
  {
    id: 'go_mountain',
    name: '去山林',
    icon: '⛰️',
    category: 'move',
    cost: { fatigue: -5 },
    effects: {},
    targetNeeds: [],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}沿着山道往上走，${weatherDesc(ctx.weather)}，山林间鸟鸣不绝。`,
  },
  {
    id: 'go_temple',
    name: '去寺庙',
    icon: '🏯',
    category: 'move',
    cost: { fatigue: -3 },
    effects: {},
    targetNeeds: [],
    conditions: {},
    narrative: (ctx) => `${ctx.npcName}往大相国寺方向走去。`,
  },
];

// 行动查找索引（按 ID）
const actionById = new Map<string, NPCAction>();
for (const a of ALL_ACTIONS) actionById.set(a.id, a);

/** 根据 ID 获取行动 */
export function getAction(id: string): NPCAction | undefined {
  return actionById.get(id);
}

/** 获取所有行动 */
export function getAllActions(): NPCAction[] {
  return ALL_ACTIONS;
}

/** 按职业筛选可用行动 */
export function getActionsForProfession(profession: string): NPCAction[] {
  return ALL_ACTIONS.filter(a => {
    // 无职业限制的行动，所有人可用
    if (!a.conditions.profession || a.conditions.profession.length === 0) return true;
    return a.conditions.profession.includes(profession);
  });
}
