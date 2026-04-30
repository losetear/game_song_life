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
  {
    id: 'family_reunion_dinner',
    name: '团圆家宴',
    goalCategory: 'family',
    weight: 6,
    cooldownDays: 60,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential'],
      season: ['冬'],
      dayRange: [80, 100],
      actorMinCopper: 20,
    },
    openingNarrative:
      '除夕将至，你在汴京的几位族中亲戚商议着一起吃个团圆饭。大家凑份子买菜做酒，热闹热闹。有人提议到你那儿聚——毕竟你住的地方还算宽敞。',
    choices: [
      {
        id: 'reunion_host',
        text: '欣然同意做东',
        condition: { field: 'copper', operator: 'gte', value: 25 },
        consequence: {
          narrative:
            '你买了鸡鸭鱼肉和好酒，和亲人们一起忙活了一整天。席间推杯换盏，叙旧话新。虽然花了不少钱，但这份温情是钱买不到的。',
          effects: { copper: -25, mood: 15, hunger: 20 },
          narrativeTag: '团圆年',
          relationChange: 6,
        },
      },
      {
        id: 'reunion_contribute',
        text: '同意但只出一份钱',
        consequence: {
          narrative:
            '你说场地没问题，但钱要大家AA。亲戚们也觉得公平。大家一起出钱出力，吃了一顿热热闹闹的年夜饭。',
          effects: { copper: -15, mood: 12, hunger: 18 },
          narrativeTag: '共度除夕',
          relationChange: 4,
        },
      },
      {
        id: 'reunion_decline',
        text: '今年不方便',
        consequence: {
          narrative:
            '你推说今年有事。亲戚们理解地去别处聚了。除夕夜你一个人吃着冷饭，听着邻里的欢声笑语，心里有些孤寂。',
          effects: { mood: -8 },
        },
      },
    ],
  },
  {
    id: 'family_elder_advice',
    name: '长者教诲',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 45,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'teahouse'],
      dayRange: [20, 999],
    },
    openingNarrative:
      '族中的一位德高望重的长辈找你谈话。他语重心长地说："你年纪也不小了，该为将来做些打算。不要只顾眼前，要着眼长远啊。"',
    choices: [
      {
        id: 'advice_listen_attentively',
        text: '虚心请教',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你恭敬地请长辈指点。他讲了做人的道理、经商的门道、处世的经验。你听得频频点头，感觉胜读十年书。临走时他还给了你一些实用的建议。',
          effects: { mood: 10 },
          narrativeTag: '受长者教诲',
          relationChange: 5,
        },
      },
      {
        id: 'advice_polite',
        text: '礼貌应付',
        consequence: {
          narrative:
            '你表面上应承着，心里并不太在意。长者看出你的敷衍，叹了口气便不再多言。你后来才意识到，他说的许多话确实有道理。',
          effects: { mood: 2 },
        },
      },
      {
        id: 'advice_decline',
        text: '委婉拒绝说教',
        consequence: {
          narrative:
            '你笑着说晚辈有自己的打算。长者也不勉强，只是意味深长地说："年轻人都这样，等吃了亏就明白了。"',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'family_cousin_competition',
    name: '堂兄弟较劲',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 50,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'street'],
      dayRange: [15, 999],
    },
    openingNarrative:
      '你的一位堂兄最近发了财，回乡来摆阔。他在酒席上得意洋洋地说起自己的生意经，言语间总带着点优越感。几个亲戚也跟着附和夸他能干。',
    choices: [
      {
        id: 'compete_congratulate',
        text: '大方祝贺',
        consequence: {
          narrative:
            '你端起酒杯："堂兄有本事，做弟弟的佩服！"堂兄很高兴，当晚也没少喝。虽然他爱显摆，但确实凭本事挣的钱，你也由衷替他高兴。',
          effects: { mood: 5 },
          narrativeTag: '堂兄和睦',
          relationChange: 3,
        },
      },
      {
        id: 'compete_show_off',
        text: '也不示弱',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你也不甘示弱，说了自己最近的一些成就。两人你来我往地较量着，其他亲戚看得直乐。酒散时你们都喝多了，但谁也没服谁。',
          effects: { copper: -20, mood: 3, health: -3 },
          narrativeTag: '兄弟较劲',
        },
      },
      {
        id: 'compete_ignore',
        text: '不参与这种比较',
        consequence: {
          narrative:
            '你低头吃饭，偶尔回应几句。这种场合多言无益，随他们去说吧。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'family_ancestral_graves',
    name: '祭扫祖坟',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 70,
    narrativeWeight: 'minor',
    conditions: {
      location: ['mountain', 'farmland'],
      season: ['春'],
      dayRange: [25, 45],
    },
    openingNarrative:
      '清明节前夕，族中组织人去祭扫祖坟。几位长辈年纪大了走不动山路，正年轻力壮的你被推举参加。这是一件关乎孝道的大事。',
    choices: [
      {
        id: 'graves_participate',
        text: '积极参加',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你和其他几个年轻人一起上山，除草、培土、上香、烧纸。站在祖先的坟前，你感受到了血脉延续的厚重。下山时族长夸你们是好后生。',
          effects: { fatigue: 10, mood: 10, health: -2 },
          narrativeTag: '祭祖功臣',
          relationChange: 4,
        },
      },
      {
        id: 'graves_pay_fine',
        text: '出钱请人代替',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative:
            '你实在走不开，出了十五文钱请族中一位年轻人代你去祭扫。虽然不是自己去的，但礼数也到了。',
          effects: { copper: -15, mood: 2 },
          narrativeTag: '出钱祭祖',
        },
      },
      {
        id: 'graves_decline',
        text: '借口不去',
        consequence: {
          narrative:
            '你说身体不适推辞了。族中长辈有些失望，但也没有勉强。后来听说祭祖时有人提到了你的名字，说希望明年你能来。',
          effects: { mood: -3 },
          narrativeTag: '缺席祭祖',
        },
      },
    ],
  },
  {
    id: 'family_rival_reconcile',
    name: '化解宿怨',
    goalCategory: 'family',
    weight: 4,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential', 'teahouse'],
      dayRange: [25, 999],
      requiredNarrativeTags: ['因忙误事', '拒绝过远亲'],
    },
    openingNarrative:
      '族中有人来为之前的不愉快向你道歉。原来之前因为一些误会，双方有些隔阂。现在对方主动来化解，希望冰释前嫌。',
    choices: [
      {
        id: 'reconcile_accept',
        text: '大度接受道歉',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative:
            '你笑着说了句"过去的事就别提了"，两人握手言和。从此族中的关系和睦了许多，大家都称赞你心胸宽广。',
          effects: { mood: 12 },
          narrativeTag: '化解恩怨',
          relationChange: 8,
        },
      },
      {
        id: 'reconcile_cautious',
        text: '表示还需要时间',
        consequence: {
          narrative:
            '你说"好吧，我看以后的表现"。对方有些尴尬，但也只能接受。你们的关系有所缓和，但恢复如初还需要时间。',
          effects: { mood: 3 },
          narrativeTag: '关系缓和',
        },
      },
      {
        id: 'reconcile_reject',
        text: '拒绝和解',
        consequence: {
          narrative:
            '你冷冷地说"有些事不是道歉就能算了"。对方悻悻地走了。族中有人说你太固执，也有人理解你的立场。',
          effects: { mood: -2 },
          narrativeTag: '记仇',
          relationChange: -3,
        },
      },
    ],
  },
  {
    id: 'family_tutor_younger',
    name: '教导后辈',
    goalCategory: 'family',
    weight: 5,
    cooldownDays: 40,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential'],
      dayRange: [18, 999],
      requiredAnyNarrativeTags: ['读过书', '学过打铁', '身手不凡'],
    },
    openingNarrative:
      '族中几个晚辈想跟你学些本事——有的想读书识字，有的想学门手艺。他们的父母也来恳求你："孩子们就佩服你，你教教他们吧。"',
    choices: [
      {
        id: 'tutor_accept',
        text: '答应教导',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你每周抽出时间教这几个晚辈。虽然占用了自己的时间，但看着他们一天天进步，心里很有成就感。孩子们的父母也常常送些土特产来感谢你。',
          effects: { mood: 12, fatigue: 5, copper: 8, hunger: 5 },
          narrativeTag: '为人师表',
          relationChange: 6,
        },
      },
      {
        id: 'tutor_part_time',
        text: '偶尔指点一下',
        consequence: {
          narrative:
            '你说自己时间有限，但可以偶尔指点。这样既尽了本分，也不会太累。孩子们也很珍惜每次请教的机会。',
          effects: { mood: 6 },
          narrativeTag: '指点过后辈',
        },
      },
      {
        id: 'tutor_decline',
        text: '现在没有精力',
        consequence: {
          narrative:
            '你婉拒了。虽然有些遗憾，但你现在确实忙于生计，分身乏术。族中人也表示理解。',
          effects: { mood: -2 },
        },
      },
    ],
  },
];
