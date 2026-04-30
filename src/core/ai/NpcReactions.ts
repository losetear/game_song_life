import type { InteractionContext } from './NpcInteractionEngine';

/** NPC反应等级 */
export type ReactionTone = 'positive' | 'neutral' | 'negative' | 'hostile' | 'grateful'
  | 'playful' | 'shy' | 'cold' | 'romantic' | 'sad' | 'loyal'
  | 'hesitant' | 'mentor' | 'apologetic' | 'annoyed' | 'secretive'
  | 'solemn';

/** NPC反应结果 */
export interface NpcReaction {
  text: string;
  tone: ReactionTone;
  /** NPC的后续情绪变化（已由ConsequenceEngine处理vital，这里只做额外微调） */
  extraMoodDelta?: number;
  /** NPC可能提出的反向请求 */
  counterOffer?: {
    text: string;
    consequenceId: string;  // 指向BriefConsequences中的ID
  };
  /** 是否提供继续对话的选项 */
  continueDialogue: boolean;
}

/** 根据性格+好感度+行动类型生成NPC反应 */
export function generateNpcReaction(
  ctx: InteractionContext,
  actionType: string,
  _consequenceApplied: boolean,
): NpcReaction {
  // 使用多层反应机制生成反应
  return generateRichNpcReaction(ctx, actionType);
}

/** 多层反应机制 */
function generateRichNpcReaction(
  ctx: InteractionContext,
  actionType: string,
): NpcReaction {
  // Layer 1: 性格基础反应（决定基调）
  const baseTone = getPersonalityBaseTone(ctx.npc.personality, ctx.relationLevel);

  // Layer 2: 关系修正（熟人更放松，陌生人更警惕）
  const relationModifier = getRelationModifier(ctx.relation, ctx.relationLevel);

  // Layer 3: 状态叠加（心情差时更容易生气/难过）
  const moodModifier = getMoodModifier(ctx.npc.mood, ctx.player.mood);

  // Layer 4: 历史记忆（如果之前被欺骗过，反应会不同）
  const memoryModifier = getMemoryModifier(ctx.player.narrativeTags, ctx.npc.narrativeTags);

  // Layer 5: 随机扰动（避免完全 deterministic）
  // 这里暂时不实现，保持确定性

  // 综合各层生成最终反应
  return composeFinalReaction(ctx, actionType, baseTone, relationModifier, moodModifier, memoryModifier);
}

/** Layer 1: 性格基础反应 */
function getPersonalityBaseTone(personality: string[], relationLevel: string): ReactionTone {
  if (relationLevel === '仇视' || relationLevel === '死敌') {
    if (personality.includes('暴躁')) return 'hostile';
    if (personality.includes('阴沉')) return 'cold';
    return 'negative';
  }

  if (personality.includes('开朗')) return 'positive';
  if (personality.includes('害羞')) return 'shy';
  if (personality.includes('豪爽')) return 'playful';
  if (personality.includes('阴沉')) return 'secretive';
  if (personality.includes('暴躁')) return 'annoyed';

  return 'neutral';
}

/** Layer 2: 关系修正系数 */
function getRelationModifier(_relation: number, relationLevel: string): number {
  // 返回一个修正系数，影响反应的强烈程度
  if (relationLevel === '至交') return 1.5;
  if (relationLevel === '好友') return 1.2;
  if (relationLevel === '熟人') return 1.0;
  if (relationLevel === '路人') return 0.8;
  if (relationLevel === '嫌隙') return 0.5;
  if (relationLevel === '仇视' || relationLevel === '死敌') return 0.3;
  return 1.0;
}

/** Layer 3: 状态叠加修正 */
function getMoodModifier(npcMood: number, playerMood: number): number {
  // 双方心情都好时，正面反应增强
  if (npcMood > 60 && playerMood > 60) return 1.3;
  // 双方心情都差时，更容易产生负面反应
  if (npcMood < 30 && playerMood < 30) return 0.7;
  // NPC心情很差时，反应会减弱
  if (npcMood < 30) return 0.8;
  return 1.0;
}

