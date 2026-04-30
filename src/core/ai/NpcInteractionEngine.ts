import type { EntityManager } from '../ecs/EntityManager';
import type { RelationSystem } from '../world/RelationSystem';
import type { SeededRandom } from '../utils/random';
import { RelationSystem as RS } from '../world/RelationSystem';
import type { InteractionConsequence } from './ConsequenceEngine';
import { getBriefConsequence, getSceneConsequence } from './BriefConsequences';

// === 交互上下文 ===

export interface InteractionContext {
  player: {
    id: number;
    name: string;
    profession: string;
    hunger: number;
    fatigue: number;
    health: number;
    mood: number;
    copper: number;
    narrativeTags: string[];
    actionPoints: number;
  };
  npc: {
    id: number;
    name: string;
    profession: string;
    personality: string[];
    age: number;
    hunger: number;
    fatigue: number;
    health: number;
    mood: number;
    copper: number;
    narrativeTags: string[];
  };
  relation: number;
  relationLevel: string;
  environment: {
    locationId: string;
    weather: string;
    season: string;
    day: number;
  };
}

// === 交互选项 ===

export type InteractionDepth = 'brief' | 'scene' | 'drama';

export interface InteractionOption {
  id: string;
  text: string;
  depth: InteractionDepth;
  costAp: number;
  costCopper?: number;
  conditionHint?: string;        // 条件不满足时的提示
  conditionMet: boolean;
  sceneId?: string;              // scene/drama级指向的场景ID
  templateId?: string;           // brief级指向的模板ID
  relevanceScore?: number;       // 相关度评分 0-100
  dynamicText?: string;          // 动态生成的选项文案
}

// === 通用模板 ===

export interface InteractionTemplate {
  id: string;
  name: string;
  depth: InteractionDepth;
  costAp: number;
  costCopper?: number;
  condition: (ctx: InteractionContext) => boolean;
  conditionHint?: string;
}

// === RichPerformance 多阶段演出结构 ===

export interface NpcResponseDetail {
  expression: string;      // 表情描写
  gesture: string;         // 动作描写
  dialogue: string;        // 台词
  innerThought?: string;   // 内心独白
}

export interface RichPerformance {
  actionNarrative: string;             // 阶段1: 行动描述
  stageDirection?: string;             // 阶段2: 舞台指示
  npcResponse?: NpcResponseDetail;     // 阶段3: NPC反应
  atmosphere?: string;                 // 阶段4: 氛围描写
  followUpHint?: string;               // 阶段5: 后续钩子
}

// === 上下文衍生选项 ===

export interface ContextualOption {
  id: string;
  baseText: string;                     // 基础文案
  generateDynamicText: (ctx: InteractionContext) => string;  // 动态文案生成器
  depth: InteractionDepth;
  costAp: number;
  costCopper?: number;
  condition: (ctx: InteractionContext) => boolean;
  conditionHint?: string;
  category: string;                     // 分类标签
  baseWeight: number;                   // 基础权重 (1-100)
  relevanceScore: (ctx: InteractionContext) => number;  // 相关度评分
}

// === 运行时状态 ===

export interface InteractionState {
  npcId: number;
  options: InteractionOption[];
  npcGreeting: string;     // NPC开场白
  phase: 'opening' | 'choosing' | 'acting' | 'ended';
  usedOptionIds: Set<string>;  // 本次对话中已使用的选项ID
}

// === NPC开场白生成 ===

function generateGreeting(ctx: InteractionContext): string {
  const { npc, relationLevel, environment } = ctx;
  const weatherComment = generateWeatherComment(environment.weather);

  const greetings: Record<string, string[]> = {
    '至交': [
      `${npc.name}一见你就笑了："哎呀，你可算来了！${weatherComment}"`,
      `"你来得正好！" ${npc.name}拍了拍你的肩膀。`,
    ],
    '好友': [
      `${npc.name}朝你招了招手："哟，正想着你呢。"`,
      `"来了？" ${npc.name}点了点头，${weatherComment}`,
    ],
    '熟人': [
      `${npc.name}客气地点了点头。`,
      `"嗯，${ctx.player.name}。" ${npc.name}应了一声。`,
    ],
    '路人': [
      `${npc.name}看了你一眼，没有特别表示。`,
      `${npc.name}正在忙自己的事，抬头看了看你。`,
    ],
    '嫌隙': [
      `${npc.name}皱了皱眉，不太想搭理你。`,
      `${npc.name}瞥了你一眼，把头转了过去。`,
    ],
    '仇视': [
      `${npc.name}冷冷地说："你又来做什么？"`,
      `"滚远点。" ${npc.name}毫不客气。`,
    ],
    '死敌': [
      `${npc.name}一看到你，脸色就变了。`,
      `${npc.name}攥紧了拳头。`,
    ],
  };

  const options = greetings[relationLevel] ?? greetings['路人']!;
  return options[ctx.environment.day % options.length]!;
}

function generateWeatherComment(weather: string): string {
  const comments: Record<string, string> = {
    '晴': '今天天气不错。',
    '阴': '天阴沉沉的。',
    '雨': '这雨下得烦人。',
    '雪': '天冷得很。',
  };
  return comments[weather] ?? '';
}

// === 多维度动态评分 ===

/** 计算选项的综合得分 */
function calculateOptionScore(
  baseWeight: number,
  ctx: InteractionContext,
  relevanceScore: number,
  usedOptionIds: Set<string>,
  _rng: SeededRandom
): number {
  // 1. 地点加成 (0.5-2.0)
  const locationBonus = getLocationMultiplier(ctx.environment.locationId, ctx.npc.profession);

  // 2. 性格契合度 (0.5-2.0)
  const personalityBonus = getPersonalityMultiplier(ctx.npc.personality, ctx.relationLevel);

  // 3. 关系加成 (-10 ~ +20)
  const relationBonus = getRelationBonus(ctx.relation);

  // 4. 季节天气 (0.8-1.5)
  const seasonWeatherBonus = getSeasonWeatherMultiplier(ctx.environment.season, ctx.environment.weather);

  // 5. 出身协同 (0-15)
  const originBonus = getOriginSynergy(ctx.player.profession, ctx.npc.profession, ctx.relationLevel);

  // 6. 历史互动 (0-10)
  const historyBonus = getHistoryBonus(ctx.player.narrativeTags, ctx.npc.narrativeTags);

  // 7. 重复惩罚 (本次对话中用过的选项降权)
  const freshnessPenalty = usedOptionIds.size > 0 ? 0.7 : 1.0;

  // 综合得分
  return baseWeight * locationBonus * personalityBonus * seasonWeatherBonus * freshnessPenalty
    + relevanceScore + relationBonus + originBonus + historyBonus;
}

