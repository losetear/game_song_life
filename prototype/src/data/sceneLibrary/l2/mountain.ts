// ════════════════════════════════════════
// L2 粗粒场景 — 山区区域 (10个)
// 描写区域级山地现象：野生动物、猎事、山险、草药
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

export const L2_MOUNTAIN_SCENES: L2Scene[] = [
  // ──── 野生动物丰富 ────
  {
    id: 'l2_wildlife_abundant',
    name: '野生动物丰富',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.7,
    },
    outcomes: [
      {
        narrative: '{regionName}的山林里生机盎然，野兔在灌木丛中穿梭，锦鸡在枝头鸣叫。经验丰富的猎人循着兽径往深处走，猎犬兴奋地低声呜咽，鼻子贴着地不停嗅。',
        atmosphereTag: '山林丰饶',
        economicEffect: [{ good: 'meat', priceMultiplier: 0.75 }, { good: 'fur', priceMultiplier: 0.8 }],
        npcMoraleEffect: 5,
      },
      {
        narrative: '清晨的{regionName}笼罩在薄雾中，林间不时传来麂子的叫声。山涧边的泥地上印满了各种蹄印和爪痕，可见这片山林养活了不少飞禽走兽。',
        atmosphereTag: '山林丰饶',
        npcMoraleEffect: 4,
      },
    ],
    weight: 6,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 野生动物稀少 ────
  {
    id: 'l2_wildlife_scarce',
    name: '猎物稀少',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '{regionName}的山林死一般寂静，往年常见的野兔和山鸡如今踪影难觅。猎人在山里转了一整天，箭袋里的箭一支也没少。空荡荡的山径上只有他自己的脚印。',
        atmosphereTag: '山林萧条',
        economicEffect: [{ good: 'meat', priceMultiplier: 1.5 }, { good: 'fur', priceMultiplier: 1.4 }],
        npcMoraleEffect: -6,
      },
      {
        narrative: '林子里的鸟叫都听不见了，{regionName}的猎人把弓挂在墙上叹气。孩子们问今晚有没有肉吃，他只能摇摇头，把干粮掰碎了分给他们。',
        atmosphereTag: '山林萧条',
        npcMoraleEffect: -8,
      },
    ],
    weight: 5,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 狼群下山 ────
  {
    id: 'l2_wolf_pack',
    name: '狼群下山',
    category: 'disaster',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.6,
      season: ['冬'],
    },
    outcomes: [
      {
        narrative: '寒冬逼得狼群下了山，{regionName}的村民天黑前就紧闭门户。夜里狼嚎声此起彼伏，令人毛骨悚然。早上起来，牲口圈的栅栏被抓得稀烂，少了两只羊。',
        atmosphereTag: '狼群威胁',
        economicEffect: [{ good: 'meat', priceMultiplier: 1.3 }],
        npcMoraleEffect: -12,
      },
      {
        narrative: '一群灰狼趁着夜色摸进了{regionName}的村庄，绿莹莹的眼睛在黑暗中闪烁。猎户们点燃火把驱赶，但狼群饿极了，迟迟不肯退去。这个冬天格外难熬。',
        atmosphereTag: '狼群威胁',
        npcMoraleEffect: -15,
      },
    ],
    weight: 3,
    cooldownTicks: 20,
    priority: 9,
  },

  // ──── 珍稀动物 ────
  {
    id: 'l2_rare_beast',
    name: '珍禽异兽',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
    },
    outcomes: [
      {
        narrative: '有猎人在{regionName}的密林深处看到了罕见的白麝，通体雪白，在树丛间一闪而过。消息传开，不少药商和猎人蠢蠢欲动，想碰碰运气。',
        atmosphereTag: '奇珍异兽',
        economicEffect: [{ good: 'herb', priceMultiplier: 0.9 }, { good: 'fur', priceMultiplier: 0.85 }],
        npcMoraleEffect: 5,
      },
      {
        narrative: '{regionName}的山涧边出现了锦羽山雉，五彩斑斓的尾羽在阳光下流转着光泽。这种鸟已经很多年没人见过了，老猎人说这是山神的使者。',
        atmosphereTag: '奇珍异兽',
        npcMoraleEffect: 3,
      },
    ],
    weight: 3,
    cooldownTicks: 25,
    priority: 7,
  },

  // ──── 猎人丰收 ────
  {
    id: 'l2_hunter_success',
    name: '猎人丰收',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
      season: ['秋'],
    },
    outcomes: [
      {
        narrative: '秋高气爽，正是{regionName}猎户的好时节。猎人们结伴上山，带着猎犬和弓箭，满载而归。山鸡、野兔、麂子挂满了扁担，路过集市时引来一片羡慕的目光。',
        atmosphereTag: '猎获丰收',
        economicEffect: [{ good: 'meat', priceMultiplier: 0.8 }, { good: 'fur', priceMultiplier: 0.85 }],
        npcMoraleEffect: 6,
      },
      {
        narrative: '{regionName}的猎人们在山里搭了临时窝棚，一连驻扎了好几天。功夫不负有心人，这次猎到了一头不小的野猪，够全村人分肉吃了。',
        atmosphereTag: '猎获丰收',
        economicEffect: [{ good: 'meat', priceMultiplier: 0.75 }],
        npcMoraleEffect: 7,
      },
    ],
    weight: 5,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 猎人困境 ────
  {
    id: 'l2_hunter_struggle',
    name: '猎人困境',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
    },
    outcomes: [
      {
        narrative: '{regionName}的猎户们满面愁容，山里的猎物越来越少，一天下来连只兔子都打不着。有些猎户开始琢磨是不是该另谋生路了，可除了打猎，他们什么也不会。',
        atmosphereTag: '猎事萧条',
        economicEffect: [{ good: 'meat', priceMultiplier: 1.5 }],
        npcMoraleEffect: -8,
      },
      {
        narrative: '空手而归的猎人蹲在{regionName}的山脚下发呆。弓弦松了，箭头钝了，连猎犬都瘦了一圈。山里静得不像话，像是被抽空了一样。',
        atmosphereTag: '猎事萧条',
        npcMoraleEffect: -6,
      },
    ],
    weight: 5,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 熊出没 ────
  {
    id: 'l2_bear_sighting',
    name: '熊出没',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.6,
    },
    outcomes: [
      {
        narrative: '{regionName}的樵夫在山路上撞见了一头黑熊，吓得连滚带爬地跑下山。那畜生站起来比人还高，爪子有半尺长。村里赶紧贴出了告示，告诫乡亲们不要单独进山。',
        atmosphereTag: '猛兽出没',
        npcMoraleEffect: -8,
      },
      {
        narrative: '有采药人在{regionName}的山坳里发现了巨大的熊掌印，泥地上的爪痕触目惊心。老猎人看了直摇头：这是一头老熊，伤了不好惹，不伤也够喝一壶的。',
        atmosphereTag: '猛兽出没',
        npcMoraleEffect: -6,
      },
    ],
    weight: 3,
    cooldownTicks: 18,
    priority: 7,
  },

  // ──── 山村宁静 ────
  {
    id: 'l2_mountain_village_peaceful',
    name: '山村宁静',
    category: 'atmosphere',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '{regionName}的山村藏在云雾间，炊烟从青瓦屋顶袅袅升起。溪水潺潺流过村口，几个孩子在石桥上扔石子玩。山风送来松脂的清香，一切都安宁而悠远。',
        atmosphereTag: '山居宁静',
        npcMoraleEffect: 3,
      },
      {
        narrative: '晨曦中的{regionName}如同一幅水墨画，山色空蒙，梯田层叠。鸡鸣声从远处传来，山民们扛着锄头沿着蜿蜒的山路去劳作，脚步声惊飞了几只山雀。',
        atmosphereTag: '山居宁静',
        npcMoraleEffect: 2,
      },
    ],
    weight: 6,
    cooldownTicks: 10,
    priority: 3,
  },

  // ──── 药材丰富 ────
  {
    id: 'l2_medicinal_herbs',
    name: '山间草药',
    category: 'hunting',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'animal',
      thresholdOperator: 'above',
      thresholdValue: 0.4,
      season: ['春', '夏'],
    },
    outcomes: [
      {
        narrative: '春雨过后，{regionName}的山坡上长满了各种草药。采药人背着竹篓攀上悬崖，小心翼翼地采下珍贵的黄芪和当归。今年的药材成色比去年好得多。',
        atmosphereTag: '草药丰盛',
        economicEffect: [{ good: 'herb', priceMultiplier: 0.75 }, { good: 'medicine', priceMultiplier: 0.8 }],
        npcMoraleEffect: 4,
      },
      {
        narrative: '{regionName}的山涧旁，野生的金银花和连翘开得正好。老药师带着徒弟们进山认药，一边走一边讲每种草的药性和用法。空气里弥漫着草药的苦香。',
        atmosphereTag: '草药丰盛',
        economicEffect: [{ good: 'herb', priceMultiplier: 0.8 }],
        npcMoraleEffect: 3,
      },
    ],
    weight: 5,
    cooldownTicks: 12,
    priority: 5,
  },

  // ──── 山体滑坡 ────
  {
    id: 'l2_rockslide',
    name: '山体滑坡',
    category: 'disaster',
    conditions: {
      regionType: ['mountain'],
      thresholdType: 'weather',
      thresholdOperator: 'above',
      thresholdValue: 0.7,
      season: ['秋'],
      weather: ['暴雨', '大暴雨', '连阴雨'],
    },
    outcomes: [
      {
        narrative: '暴雨连下了几天，{regionName}的山体终于撑不住了。轰隆一声巨响，泥石流裹挟着巨石和树木倾泻而下，掩埋了半条山路。所幸村民提前转移，没有伤亡。',
        atmosphereTag: '山体滑坡',
        npcMoraleEffect: -15,
      },
      {
        narrative: '{regionName}的山腰处塌了一大片，露出褐色的泥土和断裂的树根。山脚下的农田被碎石掩埋，道路阻断。村民们望着那片残垣断壁，心有余悸。',
        atmosphereTag: '山体滑坡',
        economicEffect: [{ good: 'herb', priceMultiplier: 1.4 }],
        npcMoraleEffect: -12,
      },
    ],
    weight: 2,
    cooldownTicks: 25,
    priority: 10,
  },
];
