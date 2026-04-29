// === 玩家多步骤演出 — 家族/亲情 (Player Family) ===
//
// 漫野奇谭式分支叙事场景，宋代背景。
// 包含：久别重逢、遗产纷争、祭祖

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_FAMILY_SCENES: PlayerScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 久别重逢 — Family Reunion (4幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_family_reunion',
    name: '久别重逢',
    description: '多年未见的家人突然造访，背后隐藏着家族的期望与个人的抉择。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetRelationType: 'close_friend',
      location: ['residential', 'residential_north', 'residential_south', 'courtyard'],
    },
    participants: [
      {
        role: '家人',
        requiredRelationType: 'close_friend',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '你正在屋里整理物什，忽听门外传来一阵急促的敲门声。开门一看，你愣住了——门外站着的竟是多年未见的至亲。对方风尘仆仆，衣袍上沾满了旅途的尘土，眼角多了几道细纹，但那双眼睛你还是一眼就认出来了。来人看见你，先是愣了一瞬，随即红了眼眶，声音微微发颤："好久不见了。"',
    openingVisual: {
      background: 'courtyard',
      location: '汴京 · 你家门前',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'family', name: '来人', glyph: '亲', position: 'right', mood: 'sad' },
      ],
      dialogue: [
        { speaker: '来人', text: '好久不见了。' },
      ],
    },
    entryPhase: 'reunion_1',
    phases: {
      // ── 第一幕：意外重逢 ──
      reunion_1: {
        phaseId: 'reunion_1',
        narrative:
          '你将来人请进屋里，倒了一碗凉茶递过去。对方接过碗，手微微发抖，喝了一大口才缓过劲来。屋里的空气似乎都凝固了，多年的分别像一道看不见的墙，横亘在你们之间。你想说点什么，却发现千言万语堵在喉咙里，一时竟不知从何说起。窗外的光线移过桌面，落在对方鬓角新添的白发上，你忽然意识到——这些年，对方也不容易。',
        choices: [
          {
            id: 'warm_welcome',
            text: '热络地招呼，张罗饭菜，先让来人歇歇脚。',
            consequence: {
              immediateEffects: { mood: 8, copper: -3 },
              targetEffects: { mood: 10 },
              relationChange: 5,
              nextPhase: 'reunion_2',
            },
          },
          {
            id: 'ask_directly',
            text: '"怎么突然来了？家里出了什么事？"',
            consequence: {
              immediateEffects: { mood: 3 },
              targetEffects: { mood: -2 },
              nextPhase: 'reunion_2',
            },
          },
          {
            id: 'cold_reception',
            text: '"你来做什么？"语气不善，心中尚有旧怨未消。',
            consequence: {
              immediateEffects: { mood: -5 },
              targetEffects: { mood: -10 },
              relationChange: -5,
              nextPhase: 'reunion_2',
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 你家堂屋',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'family', name: '来人', glyph: '亲', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '来人', text: '这些年……你还好吗？' },
          ],
        },
      },

      // ── 第二幕：来意 ──
      reunion_2: {
        phaseId: 'reunion_2',
        narrative:
          '来人放下茶碗，沉默了片刻，终于道出了来意。原来是家中的老人身体每况愈下，惦记着远在汴京的你。更重要的是，家中有些事情需要你来拿主意——祖上传下来的那几分薄田该如何处置、老人的赡养该由谁来承担、还有族中一些陈年旧账等着人去理清。来人说着说着，眼圈又红了："这些年家里的事都靠我一人撑着，实在撑不住了，才来找你。"',
        choices: [
          {
            id: 'empathize',
            text: '"辛苦你了。这些年是我对不住家里，往后我多担待些。"',
            consequence: {
              immediateEffects: { mood: 5 },
              targetEffects: { mood: 8 },
              relationChange: 8,
              nextPhase: 'reunion_3',
            },
          },
          {
            id: 'defend_self',
            text: '"我在外头也不容易，你只看到你撑着的难处，看不到我的。"',
            consequence: {
              immediateEffects: { mood: -3 },
              targetEffects: { mood: -5 },
              relationChange: -3,
              nextPhase: 'reunion_3',
            },
          },
          {
            id: 'avoid_commitment',
            text: '"先别急着说这些，你一路辛苦，先歇一天再说。"',
            consequence: {
              immediateEffects: { mood: 2 },
              nextPhase: 'reunion_3',
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 你家堂屋',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'family', name: '来人', glyph: '亲', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '来人', text: '这些年家里的事都靠我一人撑着，实在撑不住了。' },
          ],
        },
      },

      // ── 第三幕：家族责任与个人意愿的冲突 ──
      reunion_3: {
        phaseId: 'reunion_3',
        narrative:
          '来人终于说出了最关键的话："族里的意思，想让你回去主持分家的事。祖上的宅子和那几亩水田，该有个说法了。老人也说，想见你最后一面。"屋子里安静得能听见自己的心跳。你望向窗外，暮色渐浓，远处传来孩童的笑声。一边是家族的血脉和责任，一边是你在汴京好不容易站稳的脚跟。这一步，迈出去就回不了头了。',
        choices: [
          {
            id: 'accept_duty',
            text: '应承下来："好，我跟你回去。家里的事，该我了就了。"',
            condition: {
              field: 'honor',
              operator: 'gte',
              value: 40,
            },
            consequence: {
              nextPhase: 'reunion_4',
              immediateEffects: { mood: -3 },
              targetEffects: { mood: 12 },
              relationChange: 10,
            },
          },
          {
            id: 'negotiate',
            text: '"回去可以，但分家的事得按规矩来，不能由着族里某些人的性子。"',
            consequence: {
              nextPhase: 'reunion_4',
              immediateEffects: { mood: 2 },
              targetEffects: { mood: 5 },
              relationChange: 5,
            },
          },
          {
            id: 'refuse_return',
            text: '"我在这里有根了，回不去了。家里的事你先担着，银子我会寄回去。"',
            condition: {
              field: 'greed',
              operator: 'gte',
              value: 50,
            },
            consequence: {
              nextPhase: 'reunion_4',
              immediateEffects: { mood: -8 },
              targetEffects: { mood: -10 },
              relationChange: -10,
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 你家堂屋',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'family', name: '来人', glyph: '亲', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '来人', text: '族里的意思，想让你回去。老人也说，想见你最后一面。' },
          ],
        },
      },

      // ── 第四幕：结局 ──
      reunion_4: {
        phaseId: 'reunion_4',
        narrative:
          '来人看着你的表情，似乎读懂了你的决定。暮色已深，屋里只靠一盏油灯照明，灯火将两人的影子拉得很长。来人站起身，目光中有释然，也有不甘，还有一丝说不清的期待。"那……就这么说定了。"声音里带着微微的颤抖。',
        choices: [
          {
            id: 'filial_ending',
            text: '送来人到客栈歇息，约好明日一起置办回乡的行装。',
            condition: {
              field: 'honor',
              operator: 'gte',
              value: 50,
            },
            consequence: {
              immediateEffects: { mood: 5, social: 10 },
              targetEffects: { mood: 15 },
              relationChange: 15,
              nextPhase: null,
              endingNarrative:
                '你将来人送到了巷口的客栈，又叮嘱掌柜好生照应。回来的路上，你抬头望着满天星斗，心中五味杂陈。回乡意味着要面对一堆烂摊子，也意味着要放下在汴京经营的一切。但血脉这根线，剪不断、理还乱。你推开家门，在油灯下坐了很久，最终从柜子里翻出了那件压在箱底的旧衣裳——那是离家时母亲缝给你的，针脚密密麻麻，每一针都是牵挂。你把旧衣裳叠好放在桌上，算是做了决定。',
              outcome: {
                narrative: '应承家族召唤，决定回乡处理分家事宜，与家人重修旧好。',
                effects: { mood: 5, social: 10 },
                relationChange: 15,
                memoryTag: '应承家族召唤回乡',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'filial',
                    description: '面对家族召唤，选择承担责任，展现了孝道',
                  },
                ],
              },
            },
          },
          {
            id: 'prodigal_ending',
            text: '留下几两碎银做盘缠，但明确表示自己不会回去。',
            consequence: {
              immediateEffects: { copper: -20, mood: -10, social: -5 },
              targetEffects: { mood: -8, copper: 20 },
              relationChange: -15,
              nextPhase: null,
              endingNarrative:
                '你从床底下摸出几两碎银，放在桌上推了过去。来人看着那些银子，没有伸手去拿，只是直直地盯着你的眼睛。良久，对方慢慢站起身，将银子收进怀里，转身走向门口。走到门槛前停了一下，没有回头，只留下一句话："爹娘养你一场，不求你富贵还乡，只盼你能记着自己的根。"门吱呀一声关上了。屋里只剩下你一个人，和一盏快要燃尽的油灯。',
              outcome: {
                narrative: '拒绝回乡，以银子打发了家人，关系降至冰点。',
                effects: { copper: -20, mood: -10, social: -5 },
                relationChange: -15,
                memoryTag: '拒绝家族召唤',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'prodigal',
                    description: '面对家族召唤，选择留在汴京，背上了不孝之名',
                  },
                ],
              },
            },
          },
          {
            id: 'compromise_ending',
            text: '承诺日后定会回去，但眼下确实走不开，让来人先回去报平安。',
            consequence: {
              immediateEffects: { mood: 2, social: 3 },
              targetEffects: { mood: 5 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative:
                '你拉着来人的手，诚恳地说："给我些时日，等这边的事料理妥当了，我一定回去。"来人看了你许久，终于点了点头。你知道这个承诺未必能兑现，但此刻你至少保住了两边都不至于撕破脸。来人走后，你独自坐在院子里，听着夜虫的鸣叫，心想总有一天要面对这个选择。只是那一天，你希望来得晚一些。',
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 你家院中',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'family', name: '来人', glyph: '亲', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '来人', text: '那……就这么说定了。' },
          ],
        },
      },
    },
    weight: 4,
    cooldownTicks: 50,
    priority: 5,
    tags: ['family', 'reunion', 'drama', 'choice_morality'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 遗产纷争 — Inheritance Dispute (4幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_inheritance_dispute',
    name: '遗产纷争',
    description: '族中长辈故去后，遗产分配引发争执，你被卷入其中，需要在各方利益间寻找出路。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetRelationType: 'family',
      location: ['residential', 'residential_north', 'residential_south', 'courtyard'],
      minNearbyNpcs: 2,
    },
    participants: [
      {
        role: '争产甲方',
        requiredRelationType: 'family',
        minCount: 1,
        maxCount: 1,
      },
      {
        role: '争产乙方',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '族中一位受人尊敬的长辈在半月前溘然长逝，今日由族长主持宣读遗书。灵堂里白幡飘荡，香烟缭绕，族人们跪了一地。遗书宣读完毕后，堂中忽然一片哗然——长辈将大宅和上好的水田留给了幼子，而长子只得几间旧屋和一小块旱地。长子当即涨红了脸，拍案而起；幼子紧紧攥着遗书，嘴唇发白。一时间，灵堂变成了战场。',
    openingVisual: {
      background: 'courtyard',
      location: '汴京 · 族中灵堂',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'elder_son', name: '长子', glyph: '兄', position: 'center', mood: 'angry' },
        { id: 'younger_son', name: '幼子', glyph: '弟', position: 'right', mood: 'sad' },
      ],
      dialogue: [
        { speaker: '长子', text: '这不公平！我是长子，家业该由我来继承！' },
        { speaker: '幼子', text: '这是爹的遗愿……你怎能如此？' },
      ],
    },
    entryPhase: 'inheritance_1',
    phases: {
      // ── 第一幕：争执爆发 ──
      inheritance_1: {
        phaseId: 'inheritance_1',
        narrative:
          '灵堂里的气氛剑拔弩张。长子指着遗书大声道："这份遗书来路不明！爹病重时一直是老二在跟前伺候，谁知道是不是他逼爹写的？"幼子眼圈通红，声音哽咽："大哥！爹临终前神志清楚得很，族长和三叔都在场作证，你怎能血口喷人！"周围的族人们面面相觑，有的窃窃私语，有的暗暗摇头。族长敲了敲拐杖想要压住场面，但两个儿子的嗓门一个比一个高。',
        choices: [
          {
            id: 'support_eldest',
            text: '站出来替长子说话："长幼有序，祖上的规矩不能乱。"',
            consequence: {
              nextPhase: 'inheritance_2',
              immediateEffects: { social: -5 },
              targetEffects: { mood: 10 },
              relationChange: 10,
            },
          },
          {
            id: 'support_youngest',
            text: '替幼子说话："遗书既有族长作证，当尊重长辈遗愿。"',
            consequence: {
              nextPhase: 'inheritance_2',
              immediateEffects: { social: -5 },
              relationChange: -8,
            },
          },
          {
            id: 'mediate',
            text: '站出来调停："两位且慢！长辈尸骨未寒，如此争吵，老人家在天之灵如何安心？"',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '温和',
            },
            consequence: {
              nextPhase: 'inheritance_2',
              immediateEffects: { social: 5 },
              relationChange: 3,
            },
          },
          {
            id: 'exploit',
            text: '暗中盘算：这份家产若能分一杯羹……',
            condition: {
              field: 'greed',
              operator: 'gte',
              value: 50,
            },
            consequence: {
              nextPhase: 'inheritance_2',
              immediateEffects: { mood: -3 },
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 灵堂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'elder_son', name: '长子', glyph: '兄', position: 'center', mood: 'angry' },
            { id: 'younger_son', name: '幼子', glyph: '弟', position: 'right', mood: 'sad' },
            { id: 'clan_head', name: '族长', glyph: '族', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '长子', text: '这份遗书来路不明！谁知道是不是他逼爹写的？' },
            { speaker: '幼子', text: '大哥！爹临终前神志清楚得很，族长和三叔都在场作证！' },
          ],
        },
      },

      // ── 第二幕：冲突升级或走向调停 ──
      inheritance_2: {
        phaseId: 'inheritance_2',
        narrative:
          '争吵愈演愈烈，长子一把夺过遗书要去验笔迹，幼子扑上去抢夺，两人扭作一团。族长连声喝止却无人理会。其他族人也分成了两派，各执一词，灵堂里乱成了一锅粥。供桌上的灵位被碰倒了，香灰洒了一地。你站在人群之中，所有人都看向你——在这个家族里，你的话还有几分分量。',
        choices: [
          {
            id: 'propose_split',
            text: '"大宅和水田一人一半，谁也不吃亏，如何？"',
            consequence: {
              nextPhase: 'inheritance_3',
              immediateEffects: { mood: 3 },
            },
          },
          {
            id: 'propose_sale',
            text: '"不如把大宅和田产都卖了，银两均分，一了百了。"',
            consequence: {
              nextPhase: 'inheritance_3',
              immediateEffects: { mood: 2 },
              relationChange: -5,
            },
          },
          {
            id: 'side_with_eldest_force',
            text: '拉住幼子，帮长子抢回遗书。',
            consequence: {
              nextPhase: 'inheritance_3',
              immediateEffects: { social: -8 },
              relationChange: -12,
            },
          },
          {
            id: 'grab_opportunity',
            text: '趁乱提议由自己代为管理家产，待风波平息再做分配。',
            condition: {
              field: 'greed',
              operator: 'gte',
              value: 60,
            },
            consequence: {
              nextPhase: 'inheritance_3',
              immediateEffects: { mood: -5, social: -10 },
              relationChange: -15,
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 灵堂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'elder_son', name: '长子', glyph: '兄', position: 'center', mood: 'angry' },
            { id: 'younger_son', name: '幼子', glyph: '弟', position: 'right', mood: 'angry' },
            { id: 'clan_head', name: '族长', glyph: '族', position: 'center', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '族长', text: '都住手！你们成何体统！' },
          ],
        },
      },

      // ── 第三幕：多属性判定调停结果 ──
      inheritance_3: {
        phaseId: 'inheritance_3',
        narrative:
          '族长终于拍案而起，拄着拐杖走到两兄弟中间。他苍老的声音穿透了嘈杂："够了！都给我住嘴！"灵堂瞬间安静下来。族长转向你，目光深沉："你说说看，这事该怎么办？"所有人的目光都集中在你身上——你知道，接下来的每一个字，都会被在场的人反复咀嚼。',
        choices: [
          {
            id: 'wise_judgment',
            text: '提出一个兼顾情理的方案：大宅归长子，水田归幼子，另补差价。',
            consequence: {
              resolution: {
                type: 'multi_contested',
                multiContested: {
                  actorStats: [
                    { stat: 'honor', weight: 0.5 },
                    { stat: 'social', weight: 0.3 },
                    { stat: 'copper', weight: 0.2 },
                  ],
                  targetStats: [
                    { stat: 'honor', weight: 0.4 },
                    { stat: 'social', weight: 0.4 },
                    { stat: 'health', weight: 0.2 },
                  ],
                  modifiers: [
                    {
                      condition: { field: 'personality', op: 'includes', value: '温和' },
                      bonus: 20,
                    },
                    {
                      condition: { field: 'honor', op: 'gte', value: 50 },
                      bonus: 15,
                    },
                  ],
                },
              },
              tieredResults: {
                critical_success: {
                  narrative:
                    '你的方案说出口，满堂皆惊。族长抚掌而叹："好一个折中之策！"长子虽心有不甘，但碍于面子不好再闹；幼子得到了实打实的水田，也算满意。两人在族长的见证下立了字据，按了手印。族人们纷纷投来赞许的目光，有人低声说："此人日后必成大器。"',
                  effects: { mood: 15, social: 20 },
                },
                success: {
                  narrative:
                    '你的方案得到了多数族人的认可，虽然两兄弟各有些不情愿，但在族长的威严和众人的劝说下，最终还是接受了。分家的字据当众立好，总算没有闹到官府去。族人们松了一口气，灵堂里重新恢复了肃穆。',
                  effects: { mood: 8, social: 10 },
                },
                partial_success: {
                  narrative:
                    '你的方案只得到了部分人的支持。长子勉强同意，但幼子觉得吃了亏，又闹了一阵。最终还是族长出面压了下去，但灵堂里的气氛已经彻底变了味。你虽出了一把力，但两边都不算领情。',
                  effects: { mood: 2, social: 3 },
                },
                failure: {
                  narrative:
                    '你的方案两头不讨好。长子嫌大宅还要补差价不公平，幼子嫌水田不如大宅值钱。两人又吵了起来，比之前更凶。族长无奈地看了你一眼，叹了口气。这场纷争恐怕一时半会儿解决不了了。',
                  effects: { mood: -8, social: -10 },
                },
              },
              nextPhase: 'inheritance_4',
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 灵堂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'elder_son', name: '长子', glyph: '兄', position: 'left', mood: 'angry' },
            { id: 'younger_son', name: '幼子', glyph: '弟', position: 'right', mood: 'angry' },
            { id: 'clan_head', name: '族长', glyph: '族', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '族长', text: '你说说看，这事该怎么办？' },
          ],
        },
      },

      // ── 第四幕：余波 ──
      inheritance_4: {
        phaseId: 'inheritance_4',
        narrative:
          '风波渐渐平息，族人们三三两两地散去。灵堂里恢复了安静，只剩白幡在穿堂风中轻轻摆动。你正要离开，身后有人叫住了你——是族中的一位长者。他走到你身边，目光中带着审视与期许。',
        choices: [
          {
            id: 'accept_respect',
            text: '"都是一家人，理应如此。"坦然接受族人的敬意。',
            consequence: {
              immediateEffects: { mood: 8, social: 12 },
              relationChange: 10,
              nextPhase: null,
              endingNarrative:
                '长者拍了拍你的肩膀，低声道："今日之事，你做得很好。家族若要兴旺，靠的就是能在风浪中站得稳的人。"你点了点头，走出灵堂。阳光洒在身上，暖暖的。身后传来族人重新整理灵堂的声响——磕碰、扫除、重新摆放灵位。争端虽未完全化解，但至少没有撕破脸。这就够了。你想着，日后的路还长着呢。',
              outcome: {
                narrative: '在家族遗产纷争中充当调停者，获得族人的尊重。',
                effects: { mood: 8, social: 12 },
                relationChange: 10,
                memoryTag: '调停家族遗产纷争',
              },
            },
          },
          {
            id: 'reflect_sadly',
            text: '默默走开，心中感慨万千——家产不过几间屋几亩田，却让骨肉反目。',
            consequence: {
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative:
                '你没有回头，独自走在回家的路上。夕阳把影子拉得很长，像一道裂缝。你想起小时候，两兄弟还是孩子的时候，在这同一个院子里追逐嬉闹、争着一颗糖吃。那时候谁也不会想到，有朝一日他们会为了一间宅子、几亩水田，在父亲的灵堂前大打出手。你叹了口气，脚步不由自主地慢了下来。世间最难断的，果然是家务事。',
              outcome: {
                narrative: '目睹家族纷争后的惆怅与反思。',
                effects: { mood: -3 },
                memoryTag: '家族遗产纷争后的反思',
              },
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 族中灵堂外',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'elder', name: '族中长者', glyph: '长', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '族中长者', text: '今日之事，你做得很好。' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 60,
    priority: 6,
    tags: ['family', 'inheritance', 'conflict', 'drama', 'choice_morality'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 祭祖 — Ancestral Shrine (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_ancestral_shrine',
    name: '祭祖',
    description: '春秋祭祖之时，你在祠堂中完成祭礼，却在仪式中发现了家族中隐藏的秘密。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetRelationType: 'family',
      location: ['residential', 'residential_north', 'residential_south', 'courtyard'],
      timeOfDay: 'day',
      season: ['spring', 'autumn'],
    },
    participants: [
      {
        role: '族中长辈',
        requiredRelationType: 'family',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '又是一年祭祖之时。祠堂里烛火通明，供桌上摆满了三牲果品和黄纸香烛。族人们按辈分依次排列，衣冠肃整。香火缭绕中，祖先的牌位一排排矗立在神龛之上，密密麻麻的名字记录着这个家族数代人的兴衰荣辱。你站在族人之列，手捧一炷清香，心中默念着先人的名讳。这是规矩，也是血脉的延续。',
    openingVisual: {
      background: 'courtyard',
      location: '汴京 · 族中祠堂',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'elder', name: '族中长辈', glyph: '长', position: 'center', mood: 'neutral' },
      ],
      dialogue: [],
    },
    entryPhase: 'shrine_1',
    phases: {
      // ── 第一幕：祭礼 ──
      shrine_1: {
        phaseId: 'shrine_1',
        narrative:
          '族中长辈领着众人行三跪九叩之礼。仪式庄严肃穆，每一个动作都有严格的讲究——先上香，再献酒，然后焚纸，最后读祭文。你跪在冰冷的石板上，膝盖隐隐发疼。供桌上的烛火在穿堂风中摇曳不定，映得满墙的牌位明灭可见。长辈示意你上前供奉——你可以按规矩献上铜钱添香，也可以省下这笔开销。',
        choices: [
          {
            id: 'sincere_offering',
            text: '虔诚地献上十文铜钱添香，恭恭敬敬完成祭礼。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 10,
            },
            consequence: {
              immediateEffects: { copper: -10, mood: 8 },
              relationChange: 8,
              nextPhase: 'shrine_2',
            },
          },
          {
            id: 'simple_tribute',
            text: '按最低标准完成祭礼，不多花一文钱。',
            consequence: {
              immediateEffects: { mood: 2 },
              relationChange: 2,
              nextPhase: 'shrine_2',
            },
          },
          {
            id: 'skip_ritual',
            text: '草草应付了事，心不在焉。',
            consequence: {
              immediateEffects: { mood: -3 },
              relationChange: -5,
              nextPhase: 'shrine_2',
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 祠堂内',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'elder', name: '族中长辈', glyph: '长', position: 'left', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '族中长辈', text: '跪——拜——兴——' },
          ],
        },
      },

      // ── 第二幕：祠堂中的发现 ──
      shrine_2: {
        phaseId: 'shrine_2',
        narrative:
          '祭礼结束后，族人们陆续散去。你独自留在祠堂里，帮着收拾供品。在搬动香案时，你不小心碰掉了一块松动的砖石——砖石后面竟然露出一个暗格。暗格里放着一卷泛黄的绢帛，上面用工整的小楷写着一些你看不懂的符号和几句似通非通的话。你心头一震——这难道是先辈留下的什么东西？正当你犹豫要不要拿出来细看时，身后传来脚步声。是族中的长辈去而复返。',
        choices: [
          {
            id: 'show_elder',
            text: '大方地将绢帛拿给长辈看："叔伯，您看这是什么？"',
            consequence: {
              immediateEffects: { mood: 5 },
              relationChange: 10,
              nextPhase: 'shrine_3',
            },
          },
          {
            id: 'hide_read',
            text: '先将绢帛藏在袖中，等回去再细细研究。',
            consequence: {
              nextPhase: 'shrine_3',
              immediateEffects: { mood: 3 },
            },
          },
          {
            id: 'put_back',
            text: '将绢帛放回暗格，复原砖石，装作什么都没发生。',
            consequence: {
              nextPhase: 'shrine_3',
              immediateEffects: { mood: -2 },
              relationChange: -3,
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 祠堂暗格前',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'elder', name: '族中长辈', glyph: '长', position: 'left', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '族中长辈', text: '你还没走？' },
          ],
        },
      },

      // ── 第三幕：家族秘密与抉择 ──
      shrine_3: {
        phaseId: 'shrine_3',
        narrative:
          '长辈走到你身边，目光落在那卷绢帛上（无论你是否藏起，他似乎都已经知道了）。他沉默了很久，终于缓缓开口："这卷绢帛，是你曾祖留下的遗训。族中知道此事的人，如今只剩下老夫一个了。"他的声音苍老而低沉，像是从很远很远的地方传来。"上面记载着一段家族旧事——你曾祖年轻时曾在朝中任职，后来得罪了权贵，不得不举家南迁，隐姓埋名。这些牌位上的名字，有些并不是真正的祖先。"',
        choices: [
          {
            id: 'honor_tradition',
            text: '"无论祖上是谁，祭祀的规矩不能废。先人的精神比名字更重要。"',
            consequence: {
              immediateEffects: { mood: 12, social: 8 },
              relationChange: 15,
              nextPhase: null,
              endingNarrative:
                '长辈闻言，浑浊的眼中闪过一丝欣慰的光。他拍了拍你的肩膀，声音有些哽咽："好孩子，你比老夫想得通透。"他将绢帛重新放回暗格，仔细地复原了砖石。"这件事，等你日后当了家，再传给下一代吧。"你点了点头，和长辈一起向祖先牌位行了一礼。走出祠堂时，阳光正好，你回头看了一眼那扇斑驳的木门——牌位上的名字或许有假，但血脉中的敬畏与传承，是真的。',
              outcome: {
                narrative: '在祭祖中发现家族秘密，选择守护传统与敬意。',
                effects: { mood: 12, social: 8 },
                relationChange: 15,
                memoryTag: '祭祖中守护家族传统',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'honors_ancestors',
                    description: '在得知家族秘密后仍坚守祭祀传统，展现了真正的孝道',
                  },
                ],
              },
            },
          },
          {
            id: 'break_tradition',
            text: '"既是假名，这祭祀便是一场空。我不再参与这些虚妄的仪式了。"',
            consequence: {
              immediateEffects: { mood: -5, social: -10 },
              relationChange: -12,
              nextPhase: null,
              endingNarrative:
                '长辈的脸色一下子沉了下来。他盯着你看了很久，最终叹了一口气，将绢帛收回怀中。"你……走吧。"他的声音像是从牙缝里挤出来的。你转身走出祠堂，身后传来长辈重重的一声叹息。祠堂的门槛很高，你跨出去的时候差点绊了一跤。外面的阳光刺得你眯起了眼——但你心里清楚，从今天起，你在这个家族中，就是个外人了。',
              outcome: {
                narrative: '得知家族秘密后拒绝继续传统祭祀，与家族产生裂痕。',
                effects: { mood: -5, social: -10 },
                relationChange: -12,
                memoryTag: '祭祖中质疑家族传统',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'breaks_tradition',
                    description: '在得知家族秘密后拒绝继续祭祀传统，被族中视为叛逆',
                  },
                ],
              },
            },
          },
          {
            id: 'seek_truth',
            text: '"曾祖的真实身份是什么？我想知道真相。"',
            consequence: {
              immediateEffects: { mood: 5, social: -3 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative:
                '长辈犹豫了一下，最终从怀中取出绢帛，递到你手中。"你曾祖本姓不姓这个。他是京城……"他的话说到一半，忽然住了口，警觉地看了看门外。他压低声音："此事不可在祠堂里说。你且把绢帛收好，日后找机会，老夫再慢慢告诉你。"你将绢帛贴身藏好，向长辈行了一礼，走出了祠堂。风从身后吹来，吹动了祠堂门前的幡布。你低头看了看手中的绢帛——上面的字迹在阳光下清晰可辨，每一个笔画都藏着一段尘封的往事。真相，或许比你想象的还要惊人。',
              outcome: {
                narrative: '在祭祖中发现家族秘密，选择追寻真相。',
                effects: { mood: 5, social: -3 },
                relationChange: 5,
                memoryTag: '祭祖中发现家族秘密追寻真相',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'honors_ancestors',
                    description: '在得知家族秘密后选择追寻真相，以另一种方式纪念先人',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'courtyard',
          location: '汴京 · 祠堂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'elder', name: '族中长辈', glyph: '长', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '族中长辈', text: '这些牌位上的名字，有些并不是真正的祖先。' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 45,
    priority: 4,
    tags: ['family', 'ancestral', 'tradition', 'mystery', 'seasonal'],
  },
];
