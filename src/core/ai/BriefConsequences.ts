import type { InteractionConsequence } from './ConsequenceEngine';
import type { InteractionContext } from './NpcInteractionEngine';

/** brief级交互的后果定义 */
export function getBriefConsequence(
  templateId: string,
  ctx: InteractionContext,
): InteractionConsequence {
  const map: Record<string, () => InteractionConsequence> = {
    chat: () => {
      // 根据上下文选择不同变体
      const variant = selectChatVariant(ctx);
      return {
        narrative: () => variant.actionNarrative,
        stageDirection: variant.stageDirection ? () => variant.stageDirection! : undefined,
        playerVital: { mood: 2 },
        relationChange: 1,
      };
    },

    gift: () => ({
      narrative: () => {
        if (ctx.relation >= 50) {
          return `你送了一份小礼物给${ctx.npc.name}，${ctx.npc.name}感动地说："你总是这么有心。"`;
        }
        if (ctx.relation >= 0) {
          return `你递上一份心意，${ctx.npc.name}笑着收下了："让你破费了。"`;
        }
        return `${ctx.npc.name}有些意外地收下了你的礼物，表情缓和了些。`;
      },
      playerCopper: -10,
      npcVital: { mood: 8 },
      relationChange: 5,
    }),

    compliment: () => ({
      narrative: () => {
        const traits: Record<string, string> = {
          '铁匠': '手艺精湛',
          '木匠': '做工精细',
          '郎中': '医术高明',
          '商贩': '生意兴隆',
          '农夫': '勤劳踏实',
          '渔夫': '吃苦耐劳',
          '猎户': '身手不凡',
          '掌柜': '经营有方',
          '茶馆老板': '茶艺出众',
        };
        const compliment = traits[ctx.npc.profession] ?? '为人不错';
        if (ctx.npc.personality.includes('虚荣')) {
          return `你称赞${ctx.npc.name}${compliment}，${ctx.npc.name}得意地挺了挺胸。`;
        }
        return `你夸${ctx.npc.name}${compliment}，${ctx.npc.name}不好意思地笑了笑。`;
      },
      npcVital: { mood: 3 },
      relationChange: 2,
    }),

    trade: () => ({
      narrative: () => {
        const goods = ['米面', '布匹', '药材'];
        const good = goods[ctx.environment.day % goods.length]!;
        const priceFactor = ctx.environment.season === '冬' ? 1.3 : ctx.environment.season === '秋' ? 0.8 : 1.0;
        const price = Math.round(8 * priceFactor);
        return `你从${ctx.npc.name}那里买了些${good}，花了${price}文。`;
      },
      playerCopper: -Math.round(8 * (ctx.environment.season === '冬' ? 1.3 : ctx.environment.season === '秋' ? 0.8 : 1.0)),
      playerVital: { mood: 1 },
      relationChange: 1,
    }),

    rumor: () => {
      const tag = ctx.player.narrativeTags[ctx.environment.day % ctx.player.narrativeTags.length] ?? '奇怪的消息';
      return {
        narrative: () =>
          `你把"${tag}"的消息告诉了${ctx.npc.name}。${ctx.npc.name}若有所思地点了点头。`,
        npcGainTag: `听说:${tag}`,
        relationChange: ctx.relation >= 25 ? 1 : -1,
      };
    },

    say_goodbye: () => ({
      narrative: () => {
        const farewells: Record<string, string> = {
          '至交': `你向${ctx.npc.name}告辞，${ctx.npc.name}依依不舍："常来啊！"`,
          '好友': `你和${ctx.npc.name}道别，${ctx.npc.name}挥了挥手："改日再聚。"`,
          '熟人': `你点了点头离开，${ctx.npc.name}礼貌地送了一步。`,
        };
        return farewells[ctx.relationLevel] ?? `你转身离去。`;
      },
      nextAct: '__end__',
    }),

    flirt: () => ({
      narrative: () => {
        if (ctx.relationLevel === '至交' || ctx.relationLevel === '好友') {
          return `你半开玩笑地说了句俏皮话，${ctx.npc.name}脸一红，嗔怪地瞪了你一眼，嘴角却忍不住上扬。`;
        }
        if (ctx.relationLevel === '熟人') {
          return `你试探性地开了个暧昧的玩笑，${ctx.npc.name}愣了一下，随即不自然地转移了话题。`;
        }
        return `你说了一句带点调笑意味的话，${ctx.npc.name}有些意外地看着你。`;
      },
      npcVital: { mood: 3 },
      relationChange: 2,
    }),

    bet: () => {
      const win = ctx.environment.day % 2 === 0;
      return {
        narrative: () =>
          win
            ? `你和${ctx.npc.name}打了个赌——猜下一个进门的人是男是女。你赢了！${ctx.npc.name}不情愿地掏出五文钱给你。`
            : `你和${ctx.npc.name}打赌，结果你输了。五文钱进了对方的口袋。`,
        playerCopper: win ? 5 : -5,
        playerVital: { mood: win ? 5 : -3 },
        relationChange: win ? 2 : 1,
      };
    },

    compete: () => {
      const playerWins = ctx.player.health > ctx.npc.health;
      return {
        narrative: () =>
          playerWins
            ? `你和${ctx.npc.name}比试了一番，你占了上风！${ctx.npc.name}气喘吁吁地认输："你的身手确实不错。"`
            : `${ctx.npc.name}的身手比你更胜一筹。你输了比试，但不服输的劲头反而让关系更近了些。`,
        playerVital: playerWins ? { mood: 10, fatigue: 8 } : { mood: -5, fatigue: 8 },
        relationChange: playerWins ? 3 : 1,
        ...(playerWins ? { narrativeTag: '胜过某人' } : {}),
      };
    },

    introduce: () => ({
      narrative: () =>
        `你向${ctx.npc.name}提起自己认识的一些人，表示愿意引荐认识。${ctx.npc.name}感兴趣地问了几句详情。`,
      relationChange: 2,
    }),

    mock: () => ({
      narrative: () => {
        if (ctx.npc.personality.includes('暴躁')) {
          return `你戏弄了${ctx.npc.name}几句，对方脸色一沉："你再说一遍试试？"气氛顿时紧张起来。`;
        }
        if (ctx.npc.personality.includes('开朗')) {
          return `你开了几个无伤大雅的玩笑，${ctx.npc.name}哈哈大笑，反过来也捉弄了你几句。两人闹成一团。`;
        }
        return `你调侃了${ctx.npc.name}几句，对方无奈地摇了摇头。`;
      },
      npcVital: { mood: ctx.npc.personality.includes('暴躁') ? -5 : 3 },
      relationChange: ctx.npc.personality.includes('开朗') ? 2 : -1,
    }),

    comfort: () => ({
      narrative: () =>
        `你看${ctx.npc.name}心情不好，轻声安慰了几句。${ctx.npc.name}沉默了一会儿，低声说："谢谢你。"`,
      npcVital: { mood: 6 },
      playerVital: { mood: 2 },
      relationChange: 3,
    }),
  };

  const factory = map[templateId];
  if (!factory) {
    // 未知模板：默认简单回复
    return {
      narrative: () => `你和${ctx.npc.name}交谈了几句。`,
      relationChange: 0,
    };
  }
  return factory();
}