/** 地点加成系数 */
function getLocationMultiplier(locationId: string, npcProfession: string): number {
  const locationMap: Record<string, string[]> = {
    'teahouse': ['茶馆老板', '书生', '商贩'],
    'market': ['商贩', '掌柜', '农夫', '屠户'],
    'workshop': ['铁匠', '木匠'],
    'clinic': ['郎中'],
    'temple': ['和尚', '书生'],
    'riverside': ['渔夫', '书生'],
    'mountain': ['猎户'],
    'farmland': ['农夫'],
    'dock': ['渔民', '苦力'],
  };
  const favored = locationMap[locationId] ?? [];
  return favored.includes(npcProfession) ? 1.8 : 1.0;
}

/** 性格契合度系数 */
function getPersonalityMultiplier(personality: string[], relationLevel: string): number {
  if (relationLevel === '仇视' || relationLevel === '死敌') {
    return personality.includes('暴躁') ? 1.5 : 0.8;
  }
  if (relationLevel === '至交' || relationLevel === '好友') {
    return personality.includes('开朗') ? 1.5 : 1.0;
  }
  return 1.0;
}

/** 关系加成分数 */
function getRelationBonus(relation: number): number {
  if (relation >= 60) return 15;
  if (relation >= 40) return 10;
  if (relation >= 20) return 5;
  if (relation <= -30) return -10;
  if (relation <= -10) return -5;
  return 0;
}

/** 季节天气系数 */
function getSeasonWeatherMultiplier(season: string, weather: string): number {
  if (weather === '雨' || weather === '雪') return 0.8;
  if (season === '春') return 1.3;
  if (season === '秋') return 1.2;
  return 1.0;
}

/** 出身协同分数 */
function getOriginSynergy(playerProf: string, npcProf: string, relationLevel: string): number {
  if (playerProf === npcProf) return 12;
  const synergies: Record<string, string[]> = {
    '铁匠': ['木匠', '猎户'],
    '郎中': ['书生', '和尚'],
    '商贩': ['掌柜', '茶馆老板'],
    '书生': ['画工', '伶人'],
  };
  const related = synergies[playerProf] ?? [];
  if (related.includes(npcProf) && (relationLevel === '好友' || relationLevel === '至交')) {
    return 8;
  }
  return 0;
}

/** 历史互动分数 */
function getHistoryBonus(playerTags: string[], npcTags: string[]): number {
  const positiveIntersections = playerTags.filter((t) =>
    npcTags.some((n) => n.includes(t) || t.includes(n))
  ).length;
  return Math.min(positiveIntersections * 2, 10);
}

// === 上下文衍生选项池 ===

