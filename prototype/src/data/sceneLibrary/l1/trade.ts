// ════════════════════════════════════════
// L1 交易演出 (10个)
// 市场买卖、以物易物、商铺经营
// ════════════════════════════════════════

import { L1Scene } from '../../../ai/sceneLibrary/types';

const ALL_PROFESSIONS = ['merchant', 'farmer', 'guard', 'doctor', 'hunter', 'blacksmith', 'chef', 'teacher', 'laborer', 'rogue'];

export const L1_TRADE_SCENES: L1Scene[] = [
  {
    id: 'l1_market_barter',
    name: '以物易物',
    category: 'trade',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'safety',
      actorTraits: ['精明', '合作'],
      actorForbiddenTraits: ['暴躁'],
    },
    outcome: {
      narrative: '{count}个{professionName}在{location}以物易物，一篮鸡蛋换两尺布，半袋米换一壶酒，各取所需皆大欢喜。',
      avgEffects: { mood: 4, copper: 3 },
      atmosphereEffect: '交易',
    },
    weight: 7,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_grain_market_rush',
    name: '粮市抢购',
    category: 'trade',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'hunger',
      needThreshold: 35,
      actorForbiddenTraits: ['从容'],
      dominantMood: 'anxious',
    },
    outcome: {
      narrative: '{count}个{professionName}涌向粮市抢购粮食，听说米价要涨的消息传遍了大街小巷，人人提着麻袋往回扛。',
      avgEffects: { hunger: 15, copper: -12, mood: -2 },
      atmosphereEffect: '紧张',
    },
    weight: 6,
    cooldownTicks: 5,
    maxPerTick: 3,
  },
  {
    id: 'l1_merchant_caravan',
    name: '商队卸货',
    category: 'trade',
    conditions: {
      profession: ['merchant', 'laborer'],
      dominantNeed: 'safety',
      timeOfDay: 'dawn',
      actorTraits: ['勤劳'],
      requireNearbyProfession: ['merchant'],
      requireFactionType: ['guild'],
    },
    outcome: {
      narrative: '{count}个商贩和苦力在卸货，骆驼和骡车停在仓库门口，绸缎茶叶香料一箱箱往下搬。',
      avgEffects: { fatigue: 8, copper: 8 },
      atmosphereEffect: '忙碌',
    },
    weight: 6,
    cooldownTicks: 4,
    maxPerTick: 3,
  },
  {
    id: 'l1_blacksmith_wares',
    name: '铁器开卖',
    category: 'trade',
    conditions: {
      profession: ['blacksmith', 'merchant'],
      dominantNeed: 'safety',
      actorTraits: ['精明', '踏实'],
      requireNearbyProfession: ['farmer', 'guard'],
    },
    outcome: {
      narrative: '{count}个铁匠和商贩摆出了新打的铁器，锄头镰刀菜刀排了一排，锃亮的刃口在日头下闪光。',
      avgEffects: { copper: 10, mood: 4 },
      atmosphereEffect: '琳琅满目',
    },
    weight: 6,
    cooldownTicks: 4,
    maxPerTick: 3,
  },
  {
    id: 'l1_herbal_trade',
    name: '药材生意',
    category: 'trade',
    conditions: {
      profession: ['doctor', 'hunter'],
      dominantNeed: 'safety',
      actorTraits: ['精明', '细心'],
      requireNearbyProfession: ['doctor'],
    },
    outcome: {
      narrative: '{count}个大夫和猎人在做药材生意，鹿茸麝香虫草摆在柜台上，品相好的被一抢而空。',
      avgEffects: { copper: 12, mood: 5 },
      atmosphereEffect: '药香',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 2,
  },
  {
    id: 'l1_stall_closing',
    name: '收摊清仓',
    category: 'trade',
    conditions: {
      profession: ['merchant', 'chef'],
      dominantNeed: 'fatigue',
      timeOfDay: 'dusk',
      actorTraits: ['精明'],
      actorForbiddenTraits: ['懒惰'],
      requireNearbyProfession: ['farmer'],
    },
    outcome: {
      narrative: '{count}个商贩和厨子在日落前收摊清仓，剩下的菜和果子便宜处理，街坊们闻讯赶来捡漏。',
      avgEffects: { fatigue: -5, copper: 4, mood: 3 },
      atmosphereEffect: '收尾',
    },
    weight: 6,
    cooldownTicks: 3,
    maxPerTick: 3,
  },
  {
    id: 'l1_silk_trading',
    name: '丝绸买卖',
    category: 'trade',
    conditions: {
      profession: ['merchant'],
      dominantNeed: 'safety',
      actorTraits: ['精明', '口才好'],
      actorForbiddenTraits: ['暴躁'],
      requireFactionType: ['guild'],
    },
    outcome: {
      narrative: '{count}个商贩在做丝绸买卖，锦缎铺展开来流光溢彩，买家用指尖摩挲着细细辨别质地。',
      avgEffects: { copper: 15, mood: 5 },
      atmosphereEffect: '华贵',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_farmer_vegetable_stand',
    name: '农夫卖菜',
    category: 'trade',
    conditions: {
      profession: ['farmer'],
      dominantNeed: 'safety',
      timeOfDay: 'dawn',
      actorTraits: ['勤劳'],
      requireNearbyProfession: ['merchant'],
    },
    outcome: {
      narrative: '{count}个农夫在路边摆摊卖菜，新鲜的瓜果蔬菜还带着晨露，赶早市的人围上来挑挑拣拣。',
      avgEffects: { copper: 6, mood: 3 },
      atmosphereEffect: '清新',
    },
    weight: 7,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_pawn_crowd',
    name: '当铺排队',
    category: 'trade',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'hunger',
      needThreshold: 30,
      actorForbiddenTraits: ['骄傲'],
      dominantMood: 'sad',
    },
    outcome: {
      narrative: '{count}个{professionName}在当铺门口排着队，手里攥着首饰旧衣铜盆银镯，换几个铜板好撑过这段日子。',
      avgEffects: { copper: 8, mood: -8 },
      atmosphereEffect: '拮据',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_hunter_pelt_trade',
    name: '皮毛交易',
    category: 'trade',
    conditions: {
      profession: ['hunter', 'merchant'],
      dominantNeed: 'safety',
      actorTraits: ['精明', '勇敢'],
      requireNearbyProfession: ['merchant'],
    },
    outcome: {
      narrative: '{count}个猎人和商贩在做皮毛交易，狐皮鹿皮兔皮挂了一排，猎人比划着讲猎获的过程，商贩精明地估着价。',
      avgEffects: { copper: 10, mood: 3 },
      atmosphereEffect: '野趣',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 2,
  },
];
