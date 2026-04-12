// === 组织主动行动数据 ===
// 12个组织 × 按类型分组的行动池

export interface FactionAction {
  id: string;
  name: string;
  factionType: string[];
  conditions: {
    minTreasury?: number;
    maxTreasury?: number;
    minMood?: number;
    maxMood?: number;
    minInfluence?: number;
    maxInfluence?: number;
    minMembers?: number;
    season?: string[];
  };
  effects: {
    treasuryChange?: number;
    influenceChange?: number;
    moodChange?: number;
    memberMoodEffect?: number;
    memberCopperEffect?: number;
    territorySafetyEffect?: number;
    priceEffect?: { good: string; multiplier: number };
    rivalRelationEffect?: number; // 对敌对势力关系的影响
  };
  narrative: string;
  weight: number;
  cooldownTicks: number;
}

export const FACTION_ACTIONS: FactionAction[] = [
  // ═══ government ═══
  {
    id: 'gov_tax_collect',
    name: '征税',
    factionType: ['government'],
    conditions: { maxTreasury: 120000 },
    effects: { treasuryChange: 500, influenceChange: -1, memberMoodEffect: -2, memberCopperEffect: -3 },
    narrative: '{factionName}下达征税令，辖区内商户纷纷缴纳。国库增加{treasuryChange}铜钱，但民间略有怨言。',
    weight: 3,
    cooldownTicks: 15,
  },
  {
    id: 'gov_patrol',
    name: '巡查',
    factionType: ['government'],
    conditions: {},
    effects: { influenceChange: 1, territorySafetyEffect: 5, memberMoodEffect: 1 },
    narrative: '{factionName}派出差役在辖区巡查，街面秩序井然，百姓安心。',
    weight: 5,
    cooldownTicks: 8,
  },
  {
    id: 'gov_announce',
    name: '发布告示',
    factionType: ['government'],
    conditions: { minInfluence: 50 },
    effects: { moodChange: 2, influenceChange: 1, memberMoodEffect: 1 },
    narrative: '{factionName}在城门张贴告示，宣读新政。路过百姓驻足围观，议论纷纷。',
    weight: 4,
    cooldownTicks: 12,
  },
  {
    id: 'gov_emergency_fund',
    name: '赈灾拨款',
    factionType: ['government'],
    conditions: { minTreasury: 30000, minMembers: 3 },
    effects: { treasuryChange: -2000, moodChange: 5, influenceChange: 2, memberCopperEffect: 5 },
    narrative: '{factionName}拨出专款赈济灾民，百姓感恩戴德，称赞官府仁政。',
    weight: 2,
    cooldownTicks: 25,
  },
  {
    id: 'gov_trade_inspect',
    name: '稽查商路',
    factionType: ['government'],
    conditions: { minInfluence: 60 },
    effects: { treasuryChange: 200, influenceChange: 1, memberMoodEffect: -1 },
    narrative: '{factionName}派遣官员巡查商路，查获一批走私货物，充公入库。',
    weight: 3,
    cooldownTicks: 10,
  },

  // ═══ military ═══
  {
    id: 'mil_patrol',
    name: '巡逻',
    factionType: ['military'],
    conditions: {},
    effects: { territorySafetyEffect: 8, memberMoodEffect: -1, influenceChange: 1 },
    narrative: '禁军将士在城中巡逻，铠甲铿锵。街道上宵小之辈纷纷避让。',
    weight: 6,
    cooldownTicks: 5,
  },
  {
    id: 'mil_drill',
    name: '操练',
    factionType: ['military'],
    conditions: {},
    effects: { influenceChange: 2, memberMoodEffect: -3 },
    narrative: '禁军在校场操练，战鼓声震四方。士兵们汗流浃背，但纪律严明。',
    weight: 4,
    cooldownTicks: 8,
  },
  {
    id: 'mil_recruit',
    name: '招募新兵',
    factionType: ['military'],
    conditions: { minTreasury: 15000 },
    effects: { treasuryChange: -1000, influenceChange: 1, memberMoodEffect: 2 },
    narrative: '禁军发布招募令，城中年青人踊跃应征。军营里增添了不少新面孔。',
    weight: 2,
    cooldownTicks: 20,
  },
  {
    id: 'mil_guard_duty',
    name: '守夜',
    factionType: ['military'],
    conditions: { minMembers: 3 },
    effects: { territorySafetyEffect: 10, memberMoodEffect: -2, influenceChange: 1 },
    narrative: '夜幕降临，禁军加强城门守卫。火把映照下，士兵们目光如炬。',
    weight: 4,
    cooldownTicks: 6,
  },

  // ═══ merchant ═══
  {
    id: 'mer_price_raise',
    name: '联合抬价',
    factionType: ['merchant'],
    conditions: { minInfluence: 40, minTreasury: 5000 },
    effects: { treasuryChange: 800, influenceChange: -1, priceEffect: { good: 'cloth', multiplier: 1.15 }, memberCopperEffect: 5 },
    narrative: '{factionName}召集商户密议，决定统一调高布匹售价。市面物价应声而涨。',
    weight: 4,
    cooldownTicks: 15,
  },
  {
    id: 'mer_restock',
    name: '大宗进货',
    factionType: ['merchant'],
    conditions: { minTreasury: 8000 },
    effects: { treasuryChange: -1500, memberCopperEffect: 8, memberMoodEffect: 2 },
    narrative: '{factionName}从外地采购大批货物，仓库堆满了新到的商品。商户们摩拳擦掌准备大卖。',
    weight: 5,
    cooldownTicks: 10,
  },
  {
    id: 'mer_guild_meeting',
    name: '行会聚议',
    factionType: ['merchant'],
    conditions: {},
    effects: { moodChange: 2, influenceChange: 1, memberMoodEffect: 3 },
    narrative: '{factionName}在茶楼举行季度聚议，觥筹交错间，商人们交换着最新的行情消息。',
    weight: 4,
    cooldownTicks: 12,
  },
  {
    id: 'mer_charity',
    name: '施善积德',
    factionType: ['merchant'],
    conditions: { minTreasury: 10000, minMood: 30 },
    effects: { treasuryChange: -500, influenceChange: 2, moodChange: 3, memberMoodEffect: 2 },
    narrative: '{factionName}出资修缮街道路面，并在路口设茶棚供路人歇脚。百姓称赞商会仗义。',
    weight: 2,
    cooldownTicks: 18,
  },
  {
    id: 'mer_herb_trade',
    name: '药材专卖',
    factionType: ['merchant'],
    conditions: { minInfluence: 30 },
    effects: { treasuryChange: 600, priceEffect: { good: 'herbs', multiplier: 1.1 }, memberCopperEffect: 3 },
    narrative: '药材行会控制了本季药材出货量，药房价格小幅上涨。',
    weight: 3,
    cooldownTicks: 12,
  },

  // ═══ religion ═══
  {
    id: 'rel_temple_fair',
    name: '举办庙会',
    factionType: ['religion'],
    conditions: { minTreasury: 5000 },
    effects: { treasuryChange: 1000, moodChange: 3, memberMoodEffect: 3, influenceChange: 1 },
    narrative: '大相国寺举办盛大庙会，香火鼎盛。善男信女络绎不绝，寺前热闹非凡。',
    weight: 5,
    cooldownTicks: 10,
  },
  {
    id: 'rel_alms',
    name: '施粥济贫',
    factionType: ['religion'],
    conditions: { minTreasury: 3000 },
    effects: { treasuryChange: -800, moodChange: 4, influenceChange: 2, memberMoodEffect: 2 },
    narrative: '大相国寺在山门前设粥棚，施粥济贫。贫苦百姓排队领取，感恩不已。',
    weight: 4,
    cooldownTicks: 15,
  },
  {
    id: 'rel_chanting',
    name: '诵经祈福',
    factionType: ['religion'],
    conditions: {},
    effects: { moodChange: 1, influenceChange: 1, memberMoodEffect: 2 },
    narrative: '大相国寺僧众齐聚大殿诵经祈福，钟声悠悠传遍四方，信众虔诚跪拜。',
    weight: 5,
    cooldownTicks: 7,
  },

  // ═══ underground ═══
  {
    id: 'und_protection',
    name: '收保护费',
    factionType: ['underground'],
    conditions: { minInfluence: 20 },
    effects: { treasuryChange: 400, influenceChange: -1, memberCopperEffect: 3, memberMoodEffect: 1 },
    narrative: '{factionName}在辖区内收取保护费，商户们虽然不情愿，但也不敢不从。',
    weight: 5,
    cooldownTicks: 8,
  },
  {
    id: 'und_smuggle',
    name: '暗中交易',
    factionType: ['underground'],
    conditions: { minMembers: 2 },
    effects: { treasuryChange: 600, influenceChange: -1, priceEffect: { good: 'cargo', multiplier: 0.9 }, memberCopperEffect: 5 },
    narrative: '{factionName}暗中运了一批廉价货物入市，冲击了正规商路的价格。',
    weight: 3,
    cooldownTicks: 12,
  },
  {
    id: 'und_gamble',
    name: '开设赌局',
    factionType: ['underground'],
    conditions: { minTreasury: 2000 },
    effects: { treasuryChange: 300, memberCopperEffect: 2, memberMoodEffect: 1 },
    narrative: '{factionName}在后巷开设赌局，引来不少赌客。铜钱叮当作响，赢者欢喜输者愁。',
    weight: 3,
    cooldownTicks: 10,
  },
  {
    id: 'und_beg_org',
    name: '有组织乞讨',
    factionType: ['underground'],
    conditions: { maxTreasury: 5000 },
    effects: { treasuryChange: 200, influenceChange: 1, memberMoodEffect: 1 },
    narrative: '丐帮分舵组织弟子分头在繁华地段乞讨，收入虽微薄但积少成多。',
    weight: 4,
    cooldownTicks: 6,
  },
  {
    id: 'und_info_broker',
    name: '贩卖情报',
    factionType: ['underground'],
    conditions: { minInfluence: 25, minMembers: 3 },
    effects: { treasuryChange: 300, influenceChange: 1, memberCopperEffect: 2 },
    narrative: '{factionName}的眼线遍布城中，将收集到的消息整理后高价卖给有需要的人。',
    weight: 3,
    cooldownTicks: 10,
  },

  // ═══ scholar ═══
  {
    id: 'sch_lecture',
    name: '公开讲学',
    factionType: ['scholar'],
    conditions: {},
    effects: { influenceChange: 2, moodChange: 2, memberMoodEffect: 3 },
    narrative: '太学博士在学府公开讲学，引经据典，学子们听得如痴如醉。',
    weight: 5,
    cooldownTicks: 8,
  },
  {
    id: 'sch_compile',
    name: '编撰典籍',
    factionType: ['scholar'],
    conditions: { minTreasury: 3000 },
    effects: { treasuryChange: -500, influenceChange: 3, memberMoodEffect: 2 },
    narrative: '太学组织学者编撰新典籍，笔墨纸砚耗费不少，但学术声望大增。',
    weight: 3,
    cooldownTicks: 15,
  },
  {
    id: 'sch_exam',
    name: '科举选拔',
    factionType: ['scholar'],
    conditions: { minInfluence: 40 },
    effects: { influenceChange: 2, moodChange: 3, treasuryChange: 200, memberCopperEffect: 3 },
    narrative: '太学主持小试，考察学子才学。成绩优异者获得奖赏，众人艳羡不已。',
    weight: 3,
    cooldownTicks: 18,
  },
  {
    id: 'sch_advice',
    name: '上书建言',
    factionType: ['scholar'],
    conditions: { minInfluence: 50 },
    effects: { influenceChange: 1, moodChange: 1, memberMoodEffect: 2 },
    narrative: '太学名儒联名上书，就民生经济提出建言。朝中重臣传阅后颇为重视。',
    weight: 2,
    cooldownTicks: 20,
  },
];

