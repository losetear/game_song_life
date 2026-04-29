// === 玩家多步骤演出 — 灵修/精神 (Player Spiritual) ===
//
// 漫野奇谭式分支叙事场景，宋代背景。
// 包含：古寺奇遇、命盘玄机、静坐悟道

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_SPIRITUAL_SCENES: PlayerScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 古寺奇遇 — Temple Encounter (4幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_temple_visit',
    name: '古寺奇遇',
    description: '在古寺中偶遇高僧，被一道禅机难住，不同的回答将引领不同的领悟之路。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['僧人', '道士'],
      location: ['temple', 'courtyard'],
    },
    participants: [
      {
        role: '高僧',
        requiredProfession: ['僧人', '道士'],
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '你踏入古寺的山门，檀香袅袅，钟磬之声悠悠回荡在空旷的大殿之中。一尊金漆剥落的佛像静默端坐，目光低垂，似在俯瞰世间一切悲欢。殿角蒲团上端坐着一位须发皆白的老僧，双目微阖，手中转动着一串乌木念珠。你刚要上香，老僧忽然开口，声音苍老却清晰如晨钟："施主既有缘至此，老衲有一问相询——可愿一听？"',
    openingVisual: {
      background: 'temple',
      location: '汴京 · 古寺大殿',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'monk', name: '老僧', glyph: '僧', position: 'center', mood: 'neutral' },
      ],
      dialogue: [
        { speaker: '老僧', text: '施主既有缘至此，老衲有一问相询——可愿一听？' },
      ],
    },
    entryPhase: 'temple_1',
    phases: {
      // ── 第一幕：高僧出题 ──
      temple_1: {
        phaseId: 'temple_1',
        narrative:
          '老僧缓缓睁开眼，目光深邃如幽潭。他不紧不慢地说道："一叶落而知天下秋。施主可知，这一叶究竟是秋送来的，还是树送走的？"话音落下，大殿中安静得只听见烛火噼啪的声响。老僧的目光凝在你脸上，嘴角带着一丝若有若无的微笑，似乎在等待着什么。',
        choices: [
          {
            id: 'answer_wisdom',
            text: '以理作答："叶非秋送，亦非树送，乃时令使然，万物各有其时。"',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '精明',
            },
            consequence: {
              nextPhase: 'temple_2a',
            },
          },
          {
            id: 'answer_zen',
            text: '以禅作答："秋风未起叶已落，何须问来处？"',
            consequence: {
              nextPhase: 'temple_2b',
            },
          },
          {
            id: 'admit_ignorance',
            text: '坦言不知："大师慧语，在下愚钝，实在参不透其中玄机。"',
            consequence: {
              nextPhase: 'temple_2c',
            },
          },
          {
            id: 'decline_leave',
            text: '婉言辞谢："在下俗务缠身，改日再来讨教。"',
            consequence: {
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative:
                '你拱手告辞，转身步出大殿。身后传来老僧轻轻的一声叹息，像风拂过枯叶。山门外阳光正好，可你心中莫名觉得错过了什么重要的东西。走到半山腰回望，古寺掩映在苍松翠柏之间，暮鼓声声，余韵悠长。',
            },
          },
        ],
        visual: {
          background: 'temple',
          location: '汴京 · 古寺大殿内',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'monk', name: '老僧', glyph: '僧', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '老僧', text: '一叶落而知天下秋。这一叶究竟是秋送来的，还是树送走的？' },
          ],
        },
      },

      // ── 第二幕A：以理作答 — 深论人生抉择 ──
      temple_2a: {
        phaseId: 'temple_2a',
        narrative:
          '老僧微微颔首，念珠停了一瞬。"施主以因果论答之，倒也通透。只是——"他指了指佛前那盏长明灯，灯火在穿堂风中摇曳不定，"灯芯燃尽时，是风灭了灯，还是灯自己灭了？"他的目光移向你，语调平缓却暗含机锋："人生在世，种种际遇，究竟是命数已定，还是人心所选？施主以为，一个人此生之路，是走出来的，还是被推着走的？"',
        choices: [
          {
            id: 'choice_self_made',
            text: '"路在脚下，当由己心而定，非外力所能左右。"',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 5 },
              relationChange: 5,
            },
          },
          {
            id: 'choice_destiny',
            text: '"天命难违，人能做的不过是顺水推舟罢了。"',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 3 },
              relationChange: 3,
            },
          },
          {
            id: 'choice_balance',
            text: '"命由天定，运由己造。人当知命而不认命。"',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 8 },
              relationChange: 8,
            },
          },
        ],
        visual: {
          background: 'temple',
          location: '汴京 · 古寺禅房',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'monk', name: '老僧', glyph: '僧', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '老僧', text: '灯芯燃尽时，是风灭了灯，还是灯自己灭了？' },
          ],
        },
      },

      // ── 第二幕B：以禅作答 — 顿悟之路 ──
      temple_2b: {
        phaseId: 'temple_2b',
        narrative:
          '老僧闻言，手中的念珠忽然断裂，一百零八颗乌木珠子哗啦啦散落一地，在石板地面上弹跳滚转，声如急雨。老僧大笑起来，笑声在空旷的大殿中回荡，震得梁上积灰簌簌落下。"好！好一个何须问来处！"他站起身来，袍袖一拂，竟不拾那些散落的珠子，径直走到你面前。"施主这答法，比老衲预期的还要妙。你来——"他从袖中取出一卷发黄的绢帛，"这是先师留下的一段话，老衲参了三十年未曾参透。今日既遇有缘人，便赠予你吧。"',
        choices: [
          {
            id: 'accept_scroll',
            text: '双手接过绢帛，细细展读。',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 10 },
              relationChange: 10,
            },
          },
          {
            id: 'decline_scroll',
            text: '"大师厚意心领了，但晚辈才疏学浅，怕误了先师遗训。"',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 5 },
              relationChange: 6,
            },
          },
        ],
        visual: {
          background: 'temple',
          location: '汴京 · 古寺大殿',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'monk', name: '老僧', glyph: '僧', position: 'center', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '老僧', text: '施主这答法，比老衲预期的还要妙！' },
          ],
        },
      },

      // ── 第二幕C：坦言不知 — 以身示教 ──
      temple_2c: {
        phaseId: 'temple_2c',
        narrative:
          '老僧不怒反喜，抚掌而笑："善哉善哉！世间最难得的，不是聪明，而是坦诚。"他起身，领你穿过回廊，来到后院一口古井旁。井沿上长满了青苔，井水幽深不见底。老僧从井栏上取下一只缺了口的粗陶碗，舀了满满一碗水，递到你面前。"施主且看这碗水。"水面映着天光，一丝波纹也无。"水中有什么？"',
        choices: [
          {
            id: 'see_self',
            text: '"水中映着我的影子。"',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 5 },
              relationChange: 5,
            },
          },
          {
            id: 'see_nothing',
            text: '"水只是水，什么也没有。"',
            consequence: {
              nextPhase: 'temple_3',
              immediateEffects: { mood: 8 },
              relationChange: 8,
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 古寺后院古井',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'monk', name: '老僧', glyph: '僧', position: 'center', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '老僧', text: '世间最难得的，不是聪明，而是坦诚。' },
          ],
        },
      },

      // ── 第三幕：领悟 — 角色变形 ──
      temple_3: {
        phaseId: 'temple_3',
        narrative:
          '老僧微微一笑，不论你如何作答，他似乎都感到满意。"施主今日来此，看似偶然，实则因缘际会。人生千般苦，皆因执念而起。放下执念，不是放弃，而是看清。"他的目光越过你，望向大殿外的天际，暮色已将远山染成一片金红。"去吧，施主。世间万般滋味，终须自己一一尝过。老衲的话，听过了便忘了吧——记在心里的话，反而是另一种执念。"',
        choices: [
          {
            id: 'accept_enlightenment',
            text: '恭身行礼，将老僧的话铭记于心。',
            consequence: {
              immediateEffects: { mood: 15, social: 5 },
              relationChange: 15,
              nextPhase: null,
              endingNarrative:
                '你深深一揖，转身步出山门。暮色苍茫，古寺的轮廓渐渐模糊在身后，但老僧的那番话却像一粒种子，悄然落入你心田的某个角落。走下山坡时，你忽然觉得脚步轻了几分，眼前的天地似乎比来时更加开阔了。你不知道这是什么感觉——也许，这就是所谓的"悟"吧。',
              outcome: {
                narrative: '在古寺中偶遇高僧，经禅机问答获得领悟。',
                effects: { mood: 15, social: 5 },
                relationChange: 15,
                memoryTag: '古寺禅机领悟',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'enlightened_moment',
                    description: '在古寺中经高僧点化，获得了关于人生与执念的领悟',
                  },
                ],
              },
            },
          },
          {
            id: 'polite_decline',
            text: '客气地道谢，但心中自有主张。',
            consequence: {
              immediateEffects: { mood: 5 },
              relationChange: 8,
              nextPhase: null,
              endingNarrative:
                '你拱手谢过老僧，心中却不尽认同他的话。人生在世，哪有那么容易便放下的东西？你走出古寺，回头望了一眼那扇半掩的寺门。老僧的话说得轻巧，可你背负的，远比一个"执念"二字沉重得多。不过，今日这一番对话，倒也让你想通了几件小事。也许日后某一天，你终会明白老僧的意思。',
              outcome: {
                narrative: '与古寺高僧论道，虽未完全认同，但有所触动。',
                effects: { mood: 5 },
                relationChange: 8,
                memoryTag: '古寺论道',
              },
            },
          },
        ],
        visual: {
          background: 'temple',
          location: '汴京 · 古寺山门前',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'monk', name: '老僧', glyph: '僧', position: 'center', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '老僧', text: '去吧，施主。记在心里的话，反而是另一种执念。' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 40,
    priority: 4,
    tags: ['spiritual', 'temple', 'zen', 'philosophy'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 命盘玄机 — Fortune Deep (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_fortune_deep',
    name: '命盘玄机',
    description: '夜市中一位卜者为你推演命盘，透露未来的蛛丝马迹。信或不信，全在一念之间。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['卜者', '算命先生'],
      location: ['east_market', 'west_market', 'center_street', 'night_street'],
      timeOfDay: 'night',
    },
    participants: [
      {
        role: '卜者',
        requiredProfession: ['卜者', '算命先生'],
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '夜市的灯火将整条街照得如同白昼，叫卖声此起彼伏。你穿过熙攘的人群，在一个不起眼的角落停下脚步——那里支着一面幡旗，上书"铁口直断"四个大字。幡旗下端坐着一个瘦削的中年人，身着半旧的道袍，面前摆着一张折叠桌，桌上放着罗盘、签筒和一盏油灯。他抬起头看你，目光幽深，仿佛能穿透你的皮囊看到骨骼。',
    openingVisual: {
      background: 'night_street',
      location: '汴京 · 夜市角落',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'fortune_teller', name: '卜者', glyph: '卜', position: 'center', mood: 'neutral' },
      ],
      dialogue: [
        { speaker: '卜者', text: '这位客官，面相非凡，可愿让在下为您推一卦？' },
      ],
    },
    entryPhase: 'fortune_1',
    phases: {
      // ── 第一幕：选择所问之事 ──
      fortune_1: {
        phaseId: 'fortune_1',
        narrative:
          '卜者从桌后站起身来，将罗盘推到你面前。灯火映着他瘦削的面庞，投下忽明忽暗的阴影。"在下不问生辰，不掐八字，只凭这命盘和客官一念之间。"他用枯瘦的手指点了点桌面上那方铜制罗盘，盘中刻满了天干地支和八卦方位。"客官想问什么？不过——天机只泄一桩，多了就不灵了。"',
        choices: [
          {
            id: 'ask_career',
            text: '"我想问前途仕途，此生可有出人头地之日？"',
            consequence: {
              nextPhase: 'fortune_2',
              immediateEffects: { copper: -5 },
            },
          },
          {
            id: 'ask_love',
            text: '"我想问姻缘，命中可有良人相伴？"',
            consequence: {
              nextPhase: 'fortune_2',
              immediateEffects: { copper: -5 },
            },
          },
          {
            id: 'ask_health',
            text: '"我想问安康，此生可有劫难缠身？"',
            consequence: {
              nextPhase: 'fortune_2',
              immediateEffects: { copper: -5 },
            },
          },
          {
            id: 'walk_away',
            text: '"算了，命在自己手中，不必问人。"转身离去。',
            consequence: {
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative:
                '你摆了摆手转身就走。卜者在身后喊了一声："客官，命在天，运在己。不问也好。"你没回头，脚步坚定地融入了夜市的人流之中。灯火阑珊处，你暗自思忖——与其把未来寄托在几句玄虚的话上，不如握紧自己的双手，好好走脚下的路。',
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 夜市卜卦摊前',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'fortune_teller', name: '卜者', glyph: '卜', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '卜者', text: '天机只泄一桩，多了就不灵了。' },
          ],
        },
      },

      // ── 第二幕：卦象显现 — 概率判定 ──
      fortune_2: {
        phaseId: 'fortune_2',
        narrative:
          '卜者闭上双眼，手指在罗盘上飞速拨动，铜珠叮叮作响。半晌，他猛然睁眼，面色微变。灯火无风自晃，仿佛有什么无形之物从命盘中升腾而起。"客官……"他的声音低了下去，语气中带着一丝不易察觉的郑重，"这一卦，在下看得不太寻常。命盘所示……"他深深看了你一眼，缓缓道出了卦象。',
        choices: [
          {
            id: 'listen_carefully',
            text: '屏息凝神，仔细聆听卜者所言。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.4,
              },
              tieredResults: {
                critical_success: {
                  narrative:
                    '卜者的声音仿佛从很远的地方传来："客官命格中有贵人星照，近期将有一桩大喜事。但切记——天予不取，反受其咎。机会来时，万万不可犹豫。"他的话语带着一种不容置疑的笃定，让你心中一震。你不知为何，隐隐觉得此人说的并非虚言。',
                  effects: { mood: 20, social: 5 },
                },
                success: {
                  narrative:
                    '卜者沉吟片刻道："客官命途平顺，虽无大富大贵之相，但胜在安稳。近期诸事小心，凡事三思而后行，可保无虞。"虽不是什么惊天动地的预言，但那"平顺"二字反而让你安心了几分。',
                  effects: { mood: 10 },
                },
                failure: {
                  narrative:
                    '卜者皱起了眉头，又拨了一遍罗盘，面色愈发凝重。"客官……此卦不太吉利。命盘显示近期恐有小人作祟，破财之象明显。在下送客官一句忠告——凡事留一线，莫要与人结怨太深。"你心中一沉，半信半疑地看着他，不知该当真还是当假。',
                  effects: { mood: -10 },
                },
              },
              nextPhase: 'fortune_3',
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 夜市卜卦摊',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'fortune_teller', name: '卜者', glyph: '卜', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '卜者', text: '这一卦……在下看得不太寻常。' },
          ],
        },
      },

      // ── 第三幕：如何运用预知 ──
      fortune_3: {
        phaseId: 'fortune_3',
        narrative:
          '卜者收起罗盘，恢复了那副淡然的神情。他将桌上的签筒推到一旁，端起凉透的茶水啜了一口。"卦已起，话已说。信与不信，全在客官一念之间。"他抬眼看向你，灯火映在他瞳孔中，像两簇跳跃的鬼火。"不过在下再多嘴一句——命盘所示的，是势，不是定数。水往低处流是势，但水若遇到堤坝，也会改道。关键在于，客官愿不愿意做那道堤坝。"',
        choices: [
          {
            id: 'believe_act',
            text: '深信不疑，将卜者的话铭记在心，日后行事以此为鉴。',
            consequence: {
              immediateEffects: { mood: 8 },
              relationChange: 10,
              nextPhase: null,
              endingNarrative:
                '你郑重地向卜者道谢，付了卦资，转身走入夜色之中。头顶繁星满天，你仰头望去，第一次觉得那些遥远的光点似乎与你的命运有着某种神秘的联系。卜者的话如同一盏灯，在你前方的路上投下一束光——虽然看不清全貌，但至少脚下的几步路是明的。你攥紧了拳头，暗暗做了几个决定。',
              outcome: {
                narrative: '在夜市卜者处得到卦象启示，深信并以此自勉。',
                effects: { mood: 8 },
                relationChange: 10,
                memoryTag: '卜者命盘启示',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'foretold',
                    description: '在夜市中由卜者推演命盘，得知了关于未来的预言',
                  },
                ],
              },
            },
          },
          {
            id: 'doubt_dismiss',
            text: '半信半疑，权当听了个故事，不放在心上。',
            consequence: {
              immediateEffects: { mood: -2 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative:
                '你笑了笑，丢下几文铜钱起身走了。卜者的话虽然说得玄乎，但你向来是个信己不信天的人。走出几步回头看，卜者已经接待下一位客人了，灯火摇曳中，那面"铁口直断"的幡旗在夜风中猎猎作响。也许他说的是真的，也许不是——但那又怎样呢？日子照样得过，路照样得走。',
            },
          },
          {
            id: 'ask_more',
            text: '想追问更多细节，但卜者已经闭目不再言语。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '精明',
            },
            consequence: {
              immediateEffects: { mood: 3 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative:
                '你试图追问，但卜者已闭目如老僧入定，再不开口。你只得作罢，心中却暗暗记下了他说的每一个字。不管真假，多留个心眼总没有坏处。你回到住处，在灯下将卜者的话反复琢磨了半宿，想从中理出些有用的东西来。窗外夜色如墨，远处传来更鼓声声。',
              outcome: {
                narrative: '卜者的话留在了心中，虽未全信，却也不曾忘记。',
                effects: { mood: 3 },
                relationChange: 5,
                memoryTag: '卜者命盘半信半疑',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'foretold',
                    description: '在夜市中由卜者推演命盘，虽半信半疑但记住了预言',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 夜市',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'fortune_teller', name: '卜者', glyph: '卜', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '卜者', text: '信与不信，全在客官一念之间。' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 35,
    priority: 3,
    tags: ['spiritual', 'fortune', 'night', 'mystery'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 静坐悟道 — Meditation Insight (2幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_meditation_insight',
    name: '静坐悟道',
    description: '身心俱疲之际，寻一处安静之所静坐冥想，在宁静中寻找内心的答案。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: false,
      actorMinStress: 60,
      location: ['courtyard', 'temple', 'garden'],
    },
    participants: [],
    openingNarrative:
      '连日来的奔波劳碌让你身心俱疲，仿佛有一块无形的巨石压在胸口，呼吸都变得沉重起来。你寻了一处僻静之所——四周寂静无声，只有远处偶尔传来几声鸟鸣和风拂过竹叶的沙沙声。你缓缓坐下，背靠着一棵老槐树粗壮的树干，闭上双眼，试着将纷乱的思绪一一放下。',
    openingVisual: {
      background: 'courtyard',
      location: '汴京 · 幽静庭院',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'sad' },
      ],
      dialogue: [],
    },
    entryPhase: 'meditation_1',
    phases: {
      // ── 第一幕：入静 ──
      meditation_1: {
        phaseId: 'meditation_1',
        narrative:
          '你闭上眼，试图让心如止水。但念头像野草一样疯长——未完成的事、欠下的债、得罪过的人、错过的好运——一个接一个地涌上来，搅得你坐立不安。呼吸变得急促，太阳穴突突直跳。渐渐地，你感觉到一种选择摆在了面前：你可以继续跟这些念头纠缠，也可以试着用不同的方式面对它们。',
        choices: [
          {
            id: 'focus_breath',
            text: '什么都不想，只专注于呼吸，一呼一吸之间寻找平静。',
            consequence: {
              nextPhase: 'meditation_2',
            },
          },
          {
            id: 'recall_trauma',
            text: '直面内心深处的伤疤，回忆那段不愿触碰的往事。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: 'scarred',
            },
            consequence: {
              nextPhase: 'meditation_2',
              immediateEffects: { mood: -5 },
            },
          },
          {
            id: 'imagine_future',
            text: '想象自己未来的模样，那个人会是什么样子？',
            consequence: {
              nextPhase: 'meditation_2',
              immediateEffects: { mood: 3 },
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 庭院老槐树下',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'sad' },
          ],
          dialogue: [],
        },
      },

      // ── 第二幕：领悟 — 减压 + 潜在变形 ──
      meditation_2: {
        phaseId: 'meditation_2',
        narrative:
          '不知过了多久，你缓缓睁开双眼。世界还是那个世界，庭院还是那个庭院，但你的心境似乎不同了。方才盘踞在胸口的沉重感消散了大半，取而代之的是一种说不清道不明的通透。你深深吸了一口气，空气中带着泥土和青草的气息，沁人心脾。一只知了在枝头叫了起来，阳光透过树叶的缝隙，在你手背上投下斑驳的光影。你忽然明白了一些事——不是什么惊天动地的大道理，而是关于自己的一点小小真相。',
        choices: [
          {
            id: 'accept_peace',
            text: '接受这份平静，起身继续前行。',
            consequence: {
              immediateEffects: { mood: 15, health: 5 },
              nextPhase: null,
              endingNarrative:
                '你站起身来，拍了拍衣袍上的尘土。老槐树的枝叶在头顶沙沙作响，像是在替你送行。你迈步走出庭院，脚步比来时轻快了许多。街上的喧嚣重新包围了你，但你心中的那份宁静并没有被打破。你知道，生活中的风浪还会继续袭来，但你也知道，只要心里有这样一个安静的角落，就永远不会真正被打倒。',
              outcome: {
                narrative: '在庭院中静坐冥想，获得内心的平静与力量。',
                effects: { mood: 15, health: 5 },
                memoryTag: '静坐悟道获得平静',
              },
            },
          },
          {
            id: 'let_go_of_scar',
            text: '那道旧伤疤似乎没那么疼了——你决定彻底放下它。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: 'scarred',
            },
            consequence: {
              immediateEffects: { mood: 20, health: 8 },
              nextPhase: null,
              endingNarrative:
                '你将双手摊开，看着自己的掌心。那些往事——那些曾经让你夜不能寐、辗转反侧的记忆——此刻似乎都变得遥远而模糊了。你并没有忘记它们，但它们不再像尖刀一样刺痛你。更像是一道愈合了的伤口，留下了淡淡的痕迹，提醒你曾经受过伤，也曾经挺过来了。你站起身，迎着阳光，长长地吐出一口气。过去的，就让它们过去吧。',
              outcome: {
                narrative: '在冥想中直面旧伤，最终选择了释然与放下。',
                effects: { mood: 20, health: 8 },
                memoryTag: '静坐悟道放下旧伤',
                transformations: [
                  {
                    type: 'lose_narrative_tag',
                    value: 'scarred',
                    description: '在冥想中直面内心的伤疤，最终选择了释然与放下',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 庭院',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'happy' },
          ],
          dialogue: [],
        },
      },
    },
    weight: 4,
    cooldownTicks: 25,
    priority: 5,
    tags: ['spiritual', 'meditation', 'healing', 'stress'],
  },
];