/** scene级的简单后果（后续Phase扩展） */
export function getSceneConsequence(
  sceneId: string,
  ctx: InteractionContext,
): InteractionConsequence {
  const map: Record<string, () => InteractionConsequence> = {
    ask_info: () => ({
      narrative: () => {
        const infos = [
          `${ctx.npc.name}压低声音说："听说城南最近不太平，你小心点。"`,
          `${ctx.npc.name}想了想说："最近粮价怕是要涨，趁早屯些。"`,
          `${ctx.npc.name}四下看看，悄悄说："官府好像在查什么事，别惹麻烦。"`,
        ];
        return infos[ctx.environment.day % infos.length]!;
      },
      stageDirection: () => `${ctx.npc.name}凑近了一些，左右看了看。`,
      playerGainTag: `打听:${ctx.npc.name}的消息`,
      relationChange: 1,
    }),

    ask_help: () => ({
      narrative: () =>
        `你向${ctx.npc.name}求助。${ctx.npc.name}拍了拍胸口："放心，包在我身上。"`,
      playerVital: { mood: 5 },
      npcVital: { mood: -2, fatigue: -3 },
      playerGainTag: `${ctx.npc.name}帮过忙`,
      relationChange: 3,
    }),

    invite_tea: () => ({
      narrative: () =>
        `你请${ctx.npc.name}喝了杯茶，两人坐下来慢慢聊了会儿。${ctx.npc.name}叹了口气："难得清闲。"`,
      stageDirection: () => '茶香袅袅，两人对坐。',
      playerCopper: -5,
      playerVital: { mood: 3, fatigue: 3 },
      npcVital: { mood: 5, fatigue: 3 },
      relationChange: 3,
    }),

    provoke: () => ({
      narrative: () => {
        if (ctx.npc.personality.includes('暴躁')) {
          return `你话里带刺，${ctx.npc.name}勃然大怒："你找事是不是？！"`;
        }
        if (ctx.npc.personality.includes('温和')) {
          return `你语气不善，${ctx.npc.name}皱了皱眉，没有理会你。`;
        }
        return `你的话让${ctx.npc.name}脸色一沉。`;
      },
      npcVital: { mood: -8 },
      playerGainTag: '挑衅过',
      relationChange: -8,
    }),

    learn: () => ({
      narrative: () =>
        `你向${ctx.npc.name}请教${ctx.npc.profession}方面的知识，${ctx.npc.name}耐心地讲解了一番。`,
      playerVital: { mood: 3 },
      playerGainTag: `学过${ctx.npc.profession}`,
      relationChange: 2,
    }),

    threaten: () => ({
      narrative: () =>
        `你冷冷地威胁了${ctx.npc.name}。${ctx.npc.name}${ctx.npc.personality.includes('胆小') ? '吓得连连后退' : '不甘示弱地瞪了回来'}。`,
      npcVital: { mood: -10 },
      playerGainTag: '威胁过人',
      relationChange: -12,
    }),

    apologize: () => ({
      narrative: () =>
        `你诚恳地向${ctx.npc.name}道歉。${ctx.npc.name}沉默了一会儿，叹了口气："罢了。"`,
      npcVital: { mood: 5 },
      playerGainTag: '道过歉',
      relationChange: 8,
    }),

    // 特殊场景
    share_umbrella: () => ({
      narrative: () =>
        `${ctx.environment.weather === '雪' ? '雪花纷飞' : '细雨如丝'}，你和${ctx.npc.name}共撑一把伞，慢慢走了一段路。${ctx.npc.name}轻声说："记得我们第一次见面的时候……"`,
      stageDirection: () => `${ctx.environment.weather === '雪' ? '雪' : '雨'}中，一把伞下两个身影。`,
      playerVital: { mood: 8 },
      npcVital: { mood: 8 },
      playerGainTag: '共撑过伞',
      relationChange: 6,
    }),

    check_health: () => ({
      narrative: () =>
        `你关切地问${ctx.npc.name}身体如何。${ctx.npc.name}苦笑道："老毛病了，不碍事。"你心里有些担忧。`,
      stageDirection: () => `${ctx.npc.name}面色苍白，强撑着笑了笑。`,
      playerGainTag: `关心:${ctx.npc.name}的身体`,
      relationChange: 4,
    }),

    learn_craft: () => ({
      narrative: () =>
        `${ctx.npc.name}手把手教了你一些${ctx.npc.profession}的窍门，你受益匪浅。`,
      stageDirection: () => `${ctx.npc.name}拿起工具，一边演示一边讲解。`,
      playerVital: { mood: 5 },
      playerGainTag: `${ctx.npc.profession}学徒`,
      relationChange: 5,
    }),

    conflict_escalation: () => ({
      narrative: () =>
        `你和${ctx.npc.name}的矛盾终于爆发了！两人大吵一架，引来了周围人的侧目。`,
      stageDirection: () => '气氛骤然紧张，周围的人纷纷避开。',
      playerVital: { mood: -10, health: -5 },
      npcVital: { mood: -10, health: -3 },
      playerGainTag: '打过架',
      relationChange: -20,
    }),

    mention_cave: () => ({
      narrative: () =>
        `你提起知道一个山中洞穴，${ctx.npc.name}眼睛一亮："真的？在哪里？带我去看看？"`,
      stageDirection: () => `${ctx.npc.name}放下手中的弓，认真地看着你。`,
      npcGainTag: '知道山洞位置',
      relationChange: 5,
    }),

    old_friend_catchup: () => ({
      narrative: () =>
        `你和${ctx.npc.name}坐下来好好叙了叙旧，聊起从前的种种，感慨万千。`,
      stageDirection: () => '两人相视而笑，仿佛回到了从前。',
      playerVital: { mood: 8 },
      npcVital: { mood: 8 },
      relationChange: 4,
    }),

    poor_npc_help: () => ({
      narrative: () =>
        `你看${ctx.npc.name}日子不好过，悄悄塞了些铜钱过去。${ctx.npc.name}红了眼眶："这……谢谢你。"`,
      stageDirection: () => `${ctx.npc.name}低着头，攥紧了铜钱。`,
      playerCopper: -20,
      npcVital: { mood: 10 },
      playerGainTag: '乐善好施',
      relationChange: 10,
    }),
  };

  const factory = map[sceneId];
  if (!factory) {
    return {
      narrative: () => `你和${ctx.npc.name}交谈了一番。`,
      relationChange: 0,
    };
  }
  return factory();
}

