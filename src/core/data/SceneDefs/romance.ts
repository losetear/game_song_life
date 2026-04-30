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
  {
    id: 'lantern_festival_meet',
    name: '元宵邂逅',
    goalCategory: 'romance',
    weight: 7,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'temple'],
      season: ['春'],
      dayRange: [10, 60],
    },
    openingNarrative: '元宵灯会，花灯如海。你在猜灯谜的人群中，偶然和一个年轻人对视了一眼。那一瞬间，周围喧嚣的锣鼓声仿佛都远去了，只剩下对方眼里的光亮。',
    choices: [
      {
        id: 'approach_stranger',
        text: '上前搭话',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你鼓起勇气走上前，笨拙地说了句"这灯谜好难"。对方笑了，你们开始聊起来。原来他/她也住在这附近，也许以后还能再见面？',
          effects: { mood: 15 },
          narrativeTag: '灯会邂逅',
          relationChange: 10,
        },
      },
      {
        id: 'exchange_glance',
        text: '只是远远看着',
        consequence: {
          narrative: '你没有上前，只是在人群中远远地看着那人的身影。灯会散去时，你们擦肩而过，谁都没有说话。但那个夜晚，你久久不能入睡。',
          effects: { mood: 8 },
          narrativeTag: '暗恋开始',
        },
      },
      {
        id: 'leave_crowd',
        text: '太害羞了，赶紧走',
        consequence: {
          narrative: '你的脸突然红了，慌忙挤出了人群。回家的路上你一直在懊恼——为什么不上去说句话呢？但也许，这就是缘分吧。',
          effects: { mood: -3 },
        },
      },
    ],
  },
  {
    id: 'love_triangle',
    name: '三角恋情',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 25,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [20, 999],
      requiredNarrativeTags: ['心上人'],
    },
    openingNarrative: '你发现心上人最近常常和另一个人在一起——谈笑风生，举止亲密。那个人条件比你好，看起来他们更般配。你的心像被什么揪住一样疼。',
    choices: [
      {
        id: 'confess_compete',
        text: '直接表白',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你找到心上人，说了自己的心意。对方沉默了许久，说"我需要时间考虑"。无论结果如何，你至少没有让自己后悔。',
          effects: { mood: 5 },
          narrativeTag: '勇敢表白',
          relationChange: 5,
        },
      },
      {
        id: 'wait_patiently',
        text: '默默等待',
        consequence: {
          narrative: '你选择退后一步，给对方空间。也许感情的事情不能强求。你告诉自己：如果他/她选择了别人，你也会祝福。',
          effects: { mood: -5 },
          narrativeTag: '等待爱情',
        },
      },
      {
        id: 'withdraw_affection',
        text: '选择退出',
        consequence: {
          narrative: '你觉得自己争不过，开始慢慢疏远心上人。虽然心痛，但也许长痛不如短痛。你把精力都投入到工作中，试图忘记这一切。',
          effects: { mood: -12 },
          narrativeTag: '放弃爱情',
        },
      },
    ],
  },
  {
    id: 'secret admirer',
    name: '神秘示爱',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 20,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential'],
      dayRange: [15, 999],
    },
    openingNarrative: '每天早上，你都在门口发现一些小礼物——有时是一朵花，有时是糕点，有时是一首情诗。你不知道是谁送的，问遍了邻居，也都说不清楚。',
    choices: [
      {
        id: 'wait_see',
        text: '蹲守看看是谁',
        condition: { field: 'health', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你起了个大早，躲在门后。天刚蒙蒙亮，一个身影悄悄走近——居然是你认识的人！你走出来，两人都愣住了。原来他/她一直默默喜欢你。',
          effects: { mood: 18 },
          narrativeTag: '发现仰慕者',
          relationChange: 15,
        },
      },
      {
        id: 'accept_gifts',
        text: '欣然接受',
        consequence: {
          narrative: '你每天都会收到礼物，心情渐渐好了起来。虽然不知道是谁，但被人惦记的感觉很温暖。你希望有一天能当面感谢那个神秘人。',
          effects: { mood: 10 },
          narrativeTag: '被神秘人追求',
        },
      },
      {
        id: 'stop_gifts',
        text: '留条子说停止',
        consequence: {
          narrative: '你在门口贴了张纸条："请不要再送东西了，我心领了。"第二天开始，礼物果然不再出现。但你心里又有些失落……',
          effects: { mood: -5 },
          narrativeTag: '拒绝仰慕',
        },
      },
    ],
  },
  {
    id: 'childhood_sweetheart',
    name: '青梅竹马',
    goalCategory: 'romance',
    weight: 4,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [25, 999],
      location: ['residential', 'farmland'],
    },
    openingNarrative: '小时候和你一起长大的玩伴突然回来了！他/她去外地求学/经商已经好几年了。再次见面，当年那个调皮的小男孩/小女孩已经长成了俊俏的后生/美丽的姑娘。',
    choices: [
      {
        id: 'reconnect_closely',
        text: '重温旧时光',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你们坐下来聊了很久，从儿时的糗事聊到各自的经历。那种熟悉又陌生的感觉让你心里暖暖的。也许这些年，你们都没有忘记彼此。',
          effects: { mood: 15 },
          narrativeTag: '与青梅竹马重逢',
          relationChange: 12,
        },
      },
      {
        id: 'catch_up_briefly',
        text: '简单寒暄',
        consequence: {
          narrative: '"哎呀，多年不见！"你们寒暄了几句，交换了各自的消息。虽然谈得不多，但那段美好的记忆已经足够让你开心好几天了。',
          effects: { mood: 8 },
          narrativeTag: '遇到旧识',
        },
      },
      {
        id: 'avoid_meeting',
        text: '假装没认出',
        consequence: {
          narrative: '你装作没看见，匆匆走开了。后来你听说对方一直在找你，但你觉得现在的自己配不上他/她了。',
          effects: { mood: -8 },
          narrativeTag: '躲避青梅竹马',
        },
      },
    ],
  },
  {
    id: 'forbidden_love',
    name: '门第之恋',
    goalCategory: 'romance',
    weight: 3,
    cooldownDays: 28,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [30, 999],
      location: ['teahouse', 'riverside'],
      requiredNarrativeTags: ['心上人'],
    },
    openingNarrative: '你和心上人的感情越来越深，但现实是残酷的——他/她出身富贵，而你只是普通人。他/她的家人已经察觉到了这段关系，强烈反对。',
    choices: [
      {
        id: 'fight_for_love',
        text: '坚持在一起',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你找到心上人，说"不管别人怎么看，我都不会放弃"。他/她感动得流下了眼泪，你们决定一起面对所有的困难。',
          effects: { mood: 12 },
          narrativeTag: '为爱情抗争',
          relationChange: 20,
        },
      },
      {
        id: 'let_go_painfully',
        text: '忍痛放手',
        consequence: {
          narrative: '你不想让他/她为难，主动提出分手。他/她哭着求你改变主意，但你还是狠下心来。后来听说他/她被安排了一门婚事，你一个人喝了一夜的酒。',
          effects: { mood: -20 },
          narrativeTag: '为爱放手',
        },
      },
      {
        id: 'keep_secret_love',
        text: '偷偷来往',
        consequence: {
          narrative: '你们决定瞒着家人继续见面。每次约会都像做贼一样紧张刺激，但这份甜蜜是值得的。不知道能瞒多久，但至少现在，你们还在一起。',
          effects: { mood: 5 },
          narrativeTag: '秘密恋爱',
        },
      },
    ],
  },
  {
    id: 'love_letter_reply',
    name: '回音',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 18,
    narrativeWeight: 'minor',
    conditions: {
      dayRange: [12, 999],
      requiredNarrativeTags: ['写过情书'],
    },
    openingNarrative: '你之前送出的情书终于有了回音！他/她约你今晚在汴河边见面。你一整天都心神不宁，既紧张又期待。',
    choices: [
      {
        id: 'go_meet',
        text: '准时赴约',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '月色下的汴河波光粼粼，他/她已经在等了。你们并肩坐在河边的石头上，说了很多话。原来他/她也一直喜欢你，只是不知道如何开口。',
          effects: { mood: 20 },
          narrativeTag: '两情相悦',
          relationChange: 18,
        },
      },
      {
        id: 'bring_gift',
        text: '准备一份礼物',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative: '你花十五文钱买了一支精致的发簪/一把折扇。见面时送给他/她，对方很喜欢。月光下，你们的心更近了。',
          effects: { copper: -15, mood: 18 },
          narrativeTag: '定情信物',
          relationChange: 20,
        },
      },
      {
        id: 'send_friend',
        text: '让朋友帮忙看看',
        consequence: {
          narrative: '你找了朋友先去打探。朋友回来后说"人家是真心想见你，你瞎担心什么"。你这才鼓起勇气去了，结果确实如朋友所说。',
          effects: { mood: 12 },
          narrativeTag: '朋友助攻',
          relationChange: 12,
        },
      },
    ],
  },
  {
    id: 'rejected_proposal',
    name: '被拒之痛',
    goalCategory: 'romance',
    weight: 4,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [20, 999],
      requiredNarrativeTags: ['表白过'],
    },
    openingNarrative: '你鼓起勇气向心上人表白了，但对方摇头拒绝了。理由很简单——"我还不想谈这些"。你的心像被冷水浇透，整个人都懵了。',
    choices: [
      {
        id: 'accept_gracefully',
        text: '体面接受',
        condition: { field: 'mood', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你深吸一口气，说"我明白了，谢谢你这么诚实"。虽然心痛，但你保持了尊严。对方也松了口气，说还能做朋友。',
          effects: { mood: -5 },
          narrativeTag: '被拒绝但体面',
          relationChange: 3,
        },
      },
      {
        id: 'persist_pursuit',
        text: '继续追求',
        consequence: {
          narrative: '你不甘心，继续送礼物、写情书。但渐渐地，对方开始躲避你。最后你也意识到，感情是不能强求的。',
          effects: { mood: -15 },
          narrativeTag: '死缠烂打',
          relationChange: -10,
        },
      },
      {
        id: 'avoid_contact',
        text: '从此疏远',
        consequence: {
          narrative: '你觉得太丢脸了，开始刻意避开心上人。原来的朋友关系也变得尴尬起来。也许时间能冲淡一切吧。',
          effects: { mood: -10 },
          narrativeTag: '因爱成恨',
          relationChange: -8,
        },
      },
    ],
  },
  {
    id: 'wedding_invitation',
    name: '喜帖',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 25,
    narrativeWeight: 'minor',
    conditions: {
      dayRange: [35, 999],
    },
    openingNarrative: '你收到了一张喜帖——是你认识的人要结婚了。如果是别人，你会真心祝福。但这一次……新郎/新娘是你曾经深爱过的人。',
    choices: [
      {
        id: 'attend_wedding',
        text: '参加婚礼',
        condition: { field: 'mood', operator: 'gte', value: 25 },
        consequence: {
          narrative: '你穿上最好的衣服，笑着祝福新人。当看到他们拜堂时，你的心里五味杂陈。但你知道，是时候放下了。',
          effects: { mood: -5 },
          narrativeTag: '出席前任婚礼',
        },
      },
      {
        id: 'send_gift_only',
        text: '只送礼不参加',
        consequence: {
          narrative: '你准备了礼物，托人送去。你做不到亲眼看着曾经深爱的人嫁给别人。那晚你一个人喝了点酒，睡了一觉，第二天继续生活。',
          effects: { mood: -8 },
          narrativeTag: '祝福前任',
        },
      },
      {
        id: 'decline_invitation',
        text: '礼貌拒绝',
        consequence: {
          narrative: '你回信说有事去不了。新人也理解。后来听说婚礼很热闹，他们过得很幸福。你远远地祝福，也终于开始新的生活。',
          effects: { mood: 3 },
          narrativeTag: '放下过去',
        },
      },
    ],
  },
  {
    id: 'romance_childhood_sweetheart',
    name: '青梅竹马',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential', 'street'],
      dayRange: [15, 999],
      forbiddenNarrativeTags: ['心上人', '已婚', '青梅竹马相遇'],
    },
    openingNarrative:
      '你在街角遇到了一个熟悉的身影——仔细一看，竟是儿时玩伴小芳！她也认出了你，惊喜地叫出你的名字。你们从小一起长大，后来各奔东西，没想到在汴京重逢了。',
    choices: [
      {
        id: 'sweetheart_reconnect',
        text: '叙旧叙旧',
        consequence: {
          narrative:
            '你们找了个茶馆坐下，聊起了小时候的趣事和各自这些年的经历。小芳现在在一家绣坊工作，还没嫁人。你们约定改天再聚，心中都有些莫名的情愫在滋长。',
          effects: { mood: 15 },
          narrativeTag: '青梅竹马相遇',
          relationChange: 8,
        },
      },
      {
        id: 'sweetheart_polite',
        text: '简单寒暄',
        consequence: {
          narrative:
            '你们简单聊了几句就分开了。虽然没有深谈，但这次相遇让你想起了许多童年的回忆，心中温暖。',
          effects: { mood: 8 },
          narrativeTag: '偶遇旧识',
        },
      },
      {
        id: 'sweetheart_decline',
        text: '装作不认识',
        consequence: {
          narrative:
            '你不知道该如何面对，低下头匆匆走过。后来你听说小芳那天一直在等你，你心里有些遗憾。',
          effects: { mood: -5 },
        },
      },
    ],
  },
  {
    id: 'romance_secret_admirer',
    name: '暗中倾慕',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 40,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'street', 'teahouse'],
      dayRange: [12, 999],
      forbiddenNarrativeTags: ['心上人', '已婚'],
    },
    openingNarrative:
      '最近你总感觉有人在暗处看着自己。回头时却又看不到什么。直到有一天，你在家门口发现了一束野花和一张纸条："每天看你经过，是我一天中最开心的时刻。"',
    choices: [
      {
        id: 'admirer_wait',
        text: '守株待兔',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你起了个大早躲在附近。终于看到一个年轻姑娘怯生生地走来，在门口放下东西又想溜走。你叫住了她，她脸红得像苹果。原来是你常去买东西的那家铺子的掌柜女儿。',
          effects: { mood: 12 },
          narrativeTag: '发现倾慕者',
          relationChange: 6,
        },
      },
      {
        id: 'admirer_ignore',
        text: '装作不知道',
        consequence: {
          narrative:
            '你把花和纸条收了起来，照常生活。那份默默的关注让你感到温暖，但你觉得现在还不是时候。',
          effects: { mood: 5 },
          narrativeTag: '被暗中喜欢',
        },
      },
      {
        id: 'admirer_reject',
        text: '明确拒绝',
        consequence: {
          narrative:
            '你在门口留了张纸条："谢谢，但我现在不想谈这个。"此后再没有收到过花。你偶尔会想，那个姑娘现在怎么样了。',
          effects: { mood: -3 },
          narrativeTag: '拒绝了爱慕',
        },
      },
    ],
  },
  {
    id: 'romance_arranged_blind_date',
    name: '媒妁之言',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 45,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'residential'],
      dayRange: [20, 999],
      actorMinCopper: 15,
      forbiddenNarrativeTags: ['已婚', '心上人'],
    },
    openingNarrative:
      '王媒婆又来了，这次说得天花乱坠："东街李员外家的千金，知书达理，模样俊俏，你俩是天作之合！"虽然你不太相信媒婆的话，但父母一直催着成家……',
    choices: [
      {
        id: 'blind_date_accept',
        text: '同意见见',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你在茶馆见到了李小姐。她确实温婉可人，谈吐不俗。你们聊得很投机，双方都有好感。媒婆笑得合不拢嘴，这门亲事有望成。',
          effects: { copper: -5, mood: 10 },
          narrativeTag: '相过亲',
          relationChange: 6,
        },
      },
      {
        id: 'blind_date_decline',
        text: '现在不想成家',
        consequence: {
          narrative:
            '你婉拒了媒婆的提议。王媒婆撇撇嘴："年轻人就是不着急。"你虽然觉得有些过意不去，但也不想勉强自己。',
          effects: { mood: -2 },
        },
      },
      {
        id: 'blind_date_curious',
        text: '先问问对方情况',
        consequence: {
          narrative:
            '你详细询问了李小姐的情况。媒婆竹筒倒豆子般说了：李小姐今年十八，擅长琴棋书画，性格温柔。你听着有些心动，决定改天去见见。',
          effects: { mood: 5 },
          narrativeTag: '了解过相亲对象',
        },
      },
    ],
  },
  {
    id: 'romance_rival',
    name: '情敌出现',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 38,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'street'],
      requiredNarrativeTags: ['心上人', '月下相知'],
      dayRange: [25, 999],
    },
    openingNarrative:
      '你正在茶馆等你心中的人，忽然看到她和另一个年轻人坐在一起，谈笑风生。那人穿着体面，举止优雅，看起来是书香门第出身。你心中泛起一阵酸涩。',
    choices: [
      {
        id: 'rival_confront',
        text: '直接走过去',
        consequence: {
          narrative:
            '你端着茶杯走了过去，在她对面坐下。她看到你有些惊讶，但还是介绍了你们认识。那人倒是客气，你从中了解到他确实是书香子弟，家境不错。',
          effects: { mood: -5 },
          narrativeTag: '见了情敌',
        },
      },
      {
        id: 'rival_wait',
        text: '在旁边等',
        consequence: {
          narrative:
            '你坐在不远处的桌边等待。那人和她聊了很久才离开，你这才过去。她看出了你的不快，笑着说只是遇到老同学叙旧。',
          effects: { mood: 2 },
        },
      },
      {
        id: 'rival_leave',
        text: '转身离开',
        consequence: {
          narrative:
            '你不想看到这一幕，转身离开了。后来你听说那人确实是她的旧识，但你们之间也因此产生了一些隔阂。',
          effects: { mood: -8 },
          narrativeTag: '心生嫌隙',
        },
      },
    ],
  },
  {
    id: 'romance_confession',
    name: '表白心意',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 50,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['teahouse', 'street', 'residential'],
      requiredNarrativeTags: ['心上人', '月下相知'],
      forbiddenNarrativeTags: ['已表白过', '已婚'],
      dayRange: [30, 999],
    },
    openingNarrative:
      '你和她的关系已经很暧昧了，但你一直没有明确表白。今天是个特别的日子，你觉得是时候说出口了。心跳如鼓，你组织着语言……',
    choices: [
      {
        id: 'confession_direct',
        text: '直接表白',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你深吸一口气："我喜欢你，想和你在一起。"她脸红了，低着头不说话。过了好久，她轻轻点了点头。那一刻你感觉自己是世界上最幸福的人。',
          effects: { mood: 20 },
          narrativeTag: '已表白过',
          relationChange: 15,
        },
      },
      {
        id: 'confession_poem',
        text: '借诗表白',
        consequence: {
          narrative:
            '你念了一首表达心意的诗。她听懂了你的意思，笑着说你文绉绉的。虽然没有明说，但你知道她心中也是有你。',
          effects: { mood: 15 },
          narrativeTag: '诗传心意',
        },
      },
      {
        id: 'confession_gift',
        text: '送礼物暗示',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative:
            '你送了她一支发簪，说是看到觉得适合她。她收下了，戴在发间问你好看吗。你们都明白这份礼物的含义。',
          effects: { copper: -15, mood: 12 },
          narrativeTag: '定情信物',
        },
      },
    ],
  },
  {
    id: 'romance_rejection',
    name: '爱而不得',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'street'],
      requiredNarrativeTags: ['心上人'],
      forbiddenNarrativeTags: ['已婚'],
      dayRange: [25, 999],
    },
    openingNarrative:
      '你鼓起勇气表白，但她说："对不起，我心里已经有人了。"虽然她拒绝得很委婉，但你的心还是像被刀割了一样疼。那一刻，你明白了什么叫爱而不得。',
    choices: [
      {
        id: 'rejection_accept',
        text: '祝福她',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你强忍着心痛说："我明白了，祝你幸福。"她有些意外也有些感激。你们之后还能做朋友，虽然每次见到她你心中还是会有些酸涩。',
          effects: { mood: -5 },
          narrativeTag: '失恋',
        },
      },
      {
        id: 'reclusion_distance',
        text: '疏远她',
        consequence: {
          narrative:
            '你无法面对她，开始有意避开。她察觉了，也没有来找你。时间慢慢冲淡了这份情愫，但那段回忆你永远不会忘记。',
          effects: { mood: -10 },
          narrativeTag: '黯然退场',
        },
      },
      {
        id: 'rejection_persist',
        text: '不想放弃',
        consequence: {
          narrative:
            '你说愿意等她。她摇摇头："别等了，不值得。"但你还是坚持。后来听说她和那个人结婚了，你才终于死心。',
          effects: { mood: -15 },
          narrativeTag: '单恋',
        },
      },
    ],
  },
  {
    id: 'romance_long_distance',
    name: '两地相思',
    goalCategory: 'romance',
    weight: 5,
    cooldownDays: 60,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential', 'street'],
      requiredNarrativeTags: ['心上人', '已表白过'],
      dayRange: [40, 999],
    },
    openingNarrative:
      '她收到家书，必须回乡照顾生病的母亲，可能要去几个月。临别时你们依依不舍，约定鸿雁传书保持联系。',
    choices: [
      {
        id: 'distance_write',
        text: '勤写信',
        consequence: {
          narrative:
            '你每隔几天就写一封信，诉说思念和近况。她也回信告诉你家乡的事。虽然相隔千里，但你们的心贴得很近。几个月后她回来了，你们更加珍惜彼此。',
          effects: { mood: 5, copper: -8 },
          narrativeTag: '异地恋',
          relationChange: 5,
        },
      },
      {
        id: 'distance_visit',
        text: '去看她',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你实在想念，请假去看她。见到她的那一刻，所有的辛苦都值了。她惊喜交加，你们一起度过了几天美好的时光。',
          effects: { copper: -30, mood: 18 },
          narrativeTag: '千里探望',
          relationChange: 10,
        },
      },
      {
        id: 'distance_drift',
        text: '渐渐淡了',
        consequence: {
          narrative:
            '一开始还经常写信，后来慢慢少了。几个月后她回来了，你们之间却多了一份陌生。最终这段感情无疾而终。',
          effects: { mood: -12 },
          narrativeTag: '感情淡去',
        },
      },
    ],
  },
  {
    id: 'romance_public_display',
    name: '情路公开',
    goalCategory: 'romance',
    weight: 6,
    cooldownDays: 48,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'teahouse', 'market'],
      requiredNarrativeTags: ['心上人', '已表白过'],
      dayRange: [35, 999],
    },
    openingNarrative:
      '你们的感情已经稳定了，但她还没有正式介绍你给她的朋友和家人。今天在集市上遇到她的几个闺蜜，她们打量着你，窃窃私语。',
    choices: [
      {
        id: 'public_introduce',
        text: '大方介绍自己',
        consequence: {
          narrative:
            '你笑着说："我是她的心上人。"几个姑娘咯咯笑起来，说你倒是诚实。她们对你印象不错，之后你们在公开场合也常常一起出现。',
          effects: { mood: 10 },
          narrativeTag: '公开恋情',
          relationChange: 5,
        },
      },
      {
        id: 'public_accompany',
        text: '陪她逛街',
        consequence: {
          narrative:
            '你帮她提着东西，陪她逛了大半个集市。虽然她没有正式介绍，但你们亲密的样子大家都看在眼里。',
          effects: { mood: 8, fatigue: 5 },
          narrativeTag: '甜蜜出游',
        },
      },
      {
        id: 'public_shy',
        text: '有些拘谨',
        consequence: {
          narrative:
            '你站在一旁不太说话。她的朋友们说你腼腆。她笑着挽住你的手臂，你们之间的关系在这群朋友面前半公开了。',
          effects: { mood: 6 },
        },
      },
    ],
  },
];
