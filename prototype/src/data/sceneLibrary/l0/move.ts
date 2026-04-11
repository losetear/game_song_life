// === L0 演出库 — 移动 (move) ===
//
// 15 个场景: 3 个迁移 + 12 个新增

import { L0Scene, L0SceneCondition } from '../../../ai/sceneLibrary/types';

const S: L0SceneCondition = { actorTraits: [], actorForbiddenTraits: [], targetRequired: false };

export const MOVE_SCENES: L0Scene[] = [
  // ════════════════════════════════════════
  // 迁移场景 (3)
  // ════════════════════════════════════════

  {
    id: 'm_go_home_rest',
    name: '回家歇息',
    description: '夜深了，拖着疲惫的身子往家走。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}拖着疲惫的身子往家走。街上的灯火次第熄灭，夜风吹得脊背发凉。推开家门的那一刻，终于松了口气。这世上再苦，还有个窝。',
      effects: { fatigue: 20, mood: 3 },
    },
    weight: 5,
    cooldownTicks: 3,
    tags: ['move', 'home', 'night', 'rest'],
  },
  {
    id: 'm_night_market',
    name: '逛夜市',
    description: '好奇贪吃之人，夜幕降临后去夜市闲逛。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      actorTraits: ['好奇', '贪吃'],
      actorForbiddenTraits: [],
      targetRequired: false,
      timeOfDay: 'night',
      location: ['east_market', 'center_street'],
    },
    success: {
      narrative: '{npcName}混在夜市的人群里，左边是卖糖葫芦的，右边是变戏法的。灯火辉煌，热闹得像过年。买了串糖葫芦，边走边吃，甜到心里。',
      effects: { mood: 10, hunger: 5, copper: -3 },
    },
    weight: 5,
    cooldownTicks: 4,
    tags: ['move', 'night_market', 'exploration'],
  },
  {
    id: 'm_visit_friend',
    name: '拜访友人',
    description: '提着点心去朋友家串门。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      actorTraits: ['健谈', '善良'],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetRelationType: 'friend',
    },
    success: {
      narrative: '{npcName}提着一包点心，拐进了{targetName}住的那条巷子。门一开，屋里飘出茶香。两人坐下，从家长里短聊到天下大事，不知日影已过三竿。',
      effects: { social: 12, mood: 5, copper: -3 },
      targetEffects: { social: 8, mood: 5 },
      relationChange: 3,
    },
    weight: 5,
    cooldownTicks: 4,
    tags: ['move', 'visit', 'friendship'],
  },

  // ════════════════════════════════════════
  // 新增场景 (12)
  // ════════════════════════════════════════

  {
    id: 'm_rush_shelter',
    name: '冒雨奔逃',
    description: '暴雨倾盆，赶紧找个地方躲雨。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      weather: ['暴雨', '大暴雨'],
    },
    success: {
      narrative: '豆大的雨点劈头盖脸砸下来。{npcName}抱着头一路狂奔，鞋里灌满了水，衣裳湿得贴在身上。冲进一处屋檐下，喘了好半天气。"这鬼天气！"',
      effects: { mood: -5, fatigue: -8, health: -3 },
    },
    weight: 8,
    cooldownTicks: 2,
    priority: 8,
    tags: ['move', 'rain', 'shelter', 'urgent'],
  },
  {
    id: 'm_wander_alley',
    name: '夜巷游荡',
    description: '好奇之人夜里钻进小巷，看看有什么新鲜事。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      actorTraits: ['好奇'],
      actorForbiddenTraits: [],
      targetRequired: false,
      timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}信步拐进一条小巷，月光只照得到半边墙。远处有猫叫，近处有酒香。深更半夜的，巷子里别有一番天地。脚步声在石板路上回荡。',
      effects: { mood: 5, safety: -3 },
    },
    weight: 4,
    cooldownTicks: 4,
    tags: ['move', 'alley', 'night', 'exploration'],
  },
  {
    id: 'm_hike_mountain',
    name: '登山远眺',
    description: '勇敢之人往浅山上攀一段，看远处风景。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      actorTraits: ['勇敢'],
      actorForbiddenTraits: [],
      targetRequired: false,
      location: ['shallow_mountain', 'mountain_path'],
    },
    success: {
      narrative: '{npcName}沿着山道一路往上。越走越高，树木渐渐稀疏，视野豁然开朗。远处城池如棋盘，河流如银线。风从四面八方吹来，衣袂猎猎作响。',
      effects: { mood: 12, fatigue: -10 },
    },
    weight: 4,
    cooldownTicks: 6,
    tags: ['move', 'mountain', 'hiking', 'adventure'],
  },
  {
    id: 'm_riverbank_stroll',
    name: '河岸散步',
    description: '沿河边慢慢走，看船只来来往往。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      location: ['upstream', 'downstream', 'riverbank'],
    },
    success: {
      narrative: '{npcName}沿着河岸慢慢走着。河水哗哗地响，几只白鹭掠过水面。船夫撑着竹篙吆喝，岸边有人在洗衣服。走了好一段路，心里清静了不少。',
      effects: { mood: 8, fatigue: -3 },
    },
    weight: 5,
    cooldownTicks: 3,
    tags: ['move', 'river', 'stroll', 'peaceful'],
  },
  {
    id: 'm_return_injured',
    name: '带伤回家',
    description: '伤重之人勉强支撑着回到住处养伤。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      actorMinHealth: 1,
      location: ['residential'],
    },
    success: {
      narrative: '{npcName}捂着伤口，踉踉跄跄地挪回家。每走一步，伤口都火烧般地疼。推开家门，一头栽倒在床上。血渗进了褥子，但好歹是在自己家里。',
      effects: { fatigue: 10, health: -5, mood: -5 },
    },
    weight: 2,
    cooldownTicks: 5,
    priority: 9,
    tags: ['move', 'injured', 'home', 'urgent'],
  },
  {
    id: 'm_flee_danger',
    name: '仓皇逃窜',
    description: '感觉不安全，赶紧离开当前地点。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
    },
    success: {
      narrative: '{npcName}隐约觉得不对劲，后颈发凉。不敢回头，加快脚步往人多的地方走。心跳越来越快，几乎要从嗓子眼蹦出来。拐过街角，看见灯火，才长出一口气。',
      effects: { mood: -8, fatigue: -10, safety: 10 },
    },
    weight: 3,
    cooldownTicks: 4,
    priority: 7,
    tags: ['move', 'flee', 'danger', 'urgent'],
  },
  {
    id: 'm_chase_thief',
    name: '追捕贼人',
    description: '衙役发现混混形迹可疑，追上去盘查。',
    goalCategory: 'move',
    outcomeType: 'contested',
    contestedStat: { actor: 'agility', target: 'agility' },
    conditions: {
      ...S,
      actorProfession: ['guard'],
      targetRequired: true,
      targetProfession: ['rogue'],
    },
    success: {
      narrative: '{npcName}盯上了鬼鬼祟祟的{targetName}，拔腿就追。穿过两条街巷，一个飞扑把人按在了地上。"老实点！跟我回衙门！"',
      effects: { mood: 8, fatigue: -10, safety: 5 },
      targetEffects: { mood: -10, safety: -15 },
      relationChange: -10,
    },
    failure: {
      narrative: '{npcName}追了{targetName}好几条街，最后被对方翻墙跑了。气喘吁吁地停下脚步，扶着膝盖骂了一声。"跑得比兔子还快！"',
      effects: { fatigue: -10, mood: -5 },
      relationChange: -5,
    },
    weight: 3,
    cooldownTicks: 6,
    tags: ['move', 'chase', 'guard', 'duty'],
  },
  {
    id: 'm_follow_friend',
    name: '追随密友',
    description: '密友往哪走，就跟到哪。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      targetRequired: true,
      targetRelationType: 'close_friend',
    },
    success: {
      narrative: '{npcName}看见{targetName}要走，二话不说就跟了上去。"你上哪去？我也去。"{targetName}笑了笑，没说什么。两个人并肩走着，也不管去哪儿。',
      effects: { mood: 5, social: 8 },
      targetEffects: { mood: 3, social: 5 },
      relationChange: 3,
    },
    weight: 4,
    cooldownTicks: 4,
    tags: ['move', 'friendship', 'companion'],
  },
  {
    id: 'm_escort_elderly',
    name: '护送老人',
    description: '善良之人搀扶年长者同行。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      actorTraits: ['善良'],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetTraits: ['年长'],
    },
    success: {
      narrative: '{npcName}看见{targetName}步履蹒跚，赶紧上前搀住了胳膊。"老人家，我扶您走。"{targetName}感激地连连点头。两人慢慢走着，不急不慌。',
      effects: { mood: 8, social: 8, fatigue: -3 },
      targetEffects: { mood: 10 },
      relationChange: 8,
    },
    weight: 4,
    cooldownTicks: 5,
    tags: ['move', 'escort', 'kindness', 'elderly'],
  },
  {
    id: 'm_market_run',
    name: '赶早市',
    description: '商贩天不亮就赶去市集占位子。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      actorProfession: ['merchant'],
      timeOfDay: 'dawn',
      location: ['east_market', 'west_market'],
    },
    success: {
      narrative: '{npcName}天还没亮就起了身，挑着担子往市集赶。雾气蒙蒙，路上只听得到自己的脚步声。到了地方，占了最好的位子。第一缕阳光照在摊位上，生意要开张了。',
      effects: { mood: 5, fatigue: -8 },
    },
    weight: 5,
    cooldownTicks: 3,
    tags: ['move', 'market', 'merchant', 'dawn'],
  },
  {
    id: 'm_stumble_drunk',
    name: '醉步蹒跚',
    description: '暴躁之人喝多了，东倒西歪地走在街上。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      actorTraits: ['暴躁'],
      actorForbiddenTraits: [],
      actorEmotion: 'happy',
      targetRequired: false,
    },
    success: {
      narrative: '{npcName}喝得醉醺醺的，走路东倒西歪，嘴里哼着不成调的小曲。一头撞上了路边的柱子，骂骂咧咧地继续走。夜风一吹，酒劲上涌，扶着墙吐了一地。',
      effects: { mood: -3, health: -3, fatigue: -5 },
    },
    weight: 3,
    cooldownTicks: 5,
    tags: ['move', 'drunk', 'stumble'],
  },
  {
    id: 'm_snow_trudge',
    name: '踏雪而行',
    description: '冬日大雪，艰难地在雪地里跋涉。',
    goalCategory: 'move',
    outcomeType: 'certain',
    conditions: {
      ...S,
      season: ['冬'],
      weather: ['雪', '大雪'],
    },
    success: {
      narrative: '{npcName}深一脚浅一脚地走在雪地里。积雪没过了脚踝，每一步都沉重得像灌了铅。风裹着雪粒打在脸上，又冷又疼。远远看见一间亮着灯的屋子，咬着牙又走了几步。',
      effects: { fatigue: -10, mood: -5, health: -3 },
    },
    weight: 4,
    cooldownTicks: 3,
    tags: ['move', 'snow', 'winter', 'hardship'],
  },
];