// === Chat 闲聊多变体系统 ===

interface ChatVariant {
  actionNarrative: string;
  stageDirection?: string;
  npcResponse?: {
    expression: string;
    gesture: string;
    dialogue: string;
    innerThought?: string;
  };
  atmosphere?: string;
  followUpHint?: string;
  relationChange: number;
  playerMood: number;
}

function selectChatVariant(ctx: InteractionContext): ChatVariant {
  const isHighRelation = ctx.relation >= 40;
  const bothGoodMood = ctx.player.mood > 60 && ctx.npc.mood > 60;
  const bothBadMood = ctx.player.mood < 40 && ctx.npc.mood < 40;
  const isRainy = ctx.environment.weather === '雨';
  const hasGossip = ctx.player.narrativeTags.some((t) =>
    ['八卦', '传闻', '消息'].some((k) => t.includes(k))
  );

  if (isHighRelation && bothGoodMood) {
    return 回忆往事变体(ctx);
  }
  if (bothBadMood) {
    return 吐槽抱怨变体(ctx);
  }
  if (isRainy) {
    return 天气话题变体(ctx);
  }
  if (isHighRelation && bothGoodMood) {
    return 规划未来变体(ctx);
  }
  if (hasGossip) {
    return 八卦消息变体(ctx);
  }

  return 职业话题变体(ctx);
}

