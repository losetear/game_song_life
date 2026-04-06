// === 叙事片段系统 — 参考环世界(RimWorld)的留白(Apophenia)技巧 ===
//
// 核心理念：
// - 将NPC的机械行为转化为可观察的、留白式的叙事片段
// - 只描述行为，不解释原因 — 让玩家脑补背后的故事
// - 基于NPC当前状态（情绪、压力、关系、需求）动态选择片段
// - 片段是被动观察视角，像看电影一样

import {
  EmotionType, StressComponent, RelationshipComponent,
  NeedsComponent, HiddenTraitsComponent,
} from '../ecs/types';
import { EntityManager } from '../ecs/entityManager';

// ──── 叙事上下文 ────
export interface NarrativeContext {
  npcId: number;
  npcName: string;
  emotion: EmotionType;
  emotionIntensity: number;
  stress: StressComponent | null;
  needs: NeedsComponent;
  relationship: RelationshipComponent | null;
  hiddenTraits: HiddenTraitsComponent | null;
  currentGrid: string;
  shichen: string;
  weather: string;
  nearNpcIds: number[];
  recentAction: string | null;
  em: EntityManager;
}

// ──── 片段模板 ────
interface FragmentTemplate {
  id: string;
  text: string;                            // 叙事文本（支持 {npcName}, {targetName}, {location} 等占位符）
  condition: (ctx: NarrativeContext) => boolean;  // 匹配条件
  weight: (ctx: NarrativeContext) => number;      // 权重（越高越可能被选中）
  category: string;                        // 片段类别（用于去重）
}

// ──── 辅助函数 ────
function getRandomNearbyNpcName(ctx: NarrativeContext): string {
  if (ctx.nearNpcIds.length === 0) return '某人';
  const targetId = ctx.nearNpcIds[Math.floor(Math.random() * ctx.nearNpcIds.length)];
  const ident = ctx.em.getComponent(targetId, 'Identity');
  return ident?.name || '某人';
}

function getBestFriendNearby(ctx: NarrativeContext): string | null {
  if (!ctx.relationship) return null;
  for (const tid of ctx.nearNpcIds) {
    const r = ctx.relationship.relations[tid];
    if (r && r.score >= 21) {
      const ident = ctx.em.getComponent(tid, 'Identity');
      return ident?.name || null;
    }
  }
  return null;
}

function getEnemyNearby(ctx: NarrativeContext): string | null {
  if (!ctx.relationship) return null;
  for (const tid of ctx.nearNpcIds) {
    const r = ctx.relationship.relations[tid];
    if (r && r.score <= -21) {
      const ident = ctx.em.getComponent(tid, 'Identity');
      return ident?.name || null;
    }
  }
  return null;
}

function isNight(shichen: string): boolean {
  return ['亥', '子', '丑', '寅'].includes(shichen);
}

