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

// === 运行时状态 ===

export interface InteractionState {
  npcId: number;
  options: InteractionOption[];
  npcGreeting: string;     // NPC开场白
  phase: 'opening' | 'choosing' | 'acting' | 'ended';
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
  ];
}

// === 交互引擎 ===

export class NpcInteractionEngine {
  private templates: InteractionTemplate[];
  private specialScenes: SpecialScene[];
  private state: InteractionState | null = null;
  private em: EntityManager;
  private relations: RelationSystem;
  private _playerId: number | null = null;

  constructor(em: EntityManager, relations: RelationSystem, _rng: SeededRandom) {
    this.em = em;
    this.relations = relations;
    // TODO: _rng 将在未来用于随机化交互选项和NPC反应
    void _rng; // 暂时抑制未使用参数警告
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

    // Layer 1: 过滤通用模板
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

    // Layer 2: 匹配特殊场景
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

    // 合并选项：drama > scene > brief，告别永远在最后
    const goodbye = briefOptions.find((o) => o.templateId === 'say_goodbye');
    const others = briefOptions
      .filter((o) => o.templateId !== 'say_goodbye')
      .concat(sceneOptions)
      .sort((a, b) => {
        const depthOrder: Record<string, number> = { drama: 3, scene: 2, brief: 1 };
        return (depthOrder[b.depth] ?? 0) - (depthOrder[a.depth] ?? 0);
      })
      .slice(0, 5); // 最多5个（加上告别共6个）

    const options = goodbye ? [...others, goodbye] : others;

    this.state = {
      npcId,
      options,
      npcGreeting: generateGreeting(ctx),
      phase: 'opening',
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

    return {
      narrative: () => `你和${ctx.npc.name}交谈了几句。`,
      relationChange: 0,
    };
  }

  /** 结束交互 */
  endInteraction(): void {
    this.state = null;
  }
}
