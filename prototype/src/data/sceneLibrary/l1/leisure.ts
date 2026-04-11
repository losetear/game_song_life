// ════════════════════════════════════════
// L1 休闲演出 (12个)
// 群体娱乐、消遣、放松场景
// ════════════════════════════════════════

import { L1Scene } from '../../../ai/sceneLibrary/types';

const ALL_PROFESSIONS = ['merchant', 'farmer', 'guard', 'doctor', 'hunter', 'blacksmith', 'chef', 'teacher', 'laborer', 'rogue'];

export const L1_LEISURE_SCENES: L1Scene[] = [
  {
    id: 'l1_chess_corner',
    name: '棋摊对弈',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'fatigue',
    },
    outcome: {
      narrative: '{count}个{professionName}围在棋摊看人对弈，下棋的捻须沉思，观棋的急得直跺脚恨不得替他落子。',
      avgEffects: { mood: 8, fatigue: -8, social: 4 },
      atmosphereEffect: '悠闲',
    },
    weight: 7,
    cooldownTicks: 3,
    maxPerTick: 4,
  },
  {
    id: 'l1_dice_game',
    name: '掷骰赌钱',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      timeOfDay: 'night',
    },
    outcome: {
      narrative: '{count}个{professionName}围在暗巷里掷骰赌钱，骰子在碗里骨碌碌转，输的拍大腿赢的咧嘴笑。',
      avgEffects: { mood: 5, copper: -6, social: 3 },
      atmosphereEffect: '刺激',
    },
    weight: 5,
    cooldownTicks: 4,
    maxPerTick: 3,
  },
  {
    id: 'l1_hot_spring',
    name: '温泉泡澡',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'fatigue',
      needThreshold: 40,
    },
    outcome: {
      narrative: '{count}个{professionName}在温泉里泡澡，热水漫过肩膀一天的疲惫全化开了，蒸汽氤氲中有人哼起了小曲。',
      avgEffects: { fatigue: -20, mood: 12, hunger: -5, copper: -5 },
      atmosphereEffect: '惬意',
    },
    weight: 5,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_kite_flying',
    name: '放风筝',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      timeOfDay: 'day',
      season: ['spring'],
    },
    outcome: {
      narrative: '{count}个{professionName}在空地上放风筝，纸鸢乘风扶摇直上，线轴飞快地转着，欢笑声飘荡在春风里。',
      avgEffects: { mood: 10, fatigue: -5, social: 4 },
      atmosphereEffect: '欢快',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 3,
  },
  {
    id: 'l1_fishing_group',
    name: '河边钓鱼',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'fatigue',
      timeOfDay: 'day',
    },
    outcome: {
      narrative: '{count}个{professionName}在河边钓鱼，鱼竿一字排开浮漂在水面轻轻晃动，半天不上鱼也不着急，图的就是这份清净。',
      avgEffects: { mood: 8, fatigue: -10, social: 3 },
      atmosphereEffect: '宁静',
    },
    weight: 6,
    cooldownTicks: 4,
    maxPerTick: 3,
  },
  {
    id: 'l1_music_jam',
    name: '街头奏乐',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      timeOfDay: 'dusk',
    },
    outcome: {
      narrative: '{count}个{professionName}聚在一起奏乐，二胡琵琶笛子各显神通，曲调悠扬引得路人纷纷驻足。',
      avgEffects: { mood: 12, social: 6, fatigue: -5 },
      atmosphereEffect: '艺术',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 3,
  },
  {
    id: 'l1_singing_night',
    name: '月下对歌',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      timeOfDay: 'night',
    },
    outcome: {
      narrative: '{count}个{professionName}在月下对歌，你一句我一句此起彼伏，歌声在夜色中回荡，引得邻里推开窗户倾听。',
      avgEffects: { mood: 10, social: 7, fatigue: -3 },
      atmosphereEffect: '浪漫',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
  {
    id: 'l1_board_game',
    name: '牌局消遣',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'fatigue',
      needThreshold: 55,
    },
    outcome: {
      narrative: '{count}个{professionName}围坐打牌消遣，四个人搓一圈麻将骨牌碰得哗啦响，茶水续了一壶又一壶。',
      avgEffects: { mood: 7, fatigue: -8, social: 5, copper: -2 },
      atmosphereEffect: '消遣',
    },
    weight: 6,
    cooldownTicks: 3,
    maxPerTick: 3,
  },
  {
    id: 'l1_storytelling_circle',
    name: '围炉故事',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'social',
      timeOfDay: 'night',
      season: ['winter'],
    },
    outcome: {
      narrative: '{count}个{professionName}围在火炉边讲故事，柴火噼啪作响映红了众人的脸，鬼故事吓得胆小的直往人堆里缩。',
      avgEffects: { mood: 10, social: 7, fatigue: -5 },
      atmosphereEffect: '温暖',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 3,
  },
  {
    id: 'l1_picnic_riverside',
    name: '河边野餐',
    category: 'leisure',
    conditions: {
      profession: ALL_PROFESSIONS,
      dominantNeed: 'mood',
      timeOfDay: 'day',
      season: ['spring'],
    },
    outcome: {
      narrative: '{count}个{professionName}在河边铺开布帕野餐，河水清澈柳枝垂拂，春风带着花香把饭菜都衬得更香了。',
      avgEffects: { mood: 12, hunger: 15, social: 6 },
      atmosphereEffect: '春意',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 3,
  },
  {
    id: 'l1_wrestling_match',
    name: '摔跤比赛',
    category: 'leisure',
    conditions: {
      profession: ['guard', 'hunter', 'laborer', 'farmer', 'rogue'],
      dominantNeed: 'mood',
      timeOfDay: 'day',
    },
    outcome: {
      narrative: '{count}个{professionName}在空地上举行摔跤比赛，两人扭成一团难分难解，围观者叫好声震天，赌谁赢的铜板押了一地。',
      avgEffects: { mood: 8, fatigue: 5, social: 5 },
      atmosphereEffect: '热烈',
    },
    weight: 5,
    cooldownTicks: 5,
    maxPerTick: 2,
  },
  {
    id: 'l1_poetry_recital',
    name: '诗会雅集',
    category: 'leisure',
    conditions: {
      profession: ['teacher', 'doctor', 'merchant'],
      dominantNeed: 'mood',
    },
    outcome: {
      narrative: '{count}个先生大夫和商贩在诗会上吟诗作对，宣纸铺开墨香四溢，一句好诗引得众人抚掌叫绝。',
      avgEffects: { mood: 10, social: 6, fatigue: -5 },
      atmosphereEffect: '雅致',
    },
    weight: 4,
    cooldownTicks: 6,
    maxPerTick: 2,
  },
];
