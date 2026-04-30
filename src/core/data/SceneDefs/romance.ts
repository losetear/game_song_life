import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const ROMANCE_EVENTS: BranchEvent[] = [
  {
    id: 'romance_encounter',
    name: '邂逅佳人',
    goalCategory: 'romance',
    weight: 8,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'market', 'teahouse'],
      dayRange: [3, 999],
      forbiddenNarrativeTags: ['心上人', '已表白过', '已婚'],
      actorMaxMood: 90,
    },
    openingNarrative:
      '春日迟迟，你在汴京街头漫步，忽见一位女子在摊前挑拣绣帕，眉目如画，举止娴雅。她似有所感，抬头望了你一眼，四目相对的瞬间，你心头一跳。',
    choices: [
      {
        id: 'encounter_approach',
        text: '上前搭话',
        consequence: {
          narrative:
            '你鼓起勇气走上前去，借问绣帕价钱。她微微一笑，声音如珠落玉盘："客官好眼力，这可是苏州来的上品。"你们聊了几句，得知她叫婉儿，是城南绣坊的绣娘。',
          effects: { mood: 8 },
          narrativeTag: '心上人',
          relationChange: 5,
        },
      },
      {
        id: 'encounter_observe',
        text: '远远看着，不打扰',
        consequence: {
          narrative:
            '你站在远处看了片刻，心中暗暗记住了她的模样和那家绣摊的位置。日后若有机缘……',
          effects: { mood: 2 },
          narrativeTag: '惦念之人',
        },
      },
      {
        id: 'encounter_ignore',
        text: '转身离开',
        consequence: {
          narrative: '你摇了摇头，将杂念抛诸脑后，继续赶路。',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'romance_moonlight',
    name: '月下传情',
    goalCategory: 'romance',
    weight: 7,
    cooldownDays: 25,
    narrativeWeight: 'major',
    conditions: {
      requiredNarrativeTags: ['心上人'],
      forbiddenNarrativeTags: ['已表白过', '已婚'],
      weather: ['晴'],
      season: ['春', '秋'],
      dayRange: [10, 999],
    },
    openingNarrative:
      '今夜月色如水，你独自在院中徘徊，忽然听见墙外传来轻轻的吟诗声。探头一看，竟是那位让你日思夜想的身影——她在墙外徘徊，似乎也在想什么心事。',
    choices: [
      {
        id: 'moonlight_poem',
        text: '以诗相和',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你清了清嗓子，和了一首诗。墙外那人愣了一下，随即轻声笑了："原来是你。"月光下，她的脸庞泛起红晕。这一夜，你们隔墙谈诗论词，直到更鼓敲了三遍。',
          effects: { mood: 12, fatigue: 5 },
          relationChange: 8,
          narrativeTag: '月下相知',
        },
      },
      {
        id: 'moonlight_invite',
        text: '翻墙出去相见',
        consequence: {
          narrative:
            '你攀上墙头，轻轻跳到外面。她吓了一跳，随即掩嘴而笑："你这人，怎么这般莽撞？"但眼中却并无责怪之意。两人在月下并肩而行，说了许多心里话。',
          effects: { mood: 10, fatigue: 8 },
          relationChange: 6,
          narrativeTag: '私会过',
        },
      },
      {
        id: 'moonlight_silent',
        text: '静静听着不现身',
        consequence: {
          narrative:
            '你没有出声，只是静静地听着她的吟诵声渐渐远去。虽未相见，但你知道，今晚的月亮，你们是一同看过的。',
          effects: { mood: 4, fatigue: 2 },
          narrativeTag: '明月共赏',
        },
      },
    ],
  },
  {
    id: 'romance_letter_rejected',
    name: '情书被拒',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 40,
    conditions: {
      requiredAnyNarrativeTags: ['心上人', '月下相知', '私会过'],
      forbiddenNarrativeTags: ['已表白过', '已婚'],
      dayRange: [15, 999],
      actorMaxMood: 70,
    },
    openingNarrative:
      '你辗转反侧许久，终于写下一封情书，托人送到了她手中。然而回信却只有寥寥数语——"君之情意，妾心领矣。然门第悬殊，恐难如愿。望君另觅良缘。"',
    choices: [
      {
        id: 'letter_persist',
        text: '不放弃，再写一封',
        consequence: {
          narrative:
            '你咬着牙又写了一封更长的心里话，字字诚恳。这一次没有回信，但几天后你在街上偶遇她时，她低着头快步走过，耳根却红了。',
          effects: { mood: -3, fatigue: 3 },
          narrativeTag: '执意追求',
          relationChange: 1,
        },
      },
      {
        id: 'letter_accept',
        text: '尊重她的选择',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你长叹一声，将心事收起。也许缘分未到，强求不得。日子还要继续过下去。',
          effects: { mood: -8 },
          narrativeTag: '情场失意',
          transformations: [
            { type: 'lose_tag', value: '心上人', description: '放下了这段感情' },
          ],
        },
      },
      {
        id: 'letter_confront',
        text: '当面去问个清楚',
        consequence: {
          narrative:
            '你找到她，直截了当地问了。她沉默了很久，终于说："不是不愿意……是家里已经给我定了亲。"你如遭雷击，呆立当场。',
          effects: { mood: -15, health: -3 },
          narrativeTag: '姻缘错失',
          relationChange: -5,
        },
      },
    ],
  },
  {
    id: 'romance_jealousy',
    name: '嫉妒风波',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 20,
    conditions: {
      requiredNarrativeTags: ['心上人'],
      forbiddenNarrativeTags: ['已婚'],
      location: ['street', 'market', 'teahouse'],
      dayRange: [12, 999],
    },
    openingNarrative:
      '你在茶馆喝茶，无意间看到她和另一个男人有说有笑地走进来，那人还殷勤地为她倒茶。你的手不自觉地攥紧了茶杯。',
    choices: [
      {
        id: 'jealousy_confront',
        text: '走过去打招呼，宣示主权',
        consequence: {
          narrative:
            '你大步走过去，自然地坐在她身边，寒暄起来。那男人愣了愣，识趣地告辞了。她看了你一眼，嘴角带着一丝若有若无的笑意："你怎么来了？"',
          effects: { mood: 3 },
          narrativeTag: '醋意显露',
          relationChange: 2,
        },
      },
      {
        id: 'jealousy_watch',
        text: '暗中观察他们的关系',
        consequence: {
          narrative:
            '你坐在角落里观察了半天，发现那人是她远房表兄，来城中办事顺便探望。你暗自松了口气，也为自己方才的胡思乱想感到好笑。',
          effects: { mood: 5 },
          narrativeTag: '误会一场',
        },
      },
      {
        id: 'jealousy_leave',
        text: '愤然离去',
        consequence: {
          narrative:
            '你一言不发地起身走了出去。身后隐约传来她唤你的声音，但你没有回头。',
          effects: { mood: -10 },
          narrativeTag: '负气出走',
          relationChange: -5,
        },
      },
    ],
  },
  {
    id: 'romance_proposal_blocked',
    name: '提亲受阻',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 45,
    narrativeWeight: 'milestone',
    conditions: {
      requiredNarrativeTags: ['心上人'],
      requiredAnyNarrativeTags: ['月下相知', '私会过', '执意追求'],
      forbiddenNarrativeTags: ['已婚', '姻缘错失'],
      actorMinCopper: 80,
      dayRange: [25, 999],
    },
    openingNarrative:
      '你觉得时机成熟了，托媒人上门提亲。谁知媒人回来摇着头说："人家姑娘倒是愿意，可她爹嫌你家底太薄，说要至少二百文的聘礼才肯点头。"',
    choices: [
      {
        id: 'proposal_work_hard',
        text: '拼命攒钱',
        consequence: {
          narrative:
            '你咬紧牙关，白天干活晚上还接零活，铜钱一枚一枚地攒。她偷偷给你送过几次饭，眼里满是心疼。她说："不急的。"但你急。',
          effects: { copper: -30, fatigue: 15, mood: -5 },
          narrativeTag: '为聘礼奔波',
        },
      },
      {
        id: 'proposal_eloquence',
        text: '亲自登门以诚意打动对方',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你整了整衣冠，登门拜访。不卑不亢地与她的父亲长谈，从志向谈到担当。老人沉吟半晌，终于松了口："年轻人，我看你是个靠谱的。聘礼减半，剩下的用你的本事来补吧。"',
          effects: { mood: 10, fatigue: 5 },
          narrativeTag: '诚意动人',
          relationChange: 5,
        },
      },
      {
        id: 'proposal_elope_plan',
        text: '和她商量私奔',
        consequence: {
          narrative:
            '你悄悄找到她，把情况说了。她沉默了很久，最后握住你的手："如果你真的想要我……"你们开始秘密筹划出走的路线。',
          effects: { mood: 2, fatigue: 3 },
          narrativeTag: '密谋私奔',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'romance_secret_vow',
    name: '私定终身',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 50,
    narrativeWeight: 'milestone',
    conditions: {
      requiredNarrativeTags: ['心上人'],
      requiredAnyNarrativeTags: ['月下相知', '私会过', '密谋私奔'],
      forbiddenNarrativeTags: ['已婚', '姻缘错失'],
      dayRange: [20, 999],
    },
    openingNarrative:
      '月色朦胧的花园角落，你和她相对而立。她从袖中取出一缕青丝，郑重地递给你；你也解下随身携带的玉佩，放在她掌心。无需多言，一切尽在不言中。',
    choices: [
      {
        id: 'vow_accept',
        text: '郑重收下，许诺终身',
        consequence: {
          narrative:
            '你将青丝贴身收好，郑重地说："此生不负。"她眼眶微红，用力点了点头。从今以后，你们不再是萍水相逢的路人了。',
          effects: { mood: 15 },
          narrativeTag: '私定终身',
          relationChange: 10,
          transformations: [
            { type: 'gain_tag', value: '已表白过', description: '互许终身' },
          ],
        },
      },
      {
        id: 'vow_hesitate',
        text: '犹豫是否该如此草率',
        consequence: {
          narrative:
            '你拿着那缕青丝，心中五味杂陈。她看出你的迟疑，默默收回手，转过身去。背影显得那么单薄。',
          effects: { mood: -10 },
          narrativeTag: '辜负深情',
          relationChange: -10,
        },
      },
    ],
  },
  {
    id: 'romance_rekindle',
    name: '旧情复燃',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      requiredNarrativeTags: ['情场失意', '姻缘错失', '辜负深情'],
      forbiddenNarrativeTags: ['已婚'],
      dayRange: [30, 999],
      location: ['street', 'market', 'teahouse'],
    },
    openingNarrative:
      '熙熙攘攘的人群中，一个熟悉的身影擦肩而过。你猛地回头——是她！自从那次之后你们再没见过面。她也停下了脚步，回头望向你，目光复杂。',
    choices: [
      {
        id: 'rekindle_approach',
        text: '主动上前搭话',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '"好久不见。"你开口道。她愣了愣，露出一个苦涩的笑容："是啊，好久不见。"你们找了个地方坐下，把这些日子的经历慢慢说来。有些东西，似乎并没有完全熄灭。',
          effects: { mood: 8 },
          narrativeTag: '旧情复燃',
          relationChange: 5,
          transformations: [
            { type: 'gain_tag', value: '心上人', description: '重燃爱火' },
            { type: 'lose_tag', value: '情场失意', description: '走出阴霾' },
          ],
        },
      },
      {
        id: 'rekindle_nod',
        text: '点点头算是打过招呼',
        consequence: {
          narrative:
            '你们互相点了点头，然后各自转身。擦肩而过，如同两条相交后又分开的线。',
          effects: { mood: -2 },
          narrativeTag: '陌路重逢',
        },
      },
    ],
  },
  {
    id: 'romance_rival',
    name: '第三者插足',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 25,
    conditions: {
      requiredNarrativeTags: ['心上人', '已表白过'],
      forbiddenNarrativeTags: ['已婚'],
      dayRange: [18, 999],
      actorMaxCopper: 100,
    },
    openingNarrative:
      '城中传出消息，某位富商之子正在热烈追求她，送了不少贵重礼物。有人暗示你："人家有钱有势，你拿什么跟人家比？"',
    choices: [
      {
        id: 'rival_confidence',
        text: '相信感情不是钱能买到的',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你找到她，把听到的话说了。她皱起眉头："谁说我要他的礼物了？我都退回去了。"她握住你的手，"你别乱想。"',
          effects: { mood: 5 },
          narrativeTag: '情比金坚',
          relationChange: 8,
        },
      },
      {
        id: 'rival_insecure',
        text: '变得患得患失',
        consequence: {
          narrative:
            '你开始疑神疑鬼，甚至在她出门时忍不住跟踪。最终被她发现了。她愤怒地说："你不信任我吗？！"关系降到了冰点。',
          effects: { mood: -12 },
          narrativeTag: '因猜忌生隙',
          relationChange: -12,
        },
      },
      {
        id: 'rival_improve',
        text: '更加努力让自己配得上她',
        consequence: {
          narrative:
            '你把焦虑化为动力，拼命工作赚钱学本领。她想你了，却发现你越来越忙。有一天她问你："你是不是……不需要我了？"',
          effects: { copper: 15, fatigue: 10, mood: -3 },
          narrativeTag: '为爱拼搏',
        },
      },
    ],
  },
  {
    id: 'romance_lovesick',
    name: '相思成疾',
    goalCategory: 'romance',
    weight: 4,
    cooldownDays: 18,
    conditions: {
      requiredNarrativeTags: ['心上人'],
      forbiddenNarrativeTags: ['已婚', '在一起'],
      dayRange: [14, 999],
      actorMaxMood: 40,
      actorMaxHealth: 75,
    },
    openingNarrative:
      '你已经好多天没见到她了。茶饭不思，夜不能寐，连干活都提不起精神。郎中把脉后摇摇头："这是心病啊，药石无灵。"',
    choices: [
      {
        id: 'lovesick_visit',
        text: '去找她',
        consequence: {
          narrative:
            '你顾不得身体不适，跌跌撞撞地去找她。看到你憔悴的样子，她吓了一跳，眼圈立刻红了："你怎么弄成这样……"她细心照顾了你一天一夜。',
          effects: { health: 10, mood: 15, fatigue: -5 },
          narrativeTag: '相思情深',
          relationChange: 8,
        },
      },
      {
        id: 'lovesick_distract',
        text: '强迫自己忙起来忘掉',
        consequence: {
          narrative:
            '你把自己埋进工作中，累得倒头就睡。渐渐地，白天确实没空想了，可梦里全是她。',
          effects: { fatigue: 12, mood: 2, hunger: -8 },
          narrativeTag: '借忙消愁',
        },
      },
      {
        id: 'lovesick_write',
        text: '写信倾诉',
        consequence: {
          narrative:
            '你铺开信纸，一笔一划写下思念之苦。信送出去后，第三天收到了回信，只有四个字："我也是呀。"你捧着信，泪流满面。',
          effects: { mood: 8, health: 3 },
          narrativeTag: '鸿雁传情',
          relationChange: 5,
        },
      },
    ],
  },
  {
    id: 'romance_fate',
    name: '姻缘天定',
    goalCategory: 'romance',
    weight: 4,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      requiredNarrativeTags: ['私定终身', '为聘礼奔波'],
      forbiddenNarrativeTags: ['已婚', '在一起'],
      actorMinCopper: 150,
      dayRange: [40, 999],
    },
    openingNarrative:
      '你终于凑够了聘礼。正准备再次托媒人上门，却在庙会上偶遇了她和她的父亲。原来他们也来上香。你硬着头皮上前见礼，老人打量了你半天，忽然说："听说你这段时间很拼？跟我来。"',
    choices: [
      {
        id: 'fate_follow',
        text: '跟着他去',
        consequence: {
          narrative:
            '老人带你到偏殿，开门见山地说："我查过你的为人了。街坊邻居都说你踏实肯干。那些钱……我不要了。好好待她便是。"你喜出望外，连连作揖。她在一旁捂嘴偷笑，眼中闪着泪光。',
          effects: { mood: 20 },
          narrativeTag: '姻缘天定',
          relationChange: 15,
          transformations: [
            { type: 'gain_tag', value: '已婚', description: '终成眷属' },
            { type: 'lose_tag', value: '为聘礼奔波', description: '不再需要' },
            { type: 'lose_tag', value: '心上人', description: '已是家人' },
          ],
        },
      },
    ],
  },
];
