// === 玩家多步骤演出 — 自然/山野 (Player Nature) ===
//
// 漫野奇谭式分支叙事场景，宋代背景。
// 包含：山间采药、骤雨惊雷

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_NATURE_SCENES: PlayerScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 山间采药 — Mountain Herb Gathering (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_mountain_herbs',
    name: '山间采药',
    description: '为治病救人进山采药，在悬崖边发现了珍稀草药，但获取它需要冒险。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['药师', '郎中', '农夫'],
      location: ['mountain', 'forest'],
    },
    participants: [
      {
        role: '采药向导',
        requiredProfession: ['药师', '郎中', '农夫'],
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '清晨雾气未散，你跟着一位老药师踏上了进山的石阶小路。据他说，后山的悬崖壁上长着一株百年灵芝，治你的病非它不可。山路越走越窄，两旁的树木遮天蔽日，偶尔有松鼠从枝头蹿过，惊落几片黄叶。老药师在前头引路，脚步稳健得像一只山羊。',
    openingVisual: {
      background: 'mountain',
      location: '后山 · 石阶小路',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'herbalist', name: '老药师', glyph: '药', position: 'center', mood: 'neutral' },
      ],
      dialogue: [
        { speaker: '老药师', text: '跟上，翻过这道梁就到了。路不好走，小心脚下。' },
      ],
    },
    entryPhase: 'herb_1',
    phases: {
      // ── 第一幕：发现灵芝 ──
      herb_1: {
        phaseId: 'herb_1',
        narrative:
          '翻过山梁，眼前豁然开朗——一面陡峭的岩壁上，果然长着一株赤褐色的灵芝，油润的伞盖在晨光中泛着微微的光泽。但灵芝的位置极为刁钻：长在离地三丈高的岩缝中，脚下是万丈深渊，只有一条窄得只能容一只脚的石棱通向那里。老药师指着那株灵芝，回头看你："看见了吗？就在那儿。老朽这把骨头怕是上不去了，你的身手如何？"',
        choices: [
          {
            id: 'climb_up',
            text: '脱了外衣，沿着石棱攀上去采药。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.5,
              },
              tieredResults: {
                critical_success: {
                  narrative: '你手脚并用，如猿猴般灵活地攀上岩壁。石棱虽然狭窄，但你的脚步稳健。手指触到灵芝的那一刻，一股药香扑鼻而来。你小心翼翼地将它连根拔起，揣入怀中。回望脚下的深渊，心跳加速，但更多的是一种征服险境后的畅快。',
                  effects: { mood: 15, health: 10 },
                },
                success: {
                  narrative: '你颤颤巍巍地爬了上去，手指几次打滑差点跌落。好在最终够到了灵芝，虽然采的时候折断了一小块，但大部分完好。你慢慢退回安全地带，腿肚子还在转筋。',
                  effects: { mood: 8, health: 5 },
                },
                failure: {
                  narrative: '你刚爬到一半，脚下一滑——千钧一发之际抓住了岩缝中的一根藤蔓，悬在半空晃荡。老药师赶紧抛下绳子把你拉了上来。灵芝没采到，但至少保住了性命。你躺在地上喘了好一阵，心脏几乎要从嗓子眼里跳出来。',
                  effects: { mood: -10, health: -10 },
                },
              },
              nextPhase: 'herb_2',
            },
          },
          {
            id: 'use_rope',
            text: '用绳子系在腰间，让老药师在下面拉着你。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 20,
            },
            consequence: {
              nextPhase: 'herb_2',
              immediateEffects: { copper: -10 },
            },
          },
          {
            id: 'find_alternative',
            text: '悬崖太危险，在附近找找有没有其他药草可以替代。',
            consequence: {
              nextPhase: 'herb_2b',
              immediateEffects: { mood: -3 },
            },
          },
        ],
        visual: {
          background: 'mountain',
          location: '后山 · 悬崖岩壁',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'herbalist', name: '老药师', glyph: '药', position: 'center', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '老药师', text: '看见了吗？就在那儿。老朽上不去了，看你的了。' },
          ],
        },
      },

      // ── 第二幕：回程险路 ──
      herb_2: {
        phaseId: 'herb_2',
        narrative:
          '不管结果如何，回程的路比来时更加难走。雾气浓重起来，能见度急剧下降，脚下的石阶变得湿滑。老药师的脚步也不如之前稳健了，他拄着一根竹杖，不时停下来喘气。忽然，他脚下一滑，身子朝路边的陡坡倒去——',
        choices: [
          {
            id: 'catch_herbalist',
            text: '飞身去拉住老药师！',
            consequence: {
              resolution: {
                type: 'contested',
                contestedStat: { actor: 'health', target: 'health' },
              },
              tieredResults: {
                critical_success: {
                  narrative: '你一把拽住了老药师的衣袖，两个人跌坐在路中间，险之又险。老药师喘了好一阵才缓过来，看着脚下的万丈深渊，脸色惨白。"后生……多亏你了。"他声音发颤，握着你的手久久不放。',
                  effects: { social: 15, health: -5 },
                },
                success: {
                  narrative: '你伸手去拉，但惯性太大，两个人一起滑出去几步，好在被路边一棵倒下的枯树挡住了。惊魂未定，但至少性命无忧。',
                  effects: { social: 8, health: -8 },
                },
                failure: {
                  narrative: '你伸手去拉，但已经来不及了。老药师跌下了陡坡，好在那一段坡度不算太陡，他被灌木丛挂住了。你费了好大力气才把他拉上来，两个人都受了些擦伤。',
                  effects: { social: 10, health: -12 },
                },
              },
              nextPhase: 'herb_3',
            },
          },
          {
            id: 'steady_yourself',
            text: '先稳住自己的重心，再想办法救人。',
            consequence: {
              nextPhase: 'herb_3',
              immediateEffects: { social: 5, health: -3 },
              relationChange: 8,
            },
          },
        ],
        visual: {
          background: 'mountain',
          location: '后山 · 浓雾石阶',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'herbalist', name: '老药师', glyph: '药', position: 'center', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '老药师', text: '小心——！' },
          ],
        },
      },

      // ── 第二幕B（替代）：寻找替代药草 ──
      herb_2b: {
        phaseId: 'herb_2b',
        narrative:
          '你放弃了攀崖，在附近的林子里仔细搜索。虽然没有百年灵芝，但你在枯木下发现了几丛品质不错的野山参，还找到了一些黄精和当归。老药师看了看你采的药草，捋着胡子微微点头："虽然没有灵芝那么药效猛烈，但胜在数量多，配伍得当的话，疗效也不差。"',
        choices: [
          {
            id: 'accept_alternative',
            text: '聊胜于无，把这些药草带回去。',
            consequence: {
              nextPhase: 'herb_3',
              immediateEffects: { mood: 5, health: 3 },
            },
          },
          {
            id: 'search_more',
            text: '再找找，也许附近还有更好的药草。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.4,
              },
              tieredResults: {
                critical_success: {
                  narrative: '功夫不负有心人！在一处溪谷旁，你发现了一株品相极佳的天麻。老药师激动得胡子直抖："好好好！这天麻比灵芝也不遑多让！后生好眼力！"',
                  effects: { mood: 12, health: 8 },
                },
                success: {
                  narrative: '你又找到一些金银花和川芎，虽然算不上珍稀，但都是实用的药材。加在一起，也够用了。',
                  effects: { mood: 5, health: 3 },
                },
                failure: {
                  narrative: '你在林子里转了一大圈，除了满腿的虫咬和划伤，什么也没找到。天色渐暗，老药师催促你赶紧下山。',
                  effects: { mood: -5, health: -3 },
                },
              },
              nextPhase: 'herb_3',
            },
          },
        ],
        visual: {
          background: 'mountain',
          location: '后山 · 密林',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'herbalist', name: '老药师', glyph: '药', position: 'left', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '老药师', text: '虽然没有灵芝，但这些也不差。配伍得当，疗效不逊。' },
          ],
        },
      },

      // ── 第三幕：下山 ──
      herb_3: {
        phaseId: 'herb_3',
        narrative:
          '暮色四合，你终于走出了山林。远处的村舍亮起了星星点点的灯火，炊烟袅袅升起。这一趟进山，虽然险象环生，但收获也不小。老药师在山脚下停下来，回头望了望笼罩在暮色中的山峦，转头对你说："山里的东西，得来都不容易。但正因如此，才格外珍贵。"',
        choices: [
          {
            id: 'grateful_return',
            text: '感谢老药师的指引，带着药材踏上归途。',
            consequence: {
              immediateEffects: { mood: 10, social: 5 },
              nextPhase: null,
              endingNarrative:
                '你向老药师道别，背着满满一兜药草朝山下走去。夜风送来草木的清香，肩膀上虽然酸痛，心里却很踏实。这一天的经历让你明白了一个道理：有些东西，不用冒险去摘也能得到；但那些需要冒险才能得到的东西，往往最值得。你摸了摸怀里的药草，加快了脚步。',
              outcome: {
                narrative: '在山中采药，经历了险境，收获了珍贵的药材和人生感悟。',
                effects: { mood: 10, social: 5 },
                memoryTag: '山间采药',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'mountain_herbalist',
                    description: '曾深入后山悬崖采药，对山中药草有了初步认识',
                  },
                ],
              },
            },
          },
          {
            id: 'learn_more',
            text: '向老药师请教更多药草知识。',
            consequence: {
              immediateEffects: { social: 8 },
              nextPhase: null,
              endingNarrative:
                '你在山脚下多待了一会儿，听老药师讲述各种药草的特性和辨别方法。月色下，老人枯瘦的手指在地上比划着，像是在描绘一幅无形的地图。你认真地听着，把每一条都记在心里。临别时，老药师从怀中掏出一本薄薄的手抄册子递给你："这是老朽几十年的心得，送给你吧。也许有一天，这些东西能救你的命。"',
              outcome: {
                narrative: '在山中采药并向老药师学习，获得了珍贵的药草知识。',
                effects: { social: 8 },
                memoryTag: '学习药草知识',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'mountain_herbalist',
                    description: '曾深入后山采药并跟随老药师学习药草知识',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'mountain',
          location: '后山 · 山脚下',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'happy' },
            { id: 'herbalist', name: '老药师', glyph: '药', position: 'center', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '老药师', text: '山里的东西，得来都不容易。正因如此，才格外珍贵。' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 35,
    priority: 4,
    tags: ['nature', 'mountain', 'herb', 'adventure'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 骤雨惊雷 — Sudden Storm (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_sudden_storm',
    name: '骤雨惊雷',
    description: '晴空万里忽然雷云密布，一道闪电劈中了路边的大树，引发了一场意想不到的遭遇。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['center_street', 'farmland', 'river'],
      weather: ['storm', 'rain'],
    },
    participants: [
      {
        role: '路人',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '方才还是晴空万里，转眼间乌云从天边压了过来，黑压压的仿佛要将整个天空吞噬。风骤然加大，卷起沙尘和落叶，街上的行人纷纷抱头鼠窜。一道惨白的闪电撕裂天幕，紧接着一声炸雷在头顶炸响——"轰！"路边那棵百年老槐树被劈中了！烈焰腾空而起，树干从中裂开，火星四溅。',
    openingVisual: {
      background: 'alley',
      location: '汴京 · 街边',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'bystander', name: '路人', glyph: '路', position: 'center', mood: 'sad' },
      ],
      dialogue: [],
    },
    entryPhase: 'storm_1',
    phases: {
      // ── 第一幕：雷劈之后 ──
      storm_1: {
        phaseId: 'storm_1',
        narrative:
          '老槐树燃烧着倒向街面，火星在暴风中四散飞舞。周围一片混乱——有人尖叫，有人往屋里跑，还有几个孩子吓得哇哇大哭。你忽然看到倒下的树干下似乎压着什么东西——不对，是压着什么人！一只手臂从树干下伸出来，还在无力地挥动。',
        choices: [
          {
            id: 'rescue_person',
            text: '冲上去救人！和身边的人合力抬起树干。',
            consequence: {
              nextPhase: 'storm_2',
              immediateEffects: { social: 8, health: -5 },
              relationChange: 10,
            },
          },
          {
            id: 'call_for_help',
            text: '大声呼救，召集更多人一起来抬树。',
            consequence: {
              nextPhase: 'storm_2',
              immediateEffects: { social: 5 },
              relationChange: 5,
            },
          },
          {
            id: 'put_out_fire',
            text: '先灭火！火势蔓延会伤及更多人。',
            consequence: {
              nextPhase: 'storm_2',
              immediateEffects: { social: 3 },
            },
          },
        ],
        visual: {
          background: 'alley',
          location: '汴京 · 燃烧的老槐树旁',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'trapped', name: '被压者', glyph: '？', position: 'center', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '被压者', text: '救命……救救我……' },
          ],
        },
      },

      // ── 第二幕：暴雨中的抉择 ──
      storm_2: {
        phaseId: 'storm_2',
        narrative:
          '暴雨倾盆而下，浇在燃烧的树干上发出嗤嗤的声响。被压的人总算被救出来了——是个走街串巷的货郎，左腿被砸伤了，疼得直抽冷气。但更大的麻烦来了：暴雨导致街边的排水沟溢出，浑浊的水流迅速漫上了路面，朝着地势低洼的几户人家灌去。',
        choices: [
          {
            id: 'help_flood',
            text: '去帮低洼处的人家转移物资，防水入屋。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.55,
              },
              tieredResults: {
                critical_success: {
                  narrative: '你和几个邻居一起，赶在水漫进屋之前用沙袋和木板堵住了门缝。虽然水最终还是渗了一些进来，但屋里的大件家当都保住了。邻居们连连道谢，感动得不知说什么好。',
                  effects: { social: 15, mood: 10 },
                },
                success: {
                  narrative: '你帮忙搬走了几户人家的重要物件，虽然来不及全部转移，但最值钱的东西保住了。浑身湿透的你累得直喘气，但心里很踏实。',
                  effects: { social: 8, mood: 5 },
                },
                failure: {
                  narrative: '水来得太猛太快，你还没来得及反应，洪水就已经灌进了低洼处的几间屋子。你和邻居们手忙脚乱地转移人，但家当损失了不少。',
                  effects: { social: 3, mood: -5 },
                },
              },
              nextPhase: 'storm_3',
            },
          },
          {
            id: 'help_injured',
            text: '先照顾受伤的货郎，帮他处理伤口。',
            consequence: {
              nextPhase: 'storm_3',
              immediateEffects: { social: 8 },
              relationChange: 10,
            },
          },
        ],
        visual: {
          background: 'alley',
          location: '汴京 · 暴雨中的街面',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'peddler', name: '货郎', glyph: '货', position: 'center', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '货郎', text: '多谢恩公……我的腿……怕是断了……' },
          ],
        },
      },

      // ── 第三幕：雨过天晴 ──
      storm_3: {
        phaseId: 'storm_3',
        narrative:
          '暴雨来得急去得也快。云层裂开一道缝，一束金色的阳光斜斜地照射下来，照在被雨水冲刷得干干净净的石板路上。街坊们纷纷走出家门，清点损失，整理残局。被劈中的老槐树只剩下一截焦黑的树桩，冒着缕缕青烟。空气清新得像被洗过一样。',
        choices: [
          {
            id: 'help_cleanup',
            text: '留下来帮街坊们一起清理街道。',
            consequence: {
              immediateEffects: { social: 10, mood: 8 },
              nextPhase: null,
              endingNarrative:
                '你和大家一起搬开倒塌的树枝，清扫积水，疏通排水沟。忙完之后，有人端来了一壶热茶，众人就地坐在台阶上歇脚。有人感慨道："天灾无常，好在人心还在。"你端起茶碗喝了一口，茶是粗茶，但此刻喝来格外甘甜。阳光穿过残云，在湿漉漉的街面上投下斑驳的光影。',
              outcome: {
                narrative: '在骤雨惊雷中救助伤者、帮助邻里，展现了善良与勇气。',
                effects: { social: 10, mood: 8 },
                memoryTag: '骤雨中救助邻里',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'storm_rescuer',
                    description: '在雷暴中救出了被压的货郎，并帮助街坊抵御洪水',
                  },
                ],
              },
            },
          },
          {
            id: 'reflect_depart',
            text: '确认没人需要更多帮助后，悄然离开。',
            consequence: {
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative:
                '你看了看四周——伤者已被安置，积水正在退去，街坊们三三两两地开始收拾。不需要你了。你抖了抖身上的水，沿着湿漉漉的街道慢慢走远。身后传来孩子们的笑声——他们已经在水洼里踩水玩了。你微微一笑，抬头望向天边那道若有若无的彩虹。风雨过后，总是会有彩虹的。',
            },
          },
        ],
        visual: {
          background: 'market',
          location: '汴京 · 雨后街面',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'happy' },
          ],
          dialogue: [],
        },
      },
    },
    weight: 3,
    cooldownTicks: 30,
    priority: 4,
    tags: ['nature', 'storm', 'rescue', 'community'],
  },
];
