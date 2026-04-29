// === 工作场景 ===
// 匠艺试炼、大买卖、求职之路

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_WORK_SCENES: PlayerScene[] = [
  // ════════════════════════════════════════
  // 匠艺试炼 (4幕)
  // ════════════════════════════════════════
  {
    id: 'ps_craftsmanship_trial',
    name: '匠艺试炼',
    description: '名匠出题考验，一试身手',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['铁匠', '木匠', '裁缝'],
      location: ['east_market', 'center_street', 'residential_north'],
      timeOfDay: 'day',
    },
    participants: [{ role: '匠师', minCount: 1, maxCount: 1 }],
    openingNarrative: '你在作坊前驻足，被师傅的精妙手艺吸引。{npcName}抬头看了你一眼，目光中带着考量的意味。"年轻人，光看可看不出门道。有没有胆子试一试？"',
    openingVisual: {
      background: 'alley',
      location: '汴京 · 作坊街',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'master', name: '{npcName}', glyph: '匠', position: 'right', mood: 'neutral' },
      ],
      dialogue: [
        { speaker: '{npcName}', text: '做手艺这行，靠的是心诚。你若有心，我便教你一招。' },
      ],
    },
    entryPhase: 'craft_1',
    phases: {
      craft_1: {
        phaseId: 'craft_1',
        narrative: '{npcName}将工具摆在你面前，指了指桌上的一块材料。"来，按照你的想法做。我不看结果，只看手法。"围观的学徒们窃窃私语，有人幸灾乐祸，有人替你捏汗。',
        visual: {
          background: 'alley',
          location: '汴京 · 作坊',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'master', name: '{npcName}', glyph: '匠', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'c1_honest',
            text: '老老实实照着基本功来做，不投机取巧。',
            condition: { field: 'honor', operator: 'gte', value: 40 },
            consequence: {
              immediateEffects: { fatigue: -5 },
              nextPhase: 'craft_2a',
            },
          },
          {
            id: 'c1_trick',
            text: '想办法走个捷径，只要看起来过得去就行。',
            consequence: { nextPhase: 'craft_2b' },
          },
          {
            id: 'c1_refuse',
            text: '"我手笨，怕糟蹋了好材料。"',
            consequence: {
              immediateEffects: { mood: -2 },
              nextPhase: null,
              endingNarrative: '你婉拒了试炼。{npcName}笑了笑，也不勉强。"怕出错的人，做不了手艺人。"你站在一旁看着学徒们忙碌，心里有些遗憾。',
            },
          },
        ],
      },
      craft_2a: {
        phaseId: 'craft_2a',
        narrative: '你沉下心来，一板一眼地按照工序操作。虽然手法生疏，但每一步都踏踏实实。{npcName}在一旁默默看着，不时微微点头。',
        visual: {
          background: 'alley',
          location: '汴京 · 作坊内',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'master', name: '{npcName}', glyph: '匠', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'c2a_persist',
            text: '继续专注手上的活，不受旁人影响。',
            consequence: {
              immediateEffects: { mood: 3 },
              relationChange: 5,
              nextPhase: 'craft_3',
            },
          },
          {
            id: 'c2a_ask',
            text: '遇到不确定的地方，主动请教。',
            consequence: {
              immediateEffects: { mood: 2 },
              relationChange: 7,
              nextPhase: 'craft_3',
            },
          },
        ],
      },
      craft_2b: {
        phaseId: 'craft_2b',
        narrative: '你想了个巧妙的法子走捷径。眼看快成了，突然——"啪"的一声，材料在关键时刻出了问题。{npcName}的眉头皱了起来。',
        visual: {
          background: 'alley',
          location: '汴京 · 作坊内',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'sad' },
            { id: 'master', name: '{npcName}', glyph: '匠', position: 'right', mood: 'angry' },
          ],
        },
        choices: [
          {
            id: 'c2b_admit',
            text: '"是我偷懒了。请师傅再给我一次机会。"',
            consequence: { relationChange: 2, nextPhase: 'craft_3' },
          },
          {
            id: 'c2b_excuse',
            text: '"这材料本身就有问题……"',
            consequence: {
              relationChange: -5,
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative: '{npcName}冷哼一声："做手艺的人，找借口不如找原因。"说完便不再理你。你在同行的口碑里，也多了个"不实诚"的标签。',
            },
          },
        ],
      },
      craft_3: {
        phaseId: 'craft_3',
        narrative: '最终的作品虽然算不上精美，但{npcName}仔细端详了一番，脸上露出了赞许的神色。"骨子里是实诚人，手艺可以慢慢练。这个——"从怀里掏出一件小工具递给你。',
        visual: {
          background: 'alley',
          location: '汴京 · 作坊',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'master', name: '{npcName}', glyph: '匠', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'c3_thanks',
            text: '双手接过，郑重道谢。',
            consequence: {
              relationChange: 5,
              immediateEffects: { mood: 5, copper: 5 },
              nextPhase: null,
              endingNarrative: '{npcName}拍了拍你的肩膀。"这把锉刀跟了我二十年，如今传给你。记住，手上功夫急不得，心里功夫更急不得。"你攥着锉刀，感到一种沉甸甸的分量。',
            },
          },
          {
            id: 'c3_apprentice',
            text: '"师傅，我能常来学吗？"',
            consequence: {
              relationChange: 8,
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative: '{npcName}哈哈大笑："求之不得！明日一早来，先从磨刀开始。"你激动得一夜没睡好。也许这就是命运给你的一个新方向。',
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 8,
  },

  // ════════════════════════════════════════
  // 大买卖 (4幕)
  // ════════════════════════════════════════
  {
    id: 'ps_big_business',
    name: '大买卖',
    description: '一笔高风险高回报的交易',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['商贩', '小贩', '货郎'],
      location: ['east_market', 'center_street'],
      timeOfDay: 'day',
    },
    participants: [{ role: '商人', minCount: 1, maxCount: 1 }],
    openingNarrative: '{npcName}神秘兮兮地把你拉到一旁，压低声音说："有一批货，价低得离谱。你要是有本钱，转手就能赚三成。"说着，从袖中取出一份清单。',
    openingVisual: {
      background: 'market',
      location: '汴京 · 东市角落',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'merchant', name: '{npcName}', glyph: '商', position: 'right', mood: 'happy' },
      ],
      dialogue: [
        { speaker: '{npcName}', text: '这可是千载难逢的好机会……不过，富贵险中求嘛。' },
      ],
    },
    entryPhase: 'biz_1',
    phases: {
      biz_1: {
        phaseId: 'biz_1',
        narrative: '你看了看清单——确实是紧俏货，市价的三分之一。但价格低得有些蹊跷。{npcName}见你犹豫，催促道："犹豫什么？过了这村可没这店了。"',
        visual: {
          background: 'market',
          location: '汴京 · 东市',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'merchant', name: '{npcName}', glyph: '商', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'b1_full',
            text: '"我全要了。"',
            condition: { field: 'copper', operator: 'gte', value: 50 },
            consequence: {
              immediateEffects: { copper: -50 },
              nextPhase: 'biz_2a',
            },
          },
          {
            id: 'b1_partial',
            text: '"先拿一部分试试水。"',
            condition: { field: 'copper', operator: 'gte', value: 20 },
            consequence: {
              immediateEffects: { copper: -20 },
              nextPhase: 'biz_2a',
            },
          },
          {
            id: 'b1_decline',
            text: '"太便宜了，我怕有诈。"',
            consequence: { nextPhase: 'biz_2b' },
          },
          {
            id: 'b1_expose',
            text: '仔细检查清单，找出破绽。',
            condition: { field: 'personality', operator: 'includes', value: '狡猾' },
            consequence: { nextPhase: 'biz_2c' },
          },
        ],
      },
      biz_2a: {
        phaseId: 'biz_2a',
        narrative: '你付了定金，{npcName}答应明日交货。然而当晚你就听到了风声——城门守卫截获了一批走私货物，和你清单上的一模一样。',
        visual: {
          background: 'night_street',
          location: '汴京 · 夜色中',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 'b2a_report',
            text: '立刻报官，交代情况。',
            condition: { field: 'honor', operator: 'gte', value: 40 },
            consequence: {
              immediateEffects: { mood: -2 },
              nextPhase: null,
              endingNarrative: '你向官府交代了来龙去脉。虽然铜钱打了水漂，但知县大人念你主动交代，不予追究。{npcName}则被抓了个正着。街坊们对你的评价反而高了——关键时刻站得正。',
            },
          },
          {
            id: 'b2a_hide',
            text: '装作什么都没发生，赶紧把货脱手。',
            consequence: {
              immediateEffects: { copper: 30, mood: -5 },
              nextPhase: null,
              endingNarrative: '你连夜把货转了手，赚了一笔。但接下来的几天里，你总觉得有人在背后指指点点。这笔钱花起来，总觉得烫手。',
            },
          },
        ],
      },
      biz_2b: {
        phaseId: 'biz_2b',
        narrative: '{npcName}见你不上当，神色一变，随即又恢复了笑脸。"嗐，试探你呢！果然是个精明人。"说完便岔开了话题。你知道自己判断对了——这买卖水太深。',
        visual: {
          background: 'market',
          location: '汴京 · 东市',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'merchant', name: '{npcName}', glyph: '商', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'b2b_warn',
            text: '"这种勾当少做，小心吃牢饭。"',
            consequence: {
              relationChange: -2,
              immediateEffects: { mood: 2 },
              nextPhase: null,
              endingNarrative: '{npcName}讪讪地笑了笑，转身走了。你望着那个背影，摇了摇头。在这市井里混，不贪心就是最大的本事。',
            },
          },
        ],
      },
      biz_2c: {
        phaseId: 'biz_2c',
        narrative: '你仔细一核对，发现清单上有好几处矛盾——货源地含糊不清、价格前后不一致、数量也不对。你抬起头，盯着{npcName}的眼睛。',
        visual: {
          background: 'market',
          location: '汴京 · 东市巷角',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'angry' },
            { id: 'merchant', name: '{npcName}', glyph: '商', position: 'right', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 'b2c_confront',
            text: '"这货来路不正，你别以为我看不出来。"',
            consequence: {
              relationChange: -5,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: '{npcName}脸色惨白，连连后退。"你、你别声张……"最终灰溜溜地走了。你的精明在街坊间传开，此后再没人敢拿歪门邪道的东西来糊弄你。',
            },
          },
          {
            id: 'b2c_leverage',
            text: '"我不说出去，但你得给我一个实在的价。"',
            consequence: {
              relationChange: -3,
              immediateEffects: { copper: 15, mood: -1 },
              nextPhase: null,
              endingNarrative: '你用这个把柄逼出了底价，买入了一批正经货。虽然手法不太光彩，但在生意场上，信息就是银子。',
            },
          },
        ],
      },
    },
    weight: 9,
    cooldownTicks: 8,
  },

  // ════════════════════════════════════════
  // 求职之路 (3幕)
  // ════════════════════════════════════════
  {
    id: 'ps_job_hunt',
    name: '求职之路',
    description: '身无分文时的艰难选择',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['center_street', 'east_market', 'residential_north', 'residential_south'],
    },
    participants: [{ role: '雇主', minCount: 1, maxCount: 1 }],
    openingNarrative: '你摸了摸空瘪的口袋，叹了口气。再这样下去，连饭都吃不上了。街角贴着几张招工的告示，你决定去碰碰运气。',
    openingVisual: {
      background: 'market',
      location: '汴京 · 街头告示栏',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'sad' },
      ],
    },
    entryPhase: 'job_1',
    phases: {
      job_1: {
        phaseId: 'job_1',
        narrative: '有三份工作可以选：一家店铺的杂工，辛苦但稳定；一个商队的临时镖师，危险但报酬高；还有一个不那么光彩的活——替人跑腿送信，对方不肯说信里写了什么。',
        visual: {
          background: 'market',
          location: '汴京 · 街头',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'j1_shop',
            text: '去店铺当杂工，脚踏实地。',
            consequence: { nextPhase: 'job_2a' },
          },
          {
            id: 'j1_guard',
            text: '加入商队当镖师，富贵险中求。',
            condition: { field: 'health', operator: 'gte', value: 40 },
            consequence: { nextPhase: 'job_2b' },
          },
          {
            id: 'j1_letter',
            text: '接下那封来路不明的信。',
            consequence: { nextPhase: 'job_2c' },
          },
        ],
      },
      job_2a: {
        phaseId: 'job_2a',
        narrative: '你在店铺里忙了一整天——搬货、扫地、招呼客人。{npcName}老板虽然嘴上不饶人，但暗地里多给了你几个铜板的饭钱。"年轻人，做事踏实就好。"',
        visual: {
          background: 'market',
          location: '汴京 · 店铺',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'boss', name: '{npcName}', glyph: '掌', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'j2a_thanks',
            text: '"多谢老板。明天我还来。"',
            consequence: {
              relationChange: 3,
              immediateEffects: { copper: 8, mood: 2, fatigue: -10 },
              nextPhase: null,
              endingNarrative: '你揣着今天赚的铜板，买了两个热馒头。虽然辛苦，但每一文钱都是干净钱。日子会好起来的。',
            },
          },
        ],
      },
      job_2b: {
        phaseId: 'job_2b',
        narrative: '商队出发了。半路上果然遇到了麻烦——几个蒙面人拦住去路，要收"过路费"。{npcName}镖头看了你一眼："怕不怕？"',
        visual: {
          background: 'alley',
          location: '汴京 · 城外官道',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'angry' },
            { id: 'guard', name: '{npcName}', glyph: '镖', position: 'center', mood: 'angry' },
            { id: 'bandit', name: '蒙面人', glyph: '匪', position: 'right', mood: 'angry' },
          ],
        },
        choices: [
          {
            id: 'j2b_fight',
            text: '拔刀上前，寸步不让。',
            consequence: {
              immediateEffects: { health: -10, copper: 20, mood: 5 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative: '一番混战，你虽然挂了彩，但好歹把劫匪赶跑了。{npcName}镖头竖起大拇指："好小子！这是你的报酬，外加一份奖金。"你捂着伤口，觉得值了。',
            },
          },
          {
            id: 'j2b_negotiate',
            text: '上前交涉，能不打就不打。',
            consequence: {
              immediateEffects: { copper: 10, mood: 2 },
              relationChange: 3,
              nextPhase: null,
              endingNarrative: '你三寸不烂之舌说动了劫匪，给了他们一点"茶水费"就放行了。{npcName}虽然少赚了些，但保住了货物，对你颇为赞赏。',
            },
          },
        ],
      },
      job_2c: {
        phaseId: 'job_2c',
        narrative: '你按照地址找到了收信人。那人接过信，脸色骤变——"谁让你送这个的？"紧接着，一队巡街的衙役从巷子另一头走了过来。',
        visual: {
          background: 'alley',
          location: '汴京 · 小巷深处',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'sad' },
            { id: 'receiver', name: '收信人', glyph: '人', position: 'right', mood: 'angry' },
          ],
        },
        choices: [
          {
            id: 'j2c_cooperate',
            text: '主动向衙役交代情况。',
            consequence: {
              immediateEffects: { copper: 5, mood: -2 },
              nextPhase: null,
              endingNarrative: '你向衙役交代了一切。经过一番盘查，发现这封信涉及一桩旧案。你虽然被盘问了半天，但最终得到了衙门的谅解和一点赏金。以后这种来路不明的活，再也不接了。',
            },
          },
          {
            id: 'j2c_run',
            text: '趁乱溜走。',
            consequence: {
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative: '你一头钻进了巷子深处，七拐八拐甩掉了追兵。蹲在墙角喘气时，你暗暗发誓——以后再穷，也不干这种糊里糊涂的事了。',
            },
          },
        ],
      },
    },
    weight: 8,
    cooldownTicks: 6,
  },
];
