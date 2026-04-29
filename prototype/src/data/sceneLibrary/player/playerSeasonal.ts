// === 玩家多步骤演出 — 节令/时序 (Player Seasonal) ===
//
// 漫野奇谭式分支叙事场景，宋代背景。
// 包含：春节风波、旱灾来临、抢收之战、冬至长夜

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_SEASONAL_SCENES: PlayerScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 春节风波 — Spring Festival Turmoil (4幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_spring_festival',
    name: '春节风波',
    description: '除夕之夜，街坊邻里互相拜年，但一场关于赊账的争执打破了喜庆气氛。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['center_street', 'east_market', 'courtyard'],
      season: ['spring'],
    },
    participants: [
      {
        role: '街坊',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '爆竹声声辞旧岁，家家户户门前挂着大红灯笼，映得整条街都染上了一层暖色。你正提着一袋年货往回走，忽然听到前方传来一阵激烈的争吵声。两个街坊指着彼此的鼻子，脸涨得通红——看样子是去年的赊账还没算清，借着酒劲在除夕夜翻了出来。周围的邻居们纷纷探出头来，有的劝有的看热闹，场面一时混乱不堪。',
    openingVisual: {
      background: 'market',
      location: '汴京 · 正月街坊',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'neighbor_a', name: '街坊甲', glyph: '甲', position: 'center', mood: 'angry' },
        { id: 'neighbor_b', name: '街坊乙', glyph: '乙', position: 'right', mood: 'angry' },
      ],
      dialogue: [
        { speaker: '街坊甲', text: '去年腊月借你的三贯钱，你拖到现在还不还！' },
        { speaker: '街坊乙', text: '胡说！明明是你欠我的米钱还没给！' },
      ],
    },
    entryPhase: 'festival_1',
    phases: {
      // ── 第一幕：介入争执 ──
      festival_1: {
        phaseId: 'festival_1',
        narrative:
          '两人在街中央推搡起来，酒壶摔碎在地上，酒香四溢。周围几个小孩被吓得哇哇大哭，大人们七嘴八舌地劝架，但谁也拉不开这俩醉汉。有人看见你路过，连忙招手喊道："这位行行好，过来帮忙劝劝吧！大过年的闹成这样，多晦气！"',
        choices: [
          {
            id: 'mediate',
            text: '上前调解，把两人分开好好说话。',
            consequence: {
              nextPhase: 'festival_2a',
              immediateEffects: { social: 3 },
            },
          },
          {
            id: 'pay_debt',
            text: '替他们把账结了，大过年的图个清净。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 50,
            },
            consequence: {
              nextPhase: 'festival_2b',
              immediateEffects: { copper: -30, social: 10 },
            },
          },
          {
            id: 'watch',
            text: '站在一旁观望，这种闲事少管为妙。',
            consequence: {
              nextPhase: 'festival_2c',
              immediateEffects: { mood: -2 },
            },
          },
        ],
        visual: {
          background: 'market',
          location: '汴京 · 正月街坊',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'neighbor_a', name: '街坊甲', glyph: '甲', position: 'center', mood: 'angry' },
            { id: 'neighbor_b', name: '街坊乙', glyph: '乙', position: 'right', mood: 'angry' },
          ],
          dialogue: [
            { speaker: '路人', text: '这位行行好，帮忙劝劝吧！大过年的闹成这样！' },
          ],
        },
      },

      // ── 第二幕A：调解成功 ──
      festival_2a: {
        phaseId: 'festival_2a',
        narrative:
          '你硬是把两人拉开了，一边一个按在路边的石凳上。费了好一番口舌，总算把事情的原委弄清楚了——原来是互相赊欠，账目扯不清楚，谁也说服不了谁。你提出帮他们对账，两人虽然还有气，但碍于你的面子，勉强同意了。',
        choices: [
          {
            id: 'fair_judgment',
            text: '公正裁决，谁欠谁多少，一笔一笔算清楚。',
            consequence: {
              nextPhase: 'festival_3',
              immediateEffects: { social: 5 },
              relationChange: 8,
            },
          },
          {
            id: 'split_difference',
            text: '各让一步，差价两家平分，和气生财。',
            consequence: {
              nextPhase: 'festival_3',
              immediateEffects: { social: 8 },
              relationChange: 5,
            },
          },
        ],
        visual: {
          background: 'market',
          location: '汴京 · 街边石凳',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'neighbor_a', name: '街坊甲', glyph: '甲', position: 'left', mood: 'sad' },
            { id: 'neighbor_b', name: '街坊乙', glyph: '乙', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '你', text: '坐下来，咱们一笔一笔算，总能弄清楚。' },
          ],
        },
      },

      // ── 第二幕B：替人还债 ──
      festival_2b: {
        phaseId: 'festival_2b',
        narrative:
          '你从怀中掏出铜钱，将两人的旧账一笔勾销。街坊甲和街坊乙都愣住了，酒意醒了大半，面面相觑，脸上都有些挂不住。周围看热闹的邻居们纷纷竖起大拇指，有人感慨道："这年头还有这样的好人！"两人不好意思地挠着头，争着要请你喝酒。',
        choices: [
          {
            id: 'accept_drink',
            text: '接受邀请，三人坐下来一起喝杯年酒。',
            consequence: {
              nextPhase: 'festival_3',
              immediateEffects: { mood: 10, social: 5 },
              relationChange: 12,
            },
          },
          {
            id: 'decline_gracefully',
            text: '婉言谢绝，说自家年夜饭还等着呢。',
            consequence: {
              nextPhase: 'festival_3',
              immediateEffects: { social: 8 },
              relationChange: 8,
            },
          },
        ],
        visual: {
          background: 'market',
          location: '汴京 · 正月街坊',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'happy' },
            { id: 'neighbor_a', name: '街坊甲', glyph: '甲', position: 'left', mood: 'happy' },
            { id: 'neighbor_b', name: '街坊乙', glyph: '乙', position: 'right', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '街坊甲', text: '大兄弟，这怎么好意思……来来来，我请你喝酒！' },
          ],
        },
      },

      // ── 第二幕C：旁观 ──
      festival_2c: {
        phaseId: 'festival_2c',
        narrative:
          '你抱着胳膊站在一旁，看着两人闹。旁边一个老丈摇头叹气："现在的年轻人啊，大过年的也不让人安生。"你正想附和几句，忽然其中一人被推得踉跄几步，直直朝你撞了过来——',
        choices: [
          {
            id: 'dodge',
            text: '眼疾手快闪身躲开。',
            consequence: {
              nextPhase: 'festival_3',
              immediateEffects: { mood: -3 },
            },
          },
          {
            id: 'catch',
            text: '伸手扶住对方，顺便把他也劝住。',
            consequence: {
              nextPhase: 'festival_3',
              immediateEffects: { social: 3 },
              relationChange: 5,
            },
          },
        ],
        visual: {
          background: 'market',
          location: '汴京 · 正月街坊',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'neighbor_a', name: '街坊甲', glyph: '甲', position: 'center', mood: 'angry' },
            { id: 'neighbor_b', name: '街坊乙', glyph: '乙', position: 'right', mood: 'angry' },
          ],
          dialogue: [
            { speaker: '老丈', text: '唉，大过年的也不让人安生……' },
          ],
        },
      },

      // ── 第三幕：除夕结局 ──
      festival_3: {
        phaseId: 'festival_3',
        narrative:
          '风波终于平息。远处传来噼里啪啦的鞭炮声，夜空中绽放出五颜六色的烟花。街坊们纷纷回到各自家中准备年夜饭，空气中弥漫着硝烟和饭菜的香味。你抬头望着烟花，心中感慨万千——这一年有苦有甜，不管怎样，总算又熬过来了。',
        choices: [
          {
            id: 'go_home_happy',
            text: '心情不错，快步回家吃年夜饭。',
            consequence: {
              immediateEffects: { mood: 10, social: 5 },
              nextPhase: null,
              endingNarrative:
                '你推开家门，桌上已摆满了热气腾腾的菜肴。虽不是什么山珍海味，但在这万家团圆的夜晚，一碗热汤足以暖透人心。你坐下来，给自己斟了一杯酒，遥遥举杯敬那满天的烟花。新年快乐。',
              outcome: {
                narrative: '在春节街坊争执中出手相助，收获了邻里的敬意。',
                effects: { mood: 10, social: 5 },
                memoryTag: '春节调解街坊',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'spring_festival_peacemaker',
                    description: '在除夕夜调解了街坊的争端，获得了邻里的好感',
                  },
                ],
              },
            },
          },
          {
            id: 'reflect_alone',
            text: '独自在街头站了一会儿，看着万家灯火。',
            consequence: {
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative:
                '烟花一簇接一簇在头顶炸开，将你的影子拉得很长。街上的人渐渐散去，只剩你一人站在空旷的十字路口。远处传来隐约的说笑声和碗筷碰撞的声音。你裹紧了衣裳，慢慢踱步回家。这个年，过得倒比往年热闹些。',
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 除夕夜',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'happy' },
          ],
          dialogue: [],
        },
      },
    },
    weight: 5,
    cooldownTicks: 60,
    priority: 5,
    tags: ['seasonal', 'spring', 'social', 'festival'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 旱灾来临 — Drought Strikes (4幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_drought_crisis',
    name: '旱灾来临',
    description: '连月无雨，河床干涸，百姓争相抢水。你在水源旁目睹了一场即将爆发的冲突。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['farmland', 'river'],
      season: ['summer'],
    },
    participants: [
      {
        role: '受灾乡民',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '烈日如火，已经整整两个月没下一滴雨了。田里的庄稼卷曲着叶片，像一只只干枯的手掌朝天空伸展。你走到村口的水井旁，发现井水已经浅得见底，几个村民正围在井边争论着什么。远处传来一阵喧哗——上游的村子截了河道，下游的百姓断了水。一触即发的紧张气氛笼罩着整个村庄。',
    openingVisual: {
      background: 'farmland',
      location: '汴京郊外 · 干涸河床',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'sad' },
        { id: 'villager', name: '乡民', glyph: '农', position: 'center', mood: 'angry' },
      ],
      dialogue: [
        { speaker: '乡民', text: '上游把水全截了！咱们的庄稼全要干死了！' },
      ],
    },
    entryPhase: 'drought_1',
    phases: {
      // ── 第一幕：抉择时刻 ──
      drought_1: {
        phaseId: 'drought_1',
        narrative:
          '乡民们群情激愤，有人提议冲到上游去把堤坝拆了，有人主张去县衙告状，还有人已经拿起了锄头扁担，一副要拼命的架势。你身旁的老农蹲在井边，看着那浅浅的一洼浑水，浑浊的老眼里满是绝望。他抬头看了你一眼，沙哑着嗓子说："后生，你看这事……该怎么办？"',
        choices: [
          {
            id: 'lead_negotiate',
            text: '提议派代表去上游谈判，先讲道理，再论其他。',
            consequence: {
              nextPhase: 'drought_2a',
              immediateEffects: { social: 3 },
            },
          },
          {
            id: 'share_water',
            text: '提议各家轮流取水，先定规矩，免得内部先乱。',
            consequence: {
              nextPhase: 'drought_2b',
              immediateEffects: { social: 5 },
            },
          },
          {
            id: 'dig_well',
            text: '提议合力打一口新井，与其争水不如找新水源。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 30,
            },
            consequence: {
              nextPhase: 'drought_2c',
              immediateEffects: { copper: -20, social: 5 },
            },
          },
          {
            id: 'stay_out',
            text: '保持沉默，这不是你能管的事。',
            consequence: {
              nextPhase: 'drought_2d',
              immediateEffects: { mood: -5 },
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 村口水井',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'villager', name: '乡民', glyph: '农', position: 'center', mood: 'angry' },
            { id: 'old_farmer', name: '老农', glyph: '老', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '老农', text: '后生，你看这事……该怎么办？' },
          ],
        },
      },

      // ── 第二幕A：去上游谈判 ──
      drought_2a: {
        phaseId: 'drought_2a',
        narrative:
          '你带着几个胆大的乡民沿河而上，找到了上游村子截水的堤坝。堤坝那边也围了一群人，同样面色不善。你站出来，大声说明来意，试图用道理说服对方。双方的领头人互相瞪着，空气几乎要燃烧起来。',
        choices: [
          {
            id: 'compromise_water',
            text: '提出分水方案：上下午各放一半水量，上下游共享。',
            consequence: {
              nextPhase: 'drought_3',
              immediateEffects: { social: 10, mood: 8 },
              relationChange: 10,
            },
          },
          {
            id: 'threaten_report',
            text: '威胁要上报县衙，私截河道可是犯法的。',
            consequence: {
              resolution: {
                type: 'contested',
                contestedStat: { actor: 'social', target: 'social' },
              },
              tieredResults: {
                critical_success: {
                  narrative: '对方被你一番话震住了，面面相觑之后，领头人咬牙答应了放水。你长舒一口气，旱灾中最可怕的不是缺水，而是人心。',
                  effects: { social: 15, mood: 10 },
                },
                success: {
                  narrative: '对方虽然不情不愿，但在你的坚持下，总算答应有限度地放水。虽然不够，但聊胜于无。',
                  effects: { social: 8, mood: 5 },
                },
                failure: {
                  narrative: '对方根本不吃你这一套，反而嘲笑你是下游来的穷鬼。谈判破裂，双方不欢而散。',
                  effects: { social: -5, mood: -10 },
                },
              },
              nextPhase: 'drought_3',
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '上游 · 堤坝旁',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'upstream_leader', name: '上游领头', glyph: '上', position: 'right', mood: 'angry' },
          ],
          dialogue: [
            { speaker: '你', text: '大家都是靠天吃饭的，何必做得这么绝？' },
          ],
        },
      },

      // ── 第二幕B：定规矩分水 ──
      drought_2b: {
        phaseId: 'drought_2b',
        narrative:
          '你的提议得到了大部分人的赞同。你找来一块木板，用炭笔写下了分水的规矩：每家每天限定取水两桶，按田亩大小酌情增减，任何人不得多取。有人提出异议，但在众人的压力下也只好同意。规矩是定下了，但执行起来还需要有人监督。',
        choices: [
          {
            id: 'volunteer_supervise',
            text: '主动请缨担任监督人，头几天自己来看着。',
            consequence: {
              nextPhase: 'drought_3',
              immediateEffects: { social: 8, mood: 5 },
              relationChange: 8,
            },
          },
          {
            id: 'suggest_rotation',
            text: '建议各家轮流出人监督，公平公正。',
            consequence: {
              nextPhase: 'drought_3',
              immediateEffects: { social: 5 },
              relationChange: 5,
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 水井旁',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'villager', name: '乡民', glyph: '农', position: 'left', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '你', text: '每家每天两桶水，按田亩大小增减，不得多取。' },
          ],
        },
      },

      // ── 第二幕C：合力打井 ──
      drought_2c: {
        phaseId: 'drought_2c',
        narrative:
          '你拿出一些铜钱作为启动资金，号召乡民们合力打一口新井。消息一传开，连隔壁村的人都来了——缺水的不止你们一个村。众人分工合作，有力出力，有工具的出工具。第一天就挖了三丈深，土越来越潮湿，看起来有戏。',
        choices: [
          {
            id: 'keep_digging',
            text: '继续带头挖，今天不出水不收工。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.6,
              },
              tieredResults: {
                critical_success: {
                  narrative: '黄昏时分，井底传来一声欢呼——出水了！而且水量不小，是口好井！众人欢声雷动，你浑身泥浆地爬出井口，脸上却笑得比谁都灿烂。',
                  effects: { social: 15, mood: 15, copper: 10 },
                },
                success: {
                  narrative: '天黑前终于挖到了水，虽然水量不大，但至少够村里应急。大家虽然累得够呛，但脸上都带着笑容。',
                  effects: { social: 8, mood: 8 },
                },
                failure: {
                  narrative: '挖了一整天也没见着水的影子。众人泄了气，有人开始嘀咕这地方根本没水脉。你也不免有些沮丧。',
                  effects: { social: 3, mood: -5 },
                },
              },
              nextPhase: 'drought_3',
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 新井工地',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'villager', name: '乡民', glyph: '农', position: 'left', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '乡民', text: '土越来越湿了！有戏！' },
          ],
        },
      },

      // ── 第二幕D：旁观后果 ──
      drought_2d: {
        phaseId: 'drought_2d',
        narrative:
          '你没有开口，默默看着事态发展。最终几个暴脾气的乡民扛着锄头朝上游去了，后面跟了一大群人。你知道这不会有什么好结果，但你选择了置身事外。果然，没过多久就传来消息——上游下游两村打了起来，好几个人受了伤。水的问题非但没解决，反而多了几桩仇恨。',
        choices: [
          {
            id: 'help_wounded',
            text: '去帮忙照顾伤者，至少做些力所能及的事。',
            consequence: {
              nextPhase: 'drought_3',
              immediateEffects: { social: 3, mood: -3 },
            },
          },
          {
            id: 'leave_village',
            text: '收拾东西离开这里，这不是你的战场。',
            consequence: {
              nextPhase: null,
              endingNarrative:
                '你背起行囊，头也不回地离开了这个缺水的村庄。身后传来伤者的呻吟和女人的哭泣声。你加快了脚步。天边一片火烧云，将干裂的大地映得血红。你告诉自己，这不关你的事。但那声音，你很久都忘不了。',
              outcome: {
                narrative: '旱灾中选择袖手旁观，目睹了两村械斗。',
                effects: { mood: -10 },
                memoryTag: '旱灾旁观',
              },
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 村口',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'sad' },
          ],
          dialogue: [],
        },
      },

      // ── 第三幕：旱灾结局 ──
      drought_3: {
        phaseId: 'drought_3',
        narrative:
          '不管结果如何，这一天总算过去了。傍晚时分，天边出现了一片乌云——也许要下雨了，也许只是虚晃一枪。乡民们望着天空，双手合十默默祈祷。你站在人群中，抬头看着那片乌云，心中五味杂陈。天灾面前，人的力量何其渺小，但人心若还能聚在一起，便不算输。',
        choices: [
          {
            id: 'stay_help',
            text: '决定留下来继续帮忙，旱灾还没过去。',
            consequence: {
              immediateEffects: { social: 10, mood: 5 },
              nextPhase: null,
              endingNarrative:
                '接下来的日子里，你每天天不亮就起来，帮着分水、巡渠、照顾老人和孩子。虽然辛苦，但乡民们看你的眼神从陌生变成了感激，从感激变成了信任。第七天清晨，一声闷雷从天际滚过，大雨倾盆而下。你站在雨中，任凭雨水浇透了全身，仰天大笑。',
              outcome: {
                narrative: '在旱灾中挺身而出，帮助乡民度过难关。',
                effects: { social: 10, mood: 5 },
                memoryTag: '旱灾中挺身而出',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'drought_hero',
                    description: '在旱灾中帮助乡民解决水源问题，被视为村里的恩人',
                  },
                ],
              },
            },
          },
          {
            id: 'move_on',
            text: '尽了力就好，日子还得继续，该走了。',
            consequence: {
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative:
                '你向乡民们告辞，背上包袱继续赶路。身后有人喊道："恩人慢走！"你没回头，只是举了举手。天边的乌云越积越厚，风中带着潮湿的气息——也许真的要下雨了。你走出了村子，踏上官道，心中觉得轻了几分。做了该做的事，便问心无愧。',
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 黄昏田埂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
          ],
          dialogue: [],
        },
      },
    },
    weight: 4,
    cooldownTicks: 50,
    priority: 5,
    tags: ['seasonal', 'summer', 'crisis', 'drought'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 抢收之战 — Harvest Rush (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_harvest_rush',
    name: '抢收之战',
    description: '暴风雨即将来临，田里的庄稼必须在天黑前抢收完毕。全村人齐心协力与天公赛跑。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['farmland'],
      season: ['autumn'],
    },
    participants: [
      {
        role: '农人',
        requiredProfession: ['农夫', '佃农'],
        minCount: 1,
        maxCount: 2,
      },
    ],
    openingNarrative:
      '西边天际翻滚着铅灰色的乌云，闷雷声声由远及近。老农抬头看了看天色，脸色大变："不好！暴风雨要来了！地里那几十亩庄稼还没收完！"他扯着嗓子朝村里喊："快！都出来！抢收了！"一时间，男女老少纷纷从家里冲出来，镰刀、扁担、箩筐叮当乱响，一场与天公的赛跑就这样开始了。',
    openingVisual: {
      background: 'farmland',
      location: '汴京郊外 · 秋收田地',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'farmer', name: '老农', glyph: '农', position: 'center', mood: 'angry' },
      ],
      dialogue: [
        { speaker: '老农', text: '快！都出来抢收！暴风雨要来了！' },
      ],
    },
    entryPhase: 'harvest_1',
    phases: {
      // ── 第一幕：加入抢收 ──
      harvest_1: {
        phaseId: 'harvest_1',
        narrative:
          '田地里一片忙碌景象，弯腰挥镰的、扛麦捆的、推板车的，人人都在跟乌云赛跑。风越来越急，吹得麦穗沙沙作响，空气中弥漫着泥土和麦香混合的气味。一个中年农妇朝你招手："这位，搭把手吧！那边的麦子还没收呢！"',
        choices: [
          {
            id: 'join_harvest',
            text: '二话不说，抄起镰刀就下地干活。',
            consequence: {
              nextPhase: 'harvest_2',
              immediateEffects: { mood: 5, social: 3 },
            },
          },
          {
            id: 'organize_teams',
            text: '帮忙指挥调度，让抢收更有效率。',
            consequence: {
              nextPhase: 'harvest_2',
              immediateEffects: { social: 5 },
              relationChange: 5,
            },
          },
          {
            id: 'help_transport',
            text: '帮忙把收好的粮食运回村里，干力气活。',
            consequence: {
              nextPhase: 'harvest_2',
              immediateEffects: { mood: 3 },
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 麦田',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'farmer', name: '农妇', glyph: '妇', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '农妇', text: '这位，搭把手吧！那边的麦子还没收呢！' },
          ],
        },
      },

      // ── 第二幕：风雨将至 ──
      harvest_2: {
        phaseId: 'harvest_2',
        narrative:
          '闪电划破天际，紧接着一声炸雷在头顶炸开。豆大的雨点开始稀稀落落地砸下来，打在麦穗上、肩膀上、泥土里。所有人都加快了动作，镰刀割麦的声音变得更加急促。"快！再快点！"有人嘶声呐喊。雨越下越大，泥水溅得满身都是，但没一个人停下来。',
        choices: [
          {
            id: 'push_through',
            text: '咬牙坚持，雨再大也要把最后的麦子收完。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.65,
              },
              tieredResults: {
                critical_success: {
                  narrative: '你拼了命地挥舞镰刀，在暴雨彻底倾泻之前把最后一片麦子割倒了！人们欢呼着把麦捆扛上车，浑身湿透却满面笑容。',
                  effects: { mood: 15, social: 10 },
                },
                success: {
                  narrative: '虽然被淋成了落汤鸡，但大部分庄稼总算抢回来了。只有最远的那几亩地来不及收，被暴雨泡在了泥水里。',
                  effects: { mood: 5, social: 5 },
                },
                failure: {
                  narrative: '雨来得太快太猛，你还没割完一半，暴雨就铺天盖地浇了下来。泥泞的田地里寸步难行，只能眼睁睁看着麦子被雨水冲倒。',
                  effects: { mood: -8, social: 3 },
                },
              },
              nextPhase: 'harvest_3',
            },
          },
          {
            id: 'save_people',
            text: '发现有人在泥地里滑倒了，先去救人。',
            consequence: {
              nextPhase: 'harvest_3',
              immediateEffects: { social: 8, health: -5 },
              relationChange: 10,
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 暴雨中的麦田',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '众人', text: '快！再快点！' },
          ],
        },
      },

      // ── 第三幕：雨后余温 ──
      harvest_3: {
        phaseId: 'harvest_3',
        narrative:
          '暴雨来得快去得也快。天边露出一抹彩虹，雨后的田野散发着泥土和青草的清新气息。满身泥泞的人们聚集在村头的打谷场上，有人开始清点抢收回来的粮食。虽然不是全部，但保住了大半年的收成，这已经是最好的结果了。老农走过来，拍拍你泥乎乎的肩膀，咧嘴一笑。',
        choices: [
          {
            id: 'celebrate',
            text: '和众人一起庆祝，今晚就在村里吃顿便饭。',
            consequence: {
              immediateEffects: { mood: 12, social: 10 },
              nextPhase: null,
              endingNarrative:
                '村妇们支起大锅，煮了一锅热腾腾的新麦粥。众人围坐在打谷场上，就着咸菜和酱瓜，吃得满头大汗却无比满足。雨后的晚霞将天边染成绯红，几只燕子掠过头顶，叽叽喳喳地飞回屋檐下的巢穴。你端着碗，听着身边人的说笑声，觉得这个秋天虽然惊险，却格外温暖。',
              outcome: {
                narrative: '在暴风雨来临前帮全村抢收庄稼，保住了大半年收成。',
                effects: { mood: 12, social: 10 },
                memoryTag: '抢收之战',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'harvest_helper',
                    description: '在秋收暴风雨中帮助村民抢收庄稼，赢得了全村的信任',
                  },
                ],
              },
            },
          },
          {
            id: 'quiet_departure',
            text: '默默离开，不求回报。',
            consequence: {
              immediateEffects: { mood: 8, social: 5 },
              nextPhase: null,
              endingNarrative:
                '你趁着众人忙碌，悄悄离开了村子。身上的泥泞在路上慢慢被风吹干，夕阳把你的影子拉得老长。做了该做的事，不需要谁来感谢。你沿着田埂走向远方，身后传来村子里隐约的说笑声。晚风拂过金黄的麦茬地，带起一阵沙沙的低语。',
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '汴京郊外 · 雨后打谷场',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'happy' },
            { id: 'farmer', name: '老农', glyph: '农', position: 'left', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '老农', text: '多亏了你啊，后生！' },
          ],
        },
      },
    },
    weight: 4,
    cooldownTicks: 45,
    priority: 4,
    tags: ['seasonal', 'autumn', 'harvest', 'community'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. 冬至长夜 — Winter Solstice Night (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_winter_solstice',
    name: '冬至长夜',
    description: '一年中最长的夜晚，你在客栈中遇到一个神秘的旅人，他讲述了一个关于丢失的孩子的故事。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['teahouse', 'inn', 'courtyard'],
      season: ['winter'],
      timeOfDay: 'night',
    },
    participants: [
      {
        role: '神秘旅人',
        minCount: 1,
        maxCount: 1,
        requiredTraits: ['神秘', '沉默'],
      },
    ],
    openingNarrative:
      '冬至之夜，北风呼啸，大雪纷飞。你投宿在路边一间小客栈，大堂里生着一盆炭火，几个人围坐在火旁烤手取暖。门口忽然被人推开，一阵风雪卷进来，冻得众人直缩脖子。进来的是个裹着旧棉袍的中年人，肩上落满了雪，脸色苍白，眼神中带着一种说不出的疲惫和悲伤。他径直走到火盆旁坐下，沉默了许久，忽然开口了。',
    openingVisual: {
      background: 'teahouse',
      location: '荒郊 · 路边客栈',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'traveler', name: '旅人', glyph: '旅', position: 'center', mood: 'sad' },
      ],
      dialogue: [
        { speaker: '旅人', text: '诸位，可曾在这附近的路上……见过一个八岁的孩子？' },
      ],
    },
    entryPhase: 'solstice_1',
    phases: {
      // ── 第一幕：旅人的故事 ──
      solstice_1: {
        phaseId: 'solstice_1',
        narrative:
          '旅人的声音沙哑而低沉。他说他叫周生，是南边来的小商贩。三天前带着八岁的儿子赶路，在暴风雪中走散了。他已经沿着来路找了三天三夜，至今没有孩子的下落。说到这里，他的声音哽咽了。大堂里一片沉默，只有炭火噼啪作响和窗外呼啸的风声。',
        choices: [
          {
            id: 'offer_help',
            text: '表示明天一早就帮他去找孩子。',
            consequence: {
              nextPhase: 'solstice_2',
              immediateEffects: { social: 5 },
              relationChange: 8,
            },
          },
          {
            id: 'ask_details',
            text: '详细询问走散的地点和孩子的情况。',
            consequence: {
              nextPhase: 'solstice_2',
              immediateEffects: { social: 3 },
              relationChange: 5,
            },
          },
          {
            id: 'comfort_only',
            text: '安慰他几句，但自己明天还有事要赶路。',
            consequence: {
              nextPhase: null,
              endingNarrative:
                '你叹了口气，拍了拍周生的肩膀，说了一些安慰的话。他的眼神黯淡下去，点了点头，继续低头烤火。你回到自己的房间，躺在床上听着窗外的风雪声，久久不能入睡。一个八岁的孩子，在这种天气里……你翻了个身，强迫自己闭上眼睛。明天还有明天的路要走。',
              outcome: {
                narrative: '在冬至夜听了旅人寻找走失孩子的故事，未能施以援手。',
                effects: { mood: -5 },
                memoryTag: '冬至旅人的故事',
              },
            },
          },
        ],
        visual: {
          background: 'teahouse',
          location: '荒郊 · 客栈大堂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'traveler', name: '周生', glyph: '旅', position: 'center', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '周生', text: '三天了……我的孩子在风雪里走了三天了……' },
          ],
        },
      },

      // ── 第二幕：搜寻线索 ──
      solstice_2: {
        phaseId: 'solstice_2',
        narrative:
          '第二天清晨，风雪稍停。你和周生沿着他描述的路线开始搜寻。雪地上偶尔能看到一些痕迹——但风雪太大，很快就被覆盖了。走了大约两里地，你在一棵歪脖子老松树下发现了一个小小的脚印，旁边还有半块被啃过的冻馒头。',
        choices: [
          {
            id: 'follow_tracks',
            text: '顺着脚印的方向追踪下去。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.5,
              },
              tieredResults: {
                critical_success: {
                  narrative: '你沿着脚印翻过一道小山梁，在一处避风的岩洞里发现了蜷缩成一团的孩子——他还活着！虽然冻得嘴唇发紫，但看到父亲的那一刻，孩子哇地一声哭了出来。',
                  effects: { mood: 20, social: 15 },
                },
                success: {
                  narrative: '脚印在一处岔路口消失了。你四处搜寻，最终在百步之外的草丛里发现了一条孩子遗落的围巾。循着围巾的方向继续找，终于在不远处的一间废弃的猎人小屋里找到了孩子。',
                  effects: { mood: 15, social: 10 },
                },
                failure: {
                  narrative: '脚印很快消失在茫茫雪原中。你们找了整整一上午，始终没有孩子的下落。周生蹲在雪地里，双手抱头，无声地颤抖着。',
                  effects: { mood: -10 },
                },
              },
              nextPhase: 'solstice_3',
            },
          },
          {
            id: 'search_village',
            text: '去附近的村子打听，也许有人收留了孩子。',
            consequence: {
              nextPhase: 'solstice_3',
              immediateEffects: { social: 5 },
              relationChange: 5,
            },
          },
        ],
        visual: {
          background: 'farmland',
          location: '雪原 · 歪脖子松树旁',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'traveler', name: '周生', glyph: '旅', position: 'center', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '周生', text: '这是小宝的馒头……他一定就在附近！' },
          ],
        },
      },

      // ── 第三幕：长夜结局 ──
      solstice_3: {
        phaseId: 'solstice_3',
        narrative:
          '不管结果如何，冬至的白天总是短暂的。太阳刚露了个面就匆匆沉了下去，天色再次暗了下来。客栈的灯火在风雪中摇曳，像是在为旅人指引归途。周生握着你的手，眼眶通红，却说不出话来。',
        choices: [
          {
            id: 'found_child',
            text: '孩子找到了！这个冬至夜格外温暖。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '善良',
            },
            consequence: {
              immediateEffects: { mood: 20, social: 15 },
              nextPhase: null,
              endingNarrative:
                '那天晚上，客栈老板特意多加了一盆炭火。周生搂着孩子坐在火旁，小家伙已经吃了两碗热粥，正打着哈欠。你看着这一幕，心中涌起一股暖意。窗外北风依然呼啸，但客栈里暖意融融。周生忽然起身，走到你面前，深深一揖到底："大恩不言谢。日后若有用得着周某的地方，赴汤蹈火，在所不辞。"你扶起他，笑了笑。窗外的雪渐渐停了，一弯新月从云缝中探出头来。',
              outcome: {
                narrative: '在冬至日帮助旅人找到了走失的孩子，收获了真挚的友谊。',
                effects: { mood: 20, social: 15 },
                memoryTag: '冬至救助走失儿童',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'winter_solstice_hero',
                    description: '在冬至日帮助旅人周生找回了走失的孩子',
                  },
                ],
              },
            },
          },
          {
            id: 'not_found',
            text: '孩子还没找到，但周生不会放弃。',
            consequence: {
              immediateEffects: { mood: -5, social: 5 },
              nextPhase: null,
              endingNarrative:
                '那天晚上，周生独自坐在客栈大堂里，面前的酒碗一动未动。你给他倒了一碗热汤，他接过来，终于哭了出来——不是嚎啕大哭，而是无声的、克制的那种。你坐在他对面，不知道该说什么。窗外风雪渐渐小了，远处隐约传来更鼓声。这个冬至夜很长，但终会过去。天亮之后，他还要继续找。',
              outcome: {
                narrative: '帮助旅人搜寻走失的孩子，虽未找到但结下了情谊。',
                effects: { mood: -5, social: 5 },
                memoryTag: '冬至长夜',
              },
            },
          },
        ],
        visual: {
          background: 'teahouse',
          location: '荒郊 · 客栈大堂',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'traveler', name: '周生', glyph: '旅', position: 'center', mood: 'happy' },
          ],
          dialogue: [],
        },
      },
    },
    weight: 4,
    cooldownTicks: 50,
    priority: 5,
    tags: ['seasonal', 'winter', 'emotional', 'mystery'],
  },
];
