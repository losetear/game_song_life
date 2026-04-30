import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const JIANGHU_EVENTS: BranchEvent[] = [
  {
    id: 'jianghu_arena',
    name: '擂台比武',
    goalCategory: 'jianghu',
    weight: 7,
    cooldownDays: 25,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'market'],
      dayRange: [5, 999],
      actorMinHealth: 50,
      forbiddenNarrativeTags: ['擂台冠军'],
    },
    openingNarrative:
      '城中广场搭起了擂台，看热闹的人围得水泄不通。台上一个壮汉正在叫阵："还有没有人上来？！赢了赏银十文！"台下众人面面相觑，无人敢应。',
    choices: [
      {
        id: 'arena_challenge',
        text: '上台挑战',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你跳上擂台，与壮汉交手。几回合后你抓住他的破绽，一记扫堂腿将他撂倒！人群爆发出喝彩声。你从裁判手中接过十文赏银和一条彩带——"今日擂主"。',
          effects: { copper: 10, mood: 15, health: -8, fatigue: 10 },
          narrativeTag: '擂台冠军',
          relationChange: 5,
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '擂台取胜' },
          ],
        },
      },
      {
        id: 'arena_watch',
        text: '在下面看热闹',
        consequence: {
          narrative:
            '你挤在人群中看了半天比武，虽然没上场，但学到了几招实用的格斗技巧。',
          effects: { mood: 5, fatigue: 2 },
          narrativeTag: '观摩比武',
        },
      },
      {
        id: 'arena_lose',
        text: '上去试试（可能输）',
        consequence: {
          narrative:
            '你鼓起勇气跳上擂台，但那壮汉力大如牛，三两下就将你打翻在地。你在哄笑声中灰溜溜地下了台，脸上火辣辣的疼。',
          effects: { mood: -10, health: -10, fatigue: 5 },
          narrativeTag: '擂台败北',
          relationChange: -2,
        },
      },
    ],
  },
  {
    id: 'jianghu_recruit',
    name: '帮派招新',
    goalCategory: 'jianghu',
    weight: 6,
    cooldownDays: 30,
    conditions: {
      location: ['street', 'teahouse', 'market'],
      dayRange: [10, 999],
      forbiddenNarrativeTags: ['帮派成员'],
      actorMaxMood: 80,
    },
    openingNarrative:
      '几个身穿劲装的汉子在街头散发传单："码头帮招人了！有吃有住，每月还发月钱！够胆量的来！"旁边有人悄悄拉了你一把："别去，那是黑帮。"',
    choices: [
      {
        id: 'recruit_join',
        text: '加入看看',
        consequence: {
          narrative:
            '你跟着那些汉子来到了码头的秘密据点。帮主是个独眼龙，上下打量了你一番："行，留下吧。先从跑腿做起。"从此你有了一群兄弟，但也卷入了江湖的是非恩怨。',
          effects: { copper: 15, mood: 3 },
          narrativeTag: '帮派成员',
          relationChange: 2,
        },
      },
      {
        id: 'recruit_refuse',
        text: '婉言谢绝',
        consequence: {
          narrative:
            '你摇摇头走开了。那个劝你的人拍了拍你的肩："明智的选择。"几天后你听说新加入的几个人被派去干危险的活计了……',
          effects: { mood: 2 },
        },
      },
      {
        id: 'recruit_report',
        text: '向捕快报告',
        consequence: {
          narrative:
            '你将此事告诉了捕头。他点点头："知道了，我们会留意的。"但你总觉得之后总有人在暗处盯着你。',
          effects: { mood: -3 },
          narrativeTag: '得罪了码头帮',
          relationChange: -3,
        },
      },
    ],
  },
  {
    id: 'jianghu_rescue',
    name: '江湖救急',
    goalCategory: 'jianghu',
    weight: 6,
    cooldownDays: 20,
    conditions: {
      location: ['street', 'market'],
      dayRange: [6, 999],
      actorMinCopper: 15,
    },
    openingNarrative:
      '巷子里传来呼救声。你探头一看，三个地痞正围着一个落单的武师拳打脚踢。武师已经鼻青脸肿，却还在死命护着怀中的一个包袱。',
    choices: [
      {
        id: 'rescue_help',
        text: '挺身而出',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你大喝一声冲了上去！地痞们没料到有人敢管闲事，愣了一下。武师趁机反击，你们合力将地痞们打跑。武师抱拳道谢："多谢少侠援手！在下无以为报——"他从包袱里取出一本册子，"这本拳谱送给你吧。"',
          effects: { health: -8, fatigue: 8, mood: 12 },
          narrativeTag: '江湖救急',
          relationChange: 5,
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '获赠拳谱' },
          ],
        },
      },
      {
        id: 'rescue_distract',
        text: '制造混乱让他逃脱',
        consequence: {
          narrative:
            '你大喊："捕快来了！"地痞们顿时慌了神。武师趁机带着包袱钻进了小巷。等地痞们发现上当后，你早已混入人群不见了。',
          effects: { mood: 6, fatigue: 3 },
          narrativeTag: '智救武师',
        },
      },
      {
        id: 'rescue_ignore',
        text: '多一事不如少一事',
        consequence: {
          narrative:
            '你加快脚步离开了那条巷子。身后呼救声渐渐微弱。那天晚上你辗转反侧，不知道那个武师后来怎么样了。',
          effects: { mood: -5 },
          narrativeTag: '见死不救',
        },
      },
    ],
  },
  {
    id: 'jianghu_revenge',
    name: '仇家寻仇',
    goalCategory: 'jianghu',
    weight: 5,
    cooldownDays: 35,
    conditions: {
      requiredNarrativeTags: ['打过架', '挑衅过', '威胁过人'],
      dayRange: [12, 999],
      actorMinHealth: 30,
    },
    openingNarrative:
      '你正在街上走着，忽然被人从后面拍了一下肩膀。回头一看，是之前与你结过怨的那个人——只不过这次他带了四个帮手，个个凶神恶煞。',
    choices: [
      {
        id: 'revenge_fight',
        text: '放手一搏',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你退到墙角，以一敌五！虽然挨了几拳，但你拼尽全力反抗的气势震住了对方。领头的骂了一句"算你狠"，带人走了。你知道这事没完，但至少今天保住了面子。',
          effects: { health: -15, mood: 5, fatigue: 10 },
          narrativeTag: '以寡敌众',
          relationChange: -5,
        },
      },
      {
        id: 'revenge_run',
        text: '跑！',
        consequence: {
          narrative:
            '你转身就跑，在街巷中左拐右绕，总算甩掉了追兵。躲在一个柴堆后面喘了半天粗气，身上还被推搡出了几块淤青。',
          effects: { health: -5, fatigue: 8, mood: -8 },
          narrativeTag: '狼狈逃窜',
          relationChange: -3,
        },
      },
      {
        id: 'revenge_apologize',
        text: '低头认错赔钱了事',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你双手抱拳："各位好汉，之前是在下冒犯了。"掏出二十文铜钱递过去。领头的人掂了掂铜钱："哼，这次就算了。再有下次……"他们拿着钱走了。',
          effects: { copper: -20, mood: -8 },
          narrativeTag: '花钱消灾',
          relationChange: 1,
        },
      },
    ],
  },
  {
    id: 'jianghu_manual',
    name: '武林秘籍',
    goalCategory: 'jianghu',
    weight: 4,
    cooldownDays: 50,
    narrativeWeight: 'milestone',
    conditions: {
      requiredAnyNarrativeTags: ['探索者', '古墓探宝', '地下城发现者', '古籍持有者'],
      forbiddenNarrativeTags: ['身手不凡'],
      dayRange: [18, 999],
    },
    openingNarrative:
      '你在一次探险中从一个隐蔽的夹层里发现了一本线装书册，封面上写着《归元十三式》四个字。翻开第一页，密密麻麻全是武功图解和心法口诀——这是一本失传已久的武林秘籍！',
    choices: [
      {
        id: 'manual_practice',
        text: '按图练习',
        consequence: {
          narrative:
            '你按照秘籍上的方法每日勤练不辍。起初进展缓慢，但三个月后你明显感到身手敏捷了许多，力气也大了。街坊邻居都惊讶于你的变化。',
          effects: { fatigue: 15, health: 5, mood: 10 },
          narrativeTag: '身手不凡',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '习得归元十三式' },
          ],
        },
      },
      {
        id: 'manual_sell',
        text: '卖掉换钱',
        consequence: {
          narrative:
            '你找到一位收藏家，将秘籍卖了八十文铜钱。交易完成后你有些后悔——这种东西可遇不可求啊。但看着沉甸甸的钱袋，你又觉得也许这才是正确的选择。',
          effects: { copper: 80, mood: 3 },
          narrativeTag: '卖了秘籍',
        },
      },
      {
        id: 'manual_hide',
        text: '藏起来日后再说',
        consequence: {
          narrative:
            '你将秘籍用油布包好，埋在了院子的老槐树下。等将来有空了再练也不迟……只是不知那一天什么时候会到来。',
          effects: { mood: 2 },
          narrativeTag: '藏匿秘籍',
        },
      },
    ],
  },
  {
    id: 'jianghu_escort',
    name: '镖局护送',
    goalCategory: 'jianghu',
    weight: 6,
    cooldownDays: 22,
    conditions: {
      location: ['street', 'dock', 'market'],
      requiredAnyNarrativeTags: ['身手不凡', '擂台冠军', '帮派成员'],
      actorMinHealth: 50,
      dayRange: [8, 999],
    },
    openingNarrative:
      '一位富商模样的中年人焦急地在街上寻找护卫："谁愿意护送我去邻县？路上不太平，报酬丰厚！"周围的人议论纷纷，似乎最近山匪猖獗。',
    choices: [
      {
        id: 'escort_accept',
        text: '接下这趟活',
        consequence: {
          narrative:
            '你护送富商踏上了路程。途中果然遇到了三个山匪，被你三下五除二打发了。富商感激涕零，除了约定的三十文酬金外又额外加了十文作为"茶水费"。',
          effects: { copper: 40, fatigue: 12, health: -5, mood: 12 },
          narrativeTag: '走镖经验',
          relationChange: 3,
        },
      },
      {
        id: 'escort_negotiate',
        text: '要求更高的报酬',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你说："最近山匪猖獗，四十文，少一文不干。"富商咬了咬牙答应了。一路上果然不太平，但你顺利完成了任务。富商临别时说："你这人实在，以后有活还找你。"',
          effects: { copper: 40, fatigue: 12, health: -5, mood: 8 },
          narrativeTag: '精明走镖',
        },
      },
    ],
  },
  {
    id: 'jianghu_bandit',
    name: '绿林好汉',
    goalCategory: 'jianghu',
    weight: 5,
    cooldownDays: 28,
    conditions: {
      location: ['mountain', 'farmland', 'dock'],
      dayRange: [10, 999],
      forbiddenNarrativeTags: ['绿林中人'],
    },
    openingNarrative:
      '山林小径上，一队商旅被几个蒙面人拦住了去路。奇怪的是，那些蒙面人只拿了货物的一部分，还留下了足够的干粮给商旅，并说："山里不容易，大家都不容易。"',
    choices: [
      {
        id: 'bandit_join_chat',
        text: '上前与他们攀谈',
        consequence: {
          narrative:
            '你等商旅走远后跟了上去。蒙面人们警惕地看着你，领头的开口："想入伙？还是想报官？"经过长谈你才知道，这些人都是被官府逼得无路可走的百姓，劫富济贫是他们唯一的出路。',
          effects: { mood: 5, fatigue: 3 },
          narrativeTag: '结识绿林',
          relationChange: 2,
        },
      },
      {
        id: 'bandit_warn',
        text: '警告他们不要再来',
        consequence: {
          narrative:
            '你大声说："再让我看到你们拦路抢劫，我一定报官！"领头的蒙面人冷笑一声："官？官什么时候管过我们老百姓的死活？"说完扬长而去。',
          effects: { mood: -2 },
          narrativeTag: '警告过绿林',
          relationChange: -2,
        },
      },
    ],
  },
  {
    id: 'jianghu_sect_conflict',
    name: '门派纷争',
    goalCategory: 'jianghu',
    weight: 4,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'teahouse', 'workshop'],
      requiredAnyNarrativeTags: ['身手不凡', '帮派成员', '结识绿林'],
      dayRange: [15, 999],
    },
    openingNarrative:
      '城中两大武馆——青龙堂和白虎门的弟子在街头起了冲突，双方各不相让，眼看就要动手。围观者越聚越多，有人已经在喊"打了打了"！',
    choices: [
      {
        id: 'sect_mediate',
        text: '出面调停',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你站到双方中间："各位都是练武之人，在街头斗殴岂不让人笑话？"你凭借自己在江湖上的几分薄面，苦口婆心地劝说了半柱香的功夫，双方终于各自散去。两位掌门都记住了你这个人物。',
          effects: { mood: 10, fatigue: 5 },
          narrativeTag: '调停纷争',
          relationChange: 8,
        },
      },
      {
        id: 'sect_join_one',
        text: '选择一方站队',
        consequence: {
          narrative:
            '你观察了一下形势，选择了看起来更有理的一方加入了战团。混战中你帮对方打倒了两个人，自己也挂了彩。事后那方的人请你喝酒，认你做了兄弟。',
          effects: { health: -10, fatigue: 10, mood: 5 },
          narrativeTag: '卷入门派之争',
          relationChange: 5,
          transformations: [
            { type: 'gain_tag', value: '帮派成员', description: '加入某一方势力' },
          ],
        },
      },
      {
        id: 'sect_leave',
        text: '不掺和这浑水',
        consequence: {
          narrative:
            '你悄悄退出了人群。后来听说那次冲突惊动了官府，参与打架的人都被抓去了。你不禁庆幸自己当时走得快。',
          effects: { mood: 2 },
          narrativeTag: '明哲保身',
        },
      },
    ],
  },
  {
    id: 'jianghu_hidden_master',
    name: '隐世高手',
    goalCategory: 'jianghu',
    weight: 3,
    cooldownDays: 55,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain', 'temple', 'residential'],
      requiredAnyNarrativeTags: ['身手不凡', '擂台冠军'],
      dayRange: [25, 999],
      forbiddenNarrativeTags: ['名师指点'],
    },
    openingNarrative:
      '你在山中一座破庙里避雨时，看到一个白发老者在廊下以树枝为剑舞动。看似随意的动作中蕴含着你完全无法理解的力量——每一招都仿佛暗合天道。老人收势回头，目光如电："你想学？"',
    choices: [
      {
        id: 'master_bow',
        text: '恭敬拜师',
        consequence: {
          narrative:
            '你当即跪地磕头。老人微微点头："有点眼力。我这里不收学费，只收诚意。每天寅时来这里，风雨无阻。"从此你开始了艰苦而充实的修行之路。',
          effects: { mood: 15, fatigue: 5 },
          narrativeTag: '名师指点',
          transformations: [
            { type: 'gain_tag', value: '隐世高徒', description: '拜隐世高手为师' },
          ],
        },
      },
      {
        id: 'master_ask_name',
        text: '先请教前辈名号',
        consequence: {
          narrative:
            "你拱手问道：\"前辈尊姓大名？\"老人哈哈大笑：\"名字不过是个符号。三十年前有人叫我『追风剑』，现在嘛——不过是个糟老头子罢了。\"他没有答应教你，但临走时在你掌心写了一套呼吸法的口诀。",
          effects: { mood: 8, health: 5 },
          narrativeTag: '得获口诀',
        },
      },
    ],
  },
  {
    id: 'jianghu_rumor',
    name: '江湖传言',
    goalCategory: 'jianghu',
    weight: 6,
    cooldownDays: 18,
    conditions: {
      location: ['teahouse', 'street', 'market'],
      dayRange: [5, 999],
    },
    openingNarrative:
      '茶馆里沸沸扬扬地传着一个消息：据说前朝的一位将军埋了一批军火在城外的某个地方，具体位置无人知晓。有人说在山里，有人说在河边，还有人说是就在城中的某口枯井下。',
    choices: [
      {
        id: 'rumor_investigate',
        text: '四处打听更多细节',
        consequence: {
          narrative:
            '你花了几天时间向不同的人打听消息，逐渐拼凑出了一些线索：将军姓李，埋藏地点应该在一棵"三人合抱的大树"附近。你把这些信息默默记在心里。',
          effects: { copper: -3, fatigue: 5, mood: 5 },
          narrativeTag: '追寻军火传说',
        },
      },
      {
        id: 'rumor_spread',
        text: '把这个消息传播出去',
        consequence: {
          narrative:
            '你添油加醋地把这个消息讲给了更多人听。很快整个汴京都在讨论这件事。官府开始派人搜查"可疑分子"，搞得人心惶惶。',
          effects: { mood: 3 },
          narrativeTag: '传播江湖传言',
          relationChange: 2,
        },
      },
      {
        id: 'rumor_ignore',
        text: '当个故事听听算了',
        consequence: {
          narrative:
            '你摇摇头继续喝茶。这种传言隔三差五就会冒出来一个，多半是空穴来风。',
          effects: { mood: 1 },
        },
      },
    ],
  },
  {
    id: 'jianghu_duel_invitation',
    name: '决斗邀约',
    goalCategory: 'jianghu',
    weight: 5,
    cooldownDays: 40,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'teahouse', 'residential'],
      requiredAnyNarrativeTags: ['身手不凡', '擂台冠军'],
      dayRange: [20, 999],
      actorMinHealth: 50,
    },
    openingNarrative:
      '一个年轻剑客找到你，递上拜帖："家师听闻阁下身手不凡，特派在下前来邀约，三日后城外十里亭切磋一二，点到为止。"对方态度恭敬，但字里行间透着几分不怀好意。',
    choices: [
      {
        id: 'duel_accept',
        text: '接受挑战',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative:
            '你如期赴约。对方的师父是一位中年剑客，剑法凌厉。你们斗了百十回合不分胜负，最后收剑言和。对方说"后生可畏"，你从他身上也学到了不少。',
          effects: { health: -8, fatigue: 12, mood: 15 },
          narrativeTag: '剑客切磋',
          relationChange: 6,
        },
      },
      {
        id: 'duel_decline_polite',
        text: '婉拒',
        consequence: {
          narrative:
            '你拱手道："在下愧不敢当，请代我向令师致歉。"年轻人有些失望，但也只能作罢。后来你听说那个门派四处找人比武，赢的少输的多……',
          effects: { mood: 2 },
        },
      },
      {
        id: 'duel_trap',
        text: '怀疑有诈，先调查',
        consequence: {
          narrative:
            '你没有立刻答应，而是托人打听了那个门派的底细。原来他们专门用这种方式设局讹钱！你回绝了邀请，避免了麻烦。',
          effects: { copper: -2, mood: 8 },
          narrativeTag: '识破阴谋',
        },
      },
    ],
  },
  {
    id: 'jianghu_bounty_hunter',
    name: '悬赏通缉',
    goalCategory: 'jianghu',
    weight: 5,
    cooldownDays: 45,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'teahouse', 'market'],
      dayRange: [15, 999],
      requiredAnyNarrativeTags: ['身手不凡', '帮派成员'],
      actorMinHealth: 45,
    },
    openingNarrative:
      '官府贴出告示：悬赏五十文捉拿一名逃犯。此人武功不弱，已经伤了三名捕快。告示前围满了江湖人士——有人想发财，有人想扬名。',
    choices: [
      {
        id: 'bounty_pursue',
        text: '参与追捕',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你根据线索追踪了三天，终于在城外破庙中发现了逃犯。经过一番恶斗，你将其制服带回衙门。五十文赏金到手，你在江湖上也小有名气了。',
          effects: { copper: 50, health: -12, fatigue: 15, mood: 18 },
          narrativeTag: '捕快助手',
          relationChange: 10,
        },
      },
      {
        id: 'bounty_cooperate',
        text: '和捕快合作',
        consequence: {
          narrative:
            '你主动找到负责此案的捕头，提供线索并协助布控。逃犯被捕后，捕快分给你二十文钱："多谢兄弟帮忙，这是你应得的。"',
          effects: { copper: 20, mood: 10 },
          narrativeTag: '协助捕快',
          relationChange: 8,
        },
      },
      {
        id: 'bounty_ignore',
        text: '不参与此事',
        consequence: {
          narrative:
            '这种事风险太大，你不想惹麻烦。后来听说逃犯被一个武林高手抓住了，那个高手得了五十文赏金，在江湖上声名大噪。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'jianghu_secret_society',
    name: '秘密会社',
    goalCategory: 'jianghu',
    weight: 4,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['teahouse', 'street', 'residential'],
      dayRange: [30, 999],
      actorMinCopper: 30,
      forbiddenNarrativeTags: ['秘密会社成员'],
    },
    openingNarrative:
      '深夜，一个神秘人找到你，递上一块黑铁令牌："我们看中你的才能，想邀请你加入。入会费三十文，每月可分红，遇事有兄弟照应。当然，有些事是秘密，不可对外人道。"',
    choices: [
      {
        id: 'society_join',
        text: '加入秘密会社',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你交了入会费，成了这个秘密会社的成员。他们原来是互助性质的地下组织，成员来自各行各业，彼此照应。你在城里多了一张保护网，但也背负了保密的义务。',
          effects: { copper: -30, mood: 10 },
          narrativeTag: '秘密会社成员',
          relationChange: 5,
        },
      },
      {
        id: 'society_investigate',
        text: '先调查一下底细',
        consequence: {
          narrative:
            '你没有贸然加入，而是托人打听了这个组织的来历。原来他们确实是互助性质，但也做过一些灰色的事。你权衡再三，决定还是不卷入为好。',
          effects: { copper: -5, mood: 3 },
          narrativeTag: '了解过秘密会社',
        },
      },
      {
        id: 'society_refuse',
        text: '拒绝邀请',
        consequence: {
          narrative:
            '你摇摇头拒绝了。神秘人也不纠缠，只是说："机会只有一次，好自为之。"后来你听说加入他们的人有的发了财，有的惹了麻烦……',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'jianghu_martial_manual',
    name: '武林秘籍',
    goalCategory: 'jianghu',
    weight: 4,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'street', 'teahouse'],
      dayRange: [25, 999],
      requiredAnyNarrativeTags: ['身手不凡', '身手不凡'],
      actorMinCopper: 20,
    },
    openingNarrative:
      '集市地摊上，一本破旧的书册引起了你的注意。摊主神神秘秘地说："这是前朝一位武学大家的遗作，里面记载着绝世武功。五十文，不二价。"翻开一看，里面确实有些奇怪的图画和文字。',
    choices: [
      {
        id: 'manual_buy',
        text: '买下来研究',
        condition: { field: 'copper', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你花了五十文买下那本书。回家仔细研读，虽然有些内容看不懂，但你照着练习了几个月，身手确实有了进步。后来听行家说，这本书确实有些价值。',
          effects: { copper: -50, mood: 15, health: 5 },
          narrativeTag: '得获秘籍',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '通过秘籍提升武功' },
          ],
        },
      },
      {
        id: 'manual_bargain',
        text: '讨价还价',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你和摊主讨价还价，最后以三十文成交。虽然拿到手了，但你总觉得可能是被忽悠了——这本书看起来太破了，能是真的吗？',
          effects: { copper: -30, mood: 5 },
          narrativeTag: '买了本可疑的书',
        },
      },
      {
        id: 'manual_ignore',
        text: '不上当',
        consequence: {
          narrative:
            '你摇摇头走开了。后来听说有人买到了真秘籍，也有人买到了废纸。这种事情真假难辨，还是算了。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'jianghu_escort_mission',
    name: '护送任务',
    goalCategory: 'jianghu',
    weight: 5,
    cooldownDays: 38,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'teahouse', 'street'],
      dayRange: [18, 999],
      requiredAnyNarrativeTags: ['身手不凡', '帮派成员'],
      actorMinHealth: 50,
    },
    openingNarrative:
      '一位富商在茶馆寻找护卫："有一批货物要运往邻州，路上不太平。酬劳二十文，来回十天。需要身手好的。"周围几个武林人士已经开始打听了。',
    choices: [
      {
        id: 'escort_accept',
        text: '接受任务',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你接下了这个活。路上果然遇到了一伙劫匪，你奋力保护货物，虽然受了些伤，但货物完好无损地送到。富商很满意，额外赏了你五文钱。',
          effects: { copper: 25, health: -8, fatigue: 18, mood: 12 },
          narrativeTag: '完成护送',
          relationChange: 6,
        },
      },
      {
        id: 'escort_gather_info',
        text: '先打听路线情况',
        consequence: {
          narrative:
            '你没有立刻接下，而是向熟悉路况的人打听。原来那条路最近确实不太平，已经好几批商队被劫了。你庆幸自己没有贸然接活——这趟差事风险太大。',
          effects: { copper: -2, mood: 3 },
          narrativeTag: '谨慎行事',
        },
      },
      {
        id: 'escort_decline',
        text: '风险太大，拒绝',
        consequence: {
          narrative:
            '你婉言谢绝了。后来听说接活的人在路上遇劫，一人受了重伤。你心里暗自庆幸没有接这趟活。',
          effects: { mood: 2 },
        },
      },
    ],
  },
  {
    id: 'jianghu_tavern_brawl',
    name: '酒馆斗殴',
    goalCategory: 'jianghu',
    weight: 6,
    cooldownDays: 20,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse', 'market'],
      dayRange: [8, 999],
      actorMinHealth: 45,
    },
    openingNarrative:
      '酒馆里几个醉汉开始寻衅滋事，掀翻了邻桌的酒菜。有人劝架，结果被打了。场面眼看就要失控，酒保急得团团转却不敢上前。',
    choices: [
      {
        id: 'brawl_stop',
        text: '出面制止',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你站起来走到醉汉面前："各位，差不多就行了。"领头醉汉挥拳就打，你侧身避开，一招将他制服在地。其他醉汉见状都清醒了七分，乖乖赔了钱溜了。',
          effects: { health: -3, mood: 10, fatigue: 5 },
          narrativeTag: '制止斗殴',
          relationChange: 5,
        },
      },
      {
        id: 'brawl_help_victim',
        text: '帮被打的人',
        consequence: {
          narrative:
            '你没有直接和醉汉对上，而是把被打的人扶到安全地带。那人连连道谢，非要请你喝酒。',
          effects: { mood: 6, copper: -3, hunger: 5 },
          narrativeTag: '帮助受害者',
        },
      },
      {
        id: 'brawl_leave',
        text: '不惹麻烦',
        consequence: {
          narrative:
            '你趁乱结账离开了。后来听说醉汉们被赶来的巡街捕快带走了，酒馆一片狼藉。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'jianghu_weapon_master',
    name: '兵器大师',
    goalCategory: 'jianghu',
    weight: 4,
    cooldownDays: 50,
    narrativeWeight: 'major',
    conditions: {
      location: ['workshop', 'market'],
      dayRange: [22, 999],
      requiredAnyNarrativeTags: ['身手不凡', '擂台冠军'],
      actorMinCopper: 40,
    },
    openingNarrative:
      '城中来了一位据说曾是军中兵器大师的铁匠，手艺绝伦。他开的铺子门口排起了长龙，都想求得一把神兵利器。但大师脾气古怪，不是有钱就能买到。',
    choices: [
      {
        id: 'weapon_request',
        text: '请大师打造兵器',
        condition: { field: 'copper', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你在门口等了三天，终于见到了大师。他上下打量你一番："你有武人的眼神，好，我给你打一把。"又等了七天，你得到了一把精钢刀，削铁如泥！五十文花得值。',
          effects: { copper: -50, mood: 20, fatigue: 8 },
          narrativeTag: '神兵在手',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '获得精良兵器' },
          ],
        },
      },
      {
        id: 'weapon_apprentice',
        text: '想拜师学艺',
        consequence: {
          narrative:
            '你提出想学他的手艺。大师摇头："我这套手艺传男不传女，而且……算了，看你是块料，教你几招实用的吧。"你学到了一些兵器保养和简单的锻造知识。',
          effects: { mood: 8 },
          narrativeTag: '学过锻造',
        },
      },
      {
        id: 'weapon_wait',
        text: '排队太久了，放弃',
        consequence: {
          narrative:
            '你看了看那长长的队伍，摇摇头走了。后来听说买到大师兵器的人都如获至宝，你有些后悔当初没有坚持。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'jianghu_underground_arena',
    name: '地下斗技',
    goalCategory: 'jianghu',
    weight: 4,
    cooldownDays: 42,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'teahouse'],
      dayRange: [20, 999],
      requiredAnyNarrativeTags: ['身手不凡', '擂台冠军'],
      actorMinHealth: 55,
      forbiddenNarrativeTags: ['地下斗士'],
    },
    openingNarrative:
      '有人暗中找到你，低声说："城外地窖里每晚都有地下比武，赌注很大。你身手不错，要不要来试试？赢了能翻倍，输了……就当被打一顿吧。"',
    choices: [
      {
        id: 'underground_fight',
        text: '去试试',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative:
            '你去了地下竞技场，押了自己十文钱。三场比武下来，你赢了两场输了一场，最后净赚十五文！虽然身上挂了彩，但钱包鼓了不少。',
          effects: { copper: 15, health: -10, fatigue: 12, mood: 8 },
          narrativeTag: '地下斗士',
        },
      },
      {
        id: 'underground_lose',
        text: '去试试（可能输）',
        consequence: {
          narrative:
            '你去了地下竞技场，但对手太强，第一场就被打趴下了。赌输的十文钱不算什么，主要是丢脸。',
          effects: { copper: -10, health: -15, fatigue: 8, mood: -10 },
          narrativeTag: '地下斗败',
        },
      },
      {
        id: 'underground_decline',
        text: '太危险，不参与',
        consequence: {
          narrative:
            '你拒绝了。后来听说那个地下竞技场被官府抄了，参与的人都被抓了。你庆幸自己没有卷进去。',
          effects: { mood: 2 },
        },
      },
    ],
  },
];
