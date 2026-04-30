import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const SOCIAL_EVENTS: BranchEvent[] = [
  {
    id: 'tea_house_gossip',
    name: '茶馆八卦',
    goalCategory: 'social',
    weight: 8,
    cooldownDays: 5,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['teahouse'],
    },
    openingNarrative: '茶馆里人声鼎沸，隔壁桌的人正在高谈阔论。王婆朝你招了招手："来来来，坐这儿，跟你讲件稀罕事！"',
    choices: [
      {
        id: 'listen_gossip',
        text: '坐下听八卦',
        consequence: {
          narrative: '你端起茶碗，听王婆绘声绘色地讲了一桩码头上的奇闻。虽然多半是添油加醋，倒也消遣了半晌。',
          effects: { mood: 8 },
        },
      },
      {
        id: 'share_info',
        text: '分享自己知道的事',
        consequence: {
          narrative: '你把自己这几日的见闻说了出来，王婆听得连连点头："啧啧，你这后生消息倒是灵通。"',
          effects: { mood: 5, copper: -2 },
          narrativeTag: '消息灵通',
        },
      },
      {
        id: 'ignore_gossip',
        text: '不去凑热闹',
        consequence: {
          narrative: '你摇摇头，继续喝自己的茶。茶馆的喧闹声渐渐模糊成背景。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'help_elderly',
    name: '助人为乐',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 7,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'market'],
      actorMinHealth: 30,
    },
    openingNarrative: '街边一个老妇人蹲在地上，身边散落了一地的菜。路过的行人匆匆走过，没人停下。',
    choices: [
      {
        id: 'help_pickup',
        text: '帮她捡起来',
        consequence: {
          narrative: '你蹲下身，帮老人把菜一一捡起。老人连连道谢："好心人哪，老天保佑你。"周围几个路人投来赞许的目光。',
          effects: { mood: 10, fatigue: -3 },
          narrativeTag: '热心助人',
          relationChange: 5,
        },
      },
      {
        id: 'give_money',
        text: '给她几文钱',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative: '你摸出几文铜钱塞到老人手里。她双手颤抖着接过，眼眶泛红。',
          effects: { copper: -10, mood: 5 },
          narrativeTag: '慷慨',
        },
      },
      {
        id: 'walk_away',
        text: '继续赶路',
        consequence: {
          narrative: '你犹豫了一下，最终还是走了过去。身后传来老人吃力起身的声音。',
          effects: { mood: -5 },
        },
      },
    ],
  },
  {
    id: 'street_conflict',
    name: '街头纠纷',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 10,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'market'],
      dayRange: [3, 999],
    },
    openingNarrative: '前面围了一圈人。两个汉子正在争吵，眼看就要动手。一个推着车的小贩在旁边急得团团转——他的货被撞翻了。',
    choices: [
      {
        id: 'mediate',
        text: '上前调解',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你挤进人群，好说歹说总算把两人劝开了。小贩感激地朝你鞠了一躬，硬塞给你几个馒头。',
          effects: { mood: 5, hunger: 10 },
          narrativeTag: '善于调解',
          relationChange: 8,
        },
      },
      {
        id: 'help_vendor',
        text: '帮小贩捡货',
        consequence: {
          narrative: '你没管争吵，默默帮小贩把散落的货物捡了起来。小贩千恩万谢，说改天一定请你吃饭。',
          effects: { fatigue: -5 },
          narrativeTag: '乐于助人',
          relationChange: 5,
        },
      },
      {
        id: 'watch',
        text: '围观',
        consequence: {
          narrative: '你站在人群里看热闹。最终捕快来把两人带走了，人群渐渐散去。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'merchant_deal',
    name: '商机',
    goalCategory: 'social',
    weight: 4,
    cooldownDays: 15,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'dock'],
      actorMinCopper: 20,
      dayRange: [5, 999],
    },
    openingNarrative: '一个行商模样的中年人凑过来，压低声音说："兄弟，我刚从南方来，带了批上好的丝绸，价钱公道。要不要看看？"',
    choices: [
      {
        id: 'buy_silk',
        text: '买一些试试',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你掏钱买了两匹。丝绸手感确实不错，转手卖给布庄说不定能赚一笔。',
          effects: { copper: -30 },
          narrativeTag: '倒卖丝绸',
        },
      },
      {
        id: 'decline_polite',
        text: '婉拒',
        consequence: {
          narrative: '"多谢，改日再说。"你客气地回绝了。行商也不强求，转身去找下一个主顾。',
          effects: { mood: 0 },
        },
      },
      {
        id: 'warn_others',
        text: '提醒旁边的人小心',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你悄悄提醒旁边几个摊贩，说这人来路不明，小心上当。摊贩们纷纷点头。',
          effects: { mood: 3 },
          narrativeTag: '警觉',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'gambling_debt',
    name: '赌债纠纷',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 12,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'street'],
      actorMaxCopper: 50,
    },
    openingNarrative: '茶馆后院的巷子里，几个彪形大汉围住了一个瘦弱的读书人。领头的大汉揪着那人的衣领："欠了五十两银子，今天再不还，剁你一只手！"读书人脸色惨白，浑身发抖。',
    choices: [
      {
        id: 'intervene_debt',
        text: '上前劝解',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你硬着头皮走上前，掏出身上仅有的铜钱塞给领头汉子："各位好汉，这书生看着也不容易，这点钱先拿去喝杯茶，宽限几日如何？"那汉子掂了掂铜钱，冷哼一声松了手。读书人朝你深深作揖，泪流满面。',
          effects: { copper: -20, mood: 5 },
          narrativeTag: '替人还债',
          relationChange: 10,
        },
      },
      {
        id: 'call_authority',
        text: '喊巡街的差役',
        consequence: {
          narrative: '你扯开嗓子大喊"有土匪！"远处两个巡街的捕快闻声赶来。那伙人见势不妙，骂骂咧咧地散了。读书人瘫坐在地上，连声道谢。',
          effects: { mood: 3 },
          narrativeTag: '报过官',
          relationChange: 5,
        },
      },
      {
        id: 'walk_away_debt',
        text: '多一事不如少一事',
        consequence: {
          narrative: '你低下头快步走过，假装什么都没看见。身后传来读书人的哀求声和拳脚落下的闷响。你心里一阵发紧，脚步却没停。',
          effects: { mood: -8 },
        },
      },
    ],
  },
  {
    id: 'poetry_competition',
    name: '对诗比赛',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 18,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse'],
      dayRange: [5, 999],
    },
    openingNarrative: "茶馆二楼雅座，几位文人墨客正在以诗会友。桌上摆着笔墨纸砚，一个穿青衫的书生朗声道：\"今日以『汴河春水』为题，谁对得上，这壶龙井便归谁！\"",
    choices: [
      {
        id: 'join_poetry',
        text: '凑个热闹',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你略一思索，提笔写下两句。众人看了纷纷点头，青衫书生抚掌笑道："好句！虽非上乘，却也有些灵气。"那壶龙井果然端到了你面前。',
          effects: { mood: 12, hunger: -2 },
          narrativeTag: '参加过诗会',
          relationChange: 5,
        },
      },
      {
        id: 'listen_only',
        text: '在旁边听就好',
        consequence: {
          narrative: '你找了个角落坐下，听那些才子们你来我往地对诗。虽然自己没参与，但听着那些妙词佳句，倒也长了见识。',
          effects: { mood: 5 },
        },
      },
      {
        id: 'leave_poetry',
        text: '这不是我的圈子',
        consequence: {
          narrative: '你摇摇头转身下楼。吟诗作对你不在行，还是去楼下喝碗粗茶实在。',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'drinking_contest',
    name: '斗酒',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 14,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['market', 'teahouse'],
      actorMinHealth: 50,
    },
    openingNarrative: '集市边的酒肆里，一个满脸通红的汉子正拍着桌子叫阵："还有谁！再来三碗！老子喝趴下汴京城一半的酒鬼！"周围看热闹的人越聚越多，起哄声此起彼伏。',
    choices: [
      {
        id: 'accept_drink',
        text: '上去比划比划',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative: '你坐到汉子对面，两人一碗接一碗地灌。三碗过后，那汉子眼睛发直，身子一歪栽到了桌底下。酒保乐呵呵地把赢来的两吊钱递给你——原来这是场赌局。',
          effects: { copper: 20, health: -15, fatigue: -10, mood: 15 },
          narrativeTag: '斗酒胜出',
        },
      },
      {
        id: 'lose_drink',
        text: '上去试试（可能输）',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你信心满满地坐下，结果那汉子是汴京出了名的"千杯不醉"。五碗下去，你觉得天旋地转，最后是被酒扶出去的。输了两文钱的赌注倒是小事……',
          effects: { copper: -2, health: -20, fatigue: -15, mood: -5 },
          narrativeTag: '斗酒败北',
        },
      },
      {
        id: 'watch_drink',
        text: '围观就好',
        consequence: {
          narrative: '你站在人群里看热闹。最终一个壮汉把那个吹牛的灌趴下了，全场哄堂大笑。你看了一出好戏，心情也跟着舒畅了几分。',
          effects: { mood: 5 },
        },
      },
    ],
  },
  {
    id: 'street_performance',
    name: '街头卖艺围观',
    goalCategory: 'social',
    weight: 7,
    cooldownDays: 6,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['street', 'market'],
    },
    openingNarrative: '御街旁围了一大圈人，中间一个杂耍艺人正赤膊耍着三把飞刀。刀光闪烁间，他身后的木靶子上已经插满了刀，而插在头顶苹果上的那一刀更是引得人群阵阵惊呼。',
    choices: [
      {
        id: 'tip_performer',
        text: '打赏几文',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative: '你挤进人群，将几枚铜钱扔进艺人的帽子里。艺人抱拳道谢，额外表演了一套"口吞宝剑"，看得你目瞪口呆。',
          effects: { copper: -5, mood: 10 },
          narrativeTag: '打赏过艺人',
        },
      },
      {
        id: 'learn_trick',
        text: '想学两手',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '散场后你追上艺人，问能不能教两手。艺人上下打量你一番："想学啊？明天丑时到城外柳树林来，我先看看你的胆量。"',
          effects: { mood: 5 },
          narrativeTag: '拜师学艺意向',
          transformations: [{ type: 'gain_tag', value: '接触过江湖艺人', description: '与街头卖艺者有过交流' }],
        },
      },
      {
        id: 'just_watch',
        text: '免费看戏',
        consequence: {
          narrative: '你站在外围看了半晌，艺人收摊时你也就走了。虽然没花钱，但那套飞刀功夫确实精彩，路上还在回味。',
          effects: { mood: 3 },
        },
      },
    ],
  },
  {
    id: 'rumor_spread',
    name: '流言四起',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 16,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'street'],
      dayRange: [7, 999],
    },
    openingNarrative: '这几日汴京城里流传着一个离奇的传闻——说是有人在相国寺后院挖出了一只刻着前朝年号的金蟾蜍，官府已经派人封了现场。茶馆里、大街上，人人都在议论这件事。',
    choices: [
      {
        id: 'spread_rumor',
        text: '添油加醋地传播',
        consequence: {
          narrative: '你也跟着瞎编了几句，说那金蟾蜍还会动呢。没想到这话传得飞快，三天后居然有人专门来问你"是不是亲眼所见"。你只能支吾其词。',
          effects: { mood: 5 },
          narrativeTag: '传播过流言',
          relationChange: -3,
        },
      },
      {
        id: 'verify_rumor',
        text: '去相国寺看看真假',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你跑到相国寺后院一看——哪有什么金蟾蜍，就是几个顽童埋了个铜蛤蟆玩具被人挖出来了。真相大白后，你回去跟几个人说了，他们反而觉得你在故弄玄虚。',
          effects: { mood: 0, fatigue: -5 },
          narrativeTag: '查证过传闻',
        },
      },
      {
        id: 'ignore_rumor',
        text: '不参与这些闲话',
        consequence: {
          narrative: '"无风不起浪，但浪大了也未必是真。"你没掺和这事，照常过自己的日子。几天后流言自然平息了，你庆幸自己没卷进去。',
          effects: { mood: 2 },
        },
      },
    ],
  },
  {
    id: 'matchmaking',
    name: '媒婆上门',
    goalCategory: 'social',
    weight: 4,
    cooldownDays: 25,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential'],
      dayRange: [15, 999],
      actorMinCopper: 30,
    },
    openingNarrative: '一大早，王媒婆就笑眯眯地敲开了你的门。她手里摇着把蒲扇，一进门就东张西望："哎哟，这屋子收拾得不错嘛！我跟你说啊，东街李员外家的小姐，知书达理，模样俊俏，我看你们俩——天生一对！"',
    choices: [
      {
        id: 'agree_meet',
        text: '同意见见',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你给了王媒婆几文茶钱，约好了见面时辰。几天后在茶馆见了面，李小姐确实温婉可人，只是谈话间总低着头，显得拘谨。王媒婆在旁边笑得合不拢嘴。',
          effects: { copper: -5, mood: 10 },
          narrativeTag: '相过亲',
          relationChange: 8,
        },
      },
      {
        id: 'decline_match',
        text: '现在不想谈这个',
        consequence: {
          narrative: '"王婆婆，我现在一心谋生计，儿女私事以后再说吧。"王媒婆撇撇嘴："年轻人就是不着急，好吧好吧，有需要再来找我。"临走还不忘往怀里揣了你桌上两个橘子。',
          effects: { copper: -2, mood: -2 },
        },
      },
      {
        id: 'ask_details',
        text: '多问问对方情况',
        consequence: {
          narrative: '你详细问了李家的情况。王媒婆竹筒倒豆子般全说了：李小姐今年二八，擅长女红，性格温和，就是……她爹脾气不太好。你听完心里有了底。',
          effects: { mood: 3 },
          narrativeTag: '了解过相亲对象',
        },
      },
    ],
  },
  {
    id: 'neighbor_dispute',
    name: '邻里争执',
    goalCategory: 'social',
    weight: 7,
    cooldownDays: 10,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'farmland'],
    },
    openingNarrative: '隔壁张大妈和你隔着一道矮墙吵了起来："你家的鸡又跑过来啄了我的菜！上次赔的那棵葱还没说完呢！"你探头一看，果然有几只母鸡在你那边的菜地里刨得欢。',
    choices: [
      {
        id: 'compensate_neighbor',
        text: '主动赔偿',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative: '你从屋里拿了几个鸡蛋送到张大妈手上："张婶，鸡的事对不住，这些蛋您拿去，算我赔您的。"张大妈脸色缓和下来："算了算了，邻居嘛，低头不见抬头见的。"',
          effects: { copper: -8, mood: 5 },
          narrativeTag: '邻里和睦',
          relationChange: 8,
        },
      },
      {
        id: 'argue_back',
        text: '据理力争',
        consequence: {
          narrative: '"张婶，您家的猫上周还偷吃了我晒的鱼干呢！"两人你一言我一语吵了半天，最后不欢而散。矮墙两边的气氛降到了冰点。',
          effects: { mood: -8 },
          narrativeTag: '和邻居吵过架',
          relationChange: -10,
        },
      },
      {
        id: 'build_fence',
        text: '加高篱笆',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你花了一下午时间把中间的篱笆加高了半尺。张大妈在墙那边看着，哼了一声没说话。但第二天你发现菜地里多了把新鲜小葱——算是和解了吧？',
          effects: { fatigue: -10, health: -3, mood: 3 },
          narrativeTag: '修过篱笆',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'charity_food',
    name: '施粥棚',
    goalCategory: 'social',
    weight: 9,
    cooldownDays: 8,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'market'],
      actorMaxCopper: 20,
    },
    openingNarrative: '城门口搭起了施粥棚，一口大铁锅正咕嘟咕嘟冒着热气。排队的人排成了长龙，有衣衫褴褛的乞丐，也有落魄的书生。一个慈眉善目的老和尚在给每个人盛粥。',
    choices: [
      {
        id: 'get_porridge',
        text: '排队领粥',
        consequence: {
          narrative: '你排在队伍末尾，等了大半个时辰才轮到你。老和尚给你盛了满满一碗稀粥，还加了块咸萝卜。热粥下肚，胃里终于有了点暖意。',
          effects: { hunger: 20, mood: 5 },
          narrativeTag: '领过施粥',
        },
      },
      {
        id: 'help_serve',
        text: '帮忙分发',
        condition: { field: 'health', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你主动帮老和尚舀粥、维持秩序。忙活了一上午，老和尚递给你一个馒头："小施主心善，这个你拿着吃。"你推辞不过，接了过来。',
          effects: { hunger: 25, fatigue: -15, mood: 10 },
          narrativeTag: '做过义工',
          relationChange: 5,
        },
      },
      {
        id: 'skip_charity',
        text: '不去凑这份热闹',
        consequence: {
          narrative: '你看了看那条长队，摇摇头走开了。虽然肚子也在叫，但让你和乞丐排在一起领施粥……心里总归不是滋味。',
          effects: { hunger: -5, mood: -3 },
        },
      },
    ],
  },
];
