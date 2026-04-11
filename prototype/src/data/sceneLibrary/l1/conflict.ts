// ════════════════════════════════════════
// L1 冲突演出 (8个)
// 群体纠纷、打斗、对抗场景
// ════════════════════════════════════════

import { L1Scene } from '../../../ai/sceneLibrary/types';

const ALL_PROFESSIONS = ['merchant', 'farmer', 'guard', 'doctor', 'hunter', 'blacksmith', 'chef', 'teacher', 'laborer', 'rogue'];

export const L1_CONFLICT_SCENES: L1Scene[] = [
  {
    id: 'l1_market_brawl',
    name: '市场混战',
    category: 'conflict',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      needThreshold: 30,
    },
    outcome: {
      narrative: '{count}个{professionName}在{location}的市场里打成一团，摊子被掀翻菜果撒了一地，围观的人吓得四散。',
      avgEffects: { mood: -12, health: -5, social: -6 },
      atmosphereEffect: '混乱',
    },
    weight: 3,
    cooldownTicks: 8,
    maxPerTick: 2,
  },
  {
    id: 'l1_guard_crackdown',
    name: '衙役清场',
    category: 'conflict',
    conditions: {
      profession: ['guard', 'rogue'],
      dominantNeed: 'safety',
    },
    outcome: {
      narrative: '{count}个衙役和混混在街头对峙，衙役举着棍棒驱散闹事者，混混们嘴上不饶人脚底却抹了油。',
      avgEffects: { mood: -5, health: -3 },
      atmosphereEffect: '紧张',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_land_dispute',
    name: '地界争端',
    category: 'conflict',
    conditions: {
      profession: ['farmer', 'merchant'],
      dominantNeed: 'mood',
      needThreshold: 35,
    },
    outcome: {
      narrative: '{count}个农夫和商贩因地界争端吵得不可开交，一方指着界碑一方拿着地契，谁也不肯退让半步。',
      avgEffects: { mood: -10, social: -8 },
      atmosphereEffect: '对峙',
    },
    weight: 4,
    cooldownTicks: 7,
    maxPerTick: 2,
  },
  {
    id: 'l1_price_war',
    name: '压价竞争',
    category: 'conflict',
    conditions: {
      profession: ['merchant'],
      dominantNeed: 'mood',
      needThreshold: 40,
    },
    outcome: {
      narrative: '{count}个商贩爆发了压价竞争，你降一文我降两文，互相拆台骂骂咧咧，利润被压缩到了骨头里。',
      avgEffects: { copper: -8, mood: -8, social: -5 },
      atmosphereEffect: '敌意',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_drunk_brawl',
    name: '醉酒斗殴',
    category: 'conflict',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      needThreshold: 25,
      timeOfDay: 'night',
    },
    outcome: {
      narrative: '{count}个{professionName}喝多了在酒肆门口斗殴，拳脚无眼桌子板凳砸得稀烂，酒气混着血腥味弥漫开来。',
      avgEffects: { health: -8, mood: -10, copper: -5, social: -4 },
      atmosphereEffect: '暴力',
    },
    weight: 3,
    cooldownTicks: 8,
    maxPerTick: 2,
  },
  {
    id: 'l1_theft_chase',
    name: '追打窃贼',
    category: 'conflict',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      needThreshold: 40,
    },
    outcome: {
      narrative: '{count}个{professionName}追打一个窃贼，抓贼声响彻整条街，众人抄起家伙围追堵截，小偷被按在地上揍了个鼻青脸肿。',
      avgEffects: { mood: 5, health: -2, social: 3 },
      atmosphereEffect: '义愤',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_water_dispute',
    name: '争水风波',
    category: 'conflict',
    conditions: {
      profession: ['farmer', 'laborer'],
      dominantNeed: 'mood',
      needThreshold: 35,
      season: ['summer'],
    },
    outcome: {
      narrative: '{count}个农夫和苦力为争水起了冲突，大旱天谁家的田都得浇，锄头扁担对上了，水渠边吵得不可开交。',
      avgEffects: { mood: -10, health: -3, social: -6 },
      atmosphereEffect: '干旱紧张',
    },
    weight: 3,
    cooldownTicks: 8,
    maxPerTick: 2,
  },
  {
    id: 'l1_rogue_protection',
    name: '收保护费',
    category: 'conflict',
    conditions: {
      profession: ['rogue', 'merchant'],
      dominantNeed: 'safety',
    },
    outcome: {
      narrative: '{count}个混混在{location}向商贩收保护费，笑里藏刀地拍着柜台，商贩们敢怒不敢言地掏出铜板。',
      avgEffects: { copper: -10, mood: -12, safety: -8 },
      atmosphereEffect: '恐吓',
    },
    weight: 4,
    cooldownTicks: 7,
    maxPerTick: 2,
  },
];
