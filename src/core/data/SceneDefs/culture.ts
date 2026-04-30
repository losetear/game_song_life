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
];
