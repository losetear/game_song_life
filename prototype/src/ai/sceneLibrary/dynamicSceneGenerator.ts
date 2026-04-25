// === 动态场景生成器 ===
//
// 当预定义场景不匹配时，根据 NPC 性格/关系/职业/动作类型
// 动态生成漫野奇谭式多幕剧情
//
// 6 种场景原型：友好交谈、中立初识、敌对遭遇、交易互动、赠礼、挑衅

import {
  PlayerScene, PlayerSceneChoice, PlayerSceneStep,
  NearbyNpcInfo, L0ActorContext, SceneVisualMeta,
} from './types';

// ════════════════════════════════════════
// 性格→对话风格映射
// ════════════════════════════════════════

const TRAIT_VOICE: Record<string, { greet: string; chat: string; upset: string; refuse: string }> = {
  '暴躁': { greet: '不耐烦地瞥了你一眼', chat: '嘴里嘟囔着什么，似乎心事重重', upset: '猛地一拍桌子', refuse: '"少来烦我！"' },
  '温和': { greet: '微笑着朝你点了点头', chat: '轻声说着最近见闻', upset: '叹了口气，眉头微蹙', refuse: '"实在抱歉……"' },
  '精明': { greet: '上下打量了你一番', chat: '若有所思地捻着手指', upset: '眯起了眼睛，嘴角一紧', refuse: '"这事儿不好办。"' },
  '勇敢': { greet: '大步走过来拍了拍你肩膀', chat: '眉飞色舞地讲着最近的冒险', upset: '攥紧了拳头', refuse: '"今天不行。"' },
  '狡猾': { greet: '嘴角挂着莫测的笑意', chat: '压低声音说了几句', upset: '眼神闪了闪', refuse: '"改天再说吧。"' },
  '善良': { greet: '热情地迎上来', chat: '关心地问起你的近况', upset: '面露不忍之色', refuse: '"我也很想帮你，可是……"' },
  '胆小': { greet: '小心翼翼地看了你一眼', chat: '吞吞吐吐地说着话', upset: '往后退了半步', refuse: '"我……我不太敢。"' },
  '健谈': { greet: '远远就朝你挥手', chat: '滔滔不绝地讲了起来', upset: '话说到一半停住了', refuse: '"你先听我说完！"' },
  '贪婪': { greet: '眼睛在你身上转了一圈', chat: '不经意地提到了银子', upset: '脸色一沉', refuse: '"没好处的事不做。"' },
  '忠诚': { greet: '郑重地向你行了一礼', chat: '诚恳地说出了心里的想法', upset: '咬了咬牙', refuse: '"这次恕难从命。"' },
  '孤僻': { greet: '只是微微点了下头', chat: '简短地说了几句', upset: '沉默不语', refuse: '"……不必了。"' },
  '乐观': { greet: '笑嘻嘻地凑过来', chat: '兴高采烈地分享好消息', upset: '笑容僵了一瞬', refuse: '"别担心，总有办法的！"' },
};

function getTraitVoice(trait: string) {
  return TRAIT_VOICE[trait] || TRAIT_VOICE['温和'];
}

// ════════════════════════════════════════
// 职业→话题映射
// ════════════════════════════════════════

const PROFESSION_TOPIC: Record<string, { topic: string; detail: string; item: string }> = {
  '商贩': { topic: '最近的生意', detail: '进了一批新货，正愁销路', item: '摊位上的布匹' },
  '小贩': { topic: '今天的小买卖', detail: '街头吆喝了一天也没卖多少', item: '篮子里的针线' },
  '货郎': { topic: '各地的见闻', detail: '从南边带来了些稀罕物件', item: '担子上的小玩意' },
  '农夫': { topic: '田里的庄稼', detail: '今年的雨水还算及时', item: '刚摘的菜蔬' },
  '猎户': { topic: '山里的猎物', detail: '最近猎到一只肥兔子', item: '背上的弓箭' },
  '渔夫': { topic: '河里的鱼情', detail: '今早打了满满一网鱼', item: '竹篓里的活鱼' },
  '书生': { topic: '最近的读书心得', detail: '正读到兴亡更替之处', item: '手中的书卷' },
  '秀才': { topic: '科考的打算', detail: '明年秋天打算再考一次', item: '案头的笔墨' },
  '郎中': { topic: '最近的病症', detail: '入秋以来风寒的人不少', item: '药箱里的药材' },
  '铁匠': { topic: '最近的活计', detail: '正在赶制一批农具', item: '炉中的铁块' },
  '木匠': { topic: '手艺的传承', detail: '新收了个徒弟', item: '墨斗和刨子' },
  '裁缝': { topic: '新款的衣裳', detail: '刚学了种新的绣法', item: '布匹上的花样' },
  '厨师': { topic: '新出的菜品', detail: '最近试了道新菜', item: '灶上的蒸笼' },
  '镖师': { topic: '走镖的经历', detail: '上次路上遇到了山贼', item: '手边的朴刀' },
  '捕快': { topic: '最近治安', detail: '城里最近有几桩怪事', item: '腰间的铁链' },
  '衙役': { topic: '衙门里的事', detail: '知县大人最近心情不好', item: '手中的水火棍' },
  '乞丐': { topic: '街头的见闻', detail: '城里最近来了不少外地人', item: '破碗里的几个铜板' },
  '僧人': { topic: '佛法的感悟', detail: '最近在读金刚经', item: '手中的念珠' },
  '道士': { topic: '阴阳的观察', detail: '最近观了星象', item: '拂尘上的流苏' },
  '说书人': { topic: '最近的故事', detail: '新编了一段评话', item: '醒木和折扇' },
  '艺人': { topic: '最近的演出', detail: '刚学会了一支新曲', item: '手中的乐器' },
  '卜者': { topic: '天象的推算', detail: '最近星象有些异动', item: '签筒里的签' },
  '军汉': { topic: '军营的规矩', detail: '最近操练很紧', item: '腰间的佩刀' },
  '酿酒师': { topic: '新酿的美酒', detail: '这批酒至少要窖藏半年', item: '酒坛子上的封泥' },
};