function createContextualOptions(): ContextualOption[] {
  return [
    // === 职业专属选项 ===
    {
      id: 'prof_blacksmith_request',
      baseText: '请他打一把短刀',
      generateDynamicText: (ctx) =>
        ctx.relation >= 30 ? '请他打一把称手的兵刃' : '请他帮忙打一把短刀',
      depth: 'scene',
      costAp: 1,
      costCopper: 15,
      condition: (ctx) => ctx.npc.profession === '铁匠' && ctx.player.copper >= 15,
      conditionHint: '需要15文铜钱',
      category: '职业专属',
      baseWeight: 60,
      relevanceScore: (ctx) => ctx.npc.profession === '铁匠' ? 80 : 0,
    },
    {
      id: 'prof_blacksmith_learn',
      baseText: '向他请教淬火之法',
      generateDynamicText: () => '向他请教淬火的诀窍',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.npc.profession === '铁匠' && ctx.relation >= 20,
      conditionHint: '需要好感≥20',
      category: '职业专属',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.player.profession !== ctx.npc.profession && ctx.npc.profession === '铁匠' ? 70 : 0,
    },
    {
      id: 'prof_doctor_diagnose',
      baseText: '询问调理身体之道',
      generateDynamicText: (ctx) =>
        ctx.player.health < 50 ? '让他把把脉，开副方子' : '询问养生之法',
      depth: 'scene',
      costAp: 1,
      costCopper: 8,
      condition: (ctx) => ctx.npc.profession === '郎中' && ctx.player.copper >= 8,
      conditionHint: '需要8文铜钱',
      category: '职业专属',
      baseWeight: 65,
      relevanceScore: (ctx) => ctx.npc.profession === '郎中' ? 85 : 0,
    },
    {
      id: 'prof_merchant_bargain',
      baseText: '讨价还价',
      generateDynamicText: (ctx) =>
        ctx.player.copper > 50 ? '跟他谈谈批量进货的折扣' : '讨价还价',
      depth: 'brief',
      costAp: 0,
      condition: (ctx) => ['商贩', '掌柜'].includes(ctx.npc.profession) && ctx.relation >= 5,
      conditionHint: '需要好感≥5',
      category: '职业专属',
      baseWeight: 55,
      relevanceScore: (ctx) => ['商贩', '掌柜'].includes(ctx.npc.profession) ? 75 : 0,
    },
    {
      id: 'prof_farmer_help',
      baseText: '帮忙干农活',
      generateDynamicText: () => '主动帮忙下地干活',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.npc.profession === '农夫' && ctx.player.health > 40,
      conditionHint: '身体太虚弱',
      category: '职业专属',
      baseWeight: 45,
      relevanceScore: (ctx) => ctx.npc.profession === '农夫' ? 70 : 0,
    },
    {
      id: 'prof_fisherman_buy',
      baseText: '买条新鲜鱼',
      generateDynamicText: (ctx) =>
        ctx.relation >= 30 ? '挑条最新鲜的鱼' : '买条鱼回去吃',
      depth: 'brief',
      costAp: 0,
      costCopper: 6,
      condition: (ctx) => ctx.npc.profession === '渔夫' && ctx.player.copper >= 6,
      conditionHint: '需要6文铜钱',
      category: '职业专属',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.npc.profession === '渔夫' ? 75 : 0,
    },
    {
      id: 'prof_scholar_poetry',
      baseText: '论诗',
      generateDynamicText: (ctx) =>
        ctx.relation >= 40 ? '与他切磋诗词' : '向他请教诗作',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.npc.profession === '书生' && ctx.relation >= 15,
      conditionHint: '需要好感≥15',
      category: '职业专属',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.npc.profession === '书生' ? 80 : 0,
    },
    {
      id: 'prof_martial_practice',
      baseText: '切磋武艺',
      generateDynamicText: (ctx) =>
        ctx.relation >= 50 ? '与他切磋几招' : '向他讨教几式',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) =>
        ['武师', '捕快', '猎户'].includes(ctx.npc.profession) &&
        ctx.player.health > 40 &&
        ctx.relation >= 10,
      conditionHint: '需要身体好且好感≥10',
      category: '职业专属',
      baseWeight: 60,
      relevanceScore: (ctx) => ['武师', '捕快', '猎户'].includes(ctx.npc.profession) ? 75 : 0,
    },
    {
      id: 'prof_performer_listen',
      baseText: '听曲',
      generateDynamicText: (ctx) =>
        ctx.relation >= 35 ? '去后台听她弹首私曲' : '点首曲子听',
      depth: 'scene',
      costAp: 1,
      costCopper: 10,
      condition: (ctx) => ctx.npc.profession === '伶人' && ctx.player.copper >= 10,
      conditionHint: '需要10文铜钱',
      category: '职业专属',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.npc.profession === '伶人' ? 80 : 0,
    },
    {
      id: 'prof_painter_request',
      baseText: '求画',
      generateDynamicText: (ctx) =>
        ctx.relation >= 45 ? '请他为你作一幅画' : '求一幅画',
      depth: 'scene',
      costAp: 1,
      costCopper: 20,
      condition: (ctx) => ctx.npc.profession === '画工' && ctx.player.copper >= 20,
      conditionHint: '需要20文铜钱',
      category: '职业专属',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.npc.profession === '画工' ? 75 : 0,
    },
    {
      id: 'prof_monk_chat',
      baseText: '请教佛法',
      generateDynamicText: (ctx) =>
        ctx.player.mood < 30 ? '向他倾诉烦恼' : '请教佛法',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.npc.profession === '和尚',
      category: '职业专属',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.npc.profession === '和尚' ? 70 : 0,
    },
    {
      id: 'prof_beggar_info',
      baseText: '打听街巷消息',
      generateDynamicText: (ctx) =>
        ctx.relation >= 25 ? '塞给他几文钱，打听底细' : '打听消息',
      depth: 'scene',
      costAp: 1,
      costCopper: 3,
      condition: (ctx) => ctx.npc.profession === '乞丐' && ctx.player.copper >= 3,
      conditionHint: '需要3文铜钱',
      category: '职业专属',
      baseWeight: 45,
      relevanceScore: (ctx) => ctx.npc.profession === '乞丐' ? 75 : 0,
    },

    // === 天气季节衍生 ===
    {
      id: 'weather_rain_umbrella',
      baseText: '邀她共撑一把伞',
      generateDynamicText: (ctx) =>
        ctx.relation >= 50 ? '共撑一把伞，慢慢走' : '撑伞送她一段',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.environment.weather === '雨' && ctx.relation >= 35,
      conditionHint: '需要雨天且好感≥35',
      category: '天气季节',
      baseWeight: 70,
      relevanceScore: (ctx) => ctx.environment.weather === '雨' ? 90 : 0,
    },
    {
      id: 'weather_rain_shelter',
      baseText: '雨中避雨闲聊',
      generateDynamicText: () => '一起在屋檐下避雨',
      depth: 'brief',
      costAp: 0,
      condition: (ctx) => ctx.environment.weather === '雨',
      category: '天气季节',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.environment.weather === '雨' ? 80 : 0,
    },
    {
      id: 'weather_snow_warmth',
      baseText: '送暖衣',
      generateDynamicText: (ctx) =>
        ctx.relation >= 40 ? '送她一件御寒的衣物' : '提醒她多添衣',
      depth: 'scene',
      costAp: 1,
      costCopper: 15,
      condition: (ctx) => ctx.environment.weather === '雪' && ctx.player.copper >= 15,
      conditionHint: '需要下雪且15文铜钱',
      category: '天气季节',
      baseWeight: 65,
      relevanceScore: (ctx) => ctx.environment.weather === '雪' ? 85 : 0,
    },
    {
      id: 'weather_snow_fire',
      baseText: '围炉夜话',
      generateDynamicText: () => '邀她围着火炉坐坐',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.environment.weather === '雪' && ctx.relation >= 30,
      conditionHint: '需要下雪且好感≥30',
      category: '天气季节',
      baseWeight: 60,
      relevanceScore: (ctx) => ctx.environment.weather === '雪' ? 80 : 0,
    },
    {
      id: 'season_spring_outing',
      baseText: '约她去汴河踏青',
      generateDynamicText: (ctx) =>
        ctx.relation >= 45 ? '春光明媚，一起去踏青吧' : '踏青赏花',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.environment.season === '春' && ctx.relation >= 25,
      conditionHint: '需要春天且好感≥25',
      category: '天气季节',
      baseWeight: 70,
      relevanceScore: (ctx) => ctx.environment.season === '春' ? 85 : 0,
    },
    {
      id: 'season_spring_lantern',
      baseText: '放河灯',
      generateDynamicText: () => '一起去放河灯',
      depth: 'scene',
      costAp: 1,
      costCopper: 5,
      condition: (ctx) => ctx.environment.season === '春' && ctx.player.copper >= 5 && ctx.relation >= 20,
      conditionHint: '需要春天且5文铜钱',
      category: '天气季节',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.environment.season === '春' ? 75 : 0,
    },
    {
      id: 'season_summer_heat',
      baseText: '纳凉',
      generateDynamicText: () => '一起找个凉快的地方歇歇',
      depth: 'brief',
      costAp: 0,
      condition: (ctx) => ctx.environment.season === '夏',
      category: '天气季节',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.environment.season === '夏' ? 70 : 0,
    },
    {
      id: 'season_autumn_moon',
      baseText: '赏月',
      generateDynamicText: (ctx) =>
        ctx.relation >= 40 ? '月色正好，一起赏月吧' : '赏月饮酒',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.environment.season === '秋' && ctx.relation >= 25,
      conditionHint: '需要秋天且好感≥25',
      category: '天气季节',
      baseWeight: 60,
      relevanceScore: (ctx) => ctx.environment.season === '秋' ? 80 : 0,
    },
    {
      id: 'season_winter_wine',
      baseText: '温酒',
      generateDynamicText: () => '一起温酒小酌',
      depth: 'scene',
      costAp: 1,
      costCopper: 8,
      condition: (ctx) => ctx.environment.season === '冬' && ctx.player.copper >= 8,
      conditionHint: '需要冬天且8文铜钱',
      category: '天气季节',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.environment.season === '冬' ? 75 : 0,
    },

    // === 关系阶段衍生 ===
    {
      id: 'relation_stranger_intro',
      baseText: '自报家门',
      generateDynamicText: (ctx) =>
        `在下${ctx.player.name}，敢问阁下尊姓大名？`,
      depth: 'brief',
      costAp: 0,
      condition: (ctx) => ctx.relation >= -10 && ctx.relation < 15,
      category: '关系阶段',
      baseWeight: 40,
      relevanceScore: (ctx) => ctx.relation < 15 ? 70 : 0,
    },
    {
      id: 'relation_acquaintance_chat',
      baseText: '询问近况',
      generateDynamicText: () => '最近过得如何？',
      depth: 'brief',
      costAp: 0,
      condition: (ctx) => ctx.relation >= 15 && ctx.relation < 35,
      category: '关系阶段',
      baseWeight: 45,
      relevanceScore: (ctx) => ctx.relation >= 15 && ctx.relation < 35 ? 65 : 0,
    },
    {
      id: 'relation_friend_vent',
      baseText: '吐槽日常',
      generateDynamicText: () => '聊聊最近的烦心事',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.relation >= 35 && ctx.relation < 55,
      category: '关系阶段',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.relation >= 35 && ctx.relation < 55 ? 70 : 0,
    },
    {
      id: 'relation_close_favor',
      baseText: '借钱周转',
      generateDynamicText: () => '手头紧，能否借些钱？',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.relation >= 55 && ctx.npc.copper >= 30,
      conditionHint: '对方没钱或好感不够',
      category: '关系阶段',
      baseWeight: 60,
      relevanceScore: (ctx) => ctx.relation >= 55 ? 75 : 0,
    },
    {
      id: 'relation_bestie_trust',
      baseText: '托付之事',
      generateDynamicText: () => '有件事想托付给你',
      depth: 'drama',
      costAp: 1,
      condition: (ctx) => ctx.relation >= 65,
      conditionHint: '需要极高好感',
      category: '关系阶段',
      baseWeight: 70,
      relevanceScore: (ctx) => ctx.relation >= 65 ? 90 : 0,
    },

    // === 状态触发衍生 ===
    {
      id: 'state_npc_badmood_comfort',
      baseText: '安慰',
      generateDynamicText: (ctx) =>
        ctx.npc.mood < 20 ? '看他不开心，轻声安慰' : '安慰几句',
      depth: 'brief',
      costAp: 0,
      condition: (ctx) => ctx.npc.mood < 30 && ctx.relation >= 15,
      conditionHint: '对方心情还行',
      category: '状态触发',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.npc.mood < 30 ? 85 : 0,
    },
    {
      id: 'state_npc_sick_care',
      baseText: '关切身体',
      generateDynamicText: () => '看你脸色不好，是否要紧？',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.npc.health < 35 && ctx.relation >= 20,
      conditionHint: '对方身体还行',
      category: '状态触发',
      baseWeight: 60,
      relevanceScore: (ctx) => ctx.npc.health < 35 ? 90 : 0,
    },
    {
      id: 'state_npc_poor_help',
      baseText: '接济',
      generateDynamicText: (ctx) =>
        ctx.relation >= 40 ? '悄悄塞给他一些钱' : '接济一下',
      depth: 'scene',
      costAp: 1,
      costCopper: 15,
      condition: (ctx) => ctx.npc.copper < 25 && ctx.player.copper >= 15 && ctx.relation >= 25,
      conditionHint: '对方不困难或好感不够',
      category: '状态触发',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.npc.copper < 25 ? 80 : 0,
    },
    {
      id: 'state_player_rich_treat',
      baseText: '请客',
      generateDynamicText: (ctx) =>
        ctx.relation >= 30 ? '我请你去茶馆坐坐' : '请他吃顿好的',
      depth: 'scene',
      costAp: 1,
      costCopper: 12,
      condition: (ctx) => ctx.player.copper > 80 && ctx.relation >= 10,
      conditionHint: '手头不宽裕',
      category: '状态触发',
      baseWeight: 50,
      relevanceScore: (ctx) => ctx.player.copper > 80 ? 75 : 0,
    },
    {
      id: 'state_player_sick_help',
      baseText: '请求照顾',
      generateDynamicText: () => '身体不适，能否照料一下？',
      depth: 'scene',
      costAp: 1,
      condition: (ctx) => ctx.player.health < 35 && ctx.relation >= 40,
      conditionHint: '身体还行或好感不够',
      category: '状态触发',
      baseWeight: 60,
      relevanceScore: (ctx) => ctx.player.health < 35 ? 85 : 0,
    },
    {
      id: 'state_both_teahouse',
      baseText: '拼桌喝酒',
      generateDynamicText: (ctx) =>
        ctx.relation >= 30 ? '一起拼个桌，慢慢喝' : '拼桌坐坐',
      depth: 'scene',
      costAp: 1,
      costCopper: 6,
      condition: (ctx) => ctx.environment.locationId === 'teahouse' && ctx.player.copper >= 6,
      conditionHint: '不在茶馆或钱不够',
      category: '状态触发',
      baseWeight: 55,
      relevanceScore: (ctx) => ctx.environment.locationId === 'teahouse' ? 80 : 0,
    },
  ];
}

