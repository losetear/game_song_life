// === 玩家多步骤演出 — 秘密/阴谋 (Player Secrets) ===
//
// 漫野奇谭式分支叙事场景，宋代背景。
// 包含：隔墙有耳、暗道迷踪、神秘来客

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_SECRETS_SCENES: PlayerScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 隔墙有耳 — Overheard Secret (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_overhear_secret',
    name: '隔墙有耳',
    description: '深夜在暗巷中无意听到一场密谈，由此卷入一个危险的秘密。是揭发、利用还是装作不知？',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: false,
      location: ['alley', 'night_street', 'south_street'],
      timeOfDay: 'night',
      minNearbyNpcs: 1,
    },
    participants: [
      {
        role: '密谈者',
        minCount: 1,
        maxCount: 2,
      },
    ],
    openingNarrative:
      '夜深了，你抄近路穿过一条僻静的小巷。月光被两侧高耸的土墙遮得严严实实，巷中漆黑一片，只有远处巷口透进一线微弱的灯光。你正低头赶路，忽然听到前方拐角处传来压低了的说话声。你本能地放轻了脚步——那不是寻常的寒暄，语调急促而隐秘，像是怕被旁人听见。',
    openingVisual: {
      background: 'night_street',
      location: '汴京 · 暗巷',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
      ],
      dialogue: [],
    },
    entryPhase: 'overhear_1',
    phases: {
      // ── 第一幕：听到密谈 ──
      overhear_1: {
        phaseId: 'overhear_1',
        narrative:
          '你贴着墙根悄悄靠近，终于听清了只言片语——"……三日后，运粮船从东水门入城，换防的甲士里有我们的人，到时候城门一开……""嘘！有人！"其中一人忽然警觉起来，朝你的方向望了一眼。你屏住呼吸，一动不动地贴在墙角。月光下，你看见了两个人的轮廓——一个身材魁梧，一个瘦小精干。他们的对话涉及一桩事关城中粮食调配的阴谋，似乎是有人要在运粮船入城时做手脚。',
        choices: [
          {
            id: 'pretend_deaf',
            text: '假装什么都没听到，脚步不停，径直走过去。',
            consequence: {
              nextPhase: 'overhear_2',
              immediateEffects: { mood: -5 },
            },
          },
          {
            id: 'listen_closer',
            text: '屏息凝神，继续偷听，尽可能多记住一些细节。',
            consequence: {
              nextPhase: 'overhear_2',
              immediateEffects: { mood: 3 },
            },
          },
          {
            id: 'announce_presence',
            text: '故意弄出声响，或开口说话，让对方知道有人在场。',
            consequence: {
              nextPhase: 'overhear_2',
              immediateEffects: { health: -5 },
            },
          },
        ],
        visual: {
          background: 'alley',
          location: '汴京 · 暗巷拐角',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'conspirator_a', name: '魁梧黑影', glyph: '影', position: 'right', mood: 'neutral' },
            { id: 'conspirator_b', name: '瘦小黑影', glyph: '影', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '魁梧黑影', text: '……三日后，运粮船从东水门入城……' },
            { speaker: '瘦小黑影', text: '嘘！有人！' },
          ],
        },
      },

      // ── 第二幕：秘密的代价 ──
      overhear_2: {
        phaseId: 'overhear_2',
        narrative:
          '密谈者最终没有发现你——或者说，他们选择了暂不打草惊蛇。两人压低声音又交谈了几句，便分头消失在了夜色之中。你站在原地，心跳得厉害。方才听到的那些话在你脑海中反复回荡——运粮船、东水门、换防甲士、内应……这些零碎的信息拼凑在一起，指向一桩蓄谋已久的阴谋。你不知道背后是谁在主使，但有一点很清楚：如果这事是真的，一旦得逞，整个汴京的粮价都要翻天。',
        choices: [
          {
            id: 'keep_secret',
            text: '将秘密藏在心中，回去好好睡一觉，当什么都没发生。',
            consequence: {
              immediateEffects: { mood: -8 },
              nextPhase: null,
              endingNarrative:
                '你摇了摇头，快步走回住处。躺在床上翻来覆去睡不着，耳边总回响着那两个人的对话。你知道自己本可以做什么——但你也知道，一旦卷进去，就再也脱不了身了。窗外的月光冷冷地照在地上，你翻了个身，把脸埋进枕头里。也许装糊涂才是最聪明的做法。可那种不安的感觉，像一根刺扎在心里，怎么也拔不出来。',
              outcome: {
                narrative: '听到了危险的密谈，选择装作不知，但内心不安。',
                effects: { mood: -8 },
                memoryTag: '暗巷偷听密谈后装作不知',
              },
            },
          },
          {
            id: 'report_authorities',
            text: '将此事报告给巡检或衙门，尽一个良民的本分。',
            condition: {
              field: 'honor',
              operator: 'gte',
              value: 50,
            },
            consequence: {
              nextPhase: 'overhear_3',
              immediateEffects: { mood: 5, social: 8 },
              relationChange: 5,
            },
          },
          {
            id: 'blackmail_plan',
            text: '暗中记住细节，打算找到幕后之人，以此要挟捞一笔。',
            condition: {
              field: 'greed',
              operator: 'gte',
              value: 60,
            },
            consequence: {
              nextPhase: 'overhear_3',
              immediateEffects: { mood: -3 },
            },
          },
          {
            id: 'investigate',
            text: '不急着声张，先自己暗中调查，弄清楚背后的来龙去脉。',
            consequence: {
              nextPhase: 'overhear_3',
              immediateEffects: { mood: 3 },
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 暗巷',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
          ],
          dialogue: [],
        },
      },

      // ── 第三幕：抉择与后果 ──
      overhear_3: {
        phaseId: 'overhear_3',
        narrative:
          '你做出了决定。无论前路如何，你都无法假装什么都没听到。那些话就像一颗种子，已经在你心里生了根。月光从巷口洒进来，在地上铺出一条银白色的路。你深吸一口气，迈步走出了暗巷——你知道，从这一刻起，你已经被卷入了一场远比想象中更大的漩涡。',
        choices: [
          {
            id: 'report_to_guard',
            text: '连夜赶到巡检铺报案，将听到的和盘托出。',
            consequence: {
              immediateEffects: { mood: 10, social: 12, health: -3 },
              relationChange: 10,
              nextPhase: null,
              endingNarrative:
                '巡检铺的值夜差役听完你的叙述，脸色大变，立刻派人去禀报上级。你被留下来做了笔录，一直到天蒙蒙亮才放你走。临走时，差役叫住你："这事你做得对。不过——"他压低声音，"往后几日小心些，别一个人走夜路。"你点了点头，走出巡检铺，清晨的第一缕阳光照在脸上。你打了个寒噤，不知是因为冷，还是因为那句"小心些"。',
              outcome: {
                narrative: '将暗巷密谈报告官府，阻止了潜在的阴谋。',
                effects: { mood: 10, social: 12, health: -3 },
                relationChange: 10,
                memoryTag: '举报运粮船阴谋',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'knows_secret',
                    description: '在暗巷中偷听到了关于运粮船阴谋的秘密',
                  },
                ],
              },
            },
          },
          {
            id: 'seek_blackmail',
            text: '暗中联络密谈者，以手中情报为筹码索要封口费。',
            consequence: {
              immediateEffects: { copper: 30, mood: -10, social: -15 },
              relationChange: -20,
              nextPhase: null,
              endingNarrative:
                '你花了好几天才找到了那两个人的线索。见面时，对方的眼中闪过一丝杀意，但很快被精明的算计取代。一袋铜钱推到了你面前："拿着，然后忘了这一切。"你接过钱袋，掂了掂分量——足有五十文。你走了出来，钱袋在怀中沉甸甸的，像一块烧红的铁。你知道自己走上了一条不归路——拿了这钱，你和他们就是一条船上的人了。日后他们若出事，你也跑不掉。',
              outcome: {
                narrative: '以秘密为筹码索要封口费，走上了勒索之路。',
                effects: { copper: 30, mood: -10, social: -15 },
                relationChange: -20,
                memoryTag: '以秘密勒索钱财',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'blackmailer',
                    description: '以偷听到的秘密为筹码勒索钱财，背上了勒索者的标签',
                  },
                ],
              },
            },
          },
          {
            id: 'self_investigate',
            text: '开始暗中调查，去东水门附近打探运粮船的消息。',
            consequence: {
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative:
                '接下来的几天里，你装作若无其事的样子在东水门附近转悠。你留意到城墙上确实有几处守备松懈的时段，也注意到一些面生的甲士最近频繁出入兵营。你把这些信息默默记在心里，等待着一个更合适的时机——也许你会找到真相，也许你会找到一个更好的筹码。无论如何，这盘棋才刚开始。',
              outcome: {
                narrative: '暗中调查运粮船阴谋，掌握了更多线索。',
                effects: { mood: 5 },
                memoryTag: '暗中调查运粮船阴谋',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'knows_secret',
                    description: '在暗巷中偷听到阴谋后选择暗中调查，掌握了更多线索',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 巷口月下',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
          ],
          dialogue: [],
        },
      },
    },
    weight: 3,
    cooldownTicks: 35,
    priority: 5,
    tags: ['secrets', 'conspiracy', 'night', 'choice_morality'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 暗道迷踪 — Hidden Passage (4幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_hidden_passage',
    name: '暗道迷踪',
    description: '偶然发现一条隐藏的暗道，里面可能藏着宝藏，也可能暗藏杀机。探索还是封存？',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetTraits: ['狡猾'],
      location: ['residential', 'residential_north', 'residential_south', 'east_market', 'west_market', 'courtyard'],
    },
    participants: [
      {
        role: '同行者',
        requiredTraits: ['狡猾'],
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '你在城中闲逛时，无意间发现了一处异样——一面看似普通的土墙上，砖石的缝隙有些不太对劲，像是被人动过手脚。你试着推了推，那块砖竟然松动了。再用力一推，整面墙壁无声地向内旋转，露出一条幽深的通道。一股阴冷的气流从通道里涌出来，夹带着泥土和铁锈的气味。身旁的同伴凑过来一看，眼睛立刻亮了起来。',
    openingVisual: {
      background: 'alley',
      location: '汴京 · 城中某处',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'companion', name: '同行者', glyph: '伴', position: 'right', mood: 'neutral' },
      ],
      dialogue: [
        { speaker: '同行者', text: '这是什么地方……' },
      ],
    },
    entryPhase: 'passage_1',
    phases: {
      // ── 第一幕：发现暗门 ──
      passage_1: {
        phaseId: 'passage_1',
        narrative:
          '暗道的入口处石阶向下延伸，消失在黑暗之中。壁上有几盏干涸的油灯座，积了厚厚的灰尘——看样子这条暗道已经很久没人走过了。同伴蹲下身仔细查看了地面的灰尘，低声说道："有人来过，但至少是几年前的事了。"他的目光闪烁，嘴角微微上扬。风从通道深处吹来，带着一股说不清的腥甜气味。',
        choices: [
          {
            id: 'enter_passage',
            text: '点燃火折子，进去看看！',
            consequence: {
              nextPhase: 'passage_2',
            },
          },
          {
            id: 'mark_for_later',
            text: '先不动它，记住位置，改日带齐装备再来。',
            consequence: {
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative:
                '你将砖石复位，仔细记住了周围的参照物——一棵歪脖子槐树、一个石碾子、墙根下的一丛狗尾草。同伴有些失望，但也同意你的谨慎。两人约定日后再来探索，分头离开了。走出一截路后你回头看了一眼——那面墙和周围没有任何分别，如果不是亲眼所见，绝不会想到那里藏着一条密道。你在心里默默盘算着，下次来要准备些什么。',
            },
          },
          {
            id: 'ask_companion',
            text: '"你知道这是什么地方吗？"向同伴打听。',
            consequence: {
              nextPhase: 'passage_2',
              immediateEffects: { mood: 2 },
              relationChange: 3,
            },
          },
          {
            id: 'seal_it',
            text: '这地方邪门得很，把砖石推回去封死入口。',
            consequence: {
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative:
                '你用力将砖石推回原位，又搬了几块碎石堵在缝隙上。同伴一脸惋惜，但也没有反对。两人离开了那条巷子，谁也没再提起这件事。只是偶尔在深夜辗转难眠时，你会想起那股从地底涌上来的阴冷气流，以及同伴眼底那一闪而过的贪婪。',
            },
          },
        ],
        visual: {
          background: 'alley',
          location: '汴京 · 暗道入口',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'companion', name: '同行者', glyph: '伴', position: 'right', mood: 'happy' },
          ],
          dialogue: [
            { speaker: '同行者', text: '有人来过，但至少是几年前的事了。' },
          ],
        },
      },

      // ── 第二幕：通道内 — 概率判定 ──
      passage_2: {
        phaseId: 'passage_2',
        narrative:
          '你举着火折子走进暗道。石壁上的苔藓在火光中泛着幽绿的光，脚下的石板凹凸不平。通道比想象中更长，七拐八弯，走了大约百步之后，前方出现了一个开阔的空间。借着微弱的火光，你看见地面上散落着一些东西——有腐烂的木箱、生锈的铁链，还有一些看不清形状的物件。空气中弥漫着一股陈旧的霉味。同伴在身后紧张地握住了你的袖子。',
        choices: [
          {
            id: 'search_carefully',
            text: '小心地翻看散落的物件，寻找有价值的东西。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.5,
              },
              tieredResults: {
                critical_success: {
                  narrative:
                    '你在一堆朽烂的木箱中找到了一个密封的铁匣子。撬开一看，里面竟是一叠泛黄的银票和几件精巧的金饰！这些财物少说值几百文铜钱。同伴倒吸一口凉气，目光灼灼地看着铁匣子。你也注意到匣底刻着一个你从未见过的徽记——这不是寻常人家的东西。',
                  effects: { copper: 80, mood: 15 },
                },
                success: {
                  narrative:
                    '你翻找了一番，找到了几枚古钱和一把铜镜。铜镜的背面刻着精致的花纹，虽然有些锈蚀，但擦拭后依然光可鉴人。这些虽算不上什么宝贝，但也能值个几十文。同伴在一旁找到了一卷竹简，上面写满了你看不懂的文字。',
                  effects: { copper: 30, mood: 8 },
                },
                partial_success: {
                  narrative:
                    '你在角落里找到了一个布包，打开一看是几块形状古怪的石头和一截断了的玉簪。值不了几个钱，但那玉簪的做工十分精细，断口处隐约可见暗红色的沁色。同伴在另一头喊你——他发现了一面刻有文字的石壁。',
                  effects: { copper: 10, mood: 3 },
                },
                failure: {
                  narrative:
                    '你刚迈出一步，脚下忽然一空——是一个陷阱！你整个人往下坠了半丈，亏得同伴眼疾手快一把拉住了你的衣领。你悬在半空，看见下方密密麻麻地竖着削尖的竹签。火折子掉进了坑里，光线一暗，你只觉得浑身发凉。同伴费了好大力气才把你拉上来。你的小腿被竹签擦了一下，渗出了血。',
                  effects: { health: -15, mood: -10 },
                },
              },
              nextPhase: 'passage_3',
            },
          },
          {
            id: 'quick_look',
            text: '草草看一眼就走，不在暗处久留。',
            consequence: {
              immediateEffects: { mood: 2 },
              nextPhase: 'passage_3',
            },
          },
        ],
        visual: {
          background: 'dungeon',
          location: '汴京 · 地下暗室',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'center', mood: 'neutral' },
            { id: 'companion', name: '同行者', glyph: '伴', position: 'right', mood: 'neutral' },
          ],
          dialogue: [],
        },
      },

      // ── 第三幕：暗道深处的发现 ──
      passage_3: {
        phaseId: 'passage_3',
        narrative:
          '不论方才的发现是好是坏，你都注意到了暗室尽头还有一条更窄的甬道。甬道的墙壁上刻着一些模糊的文字，似乎记载着什么。火折子的光越来越暗，你知道时间不多了。同伴在一旁催促你快走，但他的目光却一直盯着甬道的方向，明显也按捺不住好奇心。',
        choices: [
          {
            id: 'go_deeper',
            text: '趁着火折子还没灭，进甬道看看尽头是什么。',
            consequence: {
              nextPhase: 'passage_4',
              immediateEffects: { health: -3 },
            },
          },
          {
            id: 'retreat_now',
            text: '见好就收，原路返回，下次再来。',
            consequence: {
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative:
                '你拉着同伴原路返回，走出了暗道。阳光刺得你眯起了眼，新鲜的空气灌入肺中，那种被困在地底的压抑感一扫而空。你和同伴对视了一眼，都不约而同地松了口气。"那条甬道……"同伴欲言又止。"下次再来。"你拍了拍他的肩膀。暗道的入口被你重新封好，但你知道，这个秘密已经刻在了你心里。',
              outcome: {
                narrative: '探索暗道后安全撤退，决定日后再做深入调查。',
                effects: { mood: 5 },
                memoryTag: '发现暗道并初步探索',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'explorer',
                    description: '发现并初步探索了一条隐藏的暗道',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'dungeon',
          location: '汴京 · 暗道甬道入口',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'companion', name: '同行者', glyph: '伴', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '同行者', text: '快走吧，火要灭了……' },
          ],
        },
      },

      // ── 第四幕：暗道的尽头 ──
      passage_4: {
        phaseId: 'passage_4',
        narrative:
          '甬道的尽头是一扇锈迹斑斑的铁门。你用力一推，门轴发出刺耳的嘎吱声，缓缓开启。门后是一间比先前更大的密室——但让你和同伴同时倒吸一口凉气的是，密室的正中央摆着一座小小的祭坛，祭坛上供奉着一尊面目狰狞的铜像。铜像四周的地面用暗红色的颜料画着复杂的阵纹，空气中弥漫着一股甜腻的熏香味。这不是普通的藏宝密室——这里曾有人进行过某种不可告人的仪式。',
        choices: [
          {
            id: 'take_statue',
            text: '把那尊铜像拿走——它看起来值不少钱。',
            condition: {
              field: 'greed',
              operator: 'gte',
              value: 40,
            },
            consequence: {
              immediateEffects: { copper: 50, mood: -10 },
              relationChange: -5,
              nextPhase: null,
              endingNarrative:
                '你伸手将铜像从祭坛上拿了下来。入手的一瞬间，你感到一阵诡异的寒意从指尖窜上手臂，像是有什么东西附在了铜像上。同伴吓得退了两步，连声说"快走快走"。你抱着铜像快步退出暗道，回到地面时天色已近黄昏。你低头看了看手中的铜像——那面目狰狞的五官在夕阳下似乎在对你微笑。你打了个寒噤，但铜像已经被你拿出来了，再放回去也来不及了。当天夜里，你做了一个非常可怕的梦。',
              outcome: {
                narrative: '从暗道密室中取走了祭坛上的铜像，似乎触怒了某种不可知的力量。',
                effects: { copper: 50, mood: -10 },
                memoryTag: '暗道中取走祭祀铜像',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'cursed',
                    description: '从暗道密室的祭坛上取走了铜像，似乎沾染了某种诅咒',
                  },
                ],
              },
            },
          },
          {
            id: 'leave_respectfully',
            text: '不碰祭坛上的任何东西，恭敬地退出密室，将铁门关好。',
            consequence: {
              immediateEffects: { mood: 8, social: 5 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative:
                '你退后一步，对着那座祭坛拱了拱手——不管供的是什么，宁可信其有。你仔细地关好铁门，带着同伴沿原路返回。走出暗道后，你深深地吸了一口气，感觉像是重新活了一遍。同伴擦了擦额头的冷汗："那个地方……以后别去了。"你点了点头，和同伴约定此事绝不外传。夕阳的余晖洒在你们身上，影子拉得很长很长。那条暗道和它深处的秘密，就此被你们封存在了记忆的深处。',
              outcome: {
                narrative: '发现暗道深处的神秘祭坛后选择尊重并离开。',
                effects: { mood: 8, social: 5 },
                relationChange: 5,
                memoryTag: '发现暗道祭坛后封存秘密',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'explorer',
                    description: '探索了暗道深处的秘密，但选择了尊重未知并安全撤离',
                  },
                ],
              },
            },
          },
          {
            id: 'copy_symbols',
            text: '用炭笔将地上的阵纹和墙壁上的文字拓印下来，日后研究。',
            consequence: {
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative:
                '你蹲下身，借着最后一丝火光，用随身携带的炭笔将地上的阵纹和墙壁上的文字一一拓印在纸上。同伴在一旁紧张地把风。拓印完成后，你仔细地将铁门关好，带着同伴退出了暗道。回到住处后，你在灯下展开那张拓印纸——那些符号和文字你大多看不懂，但其中几个字的写法非常古老，像是数百年前的笔迹。你知道，这张纸上记录的东西，或许比任何金银财宝都更有价值。',
              outcome: {
                narrative: '将暗道密室中的阵纹和文字拓印下来，留待日后研究。',
                effects: { mood: 5 },
                memoryTag: '暗道祭坛拓印神秘阵纹',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'explorer',
                    description: '探索了暗道密室并将神秘阵纹拓印下来，为日后的发现埋下伏笔',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'dungeon',
          location: '汴京 · 暗道密室',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'companion', name: '同行者', glyph: '伴', position: 'right', mood: 'sad' },
          ],
          dialogue: [
            { speaker: '同行者', text: '这是什么地方……好邪门……' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 50,
    priority: 5,
    tags: ['secrets', 'exploration', 'mystery', 'danger'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 神秘来客 — Mysterious Stranger (3幕)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_mysterious_stranger',
    name: '神秘来客',
    description: '深夜在街市中遇到一个斗笠遮面的神秘人，对方带来一个令人难以拒绝的交易提议。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['center_street', 'east_market', 'west_market', 'night_street'],
      timeOfDay: 'night',
    },
    participants: [
      {
        role: '神秘来客',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '夜市的喧嚣渐渐散去，摊贩们开始收拾家什准备打烊。你独自走在空旷下来的街面上，月光将石板路照得发白。忽然，你注意到前方路灯的阴影下站着一个人——那人身披一件灰黑色的斗篷，斗笠压得很低，看不清面容。你从他身旁走过时，他忽然开口了，声音低沉而平静，像是早就知道你会经过："这位客官，可否借一步说话？"',
    openingVisual: {
      background: 'night_street',
      location: '汴京 · 夜间街市',
      characters: [
        { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
        { id: 'stranger', name: '斗笠人', glyph: '秘', position: 'right', mood: 'neutral' },
      ],
      dialogue: [
        { speaker: '斗笠人', text: '这位客官，可否借一步说话？' },
      ],
    },
    entryPhase: 'stranger_1',
    phases: {
      // ── 第一幕：神秘人的邀请 ──
      stranger_1: {
        phaseId: 'stranger_1',
        narrative:
          '斗笠人从阴影中走出半步，月光勾勒出他修长的轮廓。他的手一直拢在斗篷里，看不出是否持有兵器。"不必紧张，在下并无恶意。"他的声音不紧不慢，带着一种与街市格格不入的从容。"在下有一桩买卖，想找一位胆大心细之人合作。观察了阁下许久，觉得阁下或许合适。"他从袖中露出一截手指，指了指巷口更深处的阴影——那里似乎还有另一个人在等候。',
        choices: [
          {
            id: 'accept_meeting',
            text: '"既然如此，说说看是什么买卖。"',
            consequence: {
              nextPhase: 'stranger_2',
            },
          },
          {
            id: 'refuse_cautious',
            text: '"深更半夜，恕不奉陪。"转身便走。',
            consequence: {
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative:
                '你加快脚步离开了。回头看了一眼，那个斗笠人还站在原地，似乎并不意外你的拒绝。他只是微微点了点头，然后转身消失在了夜色之中。你走了很远，心中却始终挥不去一种奇怪的感觉——那人的声音，你似乎在哪里听过。但你想不起来了。夜风吹过空荡的街面，卷起几片落叶，打着旋儿消失在黑暗里。',
            },
          },
          {
            id: 'demand_face',
            text: '"先摘了斗笠，让我看看你在跟谁说话。"',
            consequence: {
              nextPhase: 'stranger_2',
              immediateEffects: { mood: 3 },
              relationChange: 3,
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 夜间街面',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'stranger', name: '斗笠人', glyph: '秘', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '斗笠人', text: '在下有一桩买卖，想找一位胆大心细之人合作。' },
          ],
        },
      },

      // ── 第二幕：真实身份揭示 — 概率判定 ──
      stranger_2: {
        phaseId: 'stranger_2',
        narrative:
          '斗笠人沉默了一瞬，然后缓缓摘下了斗笠。月光下，你终于看清了他的面容——但你的反应取决于对方究竟是什么来路。他注视着你的眼睛，似乎在揣摩你的反应。片刻后，他从怀中取出一样东西，在掌心摊开给你看。那东西在月光下泛着微弱的光芒，你的瞳孔不由自主地收缩了一下。',
        choices: [
          {
            id: 'hear_proposal',
            text: '按捺住心中的震惊，听他把话说完。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 0.6,
              },
              tieredResults: {
                critical_success: {
                  narrative:
                    '他摊开手掌——那是一枚做工精致的令牌，上面刻着你认识的一个衙门的印记。他压低声音："实不相瞒，在下行事不便公开身份。但在下所托之事，与城中数百口人的安危有关。三日后城中将有一批赈灾粮入城，在下的线报显示有人在粮中做了手脚。阁下若肯帮忙暗中查探，不仅救人一命，也自有一份报酬。"',
                  effects: { mood: 10 },
                },
                success: {
                  narrative:
                    '他摊开手掌——那是一卷密封的绢帛，上面盖着你似曾相识的印章。"在下是个掮客，专门替人办事。有位不愿透露姓名的贵人托我找一个人——一个值得信任的人，替他办一件事。事成之后，报酬丰厚。"他没有透露更多细节，但那种说话的语气和举止，不像寻常的江湖骗子。',
                  effects: { mood: 5 },
                },
                failure: {
                  narrative:
                    '他摊开手掌——你什么也没看到。就在你低头的一瞬间，你感觉到了危险的气息。此人不像是来谈买卖的，倒像是来踩点的。他的目光在你身上游走，像在估量什么东西的价值。你暗暗攥紧了拳头，心中警铃大作。这个"买卖"，恐怕不像他说的那么简单。',
                  effects: { mood: -8 },
                },
              },
              nextPhase: 'stranger_3',
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 巷口暗处',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'stranger', name: '来客', glyph: '秘', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '来客', text: '请看。' },
          ],
        },
      },

      // ── 第三幕：最终抉择 ──
      stranger_3: {
        phaseId: 'stranger_3',
        narrative:
          '不论来客的真实目的是什么，此刻选择权在你手中。夜风渐起，吹动了你和他的衣袂。远处的更鼓声传来——已经快三更了。来客静静地等着你的答复，月光在他脸上投下明暗分明的光影。你知道，答应了就是上了一条船，拒绝了可能就此错过一个机会——或者说，避过了一个危险。',
        choices: [
          {
            id: 'accept_deal',
            text: '"好，我接了。说吧，需要我做什么？"',
            consequence: {
              immediateEffects: { mood: 8, social: 5 },
              relationChange: 10,
              nextPhase: null,
              endingNarrative:
                '来客微微点头，嘴角似乎勾起了一丝笑意。"好。爽快。"他从怀中取出一枚铜牌递给你，上面刻着一个你从未见过的符号。"三日后子时，拿着这个到城东的望月茶楼，会有人接应你。届时一切自会明了。"他将斗笠重新戴好，向你拱了拱手，转身走入了夜色之中。你低头看着手中的铜牌，月光照在那枚奇异的符号上，泛着幽幽的光。你不知道自己即将面对的是什么，但心底深处有一丝期待在悄然滋长。',
              outcome: {
                narrative: '接受了神秘来客的交易委托，卷入了一桩秘密任务。',
                effects: { mood: 8, social: 5 },
                relationChange: 10,
                memoryTag: '接受神秘来客秘密委托',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'secret_agent',
                    description: '接受了神秘来客的秘密委托，成为了某个隐秘计划的一部分',
                  },
                ],
              },
            },
          },
          {
            id: 'decline_deal',
            text: '"这种来路不明的事，恕在下不敢趟这趟浑水。"',
            consequence: {
              immediateEffects: { mood: -5 },
              relationChange: -5,
              nextPhase: null,
              endingNarrative:
                '来客没有追问，只是点了点头，将手中的东西收回怀中。"无妨。此事本就需要心甘情愿之人。"他重新戴好斗笠，向你微微欠身，然后转身离去。你看着他的背影渐渐融入夜色，消失在街道尽头。一阵夜风吹过，空荡荡的街面上只剩下你一个人。你不确定自己做了正确的选择，但至少——今晚你可以安心睡觉。至于那桩"买卖"究竟是什么，也许你永远不会知道了。',
            },
          },
          {
            id: 'demand_more',
            text: '"先告诉我你是谁，否则一切免谈。"',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '精明',
            },
            consequence: {
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative:
                '来客沉默了良久，月光下你看见他的眉头微微蹙起。"阁下谨慎，是好事。"他最终开口，"但有些事，知道得越少反而越安全。在下只能告诉阁下——在下的主人与阁下的利害并不冲突。"他没有透露更多，但这句话至少让你确认了一件事：他背后还有人。你权衡了片刻，最终还是摇了摇头。来客没有坚持，只是留下了一句话："若阁下改了主意，明日日落前到城隍庙后院来。"说完便消失在了夜色中。你站在原地想了很久，最终转身走向回家的路。',
              outcome: {
                narrative: '追问神秘来客的身份未果，但获得了一个后续联络的地点。',
                effects: { mood: 3 },
                memoryTag: '神秘来客留下联络线索',
                transformations: [
                  {
                    type: 'gain_narrative_tag',
                    value: 'knows_secret',
                    description: '与神秘来客接触后掌握了联络方式，日后可能被卷入更大的秘密',
                  },
                ],
              },
            },
          },
        ],
        visual: {
          background: 'night_street',
          location: '汴京 · 夜色街面',
          characters: [
            { id: 'player', name: '你', glyph: '行', position: 'left', mood: 'neutral' },
            { id: 'stranger', name: '来客', glyph: '秘', position: 'right', mood: 'neutral' },
          ],
          dialogue: [
            { speaker: '来客', text: '阁下的答复如何？' },
          ],
        },
      },
    },
    weight: 3,
    cooldownTicks: 40,
    priority: 5,
    tags: ['secrets', 'mystery', 'night', 'stranger', 'choice_morality'],
  },
];
