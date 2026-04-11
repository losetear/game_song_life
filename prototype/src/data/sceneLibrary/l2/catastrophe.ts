// ════════════════════════════════════════
// L2 粗粒场景 — 灾难事件 (10个)
// 描写跨区域的重大灾难：旱灾、洪水、瘟疫、饥荒等
// 这些场景优先级高、冷却时间长，代表罕见但重大的事件
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

export const L2_CATASTROPHE_SCENES: L2Scene[] = [
  // ──── 严重旱灾 ────
  {
    id: 'l2_drought',
    name: '大旱',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
      season: ['夏'],
    },
    outcomes: [
      {
        narrative: '烈日如火，{regionName}已经三个月没有落过一滴雨。庄稼全部枯死，田地龟裂成一张巨大的蛛网。河沟见了底，井水也越来越少。人们跪在烈日下求雨，可天上连一片云都没有。',
        atmosphereTag: '大旱成灾',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.5 }, { good: 'water', priceMultiplier: 3.0 }],
        npcMoraleEffect: -20,
      },
      {
        narrative: '{regionName}遭遇了数十年不遇的大旱，草木枯黄，池塘干涸。牲口因为没有水喝而哀鸣不止，逃荒的人开始涌向城镇。官府开仓放粮，但粮仓也在一天天见底。',
        atmosphereTag: '大旱成灾',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.2 }, { good: 'vegetable', priceMultiplier: 2.0 }],
        npcMoraleEffect: -18,
      },
    ],
    weight: 2,
    cooldownTicks: 30,
    priority: 10,
  },

  // ──── 洪水 ────
  {
    id: 'l2_flood',
    name: '大水',
    category: 'disaster',
    conditions: {
      regionType: ['farmland', 'river'],
      thresholdType: 'weather',
      thresholdOperator: 'above',
      thresholdValue: 0.8,
      weather: ['暴雨', '大暴雨', '连阴雨'],
    },
    outcomes: [
      {
        narrative: '暴雨连下了七天七夜，{regionName}终于扛不住了。堤坝决口，洪水咆哮着涌向村庄和农田。水面上漂浮着屋顶的瓦片和家养的牲畜，幸存的村民挤在高处的山丘上，眼睁睁看着家园被吞没。',
        atmosphereTag: '洪水肆虐',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.5 }, { good: 'vegetable', priceMultiplier: 2.0 }],
        npcMoraleEffect: -22,
      },
      {
        narrative: '洪水退去后的{regionName}惨不忍睹，良田被淤泥覆盖，房屋倒塌大半。到处是腐烂的庄稼和溺毙的家禽，空气中弥漫着令人作呕的气味。灾民们茫然地站在废墟上，不知接下来该怎么办。',
        atmosphereTag: '洪灾之后',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.0 }, { good: 'wood', priceMultiplier: 1.5 }],
        npcMoraleEffect: -18,
      },
    ],
    weight: 2,
    cooldownTicks: 30,
    priority: 10,
  },

  // ──── 瘟疫 ────
  {
    id: 'l2_plague',
    name: '瘟疫',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '一场突如其来的瘟疫席卷了{regionName}，染病的人高烧不退，浑身长满紫黑色的斑点。大夫们束手无策，只能用艾烟熏蒸来聊以自慰。每天都有人被抬出去，街道上弥漫着消毒草药和死亡混合的气息。',
        atmosphereTag: '瘟疫横行',
        economicEffect: [{ good: 'medicine', priceMultiplier: 3.0 }, { good: 'herb', priceMultiplier: 2.5 }],
        npcMoraleEffect: -25,
      },
      {
        narrative: '{regionName}已经封城了，衙役守在城门口不许任何人进出。城里的药铺早就空了，郎中们自己也倒下了不少。家家闭户，巷子里偶尔传来哭声，那是又有人走了。',
        atmosphereTag: '瘟疫封城',
        economicEffect: [{ good: 'medicine', priceMultiplier: 2.5 }],
        npcMoraleEffect: -20,
      },
    ],
    weight: 1,
    cooldownTicks: 35,
    priority: 10,
  },

  // ──── 饥荒 ────
  {
    id: 'l2_famine',
    name: '饥荒',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.2,
    },
    outcomes: [
      {
        narrative: '{regionName}已经断粮了。树皮被剥光，草根被挖尽，连观音土都有人抢着吃。骨瘦如柴的孩童趴在母亲怀里，连哭的力气都没有了。路上时不时有倒毙的饿殍，活着的人连看都不敢多看一眼。',
        atmosphereTag: '饥荒遍地',
        economicEffect: [{ good: 'grain', priceMultiplier: 4.0 }, { good: 'vegetable', priceMultiplier: 3.0 }],
        npcMoraleEffect: -28,
      },
      {
        narrative: '逃荒的人群从{regionName}涌出，拖家带口地沿着官道往城镇走。走不动了的老人坐在路边等死，青壮年咬着牙继续往前。有孩子的母亲把最后一口干粮塞进孩子嘴里，自己已经三天没吃东西了。',
        atmosphereTag: '流民逃荒',
        economicEffect: [{ good: 'grain', priceMultiplier: 3.5 }],
        npcMoraleEffect: -25,
      },
    ],
    weight: 1,
    cooldownTicks: 35,
    priority: 10,
  },

  // ──── 大火 ────
  {
    id: 'l2_fire',
    name: '大火',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.1,
    },
    outcomes: [
      {
        narrative: '深夜里不知从何处燃起的大火吞噬了{regionName}的半条街。火舌蹿起数丈高，照亮了半边天。居民们从睡梦中惊醒，只来得及拖出老人孩子，眼睁睁看着家当付之一炬。',
        atmosphereTag: '大火肆虐',
        economicEffect: [{ good: 'wood', priceMultiplier: 1.8 }],
        npcMoraleEffect: -18,
      },
      {
        narrative: '{regionName}的火终于被扑灭了，但整条商业街已化为灰烬。焦黑的房梁歪歪斜斜地立着，空气中弥漫着刺鼻的焦糊味。商人们望着自己半生积蓄变成的废墟，欲哭无泪。',
        atmosphereTag: '火灾之后',
        economicEffect: [{ good: 'wood', priceMultiplier: 1.6 }, { good: 'silk', priceMultiplier: 1.4 }],
        npcMoraleEffect: -15,
      },
    ],
    weight: 2,
    cooldownTicks: 25,
    priority: 9,
  },

  // ──── 蝗灾 ────
  {
    id: 'l2_locust_swarm',
    name: '蝗灾',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
      season: ['夏', '秋'],
    },
    outcomes: [
      {
        narrative: '黑压压的蝗虫群从天边涌来，遮天蔽日，{regionName}的天空顿时暗了下来。蝗虫落在田里发出令人头皮发麻的沙沙声，所过之处寸草不留，绿油油的庄稼眨眼间只剩下光秃秃的杆子。',
        atmosphereTag: '蝗灾过境',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.0 }, { good: 'vegetable', priceMultiplier: 1.8 }],
        npcMoraleEffect: -18,
      },
      {
        narrative: '蝗虫大军过境后，{regionName}的田野像被剃了头一样干净。农人们站在光秃秃的田里，望着远去的虫群发呆。一年的辛苦就这样没了，接下来的日子该怎么熬？',
        atmosphereTag: '蝗灾之后',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.2 }],
        npcMoraleEffect: -15,
      },
    ],
    weight: 2,
    cooldownTicks: 25,
    priority: 9,
  },

  // ──── 土匪 ────
  {
    id: 'l2_bandit_raid',
    name: '匪患',
    category: 'disaster',
    conditions: {
      regionType: ['mountain', 'farmland'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
    },
    outcomes: [
      {
        narrative: '一伙悍匪趁着夜色洗劫了{regionName}外围的几个村子，抢走了粮食和牲口，还打伤了好几个村民。天亮后人们才敢出来查看损失，满地狼藉，哭声一片。官府的巡捕说要派人来，可谁知道什么时候才到。',
        atmosphereTag: '匪患肆虐',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.5 }],
        npcMoraleEffect: -15,
      },
      {
        narrative: '{regionName}附近的匪患越来越猖獗，商队不敢上路，货物运不进来也送不出去。村民们自发组织了巡逻队，晚上拿着锄头和扁担守在村口。人心惶惶，连觉都睡不安稳。',
        atmosphereTag: '匪患威胁',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.4 }, { good: 'salt', priceMultiplier: 1.3 }],
        npcMoraleEffect: -12,
      },
    ],
    weight: 3,
    cooldownTicks: 20,
    priority: 8,
  },

  // ──── 地震 ────
  {
    id: 'l2_earthquake',
    name: '地震',
    category: 'disaster',
    conditions: {
      regionType: ['farmland', 'mountain', 'river', 'urban'],
      thresholdType: 'weather',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
    },
    outcomes: [
      {
        narrative: '大地突然剧烈颤抖，{regionName}传来一阵令人毛骨悚然的轰鸣。房屋摇晃，瓦片纷纷坠落，街上的人惊慌失措地跑向空旷地带。等震动停歇，到处是裂缝和倒塌的院墙，尘土弥漫久久不散。',
        atmosphereTag: '地震惊恐',
        npcMoraleEffect: -25,
      },
      {
        narrative: '地震虽然只持续了几息工夫，但{regionName}已经面目全非。有的房屋整个塌了下来，有的地面裂开了大口子。惊魂未定的居民在废墟里翻找着还能用的东西，余震不时发生，每个人都提心吊胆。',
        atmosphereTag: '地震之后',
        economicEffect: [{ good: 'wood', priceMultiplier: 1.8 }],
        npcMoraleEffect: -20,
      },
    ],
    weight: 1,
    cooldownTicks: 40,
    priority: 10,
  },

  // ──── 瘟疫谣言 ────
  {
    id: 'l2_epidemic_rumor',
    name: '瘟疫谣言',
    category: 'disaster',
    conditions: {
      regionType: ['urban', 'farmland'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.5,
    },
    outcomes: [
      {
        narrative: '{regionName}突然流传起瘟疫的谣言，说某某村已经死了好几十人。虽然没人能证实，但恐惧比瘟疫传播得更快。有人开始抢购药材和粮食，也有人收拾包袱准备逃往别处。',
        atmosphereTag: '谣言四起',
        economicEffect: [{ good: 'medicine', priceMultiplier: 1.6 }, { good: 'grain', priceMultiplier: 1.3 }],
        npcMoraleEffect: -10,
      },
      {
        narrative: '关于怪病的传言在{regionName}越传越邪乎，有人说看到了鬼影，有人说是天降惩罚。茶馆里的说书人添油加醋，把事情说得更加骇人。官府贴出了安民告示，但恐慌已经像野火一样蔓延开了。',
        atmosphereTag: '谣言四起',
        economicEffect: [{ good: 'herb', priceMultiplier: 1.4 }],
        npcMoraleEffect: -8,
      },
    ],
    weight: 3,
    cooldownTicks: 18,
    priority: 7,
  },

  // ──── 供应中断 ────
  {
    id: 'l2_supply_disruption',
    name: '供应中断',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '{regionName}的供应链断了，市面上几乎买不到任何东西。粮店的门板紧闭，肉铺空空如也，连柴火都成了稀罕物。有钱也花不出去，人们开始意识到，铜板再多也换不来一粒米。',
        atmosphereTag: '供应断绝',
        economicEffect: [
          { good: 'grain', priceMultiplier: 3.0 },
          { good: 'vegetable', priceMultiplier: 2.5 },
          { good: 'meat', priceMultiplier: 2.5 },
        ],
        npcMoraleEffect: -18,
      },
      {
        narrative: '商路中断后，{regionName}的物价一天一个样。早上还能买到的盐，到了下午就涨了三成。有些商铺趁机囤货居奇，被愤怒的百姓砸了招牌。衙门贴出了限价令，但黑市上的价格照样飞涨。',
        atmosphereTag: '供应断绝',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.5 }, { good: 'salt', priceMultiplier: 2.8 }],
        npcMoraleEffect: -15,
      },
    ],
    weight: 2,
    cooldownTicks: 22,
    priority: 9,
  },
];