const 回忆往事变体 = (ctx: InteractionContext): ChatVariant => ({
  actionNarrative: `你向${ctx.npc.name}提起从前的种种，两人都沉浸在回忆里。"还记得那年..."${ctx.npc.name}眼里泛着光，声音温柔了许多。`,
  stageDirection: '时光仿佛倒流，两人的神情都柔和下来。',
  npcResponse: {
    expression: '眼神柔和，嘴角含笑',
    gesture: '轻轻点头，时而感叹',
    dialogue: `是啊，那时候真傻...但也真快乐。`,
    innerThought: '那些日子，是我们共同的记忆。',
  },
  atmosphere: '周围的人来人往仿佛都远去了，只剩下你们两人的回忆。',
  followUpHint: '似乎还有更多往事想要倾诉...',
  relationChange: 3,
  playerMood: 4,
});

const 吐槽抱怨变体 = (ctx: InteractionContext): ChatVariant => ({
  actionNarrative: `你叹了口气，开始吐槽最近的烦心事。${ctx.npc.name}也有同感，接过了话头："我也是！最近..."两人你一句我一句，越说越投机。`,
  stageDirection: '两人眉头紧锁，但说着说着都笑了出来。',
  npcResponse: {
    expression: '先是愁眉苦脸，后来释然一笑',
    gesture: '摊开双手，叹气',
    dialogue: `唉，生活就是这样，说说就好多了。`,
    innerThought: '原来不止我一个人这么烦。',
  },
  atmosphere: '虽然话题沉重，但两人都轻松了不少。',
  followUpHint: '吐槽完之后，心情好多了。',
  relationChange: 2,
  playerMood: 3,
});