// === 动态选项生成器 ===

function generateDynamicOptions(
  ctx: InteractionContext,
  usedOptionIds: Set<string>,
  _rng: SeededRandom
): InteractionOption[] {
  const contextualOptions = createContextualOptions();
  const scoredOptions: Array<{ option: ContextualOption; score: number }> = [];

  for (const opt of contextualOptions) {
    // 检查条件
    if (!opt.condition(ctx)) continue;
    // 跳过已使用的选项
    if (usedOptionIds.has(opt.id)) continue;

    // 计算综合得分
    const baseWeight = opt.baseWeight;
    const relevanceScore = opt.relevanceScore(ctx);
    const score = calculateOptionScore(baseWeight, ctx, relevanceScore, usedOptionIds, _rng);

    scoredOptions.push({ option: opt, score });
  }

  // 按得分排序，取top-6
  scoredOptions.sort((a, b) => b.score - a.score);
  const topOptions = scoredOptions.slice(0, 6);

  // 转换为 InteractionOption 格式
  return topOptions.map(({ option, score }) => ({
    id: option.id,
    text: option.generateDynamicText(ctx),
    depth: option.depth,
    costAp: option.costAp,
    costCopper: option.costCopper,
    conditionMet: true,
    dynamicText: option.generateDynamicText(ctx),
    relevanceScore: Math.round(score),
  }));
}

// === 通用模板定义 ===

