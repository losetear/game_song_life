// ════════════════════════════════════════
// L2 粗粒场景 — 农田区域 (12个)
// 描写区域级农田现象：丰收、歉收、灾害、四季轮转
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

export const L2_FARMLAND_SCENES: L2Scene[] = [
  // ──── 丰收 ────
  {
    id: 'l2_bumper_harvest',
    name: '大丰收',
    category: 'harvest',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.8,
    },
    outcomes: [
      {
        narrative: '{regionName}的庄稼长势惊人，沉甸甸的谷穗压弯了腰。农人穿梭在田间，镰刀挥得飞快，脸上藏不住的笑意。今年是个难得的好年景。',
        atmosphereTag: '丰收喜悦',
        npcMoraleEffect: 8,
      },
      {
        narrative: '金黄的稻浪铺满了{regionName}，打谷场上堆满了新收的粮食。孩子们在草垛间追逐嬉闹，空气中弥漫着稻谷的清香，到处都是忙碌而欢快的景象。',
        atmosphereTag: '丰收喜悦',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.7 }],
        npcMoraleEffect: 10,
      },
      {
        narrative: '{regionName}迎来了数年来最好的收成，粮仓装得满满当当。村口的老人们坐在墙根下晒太阳，嘴里念叨着：老天爷开了眼，今年够吃了。',
        atmosphereTag: '丰收喜悦',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.75 }],
        npcMoraleEffect: 6,
      },
    ],
    weight: 5,
    cooldownTicks: 15,
    priority: 8,
  },

  // ──── 歉收 ────
  {
    id: 'l2_poor_harvest',
    name: '歉收',
    category: 'harvest',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.5,
    },
    outcomes: [
      {
        narrative: '{regionName}的田里一片萧瑟，庄稼稀稀拉拉，谷穗干瘪得像老人攥紧的拳头。农人们蹲在田埂上，望着这一季的收成，沉默不语。',
        atmosphereTag: '歉收忧愁',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.4 }],
        npcMoraleEffect: -8,
      },
      {
        narrative: '收成不到往年的一半，{regionName}的粮仓空了大半。有妇人蹲在空荡荡的谷仓前抹眼泪，孩子们不懂事，还在院子里追着鸡跑。',
        atmosphereTag: '歉收忧愁',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.5 }],
        npcMoraleEffect: -10,
      },
    ],
    weight: 5,
    cooldownTicks: 15,
    priority: 8,
  },

  // ──── 平稳 ────
  {
    id: 'l2_normal_harvest',
    name: '平稳年景',
    category: 'harvest',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.4,
    },
    outcomes: [
      {
        narrative: '{regionName}的庄稼不温不火，说不上好也谈不上坏。农人们按部就班地除草、施肥、浇水，日子就这样不急不缓地过着。',
        atmosphereTag: '平淡安稳',
        npcMoraleEffect: 2,
      },
      {
        narrative: '田里的庄稼长得中规中矩，{regionName}的农人一边干活一边闲聊着家长里短。虽不是丰年，但也饿不着肚子，知足常乐。',
        atmosphereTag: '平淡安稳',
        npcMoraleEffect: 1,
      },
    ],
    weight: 10,
    cooldownTicks: 8,
    priority: 3,
  },

  // ──── 旱灾 ────
  {
    id: 'l2_drought_damage',
    name: '旱灾',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
      season: ['夏'],
      weather: ['晴', '晴朗', '干旱'],
    },
    outcomes: [
      {
        narrative: '毒日头连晒了数十日，{regionName}的田地裂开一道道口子，像老人脸上的皱纹。庄稼蔫头耷脑地缩在地里，叶子卷成了筒，一碰就碎。',
        atmosphereTag: '旱灾恐慌',
        economicEffect: [{ good: 'grain', priceMultiplier: 2.0 }, { good: 'water', priceMultiplier: 2.5 }],
        npcMoraleEffect: -15,
      },
      {
        narrative: '{regionName}的池塘见了底，井水也越打越少。田里的禾苗枯黄一片，热浪扭曲了远处的地平线。老农望着干裂的土地，长叹一声：怕是要绝收了。',
        atmosphereTag: '旱灾恐慌',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.8 }, { good: 'water', priceMultiplier: 2.0 }],
        npcMoraleEffect: -12,
      },
    ],
    weight: 3,
    cooldownTicks: 20,
    priority: 10,
  },

  // ──── 洪灾 ────
  {
    id: 'l2_flood_damage',
    name: '洪灾',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
      weather: ['暴雨', '大暴雨', '连阴雨'],
    },
    outcomes: [
      {
        narrative: '暴雨如注，{regionName}的农田变成了一片汪洋。浑浊的洪水裹挟着泥沙和残枝漫过田埂，眼看着一季的庄稼全泡了汤。',
        atmosphereTag: '洪灾恐惧',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.8 }, { good: 'vegetable', priceMultiplier: 1.6 }],
        npcMoraleEffect: -15,
      },
      {
        narrative: '洪水退去后，{regionName}的田里满目疮痍。倒伏的庄稼泡在泥水里，散发着腐烂的气息。农人踩着没膝的淤泥，默默地收拾残局。',
        atmosphereTag: '洪灾后萧条',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.6 }],
        npcMoraleEffect: -10,
      },
    ],
    weight: 3,
    cooldownTicks: 20,
    priority: 10,
  },

  // ──── 虫灾 ────
  {
    id: 'l2_pest_invasion',
    name: '虫灾',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.6,
    },
    outcomes: [
      {
        narrative: '蝗虫铺天盖地而来，遮住了{regionName}半边天。落在田里，啃噬声像下了一场细密的雨。一夜之间，翠绿的禾苗变成了光秃秃的杆子。',
        atmosphereTag: '虫灾恐惧',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.6 }, { good: 'vegetable', priceMultiplier: 1.4 }],
        npcMoraleEffect: -12,
      },
      {
        narrative: '{regionName}的田里突然多了无数的虫子，密密麻麻地爬满了庄稼。农人们点起了火堆试图驱赶，但虫群太多了，黑压压地望不到头。',
        atmosphereTag: '虫灾恐惧',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.5 }],
        npcMoraleEffect: -10,
      },
    ],
    weight: 4,
    cooldownTicks: 18,
    priority: 9,
  },

  // ──── 播种 ────
  {
    id: 'l2_new_planting',
    name: '春耕播种',
    category: 'seasonal',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.2,
      season: ['春'],
    },
    outcomes: [
      {
        narrative: '春雷一响，{regionName}的农人们便忙活起来。翻地、施肥、下种，田间地头到处是忙碌的身影。新翻的泥土散发着湿润的气息，燕子低飞掠过水面。',
        atmosphereTag: '春耕忙碌',
        npcMoraleEffect: 3,
      },
      {
        narrative: '{regionName}的水田灌满了春水，农人挽着裤腿在泥里插秧，一行行整齐的秧苗像给大地绣上了绿格子。远处传来牛叫声和孩子追逐的笑闹声。',
        atmosphereTag: '春耕忙碌',
        npcMoraleEffect: 4,
      },
    ],
    weight: 8,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 茁壮生长 ────
  {
    id: 'l2_growing_strong',
    name: '茁壮生长',
    category: 'harvest',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.6,
      season: ['夏'],
    },
    outcomes: [
      {
        narrative: '{regionName}的庄稼长得正欢，绿油油的禾苗拔节抽穗，生机勃勃。夏风吹过，整片田野像绿色的海浪翻涌。农人除草施肥，额头上淌着汗，心里却是踏实的。',
        atmosphereTag: '生长旺盛',
        npcMoraleEffect: 5,
      },
      {
        narrative: '烈日下的{regionName}，庄稼噌噌往上蹿。田埂上的野花也开得热闹，蜻蜓在稻叶间穿梭。虽是酷暑，农人看着满眼翠绿，脸上还是浮起了笑容。',
        atmosphereTag: '生长旺盛',
        npcMoraleEffect: 4,
      },
    ],
    weight: 6,
    cooldownTicks: 10,
    priority: 5,
  },

  // ──── 金色麦浪 ────
  {
    id: 'l2_golden_fields',
    name: '金色麦浪',
    category: 'seasonal',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
      season: ['秋'],
    },
    outcomes: [
      {
        narrative: '秋风起，{regionName}的田野变成了金色的海洋。沉甸甸的谷穗随风起伏，像大地在呼吸。收割的农人弯着腰，镰刀割出有节奏的沙沙声。',
        atmosphereTag: '秋收金黄',
        npcMoraleEffect: 6,
      },
      {
        narrative: '{regionName}的稻田在夕阳下泛着温暖的金光，颗粒饱满的谷穗低垂着头。孩童在收割后的田里捡稻穗，远处炊烟袅袅升起，一派祥和的秋日景象。',
        atmosphereTag: '秋收金黄',
        npcMoraleEffect: 5,
      },
      {
        narrative: '金灿灿的庄稼铺满了{regionName}的视野，空气中飘着谷香。村里的打谷场热闹非凡，连隔壁村的人都来看今年的好收成。这是属于农人的节日。',
        atmosphereTag: '秋收金黄',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.8 }],
        npcMoraleEffect: 7,
      },
    ],
    weight: 7,
    cooldownTicks: 10,
    priority: 6,
  },

  // ──── 冬休 ────
  {
    id: 'l2_fallow_winter',
    name: '冬闲',
    category: 'seasonal',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.1,
      season: ['冬'],
    },
    outcomes: [
      {
        narrative: '{regionName}的农田覆着一层薄霜，光秃秃的田地在冬日阳光下显得格外静谧。农人们难得清闲，围坐在火炉旁唠家常，修补来年要用的农具。',
        atmosphereTag: '冬日宁静',
        npcMoraleEffect: 2,
      },
      {
        narrative: '大雪覆盖了{regionName}的田地，天地间白茫茫一片。偶尔有几只麻雀落在雪地上觅食，留下细碎的爪印。村里的炊烟笔直地升向灰蒙蒙的天空。',
        atmosphereTag: '冬日宁静',
        npcMoraleEffect: 1,
      },
    ],
    weight: 7,
    cooldownTicks: 10,
    priority: 4,
  },

  // ──── 灌渠畅通 ────
  {
    id: 'l2_irrigation_flowing',
    name: '灌渠畅通',
    category: 'harvest',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
    },
    outcomes: [
      {
        narrative: '{regionName}的灌渠里清水潺潺流淌，沟渠四通八达，滋润着每一寸田地。农人引水浇田，庄稼喝足了水，绿意盎然。好水利才有好收成。',
        atmosphereTag: '水利通畅',
        npcMoraleEffect: 4,
      },
      {
        narrative: '沟渠里的水清亮亮的，{regionName}的农田像铺了一张水网。孩子们在渠边玩耍，妇女们在水边浣衣，庄稼地里的水车吱呀吱呀地转着。',
        atmosphereTag: '水利通畅',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.9 }],
        npcMoraleEffect: 3,
      },
    ],
    weight: 5,
    cooldownTicks: 12,
    priority: 5,
  },

  // ──── 灌渠淤塞 ────
  {
    id: 'l2_irrigation_blocked',
    name: '灌渠淤塞',
    category: 'disaster',
    conditions: {
      regionType: ['farmland'],
      thresholdType: 'yield',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
    },
    outcomes: [
      {
        narrative: '{regionName}的灌渠长满了杂草，淤泥堵住了大半河道。水到了田头已经少得可怜，庄稼干渴得耷拉着叶子。几个老农合计着要组织人清淤，可人手不够。',
        atmosphereTag: '水利不畅',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.3 }],
        npcMoraleEffect: -5,
      },
      {
        narrative: '干涸的沟渠像一道道伤疤横亘在{regionName}的田野上。往年水流丰沛的渠道如今只剩泥浆，庄稼缺水严重，农人挑着水桶来回奔波也杯水车薪。',
        atmosphereTag: '水利不畅',
        npcMoraleEffect: -7,
      },
    ],
    weight: 4,
    cooldownTicks: 15,
    priority: 7,
  },
];
