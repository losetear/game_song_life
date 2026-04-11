// ════════════════════════════════════════
// L2 粗粒场景 — 繁荣景象 (8个)
// 描写区域级的正面大事件：风调雨顺、贸易兴旺、太平盛世
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

export const L2_PROSPERITY_SCENES: L2Scene[] = [
  // ──── 风调雨顺 ────
  {
    id: 'l2_good_year',
    name: '风调雨顺',
    category: 'prosperity',
    conditions: {
      regionType: ['farmland', 'river'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.8,
    },
    outcomes: [
      {
        narrative: '今年的{regionName}真是风调雨顺，该下雨的时候下雨，该放晴的时候放晴。庄稼长得格外壮实，河水丰盈而不泛滥，渔民和农人都笑得合不拢嘴。老人们说这是天公作美，要好好谢谢上苍。',
        atmosphereTag: '风调雨顺',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.75 }, { good: 'fish', priceMultiplier: 0.8 }],
        npcMoraleEffect: 10,
      },
      {
        narrative: '雨水均匀、阳光充足的{regionName}，万物生长得格外好。田里的庄稼、山上的果树、河中的鱼虾，样样丰收。孩子们的脸蛋圆了，大人们的眉头舒展了，连牲口都比往年壮实。',
        atmosphereTag: '风调雨顺',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.8 }, { good: 'vegetable', priceMultiplier: 0.85 }],
        npcMoraleEffect: 8,
      },
    ],
    weight: 4,
    cooldownTicks: 18,
    priority: 7,
  },

  // ──── 贸易繁荣 ────
  {
    id: 'l2_trade_boom',
    name: '贸易繁荣',
    category: 'prosperity',
    conditions: {
      regionType: ['urban', 'river'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.6,
    },
    outcomes: [
      {
        narrative: '{regionName}的商业异常兴旺，各地商人蜂拥而至。丝绸、茶叶、瓷器、香料，天南海北的货物在这里汇聚又发散。码头上船来船往，钱庄里的银票流水般进出，整座城都沉浸在繁荣的脉动中。',
        atmosphereTag: '贸易兴隆',
        economicEffect: [{ good: 'silk', priceMultiplier: 0.85 }, { good: 'salt', priceMultiplier: 0.85 }, { good: 'tea', priceMultiplier: 0.9 }],
        npcMoraleEffect: 8,
      },
      {
        narrative: '商路畅通，{regionName}的市场上琳琅满目，连番邦的稀罕物都能买到。商人们笑逐颜开，伙计们忙得脚不沾地。税收增加了，官府也高兴，市面上一片欣欣向荣。',
        atmosphereTag: '贸易兴隆',
        economicEffect: [{ good: 'silk', priceMultiplier: 0.88 }],
        npcMoraleEffect: 6,
      },
    ],
    weight: 4,
    cooldownTicks: 15,
    priority: 6,
  },

  // ──── 太平盛世 ────
  {
    id: 'l2_peaceful_times',
    name: '太平盛世',
    category: 'prosperity',
    conditions: {
      regionType: ['urban', 'farmland'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.75,
    },
    outcomes: [
      {
        narrative: '{regionName}近来太平得很，路不拾遗，夜不闭户。孩童在街上嬉闹玩耍，老人们在柳树下对弈品茗。商贩安心做生意，农人专心种庄稼，连流浪的乞丐都少了许多。这样的日子，真是千金不换。',
        atmosphereTag: '太平安宁',
        npcMoraleEffect: 10,
      },
      {
        narrative: '治安好、年景好、人心也好——{regionName}的百姓都说这是难得的太平年。邻里之间和和睦睦，有困难互相帮衬。就连最挑剔的老秀才也点了点头：这就是书上说的治世啊。',
        atmosphereTag: '太平安宁',
        npcMoraleEffect: 8,
      },
    ],
    weight: 3,
    cooldownTicks: 20,
    priority: 7,
  },

  // ──── 人口增长 ────
  {
    id: 'l2_population_growth',
    name: '人丁兴旺',
    category: 'prosperity',
    conditions: {
      regionType: ['urban', 'farmland'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.7,
    },
    outcomes: [
      {
        narrative: '{regionName}近来添了不少新丁，到处都能听到婴儿的啼哭声和产妇家的报喜声。村口的古树上系满了祈福的红布条，祠堂里香烟缭绕，感谢祖宗保佑人丁兴旺。',
        atmosphereTag: '人丁兴旺',
        npcMoraleEffect: 7,
      },
      {
        narrative: '好年景带来了好日子，{regionName}的年轻人纷纷成家立业，新的院落一座座建起来。孩子多了，学堂也扩了，连接生婆都忙得脚不沾地。到处是生机勃勃的景象。',
        atmosphereTag: '人丁兴旺',
        npcMoraleEffect: 6,
      },
    ],
    weight: 3,
    cooldownTicks: 18,
    priority: 6,
  },

  // ──── 文化繁荣 ────
  {
    id: 'l2_cultural_flower',
    name: '文风鼎盛',
    category: 'prosperity',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.7,
      season: ['春', '秋'],
    },
    outcomes: [
      {
        narrative: '{regionName}近来文风大盛，书院里学子云集，吟诗作赋之声不绝于耳。茶楼里定期举办文会，新科才子们的诗词传抄一时，连巷子口卖豆腐的大婶都能念上两句。',
        atmosphereTag: '文风鼎盛',
        npcMoraleEffect: 8,
      },
      {
        narrative: '春风送暖，{regionName}的书院前贴出了新的诗榜，引来一群文人墨客驻足品评。画舫上丝竹悠扬，文人们饮酒赋诗，好不风雅。街头的孩童也学着摇头晃脑地背诵三字经。',
        atmosphereTag: '文风鼎盛',
        npcMoraleEffect: 6,
      },
    ],
    weight: 3,
    cooldownTicks: 15,
    priority: 5,
  },

  // ──── 建设兴旺 ────
  {
    id: 'l2_construction_boom',
    name: '百业兴旺',
    category: 'prosperity',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.65,
    },
    outcomes: [
      {
        narrative: '{regionName}到处是施工的景象，新的酒楼、铺面和宅院拔地而起。木匠、泥瓦匠和石匠忙得不可开交，连隔壁镇的工匠都被请来帮忙。叮叮当当的敲打声从早响到晚，是繁荣的乐章。',
        atmosphereTag: '建设兴旺',
        economicEffect: [{ good: 'wood', priceMultiplier: 1.2 }],
        npcMoraleEffect: 7,
      },
      {
        narrative: '百业兴旺的{regionName}，街上新开的铺子一家接一家。打铁的、织布的、酿酒的、制陶的，各行各业的生意都不错。就连外地的手艺人也慕名而来，想在这好光景里分一杯羹。',
        atmosphereTag: '百业兴旺',
        npcMoraleEffect: 5,
      },
    ],
    weight: 4,
    cooldownTicks: 15,
    priority: 5,
  },

  // ──── 丰收庆典 ────
  {
    id: 'l2_harvest_festival',
    name: '丰收庆典',
    category: 'seasonal',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.75,
      season: ['秋'],
    },
    outcomes: [
      {
        narrative: '金秋时节，{regionName}迎来了盛大的丰收庆典。村村户户杀鸡宰羊，在打谷场上摆开了流水席。锣鼓喧天，鞭炮齐鸣，男女老少载歌载舞，庆祝这来之不易的好年景。',
        atmosphereTag: '丰收庆典',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.8 }, { good: 'meat', priceMultiplier: 0.9 }],
        npcMoraleEffect: 12,
      },
      {
        narrative: '{regionName}的丰收祭办得格外隆重，连邻村的人都来凑热闹。祠堂前摆满了新打的粮食和时令瓜果，族长带头向上苍叩谢恩典。孩子们手里举着面人儿和糖葫芦，满场跑着笑闹，快活得像一群小麻雀。',
        atmosphereTag: '丰收庆典',
        npcMoraleEffect: 10,
      },
      {
        narrative: '丰收的喜悦洋溢在{regionName}每个人的脸上。白天举行了祭祀天地的仪式，感恩风调雨顺。入夜后，篝火燃起，青壮年们跳起了欢庆的舞蹈，老人们坐在一旁品着新酿的米酒，满脸都是满足。',
        atmosphereTag: '丰收庆典',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.82 }],
        npcMoraleEffect: 11,
      },
    ],
    weight: 4,
    cooldownTicks: 18,
    priority: 7,
  },

  // ──── 新年喜庆 ────
  {
    id: 'l2_new_year_joy',
    name: '新年喜庆',
    category: 'seasonal',
    conditions: {
      regionType: ['urban', 'farmland'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
      season: ['春'],
    },
    outcomes: [
      {
        narrative: '新春佳节的{regionName}到处洋溢着喜庆的气氛。家家户户贴上了红对联，门前挂上了大红灯笼。爆竹声此起彼伏，空气中弥漫着硝烟和年糕的香味。孩子们穿着新衣裳挨家挨户拜年，口袋里塞满了糖果和压岁钱。',
        atmosphereTag: '新年喜庆',
        npcMoraleEffect: 12,
      },
      {
        narrative: '{regionName}迎来了新的一年，街头巷尾满是欢声笑语。庙会上人山人海，耍把戏的、变戏法的、卖糖画的，热闹得让人目不暇接。人们互道"新年好"，把过去一年的辛劳和烦恼都抛在脑后，满怀希望地迎接新的开始。',
        atmosphereTag: '新年喜庆',
        npcMoraleEffect: 10,
      },
    ],
    weight: 5,
    cooldownTicks: 25,
    priority: 7,
  },
];
