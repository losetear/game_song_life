import type { InteractionContext } from './NpcInteractionEngine';

/** NPC反应等级 */
export type ReactionTone = 'positive' | 'neutral' | 'negative' | 'hostile' | 'grateful';

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
  consequenceApplied: boolean,
): NpcReaction {
  const { npc, relationLevel, player } = ctx;
  const personality = npc.personality;

  // 根据行动类型选择反应模板
  const reactionMap: Record<string, () => NpcReaction> = {
    chat: () => {
      if (relationLevel === '至交' || relationLevel === '好友') {
        return {
          text: `${npc.name}笑着回应了几句。`,
          tone: 'positive',
          continueDialogue: true,
        };
      }
      return {
        text: `${npc.name}应了几句。`,
        tone: 'neutral',
        continueDialogue: relationLevel !== '嫌隙' && relationLevel !== '仇视' && relationLevel !== '死敌',
      };
    },

    gift: () => {
      const base: NpcReaction = {
        text: personality.includes('贪婪')
          ? `${npc.name}一把接过礼物，眼睛都亮了。`
          : personality.includes('温和')
          ? `${npc.name}感动地收下了："你真是太客气了。"`
          : `${npc.name}有些意外，但还是收下了。`,
        tone: 'grateful',
        extraMoodDelta: 5,
        continueDialogue: true,
      };
      if (relationLevel === '路人' && player.copper > 50) {
        base.counterOffer = {
          text: `"你若不嫌弃，我这里有些东西你也许用得上。"`,
          consequenceId: 'trade',
        };
      }
      return base;
    },

    compliment: () => {
      if (personality.includes('虚荣')) {
        return {
          text: `${npc.name}得意地扬了扬下巴："那是自然！"`,
          tone: 'positive',
          continueDialogue: true,
        };
      }
      if (personality.includes('阴沉')) {
        return {
          text: `${npc.name}嘴角微微动了一下，没有说话。`,
          tone: 'neutral',
          continueDialogue: true,
        };
      }
      return {
        text: `${npc.name}笑了笑："过奖了。"`,
        tone: 'positive',
        continueDialogue: true,
      };
    },

    trade: () => ({
      text: `${npc.name}清点了货物，和你完成了交易。`,
      tone: 'neutral',
      continueDialogue: true,
    }),

    provoke: () => {
      if (personality.includes('暴躁')) {
        return {
          text: `${npc.name}一把抓住你的衣领："你再说一遍试试！"`,
          tone: 'hostile',
          extraMoodDelta: -5,
          continueDialogue: true,
        };
      }
      if (personality.includes('胆小')) {
        return {
          text: `${npc.name}吓得退了一步，不敢看你。`,
          tone: 'negative',
          continueDialogue: false,
        };
      }
      return {
        text: `${npc.name}冷冷地看着你，没有说话。`,
        tone: 'hostile',
        continueDialogue: true,
      };
    },

    ask_help: () => {
      if (relationLevel === '至交' || relationLevel === '好友') {
        return {
          text: `${npc.name}二话不说就答应了。`,
          tone: 'grateful',
          continueDialogue: true,
          counterOffer: {
            text: `"对了，你能不能帮我一个忙？"`,
            consequenceId: 'chat',
          },
        };
      }
      return {
        text: `${npc.name}犹豫了一下，还是点了点头。`,
        tone: 'neutral',
        continueDialogue: true,
      };
    },

    invite_tea: () => ({
      text: `${npc.name}端起茶杯，轻轻抿了一口，神情放松了许多。`,
      tone: 'positive',
      continueDialogue: true,
    }),

    learn: () => ({
      text: `${npc.name}认真地讲解了一番，还不时停下来确认你听懂了。`,
      tone: 'positive',
      continueDialogue: true,
    }),

    threaten: () => {
      if (personality.includes('胆小')) {
        return {
          text: `${npc.name}被吓住了，连声答应。`,
          tone: 'negative',
          continueDialogue: false,
        };
      }
      if (personality.includes('暴躁')) {
        return {
          text: `${npc.name}反而被激怒了："你以为你是谁？！"`,
          tone: 'hostile',
          extraMoodDelta: -5,
          continueDialogue: true,
        };
      }
      return {
        text: `${npc.name}沉默了片刻，咬着牙没有发作。`,
        tone: 'hostile',
        continueDialogue: true,
      };
    },

    apologize: () => ({
      text: personality.includes('善良')
        ? `${npc.name}叹了口气："我不记仇。以后好好相处吧。"`
        : `${npc.name}看了你一眼："记住这次的教训。"`,
      tone: 'grateful',
      continueDialogue: true,
    }),

    rumor: () => ({
      text: `${npc.name}若有所思："这事我也略有耳闻……"`,
      tone: 'neutral',
      continueDialogue: true,
    }),

    // 特殊场景
    share_umbrella: () => ({
      text: `${npc.name}靠近了一些，你们默默走了一段路。`,
      tone: 'grateful',
      continueDialogue: true,
    }),

    check_health: () => ({
      text: `${npc.name}握了握你的手："有你这份心，我就知足了。"`,
      tone: 'grateful',
      continueDialogue: true,
    }),

    learn_craft: () => ({
      text: `${npc.name}拍了拍你的肩："有天赋，以后多练练就好。"`,
      tone: 'positive',
      continueDialogue: true,
    }),

    conflict_escalation: () => ({
      text: personality.includes('暴躁')
        ? `${npc.name}推了你一把："别让我再看见你！"`
        : `${npc.name}恶狠狠地瞪着你。`,
      tone: 'hostile',
      extraMoodDelta: -3,
      continueDialogue: false,
    }),

    mention_cave: () => ({
      text: `${npc.name}压低声音："这事儿别跟别人说。改日我们一起去看看？"`,
      tone: 'positive',
      continueDialogue: true,
    }),

    old_friend_catchup: () => ({
      text: `${npc.name}感慨道："真怀念那些日子啊。"`,
      tone: 'grateful',
      continueDialogue: true,
    }),

    poor_npc_help: () => ({
      text: `${npc.name}声音有些哽咽："大恩不言谢，日后定当报答。"`,
      tone: 'grateful',
      continueDialogue: true,
      counterOffer: {
        text: `"我知道一些消息，也许对你有用。"`,
        consequenceId: 'ask_info',
      },
    }),
  };

  const factory = reactionMap[actionType];
  if (!factory) {
    return {
      text: `${npc.name}看了看你。`,
      tone: 'neutral',
      continueDialogue: true,
    };
  }
  return factory();
}