function getProfessionTopic(profession: string) {
  return PROFESSION_TOPIC[profession] || { topic: '最近的日子', detail: '日子一天天过去', item: '手中的物件' };
}

// ════════════════════════════════════════
// 动态场景生成器接口
// ════════════════════════════════════════

export interface DynamicSceneContext {
  actionId: string;
  npc: NearbyNpcInfo;
  playerContext: L0ActorContext;
  playerStats: Record<string, number>;
  tick: number;
}

let dynamicSceneCounter = 0;

// ════════════════════════════════════════
// 职业→背景映射
// ════════════════════════════════════════

const PROFESSION_BG: Record<string, string> = {
  '商贩': 'market', '小贩': 'market', '货郎': 'market',
  '农夫': 'courtyard', '猎户': 'alley', '渔夫': 'courtyard',
  '书生': 'teahouse', '秀才': 'teahouse',
  '郎中': 'teahouse', '铁匠': 'alley', '木匠': 'alley',
  '裁缝': 'market', '厨师': 'teahouse',
  '镖师': 'alley', '捕快': 'alley', '衙役': 'courtyard',
  '乞丐': 'alley', '僧人': 'courtyard', '道士': 'courtyard',
  '说书人': 'teahouse', '艺人': 'teahouse', '卜者': 'night_street',
  '军汉': 'alley', '酿酒师': 'teahouse',
};

