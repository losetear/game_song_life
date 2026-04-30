import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const CULTURE_EVENTS: BranchEvent[] = [
  {
    id: 'culture_lantern',
    name: '元宵灯谜',
    goalCategory: 'culture',
    weight: 8,
    cooldownDays: 60,
    narrativeWeight: 'major',
    conditions: {
      season: ['春'],
      dayRange: [1, 15],
      location: ['street', 'market'],
    },
    openingNarrative:
      '正月十五，汴京城中张灯结彩。大街上挂满了各式各样的花灯——兔子灯、莲花灯、宫灯……猜中灯谜的人可以赢得彩头。你挤在人群中，被一盏造型别致的灯笼吸引住了目光。',
    choices: [
      {
        id: 'lantern_guess',
        text: '猜灯谜',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你盯着灯谜想了半天——"画时圆，写时方，冬时短，夏时长。"你眼睛一亮："是日字！"摊主竖起大拇指："答对了！这盏灯笼归你了！"你提着灯笼走在街上，心里美滋滋的。',
          effects: { mood: 12, copper: 3 },
          narrativeTag: '灯谜高手',
          relationChange: 3,
        },
      },
      {
        id: 'lantern_buy',
        text: '直接买一盏',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative:
            '你没那个脑力猜谜，干脆花五文钱买了一盏小灯笼。虽然不是赢来的，但提着它走在灯火通明的大街上，也算应景了。',
          effects: { copper: -5, mood: 6 },
        },
      },
      {
        id: 'lantern_enjoy',
        text: '只看不参与',
        consequence: {
          narrative:
            '你在人群中穿梭欣赏各色花灯，听着周围人的欢声笑语，感受着节日的气氛。虽然没有赢到什么，但这份热闹已经让你心情好了很多。',
          effects: { mood: 8, fatigue: 3 },
          narrativeTag: '赏灯',
        },
      },
    ],
  },
  {
    id: 'culture_qingming',
    name: '清明祭祖',
    goalCategory: 'culture',
    weight: 7,
    cooldownDays: 60,
    conditions: {
      season: ['春'],
      dayRange: [20, 40],
      location: ['farmland', 'mountain'],
    },
    openingNarrative:
      '清明时节雨纷纷，路上行人欲断魂。你备了些纸钱和供品，前往郊外祖先的坟茔祭拜。细雨蒙蒙，远山如黛，新绿的柳枝在风中摇曳。',
    choices: [
      {
        id: 'qingming_proper',
        text: '郑重祭拜',
        consequence: {
          narrative:
            '你清扫了墓碑周围的杂草，摆上供品，恭恭敬敬地磕了三个头。轻烟袅袅中，你低声诉说着近来的境遇，仿佛先人们能听到一般。心中感到一种莫名的安宁。',
          effects: { mood: 8, fatigue: 5, copper: -2 },
          narrativeTag: '孝子贤孙',
        },
      },
      {
        id: 'qingming_spring_outing',
        text: '顺便踏青游玩',
        consequence: {
          narrative:
            '祭拜之后你没有急着回去，而是在田野间漫步。春日的田野开满了野花，几个孩童在放风筝。你躺在草地上看着天空，不知不觉竟睡着了。',
          effects: { mood: 10, fatigue: -8, hunger: -5 },
          narrativeTag: '踏青',
        },
      },
    ],
  },
  {
    id: 'culture_dragon_boat',
    name: '端午竞渡',
    goalCategory: 'culture',
    weight: 7,
    cooldownDays: 60,
    narrativeWeight: 'major',
    conditions: {
      season: ['夏'],
      dayRange: [50, 70],
      location: ['dock', 'riverbank', 'street'],
    },
    openingNarrative:
      '端午佳节，汴河两岸人山人海。河面上几条龙舟蓄势待发，鼓手们赤膊击鼓，桨手们摩拳擦掌。岸上的呐喊声震耳欲聋——"加油！加油！"',
    choices: [
      {
        id: 'boat_race',
        text: '报名参加划船比赛',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你临时加入了一支人手不足的队伍。比赛中你们配合默契，虽然没拿第一，但也得了第三名！每人分到了五文奖金和一只香囊。累是累了点，但痛快！',
          effects: { copper: 5, health: -5, fatigue: 15, mood: 15 },
          narrativeTag: '龙舟选手',
          relationChange: 4,
        },
      },
      {
        id: 'boat_cheer',
        text: '在岸边呐喊助威',
        consequence: {
          narrative:
            '你跟着人群一起喊破了嗓子，为选手们加油鼓劲。旁边一位大娘还塞给你一个粽子："吃吧，过节呢！"粽子的甜糯让你想起了家乡的味道。',
          effects: { hunger: 10, mood: 10, fatigue: 2 },
          narrativeTag: '观赛助威',
        },
      },
      {
        id: 'boat_bet',
        text: '赌哪条船会赢',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative:
            '你压了三文钱在你看好的那条船上。结果那条船真的赢了！庄家赔了你八文。你拿着赚来的钱，心情格外舒畅。',
          effects: { copper: 5, mood: 10 },
          narrativeTag: '赌对了',
        },
      },
    ],
  },
  {
    id: 'culture_mid_autumn',
    name: '中秋赏月',
    goalCategory: 'culture',
    weight: 7,
    cooldownDays: 60,
    narrativeWeight: 'major',
    conditions: {
      season: ['秋'],
      dayRange: [80, 100],
      weather: ['晴'],
    },
    openingNarrative:
      '八月十五中秋夜，一轮明月高悬天际。街市上摆满了月饼和时令水果，家家户户在院中设案焚香拜月。空气中弥漫着桂花酒的香气。',
    choices: [
      {
        id: 'moon_admire',
        text: '对月独酌',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative:
            '你买了一壶桂花酒、几块月饼，坐在屋顶上对着月亮自斟自饮。月色如水，酒意微醺，你想起了远方的家人和这些年的经历，不禁有些感伤，又有些释然。',
          effects: { copper: -8, mood: 10, fatigue: -5, hunger: 8 },
          narrativeTag: '中秋独酌',
        },
      },
      {
        id: 'moon_social',
        text: '参加邻里的赏月聚会',
        consequence: {
          narrative:
            '隔壁王婆子招呼你去院子里一起赏月。十几个人围坐在一起吃月饼聊家常，有人弹起了琵琶唱起了曲子。你在这个陌生的城市里感受到了久违的温暖。',
          effects: { mood: 14, hunger: 10, fatigue: -3 },
          narrativeTag: '邻里团圆',
          relationChange: 4,
        },
      },
    ],
  },
  {
    id: 'culture_double_ninth',
    name: '重阳登高',
    goalCategory: 'culture',
    weight: 6,
    cooldownDays: 60,
    conditions: {
      season: ['秋'],
      dayRange: [100, 120],
      location: ['mountain'],
    },
    openingNarrative:
      '九九重阳，登高望远。山中游人如织，路边插满了茱萸枝。山顶的风光尽收眼底——汴京城在暮色中显得格外壮丽，炊烟袅袅升起，宛如一幅水墨画卷。',
    choices: [
      {
        id: 'ninth_climb',
        text: '登顶眺望',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你一口气爬到了最高处，极目远眺。秋风拂面，胸中的郁结似乎都被吹散了。旁边一位老者与你攀谈起来，原来他是隐居此山的读书人，谈吐不凡。',
          effects: { fatigue: 10, mood: 12, health: 2 },
          narrativeTag: '登高望远',
          relationChange: 2,
        },
      },
      {
        id: 'ninth_halfway',
        text: '爬到半山腰就休息',
        consequence: {
          narrative:
            '你爬到半山腰就气喘吁吁了，找块大石头坐下歇息。虽然没能登顶，但半山的风景也别有一番风味。',
          effects: { fatigue: 6, mood: 6 },
          narrativeTag: '半山小憩',
        },
      },
    ],
  },
  {
    id: 'culture_temple_fair_culture',
    name: '庙会杂耍',
    goalCategory: 'culture',
    weight: 7,
    cooldownDays: 45,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'market', 'temple'],
      dayRange: [1, 999],
      actorMinCopper: 5,
    },
    openingNarrative:
      '相国寺前的广场上热闹非凡——杂耍艺人吞剑喷火、说书人拍案惊堂、耍猴的敲着铜锣、卖糖人的捏出各种造型。空气中混合着香火味和零食的香气。',
    choices: [
      {
        id: 'fair_watch',
        text: '到处逛逛看表演',
        consequence: {
          narrative:
            '你从早看到晚，杂耍看了三场戏听了两回，还买了个糖人边走边吃。口袋里的铜钱少了七八文，但心里充实得很。',
          effects: { copper: -7, mood: 12, fatigue: 5, hunger: 5 },
          narrativeTag: '庙会常客',
        },
      },
      {
        id: 'fair_perform',
        text: '上台露一手（如果身手好）',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative:
            '杂耍班子的班头正在招临时帮手，你上去表演了一套翻跟头的功夫，赢得了满堂喝彩。班头硬塞给你五文钱："有空来跟着我干！"',
          effects: { copper: 5, mood: 15, fatigue: 8 },
          narrativeTag: '登台献艺',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'culture_imperial_exam',
    name: '科举放榜',
    goalCategory: 'culture',
    weight: 4,
    cooldownDays: 120,
    narrativeWeight: 'milestone',
    conditions: {
      season: ['春', '秋'],
      dayRange: [40, 999],
      requiredAnyNarrativeTags: ['读过书', '书生'],
    },
    openingNarrative:
      '贡院门口贴出了新科榜单，围观的人群水泄不通。上榜者的名字用红笔写着，一个个被人指指点点。落榜者灰溜溜地从侧门出来，有的掩面而泣，有的仰天长叹。',
    choices: [
      {
        id: 'exam_check',
        text: '挤进去看看有没有认识的人',
        consequence: {
          narrative:
            '你踮起脚尖在榜单上搜寻——虽然你的名字不在上面，但你看到了一个熟悉的名字：赵秀才中了举人！你替他高兴的同时也有些感慨：什么时候轮到自己呢？',
          effects: { mood: -2, fatigue: 3 },
          narrativeTag: '见证放榜',
        },
      },
      {
        id: 'exam_comfort',
        text: '安慰落榜的人',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你看到一个年轻书生蹲在墙角哭，走过去递给他一块手帕："胜败乃兵家常事，下次再来便是。"他抬起头感激地看了你一眼。后来你听说这个人三年后真的中了进士，还托人向你道谢。',
          effects: { mood: 5, fatigue: 2 },
          narrativeTag: '善缘',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'culture_storytelling',
    name: '说书听曲',
    goalCategory: 'culture',
    weight: 7,
    cooldownDays: 15,
    conditions: {
      location: ['teahouse'],
      actorMinCopper: 3,
    },
    openingNarrative:
      '茶馆里座无虚席，说书先生正讲到精彩处——"只见那武松举起碗来，咕咚咕咚就是十八碗！"全场屏息凝神，连喝茶的人都忘了放下杯子。',
    choices: [
      {
        id: 'story_listen',
        text: '坐下听到底',
        consequence: {
          narrative:
            '你叫了一壶茶，从头听到尾。说书先生讲的是《水浒传》中武松打虎的段落，讲得那是绘声绘色、扣人心弦。听完之后你还沉浸在那个豪情万丈的世界里。',
          effects: { copper: -3, mood: 10, fatigue: 3, hunger: 3 },
          narrativeTag: '说书迷',
        },
      },
      {
        id: 'story_tip',
        text: '打赏说书先生',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative:
            '你说书说得真好！又额外打了五文钱的赏。说书先生抱拳致谢："多谢这位客官！下回给您留个好位子！"以后你来茶馆总能得到最好的位置。',
          effects: { copper: -8, mood: 12 },
          narrativeTag: '说书的贵客',
          relationChange: 2,
        },
      },
    ],
  },
  {
    id: 'culture_calligraphy',
    name: '书法雅集',
    goalCategory: 'culture',
    weight: 5,
    cooldownDays: 35,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse', 'academy', 'temple'],
      dayRange: [5, 999],
      season: ['春', '秋'],
      actorMinCopper: 10,
    },
    openingNarrative:
      '几位文人墨客在茶馆雅座举办书法雅集，桌上铺满了宣纸和笔墨。一位老者正在挥毫泼墨，笔走龙蛇。众人围在一旁品评点头，空气中弥漫着墨香。',
    choices: [
      {
        id: 'calligraphy_watch',
        text: '在一旁观摩',
        consequence: {
          narrative:
            '你静静地站在一旁观看。老者写的是《兰亭集序》，一笔一划都透着功力。虽然自己不会写，但光看着都觉得是一种享受。老者写完，注意到你的专注，微微点头致意。',
          effects: { mood: 10, fatigue: 2 },
          narrativeTag: '观摩过书法',
        },
      },
      {
        id: 'calligraphy_try',
        text: '试着写几笔',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative:
            '你花了五文钱买了纸笔，鼓起勇气写了几笔。虽然功底不足，但字形还算端正。旁边一位文人鼓励道："初学者能写成这样，不错不错，多加练习必有进步。"',
          effects: { copper: -15, mood: 8 },
          narrativeTag: '学过书法',
          transformations: [
            { type: 'gain_tag', value: '写过书法', description: '初次尝试书法' },
          ],
        },
      },
      {
        id: 'calligraphy_appreciate',
        text: '欣赏后就离开',
        consequence: {
          narrative:
            '你虽然不会书法，但能看出这些作品的精妙。欣赏了片刻，你悄然离开，心中对这些文化传承者心生敬意。',
          effects: { mood: 6 },
        },
      },
    ],
  },
  {
    id: 'culture_opera',
    name: '戏曲演出',
    goalCategory: 'culture',
    weight: 6,
    cooldownDays: 25,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse', 'street'],
      dayRange: [3, 999],
      actorMinCopper: 8,
    },
    openingNarrative:
      '戏台上锣鼓喧天，一出《牡丹亭》正在上演。杜丽娘的水袖甩得如行云流水，唱腔婉转动人。台下观众看得如痴如醉，有的还跟着哼唱起来。',
    choices: [
      {
        id: 'opera_watch_full',
        text: '从头看到尾',
        consequence: {
          narrative:
            '你找了个位置坐下，看了整整一出戏。虽然有些唱词听不太懂，但演员的身段和唱功让你深深着迷。戏散场后你还久久不能平静。',
          effects: { copper: -8, mood: 14, hunger: 5, fatigue: 5 },
          narrativeTag: '戏迷',
        },
      },
      {
        id: 'opera_backstage',
        text: '后台看看',
        consequence: {
          narrative:
            '你溜到后台，看演员们化妆卸妆。那位演杜丽娘的旦角卸了妆原来是个中年汉子！他笑着说："怎么样，戏好看吧？"你连连点头。',
          effects: { mood: 8 },
          narrativeTag: '见过戏子后台',
        },
      },
      {
        id: 'opera_half',
        text: '看半场就走',
        consequence: {
          narrative:
            '你看了半场就因为有事离开了。虽然没看完，但那段经典的唱腔你记在了心里，嘴里哼哼着走了好远。',
          effects: { copper: -5, mood: 6 },
        },
      },
    ],
  },
  {
    id: 'culture_book_repair',
    name: '古籍修复',
    goalCategory: 'culture',
    weight: 4,
    cooldownDays: 40,
    narrativeWeight: 'major',
    conditions: {
      location: ['academy', 'temple', 'workshop'],
      dayRange: [15, 999],
      requiredAnyNarrativeTags: ['读过书', '书生', '细心'],
    },
    openingNarrative:
      '书院的老馆长愁眉不展——一批珍贵的古籍因为年代久远，书页脆化严重，急需修复。他正在寻找有耐心、有文采的人来帮忙这项抢救工作。',
    choices: [
      {
        id: 'repair_volunteer',
        text: '帮忙修复',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你花了一周时间，小心翼翼地修复了三本古籍。工作中你读到了许多有趣的内容，从历史典故到民间偏方应有尽有。老馆长非常感激，送了你一套文房四宝。',
          effects: { mood: 15, fatigue: 10, copper: 5 },
          narrativeTag: '古籍修复师',
          transformations: [
            { type: 'gain_tag', value: '见闻广博', description: '修复过珍贵古籍' },
          ],
        },
      },
      {
        id: 'repair_learn',
        text: '学习修复技术',
        consequence: {
          narrative:
            '你没有直接上手，而是跟在老师傅后面学习。从纸张的选择到浆糊的调制，你都认真记下。师傅说："这手艺需要极大的耐心，你倒是有这份心。"',
          effects: { mood: 8 },
          narrativeTag: '学过古籍修复',
        },
      },
      {
        id: 'repair_decline',
        text: '太费时了，婉拒',
        consequence: {
          narrative:
            '你摇摇头离开了。这项工作需要投入太多时间，你目前还有更重要的事情要做。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'culture_tea_ceremony',
    name: '茶道品茗',
    goalCategory: 'culture',
    weight: 5,
    cooldownDays: 30,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse', 'temple'],
      dayRange: [8, 999],
      actorMinCopper: 15,
      season: ['春', '秋'],
    },
    openingNarrative:
      '茶馆里举办了一场茶道表演。茶艺师穿着素雅的服饰，动作行云流水般优雅——洗茶、冲泡、分茶，每一个环节都充满仪式感。茶香袅袅，让人心神俱静。',
    choices: [
      {
        id: 'tea_participate',
        text: '参加品茶',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你花了二十文茶资，坐在前排细细品味。这茶确实不凡——入口微苦，回甘悠长，仿佛喝下去的不是茶而是禅意。茶艺师还亲自为你讲解茶道的历史和讲究。',
          effects: { copper: -20, mood: 12, fatigue: -5 },
          narrativeTag: '品过好茶',
          transformations: [
            { type: 'gain_tag', value: '懂茶', description: '学习过茶道' },
          ],
        },
      },
      {
        id: 'tea_watch',
        text: '只看不喝',
        consequence: {
          narrative:
            '你站在一旁观看整个表演过程。虽然没喝到茶，但光是看着那优雅的动作就让人赏心悦目。你学会了基本的泡茶手法，以后自己在家也可以试试。',
          effects: { mood: 7 },
          narrativeTag: '观摩过茶道',
        },
      },
      {
        id: 'tea_chat',
        text: '和其他茶客聊聊天',
        consequence: {
          narrative:
            '你和旁边的茶客聊了起来。他们中有茶商、有茶农、有老茶客，从他们口中你了解到了许多关于茶的知识——哪些是名茶、如何辨别好坏、什么地方产什么茶……',
          effects: { mood: 8 },
          narrativeTag: '茶友',
        },
      },
    ],
  },
  {
    id: 'culture_chess_game',
    name: '棋艺对弈',
    goalCategory: 'culture',
    weight: 6,
    cooldownDays: 20,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse', 'academy', 'street'],
      dayRange: [5, 999],
      actorMinCopper: 5,
    },
    openingNarrative:
      '树荫下摆着一张石桌，两个老者正在下围棋。棋盘上黑白子交织，杀得难解难分。旁边围着几个人观战，不时有人低声议论"这步走得妙""可惜了，应该下在那里的"。',
    choices: [
      {
        id: 'chess_watch',
        text: '围观对局',
        consequence: {
          narrative:
            '你在旁边站了一个多时辰，看完了整局棋。虽然不太懂规则，但能看出两位老者功力深厚，每一步都经过深思熟虑。最后黑子险胜，观战的人群发出一阵赞叹。',
          effects: { mood: 6, fatigue: 3 },
          narrativeTag: '观棋',
        },
      },
      {
        id: 'chess_play',
        text: '挑战一下',
        condition: { field: 'mood', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你鼓起勇气向获胜的老者挑战。老者欣然应允，结果你被杀得落花流水。但老者笑着指点了你几招："年轻人，下棋要有全局观，不能只盯着眼前。"你受益匪浅。',
          effects: { mood: 8, copper: -5 },
          narrativeTag: '学过围棋',
          transformations: [
            { type: 'gain_tag', value: '下过棋', description: '与高手对弈' },
          ],
        },
      },
      {
        id: 'chess_learn',
        text: '请教基本规则',
        consequence: {
          narrative:
            '你向旁边观战的人请教围棋规则。他们热心地给你讲解——气的概念、死活问题、官子等等。你听得似懂非懂，但觉得这游戏确实深奥。',
          effects: { mood: 5 },
          narrativeTag: '了解围棋规则',
        },
      },
    ],
  },
  {
    id: 'culture_guqin_music',
    name: '古琴听音',
    goalCategory: 'culture',
    weight: 4,
    cooldownDays: 38,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'temple', 'academy'],
      dayRange: [10, 999],
      weather: ['晴', '阴'],
    },
    openingNarrative:
      '一位身着青衫的琴师坐在亭中，膝上横着一把古琴。他轻抚琴弦，清越的琴声如山涧清泉般流淌而出。琴音时而低沉如诉，时而激昂如诉，引人入胜。',
    choices: [
      {
        id: 'guqin_listen_full',
        text: '静静听完',
        consequence: {
          narrative:
            '你找了块石头坐下，闭目倾听。琴师弹奏的是《高山流水》，琴音时而如高山巍峨，时而如流水潺潺。你仿佛置身于山水之间，所有的烦恼都烟消云散。',
          effects: { mood: 18, fatigue: -8 },
          narrativeTag: '听过古琴',
          transformations: [
            { type: 'gain_tag', value: '情操高雅', description: '欣赏过古琴演奏' },
          ],
        },
      },
      {
        id: 'guqin_tip',
        text: '打赏琴师',
        condition: { field: 'copper', operator: 'gte', value: 12 },
        consequence: {
          narrative:
            '你被琴音深深打动，掏出十二文钱放在琴师面前的琴囊中。琴师微微颔首，手中琴音一转，专门为你弹奏了一曲《平沙落雁》——更加悠扬动听。',
          effects: { copper: -12, mood: 15 },
          narrativeTag: '琴师的知音',
          relationChange: 5,
        },
      },
      {
        id: 'guqin_learn',
        text: '请教弹奏',
        consequence: {
          narrative:
            '曲终你上前请教。琴师淡淡地说："古琴之道，在于心而不在于技。你若真心想学，先听上一百曲再说。"他给了你一张乐谱，上面记载了几首入门曲子。',
          effects: { mood: 8 },
          narrativeTag: '学过古琴',
        },
      },
    ],
  },
];