function createTemplates(): InteractionTemplate[] {
  return [
    {
      id: 'chat', name: '闲聊', depth: 'brief', costAp: 0,
      condition: (ctx) => ctx.relation > -50,
      conditionHint: '好感太低',
    },
    {
      id: 'ask_info', name: '打听消息', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation > 0,
      conditionHint: '需要好感>0',
    },
    {
      id: 'gift', name: '送礼', depth: 'brief', costAp: 1, costCopper: 10,
      condition: (ctx) => ctx.player.copper >= 10,
      conditionHint: '需要10文铜钱',
    },
    {
      id: 'trade', name: '交易', depth: 'brief', costAp: 1,
      condition: (ctx) => ['商贩', '掌柜', '茶馆老板'].includes(ctx.npc.profession),
      conditionHint: '对方不是商人',
    },
    {
      id: 'ask_help', name: '求助', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation >= 25,
      conditionHint: '需要好感≥25',
    },
    {
      id: 'invite_tea', name: '邀请喝茶', depth: 'scene', costAp: 1, costCopper: 5,
      condition: (ctx) => ctx.player.copper >= 5 && ctx.relation >= 10,
      conditionHint: '需要5文+好感≥10',
    },
    {
      id: 'provoke', name: '挑衅', depth: 'scene', costAp: 1,
      condition: () => true,
    },
    {
      id: 'learn', name: '请教', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.npc.profession !== ctx.player.profession,
      conditionHint: '职业相同无法请教',
    },
    {
      id: 'rumor', name: '传播消息', depth: 'brief', costAp: 0,
      condition: (ctx) => ctx.player.narrativeTags.length > 0,
      conditionHint: '没有可传播的消息',
    },
    {
      id: 'compliment', name: '恭维', depth: 'brief', costAp: 0,
      condition: () => true,
    },
    {
      id: 'threaten', name: '威胁', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation < 0,
      conditionHint: '好感不低，无需威胁',
    },
    {
      id: 'apologize', name: '道歉', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation < 25 && ctx.player.narrativeTags.some(
        (t) => ['得罪码头帮', '打过架', '偷过食物', '挑衅过'].includes(t),
      ),
      conditionHint: '没有需要道歉的事',
    },
    {
      id: 'flirt', name: '调情', depth: 'brief', costAp: 0,
      condition: (ctx) => ctx.relation >= 15 && ctx.relation < 60,
      conditionHint: '关系不够亲密',
    },
    {
      id: 'bet', name: '打赌', depth: 'scene', costAp: 1, costCopper: 5,
      condition: (ctx) => ctx.player.copper >= 5 && ctx.relation >= 10,
      conditionHint: '需5文铜钱+好感≥10',
    },
    {
      id: 'compete', name: '比试', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation >= 0 && ctx.player.health > 40,
      conditionHint: '身体太虚弱',
    },
    {
      id: 'confess', name: '表白', depth: 'drama', costAp: 1,
      condition: (ctx) => ctx.relation >= 55 && !ctx.player.narrativeTags.includes('已表白过'),
      conditionHint: '好感不够或已表白过',
    },
    {
      id: 'recruit', name: '招募', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation >= 40 && ctx.player.copper >= 50,
      conditionHint: '需好感≥40且50文铜钱',
    },
    {
      id: 'teach', name: '传授', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.npc.profession !== ctx.player.profession && ctx.relation >= 35,
      conditionHint: '需好感≥35且职业不同',
    },
    {
      id: 'borrow_money', name: '借钱', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation >= 45 && ctx.npc.copper >= 30,
      conditionHint: '对方没钱或好感不够',
    },
    {
      id: 'introduce', name: '引荐', depth: 'brief', costAp: 0,
      condition: (ctx) => ctx.relation >= 50,
      conditionHint: '需好感≥50',
    },
    {
      id: 'mock', name: '戏弄', depth: 'brief', costAp: 0,
      condition: (ctx) => ctx.relation > -20 && ctx.relation < 20,
      conditionHint: '关系太熟或太差都不适合',
    },
    {
      id: 'conspire', name: '密谋', depth: 'drama', costAp: 1,
      condition: (ctx) => ctx.relation >= 55 && ctx.npc.personality.some(
        (p) => ['阴沉', '狡猾', '暴躁'].includes(p),
      ),
      conditionHint: '需极高好感+特定性格',
    },
    {
      id: 'comfort', name: '安慰', depth: 'brief', costAp: 0,
      condition: (ctx) => ctx.npc.mood < 30 && ctx.relation >= 15,
      conditionHint: '对方心情还行',
    },
    {
      id: 'request_favor', name: '请求帮忙', depth: 'scene', costAp: 1,
      condition: (ctx) => ctx.relation >= 30,
      conditionHint: '需好感≥30',
    },
    {
      id: 'say_goodbye', name: '告别', depth: 'brief', costAp: 0,
      condition: () => true,
    },
  ];
}

// === 场景匹配（Layer 2）===

interface SpecialScene {
  id: string;
  name: string;
  depth: InteractionDepth;
  condition: (ctx: InteractionContext) => boolean;
}

function createSpecialScenes(): SpecialScene[] {
  return [
    {
      id: 'learn_craft',
      name: '讨教技艺',
      depth: 'scene',
      condition: (ctx) =>
        ctx.relation >= 20 &&
        ['铁匠', '木匠', '郎中'].includes(ctx.npc.profession) &&
        ctx.player.narrativeTags.some((t) => ['铁匠学徒', '学过打铁'].includes(t)),
    },
    {
      id: 'share_umbrella',
      name: '共撑一把伞',
      depth: 'scene',
      condition: (ctx) =>
        ctx.relation >= 50 &&
        ['雨', '雪'].includes(ctx.environment.weather),
    },
    {
      id: 'check_health',
      name: '关切地问身体状况',
      depth: 'scene',
      condition: (ctx) =>
        ctx.npc.health < 30 && ctx.relation >= 25,
    },
    {
      id: 'conflict_escalation',
      name: '正面冲突',
      depth: 'drama',
      condition: (ctx) =>
        ctx.relation < -30 &&
        ctx.npc.personality.some((p) => ['暴躁', '贪婪'].includes(p)),
    },
    {
      id: 'mention_cave',
      name: '提到山中洞穴',
      depth: 'scene',
      condition: (ctx) =>
        ctx.player.narrativeTags.includes('知道山洞位置') &&
        ctx.npc.profession === '猎户',
    },
    {
      id: 'old_friend_catchup',
      name: '叙旧',
      depth: 'scene',
      condition: (ctx) => ctx.relation >= 60,
    },
    {
      id: 'poor_npc_help',
      name: '接济',
      depth: 'scene',
      condition: (ctx) =>
        ctx.npc.copper < 20 && ctx.relation >= 30 && ctx.player.copper >= 30,
    },
    {
      id: 'romance_blossom',
      name: '情愫暗生',
      depth: 'scene',
      condition: (ctx) =>
        ctx.relation >= 35 && ctx.relation < 60 && ctx.environment.season === '春',
    },
    {
      id: 'rivalry',
      name: '较劲',
      depth: 'scene',
      condition: (ctx) =>
        ctx.relation >= 10 && ctx.relation < 45 && ctx.npc.personality.includes('暴躁'),
    },
    {
      id: 'mentorship',
      name: '拜师学艺',
      depth: 'drama',
      condition: (ctx) =>
        ctx.relation >= 50 && ctx.player.narrativeTags.includes('学过' + ctx.npc.profession),
    },
    {
      id: 'business_partnership',
      name: '合伙做生意',
      depth: 'scene',
      condition: (ctx) =>
        ctx.relation >= 40 && ctx.player.copper >= 30 && ctx.npc.copper >= 20
        && ['商贩', '掌柜', '茶馆老板'].includes(ctx.npc.profession),
    },
    {
      id: 'blood_oath',
      name: '结拜兄弟',
      depth: 'drama',
      condition: (ctx) =>
        ctx.relation >= 65 && ctx.npc.personality.some(
          (p) => ['豪爽', '义气', '正直'].includes(p),
        ),
    },
    {
      id: 'secret_shared',
      name: '倾诉秘密',
      depth: 'scene',
      condition: (ctx) =>
        ctx.relation >= 55 && ctx.player.narrativeTags.length >= 3,
    },
    {
      id: 'rescue_from_danger',
      name: '危难相救',
      depth: 'drama',
      condition: (ctx) =>
        ctx.relation >= 30 && ctx.player.health < 30,
    },
    {
      id: 'drinking_challenge',
      name: '酒桌较量',
      depth: 'scene',
      condition: (ctx) =>
        ctx.environment.locationId === 'teahouse' && ctx.relation >= 10,
    },
    {
      id: 'gambling_debt_help',
      name: '赌债纠纷',
      depth: 'scene',
      condition: (ctx) =>
        ctx.npc.copper < 10 && ctx.relation >= 20 && ctx.player.copper >= 20,
    },
    {
      id: 'family_introduction',
      name: '引见家人',
      depth: 'scene',
      condition: (ctx) => ctx.relation >= 60,
    },
  ];
}