/** Layer 4: 历史记忆修正 */
function getMemoryModifier(playerTags: string[], _npcTags: string[]): number {
  // 检查是否有负面历史
  const hasNegativeHistory = playerTags.some((t) =>
    ['欺骗', '背叛', '伤害'].some((k) => t.includes(k))
  );
  if (hasNegativeHistory) return 0.6;

  // 检查是否有正面历史
  const hasPositiveHistory = playerTags.some((t) =>
    ['帮助', '救助', '赠礼'].some((k) => t.includes(k))
  );
  if (hasPositiveHistory) return 1.2;

  return 1.0;
}

/** 综合各层生成最终反应 */
function composeFinalReaction(
  ctx: InteractionContext,
  actionType: string,
  baseTone: ReactionTone,
  relationModifier: number,
  moodModifier: number,
  memoryModifier: number,
): NpcReaction {
  const { npc, relationLevel } = ctx;

  // 计算综合修正系数
  const totalModifier = relationModifier * moodModifier * memoryModifier;

  // 根据行动类型和性格生成反应内容
  let text = '';
  let tone = baseTone;
  let extraMoodDelta = 0;
  let continueDialogue = true;
  let counterOffer: NpcReaction['counterOffer'] | undefined;

  // 根据行动类型生成具体反应
  switch (actionType) {
    case 'chat': {
      if (baseTone === 'positive' || baseTone === 'playful') {
        text = `${npc.name}笑着回应了几句，语气轻松愉快。`;
        extraMoodDelta = 3;
      } else if (baseTone === 'shy') {
        text = `${npc.name}低声应了几句，有些拘谨。`;
        extraMoodDelta = 1;
      } else if (baseTone === 'hostile') {
        text = `${npc.name}冷冷地瞥了你一眼，没说什么。`;
        extraMoodDelta = -2;
        continueDialogue = relationLevel !== '仇视' && relationLevel !== '死敌';
      } else {
        text = `${npc.name}点了点头，简单应了几句。`;
      }
      break;
    }

    case 'gift': {
      if (npc.personality.includes('贪婪')) {
        text = `${npc.name}一把接过礼物，眼睛都亮了："谢了！"`;
        extraMoodDelta = 8;
      } else if (npc.personality.includes('温和')) {
        text = `${npc.name}感动地收下了："你真是太客气了..."`;
        extraMoodDelta = 6;
      } else if (relationLevel === '路人') {
        text = `${npc.name}有些意外，但还是客气地收下了。`;
        extraMoodDelta = 4;
      } else {
        text = `${npc.name}笑着收下："让你破费了。"`;
        extraMoodDelta = 5;
      }
      // 高好感时可能提出回礼
      if (ctx.relation >= 40) {
        counterOffer = {
          text: `"你若不嫌弃，我这里有些东西你也许用得上。"`,
          consequenceId: 'trade',
        };
      }
      break;
    }

    case 'compliment': {
      if (npc.personality.includes('虚荣')) {
        text = `${npc.name}得意地扬了扬下巴："那是自然！"`;
        extraMoodDelta = 4;
      } else if (npc.personality.includes('害羞')) {
        text = `${npc.name}脸一红："你...别开玩笑了..."`;
        extraMoodDelta = 3;
      } else if (npc.personality.includes('阴沉')) {
        text = `${npc.name}嘴角微微动了一下，没有说话。`;
        extraMoodDelta = 1;
      } else {
        text = `${npc.name}笑了笑："过奖了。"`;
        extraMoodDelta = 2;
      }
      break;
    }

    case 'provoke': {
      if (npc.personality.includes('暴躁')) {
        text = `${npc.name}一把抓住你的衣领："你再说一遍试试！"`;
        tone = 'hostile';
        extraMoodDelta = -8;
      } else if (npc.personality.includes('胆小')) {
        text = `${npc.name}吓得退了一步，不敢看你。`;
        tone = 'negative';
        extraMoodDelta = -5;
        continueDialogue = false;
      } else {
        text = `${npc.name}冷冷地看着你，没有说话。`;
        tone = 'hostile';
        extraMoodDelta = -6;
      }
      break;
    }

    case 'invite_tea': {
      if (relationLevel === '至交' || relationLevel === '好友') {
        text = `${npc.name}端起茶杯，轻轻抿了一口，神情放松了许多："难得清闲。"`;
        extraMoodDelta = 5;
      } else if (relationLevel === '熟人') {
        text = `${npc.name}客气地端起茶杯："让你破费了。"`;
        extraMoodDelta = 3;
      } else {
        text = `${npc.name}端起茶杯，略显拘谨。`;
        extraMoodDelta = 1;
      }
      break;
    }

    case 'learn': {
      if (relationLevel === '至交' || relationLevel === '好友') {
        text = `${npc.name}认真地讲解了一番，还不时停下来确认你听懂了。`;
        extraMoodDelta = 4;
      } else {
        text = `${npc.name}点了点头，讲解了几句。`;
        extraMoodDelta = 2;
      }
      break;
    }

    case 'threaten': {
      if (npc.personality.includes('胆小')) {
        text = `${npc.name}被吓住了，连声答应："别...别这样..."`;
        tone = 'negative';
        extraMoodDelta = -3;
        continueDialogue = false;
      } else if (npc.personality.includes('暴躁')) {
        text = `${npc.name}反而被激怒了："你以为你是谁？！"`;
        tone = 'hostile';
        extraMoodDelta = -10;
      } else {
        text = `${npc.name}沉默了片刻，咬着牙没有发作。`;
        tone = 'hostile';
        extraMoodDelta = -7;
      }
      break;
    }

    case 'apologize': {
      if (npc.personality.includes('善良')) {
        text = `${npc.name}叹了口气："我不记仇。以后好好相处吧。"`;
        tone = 'grateful';
        extraMoodDelta = 6;
      } else {
        text = `${npc.name}看了你一眼："记住这次的教训。"`;
        tone = 'neutral';
        extraMoodDelta = 3;
      }
      break;
    }

    case 'flirt': {
      if (npc.personality.includes('害羞')) {
        text = `${npc.name}脸涨得通红，支支吾吾说不出话来。`;
        tone = 'shy';
        extraMoodDelta = 3;
      } else if (npc.personality.includes('开朗')) {
        text = `${npc.name}挑了挑眉："哟，你今天倒是嘴甜。"`;
        tone = 'playful';
        extraMoodDelta = 2;
      } else if (npc.personality.includes('阴沉')) {
        text = `${npc.name}冷冷地看了你一眼，没有接话。`;
        tone = 'cold';
        extraMoodDelta = -1;
        continueDialogue = false;
      } else {
        text = `${npc.name}愣了一下，随即别过脸去。`;
        extraMoodDelta = 1;
      }
      break;
    }

    case 'ask_help': {
      if (relationLevel === '至交' || relationLevel === '好友') {
        text = `${npc.name}二话不说就答应了："包在我身上！"`;
        tone = 'grateful';
        extraMoodDelta = 4;
        counterOffer = {
          text: `"对了，你能不能帮我一个忙？"`,
          consequenceId: 'chat',
        };
      } else {
        text = `${npc.name}犹豫了一下，还是点了点头："好吧..."`;
        extraMoodDelta = 2;
      }
      break;
    }

    case 'rumor': {
      text = `${npc.name}若有所思："这事我也略有耳闻……"`;
      extraMoodDelta = 1;
      break;
    }

    default: {
      text = `${npc.name}看了看你。`;
      break;
    }
  }

  // 应用修正系数到情绪变化
  extraMoodDelta = Math.round(extraMoodDelta * totalModifier);

  return {
    text,
    tone,
    extraMoodDelta,
    counterOffer,
    continueDialogue,
  };
}