// ──── 20+ 片段模板 ────
const FRAGMENTS: FragmentTemplate[] = [
  // ──── 孤独/社交需求 ────
  {
    id: 'lonely_corner',
    text: '{npcName}一个人坐在角落里不说话。',
    condition: (ctx) => ctx.needs.social < 30 && ctx.nearNpcIds.length > 0,
    weight: (ctx) => (100 - ctx.needs.social) * 0.3,
    category: 'social',
  },
  {
    id: 'door_waiting',
    text: '{npcName}站在门口望了很久。',
    condition: (ctx) => ctx.needs.social < 40 && ctx.relationship !== null,
    weight: (ctx) => (100 - ctx.needs.social) * 0.2,
    category: 'social',
  },
  {
    id: 'eyes_bright',
    text: '{npcName}看到{targetName}时眼睛亮了一下。',
    condition: (ctx) => {
      const friend = getBestFriendNearby(ctx);
      return friend !== null && ctx.needs.social < 60;
    },
    weight: (ctx) => ctx.needs.social < 40 ? 15 : 5,
    category: 'social',
  },
  {
    id: 'walk_past_ignore',
    text: '{npcName}急匆匆地从{targetName}身边走过，看都没看一眼。',
    condition: (ctx) => getEnemyNearby(ctx) !== null,
    weight: (ctx) => 10,
    category: 'social',
  },
  {
    id: 'hesitate_speak',
    text: '{npcName}在{targetName}身边走来走去，欲言又止。',
    condition: (ctx) => {
      if (ctx.needs.social < 50) return false;
      return getBestFriendNearby(ctx) !== null && ctx.emotion === 'tense';
    },
    weight: (ctx) => 12,
    category: 'social',
  },
  {
    id: 'approach_quickly',
    text: '{npcName}突然加快了脚步，朝{targetName}的方向走去。',
    condition: (ctx) => ctx.needs.social > 70 && ctx.nearNpcIds.length > 0,
    weight: (ctx) => 8,
    category: 'social',
  },

  // ──── 压力/焦虑 ────
  {
    id: 'sigh_sky',
    text: '{npcName}对着天空叹了口气。',
    condition: (ctx) => ctx.stress !== null && ctx.stress.level > 40,
    weight: (ctx) => ctx.stress ? ctx.stress.level * 0.15 : 0,
    category: 'stress',
  },
  {
    id: 'night_light',
    text: '在深夜还点着灯，{npcName}在忙碌着什么。',
    condition: (ctx) => isNight(ctx.shichen) && ctx.stress !== null && ctx.stress.level > 30,
    weight: (ctx) => ctx.stress ? ctx.stress.level * 0.12 : 0,
    category: 'stress',
  },
  {
    id: 'hold_item_daze',
    text: '{npcName}手里拿着什么东西发呆。',
    condition: (ctx) => ctx.emotion === 'sad' || (ctx.stress !== null && ctx.stress.level > 50),
    weight: (ctx) => ctx.emotion === 'sad' ? 12 : 6,
    category: 'stress',
  },
  {
    id: 'pace_anxious',
    text: '{npcName}在原地来回踱步，神色不安。',
    condition: (ctx) => ctx.stress !== null && ctx.stress.level > 60,
    weight: (ctx) => ctx.stress ? ctx.stress.level * 0.1 : 0,
    category: 'stress',
  },
  {
    id: 'mutter_alone',
    text: '{npcName}一个人自言自语，不知道在说什么。',
    condition: (ctx) => ctx.stress !== null && ctx.stress.level > 70,
    weight: (ctx) => ctx.stress ? ctx.stress.level * 0.08 : 0,
    category: 'stress',
  },

  // ──── 金钱/经济 ────
  {
    id: 'touch_pouch',
    text: '{npcName}反复摸着腰间的钱袋。',
    condition: (ctx) => {
      const wallet = ctx.em.getComponent(ctx.npcId, 'Wallet');
      return !!wallet && wallet.copper < 30;
    },
    weight: (ctx) => {
      const wallet = ctx.em.getComponent(ctx.npcId, 'Wallet');
      return wallet ? Math.max(0, (30 - wallet.copper)) * 0.3 : 0;
    },
    category: 'economy',
  },
  {
    id: 'stare_goods',
    text: '{npcName}盯着摊位上的东西看了好一会儿，最后还是走开了。',
    condition: (ctx) => {
      const wallet = ctx.em.getComponent(ctx.npcId, 'Wallet');
      return !!wallet && wallet.copper < 20;
    },
    weight: (ctx) => {
      const wallet = ctx.em.getComponent(ctx.npcId, 'Wallet');
      return wallet ? Math.max(0, (20 - wallet.copper)) * 0.4 : 0;
    },
    category: 'economy',
  },

  // ──── 疲劳/健康 ────
  {
    id: 'yawn_repeatedly',
    text: '{npcName}打了个长长的哈欠，眼圈有些发黑。',
    condition: (ctx) => ctx.needs.fatigue < 30,
    weight: (ctx) => (100 - ctx.needs.fatigue) * 0.2,
    category: 'fatigue',
  },
  {
    id: 'lean_wall',
    text: '{npcName}靠在墙上，半闭着眼睛，似乎随时要睡着。',
    condition: (ctx) => ctx.needs.fatigue < 20,
    weight: (ctx) => (100 - ctx.needs.fatigue) * 0.25,
    category: 'fatigue',
  },
  {
    id: 'hold_stomach',
    text: '{npcName}捂着肚子，脸色有些发白。',
    condition: (ctx) => ctx.needs.hunger < 20,
    weight: (ctx) => (100 - ctx.needs.hunger) * 0.25,
    category: 'hunger',
  },

  // ──── 情绪/快乐 ────
  {
    id: 'hum_song',
    text: '{npcName}哼着小曲，脚步轻快。',
    condition: (ctx) => ctx.emotion === 'happy' && ctx.emotionIntensity > 50,
    weight: (ctx) => ctx.emotionIntensity * 0.15,
    category: 'emotion',
  },
  {
    id: 'smile_warm',
    text: '{npcName}嘴角带着一丝淡淡的微笑。',
    condition: (ctx) => ctx.emotion === 'happy' && ctx.needs.mood > 60,
    weight: (ctx) => 8,
    category: 'emotion',
  },
  {
    id: 'fist_clench',
    text: '{npcName}攥紧了拳头，青筋暴起。',
    condition: (ctx) => ctx.emotion === 'angry' && ctx.emotionIntensity > 40,
    weight: (ctx) => ctx.emotionIntensity * 0.12,
    category: 'emotion',
  },
  {
    id: 'look_around',
    text: '{npcName}四下张望，眼神闪烁不定。',
    condition: (ctx) => ctx.emotion === 'tense' && ctx.emotionIntensity > 30,
    weight: (ctx) => ctx.emotionIntensity * 0.1,
    category: 'emotion',
  },
  {
    id: 'stretch_leisure',
    text: '{npcName}伸了个懒腰，看起来很惬意。',
    condition: (ctx) => ctx.needs.fatigue > 70 && ctx.needs.mood > 60,
    weight: (ctx) => 6,
    category: 'emotion',
  },

  // ──── 天气/环境 ────
  {
    id: 'rain_shiver',
    text: '{npcName}缩着脖子在雨中快步走着，衣裳都湿了。',
    condition: (ctx) => ctx.weather === '暴雨' || ctx.weather === '小雨',
    weight: (ctx) => 10,
    category: 'weather',
  },
  {
    id: 'sun_squint',
    text: '{npcName}眯着眼看了看天，阳光刚好。',
    condition: (ctx) => ctx.weather === '晴' && ctx.needs.mood > 50,
    weight: (ctx) => 4,
    category: 'weather',
  },
  {
    id: 'cold_rub_hands',
    text: '{npcName}搓了搓手，往手上哈了口热气。',
    condition: (ctx) => ctx.weather === '雪' || ctx.weather === '大雪',
    weight: (ctx) => 10,
    category: 'weather',
  },

  // ──── 隐藏特征 ────
  {
    id: 'count_coins',
    text: '{npcName}把铜钱一个一个地数了出来，仔细地放进袋子里。',
    condition: (ctx) => ctx.hiddenTraits !== null && ctx.hiddenTraits.greed > 70,
    weight: (ctx) => ctx.hiddenTraits ? ctx.hiddenTraits.greed * 0.08 : 0,
    category: 'trait',
  },
  {
    id: 'help_stranger',
    text: '{npcName}看到路边有人摔倒了，赶紧上前搀扶。',
    condition: (ctx) => ctx.hiddenTraits !== null && ctx.hiddenTraits.honor > 70 && ctx.nearNpcIds.length > 0,
    weight: (ctx) => ctx.hiddenTraits ? ctx.hiddenTraits.honor * 0.06 : 0,
    category: 'trait',
  },
  {
    id: 'cautious_look',
    text: '{npcName}走到街角突然停下，先探出半个头观察了一下。',
    condition: (ctx) => ctx.hiddenTraits !== null && ctx.hiddenTraits.rationality > 75,
    weight: (ctx) => ctx.hiddenTraits ? ctx.hiddenTraits.rationality * 0.05 : 0,
    category: 'trait',
  },
  {
    id: 'ambitious_stare',
    text: '{npcName}站在高处，目光扫过远处的建筑群，若有所思。',
    condition: (ctx) => ctx.hiddenTraits !== null && ctx.hiddenTraits.ambition > 75,
    weight: (ctx) => ctx.hiddenTraits ? ctx.hiddenTraits.ambition * 0.06 : 0,
    category: 'trait',
  },

  // ──── 关系/人际 ────
  {
    id: 'wave_friend',
    text: '{npcName}远远地朝{targetName}挥了挥手。',
    condition: (ctx) => getBestFriendNearby(ctx) !== null && ctx.needs.social > 40,
    weight: (ctx) => 8,
    category: 'relation',
  },
  {
    id: 'avoid_gaze',
    text: '{npcName}看到{targetName}，立刻转过头去假装没看到。',
    condition: (ctx) => getEnemyNearby(ctx) !== null,
    weight: (ctx) => 10,
    category: 'relation',
  },
  {
    id: 'share_food',
    text: '{npcName}掰了一半饼递给{targetName}。',
    condition: (ctx) => {
      const wallet = ctx.em.getComponent(ctx.npcId, 'Wallet');
      return getBestFriendNearby(ctx) !== null
        && ctx.needs.hunger > 50
        && (wallet ? wallet.copper > 30 : false);
    },
    weight: (ctx) => 7,
    category: 'relation',
  },

  // ──── 特殊时段 ────
  {
    id: 'dawn_walk',
    text: '天刚蒙蒙亮，{npcName}就已经在街上了。',
    condition: (ctx) => ctx.shichen === '寅' || ctx.shichen === '卯',
    weight: (ctx) => 5,
    category: 'time',
  },
  {
    id: 'midnight_wander',
    text: '夜深人静，{npcName}还在外面转悠。',
    condition: (ctx) => isNight(ctx.shichen) && ctx.emotion === 'tense',
    weight: (ctx) => 8,
    category: 'time',
  },
];