// === 交互引擎 ===

export class NpcInteractionEngine {
  private templates: InteractionTemplate[];
  private specialScenes: SpecialScene[];
  private state: InteractionState | null = null;
  private em: EntityManager;
  private relations: RelationSystem;
  private _rng: SeededRandom;
  private _playerId: number | null = null;

  constructor(em: EntityManager, relations: RelationSystem, _rng: SeededRandom) {
    this.em = em;
    this.relations = relations;
    this._rng = _rng;
    this.templates = createTemplates();
    this.specialScenes = createSpecialScenes();
  }

  /** 构建交互上下文 */
  buildContext(playerId: number, npcId: number, env: {
    locationId: string; weather: string; season: string; day: number;
  }): InteractionContext | null {
    const pVital = this.em.getComponent(playerId, 'Vital');
    const pIdentity = this.em.getComponent(playerId, 'Identity');
    const pWallet = this.em.getComponent(playerId, 'Wallet');
    const pAp = this.em.getComponent(playerId, 'ActionPoints');
    const pMemory = this.em.getComponent(playerId, 'Memory');

    const nVital = this.em.getComponent(npcId, 'Vital');
    const nIdentity = this.em.getComponent(npcId, 'Identity');
    const nWallet = this.em.getComponent(npcId, 'Wallet');
    const nMemory = this.em.getComponent(npcId, 'Memory');

    if (!pVital || !pIdentity || !pWallet || !pAp || !pMemory) return null;
    if (!nVital || !nIdentity || !nWallet) return null;

    const relation = this.relations.getRelation(this.em, playerId, npcId);
    const relationLevel = RS.getRelationLevel(relation);

    return {
      player: {
        id: playerId,
        name: pIdentity.name,
        profession: pIdentity.profession,
        hunger: pVital.hunger,
        fatigue: pVital.fatigue,
        health: pVital.health,
        mood: pVital.mood,
        copper: pWallet.copper,
        narrativeTags: pMemory.narrativeTags,
        actionPoints: pAp.current,
      },
      npc: {
        id: npcId,
        name: nIdentity.name,
        profession: nIdentity.profession,
        personality: nIdentity.personality,
        age: nIdentity.age,
        hunger: nVital.hunger,
        fatigue: nVital.fatigue,
        health: nVital.health,
        mood: nVital.mood,
        copper: nWallet.copper,
        narrativeTags: nMemory?.narrativeTags ?? [],
      },
      relation,
      relationLevel,
      environment: env,
    };
  }

  /** 开始交互 */
  startInteraction(playerId: number, npcId: number, env: {
    locationId: string; weather: string; season: string; day: number;
  }): InteractionState | null {
    this._playerId = playerId;
    const ctx = this.buildContext(playerId, npcId, env);
    if (!ctx) return null;

    // Layer 1: 过滤通用模板（保留兼容）
    const briefOptions: InteractionOption[] = this.templates
      .filter((t) => t.condition(ctx))
      .map((t) => ({
        id: `template_${t.id}`,
        text: t.name,
        depth: t.depth,
        costAp: t.costAp,
        costCopper: t.costCopper,
        conditionMet: true,
        templateId: t.id,
      }));

    // Layer 2: 匹配特殊场景（保留兼容）
    const sceneOptions: InteractionOption[] = this.specialScenes
      .filter((s) => s.condition(ctx))
      .map((s) => ({
        id: `scene_${s.id}`,
        text: s.name,
        depth: s.depth,
        costAp: 1,
        conditionMet: true,
        sceneId: s.id,
      }));

    // Layer 3: 生成动态上下文选项（新）
    const dynamicOptions = generateDynamicOptions(ctx, new Set<string>(), this._rng);

    // 合并所有选项
    const goodbye = briefOptions.find((o) => o.templateId === 'say_goodbye');
    const otherBriefs = briefOptions.filter((o) => o.templateId !== 'say_goodbye');

    // 按depth排序：drama > scene > brief，然后按relevanceScore排序
    const allOptions = [...otherBriefs, ...sceneOptions, ...dynamicOptions];
    allOptions.sort((a, b) => {
      const depthOrder: Record<string, number> = { drama: 3, scene: 2, brief: 1 };
      const depthDiff = (depthOrder[b.depth] ?? 0) - (depthOrder[a.depth] ?? 0);
      if (depthDiff !== 0) return depthDiff;
      // 同depth内按相关度排序
      return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    });

    // 取top-5，加上告别
    const topOptions = allOptions.slice(0, 5);
    const options = goodbye ? [...topOptions, goodbye] : topOptions;

    this.state = {
      npcId,
      options,
      npcGreeting: generateGreeting(ctx),
      phase: 'opening',
      usedOptionIds: new Set<string>(),
    };

    return this.state;
  }

  /** 获取当前状态 */
  getState(): InteractionState | null {
    return this.state;
  }

  /** 获取NPC信息（用于UI） */
  getNpcInfo(npcId: number): {
    name: string; profession: string; personality: string[];
    health: number; mood: number;
  } | null {
    const identity = this.em.getComponent(npcId, 'Identity');
    const vital = this.em.getComponent(npcId, 'Vital');
    if (!identity || !vital) return null;
    return {
      name: identity.name,
      profession: identity.profession,
      personality: identity.personality,
      health: vital.health,
      mood: vital.mood,
    };
  }

