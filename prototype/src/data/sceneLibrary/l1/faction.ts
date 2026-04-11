// ════════════════════════════════════════
// L1 阵营演出 (10个)
// 帮派、行会、官府等组织群体活动
// ════════════════════════════════════════

import { L1Scene } from '../../../ai/sceneLibrary/types';

const ALL_PROFESSIONS = ['merchant', 'farmer', 'guard', 'doctor', 'hunter', 'blacksmith', 'chef', 'teacher', 'laborer', 'rogue'];

export const L1_FACTION_SCENES: L1Scene[] = [
  {
    id: 'l1_guild_meeting',
    name: '行会议事',
    category: 'faction',
    conditions: {
      profession: ['merchant', 'blacksmith', 'chef'],
      dominantNeed: 'safety',
      minGroupSize: 3,
    },
    outcome: {
      narrative: '{count}个商贩铁匠和厨子聚在行会里议事，商定今年的行规和物价，意见不一的拍桌吵嚷，统一的点头附和。',
      avgEffects: { copper: 5, mood: 3, social: 6 },
      atmosphereEffect: '庄重',
    },
    weight: 5,
    cooldownTicks: 8,
    maxPerTick: 2,
  },
  {
    id: 'l1_guard_shift_change',
    name: '衙役换班',
    category: 'faction',
    conditions: {
      profession: ['guard'],
      dominantNeed: 'fatigue',
      timeOfDay: 'dawn',
    },
    outcome: {
      narrative: '{count}个衙役在城门口换班，夜班的面带倦色交了钥匙，白班的束紧腰带接过令牌，一切井然有序。',
      avgEffects: { fatigue: -8, mood: 3, social: 3 },
      atmosphereEffect: '肃整',
    },
    weight: 7,
    cooldownTicks: 4,
    maxPerTick: 3,
  },
  {
    id: 'l1_rogue_gang_turf',
    name: '混混占地盘',
    category: 'faction',
    conditions: {
      profession: ['rogue'],
      dominantNeed: 'safety',
      minGroupSize: 3,
    },
    outcome: {
      narrative: '{count}个混混在{location}宣示地盘，叉腰瞪眼摆出一副不好惹的架势，警告外人别越界。',
      avgEffects: { mood: -3, social: -5 },
      atmosphereEffect: '威胁',
    },
    weight: 4,
    cooldownTicks: 7,
    maxPerTick: 2,
  },
  {
    id: 'l1_farmer_cooperative',
    name: '农人互助',
    category: 'faction',
    conditions: {
      profession: ['farmer'],
      dominantNeed: 'social',
      minGroupSize: 3,
    },
    outcome: {
      narrative: '{count}个农夫自发组织起来互助，今天帮你家收谷明天帮他家修屋顶，有活一起干有力一起出。',
      avgEffects: { fatigue: 8, mood: 6, social: 10 },
      atmosphereEffect: '团结',
    },
    weight: 6,
    cooldownTicks: 5,
    maxPerTick: 3,
  },
  {
    id: 'l1_merchant_caravan_guard',
    name: '商队护卫',
    category: 'faction',
    conditions: {
      profession: ['merchant', 'guard', 'hunter'],
      dominantNeed: 'safety',
    },
    outcome: {
      narrative: '{count}个商贩衙役和猎人组成了商队护卫队，刀枪上膛弓弩在手，护送满载货物的骡车穿过险要路段。',
      avgEffects: { copper: 8, fatigue: 6, mood: 2 },
      atmosphereEffect: '警觉',
    },
    weight: 5,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_temple_charity',
    name: '寺庙善举',
    category: 'faction',
    conditions: {
      profession: ['doctor', 'teacher'],
      dominantNeed: 'mood',
      location: ['temple'],
    },
    outcome: {
      narrative: '{count}个大夫和先生在寺庙里义诊义教，看病的不收钱，识字的不收束修，穷苦人排着队感恩戴德。',
      avgEffects: { mood: 10, social: 8, copper: -5 },
      atmosphereEffect: '慈悲',
    },
    weight: 4,
    cooldownTicks: 8,
    maxPerTick: 2,
  },
  {
    id: 'l1_labor_gang_recruit',
    name: '苦力结帮',
    category: 'faction',
    conditions: {
      profession: ['laborer'],
      dominantNeed: 'safety',
      minGroupSize: 3,
    },
    outcome: {
      narrative: '{count}个苦力结成帮伙揽活，人多力量大能接大活，活干完了一起领工钱，不干活的钱一个子儿也拿不到。',
      avgEffects: { copper: 6, social: 7, mood: 3 },
      atmosphereEffect: '抱团',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 2,
  },
  {
    id: 'l1_faction_celebration',
    name: '帮会庆功',
    category: 'faction',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      needThreshold: 55,
      minGroupSize: 4,
    },
    outcome: {
      narrative: '{count}个{professionName}在帮会庆功宴上举杯痛饮，桌上摆满了好酒好菜，同门兄弟你一句我一句吹着牛皮。',
      avgEffects: { mood: 15, social: 10, hunger: 15, copper: -8 },
      atmosphereEffect: '豪迈',
    },
    weight: 4,
    cooldownTicks: 8,
    maxPerTick: 2,
  },
  {
    id: 'l1_rival_faction_clash',
    name: '帮派摩擦',
    category: 'faction',
    conditions: {
      profession: ['rogue', 'guard', 'merchant'],
      dominantNeed: 'mood',
      needThreshold: 35,
    },
    outcome: {
      narrative: '{count}个混混衙役和商贩卷入了两派之间的摩擦，互相推搡叫骂剑拔弩张，街面上的气氛骤然紧张起来。',
      avgEffects: { mood: -10, health: -3, social: -8, safety: -8 },
      atmosphereEffect: '危险',
    },
    weight: 3,
    cooldownTicks: 10,
    maxPerTick: 1,
  },
  {
    id: 'l1_oath_ceremony',
    name: '结义仪式',
    category: 'faction',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'social',
      needThreshold: 45,
      minGroupSize: 3,
    },
    outcome: {
      narrative: '{count}个{professionName}举行了结义仪式，焚香磕头歃血为盟，誓言有福同享有难同当，从此便是异姓兄弟。',
      avgEffects: { social: 15, mood: 10, safety: 5 },
      atmosphereEffect: '义气',
    },
    weight: 3,
    cooldownTicks: 12,
    maxPerTick: 1,
  },
];
