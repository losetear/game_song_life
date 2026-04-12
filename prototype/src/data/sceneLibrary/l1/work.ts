// ════════════════════════════════════════
// L1 工作演出 (20个)
// 每种职业2个：merchant, farmer, guard, doctor, hunter,
//              blacksmith, chef, teacher, laborer, rogue
// ════════════════════════════════════════

import { L1Scene } from '../../../ai/sceneLibrary/types';

const ALL_PROFESSIONS = ['merchant', 'farmer', 'guard', 'doctor', 'hunter', 'blacksmith', 'chef', 'teacher', 'laborer', 'rogue'];

export const L1_WORK_SCENES: L1Scene[] = [
  // ──── 商贩 merchant ────
  {
    id: 'l1_merchant_haggling',
    name: '激烈讨价',
    category: 'work',
    conditions: {
      profession: ['merchant'],
      dominantNeed: 'safety',
      actorTraits: ['精明', '口才好'],
      actorForbiddenTraits: ['害羞'],
    },
    outcome: {
      narrative: '{count}个商贩在{location}激烈讨价还价，唾沫横飞争得面红耳赤，最后一拍桌成交。',
      avgEffects: { mood: 5, copper: 8 },
      atmosphereEffect: '喧闹',
    },
    weight: 8,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_merchant_setup',
    name: '黎明摆摊',
    category: 'work',
    conditions: {
      profession: ['merchant'],
      dominantNeed: 'safety',
      timeOfDay: 'dawn',
      actorTraits: ['勤劳', '精明'],
    },
    outcome: {
      narrative: '{count}个商贩在黎明前支起了摊位，油布一抖铺开货物，趁着天刚亮抢占最好的位置。',
      avgEffects: { fatigue: 5, copper: 6 },
      atmosphereEffect: '勤勉',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 3,
  },

  // ──── 农夫 farmer ────
  {
    id: 'l1_farmer_plowing',
    name: '田间耕地',
    category: 'work',
    conditions: {
      profession: ['farmer'],
      dominantNeed: 'safety',
      timeOfDay: 'day',
      actorTraits: ['勤劳', '坚韧'],
      actorForbiddenTraits: ['懒惰'],
    },
    outcome: {
      narrative: '{count}个农夫在田里耕地，犁铧翻起黑褐色的泥土，汗珠滴在地里无声无息。',
      avgEffects: { fatigue: 10, hunger: -10, copper: 4 },
      atmosphereEffect: '劳作',
    },
    weight: 9,
    cooldownTicks: 3,
    maxPerTick: 5,
  },
  {
    id: 'l1_farmer_irrigation',
    name: '修缮水渠',
    category: 'work',
    conditions: {
      profession: ['farmer'],
      dominantNeed: 'safety',
      actorTraits: ['坚韧', '合作'],
      requireNearbyRelation: 'neighbor',
    },
    outcome: {
      narrative: '{count}个农夫修理水渠，泥巴糊了满手满脸，清渠中的水终于又畅快地流了起来。',
      avgEffects: { fatigue: 8, mood: 3 },
      atmosphereEffect: '协作',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 3,
  },

  // ──── 衙役 guard ────
  {
    id: 'l1_guard_patrol_route',
    name: '穿街巡逻',
    category: 'work',
    conditions: {
      profession: ['guard'],
      dominantNeed: 'safety',
      actorTraits: ['严肃', '正义'],
      actorForbiddenTraits: ['懒惰'],
      requireFactionType: ['official'],
    },
    outcome: {
      narrative: '一队{count}个衙役在{location}穿街过巷，甲胄碰撞叮当作响，路人纷纷让道。',
      avgEffects: { fatigue: 6, mood: 2 },
      atmosphereEffect: '威严',
    },
    weight: 8,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_guard_gate_duty',
    name: '城门值守',
    category: 'work',
    conditions: {
      profession: ['guard'],
      dominantNeed: 'safety',
      timeOfDay: 'day',
      actorTraits: ['严肃', '坚韧'],
      requireFactionType: ['official'],
    },
    outcome: {
      narrative: '{count}个衙役在城门值守，盘查进出行人车辆，长枪立在身旁纹丝不动。',
      avgEffects: { fatigue: 8, hunger: -5 },
      atmosphereEffect: '肃穆',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 2,
  },

  // ──── 大夫 doctor ────
  {
    id: 'l1_doctor_rounds',
    name: '巡诊问药',
    category: 'work',
    conditions: {
      profession: ['doctor'],
      dominantNeed: 'safety',
      actorTraits: ['仁慈', '细心'],
      actorForbiddenTraits: ['冷漠'],
    },
    outcome: {
      narrative: '{count}个大夫在{location}巡诊，药箱背在肩上挨家挨户查看病人，望闻问切一丝不苟。',
      avgEffects: { fatigue: 8, mood: 5, copper: 6 },
      atmosphereEffect: '仁心',
    },
    weight: 7,
    cooldownTicks: 3,
    maxPerTick: 3,
  },
  {
    id: 'l1_doctor_herb_market',
    name: '药市采购',
    category: 'work',
    conditions: {
      profession: ['doctor'],
      dominantNeed: 'safety',
      actorTraits: ['精明', '细心'],
      requireNearbyProfession: ['merchant'],
    },
    outcome: {
      narrative: '{count}个大夫在药市采购，挑拣当归黄芪仔细辨别成色，跟药商就分量讨价还价。',
      avgEffects: { mood: 3, copper: -8 },
      atmosphereEffect: '专业',
    },
    weight: 6,
    cooldownTicks: 5,
    maxPerTick: 2,
  },

  // ──── 猎人 hunter ────
  {
    id: 'l1_hunter_expedition',
    name: '结伴进山',
    category: 'work',
    conditions: {
      profession: ['hunter'],
      dominantNeed: 'safety',
      timeOfDay: 'dawn',
      actorTraits: ['勇敢', '坚韧'],
      actorForbiddenTraits: ['软弱'],
    },
    outcome: {
      narrative: '{count}个猎人结伴进山，弓箭上弦刀在腰间，踏着露水往密林深处走去。',
      avgEffects: { fatigue: 10, copper: 7 },
      atmosphereEffect: '冒险',
    },
    weight: 8,
    cooldownTicks: 5,
    maxPerTick: 2,
  },
  {
    id: 'l1_hunter_trap_check',
    name: '巡查陷阱',
    category: 'work',
    conditions: {
      profession: ['hunter'],
      dominantNeed: 'safety',
      actorTraits: ['耐心', '细心'],
    },
    outcome: {
      narrative: '{count}个猎人在检查陷阱，翻山越岭挨个查看套索和兽夹，运气好的话能带回去几只野兔。',
      avgEffects: { fatigue: 7, hunger: -5, copper: 5 },
      atmosphereEffect: '专注',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 3,
  },

  // ──── 铁匠 blacksmith ────
  {
    id: 'l1_blacksmith_furnace',
    name: '炉前打铁',
    category: 'work',
    conditions: {
      profession: ['blacksmith'],
      dominantNeed: 'safety',
      actorTraits: ['坚韧', '勤劳'],
      actorForbiddenTraits: ['懒惰'],
      dominantMood: 'focused',
    },
    outcome: {
      narrative: '{count}个铁匠守着炉火叮叮当当地打铁，火星四溅映红了黝黑的脸膛，锤起锤落毫不含糊。',
      avgEffects: { fatigue: 12, hunger: -8, copper: 8 },
      atmosphereEffect: '热火朝天',
    },
    weight: 9,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_blacksmith_delivery',
    name: '送货上门',
    category: 'work',
    conditions: {
      profession: ['blacksmith'],
      dominantNeed: 'safety',
      actorTraits: ['踏实'],
      requireNearbyProfession: ['farmer', 'guard'],
    },
    outcome: {
      narrative: '{count}个铁匠送新打的农具，锄头镰刀用草绳捆了背在肩上，挨家挨户交货收钱。',
      avgEffects: { fatigue: 6, copper: 10 },
      atmosphereEffect: '踏实',
    },
    weight: 6,
    cooldownTicks: 4,
    maxPerTick: 2,
  },

  // ──── 厨子 chef ────
  {
    id: 'l1_chef_kitchen',
    name: '灶台忙碌',
    category: 'work',
    conditions: {
      profession: ['chef'],
      dominantNeed: 'safety',
      timeOfDay: 'day',
      actorTraits: ['勤劳', '细心'],
      dominantMood: 'focused',
    },
    outcome: {
      narrative: '{count}个厨子在灶台前忙得热火朝天，蒸笼叠了三层高，炒勺翻飞油烟呛得人直流泪。',
      avgEffects: { fatigue: 10, hunger: -5, copper: 7 },
      atmosphereEffect: '繁忙',
    },
    weight: 8,
    cooldownTicks: 3,
    maxPerTick: 3,
  },
  {
    id: 'l1_chef_market_buy',
    name: '采购食材',
    category: 'work',
    conditions: {
      profession: ['chef'],
      dominantNeed: 'safety',
      timeOfDay: 'dawn',
      actorTraits: ['精明', '勤劳'],
      requireNearbyProfession: ['farmer', 'merchant'],
    },
    outcome: {
      narrative: '{count}个厨子在市场采购食材，掐掐菜叶闻闻鱼肉，挑最鲜的买，跟摊贩熟络地打着招呼。',
      avgEffects: { mood: 4, copper: -10 },
      atmosphereEffect: '新鲜',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 3,
  },

  // ──── 先生 teacher ────
  {
    id: 'l1_teacher_class',
    name: '教书念书',
    category: 'work',
    conditions: {
      profession: ['teacher'],
      dominantNeed: 'safety',
      timeOfDay: 'day',
      actorTraits: ['博学', '耐心'],
      actorForbiddenTraits: ['暴躁'],
    },
    outcome: {
      narrative: '{count}个先生在教一群学童念书，戒尺拍着桌面打拍子，稚嫩的童声摇头晃脑地跟着念。',
      avgEffects: { fatigue: 5, mood: 6, copper: 5 },
      atmosphereEffect: '书声琅琅',
    },
    weight: 8,
    cooldownTicks: 3,
    maxPerTick: 3,
  },
  {
    id: 'l1_teacher_exam',
    name: '主持考试',
    category: 'work',
    conditions: {
      profession: ['teacher'],
      dominantNeed: 'safety',
      actorTraits: ['严肃', '博学'],
      dominantMood: 'focused',
    },
    outcome: {
      narrative: '{count}个先生在主持考试，试卷发了下去便在堂上来回踱步，目光扫过埋头苦写的学童。',
      avgEffects: { fatigue: 6, mood: 2, copper: 4 },
      atmosphereEffect: '严肃',
    },
    weight: 5,
    cooldownTicks: 8,
    maxPerTick: 2,
  },

  // ──── 苦力 laborer ────
  {
    id: 'l1_dock_workers',
    name: '码头搬运',
    category: 'work',
    conditions: {
      profession: ['laborer'],
      dominantNeed: 'safety',
      timeOfDay: 'day',
      actorTraits: ['坚韧', '勤劳'],
      actorForbiddenTraits: ['懒惰'],
    },
    outcome: {
      narrative: '{count}个苦力在码头搬麻袋，肩上的绳子勒进肉里，一步一步踏着跳板往船上走。',
      avgEffects: { fatigue: 15, hunger: -12, copper: 6 },
      atmosphereEffect: '辛劳',
    },
    weight: 9,
    cooldownTicks: 3,
    maxPerTick: 5,
  },
  {
    id: 'l1_laborer_construction',
    name: '帮人盖房',
    category: 'work',
    conditions: {
      profession: ['laborer'],
      dominantNeed: 'safety',
      actorTraits: ['坚韧', '合作'],
      requireNearbyRelation: 'neighbor',
    },
    outcome: {
      narrative: '{count}个苦力在帮人盖房，扛木料和泥浆砌砖墙，喊着号子一起使劲把大梁抬上了墙头。',
      avgEffects: { fatigue: 12, hunger: -10, copper: 7, social: 3 },
      atmosphereEffect: '齐心',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 3,
  },

  // ──── 混混 rogue ────
  {
    id: 'l1_rogue_loitering',
    name: '街角游荡',
    category: 'work',
    conditions: {
      profession: ['rogue'],
      dominantNeed: 'safety',
      actorTraits: ['狡猾', '懒惰'],
      actorForbiddenTraits: ['正义', '勤劳'],
      dominantMood: 'bored',
    },
    outcome: {
      narrative: '{count}个混混在街角游荡，双手插在怀里东张西望，路过的行人都不自觉地加快了脚步。',
      avgEffects: { mood: -2, social: -3 },
      atmosphereEffect: '不安',
    },
    weight: 7,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_rogue_fencing',
    name: '暗中销赃',
    category: 'work',
    conditions: {
      profession: ['rogue'],
      dominantNeed: 'safety',
      timeOfDay: 'night',
      actorTraits: ['狡猾', '精明'],
      actorForbiddenTraits: ['正义'],
      requireFactionType: ['gang'],
    },
    outcome: {
      narrative: '{count}个混混在暗处交换不明来路的物品，压低嗓门快速交割，银货两讫便各自散去。',
      avgEffects: { copper: 12, mood: -3 },
      atmosphereEffect: '诡秘',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 2,
  },
];