// 行动冷却追踪
const factionCooldowns = new Map<string, number>(); // actionId → lastTick

export function getAvailableFactionActions(
  factionType: string,
  faction: { treasury: number; mood: number; influence: number; members: number[] },
  season: string,
  currentTick: number,
): FactionAction[] {
  return FACTION_ACTIONS.filter(a => {
    if (!a.factionType.includes(factionType)) return false;
    // 冷却检查
    const lastUse = factionCooldowns.get(a.id);
    if (lastUse !== undefined && currentTick - lastUse < a.cooldownTicks) return false;
    // 条件检查
    const c = a.conditions;
    if (c.minTreasury !== undefined && faction.treasury < c.minTreasury) return false;
    if (c.maxTreasury !== undefined && faction.treasury > c.maxTreasury) return false;
    if (c.minMood !== undefined && faction.mood < c.minMood) return false;
    if (c.maxMood !== undefined && faction.mood > c.maxMood) return false;
    if (c.minInfluence !== undefined && faction.influence < c.minInfluence) return false;
    if (c.maxInfluence !== undefined && faction.influence > c.maxInfluence) return false;
    if (c.minMembers !== undefined && faction.members.length < c.minMembers) return false;
    if (c.season && !c.season.includes(season)) return false;
    return true;
  });
}

export function markFactionActionUsed(actionId: string, tick: number): void {
  factionCooldowns.set(actionId, tick);
}

export function weightedRandomSelect<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}
