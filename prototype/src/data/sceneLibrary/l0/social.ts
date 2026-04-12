// === L0 演出库 — 社交 (Social) ===
//
// 包含：闲谈、对饮、分享消息、帮人搬东西、默默同行、
//       清晨问候、市场八卦、送小礼、请众人喝酒、掷骰子、
//       讲故事、唱曲儿、倾吐心事、介绍朋友认识、慰问不幸、
//       师徒闲谈、提议合作、闲聊天气、组织儿童游戏、
//       黄昏散步、交换消息、帮邻居干活、骰子骗局、
//       节日准备、欢迎新邻居

import type { L0Scene, L0SceneCondition } from '../../../ai/sceneLibrary/types';

const S: L0SceneCondition = { actorTraits: [], actorForbiddenTraits: [], targetRequired: false };

export const SOCIAL_SCENES: L0Scene[] = [
  // ════════════════════════════════════════
  // 迁移自旧演出库的 5 个场景
  // ════════════════════════════════════════

  {
    id: 'so_tea_chat', name: '茶楼闲谈', description: '茶楼里品茗闲聊',
    goalCategory: 'social', outcomeType: 'certain', weight: 7, cooldownTicks: 3,
    tags: ['tea', 'chat', 'social'],
    conditions: {
      ...S, actorTraits: ['健谈', '温和'], actorMinCopper: 2,
      targetRequired: true, location: ['tea_house'],
    },
    success: {
      narrative: '{npcName}在茶楼里找了个位子坐下，和旁边的{targetName}聊了起来。从天气聊到粮价，从粮价聊到八卦。茶续了三壶，话还没说完。',
      effects: { social: 15, mood: 5, copper: -2 },
      targetEffects: { social: 10, mood: 3 },
      relationChange: 3,
    },
  },
  {
    id: 'so_drink_together', name: '对饮', description: '与好友共饮',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    tags: ['drinking', 'friend', 'social'],
    conditions: {
      ...S, actorTraits: ['大方', '暴躁'], actorMinCopper: 10,
      targetRequired: true, targetRelationType: 'friend', location: ['east_market'],
    },
    success: {
      narrative: '{npcName}倒了两碗酒，推了一碗给{targetName}。"来。"碗碰碗，一饮而尽。辛辣的酒水下肚，两个人都红了脸。',
      effects: { social: 10, mood: 8, copper: -5 },
      targetEffects: { social: 8, mood: 5 },
      relationChange: 5,
    },
  },
  {
    id: 'so_share_news', name: '分享消息', description: '和朋友交换见闻',
    goalCategory: 'social', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['news', 'friend', 'social'],
    conditions: {
      ...S, actorTraits: ['健谈', '善良'],
      targetRequired: true, targetRelationType: 'friend',
    },
    success: {
      narrative: '{npcName}拉住{targetName}："你听说了吗？"两人站在路边，就着最新发生的事议论了好一阵。声音越说越大，旁人都忍不住侧目。',
      effects: { social: 12, mood: 5 },
      targetEffects: { social: 8, mood: 3 },
      relationChange: 3,
    },
  },
  {
    id: 'so_help_carry', name: '帮人搬东西', description: '好心帮路人搬重物',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    tags: ['help', 'kindness', 'social'],
    conditions: {
      ...S, actorTraits: ['善良', '勤劳'],
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}看见{targetName}扛着一大包东西，赶紧上前搭了把手。"来，我帮你扛这头。"两人一前一后走着，{targetName}连声道谢。',
      effects: { mood: 5, social: 5, fatigue: -3 },
      targetEffects: { fatigue: 10, mood: 5 },
      relationChange: 8,
    },
  },
  {
    id: 'so_quiet_walk', name: '默默同行', description: '与好友无言并肩而行',
    goalCategory: 'social', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['walking', 'friend', 'quiet', 'social'],
    conditions: {
      ...S, actorTraits: ['沉默', '胆小'],
      targetRequired: true, targetRelationType: 'friend',
    },
    success: {
      narrative: '{npcName}和{targetName}并肩走着，谁也没说话。街上人来人往，但他们之间的沉默并不尴尬，反而有一种难得的安宁。',
      effects: { social: 10, mood: 3 },
      targetEffects: { social: 8, mood: 3 },
      relationChange: 2,
    },
  },

  // ════════════════════════════════════════
  // 新增 20 个场景
  // ════════════════════════════════════════

  {
    id: 'so_morning_greeting', name: '清晨问候', description: '清晨遇见朋友打个招呼',
    goalCategory: 'social', outcomeType: 'certain', weight: 6, cooldownTicks: 2,
    tags: ['morning', 'friend', 'social'],
    conditions: {
      ...S, targetRequired: true, targetRelationType: 'friend', timeOfDay: 'dawn',
    },
    success: {
      narrative: '晨雾还未散尽，{npcName}在巷口遇见了{targetName}。"早啊！吃了吗？""还没呢。"两人相视一笑，各奔各路。',
      effects: { social: 5, mood: 3 },
      targetEffects: { social: 5, mood: 3 },
      relationChange: 1,
    },
  },
  {
    id: 'so_market_gossip', name: '市场八卦', description: '在市场里闲聊八卦',
    goalCategory: 'social', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['market', 'gossip', 'social'],
    conditions: {
      ...S, actorTraits: ['健谈'],
      targetRequired: false, location: ['east_market', 'west_market'],
    },
    success: {
      narrative: '{npcName}在市集里拉住一个相熟的面孔，压低声音："听说了没？张家铺子出了事……"两人凑在一起，嘀嘀咕咕说了好一阵。',
      effects: { social: 8, mood: 5 },
    },
  },
  {
    id: 'so_gift_small', name: '送小礼', description: '大方者给朋友送点小东西',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['gift', 'friend', 'kindness', 'social'],
    conditions: {
      ...S, actorTraits: ['大方'], actorMinCopper: 10,
      targetRequired: true, targetRelationType: 'friend',
    },
    success: {
      narrative: '{npcName}从怀里掏出一个小包，塞到{targetName}手里。"路过顺手买的，给你尝尝。"{targetName}打开一看，是几块糕点。',
      effects: { copper: -5, social: 8, mood: 5 },
      targetEffects: { mood: 8, social: 5 },
      relationChange: 5,
    },
  },
  {
    id: 'so_drink_round', name: '请众人喝酒', description: '大方者请周围人共饮',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 8,
    tags: ['drinking', 'generous', 'group', 'social'],
    conditions: {
      ...S, actorTraits: ['大方'], actorMinCopper: 30,
      minNearbyNpcs: 3, targetRequired: false,
    },
    success: {
      narrative: '{npcName}大手一挥："今天我请客，都别走！"叫了一坛酒来，给在场的人一人倒了一碗。酒香四溢，众人齐声叫好。',
      effects: { copper: -20, social: 15, mood: 10 },
    },
  },
  {
    id: 'so_play_dice', name: '掷骰子', description: '和朋友比试骰子',
    goalCategory: 'social', outcomeType: 'multi_contested', weight: 4, cooldownTicks: 4,
    contestedStat: { actor: 'cleverness', target: 'luck' },
    tags: ['gambling', 'game', 'social'],
    conditions: {
      ...S, actorTraits: ['机灵'], actorMinCopper: 5,
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}和{targetName}摆开骰子。{npcName}一把掷下去，三个六朝上。',
      effects: { copper: 5, mood: 8, social: 5 },
      targetEffects: { copper: -5, mood: -3 },
      relationChange: 1,
    },
    failure: {
      narrative: '骰子骨碌碌转了好几圈才停下。{targetName}一看点数，乐了。',
      effects: { copper: -5, mood: -2, social: 5 },
      relationChange: 1,
    },
    resolution: {
      type: 'multi_contested',
      contestedStat: { actor: 'cleverness', target: 'luck' },
      multiContested: {
        actorStats: [
          { stat: 'cleverness', weight: 1.0 },
          { stat: 'cunning', weight: 0.5 },
          { stat: 'luck', weight: 0.3 },
        ],
        targetStats: [
          { stat: 'luck', weight: 1.0 },
          { stat: 'cleverness', weight: 0.3 },
        ],
        modifiers: [
          { condition: { field: 'actorEmotion', op: 'includes', value: 'happy' }, bonus: 5 },
          { condition: { field: 'actorEmotion', op: 'includes', value: 'tense' }, bonus: -5 },
        ],
      },
    },
    tieredOutcomes: [
      {
        minScore: 90,
        tier: 'critical_success',
        outcome: {
          narrative: '{npcName}和{targetName}摆开骰子。{npcName}一把掷下去，三个六朝上！"豹子！"围观的人炸了锅。{targetName}目瞪口呆，苦笑着掏出铜钱。{npcName}得意洋洋地把铜钱哗啦啦倒进自己袋里。',
          effects: { copper: 10, mood: 15, social: 8 },
          targetEffects: { copper: -10, mood: -5 },
          relationChange: 2,
        },
      },
      {
        minScore: 60,
        tier: 'success',
        outcome: {
          narrative: '{npcName}和{targetName}摆开骰子。{npcName}一把掷下去，三个六朝上。"哈哈，我赢了！"{targetName}苦笑着掏出铜钱。',
          effects: { copper: 5, mood: 8, social: 5 },
          targetEffects: { copper: -5, mood: -3 },
          relationChange: 1,
        },
      },
      {
        minScore: 40,
        tier: 'partial_success',
        outcome: {
          narrative: '两人你输一把我赢一把，打了半天平手。最后{npcName}险胜半子，{targetName}笑道："再来！我不信邪！"',
          effects: { copper: 2, mood: 3, social: 5 },
          targetEffects: { copper: -2, mood: 2 },
          relationChange: 2,
        },
      },
      {
        minScore: 20,
        tier: 'failure',
        outcome: {
          narrative: '骰子骨碌碌转了好几圈才停下。{targetName}一看点数，乐了。{npcName}挠了挠头："再来再来！"',
          effects: { copper: -5, mood: -2, social: 5 },
          relationChange: 1,
        },
      },
      {
        minScore: 0,
        tier: 'critical_failure',
        outcome: {
          narrative: '{npcName}连输五把，脸都绿了。{targetName}乐不可支地收着铜钱："承让承让！"{npcName}咬牙道："你出千！"{targetName}收起笑容："说话要有证据。"',
          effects: { copper: -15, mood: -12, social: 3 },
          targetEffects: { copper: 15, mood: 10 },
          relationChange: -2,
        },
      },
    ],
  },
  {
    id: 'so_storytelling', name: '讲故事', description: '健谈者给周围人讲段故事',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    tags: ['story', 'group', 'social'],
    conditions: {
      ...S, actorTraits: ['健谈'],
      minNearbyNpcs: 2, targetRequired: false,
    },
    success: {
      narrative: '{npcName}清了清嗓子，开口道："话说当年……"围过来的人越来越多。讲到精彩处，众人屏住呼吸；讲到惊险处，有人拍着大腿叫好。',
      effects: { social: 12, mood: 8 },
    },
  },
  {
    id: 'so_sing_song', name: '唱曲儿', description: '心情好时哼唱小曲',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['music', 'joyful', 'social'],
    conditions: {
      ...S, actorTraits: ['健谈', '大方'],
      actorEmotion: 'happy' as any, targetRequired: false,
    },
    success: {
      narrative: '{npcName}心情大好，信口唱起了小曲。调子虽然跑了几个弯，但声音洪亮，倒也有几分味道。路过的人纷纷侧目，有人跟着打起了拍子。',
      effects: { social: 8, mood: 10 },
    },
  },
  {
    id: 'so_shared_secret', name: '倾吐心事', description: '向密友倾诉心中烦忧',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 8,
    tags: ['intimate', 'friend', 'stress', 'social'],
    conditions: {
      ...S, actorMinStress: 40,
      targetRequired: true, targetRelationType: 'closeFriend',
    },
    success: {
      narrative: '{npcName}把{targetName}拉到一旁，叹了口气。"有些话……憋在心里好久了。"说完便絮絮叨叨说了起来，{targetName}静静听着，不时点头。',
      effects: { social: 10, mood: 8 },
      targetEffects: { social: 5, mood: 3 },
      relationChange: 5,
      stressChange: -15,
      memoryTag: '倾诉',
    },
  },
  {
    id: 'so_introduce_friend', name: '介绍朋友认识', description: '把两个朋友互相引荐',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['introduction', 'friend', 'group', 'social'],
    conditions: {
      ...S,
      targetRequired: true, targetRelationType: 'friend',
      minNearbyNpcs: 2,
    },
    success: {
      narrative: '{npcName}拉住{targetName}，又招呼了另一个熟人过来。"你们两个我都很熟，倒是互相不认识。来来来，我给你们引荐引荐。"',
      effects: { social: 10, mood: 5 },
      targetEffects: { social: 8 },
      relationChange: 3,
    },
  },
  {
    id: 'so_condolence', name: '慰问不幸', description: '善良者安慰遭遇不幸的人',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['condolence', 'kindness', 'social'],
    conditions: {
      ...S, actorTraits: ['善良'],
      targetRequired: true, targetTraits: ['sad'] as any,
    },
    success: {
      narrative: '{npcName}看{targetName}面色憔悴，走上前去轻声道："听说你最近遭了难，节哀顺变。有什么需要帮忙的，尽管开口。"',
      effects: { social: 8, mood: 3 },
      targetEffects: { mood: 8, social: 5 },
      relationChange: 6,
    },
  },
  {
    id: 'so_apprentice_chat', name: '师徒闲谈', description: '手艺人与徒弟或同僚闲聊',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    tags: ['profession', 'apprentice', 'social'],
    conditions: {
      ...S, actorProfession: ['doctor', 'blacksmith', 'teacher'],
      targetRequired: true, targetTraits: ['勤劳'],
    },
    success: {
      narrative: '{npcName}放下手里的活计，和{targetName}聊起了行内的门道。"做咱们这一行啊，最要紧的是……"两个人你一言我一语，不知不觉就聊了半个时辰。',
      effects: { social: 10, mood: 5 },
      targetEffects: { social: 8, mood: 3 },
      relationChange: 3,
    },
  },
  {
    id: 'so_propose_deal', name: '提议合作', description: '两个商人商议合伙买卖',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['business', 'merchant', 'social'],
    conditions: {
      ...S, actorTraits: ['精明'], actorProfession: ['merchant'],
      targetRequired: true, targetProfession: ['merchant'],
    },
    success: {
      narrative: '{npcName}拉住{targetName}到一旁："我有个主意，咱们两家联手进货，价码能压下来不少。你觉得如何？"{targetName}捋着胡子想了想，点了点头。',
      effects: { social: 8, mood: 5 },
      targetEffects: { social: 5, mood: 3 },
      relationChange: 5,
    },
  },
  {
    id: 'so_weather_talk', name: '闲聊天气', description: '无事可聊时说说天气',
    goalCategory: 'social', outcomeType: 'certain', weight: 2, cooldownTicks: 2,
    tags: ['smalltalk', 'casual', 'social'],
    conditions: {
      ...S, targetRequired: false,
    },
    success: {
      narrative: '{npcName}抬头看了看天，对旁边的人说："今儿天不错啊。""可不是嘛，昨儿还下着呢。"两个陌生人就这么搭上了话。',
      effects: { social: 3, mood: 2 },
    },
  },
  {
    id: 'so_children_game', name: '组织儿童游戏', description: '温和者带孩子玩耍',
    goalCategory: 'social', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['children', 'kindness', 'social'],
    conditions: {
      ...S,
      targetRequired: true, targetTraits: ['温和'],
    },
    success: {
      narrative: '{npcName}蹲下身来，对围过来的孩子们说："来，咱们玩老鹰捉小鸡！"孩子们欢呼雀跃。{targetName}在旁边看着，脸上也露出了笑容。',
      effects: { social: 8, mood: 10 },
      targetEffects: { mood: 5, social: 5 },
      relationChange: 3,
    },
  },
  {
    id: 'so_sunset_walk', name: '黄昏散步', description: '与密友在黄昏时并肩漫步',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['walking', 'friend', 'dusk', 'social'],
    conditions: {
      ...S, targetRequired: true, targetRelationType: 'closeFriend', timeOfDay: 'dusk',
    },
    success: {
      narrative: '夕阳把天边染成了橘红色。{npcName}和{targetName}并肩走在河边，影子被拉得老长。谁也不说话，只听河水潺潺。',
      effects: { social: 12, mood: 10 },
      targetEffects: { social: 10, mood: 8 },
      relationChange: 4,
    },
  },
  {
    id: 'so_news_exchange', name: '交换消息', description: '健谈者主动与人交换见闻',
    goalCategory: 'social', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['news', 'chat', 'social'],
    conditions: {
      ...S, actorTraits: ['健谈'],
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}凑到{targetName}跟前："最近有什么新鲜事吗？"{targetName}想了想，说了几桩。{npcName}也把自己听到的讲了出来，两人互通有无。',
      effects: { social: 10, mood: 3 },
      targetEffects: { social: 8, mood: 3 },
      relationChange: 2,
    },
  },
  {
    id: 'so_neighbor_help', name: '帮邻居干活', description: '善良勤劳者主动帮邻居',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['help', 'neighbor', 'kindness', 'social'],
    conditions: {
      ...S, actorTraits: ['善良', '勤劳'],
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}路过{targetName}家门口，见院子里堆着一堆要劈的柴。二话不说拿起斧子就干了起来。{targetName}端了碗水出来，感激得不知说什么好。',
      effects: { social: 10, mood: 5, fatigue: -5 },
      targetEffects: { mood: 8, fatigue: 10 },
      relationChange: 8,
    },
  },
  {
    id: 'so_dice_hustle', name: '骰子骗局', description: '狡猾者利用骰子骗老实人',
    goalCategory: 'social', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'cleverness', target: 'judgment' },
    tags: ['deception', 'gambling', 'social'],
    conditions: {
      ...S, actorTraits: ['狡猾'],
      targetRequired: true, targetTraits: ['善良', '胆小'],
    },
    success: {
      narrative: '{npcName}笑嘻嘻地掏出骰子："来一局？简单的很。"{targetName}犹犹豫豫地答应了。几把下来，{targetName}的铜钱就见了底。',
      effects: { copper: 10, mood: 5 },
      targetEffects: { copper: -10, mood: -8 },
      relationChange: -10,
      memoryTag: '骰子骗局',
    },
    failure: {
      narrative: '{targetName}虽然老实，但不傻。看了几把就觉出不对："你这骰子有问题吧？"{npcName}讪讪地把骰子收了回去。',
      effects: { mood: -5 },
      relationChange: -8,
    },
  },
  {
    id: 'so_festival_prep', name: '节日准备', description: '和朋友一起为节日做准备',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 10,
    tags: ['festival', 'seasonal', 'friend', 'social'],
    conditions: {
      ...S, season: ['春', '秋'],
      targetRequired: true, targetRelationType: 'friend',
    },
    success: {
      narrative: '节日的气氛越来越浓了。{npcName}和{targetName}一起挂灯笼、扎彩绳。忙活了大半天，看着装扮一新的屋子，两人相视而笑。',
      effects: { social: 12, mood: 10 },
      targetEffects: { social: 10, mood: 8 },
      relationChange: 5,
    },
  },
  {
    id: 'so_welcome_newcomer', name: '欢迎新邻居', description: '善良好客者主动招呼新搬来的人',
    goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 8,
    tags: ['newcomer', 'kindness', 'social'],
    conditions: {
      ...S, actorTraits: ['善良', '好客'],
      targetRequired: true, targetRelationType: 'stranger',
    },
    success: {
      narrative: '{npcName}看见一个生面孔在巷口东张西望，主动走上前去："新搬来的吧？我叫{npcName}，就住隔壁。有什么不晓得的尽管问我。"',
      effects: { social: 10, mood: 8 },
      targetEffects: { social: 8, mood: 10 },
      relationChange: 8,
    },
  },
];
