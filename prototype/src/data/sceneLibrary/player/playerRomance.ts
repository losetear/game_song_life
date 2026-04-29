// === 浪漫场景 ===
// 河边邂逅、三角情缘、媒妁之言、月下私会

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_ROMANCE_SCENES: PlayerScene[] = [
  // ════════════════════════════════════════
  // 河边邂逅 (3幕)
  // ════════════════════════════════════════
  {
    id: 'ps_river_encounter',
    name: '河边邂逅',
    description: '黄昏河畔偶遇伤心之人',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetTraits: ['温和', '善良'],
      location: ['upstream', 'downstream', 'dock'],
      timeOfDay: 'dusk',
    },
    participants: [{ role: '伤心人', minCount: 1, maxCount: 1 }],
    openingNarrative: '夕阳将河水染成一片金红，你沿着河堤漫步。远处传来低低的啜泣声，循声望去，只见一人独自蹲在河边，双肩微微颤抖。',
    openingVisual: {
      background: 'courtyard',
      location: '汴京 · 河堤',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'sad' },
      ],
    },
    entryPhase: 'river_1',
    phases: {
      river_1: {
        phaseId: 'river_1',
        narrative: '那人似乎并未注意到你的到来。河水静静流淌，将那断断续续的哭声带向远方。你想了想，还是走了过去。',
        visual: {
          background: 'courtyard',
          location: '汴京 · 河堤黄昏',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'sad' },
          ],
          dialogue: [],
        },
        choices: [
          {
            id: 'r1_approach',
            text: '轻轻走近，低声问："你还好吗？"',
            consequence: { nextPhase: 'river_2a' },
          },
          {
            id: 'r1_observe',
            text: '在远处静静看着，等对方平复。',
            consequence: { nextPhase: 'river_2b' },
          },
          {
            id: 'r1_stone',
            text: '捡起一颗石子投入河中，制造声响。',
            consequence: { nextPhase: 'river_2a', immediateEffects: { mood: 1 } },
          },
        ],
      },
      river_2a: {
        phaseId: 'river_2a',
        narrative: '{npcName}抬起头来，眼眶泛红。被你这么一问，似乎更加不好意思了，连忙擦了擦眼泪。"没……没什么，让你见笑了。"',
        visual: {
          background: 'courtyard',
          location: '汴京 · 河畔',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'sad' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '{npcName}', text: '我只是……想起了一些往事。这条河，以前常和别人一起来。' },
          ],
        },
        choices: [
          {
            id: 'r2a_comfort',
            text: '"过去的事就让它过去吧。河还是那条河，人却可以往前走。"',
            consequence: { relationChange: 5, immediateEffects: { mood: 3 }, nextPhase: 'river_3' },
          },
          {
            id: 'r2a_share',
            text: '讲起自己的一段往事，以心换心。',
            condition: { field: 'personality', operator: 'includes', value: '温和' },
            consequence: { relationChange: 8, immediateEffects: { mood: 5 }, nextPhase: 'river_3' },
          },
          {
            id: 'r2a_money',
            text: '掏出几文铜钱递过去："去买碗热汤暖暖身子。"',
            condition: { field: 'copper', operator: 'gte', value: 10 },
            consequence: { relationChange: 4, immediateEffects: { copper: -10, mood: 2 }, nextPhase: 'river_3' },
          },
        ],
      },
      river_2b: {
        phaseId: 'river_2b',
        narrative: '你远远站着，看着{npcName}终于止住了哭泣。对方站起身来，拍了拍衣裳上的尘土，似要离去，却忽然哼起了一支小曲。曲调婉转凄美，在暮色中格外动听。',
        visual: {
          background: 'courtyard',
          location: '汴京 · 暮色河畔',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'r2b_join',
            text: '不由自主地跟着哼了起来。',
            consequence: { relationChange: 6, immediateEffects: { mood: 4 }, nextPhase: 'river_3' },
          },
          {
            id: 'r2b_leave',
            text: '默默转身离去，不去打扰。',
            consequence: {
              nextPhase: null,
              endingNarrative: '你转身走入了暮色之中。身后的小曲渐渐远去，像一首未完的歌。有些缘分，擦肩而过便是一生。',
            },
          },
        ],
      },
      river_3: {
        phaseId: 'river_3',
        narrative: '天色渐暗，河面上泛起粼粼波光。{npcName}的脸色好了许多，对你露出一个淡淡的微笑。"谢谢你陪我待了一会儿。你知道吗，有时候，一个人只需要另一个人在旁边就够了。"',
        visual: {
          background: 'night_street',
          location: '汴京 · 夜色河畔',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'r3_walk',
            text: '"天色不早了，我送你回去吧。"',
            consequence: {
              relationChange: 5,
              immediateEffects: { mood: 4 },
              nextPhase: null,
              endingNarrative: '你们并肩走在河堤上，影子被月光拉得很长。{npcName}轻声说了句"后会有期"，便消失在了巷子深处。河风带着水汽吹来，你觉得心里莫名地暖。',
            },
          },
          {
            id: 'r3_promise',
            text: '"改天再来这里走走？"',
            consequence: {
              relationChange: 6,
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative: '{npcName}点了点头，眼底有了光。"好。"简单一个字，却像是河面上荡开的一圈涟漪。你知道，这不是最后一次。',
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 8,
  },

  // ════════════════════════════════════════
  // 三角情缘 (4幕)
  // ════════════════════════════════════════
  {
    id: 'ps_love_triangle',
    name: '三角情缘',
    description: '两位好友爱上同一人',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      minNearbyNpcs: 2,
      location: ['center_street', 'tea_house', 'east_market'],
    },
    participants: [
      { role: '好友甲', minCount: 1, maxCount: 1 },
      { role: '好友乙', minCount: 1, maxCount: 1 },
    ],
    openingNarrative: '你偶然得知了一个秘密——你的两个熟人竟然同时喜欢上了同一个人。如今两人都来找你评理，各执一词，气氛剑拔弩张。',
    openingVisual: {
      background: 'teahouse',
      location: '汴京 · 茶楼雅间',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
        { id: 'npcA', name: '{npcA}', glyph: '友', position: 'left', mood: 'angry' },
        { id: 'npcB', name: '{npcB}', glyph: '友', position: 'right', mood: 'angry' },
      ],
    },
    entryPhase: 'tri_1',
    phases: {
      tri_1: {
        phaseId: 'tri_1',
        narrative: '两人吵得不可开交。"我先认识的！""可我先表白的！"茶碗被拍得震天响，你夹在中间左右为难。再这样下去，怕是要连朋友都做不成了。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
            { id: 'npcA', name: '{npcA}', glyph: '友', position: 'left', mood: 'angry' },
            { id: 'npcB', name: '{npcB}', glyph: '友', position: 'right', mood: 'angry' },
          ],
          dialogue: [
            { speaker: '{npcA}', text: '你来说句公道话！明明是我先遇见的！' },
            { speaker: '{npcB}', text: '遇见有什么用？关键是人家对我笑了！' },
          ],
        },
        choices: [
          {
            id: 't1_side_a',
            text: '"从道理上说，{npcA}先认识的……"',
            consequence: { relationChange: -3, immediateEffects: { mood: -1 }, nextPhase: 'tri_2a' },
          },
          {
            id: 't1_neutral',
            text: '"都先别吵了！让我想想怎么办。"',
            consequence: { immediateEffects: { mood: 1 }, nextPhase: 'tri_2b' },
          },
          {
            id: 't1_tell_person',
            text: '"干脆让那本人来选，你们争有什么用？"',
            condition: { field: 'personality', operator: 'includes', value: '勇敢' },
            consequence: { immediateEffects: { mood: 2 }, nextPhase: 'tri_2c' },
          },
        ],
      },
      tri_2a: {
        phaseId: 'tri_2a',
        narrative: '{npcB}一听就炸了，指着你的鼻子说："你也偏心！"局面更加混乱了。{npcA}虽然得到了支持，却也不是滋味——赢了道理，输了和气。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'sad' },
            { id: 'npcA', name: '{npcA}', glyph: '友', position: 'left', mood: 'neutral' },
            { id: 'npcB', name: '{npcB}', glyph: '友', position: 'right', mood: 'angry' },
          ],
        },
        choices: [
          {
            id: 't2a_apologize',
            text: '"我说错了，不该偏袒。咱们想个两全其美的法子。"',
            consequence: { relationChange: 3, immediateEffects: { mood: 2 }, nextPhase: 'tri_3' },
          },
          {
            id: 't2a_stand',
            text: '"我说的是实话，你们想清楚了再来找我。"',
            consequence: {
              nextPhase: null,
              endingNarrative: '你起身离开了茶楼。身后传来两人沉默的声音。有时候，说实话也需要勇气，但代价可能是一段友情。',
            },
          },
        ],
      },
      tri_2b: {
        phaseId: 'tri_2b',
        narrative: '你沉思片刻，想出了一个折中方案——让两人各写一封书信，由你转交，让那人自己选择。公平公正，谁也不吃亏。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
            { id: 'npcA', name: '{npcA}', glyph: '友', position: 'left', mood: 'neutral' },
            { id: 'npcB', name: '{npcB}', glyph: '友', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 't2b_deliver',
            text: '"就这么定了。明日此时，我给你们答复。"',
            consequence: {
              immediateEffects: { mood: 3 },
              nextPhase: 'tri_3',
            },
          },
        ],
      },
      tri_2c: {
        phaseId: 'tri_2c',
        narrative: '你的话像一盆冷水，把两人浇醒了。对视片刻后，他们竟同时沉默了。是啊，争来争去，最终决定的又不是他们。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
            { id: 'npcA', name: '{npcA}', glyph: '友', position: 'left', mood: 'sad' },
            { id: 'npcB', name: '{npcB}', glyph: '友', position: 'right', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 't2c_encourage',
            text: '"不管结果如何，你们还是好兄弟。这比什么都重要。"',
            consequence: { relationChange: 5, immediateEffects: { mood: 4 }, nextPhase: 'tri_3' },
          },
        ],
      },
      tri_3: {
        phaseId: 'tri_3',
        narrative: '风波渐息。两人虽然还有几分不甘，却都冷静了不少。{npcA}端起茶碗敬了{npcB}一杯："不管怎样，你我还是朋友。"{npcB}接过来一饮而尽。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'happy' },
            { id: 'npcA', name: '{npcA}', glyph: '友', position: 'left', mood: 'happy' },
            { id: 'npcB', name: '{npcB}', glyph: '友', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 't3_toast',
            text: '也端起茶碗，一饮而尽。',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative: '三人碰碗的声音清脆悦耳。茶楼外春风拂面，街上传来小贩的叫卖声。你忽然觉得，能化解一段纠葛，比什么都值。',
            },
          },
        ],
      },
    },
    weight: 8,
    cooldownTicks: 10,
  },

  // ════════════════════════════════════════
  // 媒妁之言 (4幕)
  // ════════════════════════════════════════
  {
    id: 'ps_arranged_marriage',
    name: '媒妁之言',
    description: '长辈提亲，如何抉择',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetTraits: ['精明', '大方', '健谈'],
      location: ['residential_north', 'residential_south', 'center_street'],
      timeOfDay: 'day',
    },
    participants: [{ role: '媒人', minCount: 1, maxCount: 1 }],
    openingNarrative: '一个面相和善的长辈笑呵呵地找到你，说是有一门好亲事想给你说。对方家境殷实、人品端正，"十里八乡打着灯笼都难找的好人家"。',
    openingVisual: {
      background: 'courtyard',
      location: '汴京 · 居民坊',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'matchmaker', name: '{npcName}', glyph: '媒', position: 'right', mood: 'happy' },
      ],
      dialogue: [
        { speaker: '{npcName}', text: '小伙子/姑娘，我给你说门好亲！你听我说……' },
      ],
    },
    entryPhase: 'marry_1',
    phases: {
      marry_1: {
        phaseId: 'marry_1',
        narrative: '{npcName}将对方的条件一一道来：家里有几亩良田、在城里开着铺子、为人忠厚老实。"这门亲事要是成了，你下半辈子就不用愁了。"说着，一双精明的眼睛紧紧盯着你的表情。',
        visual: {
          background: 'courtyard',
          location: '汴京 · 居民坊',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'matchmaker', name: '{npcName}', glyph: '媒', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'm1_accept',
            text: '"多谢长辈好意，这亲事我应了。"',
            condition: { field: 'copper', operator: 'gte', value: 20 },
            consequence: {
              immediateEffects: { copper: -20, mood: -3 },
              relationChange: 5,
              nextPhase: 'marry_2a',
            },
          },
          {
            id: 'm1_decline',
            text: '"多谢好意，但此事恕难从命。"',
            condition: { field: 'personality', operator: 'includes', value: '勇敢' },
            consequence: { relationChange: -3, immediateEffects: { mood: 2 }, nextPhase: 'marry_2b' },
          },
          {
            id: 'm1_delay',
            text: '"此事重大，容我考虑几日。"',
            consequence: { nextPhase: 'marry_2c' },
          },
          {
            id: 'm1_investigate',
            text: '"听起来不错，但我想先打听打听对方为人。"',
            consequence: { nextPhase: 'marry_2d' },
          },
        ],
      },
      marry_2a: {
        phaseId: 'marry_2a',
        narrative: '你备了聘礼，托{npcName}送去。消息传开后，街坊们议论纷纷，有羡慕的，也有摇头叹息的。你坐在屋里，看着备好的聘礼，心里五味杂陈。',
        visual: {
          background: 'courtyard',
          location: '汴京 · 家中',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 'm2a_go_through',
            text: '既然答应了，就走下去。',
            consequence: {
              nextPhase: null,
              endingNarrative: '婚期定了下来。你站在门口看着红绸灯笼挂起来，心里说不上是喜是忧。这桩婚姻是好是坏，只有日子才能给出答案。',
            },
          },
          {
            id: 'm2a_regret',
            text: '越想越不对——还是去退了吧。',
            consequence: {
              relationChange: -8,
              immediateEffects: { copper: -10, mood: -5 },
              nextPhase: null,
              endingNarrative: '你硬着头皮退了婚。{npcName}气得直跺脚，街坊们也对你指指点点。聘礼打了水漂，名声也受了损。但你心里反而松了口气。',
            },
          },
        ],
      },
      marry_2b: {
        phaseId: 'marry_2b',
        narrative: '{npcName}的脸色一下沉了下来。"你这孩子，好歹见一面再说啊！人家可是——"话说到一半又咽了回去，叹了口气，摇摇头走了。',
        visual: {
          background: 'courtyard',
          location: '汴京 · 巷口',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'matchmaker', name: '{npcName}', glyph: '媒', position: 'right', mood: 'angry' },
          ],
        },
        choices: [
          {
            id: 'm2b_explain',
            text: '"不是我不知好歹，是我想自己找一个。"',
            consequence: {
              relationChange: 2,
              nextPhase: null,
              endingNarrative: '{npcName}听完，若有所思地点了点头。"年轻人有自己的想法也好。不过可别太挑了，好人家不等人。"说完便笑着走了。',
            },
          },
        ],
      },
      marry_2c: {
        phaseId: 'marry_2c',
        narrative: '你决定先不急着答复。接下来几日，你暗中打听了对方的情况——街坊们评价不一，有人称赞，有人却欲言又止。',
        visual: {
          background: 'market',
          location: '汴京 · 街坊间',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'm2c_yes',
            text: '打听下来还不错，决定答应。',
            condition: { field: 'copper', operator: 'gte', value: 20 },
            consequence: {
              immediateEffects: { copper: -20, mood: 2 },
              relationChange: 4,
              nextPhase: null,
              endingNarrative: '你找到{npcName}表达了意愿。对方喜笑颜开，立刻张罗起来。这次你心里踏实了许多——好歹是了解过才做的决定。',
            },
          },
          {
            id: 'm2c_no',
            text: '越打听越觉得不合适，婉言谢绝。',
            consequence: {
              relationChange: -2,
              nextPhase: null,
              endingNarrative: '你找到{npcName}婉拒了这门亲事。对方虽然遗憾，但也理解。"年轻人的事，年轻人自己做主吧。"',
            },
          },
        ],
      },
      marry_2d: {
        phaseId: 'marry_2d',
        narrative: '你花了几天时间，在街坊间辗转打听。有人夸对方勤快，有人说对方脾气倔。最关键的一条消息来自一个卖菜的老妪——"那人家的少爷/小姐倒是好人，就是家里管得严。"',
        visual: {
          background: 'market',
          location: '汴京 · 菜市',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'oldwoman', name: '老妪', glyph: '妪', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '老妪', text: '你要是真心，就去见一面。别光听媒人一面之词。' },
          ],
        },
        choices: [
          {
            id: 'm2d_meet',
            text: '"多谢提醒，我去见见本人。"',
            condition: { field: 'copper', operator: 'gte', value: 10 },
            consequence: {
              immediateEffects: { copper: -10, mood: 3 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative: '你偷偷见了一面，发现对方确实不错。于是托人正式提了亲。虽然过程曲折，但结局倒也圆满。{npcName}后来逢人便说："我就说这是门好亲事吧！"',
            },
          },
          {
            id: 'm2d_pass',
            text: '消息不太妙，决定谢绝。',
            consequence: {
              relationChange: -1,
              nextPhase: null,
              endingNarrative: '你谢绝了这门亲事。虽然{npcName}有些失望，但你并不后悔。婚姻大事，宁可多花些时间，也不可草率。',
            },
          },
        ],
      },
    },
    weight: 9,
    cooldownTicks: 10,
  },

  // ════════════════════════════════════════
  // 月下私会 (3幕)
  // ════════════════════════════════════════
  {
    id: 'ps_secret_lover',
    name: '月下私会',
    description: '深夜被撞破的秘密会面',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetTraits: [],
      location: ['center_street', 'residential_north', 'residential_south'],
      timeOfDay: 'night',
    },
    participants: [
      { role: '密会之人', minCount: 1, maxCount: 1, minRelationScore: 30 },
    ],
    openingNarrative: '月色如水，你与{npcName}在街角悄悄见面。四下无人，只有远处更夫的梆子声。正说到要紧处，突然——"哎呦！你们在这儿做什么！"',
    openingVisual: {
      background: 'night_street',
      location: '汴京 · 月下巷口',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'npc', name: '{npcName}', glyph: '人', position: 'center', mood: 'neutral' },
        { id: 'witness', name: '路人', glyph: '路', position: 'right', mood: 'angry' },
      ],
    },
    entryPhase: 'secret_1',
    phases: {
      secret_1: {
        phaseId: 'secret_1',
        narrative: '一个路过的街坊正好撞见了你们！那人一脸惊讶，又带着几分八卦的兴奋。{npcName}的脸刷地红了，你心里暗道不好——要是传出去，可就麻烦了。',
        visual: {
          background: 'night_street',
          location: '汴京 · 巷口',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'angry' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'center', mood: 'sad' },
            { id: 'witness', name: '路人', glyph: '路', position: 'right', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '路人', text: '嘿！大半夜的，你们俩这是——' },
          ],
        },
        choices: [
          {
            id: 's1_confess',
            text: '"没什么好瞒的，我们就是出来走走。"',
            consequence: { nextPhase: 'secret_2a' },
          },
          {
            id: 's1_deny',
            text: '"你想多了，我们在谈正经事。"',
            consequence: { nextPhase: 'secret_2b' },
          },
          {
            id: 's1_bribe',
            text: '悄悄塞几文钱过去："您行个方便。"',
            condition: { field: 'greed', operator: 'gte', value: 40 },
            consequence: {
              immediateEffects: { copper: -15, mood: -2 },
              relationChange: -2,
              nextPhase: null,
              endingNarrative: '那路人看了看铜钱，嘿嘿一笑："行行行，我什么都没看见。"说着便走了。你松了口气，但这种事传出去只是迟早的问题。',
            },
          },
        ],
      },
      secret_2a: {
        phaseId: 'secret_2a',
        narrative: '你大方承认了。路人愣了一下，随即挤眉弄眼："走走好啊，月下漫步，风雅风雅。"说完便笑着走了。{npcName}松了口气，小声说："还好你应对得快。"',
        visual: {
          background: 'night_street',
          location: '汴京 · 月下',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 's2a_walk_home',
            text: '"走吧，我送你回去。以后小心些。"',
            consequence: {
              relationChange: 4,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: '你们一前一后走在月光下。虽然虚惊一场，但这段月下的小插曲，反而让两人的心更近了一些。',
            },
          },
        ],
      },
      secret_2b: {
        phaseId: 'secret_2b',
        narrative: '你的否认显然没什么说服力。路人将信将疑地走了，但你注意到他走得几步就回头看了好几次——这人嘴巴肯定闲不住。',
        visual: {
          background: 'night_street',
          location: '汴京 · 巷口',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'sad' },
            { id: 'npc', name: '{npcName}', glyph: '人', position: 'right', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 's2b_damage_control',
            text: '"明天得赶紧找人去跟他说说，别让他到处乱讲。"',
            consequence: {
              relationChange: 2,
              immediateEffects: { mood: -2 },
              nextPhase: null,
              endingNarrative: '你连夜找了个可靠的朋友去打了招呼。虽然暂时压住了，但流言蜚语就像野草，总会在你不注意的地方冒出来。你暗暗告诫自己——下次得选个更隐蔽的地方。',
            },
          },
        ],
      },
    },
    weight: 8,
    cooldownTicks: 8,
  },
];