function synthesizeDynamicVisual(ctx: DynamicSceneContext, mood: 'neutral' | 'angry' | 'happy' | 'sad' = 'neutral'): SceneVisualMeta {
  const { npc, playerContext } = ctx;
  const bg = PROFESSION_BG[npc.profession] || 'courtyard';
  const isDaytime = ['辰', '巳', '午', '未', '申', '酉'].includes(playerContext.shichen);
  const finalBg = (!isDaytime && bg === 'courtyard') ? 'night_street' : bg;

  const locationMap: Record<string, string> = {
    center_street: '汴京 · 中心街',
    east_market: '汴京 · 东市',
    tea_house: '汴京 · 茶楼',
    dock: '汴京 · 码头',
    residential_north: '汴京 · 北坊',
    residential_south: '汴京 · 南坊',
  };
  const location = locationMap[playerContext.currentGrid] || '汴京 · 街坊';

  return {
    background: finalBg,
    location,
    characters: [
      { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
      { id: 'npc', name: npc.name, glyph: npc.name[0] || '人', position: 'right', mood },
    ],
  };
}

function injectVisuals(scene: PlayerScene, ctx: DynamicSceneContext): PlayerScene {
  // 推断 mood
  const relation = ctx.npc.relationScore;
  let mood: 'neutral' | 'angry' | 'happy' | 'sad' = 'neutral';
  if (relation >= 30) mood = 'happy';
  else if (relation < -10) mood = 'angry';
  else if (ctx.actionId === 'provoke') mood = 'angry';
  else if (ctx.actionId === 'gift') mood = 'happy';

  const baseVisual = synthesizeDynamicVisual(ctx, mood);

  // openingVisual
  scene.openingVisual = { ...baseVisual };

  // 为每个 phase 添加 visual
  for (const phase of Object.values(scene.phases)) {
    // 从 narrative 关键词微调 mood
    let phaseMood: 'neutral' | 'angry' | 'happy' | 'sad' = mood;
    if (phase.narrative) {
      if (/怒|骂|吵|恨|愤/.test(phase.narrative)) phaseMood = 'angry';
      else if (/笑|喜|欢|乐/.test(phase.narrative)) phaseMood = 'happy';
      else if (/哭|悲|伤|叹/.test(phase.narrative)) phaseMood = 'sad';
    }
    phase.visual = { ...baseVisual, characters: baseVisual.characters.map(c =>
      c.id === 'npc' ? { ...c, mood: phaseMood } : c
    ) };
  }

  return scene;
}

export function generateDynamicScene(ctx: DynamicSceneContext): PlayerScene {
  const { actionId, npc, playerContext, playerStats } = ctx;
  const relation = npc.relationScore;
  const dominantTrait = npc.personality[0] || '温和';
  const voice = getTraitVoice(dominantTrait);
  const topic = getProfessionTopic(npc.profession);
  const npcName = npc.name;
  const isDaytime = ['辰', '巳', '午', '未', '申', '酉'].includes(playerContext.shichen);
  const timeDesc = isDaytime ? '日头正旺' : '暮色渐浓';
  const id = `dyn_${++dynamicSceneCounter}_${Date.now()}`;

  let scene: PlayerScene;
  // 根据动作类型选择场景原型
  if (actionId === 'provoke') scene = buildProvokeScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (actionId === 'gift' || actionId === 'bribe') scene = buildGiftScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (actionId.includes('trade') || actionId === 'luxury_deal') scene = buildTradeScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (actionId === 'gambling') scene = buildGamblingScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (actionId === 'fortune_telling') scene = buildFortuneScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (actionId === 'faction_salary' || actionId === 'faction_recruit') scene = buildFactionScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (relation < -10) scene = buildHostileScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else if (relation >= 30) scene = buildFriendlyScene(id, npcName, voice, topic, relation, timeDesc, ctx);
  else scene = buildNeutralScene(id, npcName, voice, topic, relation, timeDesc, ctx);

  return injectVisuals(scene, ctx);
}

// ════════════════════════════════════════
// 场景原型：友好交谈 (3幕)
// ════════════════════════════════════════

function buildFriendlyScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const locationDesc = ctx.playerContext.currentGrid === 'center_street' ? '街头' : ctx.playerContext.currentGrid;
  return {
    id,
    name: '故人相逢',
    description: '与熟人的一次愉快交谈',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '老友', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，${locationDesc}上行人来往。${npcName}${voice.greet}，看来对你颇为信赖。`,
    entryPhase: 'friendly_1',
    phases: {
      friendly_1: {
        phaseId: 'friendly_1',
        narrative: `${npcName}凑近了些，聊起了${topic.topic}。"${topic.detail}，"${npcName}说着，${voice.chat}。`,
        choices: [
          {
            id: 'f1_listen',
            text: '认真倾听，时不时点头附和。',
            consequence: {
              immediateEffects: { mood: 3 },
              relationChange: 2,
              nextPhase: 'friendly_2a',
            },
          },
          {
            id: 'f1_share',
            text: '分享自己最近的经历和见闻。',
            consequence: {
              immediateEffects: { mood: 2 },
              nextPhase: 'friendly_2b',
            },
          },
          {
            id: 'f1_help',
            text: `主动问${npcName}有没有什么需要帮忙的。`,
            condition: { field: 'personality', operator: 'includes', value: '善良' },
            consequence: {
              relationChange: 5,
              nextPhase: 'friendly_2c',
            },
          },
        ],
      },
      friendly_2a: {
        phaseId: 'friendly_2a',
        narrative: `你安静地听着${npcName}诉说。说着说着，${npcName}忽然压低了声音："其实有件事我一直没跟别人说……"`,
        choices: [
          {
            id: 'f2a_secret',
            text: '"你说，我听着。"',
            consequence: {
              relationChange: 5,
              immediateEffects: { mood: 2 },
              nextPhase: 'friendly_3',
            },
          },
          {
            id: 'f2a_dodge',
            text: '"这个……你还是找更合适的人说吧。"',
            consequence: {
              immediateEffects: { mood: -2 },
              relationChange: -2,
              nextPhase: null,
              endingNarrative: `${npcName}有些失望，但也没再说什么。你们闲聊了几句便各自散去。`,
            },
          },
        ],
      },
      friendly_2b: {
        phaseId: 'friendly_2b',
        narrative: `你讲起了最近遇到的趣事。${npcName}听得津津有味，不时插上几句。聊到兴起处，${npcName}笑着说："你可真有本事。"`,
        choices: [
          {
            id: 'f2b_humble',
            text: '"哪里哪里，不过是运气好罢了。"',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 3 },
              nextPhase: 'friendly_3',
            },
          },
          {
            id: 'f2b_invite',
            text: '"下次有好事，叫上你一起。"',
            condition: { field: 'personality', operator: 'includes', value: '勇敢' },
            consequence: {
              relationChange: 6,
              immediateEffects: { mood: 4 },
              nextPhase: null,
              endingNarrative: `${npcName}眼睛一亮："一言为定！"两人相视而笑，约定下次再聚。离别时，${npcName}还特意送了你几文钱的零嘴。`,
            },
          },
        ],
      },
      friendly_2c: {
        phaseId: 'friendly_2c',
        narrative: `${npcName}犹豫了一下，${voice.chat}。"其实……${topic.detail}。如果你能搭把手，那就太好了。"`,
        choices: [
          {
            id: 'f2c_agree',
            text: '"包在我身上。"',
            consequence: {
              relationChange: 8,
              immediateEffects: { fatigue: -3, mood: 5 },
              nextPhase: 'friendly_3',
            },
          },
          {
            id: 'f2c_copper',
            text: '"我给你几文钱应急吧。"',
            condition: { field: 'copper', operator: 'gte', value: 10 },
            consequence: {
              immediateEffects: { copper: -10, mood: 3 },
              relationChange: 6,
              nextPhase: null,
              endingNarrative: `${npcName}感激不尽，收下了铜钱。"你这人真够意思，改日一定还你。"`,
            },
          },
        ],
      },
      friendly_3: {
        phaseId: 'friendly_3',
        narrative: `天色渐晚，${npcName}站起身来，伸了个懒腰。"今日与你交谈甚欢。人这一辈子，能有几个说得来话的朋友呢？"`,
        choices: [
          {
            id: 'f3_promise',
            text: '"改日再聚，后会有期。"',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: `你和${npcName}拱手作别，各自上路。街角的风吹过来，带着一股暖意。这段交情，看来会越处越深。`,
            },
          },
          {
            id: 'f3_gift',
            text: '从袖中取出一件小物递过去。',
            condition: { field: 'copper', operator: 'gte', value: 5 },
            consequence: {
              immediateEffects: { copper: -5, mood: 5 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative: `${npcName}接过东西，眼中闪过一丝感动。"这……多谢了。"把东西小心收好，${npcName}郑重地对你行了一礼。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：中立初识 (2-3幕)
// ════════════════════════════════════════

function buildNeutralScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const locationDesc = ctx.playerContext.currentGrid === 'center_street' ? '街头' : ctx.playerContext.currentGrid;
  return {
    id,
    name: '萍水相逢',
    description: '与陌生人的初次交谈',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '路人', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你在${locationDesc}遇见了${npcName}。${npcName}${voice.greet}，似乎注意到了你。`,
    entryPhase: 'neutral_1',
    phases: {
      neutral_1: {
        phaseId: 'neutral_1',
        narrative: `${npcName}打量了你一眼，${voice.chat}。"你是这附近的？我之前好像没见过你。"`,
        choices: [
          {
            id: 'n1_introduce',
            text: '"在下初来乍到，还请多多关照。"',
            consequence: {
              relationChange: 2,
              nextPhase: 'neutral_2a',
            },
          },
          {
            id: 'n1_ask',
            text: `"这附近有什么有趣的事吗？"`,
            consequence: {
              relationChange: 1,
              nextPhase: 'neutral_2b',
            },
          },
          {
            id: 'n1_nod',
            text: '点点头，继续赶路。',
            consequence: {
              nextPhase: null,
              endingNarrative: `你和${npcName}擦肩而过，各走各路。这世间的缘分，有时就是这样浅尝辄止。`,
            },
          },
        ],
      },
      neutral_2a: {
        phaseId: 'neutral_2a',
        narrative: `${npcName}的表情缓和了些。"原来是外乡来的。这地方嘛，说大不大，说小不小。"说着，${voice.chat}。"${topic.detail}。"`,
        choices: [
          {
            id: 'n2a_curious',
            text: `"能详细说说吗？"`,
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 2 },
              nextPhase: 'neutral_3',
            },
          },
          {
            id: 'n2a_trade',
            text: `"有什么需要帮忙的吗？或者……需要买点什么？"`,
            condition: { field: 'copper', operator: 'gte', value: 5 },
            consequence: {
              immediateEffects: { copper: -5, mood: 1 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative: `你掏出几文铜钱买了${topic.item}。${npcName}笑着收下："下次再来啊。"算是一个不错的开头。`,
            },
          },
          {
            id: 'n2a_leave',
            text: '"多谢告知，告辞。"',
            consequence: {
              relationChange: 1,
              nextPhase: null,
              endingNarrative: `${npcName}点了点头，目送你离去。也许下次见面时，你们会聊得更多。`,
            },
          },
        ],
      },
      neutral_2b: {
        phaseId: 'neutral_2b',
        narrative: `${npcName}想了想，${voice.chat}。"有趣的事嘛……${topic.detail}。对了，最近城里倒是有些新鲜事。"`,
        choices: [
          {
            id: 'n2b_listen',
            text: '"哦？说来听听。"',
            consequence: {
              immediateEffects: { mood: 2 },
              relationChange: 3,
              nextPhase: 'neutral_3',
            },
          },
          {
            id: 'n2b_shrug',
            text: '"罢了，改日再聊。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `你摆了摆手，${npcName}也不强留。两人各自散去，街巷恢复了之前的安静。`,
            },
          },
        ],
      },
      neutral_3: {
        phaseId: 'neutral_3',
        narrative: `聊了一阵，${npcName}似乎对你有了几分好感。${voice.chat}，"你这个人还不错，以后有事可以来找我。"`,
        choices: [
          {
            id: 'n3_thanks',
            text: '"承蒙看重，后会有期。"',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 2 },
              nextPhase: null,
              endingNarrative: `你和${npcName}互道珍重。这次相遇虽是萍水相逢，倒也不算虚度。`,
            },
          },
          {
            id: 'n3_keep',
            text: '"不如找个时间再聊聊？"',
            consequence: {
              relationChange: 4,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: `${npcName}笑着答应了。也许在不久的将来，你们会成为真正的朋友。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：敌对遭遇 (2-3幕)
// ════════════════════════════════════════

function buildHostileScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const locationDesc = ctx.playerContext.currentGrid === 'center_street' ? '街头' : ctx.playerContext.currentGrid;
  return {
    id,
    name: '狭路相逢',
    description: '与不合之人的不期而遇',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '对手', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你在${locationDesc}撞见了${npcName}。${npcName}${voice.upset}，显然不想见到你。`,
    entryPhase: 'hostile_1',
    phases: {
      hostile_1: {
        phaseId: 'hostile_1',
        narrative: `${npcName}${voice.refuse}空气中弥漫着一股尴尬的气息。${npcName}似乎正在气头上，${voice.chat}。`,
        choices: [
          {
            id: 'h1_apologize',
            text: '"之前的事，是我做得不对。"',
            consequence: {
              relationChange: 5,
              nextPhase: 'hostile_2a',
            },
          },
          {
            id: 'h1_stand',
            text: '不卑不亢地站着，一言不发。',
            consequence: {
              nextPhase: 'hostile_2b',
            },
          },
          {
            id: 'h1_leave',
            text: '转身就走，不给自己找不痛快。',
            consequence: {
              immediateEffects: { mood: -2 },
              nextPhase: null,
              endingNarrative: `你头也不回地走开了。身后传来${npcName}的冷哼声。有些梁子，不解开就会越结越深。`,
            },
          },
        ],
      },
      hostile_2a: {
        phaseId: 'hostile_2a',
        narrative: `${npcName}愣了一下，没想到你会主动道歉。${voice.chat}，"你这话……算是认了？"`,
        choices: [
          {
            id: 'h2a_sincere',
            text: '"是我真心实意的。"',
            consequence: {
              relationChange: 8,
              immediateEffects: { mood: 3 },
              nextPhase: 'hostile_3',
            },
          },
          {
            id: 'h2a_conditional',
            text: '"大家各退一步，以后井水不犯河水。"',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 1 },
              nextPhase: null,
              endingNarrative: `${npcName}想了想，点了点头。"行，就依你说的办。"虽然算不上和好，但至少不会再生事端。`,
            },
          },
        ],
      },
      hostile_2b: {
        phaseId: 'hostile_2b',
        narrative: `两人对峙了片刻。${npcName}${voice.upset}，${voice.refuse}"你还敢出现在我面前？"`,
        choices: [
          {
            id: 'h2b_defuse',
            text: '"我没想跟你吵架。"',
            consequence: {
              relationChange: 2,
              nextPhase: 'hostile_3',
            },
          },
          {
            id: 'h2b_provoke_back',
            text: '"这路又不是你家的。"',
            consequence: {
              relationChange: -5,
              immediateEffects: { mood: -5 },
              nextPhase: null,
              endingNarrative: `${npcName}被你激怒了，${voice.upset}。两人不欢而散，路人纷纷侧目。这段仇怨怕是更深了。`,
            },
          },
        ],
      },
      hostile_3: {
        phaseId: 'hostile_3',
        narrative: `气氛缓和了一些。${npcName}${voice.chat}，似乎也觉得没必要闹得太过。"行吧，过去的事……就先不提了。"`,
        choices: [
          {
            id: 'h3_handshake',
            text: '伸出手，表示和解。',
            consequence: {
              relationChange: 6,
              immediateEffects: { mood: 4 },
              nextPhase: null,
              endingNarrative: `${npcName}犹豫了一下，最终还是握住了你的手。"但愿如此。"也许这是一个新的开始。`,
            },
          },
          {
            id: 'h3_nod',
            text: '默默点头，不再多言。',
            consequence: {
              relationChange: 2,
              nextPhase: null,
              endingNarrative: `你们之间达成了某种默契。虽算不上朋友，但至少不再是仇敌。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：交易互动 (2幕)
// ════════════════════════════════════════

function buildTradeScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const isBuy = ctx.actionId === 'trade_buy';
  const sceneName = isBuy ? '市井交易' : '出手货物';
  const entryPhase = isBuy ? 'trade_buy_1' : 'trade_sell_1';

  const buyPhases: Record<string, PlayerSceneStep> = {
    trade_buy_1: {
      phaseId: 'trade_buy_1',
      narrative: `${npcName}把${topic.item}摆在你面前，${voice.chat}。"你看看，成色不错吧？"`,
      choices: [
        {
          id: 'tb1_bargain',
          text: '"便宜点如何？"',
          consequence: {
            nextPhase: 'trade_buy_2',
          },
        },
        {
          id: 'tb1_accept',
          text: '"行，就这个价。"',
          condition: { field: 'copper', operator: 'gte', value: 10 },
          consequence: {
            immediateEffects: { copper: -10, mood: 2 },
            relationChange: 3,
            nextPhase: null,
            endingNarrative: `你掏出铜板，${npcName}高高兴兴地把${topic.item}递给你。"下次再来啊！"`,
          },
        },
        {
          id: 'tb1_walk',
          text: '"算了，我再看看。"',
          consequence: {
            nextPhase: null,
            endingNarrative: `你转身离开摊位。${npcName}在身后喊道："回来啊，价钱好商量！"`,
          },
        },
      ],
    },
    trade_buy_2: {
      phaseId: 'trade_buy_2',
      narrative: `${npcName}${voice.chat}，"你要是诚心要，我让一步。不过也不能太亏本不是？"`,
      choices: [
        {
          id: 'tb2_deal',
          text: '"成交。"',
          condition: { field: 'copper', operator: 'gte', value: 8 },
          consequence: {
            immediateEffects: { copper: -8, mood: 3 },
            relationChange: 4,
            nextPhase: null,
            endingNarrative: `双方一拍即合。${npcName}把东西包好递过来，笑眯眯地说："做生意嘛，和气生财。"你满意地收下了${topic.item}。`,
          },
        },
        {
          id: 'tb2_push',
          text: '"再少点，我下次还来。"',
          consequence: {
            immediateEffects: { mood: 1 },
            relationChange: 1,
            nextPhase: null,
            endingNarrative: `${npcName}犹豫了一下，最终还是给了你一个实惠的价钱。"说了可要常来啊。"`,
          },
        },
        {
          id: 'tb2_giveup',
          text: '"还是太贵了，算了吧。"',
          consequence: {
            immediateEffects: { mood: -1 },
            nextPhase: null,
            endingNarrative: `买卖不成仁义在。${npcName}收起东西，并不恼怒。"下次有钱了再来。"` ,
          },
        },
      ],
    },
  };

  const sellPhases: Record<string, PlayerSceneStep> = {
    trade_sell_1: {
      phaseId: 'trade_sell_1',
      narrative: `${npcName}看了看你手中的物件，${voice.chat}。"这东西嘛……还行，你开个价？"`,
      choices: [
        {
          id: 'ts1_high',
          text: '"一口价，二十文。"',
          consequence: {
            nextPhase: 'trade_sell_2',
          },
        },
        {
          id: 'ts1_fair',
          text: '"你看着给，公道就行。"',
          consequence: {
            immediateEffects: { copper: 8, mood: 2 },
            relationChange: 3,
            nextPhase: null,
            endingNarrative: `${npcName}给了你一个还算公道的价钱。"够意思。以后有货再来找我。"`,
          },
        },
      ],
    },
    trade_sell_2: {
      phaseId: 'trade_sell_2',
      narrative: `${npcName}${voice.upset}，"二十文？你这也太狮子大开口了。"`,
      choices: [
        {
          id: 'ts2_lower',
          text: '"那十五文，不能再少了。"',
          consequence: {
            immediateEffects: { copper: 12, mood: 2 },
            relationChange: 2,
            nextPhase: null,
            endingNarrative: `${npcName}想了想，"行吧，十二文拿走。"虽没要到二十文，但也不亏。`,
          },
        },
        {
          id: 'ts2_stick',
          text: '"东西就值这个价。"',
          consequence: {
            immediateEffects: { mood: -1 },
            relationChange: -2,
            nextPhase: null,
            endingNarrative: `${npcName}摇了摇头，不再议价。你悻悻地收起东西，也许该找个更好的买主。`,
          },
        },
      ],
    },
  };

  return {
    id,
    name: sceneName,
    description: '市井中的买卖交易',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '交易对象', minCount: 1, maxCount: 1 }],
    openingNarrative: `你来到${npcName}面前，准备谈一笔买卖。`,
    entryPhase,
    phases: isBuy ? buyPhases : sellPhases,
    weight: 10,
    cooldownTicks: 3,
  };
}

// ════════════════════════════════════════
// 场景原型：赠礼 (2幕)
// ════════════════════════════════════════

function buildGiftScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const locationDesc = ctx.playerContext.currentGrid === 'center_street' ? '街头' : ctx.playerContext.currentGrid;
  return {
    id,
    name: '赠礼示意',
    description: '向NPC赠礼以改善关系',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '受赠者', minCount: 1, maxCount: 1 }],
    openingNarrative: `你在${locationDesc}遇到了${npcName}。心想，或许送点什么能拉近关系。`,
    entryPhase: 'gift_1',
    phases: {
      gift_1: {
        phaseId: 'gift_1',
        narrative: `${npcName}${voice.greet}。你掏出一件精心准备的小礼物，递了过去。`,
        choices: [
          {
            id: 'g1_generous',
            text: '"这是我的一点心意，请收下。"',
            condition: { field: 'copper', operator: 'gte', value: 15 },
            consequence: {
              immediateEffects: { copper: -15, mood: 3 },
              relationChange: 8,
              nextPhase: 'gift_2a',
            },
          },
          {
            id: 'g1_modest',
            text: '"不贵重，但胜在实用。"',
            condition: { field: 'copper', operator: 'gte', value: 5 },
            consequence: {
              immediateEffects: { copper: -5, mood: 2 },
              relationChange: 4,
              nextPhase: 'gift_2b',
            },
          },
          {
            id: 'g1_reconsider',
            text: '犹豫了一下，还是收了回去。',
            consequence: {
              immediateEffects: { mood: -2 },
              nextPhase: null,
              endingNarrative: `你改变了主意。${npcName}似乎有些困惑，但也没说什么。也许下次准备好了再来。`,
            },
          },
        ],
      },
      gift_2a: {
        phaseId: 'gift_2a',
        narrative: `${npcName}接过礼物，眼中满是惊喜。${voice.chat}，"这……这也太破费了。"`,
        choices: [
          {
            id: 'g2a_wave',
            text: '"区区薄礼，不足挂齿。"',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: `${npcName}把礼物小心收好，${voice.chat}。你感到两人之间的关系更近了一步。`,
            },
          },
          {
            id: 'g2a_ask',
            text: '"以后有什么事尽管开口。"',
            consequence: {
              relationChange: 5,
              immediateEffects: { mood: 4 },
              nextPhase: null,
              endingNarrative: `${npcName}郑重地点了点头。"一定一定。"你送出的不仅是一件礼物，更是一份承诺。`,
            },
          },
        ],
      },
      gift_2b: {
        phaseId: 'gift_2b',
        narrative: `${npcName}看了看你的礼物，${voice.chat}。"你还挺有心意的。"`,
        choices: [
          {
            id: 'g2b_smile',
            text: '"你喜欢就好。"',
            consequence: {
              relationChange: 2,
              immediateEffects: { mood: 2 },
              nextPhase: null,
              endingNarrative: `${npcName}收下了礼物，对你多了几分好感。礼轻情意重，古人诚不欺我。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：挑衅 (2-3幕)
// ════════════════════════════════════════

function buildProvokeScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const locationDesc = ctx.playerContext.currentGrid === 'center_street' ? '街头' : ctx.playerContext.currentGrid;
  return {
    id,
    name: '蓄意挑衅',
    description: '故意找茬引发冲突',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '对手', minCount: 1, maxCount: 1 }],
    openingNarrative: `你大步走向${npcName}，目光不善。${timeDesc}的${locationDesc}上，路人纷纷避让。`,
    entryPhase: 'provoke_1',
    phases: {
      provoke_1: {
        phaseId: 'provoke_1',
        narrative: `你冷冷地盯着${npcName}。${npcName}${voice.upset}，显然感受到了你的敌意。"你什么意思？"`,
        choices: [
          {
            id: 'p1_insult',
            text: `"${npcName}，听说你最近做了些见不得人的事。"`,
            consequence: {
              relationChange: -5,
              immediateEffects: { mood: -3 },
              nextPhase: 'provoke_2a',
            },
          },
          {
            id: 'p1_threaten',
            text: '"识相的话，离这儿远点。"',
            consequence: {
              relationChange: -3,
              nextPhase: 'provoke_2b',
            },
          },
          {
            id: 'p1_backdown',
            text: '冷静下来，决定不惹事。',
            consequence: {
              immediateEffects: { mood: -1 },
              nextPhase: null,
              endingNarrative: `你深吸一口气，转身离开。${npcName}在身后冷笑了一声。有时候忍耐也是一种智慧。`,
            },
          },
        ],
      },
      provoke_2a: {
        phaseId: 'provoke_2a',
        narrative: `${npcName}脸色大变，${voice.upset}。"你在胡说什么！信不信我——"周围的路人开始围观。`,
        choices: [
          {
            id: 'p2a_push',
            text: '往前逼近一步。',
            consequence: {
              immediateEffects: { health: -5, mood: -5 },
              relationChange: -8,
              nextPhase: null,
              endingNarrative: `两人差点动起手来，好在旁人及时拉开。${npcName}指着你的鼻子骂了几句，扬长而去。这下算是结了大仇了。`,
            },
          },
          {
            id: 'p2a_smile',
            text: '露出一丝冷笑，转身离去。',
            consequence: {
              immediateEffects: { mood: 2 },
              relationChange: -3,
              nextPhase: null,
              endingNarrative: `你在众人面前占了上风。${npcName}咬着牙，却不敢追上来。虽然树了个敌人，但也算是出了口气。`,
            },
          },
        ],
      },
      provoke_2b: {
        phaseId: 'provoke_2b',
        narrative: `${npcName}${voice.chat}，眼神变得锐利。"你凭什么？"`,
        choices: [
          {
            id: 'p2b_copper',
            text: '"我出十文钱，请你换个地方。"',
            condition: { field: 'copper', operator: 'gte', value: 10 },
            consequence: {
              immediateEffects: { copper: -10 },
              relationChange: -2,
              nextPhase: null,
              endingNarrative: `${npcName}看了看铜钱，犹豫了一下，最终收下了。"算你识相。"拿了钱便走，虽然花了钱，但至少避免了一场冲突。`,
            },
          },
          {
            id: 'p2b_face',
            text: '"就凭这个。"你亮了亮拳头。',
            consequence: {
              immediateEffects: { mood: -3, health: -3 },
              relationChange: -6,
              nextPhase: null,
              endingNarrative: `${npcName}${voice.upset}，但看到你的架势后还是退了一步。"算你狠。"虽然赢了面子，但路又窄了一分。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：赌博 (2幕)
// ════════════════════════════════════════

function buildGamblingScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  return {
    id,
    name: '掷骰赌局',
    description: '与NPC来一场小赌',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '赌伴', minCount: 1, maxCount: 1 }],
    openingNarrative: `${npcName}拍了拍身边的位置，${voice.chat}"来一局？小赌怡情。"`,
    entryPhase: 'gamble_1',
    phases: {
      gamble_1: {
        phaseId: 'gamble_1',
        narrative: `${npcName}拿出一副骰子，在手心里晃了晃。"规矩简单，猜大小。押多少随你。"桌上的铜板叮当作响。`,
        choices: [
          {
            id: 'g1_small',
            text: '"我押小，五文钱。"',
            condition: { field: 'copper', operator: 'gte', value: 5 },
            consequence: { immediateEffects: { copper: -5 }, nextPhase: 'gamble_2a' },
          },
          {
            id: 'g1_big',
            text: '"押大，十文钱！"',
            condition: { field: 'copper', operator: 'gte', value: 10 },
            consequence: { immediateEffects: { copper: -10 }, nextPhase: 'gamble_2b' },
          },
          {
            id: 'g1_decline',
            text: '"算了，我今天手气不好。"',
            consequence: {
              immediateEffects: { mood: -1 },
              nextPhase: null,
              endingNarrative: `${npcName}耸耸肩。"也罢，改天再来。"你看着骰子滚动的声音渐行渐远。`,
            },
          },
        ],
      },
      gamble_2a: {
        phaseId: 'gamble_2a',
        narrative: `骰子在碗中叮叮当当滚了好几圈，终于停了下来。${npcName}凑过去一看，${voice.upset}`,
        choices: [
          {
            id: 'g2a_win',
            text: '是双三——小！赢了！',
            consequence: {
              immediateEffects: { copper: 10, mood: 8 },
              relationChange: 2,
              nextPhase: null,
              endingNarrative: `"哈！手气不错！"${npcName}把铜板推过来。"改天再来。"`,
            },
          },
        ],
      },
      gamble_2b: {
        phaseId: 'gamble_2b',
        narrative: `骰子咕噜噜转了好几圈。${npcName}探过头去，嘴角慢慢翘了起来。`,
        choices: [
          {
            id: 'g2b_lose',
            text: '是双五——小……输了。',
            consequence: {
              immediateEffects: { mood: -5 },
              relationChange: 1,
              nextPhase: null,
              endingNarrative: `${npcName}笑呵呵地收起铜板。"愿赌服输嘛。"`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：占卜 (2幕)
// ════════════════════════════════════════

function buildFortuneScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  return {
    id,
    name: '街头占卜',
    description: '请NPC为你算一卦',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '卜者', minCount: 1, maxCount: 1 }],
    openingNarrative: `${npcName}摆出签筒，${voice.chat}"算一卦？不准不要钱。"`,
    entryPhase: 'fortune_1',
    phases: {
      fortune_1: {
        phaseId: 'fortune_1',
        narrative: `签筒在${npcName}手中哗哗作响。"心诚则灵。你摇一摇，问个心中所想之事。"`,
        choices: [
          {
            id: 'f1_fortune',
            text: '"我想问前程。"',
            condition: { field: 'copper', operator: 'gte', value: 3 },
            consequence: { immediateEffects: { copper: -3 }, nextPhase: 'fortune_2a' },
          },
          {
            id: 'f1_love',
            text: '"问姻缘。"',
            condition: { field: 'copper', operator: 'gte', value: 3 },
            consequence: { immediateEffects: { copper: -3 }, nextPhase: 'fortune_2b' },
          },
          {
            id: 'f1_leave',
            text: '"算了，我还是不信这个。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.refuse}你转身走开，身后传来签筒晃动的声音。`,
            },
          },
        ],
      },
      fortune_2a: {
        phaseId: 'fortune_2a',
        narrative: `一支签掉了出来。${npcName}捻着胡须看了看。"上签。近期有贵人相助，但切记——莫要贪功冒进。"`,
        choices: [
          {
            id: 'f2a_thanks',
            text: '"多谢指点。"恭敬地行一礼。',
            consequence: {
              immediateEffects: { mood: 5 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative: `${npcName}满意地点了点头。"去吧，好自为之。"`,
            },
          },
        ],
      },
      fortune_2b: {
        phaseId: 'fortune_2b',
        narrative: `${npcName}闭目冥想了一会儿。"中签。缘分未到，但不必心急。此月之中，留心身边人。"`,
        choices: [
          {
            id: 'f2b_ok',
            text: '"身边人……我记住了。"',
            consequence: {
              immediateEffects: { mood: 3 },
              relationChange: 2,
              nextPhase: null,
              endingNarrative: `${npcName}收起签筒。"天机不可多泄。"你揣着这句话离开了。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ════════════════════════════════════════
// 场景原型：势力交涉 (1幕)
// ════════════════════════════════════════

function buildFactionScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  return {
    id,
    name: '势力交涉',
    description: '与NPC进行势力相关的互动',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '对方', minCount: 1, maxCount: 1 }],
    openingNarrative: `你找到${npcName}，${voice.greet}看来正是谈正事的时候。`,
    entryPhase: 'faction_1',
    phases: {
      faction_1: {
        phaseId: 'faction_1',
        narrative: `${npcName}正了正衣冠，${voice.chat}"说吧，什么事？"`,
        choices: [
          {
            id: 'fc1_coop',
            text: '"想和您谈一桩合作。"',
            consequence: {
              immediateEffects: { mood: 3 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative: `${npcName}听完你的来意，若有所思地点了点头。"此事容我想想。"`,
            },
          },
          {
            id: 'fc1_flatter',
            text: '"久仰大名，今日终于得见。"',
            consequence: {
              immediateEffects: { mood: 2 },
              relationChange: 2,
              nextPhase: null,
              endingNarrative: `${npcName}嘴角微微上扬。"客套话就不必了。"虽然嘴上这样说，但心情不错。`,
            },
          },
          {
            id: 'fc1_direct',
            text: '"开门见山，我有个请求。"',
            consequence: {
              relationChange: -1,
              nextPhase: null,
              endingNarrative: `${npcName}${voice.upset}但最终还是听你说完了。"此事难办，容后再议。"`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}