// ──── 主函数：生成叙事片段 ────
export function generateNarrativeFragment(ctx: NarrativeContext): string {
  // 1. 过滤出符合条件的片段
  const eligible: { template: FragmentTemplate; score: number }[] = [];

  for (const tmpl of FRAGMENTS) {
    try {
      if (!tmpl.condition(ctx)) continue;
      const score = tmpl.weight(ctx) + Math.random() * 3; // 加一点随机性
      eligible.push({ template: tmpl, score });
    } catch {
      continue;
    }
  }

  // 2. 没有匹配 → 返回默认片段
  if (eligible.length === 0) {
    return `${ctx.npcName}在${ctx.currentGrid}待了一会儿。`;
  }

  // 3. 按权重排序，选最高分的
  eligible.sort((a, b) => b.score - a.score);

  // 从 top-3 中随机选一个（增加多样性）
  const topN = Math.min(3, eligible.length);
  const chosen = eligible[Math.floor(Math.random() * topN)];

  // 4. 替换占位符
  let text = chosen.template.text;
  text = text.replace(/\{npcName\}/g, ctx.npcName);
  text = text.replace(/\{location\}/g, ctx.currentGrid);

  const targetName = getBestFriendNearby(ctx) || getEnemyNearby(ctx) || getRandomNearbyNpcName(ctx);
  text = text.replace(/\{targetName\}/g, targetName);

  return text;
}