  /** 解析玩家选择的选项，返回后果定义 */
  resolveOption(optionId: string, env: {
    locationId: string; weather: string; season: string; day: number;
  }): InteractionConsequence | null {
    if (!this.state || this._playerId === null) return null;

    const option = this.state.options.find((o) => o.id === optionId);
    if (!option) return null;

    // 记录已使用的选项
    this.state.usedOptionIds.add(optionId);

    // 重建上下文
    const ctx = this.buildContext(this._playerId, this.state.npcId, env);
    if (!ctx) return null;

    // 检查AP
    if (option.costAp > 0) {
      const ap = this.em.getComponent(this._playerId, 'ActionPoints');
      if (!ap || ap.current < option.costAp) return null;
    }

    // 检查铜钱
    if (option.costCopper) {
      const wallet = this.em.getComponent(this._playerId, 'Wallet');
      if (!wallet || wallet.copper < option.costCopper) return null;
    }

    // 扣除资源
    if (option.costAp > 0) {
      const ap = this.em.getComponent(this._playerId, 'ActionPoints');
      if (ap) ap.current -= option.costAp;
    }
    if (option.costCopper) {
      const wallet = this.em.getComponent(this._playerId, 'Wallet');
      if (wallet) wallet.copper -= option.costCopper;
    }

    // 获取后果
    if (option.templateId) {
      return getBriefConsequence(option.templateId, ctx);
    }
    if (option.sceneId) {
      return getSceneConsequence(option.sceneId, ctx);
    }

    // 对于上下文衍生选项，动态生成后果
    return getContextualConsequence(optionId, ctx);
  }

  /** 刷新选项（在对话进行中生成新的动态选项） */
  refreshOptions(env: {
    locationId: string; weather: string; season: string; day: number;
  }): InteractionOption[] | null {
    if (!this.state || this._playerId === null) return null;

    const ctx = this.buildContext(this._playerId, this.state.npcId, env);
    if (!ctx) return null;

    // 生成新的动态选项（排除已使用的）
    const dynamicOptions = generateDynamicOptions(ctx, this.state.usedOptionIds, this._rng);

    // 保留原选项中的 goodbye
    const goodbye = this.state.options.find((o) => o.templateId === 'say_goodbye');

    // 合并并排序
    const allOptions = [...dynamicOptions];
    if (goodbye) allOptions.push(goodbye);

    allOptions.sort((a, b) => {
      const depthOrder: Record<string, number> = { drama: 3, scene: 2, brief: 1 };
      const depthDiff = (depthOrder[b.depth] ?? 0) - (depthOrder[a.depth] ?? 0);
      if (depthDiff !== 0) return depthDiff;
      return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    });

    // 更新状态
    this.state.options = allOptions.slice(0, 6);

    return this.state.options;
  }

  /** 结束交互 */
  endInteraction(): void {
    this.state = null;
  }
}

// === 上下文衍生选项的后果生成 ===

