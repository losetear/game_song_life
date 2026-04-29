// === 动态场景生成器 ===
//
// 当预定义场景不匹配时，根据 NPC 性格/关系/职业/动作类型
// 动态生成漫野奇谭式多幕剧情
//
// 9 种场景原型：友好交谈、中立初识、敌对遭遇、交易互动、赠礼、挑衅、赌博、占卜、势力交涉
//
// 增强特性：
// - 赌博/交易使用 tiered resolution（概率判定，非硬编码输赢）
// - NPC 职业解锁额外选项
// - NPC 状态影响叙事（低健康→悲观叙事）
// - 关系深度分支（5级：密友/朋友/熟人/不喜/仇敌）
// - 关键后果加 transformations（角色变形）

import {
  PlayerScene, PlayerSceneChoice, PlayerSceneStep,
  NearbyNpcInfo, L0ActorContext, SceneVisualMeta,
  CharacterTransformation,
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
// 关系深度分级（5级）
// ════════════════════════════════════════

type RelationDepth = '密友' | '朋友' | '熟人' | '不喜' | '仇敌';

function getRelationDepth(relation: number): RelationDepth {
  if (relation >= 60) return '密友';
  if (relation >= 30) return '朋友';
  if (relation >= 0) return '熟人';
  if (relation >= -30) return '不喜';
  return '仇敌';
}

function getRelationTone(relation: number): string {
  const depth = getRelationDepth(relation);
  return RELATION_TONE[depth].parting;
}

const RELATION_TONE: Record<RelationDepth, { greetPrefix: string; chatStyle: string; parting: string }> = {
  '密友': { greetPrefix: '像见到亲人一样', chatStyle: '推心置腹地', parting: '依依不舍地' },
  '朋友': { greetPrefix: '亲切地', chatStyle: '轻松地', parting: '笑着' },
  '熟人': { greetPrefix: '客气地', chatStyle: '淡淡地', parting: '礼貌地' },
  '不喜': { greetPrefix: '冷淡地', chatStyle: '不耐烦地', parting: '敷衍地' },
  '仇敌': { greetPrefix: '厌恶地', chatStyle: '充满敌意地', parting: '头也不回地' },
};

// ════════════════════════════════════════
// NPC状态影响（健康→叙事语调）
// ════════════════════════════════════════

function getHealthNarrativeMod(health: number): { prefix: string; suffix: string } {
  if (health <= 20) return { prefix: '面色苍白、气息微弱的', suffix: '，说话间不时咳嗽几声' };
  if (health <= 40) return { prefix: '看起来有些憔悴的', suffix: '，精神似乎不太好' };
  if (health >= 80) return { prefix: '精神饱满的', suffix: '' };
  return { prefix: '', suffix: '' };
}

// ════════════════════════════════════════
// 职业→额外选项映射
// ════════════════════════════════════════

const PROFESSION_EXTRA_CHOICES: Record<string, {
  sceneType: string;
  choice: PlayerSceneChoice;
}[]> = {
  '郎中': [{
    sceneType: 'friendly',
    choice: {
      id: 'prof_heal',
      text: '"最近身体不太好，能帮我看看吗？"',
      condition: { field: 'health', operator: 'lte', value: 50 },
      consequence: {
        immediateEffects: { health: 10, copper: -5, mood: 5 },
        relationChange: 5,
        nextPhase: null,
        endingNarrative: '{npcName}为你把了脉，开了几服药。"不碍事，按方子吃几剂就好了。"你感激地道了谢。',
        outcome: {
          narrative: '请郎中朋友看了病，身体状况有所好转。',
          effects: { health: 10 },
        },
      },
    },
  }],
  '铁匠': [{
    sceneType: 'trade',
    choice: {
      id: 'prof_forge',
      text: '"能帮我打件趁手的家伙吗？"',
      condition: { field: 'copper', operator: 'gte', value: 20 },
      consequence: {
        immediateEffects: { copper: -20, mood: 3 },
        relationChange: 5,
        nextPhase: null,
        endingNarrative: '铁匠爽快地答应了，叮叮当当锤了一盏茶的功夫，递给你一件精巧的铁器。"自家打的，结实！"',
      },
    },
  }],
  '书生': [{
    sceneType: 'neutral',
    choice: {
      id: 'prof_teach',
      text: '"最近可有什么好书推荐？"',
      consequence: {
        immediateEffects: { mood: 5 },
        relationChange: 3,
        nextPhase: null,
        endingNarrative: '{npcName}眼睛一亮，滔滔不绝地推荐了好几本书。你们聊了大半个时辰，临别时{npcName}还特意借了一本给你。',
      },
    },
  }],
  '捕快': [{
    sceneType: 'neutral',
    choice: {
      id: 'prof_law',
      text: '"最近城里治安如何？有什么需要注意的？"',
      consequence: {
        immediateEffects: { mood: 2 },
        relationChange: 2,
        nextPhase: null,
        endingNarrative: '{npcName}压低声音说了几桩最近发生的事。你暗暗记在心里，以后走路会多个心眼。',
      },
    },
  }],
  '商贩': [{
    sceneType: 'trade',
    choice: {
      id: 'prof_bulk',
      text: '"量大从优，能再便宜些吗？我经常来买的。"',
      condition: { field: 'copper', operator: 'gte', value: 15 },
      consequence: {
        immediateEffects: { copper: -12, mood: 3 },
        relationChange: 3,
        nextPhase: null,
        endingNarrative: '{npcName}想了想，"老顾客了，给你个实在价。"你用比平时便宜不少的价格买到了东西。',
      },
    },
  }],
};

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
  let sceneType: string;
  // 根据动作类型选择场景原型
  if (actionId === 'provoke') { scene = buildProvokeScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'provoke'; }
  else if (actionId === 'gift' || actionId === 'bribe') { scene = buildGiftScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'gift'; }
  else if (actionId.includes('trade') || actionId === 'luxury_deal') { scene = buildTradeScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'trade'; }
  else if (actionId === 'gambling') { scene = buildGamblingScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'gambling'; }
  else if (actionId === 'fortune_telling') { scene = buildFortuneScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'fortune'; }
  else if (actionId === 'faction_salary' || actionId === 'faction_recruit') { scene = buildFactionScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'faction'; }
  // === 新增：专属场景构建器 ===
  else if (actionId === 'ask_rumor') { scene = buildAskRumorScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'ask_rumor'; }
  else if (actionId === 'share_food') { scene = buildShareFoodScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'share_food'; }
  else if (actionId === 'help_request') { scene = buildHelpScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'help'; }
  else if (actionId === 'learn_skill' || actionId === 'teach') { scene = buildLearnSkillScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'learn_skill'; }
  else if (actionId === 'heal') { scene = buildHealScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'heal'; }
  else if (actionId === 'sworn_brothers') { scene = buildSwornBrothersScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'sworn_brothers'; }
  else if (actionId === 'steal') { scene = buildStealScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'steal'; }
  else if (['blacksmith_craft', 'farm_work', 'hunt_guide'].includes(actionId)) { scene = buildProfessionScene(id, npcName, voice, topic, relation, timeDesc, ctx, actionId); sceneType = 'profession'; }
  else if (actionId.startsWith('faction_') || actionId === 'guard_patrol') { scene = buildFactionOpsScene(id, npcName, voice, topic, relation, timeDesc, ctx, actionId); sceneType = 'faction_ops'; }
  else if (actionId.startsWith('family_')) { scene = buildFamilyScene(id, npcName, voice, topic, relation, timeDesc, ctx, actionId); sceneType = 'family'; }
  else if (actionId === 'black_market' || actionId === 'loan') { scene = buildBlackMarketScene(id, npcName, voice, topic, relation, timeDesc, ctx, actionId); sceneType = 'black_market'; }
  else if (['collect_tax', 'charity', 'invite_travel'].includes(actionId)) { scene = buildCivicScene(id, npcName, voice, topic, relation, timeDesc, ctx, actionId); sceneType = 'civic'; }
  // === 兜底：通用关系场景 ===
  else if (relation < -10) { scene = buildHostileScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'hostile'; }
  else if (relation >= 30) { scene = buildFriendlyScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'friendly'; }
  else { scene = buildNeutralScene(id, npcName, voice, topic, relation, timeDesc, ctx); sceneType = 'neutral'; }

  // 注入职业额外选项
  const extras = PROFESSION_EXTRA_CHOICES[npc.profession];
  if (extras) {
    for (const extra of extras) {
      if (extra.sceneType === sceneType || extra.sceneType === 'any') {
        // 注入到第一个 phase 的 choices 末尾
        const firstPhase = scene.phases[scene.entryPhase];
        if (firstPhase) {
          const patchedChoice = { ...extra.choice, id: `${extra.choice.id}_${id}` };
          // 替换叙事中的 {npcName}
          if (patchedChoice.consequence.endingNarrative) {
            patchedChoice.consequence.endingNarrative = patchedChoice.consequence.endingNarrative.replace(/\{npcName\}/g, npcName);
          }
          firstPhase.choices.push(patchedChoice);
        }
      }
    }
  }

  // NPC 状态影响：在开场叙事中注入健康描述
  const healthMod = getHealthNarrativeMod(npc.health);
  if (healthMod.prefix && scene.openingNarrative) {
    scene.openingNarrative = scene.openingNarrative.replace(
      npcName,
      `${healthMod.prefix}${npcName}`,
    );
  }

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
              outcome: {
                narrative: '赠送贵重礼物，加深了彼此的交情。',
                effects: { mood: 4 },
                transformations: [
                  { type: 'gain_narrative_tag', value: 'generous', description: '慷慨地赠送礼物给他人' },
                ],
              },
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
              outcome: {
                narrative: '故意挑衅导致冲突升级，结下了仇怨。',
                effects: { mood: -5 },
                transformations: [
                  { type: 'gain_narrative_tag', value: 'troublemaker', description: '在街头挑起冲突' },
                ],
              },
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
    description: '与NPC来一场赌局，使用概率判定',
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
            consequence: { immediateEffects: { copper: -5 }, nextPhase: 'gamble_roll' },
          },
          {
            id: 'g1_big',
            text: '"押大，十文钱！"',
            condition: { field: 'copper', operator: 'gte', value: 10 },
            consequence: { immediateEffects: { copper: -10 }, nextPhase: 'gamble_roll' },
          },
          {
            id: 'g1_allin',
            text: '"全押！二十文，一把定输赢！"',
            condition: { field: 'copper', operator: 'gte', value: 20 },
            consequence: {
              immediateEffects: { copper: -20 },
              nextPhase: 'gamble_roll',
            },
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
      gamble_roll: {
        phaseId: 'gamble_roll',
        narrative: `骰子在碗中叮叮当当滚了好几圈，终于缓缓停了下来。${npcName}屏住呼吸凑过去看——`,
        choices: [
          {
            id: 'g2_reveal',
            text: '看看结果……',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.45,
              },
              tieredResults: {
                critical_success: {
                  narrative: `双六！大！你赢得盆满钵满！${npcName}目瞪口呆地看着桌上的骰子，半晌说不出话来。"今天……你手气也太好了吧！"`,
                  effects: { copper: 30, mood: 15 },
                },
                success: {
                  narrative: `你猜对了！${npcName}虽有不舍，但还是把铜板推了过来。"愿赌服输。改天再来过。"` ,
                  effects: { copper: 12, mood: 8 },
                },
                failure: {
                  narrative: `可惜，猜错了。${npcName}笑呵呵地收起铜板。"赌场无父子，愿赌服输嘛。"`,
                  effects: { mood: -5 },
                },
                critical_failure: {
                  narrative: `不仅猜错了，还是最小的点数。${npcName}毫不留情地收走了所有赌注。"运气这东西，强求不来啊。"你望着空空的钱袋，暗暗发誓再也不赌了。`,
                  effects: { copper: -5, mood: -12 },
                },
              },
              nextPhase: 'gamble_aftermath',
            },
          },
        ],
      },
      gamble_aftermath: {
        phaseId: 'gamble_aftermath',
        narrative: `赌局结束。${npcName}收好骰子，${voice.chat}。"怎么样，再来一局？"`,
        choices: [
          {
            id: 'ga_quit_win',
            text: '"见好就收，今日到此为止。"',
            consequence: {
              immediateEffects: { mood: 3 },
              relationChange: 2,
              nextPhase: null,
              endingNarrative: `${npcName}笑着送你离开。"赌品不错，改日再来。"你揣着赢来的铜板，脚步轻快。`,
              outcome: {
                narrative: '在赌局中赢得了铜板，见好就收。',
                effects: { mood: 3 },
                memoryTag: '赌局小胜',
                transformations: [
                  { type: 'gain_narrative_tag', value: 'gambler', description: '参与了掷骰赌局' },
                ],
              },
            },
          },
          {
            id: 'ga_quit_lose',
            text: '"手气用完了，改天再战。"',
            consequence: {
              relationChange: 1,
              nextPhase: null,
              endingNarrative: `你拍了拍空瘪的口袋，苦笑着离去。${npcName}在身后喊道："常来啊！"赌桌上输赢乃兵家常事，只是这口袋里的铜板……`,
              outcome: {
                narrative: '在赌局中输了一些铜板，但输得起。',
                effects: {},
                memoryTag: '赌局小负',
                transformations: [
                  { type: 'gain_narrative_tag', value: 'gambler', description: '参与了掷骰赌局' },
                ],
              },
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


// ════════════════════════════════════════
// 12 个新增专属场景构建器（正确 PlayerScene 结构）
// ════════════════════════════════════════

// ── 打听八卦 ──
function buildAskRumorScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const tone = getRelationTone(relation);
  return {
    id,
    name: '街坊消息',
    description: '打听八卦消息',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '线人', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你找到${npcName}，想打听些消息。${npcName}${voice.greet}。`,
    entryPhase: 'rumor_1',
    phases: {
      rumor_1: {
        phaseId: 'rumor_1',
        narrative: `${relation >= 30
          ? `"你问得正好，我跟你说……"${tone}`
          : relation < 0
            ? `${voice.refuse}但看你一脸诚恳，犹豫了一下。`
            : `"你打听的事，我多少知道一些。"`
        }\n\n${topic
          ? `"说到${topic.topic}，${topic.detail}。"`
          : '"最近街坊邻里确实有些动静。"'
        }\n\n${npcName}压低声音凑近了些。`,
        choices: [
          {
            id: 'r1_gossip',
            text: '"最近有什么新鲜事？"',
            consequence: { nextPhase: 'rumor_2' },
          },
          {
            id: 'r1_secret',
            text: '"有没有什么不为人知的秘密？"',
            condition: { field: 'personality', operator: 'includes' as const, value: '精明' },
            consequence: { nextPhase: 'rumor_2', immediateEffects: { mood: 1 } },
          },
          {
            id: 'r1_pay',
            text: `[给5文铜钱] "请喝杯茶，随便聊聊。"`,
            condition: { field: 'copper', operator: 'gte' as const, value: 5 },
            consequence: { nextPhase: 'rumor_2', immediateEffects: { copper: -5 }, relationChange: 2 },
          },
        ],
      },
      rumor_2: {
        phaseId: 'rumor_2',
        narrative: `${npcName}${voice.chat}，说了一些你不知道的事情。`,
        choices: [
          {
            id: 'r2_listen',
            text: '认真倾听',
            consequence: {
              nextPhase: null,
              endingNarrative: `你从${npcName}口中得知了一些有用的消息。\n\n"这些话你可别外传。"${tone}`,
              relationChange: 1,
            },
          },
          {
            id: 'r2_spread',
            text: '"这事我再去问问别人。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.upset}"你不信我？算了。"`,
              relationChange: -2,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 把酒言欢 ──
function buildShareFoodScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const tone = getRelationTone(relation);
  return {
    id,
    name: '把酒言欢',
    description: '请客吃饭，增进感情',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '酒友', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你请${npcName}到酒肆小坐。${npcName}${voice.greet}，欣然落座。`,
    entryPhase: 'food_1',
    phases: {
      food_1: {
        phaseId: 'food_1',
        narrative: `${relation >= 30
          ? `"又是你请客！这回我可不客气了。"${tone}`
          : `"既然盛情相邀，那就叨扰了。"`
        }`,
        choices: [
          {
            id: 'f1_simple',
            text: '"来两碗阳春面，一碟小菜。"',
            condition: { field: 'copper', operator: 'gte' as const, value: 10 },
            consequence: { nextPhase: 'food_2', immediateEffects: { copper: -10 }, relationChange: 2 },
          },
          {
            id: 'f1_feast',
            text: '"好酒好菜尽管上！"',
            condition: { field: 'copper', operator: 'gte' as const, value: 30 },
            consequence: { nextPhase: 'food_2', immediateEffects: { copper: -30 }, relationChange: 5 },
          },
          {
            id: 'f1_humble',
            text: '"家里带了些粗茶淡饭，不嫌弃吧？"',
            consequence: { nextPhase: 'food_2', relationChange: 1 },
          },
        ],
      },
      food_2: {
        phaseId: 'food_2',
        narrative: `酒过三巡，${npcName}${voice.chat}。\n\n${topic
          ? `"说起${topic.topic}，${topic.detail}。"`
          : `${npcName}谈起最近见闻，言语间颇为感慨。`
        }`,
        choices: [
          {
            id: 'f2_deep',
            text: '推心置腹地聊',
            consequence: {
              nextPhase: null,
              endingNarrative: `你们聊到月上柳梢，${npcName}起身告辞。\n\n"今日畅快！改日再聚。"${tone}`,
              relationChange: 3,
            },
          },
          {
            id: 'f2_listen',
            text: '静静倾听',
            consequence: {
              nextPhase: null,
              endingNarrative: `你安静地听着${npcName}的话，偶尔点点头。\n\n${npcName}似乎找到了一个可以倾诉的人。`,
              relationChange: 2,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 施以援手 ──
function buildHelpScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const tone = getRelationTone(relation);
  const helpType = ['搬重物', '修补屋顶', '照看摊位', '写信念书', '跑腿送信'][Math.floor(Math.random() * 5)];
  return {
    id,
    name: '施以援手',
    description: '帮NPC解决困难',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '求助者', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你听说${npcName}正需要人帮忙${helpType}。\n\n${npcName}${voice.greet}。\n\n"你要是能搭把手，那可太好了。"${tone}`,
    entryPhase: 'help_1',
    phases: {
      help_1: {
        phaseId: 'help_1',
        narrative: `${npcName}正为${helpType}发愁，你走上前去。`,
        choices: [
          {
            id: 'h1_gladly',
            text: `"没问题，包在我身上！"`,
            consequence: { nextPhase: 'help_2', immediateEffects: { health: -5 } },
          },
          {
            id: 'h1_cond',
            text: '"可以帮忙，不过……"',
            consequence: { nextPhase: 'help_2', relationChange: -1 },
          },
          {
            id: 'h1_decline',
            text: '"今天实在忙不过来。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.refuse}\n\n"罢了，我再找别人。"`,
              relationChange: -2,
            },
          },
        ],
      },
      help_2: {
        phaseId: 'help_2',
        narrative: `你花了些力气帮忙${helpType}。${npcName}${voice.chat}。\n\n"辛苦你了，真不知道怎么感谢。"${tone}`,
        choices: [
          {
            id: 'h2_free',
            text: '"举手之劳，不必客气。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}感激地看着你。\n\n"你是个好人，我记住了。"`,
              relationChange: 5,
            },
          },
          {
            id: 'h2_reward',
            text: '"也没什么，看着给点辛苦费吧。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}从怀里掏出几枚铜钱递给你。\n\n"一点心意，请收下。"`,
              relationChange: 2,
              immediateEffects: { copper: 8 },
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 虚心求教 ──
function buildLearnSkillScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const tone = getRelationTone(relation);
  const skillTopic = topic
    ? topic.topic
    : ['种庄稼', '做买卖', '打猎', '写字', '算账'][Math.floor(Math.random() * 5)];
  return {
    id,
    name: '虚心求教',
    description: '向NPC请教手艺或知识',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '师傅', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你向${npcName}请教${skillTopic}的门道。${npcName}${voice.greet}。`,
    entryPhase: 'learn_1',
    phases: {
      learn_1: {
        phaseId: 'learn_1',
        narrative: `${relation >= 30
          ? `"你想学这个？那我跟你说说。"${tone}`
          : relation < 0
            ? `${voice.refuse}"你找我学？我可教不了你什么。"`
            : `"嗯，${skillTopic}的门道说来话长……"`
        }`,
        choices: [
          {
            id: 'l1_listen',
            text: '认真听讲',
            consequence: { nextPhase: 'learn_2' },
          },
          {
            id: 'l1_gift',
            text: `[送上10文束脩] "还请不吝赐教。"`,
            condition: { field: 'copper', operator: 'gte' as const, value: 10 },
            consequence: { nextPhase: 'learn_2', immediateEffects: { copper: -10 }, relationChange: 2 },
          },
          {
            id: 'l1_debate',
            text: '"我倒是有些不同看法……"',
            condition: { field: 'personality', operator: 'includes' as const, value: '精明' },
            consequence: { nextPhase: 'learn_2', relationChange: relation >= 0 ? -1 : 1 },
          },
        ],
      },
      learn_2: {
        phaseId: 'learn_2',
        narrative: `${npcName}讲得头头是道。\n\n${topic
          ? `"${topic.detail}，所以关键在于……"`
          : `"${skillTopic}这事，最要紧的是耐心。"`
        }\n\n"来，试试看。"`,
        choices: [
          {
            id: 'l2_do',
            text: '照着示范练习',
            consequence: {
              nextPhase: null,
              endingNarrative: `你跟着${npcName}学了一阵子。虽然还有些生疏，但已经摸到了门道。\n\n"不错不错，孺子可教。"${tone}`,
              relationChange: 3,
            },
          },
          {
            id: 'l2_deep',
            text: '"能再深入讲讲吗？"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}见你好学，又多说了许多。日头西斜，你收获颇丰。\n\n"好学的后生，我喜欢。"${tone}`,
              relationChange: 4,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 求医问药 ──
function buildHealScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const playerHealth = ctx.playerStats?.health ?? 100;
  return {
    id,
    name: '求医问药',
    description: '找郎中看病买药',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '郎中', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你找到${npcName}寻求医治。\n\n${npcName}${voice.greet}，仔细端详了你的气色。`,
    entryPhase: 'heal_1',
    phases: {
      heal_1: {
        phaseId: 'heal_1',
        narrative: `"让我看看……嗯，${playerHealth < 40 ? '你气色不太好，需要好好调理。' : '还好，不算大碍。'}"`,
        choices: [
          {
            id: 'heal_herbs',
            text: '"有没有草药可以调理？"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}配了一副草药递给你。\n\n"一日三次，忌辛辣。"你服下后感觉好多了。`,
              immediateEffects: { health: 20 },
              relationChange: 1,
            },
          },
          {
            id: 'heal_pay',
            text: `[付20文] "请用最好的药。"`,
            condition: { field: 'copper', operator: 'gte' as const, value: 20 },
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}取出上好的药材精心调配。\n\n"这药见效快，几日便可痊愈。"`,
              immediateEffects: { health: 35, copper: -20 },
              relationChange: 2,
            },
          },
          {
            id: 'heal_free',
            text: '"手头紧，能不能通融一下？"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.refuse}\n\n${relation >= 30 ? '最终还是给了你一些便宜的草药。' : '"药铺也要本钱的。"'}`,
              immediateEffects: relation >= 30 ? { health: 10 } : {},
              relationChange: relation >= 30 ? 0 : -1,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 义结金兰 ──
function buildSwornBrothersScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  return {
    id,
    name: '义结金兰',
    description: '与NPC结为异姓兄弟',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '结义兄弟', minCount: 1, maxCount: 1, minRelationScore: 60 }],
    openingNarrative: `${timeDesc}，你和${npcName}来到神祠前。烛火摇曳，${npcName}${voice.greet}。\n\n"今日你我在此结拜，天地为证。"\n\n香案上摆着鸡血酒和黄纸。`,
    entryPhase: 'sworn_1',
    phases: {
      sworn_1: {
        phaseId: 'sworn_1',
        narrative: '你们跪在香案前，准备歃血为盟。',
        choices: [
          {
            id: 's1_solemn',
            text: '郑重地跪下磕头',
            consequence: { nextPhase: 'sworn_2', relationChange: 5 },
          },
          {
            id: 's1_humble',
            text: '"我何德何能……"',
            consequence: { nextPhase: 'sworn_2', relationChange: 3 },
          },
        ],
      },
      sworn_2: {
        phaseId: 'sworn_2',
        narrative: `你们焚香叩首，歃血为盟。${npcName}端起酒碗，目光坚定。\n\n"从今往后，你我同甘共苦，祸福与共。"\n\n碗中的酒映着烛光，如血般殷红。`,
        choices: [
          {
            id: 's2_drink',
            text: '饮下血酒',
            consequence: {
              nextPhase: null,
              endingNarrative: `酒入喉中，辛辣而滚烫。${npcName}放下酒碗，紧紧握住你的手。\n\n"兄弟！"这一声，重逾千钧。\n\n从此，你们便是过命的兄弟了。`,
              relationChange: 10,
            },
          },
          {
            id: 's2_extra',
            text: '"我再加一条：若有违背，天打雷劈。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}动容地看着你，也跟着发了毒誓。\n\n${npcName}${voice.chat}。\n\n"有你这句话，我放心了。"\n\n这份情义，比血还浓。`,
              relationChange: 12,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 顺手牵羊 ──
function buildStealScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext,
): PlayerScene {
  const stealTarget = topic?.item || '腰间的钱袋';
  return {
    id,
    name: '顺手牵羊',
    description: '偷窃NPC物品',
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '目标', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你盯上了${npcName}${stealTarget}。\n\n${npcName}正${voice.chat}，似乎没有注意到你。`,
    entryPhase: 'steal_1',
    phases: {
      steal_1: {
        phaseId: 'steal_1',
        narrative: '你的手慢慢伸了过去……',
        choices: [
          {
            id: 'st1_go',
            text: '下手！',
            consequence: {
              nextPhase: null,
              endingNarrative: '',
              resolution: { type: 'chance', successChance: 0.4 },
              tieredResults: {
                critical_success: {
                  narrative: `你的手指触到了${stealTarget}，轻轻一抽——得手了！${npcName}浑然不觉。你迅速藏好战利品，若无其事地走开了。`,
                  effects: { copper: 25 },
                },
                success: {
                  narrative: `你小心翼翼地拿到了${stealTarget}里的铜钱。${npcName}打了个哈欠，丝毫没有察觉。`,
                  effects: { copper: 15 },
                },
                failure: {
                  narrative: `你的手刚碰到${stealTarget}，${npcName}猛地转过头来！"你在干什么！"${voice.upset}\n\n你连忙缩回手，但已经被抓了个现行。`,
                  effects: {},
                },
              },
              relationChange: -10,
            },
          },
          {
            id: 'st1_wait',
            text: '再等等，等更好的时机',
            consequence: {
              nextPhase: null,
              endingNarrative: `你犹豫了一下，还是收回了手。也许下次有更好的机会。${npcName}依然毫无察觉。`,
            },
          },
          {
            id: 'st1_abort',
            text: '算了，不是正道',
            consequence: {
              nextPhase: null,
              endingNarrative: '你摇了摇头，转身离开。偷鸡摸狗之事，终究不是长久之计。',
              relationChange: 1,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 行业互动 ──
const PROFESSION_SCENE_CONFIG: Record<string, { title: string; act1: string; act2: string }> = {
  blacksmith_craft: {
    title: '铁匠锻造',
    act1: '你走进铁匠铺，炉火熊熊。',
    act2: '铁器淬火，白烟升腾。',
  },
  farm_work: {
    title: '田间帮农',
    act1: '田垄间，那人正弯腰劳作，汗水浸透了衣衫。',
    act2: '日头渐高，你们坐在田埂上歇脚。',
  },
  hunt_guide: {
    title: '猎户向导',
    act1: '那人背着弓箭，正准备进山。',
    act2: '山间小路上，那人指着远处的痕迹给你看。',
  },
};

function buildProfessionScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext, actionId: string,
): PlayerScene {
  const config = PROFESSION_SCENE_CONFIG[actionId] || {
    title: '行业互动',
    act1: `${npcName}正在忙碌着。`,
    act2: `${npcName}完成了手头的活计。`,
  };
  return {
    id,
    name: config.title,
    description: `职业互动：${actionId}`,
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '同行', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}。${config.act1}\n\n${npcName}${voice.greet}。${topic ? `"${topic.detail}。"` : '"正好你来帮忙。"'}`,
    entryPhase: 'prof_1',
    phases: {
      prof_1: {
        phaseId: 'prof_1',
        narrative: `${npcName}正忙着手头的活计。`,
        choices: [
          {
            id: 'p1_work',
            text: '撸起袖子干活',
            consequence: { nextPhase: 'prof_2', immediateEffects: { health: -8 } },
          },
          {
            id: 'p1_watch',
            text: '在一旁观看学习',
            consequence: { nextPhase: 'prof_2' },
          },
          {
            id: 'p1_pay',
            text: `[给15文] "辛苦了，买些茶水喝。"`,
            condition: { field: 'copper', operator: 'gte' as const, value: 15 },
            consequence: { nextPhase: 'prof_2', immediateEffects: { copper: -15 }, relationChange: 3 },
          },
        ],
      },
      prof_2: {
        phaseId: 'prof_2',
        narrative: `${config.act2}\n\n${npcName}${voice.chat}。`,
        choices: [
          {
            id: 'p2_chat',
            text: `"活干得漂亮！"`,
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}满意地擦了擦汗。\n\n"下次有空再来。"${getRelationTone(relation)}`,
              relationChange: 2,
              immediateEffects: { copper: 5 },
            },
          },
          {
            id: 'p2_learn',
            text: '"能教我两手吗？"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.greet}\n\n"看你手脚还算麻利，我就教教你。"\n\n一番指点之后，你学到了不少。`,
              relationChange: 3,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 组织事务 ──
const FACTION_OPS_CONFIG: Record<string, { title: string; narrative: string }> = {
  faction_ally: { title: '缔结同盟', narrative: '同盟文书已备好，只待双方画押。' },
  faction_rival: { title: '势力对峙', narrative: '双方人马剑拔弩张。' },
  faction_quest: { title: '帮派任务', narrative: '帮主交代了一桩差事。' },
  faction_patrol: { title: '巡查领地', narrative: '你们在势力范围内巡视。' },
  faction_dues: { title: '缴纳会费', narrative: '每月的例钱该交了。' },
  guard_patrol: { title: '城门巡逻', narrative: '换岗的时间到了。' },
  faction_order: { title: '传达命令', narrative: '上级有令，需要传达下去。' },
  faction_meeting: { title: '堂会议事', narrative: '众人齐聚一堂，商议要事。' },
  faction_reward: { title: '论功行赏', narrative: '任务完成，该论功行赏了。' },
  faction_expand: { title: '扩张地盘', narrative: '新的地盘在招手。' },
  faction_salary: { title: '领取俸禄', narrative: '到了领月俸的日子。' },
  faction_recruit: { title: '招兵买马', narrative: '帮派需要新鲜血液。' },
};

function buildFactionOpsScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext, actionId: string,
): PlayerScene {
  const config = FACTION_OPS_CONFIG[actionId] || FACTION_OPS_CONFIG.faction_quest;
  return {
    id,
    name: config.title,
    description: `组织事务：${actionId}`,
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '同僚', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}。${config.narrative}\n\n${npcName}${voice.greet}。${relation >= 30 ? '"这事交给你，我放心。"' : '"按规矩来就行。"'}`,
    entryPhase: 'fo_1',
    phases: {
      fo_1: {
        phaseId: 'fo_1',
        narrative: `${npcName}等着你的回应。`,
        choices: [
          {
            id: 'fo_execute',
            text: '认真执行',
            consequence: {
              nextPhase: null,
              endingNarrative: `事情办得妥妥当当。${npcName}${voice.greet}\n\n"干得不错。"${getRelationTone(relation)}`,
              relationChange: 2,
              immediateEffects: { copper: 5 },
            },
          },
          {
            id: 'fo_social',
            text: '"先聊聊再说。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `你和${npcName}聊了会公事，也聊了些私话。${npcName}${voice.chat}\n\n公事虽然耽误了些，但关系亲近了不少。`,
              relationChange: 3,
            },
          },
          {
            id: 'fo_decline',
            text: '"这事我不想管。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.upset}\n\n"随你吧。"`,
              relationChange: -3,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 家族亲情 ──
const FAMILY_OPS_CONFIG: Record<string, { title: string; narrative: string }> = {
  family_feast: { title: '家宴团聚', narrative: '一家老小围坐在饭桌前，热气腾腾。' },
  family_legacy: { title: '家训传承', narrative: '长辈翻开族谱，讲述着先辈的故事。' },
  family_aid: { title: '患难与共', narrative: '家中有难，需要互相帮衬。' },
};

function buildFamilyScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext, actionId: string,
): PlayerScene {
  const config = FAMILY_OPS_CONFIG[actionId] || FAMILY_OPS_CONFIG.family_feast;
  return {
    id,
    name: config.title,
    description: `家族互动：${actionId}`,
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '家人', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}。${config.narrative}\n\n${npcName}${voice.greet}。${relation >= 30 ? '"一家人不说两家话。"' : '"坐吧。"'}`,
    entryPhase: 'fm_1',
    phases: {
      fm_1: {
        phaseId: 'fm_1',
        narrative: '家人之间的温情时刻。',
        choices: [
          {
            id: 'fm_support',
            text: '"家里的事，我来扛。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}的眼眶微微泛红。\n\n"有你这句话，我就放心了。"\n\n亲情在困难面前显得格外珍贵。`,
              relationChange: 5,
              immediateEffects: { copper: -10 },
            },
          },
          {
            id: 'fm_chat',
            text: '"最近家里都还好吧？"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.chat}\n\n你们聊了很久，关于家、关于未来。${topic ? `"说起${topic.topic}，${topic.detail}。"` : ''}`,
              relationChange: 2,
            },
          },
          {
            id: 'fm_gift',
            text: `[给20文] "这是我攒的一点心意。"`,
            condition: { field: 'copper', operator: 'gte' as const, value: 20 },
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}接过铜钱，没有推辞。\n\n"家里人不用客气。"但你能看出，${npcName}心里很感动。`,
              relationChange: 4,
              immediateEffects: { copper: -20 },
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 地下交易 ──
function buildBlackMarketScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext, actionId: string,
): PlayerScene {
  const isLoan = actionId === 'loan';
  const mainChoice: PlayerSceneChoice = {
    id: 'bm_deal',
    text: isLoan ? '"借30文，一个月还。"' : '"给我看看货。"',
    consequence: {
      nextPhase: null,
      endingNarrative: '',
      resolution: { type: 'chance', successChance: 0.5 },
      tieredResults: {
        critical_success: {
          narrative: `${npcName}${voice.chat}\n\n${isLoan ? '铜钱到手，爽快。' : '货物上乘，物有所值。'}`,
          effects: isLoan ? { copper: 30 } : { copper: -25 },
        },
        success: {
          narrative: `交易进行得很顺利。${npcName}似乎对你印象不错。\n\n${isLoan ? '"记得按时还钱。"' : '"以后有需要再来。"'}`,
          effects: isLoan ? { copper: 30 } : { copper: -25 },
        },
        failure: {
          narrative: `${npcName}${voice.upset}\n\n${isLoan ? '"你上次还没还清呢！"' : '"这货不卖了，你走吧。"'}`,
          effects: {},
        },
      },
      relationChange: 1,
    },
  };
  if (!isLoan) {
    mainChoice.condition = { field: 'copper', operator: 'gte' as const, value: 25 };
  }
  return {
    id,
    name: isLoan ? '借钱周旋' : '地下交易',
    description: `灰色交易：${actionId}`,
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '交易对象', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}，你在僻静处找到了${npcName}。${npcName}${voice.greet}。\n\n${isLoan
      ? '"借钱？利息三分，到期不还……你懂的。"'
      : '"你要的东西我有，但价钱可不便宜。"'
    }`,
    entryPhase: 'bm_1',
    phases: {
      bm_1: {
        phaseId: 'bm_1',
        narrative: isLoan ? '借钱意味着未来的负担。' : '来路不正的货物。',
        choices: [
          mainChoice,
          {
            id: 'bm_negotiate',
            text: '"能不能再便宜点？"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.upset}\n\n${relation >= 30 ? '最终还是给了你一个实惠的价。' : '"这已经是最低价了，爱要不要。"'}`,
              relationChange: relation >= 30 ? 0 : -1,
              immediateEffects: relation >= 30 ? (isLoan ? { copper: 35 } : { copper: -20 }) : {},
            },
          },
          {
            id: 'bm_leave',
            text: '算了，转身离开',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}看着你的背影。\n\n"胆小鬼。"你假装没听见。`,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}

// ── 市井百态 ──
function buildCivicScene(
  id: string, npcName: string, voice: ReturnType<typeof getTraitVoice>,
  topic: ReturnType<typeof getProfessionTopic>, relation: number,
  timeDesc: string, ctx: DynamicSceneContext, actionId: string,
): PlayerScene {
  const civicConfig: Record<string, { nm: string; desc: string }> = {
    collect_tax: { nm: '征收税款', desc: '你拿着税单，挨家挨户征收。' },
    charity: { nm: '乐善好施', desc: '你拿出一些铜钱，接济困难的人家。' },
    invite_travel: { nm: '邀人同游', desc: `你提议和${npcName}一起出去走走。` },
  };
  const cfg = civicConfig[actionId] || civicConfig.charity;

  const mainChoice: PlayerSceneChoice = actionId === 'collect_tax'
    ? {
        id: 'cv_main',
        text: '"该交的税一分不能少。"',
        consequence: {
          nextPhase: null,
          endingNarrative: `${npcName}${voice.upset}\n\n虽然不情不愿，但铜钱还是掏了出来。\n\n"官字两个口……"`,
          immediateEffects: { copper: 12 },
          relationChange: -3,
        },
      }
    : actionId === 'charity'
      ? {
          id: 'cv_main',
          text: `[给15文] "这点心意，不成敬意。"`,
          condition: { field: 'copper', operator: 'gte' as const, value: 15 },
          consequence: {
            nextPhase: null,
            endingNarrative: `${npcName}连连道谢。\n\n"大恩大德，没齿难忘。"\n\n你摆摆手，心里觉得做了件好事。`,
            immediateEffects: { copper: -15 },
            relationChange: 5,
          },
        }
      : {
          id: 'cv_main',
          text: '"走，出去转转。"',
          consequence: {
            nextPhase: null,
            endingNarrative: `你和${npcName}一路说说走走，看遍了市井百态。\n\n${npcName}${voice.chat}\n\n"今天真痛快。"${getRelationTone(relation)}`,
            relationChange: 3,
          },
        };

  return {
    id,
    name: cfg.nm,
    description: `公共事务：${actionId}`,
    triggerCondition: { actorTraits: [], actorForbiddenTraits: [], targetRequired: false },
    participants: [{ role: '街坊', minCount: 1, maxCount: 1 }],
    openingNarrative: `${timeDesc}。${cfg.desc}\n\n${npcName}${voice.greet}。`,
    entryPhase: 'civic_1',
    phases: {
      civic_1: {
        phaseId: 'civic_1',
        narrative: `${npcName}等着你的下一步。`,
        choices: [
          mainChoice,
          {
            id: 'cv_chat',
            text: '"先聊聊近况吧。"',
            consequence: {
              nextPhase: null,
              endingNarrative: `${npcName}${voice.chat}\n\n${topic ? `"说起${topic.topic}，${topic.detail}。"` : ''}\n\n你们聊了很久。`,
              relationChange: 1,
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 5,
  };
}