const 天气话题变体 = (_ctx: InteractionContext): ChatVariant => ({
  actionNarrative: `你望向窗外的雨，感叹道："这雨下得真大..."对方顺着你的目光看去，说道："是啊，听说城南都淹了。"两人聊起天气，又聊到雨水对收成的影响。`,
  stageDirection: '雨声淅淅沥沥，两人望着窗外出神。',
  npcResponse: {
    expression: '有些担忧',
    gesture: '指着窗外，摇头',
    dialogue: `希望雨快点停，不然今年又要难过了。`,
    innerThought: '这种天气，真让人心情沉重。',
  },
  atmosphere: '雨中的对话，带着一丝愁绪。',
  followUpHint: '或许可以聊聊其他话题，转换心情。',
  relationChange: 1,
  playerMood: 1,
});

const 规划未来变体 = (ctx: InteractionContext): ChatVariant => {
  const plans = ['开一家小店', '去外地闯闯', '学一门新手艺', '安顿下来成家'];
  const plan = plans[ctx.environment.day % plans.length]!;
  return {
    actionNarrative: `你聊起对未来的打算："我在想，要不要${plan}..."${ctx.npc.name}眼睛一亮："这个想法不错！我支持你。"`,
    stageDirection: '两人都坐直了身子，眼里闪烁着期待。',
    npcResponse: {
      expression: '兴奋，眼神明亮',
      gesture: '拍拍你的肩膀',
      dialogue: `如果你真的要做，我一定帮你！`,
      innerThought: '他/她有理想，真不错。',
    },
    atmosphere: '充满希望的氛围，未来似乎光明起来。',
    followUpHint: '或许可以请对方帮忙出出主意。',
    relationChange: 3,
    playerMood: 4,
  };
};

const 八卦消息变体 = (ctx: InteractionContext): ChatVariant => {
  const gossip = ctx.player.narrativeTags.find((t) =>
    ['八卦', '传闻', '消息'].some((k) => t.includes(k))
  ) ?? '最近的传闻';
  return {
    actionNarrative: `你压低声音，把"${gossip}"的消息告诉了${ctx.npc.name}。对方瞪大了眼睛："真的假的？快说说详情！"`,
    stageDirection: '两人凑近，神秘兮兮地交谈。',
    npcResponse: {
      expression: '好奇又惊讶',
      gesture: '身体前倾，压低声音',
      dialogue: `这事儿...可别跟别人说啊。`,
      innerThought: '这消息有点意思，得记住。',
    },
    atmosphere: '神秘兮兮的氛围，仿佛在分享什么秘密。',
    followUpHint: '对方似乎还想了解更多。',
    relationChange: 2,
    playerMood: 2,
  };
};

const 职业话题变体 = (ctx: InteractionContext): ChatVariant => {
  const professionTopics: Record<string, string> = {
    '铁匠': '最近打铁生意如何？听说城里来了个新客户。',
    '郎中': '最近病人多吗？换季的时候总是忙碌。',
    '商贩': '最近生意怎么样？物价好像又涨了。',
    '农夫': '今年收成如何？雨水够不够？',
    '书生': '最近在读什么书？可有新的见解？',
    '渔夫': '最近鱼情如何？听说河里鱼多了。',
    '猎户': '山林里可有什么发现？最近野兽出没频繁。',
    '茶馆老板': '茶馆生意兴隆啊！有什么新茶吗？',
    '画工': '最近画了什么新作？可否一饱眼福？',
    '伶人': '最近学了什么新曲？什么时候能听到？',
  };
  const topic = professionTopics[ctx.npc.profession] ?? '最近过得怎么样？';

  return {
    actionNarrative: `你聊起${ctx.npc.name}的职业，${topic}对方眼睛一亮，打开了话匣子。`,
    stageDirection: '对方聊到专业领域，神采飞扬。',
    npcResponse: {
      expression: '专业，自信',
      gesture: '比划，讲解',
      dialogue: `这个你算是问对人了！我告诉你...`,
      innerThought: '终于有人懂我的行了。',
    },
    atmosphere: '专业又融洽的对话氛围。',
    followUpHint: '可以趁机请教对方。',
    relationChange: 2,
    playerMood: 2,
  };
};