function getContextualConsequence(
  optionId: string,
  ctx: InteractionContext
): InteractionConsequence {
  const map: Record<string, () => InteractionConsequence> = {
    // 职业专属
    prof_blacksmith_request: () => ({
      narrative: () =>
        `${ctx.npc.name}接过铜钱，点了点头："三天后来取。"他转身走向炉台，开始生火。`,
      stageDirection: () => '炉火映红了他的脸庞，铁锤有节奏地敲击着。',
      playerCopper: -15,
      npcVital: { mood: 5 },
      relationChange: 3,
      playerGainTag: '定制过兵刃',
    }),

    prof_blacksmith_learn: () => ({
      narrative: () =>
        `${ctx.npc.name}放下手中的活计，拿起一块铁料演示："淬火讲究火候，水温要适中..."`,
      stageDirection: () => '他手把手教了你几个诀窍。',
      playerVital: { mood: 5 },
      playerGainTag: '学过淬火',
      relationChange: 4,
    }),

    prof_doctor_diagnose: () => ({
      narrative: () =>
        `郎中让${ctx.npc.name}坐下，细细把脉，又看了看舌苔。片刻后写下方子："体质虚寒，温补调理。"`,
      stageDirection: () => '药香弥漫，郎中在纸上写下几味药材。',
      playerCopper: -8,
      playerVital: { health: 8 },
      relationChange: 2,
    }),

    prof_merchant_bargain: () => ({
      narrative: () =>
        `${ctx.npc.name}犹豫了一下，最终松口："好吧，给你九五折，这已经是最低了。"`,
      playerVital: { mood: 2 },
      relationChange: 1,
    }),

    prof_farmer_help: () => ({
      narrative: () =>
        `${ctx.npc.name}有些不好意思："这怎么好意思..."但见你坚持，便递过来一把锄头。一起干了一下午活。`,
      stageDirection: () => '夕阳西下，两人坐在田埂上擦汗。',
      playerVital: { fatigue: 15, hunger: 10 },
      npcVital: { mood: 8, fatigue: -5 },
      relationChange: 5,
    }),

    prof_fisherman_buy: () => ({
      narrative: () =>
        `${ctx.npc.name}从鱼篓里挑了一条最新鲜的鱼，用草绳穿好递给你。`,
      playerCopper: -6,
      playerVital: { hunger: 8 },
      relationChange: 1,
    }),

    prof_scholar_poetry: () => ({
      narrative: () =>
        `${ctx.npc.name}眼睛一亮："你也爱诗？"两人你来我往，背诵了几首佳作，越聊越投机。`,
      stageDirection: () => '茶几上摊开几卷诗书，两人相谈甚欢。',
      playerVital: { mood: 6 },
      relationChange: 3,
    }),

    prof_martial_practice: () => ({
      narrative: () => {
        const playerWins = ctx.player.health > ctx.npc.health;
        return playerWins
          ? `你和${ctx.npc.name}过了几招，你略占上风！对方赞道："好身手！"`
          : `${ctx.npc.name}的实力果然高出一筹，你输得心服口服。`;
      },
      stageDirection: () => '两人收势而立，互相抱拳。',
      playerVital: { fatigue: 12 },
      relationChange: 4,
    }),

    prof_performer_listen: () => ({
      narrative: () =>
        `${ctx.npc.name}轻拨琴弦，一首《平沙落雁》悠悠响起。曲终，她朝你盈盈一拜。`,
      stageDirection: () => '琴声悠扬，余音袅袅。',
      playerCopper: -10,
      playerVital: { mood: 10 },
      relationChange: 3,
    }),

    prof_painter_request: () => ({
      narrative: () =>
        `${ctx.npc.name}铺开宣纸，研墨运笔。不多时，一幅山水图跃然纸上，意境深远。`,
      stageDirection: () => '墨香四溢，画作栩栩如生。',
      playerCopper: -20,
      playerVital: { mood: 8 },
      relationChange: 4,
      playerGainTag: '藏有画作',
    }),

    prof_monk_chat: () => ({
      narrative: () =>
        `${ctx.npc.name}双手合十，缓缓说道："施主，人生苦短，何必执念太深..."一番话让你心胸豁然开朗。`,
      playerVital: { mood: 7 },
      relationChange: 2,
    }),

    prof_beggar_info: () => ({
      narrative: () =>
        `乞丐接过铜钱，嘿嘿一笑："城东那座荒庙，晚上不太平，别去了。"`,
      playerCopper: -3,
      playerGainTag: '知道荒庙传闻',
      relationChange: 1,
    }),

    // 天气季节
    weather_rain_umbrella: () => ({
      narrative: () =>
        `雨越下越大，你撑开伞，两人靠得更近了些。${ctx.npc.name}轻声说："谢谢你..."`,
      stageDirection: () => '雨中一把伞下，两道身影依偎前行。',
      playerVital: { mood: 10 },
      npcVital: { mood: 10 },
      relationChange: 6,
      playerGainTag: '共撑过伞',
    }),

    weather_rain_shelter: () => ({
      narrative: () =>
        `两人在屋檐下避雨，看雨帘如瀑。闲聊几句，倒也惬意。`,
      playerVital: { mood: 3 },
      relationChange: 1,
    }),

    weather_snow_warmth: () => ({
      narrative: () =>
        `你拿出一件厚衣递给${ctx.npc.name}。对方眼里闪过一丝感动："这雪天，还是你贴心..."`,
      stageDirection: () => '雪花飘落，她接过衣物，紧了紧领口。',
      playerCopper: -15,
      playerVital: { mood: 5 },
      npcVital: { mood: 8 },
      relationChange: 5,
    }),

    weather_snow_fire: () => ({
      narrative: () =>
        `两人围坐在火炉旁，烤火取暖。外面雪花纷飞，屋里温暖如春。聊着聊着，不知不觉天黑了。`,
      stageDirection: () => '炉火噼啪作响，映红了两人脸庞。',
      playerVital: { mood: 8 },
      npcVital: { mood: 8 },
      relationChange: 4,
    }),

    season_spring_outing: () => ({
      narrative: () =>
        `春光明媚，你和${ctx.npc.name}沿着汴河慢慢走着。柳丝轻拂，花香袭人，两人都有些醉了。`,
      stageDirection: () => '河畔春色，游人如织。',
      playerVital: { mood: 12 },
      npcVital: { mood: 12 },
      relationChange: 5,
    }),

    season_spring_lantern: () => ({
      narrative: () =>
        `你放了一盏河灯，看着它随水漂流。${ctx.npc.name}也放了一盏，两盏灯渐渐靠在了一起...`,
      stageDirection: () => '河面上灯火点点，载着心愿远去。',
      playerCopper: -5,
      playerVital: { mood: 8 },
      npcVital: { mood: 8 },
      relationChange: 4,
    }),

    season_summer_heat: () => ({
      narrative: () =>
        `天气太热，两人在树荫下歇凉。微风习习，倒也舒坦。`,
      playerVital: { mood: 3, fatigue: 3 },
      relationChange: 1,
    }),

    season_autumn_moon: () => ({
      narrative: () =>
        `月色如水，你和${ctx.npc.name}对坐饮酒。不知不觉聊到深夜，感慨时光匆匆。`,
      stageDirection: () => '秋虫鸣叫，月光洒满庭院。',
      playerVital: { mood: 8 },
      npcVital: { mood: 8 },
      relationChange: 4,
    }),

    season_winter_wine: () => ({
      narrative: () =>
        `温酒一壶，小菜几碟。你和${ctx.npc.name}边喝边聊，驱散了冬夜的寒意。`,
      playerCopper: -8,
      playerVital: { mood: 6, hunger: 5 },
      npcVital: { mood: 6 },
      relationChange: 3,
    }),

    // 关系阶段
    relation_stranger_intro: () => ({
      narrative: () =>
        `${ctx.npc.name}客气地回了礼："幸会幸会。不知阁下从事何业？"`,
      playerVital: { mood: 2 },
      relationChange: 2,
    }),

    relation_acquaintance_chat: () => ({
      narrative: () =>
        `${ctx.npc.name}叹了口气："还行吧，就是最近忙了点。"`,
      playerVital: { mood: 2 },
      relationChange: 1,
    }),

    relation_friend_vent: () => ({
      narrative: () =>
        `你吐了几句槽，${ctx.npc.name}认真地听着，不时点头："是啊，我也遇到过类似的事..."`,
      playerVital: { mood: 5 },
      npcVital: { mood: 3 },
      relationChange: 3,
    }),

    relation_close_favor: () => ({
      narrative: () =>
        `${ctx.npc.name}二话不说，掏出钱袋："拿去应急。什么时候方便再还。"`,
      stageDirection: () => '他拍了拍你的肩膀。',
      playerVital: { mood: 10 },
      relationChange: 5,
      playerGainTag: '借过钱',
    }),

    relation_bestie_trust: () => ({
      narrative: () =>
        `${ctx.npc.name}神色凝重地点了点头："放心，这件事交给我。即便赴汤蹈火，也在所不辞。"`,
      stageDirection: () => '两人对视，眼中满是信任。',
      playerVital: { mood: 15 },
      relationChange: 8,
      playerGainTag: '托付过大事',
    }),

    // 状态触发
    state_npc_badmood_comfort: () => ({
      narrative: () =>
        `你安慰了${ctx.npc.name}几句。对方沉默了一会儿，叹了口气："谢谢你听我说这些。"`,
      npcVital: { mood: 6 },
      relationChange: 3,
    }),

    state_npc_sick_care: () => ({
      narrative: () =>
        `${ctx.npc.name}摆摆手："老毛病了，不碍事。"但眼神里还是流露出一丝感激。`,
      relationChange: 4,
    }),

    state_npc_poor_help: () => ({
      narrative: () =>
        `${ctx.npc.name}有些不好意思，但还是收下了："大恩不言谢，日后定当报答。"`,
      playerCopper: -15,
      npcVital: { mood: 10 },
      relationChange: 8,
      playerGainTag: '乐善好施',
    }),

    state_player_rich_treat: () => ({
      narrative: () =>
        `${ctx.npc.name}笑着答应："那我就不客气了！"两人找了个好座，边吃边聊。`,
      playerCopper: -12,
      playerVital: { mood: 5 },
      npcVital: { mood: 6 },
      relationChange: 3,
    }),

    state_player_sick_help: () => ({
      narrative: () =>
        `${ctx.npc.name}连忙扶住你："你好好休息，我去请郎中。"`,
      relationChange: 5,
    }),

    state_both_teahouse: () => ({
      narrative: () =>
        `你们拼了一桌，点了几个小菜。茶香袅袅，不知不觉聊了很久。`,
      playerCopper: -6,
      playerVital: { mood: 6, hunger: 5 },
      npcVital: { mood: 6 },
      relationChange: 3,
    }),
  };

  const factory = map[optionId];
  if (!factory) {
    return {
      narrative: () => `你和${ctx.npc.name}交谈了几句。`,
      relationChange: 0,
    };
  }
  return factory();
}
