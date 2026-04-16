// === L0 多步演出 — 交易 (Multistep Trade) ===
//
// 多步演出：集市讨价还价，买卖双方拉锯，NPC自动根据性格选择策略。

import type { L0PhaseScene } from '../../../ai/sceneLibrary/types';

export const MULTISTEP_TRADE_SCENES: L0PhaseScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 集市讨价还价 — Market Haggling
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ms_market_haggle',
    name: '集市讨价还价',
    description: '买卖双方在集市上讨价还价，从初始报价到成交或谈崩',
    isMultiStep: true,
    goalCategory: 'trade',
    outcomeType: 'contested',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['商贩', '小贩', '货郎'],
      location: ['east_market', 'west_market'],
      timeOfDay: 'day',
    },
    success: { narrative: '', effects: {} },
    weight: 6,
    cooldownTicks: 15,
    priority: 3,
    tags: ['trade', 'market', 'haggling', 'day'],
    openingNarrative: '{npcName}走到{targetName}的摊位前，看上了一匹粗棉布。摸了摸布料的质地，开始问价。',
    entryPhase: 'haggle_1',
    phases: {
      // ── 第一阶段：问价 ──
      haggle_1: {
        phaseId: 'haggle_1',
        phaseType: 'dialogue',
        narrative: '「这布怎么卖？」{npcName}问道。\n{targetName}看了看，竖起三根手指：「三十文一匹，上好的粗棉。」\n这个价格比市价贵了足足十文。{npcName}心里清楚。',
        choices: [
          {
            id: 'counter_low',
            text: '直接还价十五文',
            chooser: 'actor',
            consequence: { nextPhase: 'haggle_2a' },
          },
          {
            id: 'counter_fair',
            text: '出价二十文，公道价',
            chooser: 'actor',
            consequence: {
              nextPhase: 'haggle_2b',
            },
          },
          {
            id: 'accept_price',
            text: '不还价了，直接买',
            chooser: 'actor',
            condition: { field: 'copper', operator: 'gte', value: 30 },
            consequence: {
              immediateEffects: { copper: -30, mood: -2 },
              targetEffects: { copper: 30, mood: 8 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative: '{npcName}掏出三十文铜钱，数了数递过去。{targetName}眉开眼笑地收了钱，麻利地把布匹包好。\n旁边的小贩看在眼里，心里想着：这人是好主顾，下次可以多卖点。',
            },
          },
          {
            id: 'walk_away',
            text: '太贵了，转身走人',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: -1 },
              nextPhase: null,
              endingNarrative: '{npcName}放下布匹，摇了摇头走开了。\n{targetName}在身后喊了声"诶诶，价好商量——"但{npcName}已经走远了。',
            },
          },
        ],
      },

      // ── 第二阶段A：低价还价 ──
      haggle_2a: {
        phaseId: 'haggle_2a',
        phaseType: 'dialogue',
        narrative: '「十五文。」{npcName}面不改色。\n{targetName}差点从凳子上跳起来：「十五？你也不看看这是什么布！我这可是从苏州运来的！最低二十五！不能再少了！」',
        choices: [
          {
            id: 'hold_firm',
            text: '坚持十五文，装作要走',
            chooser: 'actor',
            consequence: {
              resolution: {
                type: 'contested',
                contestedStat: { actor: 'cunning', target: 'cunning' },
              },
              tieredResults: {
                success: {
                  narrative: '{npcName}真的转身走了两步。{targetName}急了，追上来拉住袖子："行行行，十八文！十八文给你了！"\n{npcName}嘴角微微上翘，掏出了铜钱。',
                  effects: { copper: -18, mood: 5 },
                  targetEffects: { copper: 18, mood: -3 },
                },
                failure: {
                  narrative: '{targetName}冷笑了一声："走好不送。"头也不回地继续招呼别的客人。\n{npcName}走出去几步，回头看了看那匹布，心里有些后悔。',
                  effects: { mood: -3 },
                },
              },
              nextPhase: null,
            },
          },
          {
            id: 'compromise',
            text: '退一步，出到二十文',
            chooser: 'actor',
            consequence: {
              resolution: { type: 'chance', successChance: 70 },
              tieredResults: {
                success: {
                  narrative: '"二十文，行不行？"{targetName}犹豫了一下，叹了口气："得，碰上你了。二十文拿走吧。"\n{npcName}满意地付了钱。',
                  effects: { copper: -20, mood: 3 },
                  targetEffects: { copper: 20, mood: 2 },
                },
                failure: {
                  narrative: '{targetName}还是摇头："低于二十三不卖。"{npcName}看了看布匹，又摸了摸钱袋，最终还是掏了二十三文。',
                  effects: { copper: -23, mood: -1 },
                  targetEffects: { copper: 23, mood: 3 },
                },
              },
              nextPhase: null,
            },
          },
        ],
      },

      // ── 第二阶段B：公道出价 ──
      haggle_2b: {
        phaseId: 'haggle_2b',
        phaseType: 'dialogue',
        narrative: '「二十文，这是公道价。」{npcName}语气平和。\n{targetName}咂了咂嘴，似乎在盘算。二十文虽然不多，但也不算亏。他打量着{npcName}的衣着，想判断这个客人的底牌。',
        choices: [
          {
            id: 'patient_wait',
            text: '不急，耐心等他回答',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: 2 },
              targetEffects: { mood: 1 },
              relationChange: 2,
              nextPhase: null,
              endingNarrative: '沉默了片刻，{targetName}拍了拍大腿："成交！二十文给你了，就当交个朋友。"\n{npcName}付了钱，接过布匹。两人客客气气地作揖告别。好买卖，好和气。',
            },
          },
          {
            id: 'sweet_talk',
            text: '夸几句摊主的眼光',
            chooser: 'actor',
            condition: { field: 'personality', operator: 'includes', value: '健谈' },
            consequence: {
              immediateEffects: { mood: 3 },
              targetEffects: { mood: 5 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative: '{npcName}笑着说："老板你这摊子摆得好，东西也实在。回头我介绍朋友来。"\n{targetName}乐得合不拢嘴，主动抹了零头："十九文吧，少收你一文！"\n{npcName}笑着付了钱，心想：会说话果然不吃亏。',
            },
          },
        ],
      },
    },
  },
];
