import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const FAMILY_EVENTS: BranchEvent[] = [
  {
    id: 'family_distant_relative',
    name: '远亲来访',
    goalCategory: 'family',
    weight: 6,
    cooldownDays: 35,
    conditions: {
      location: ['residential'],
      dayRange: [10, 999],
      forbiddenNarrativeTags: ['远亲来访过'],
    },
    openingNarrative:
      '一大早有人敲门，开门一看竟是你多年未见的远房表叔！他风尘仆仆地说："老家遭了灾，来城里投奔亲戚。你是我在这汴京唯一的亲人了啊。"',
    choices: [
      {
        id: 'relative_host',
        text: '留他住下',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你腾出地方让表叔住下，还给他买了些换洗衣服和吃食。他感动得眼眶泛红，说日后一定报答。住了半个月后他在城中找到了活计，搬了出去，但每逢过节都会来看你。',
          effects: { copper: -15, mood: 8 },
          narrativeTag: '远亲来访过',
          relationChange: 3,
        },
      },
      {
        id: 'relative_help_money',
        text: '给些钱让他自己想办法',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative:
            '你掏出十文钱给他："我也日子紧巴，这些你先拿着。"表叔接过去千恩万谢地走了。后来听说他用这笔钱做了点小生意，居然站稳了脚跟。',
          effects: { copper: -10, mood: 3 },
          narrativeTag: '资助远亲',
        },
      },
      {
        id: 'relative_refuse',
        text: '自己也顾不过来，帮不了',
        consequence: {
          narrative:
            '你为难地说实在没有余力帮忙。表叔的眼神黯淡下去，低声道了谢便转身走了。你关上门心里有些过意不去，但生活所迫也是无奈。',
          effects: { mood: -5 },
          narrativeTag: '拒绝过远亲',
        },
      },
    ],
  },
  {
    id: 'family_inheritance',
    name: '族中分产',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 50,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [20, 999],
      forbiddenNarrativeTags: ['分过家产'],
      actorMaxCopper: 60,
    },
    openingNarrative:
      '族中传来消息——你的一位远房叔公去世了，留下了一小块田产和一间铺面。按照规矩需要在同族的几个男丁之间分配。族长召集大家到祠堂议事。',
    choices: [
      {
        id: 'inheritance_claim',
        text: '争取自己应得的一份',
        consequence: {
          narrative:
            '你在祠堂中据理力争，最终分到了那间铺面的三分之一的产权。虽然不大，但每月能收几文租金。族中长辈对你的印象是"这孩子懂规矩又有主见"。',
          effects: { copper: 25, mood: 5, fatigue: 3 },
          narrativeTag: '分过家产',
          relationChange: 2,
        },
      },
      {
        id: 'inheritance_yield',
        text: '让给更困难的族人',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你主动表示放弃自己的份额，让给了带着三个孩子的寡婶。族长感慨道："难得啊，如今这样的年轻人不多了。"族中人都记住了你的善举。',
          effects: { mood: 10 },
          narrativeTag: '让出家产',
          relationChange: 5,
          transformations: [
            { type: 'gain_tag', value: '乐善好施', description: '让出遗产' },
          ],
        },
      },
    ],
  },
  {
    id: 'family_adopted_child',
    name: '过继子弟',
    goalCategory: 'family',
    weight: 4,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['residential'],
      dayRange: [30, 999],
      actorMinCopper: 40,
      requiredAnyNarrativeTags: ['已婚', '已成家'],
    },
    openingNarrative:
      '堂兄家中遭遇变故，托人来说想把他七岁的儿子过继给你做养子。孩子聪明伶俐，只是从此你要多一张吃饭的嘴了。',
    choices: [
      {
        id: 'adopt_accept',
        text: '答应下来',
        consequence: {
          narrative:
            '孩子怯生生地叫了你一声"爹"。你摸了摸他的头，心中涌起一种从未有过的责任感。从此你的生活中多了一份牵挂，也多了一份温暖。',
          effects: { copper: -15, mood: 12 },
          narrativeTag: '养父',
          transformations: [
            { type: 'gain_tag', value: '为人父母', description: '收养了孩子' },
          ],
        },
      },
      {
        id: 'adopt_refuse',
        text: '现在条件还不允许',
        consequence: {
          narrative:
            '你婉言拒绝了堂兄的请求。孩子被带走时回头看了你一眼，那个眼神让你好几天心神不宁。',
          effects: { mood: -5 },
          narrativeTag: '拒绝过继',
        },
      },
    ],
  },
  {
    id: 'family_ancestral_hall',
    name: '宗祠议事',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 28,
    conditions: {
      location: ['residential'],
      dayRange: [8, 999],
    },
    openingNarrative:
      '族长召集全族男丁到宗祠议事。原来是邻村因为水源问题与你们村起了争执，需要商议对策。祠堂里烟雾缭绕，众人议论纷纷。',
    choices: [
      {
        id: 'hall_mediate',
        text: '提议和平协商',
        condition: { field: 'mood', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你站起来说："与其争斗不如各退一步，共用水源、轮流灌溉如何？"经过一番讨论，双方都觉得这个方案可行。族长赞许地看着你："有见识。"',
          effects: { mood: 8, fatigue: 3 },
          narrativeTag: '族中有声望',
          relationChange: 4,
        },
      },
      {
        id: 'hall_fight_ready',
        text: '支持强硬态度',
        consequence: {
          narrative:
            '你附和着主战派的意见。最终两村差点动了手，好在官府及时介入调停。虽然没有打起来，但两家结下了梁子。',
          effects: { mood: -2, health: -2 },
          narrativeTag: '参与族争',
          relationChange: -2,
        },
      },
      {
        id: 'hall_silent',
        text: '保持沉默旁观',
        consequence: {
          narrative:
            '你一言不发地坐在角落里。这种场合多言无益，还是少惹麻烦为好。',
          effects: { fatigue: 2 },
        },
      },
    ],
  },
  {
    id: 'family_wedding_funeral',
    name: '婚丧嫁娶',
    goalCategory: 'family',
    weight: 6,
    cooldownDays: 30,
    conditions: {
      dayRange: [12, 999],
      location: ['residential', 'street'],
    },
    openingNarrative:
      '族中传来消息——你的一位堂哥要成亲了（或者：族中一位老人去世了）。按规矩全族都要随份子，还要去帮忙操持。',
    choices: [
      {
        id: 'wedding_generous',
        text: '大方随礼',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative:
            '你包了一个厚厚的红包，在宴席上被安排到了上座。新郎（或丧家）专门来敬了你一杯酒，当众夸你够意思。你在族中的面子大了不少。',
          effects: { copper: -15, mood: 10, hunger: 12 },
          narrativeTag: '族中体面人',
          relationChange: 5,
        },
      },
      {
        id: 'wedding_modest',
        text: '量力而行随个薄礼',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative:
            '你随了五文钱的礼，在普通席位上吃了顿饭。虽然不算显眼，但也尽到了礼数。',
          effects: { copper: -5, mood: 4, hunger: 8 },
          narrativeTag: '尽了礼数',
        },
      },
    ],
  },
  {
    id: 'family_recognize_ancestor',
    name: '认亲归宗',
    goalCategory: 'family',
    weight: 3,
    cooldownDays: 80,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [35, 999],
      requiredAnyNarrativeTags: ['古籍持有者', '族中有声望'],
    },
    openingNarrative:
      '一位白发苍苍的老者找上门来，拿出一份泛黄的族谱："我研究了三十年，你是我们这一支失散多年的后人。"翻开族谱，上面果然有你祖父的名字。',
    choices: [
      {
        id: 'recognize_accept',
        text: '认祖归宗',
        consequence: {
          narrative:
            '老者带你回到宗祠，在列祖列宗牌位前上了香。从此你在族中的地位不同往日——毕竟你是"寻回的血脉"。老者临走时还送了你一块祖传玉佩。',
          effects: { copper: 15, mood: 18 },
          narrativeTag: '认祖归宗',
          relationChange: 8,
          transformations: [
            { type: 'gain_tag', value: '族中贵人', description: '认祖归宗' },
          ],
        },
      },
      {
        id: 'recognize_skeptical',
        text: '半信半疑，暂不接受',
        consequence: {
          narrative:
            '你说需要时间考虑。老者点点头留下了族谱的副本离开了。你翻看着那份族谱，心中五味杂陈——如果这是真的，那你的人生要重新书写了。',
          effects: { mood: 5 },
          narrativeTag: '身世之谜',
        },
      },
    ],
  },
  {
    id: 'family_letter_home',
    name: '家书抵金',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 22,
    conditions: {
      dayRange: [7, 999],
      actorMinCopper: 3,
    },
    openingNarrative:
      '邮差的铃声在街角响起。你忽然想起已经很久没给家里写信了。上次母亲在信中说父亲的风湿病又犯了……',
    choices: [
      {
        id: 'letter_write_send',
        text: '写封家书并寄钱回去',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative:
            '你请代书先生写了封信报平安，又托邮差带了十文钱回去给父亲买药。虽然自己紧巴巴了些，但想到父母收到信时的欣慰，一切都值得。',
          effects: { copper: -10, mood: 8 },
          narrativeTag: '孝顺子女',
          relationChange: 2,
        },
      },
      {
        id: 'letter_write_only',
        text: '只写信问候',
        consequence: {
          narrative:
            '你写了封长长的信，把在汴京的经历一一告诉家人。写完之后心里轻松了许多，仿佛与家的距离又近了一些。',
          effects: { copper: -1, mood: 5, fatigue: 2 },
          narrativeTag: '家书一封',
        },
      },
    ],
  },
  {
    id: 'family_summoned',
    name: '族人相召',
    goalCategory: 'family',
    weight: 4,
    cooldownDays: 40,
    conditions: {
      location: ['residential', 'street'],
      dayRange: [14, 999],
    },
    openingNarrative:
      '族中派人来传话，说是有重要事情需要你回去一趟。来人支支吾吾不肯明说，只道"来了就知道了"。你隐隐有种不安的感觉。',
    choices: [
      {
        id: 'summon_go',
        text: '立刻动身回去',
        consequence: {
          narrative:
            '你赶回村子，发现是母亲病了。虽然不是大病，但她一直念叨着想见你。看到你的那一刻她拉着你的手哭了。你在床前守了三天，直到她好转才返回汴京。',
          effects: { copper: -8, fatigue: 12, health: -2, mood: -3 },
          narrativeTag: '省亲',
          relationChange: 2,
        },
      },
      {
        id: 'summon_delay',
        text: '太忙了，过几天再说',
        consequence: {
          narrative:
            '你让人带话说最近走不开。后来才知道母亲确实病了一场，好在有邻居照看转危为安。但你总有些后悔没能早点回去。',
          effects: { mood: -8 },
          narrativeTag: '因忙误事',
        },
      },
    ],
  },
];
