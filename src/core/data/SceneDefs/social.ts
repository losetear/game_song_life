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
  {
    id: 'guild_recruitment',
    name: '行会招募',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 20,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'workshop', 'dock'],
      dayRange: [10, 999],
    },
    openingNarrative: '几个穿着统一服饰的人正在张贴告示——汴京匠人行会正在招募新成员。一个中年匠人看到你，问道："小兄弟，看你这身板也是干活的料，要不要加入我们行会？有活大家一起干，有难大家一起扛。"',
    choices: [
      {
        id: 'join_guild',
        text: '加入行会',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative: '你交了入会费，领了一块木牌。匠人说："以后遇到麻烦就亮出这个，汴京城里我们还是有些面子的。"你感觉自己在这个城市里多了一份归属感。',
          effects: { copper: -15, mood: 15 },
          narrativeTag: '行会成员',
          transformations: [{ type: 'gain_tag', value: '有组织依靠', description: '加入了匠人行会' }],
          relationChange: 10,
        },
      },
      {
        id: 'ask_benefits',
        text: '先问问有什么好处',
        consequence: {
          narrative: '匠人掰着手指头给你算：优先接活、价格公道、有人罩着、年底分红……听得你心里直痒痒。你决定再考虑几天。',
          effects: { mood: 5 },
          narrativeTag: '了解过行会',
        },
      },
      {
        id: 'decline_guild',
        text: '不想受人束缚',
        consequence: {
          narrative: '"多谢好意，我习惯独来独往。"匠人也不勉强，拍了拍你的肩膀："行吧，要是以后想通了，来工坊找我们。"',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'street_gambler',
    name: '街头赌局',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 12,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'market'],
      actorMinCopper: 10,
    },
    openingNarrative: '一群人围着一个地上摆着三只碗的人。那人吆喝着："来来来！猜猜豆子在哪只碗下，猜一送一，童叟无欺！"他快速挪动三只碗，最后停下来："下注吧！"',
    choices: [
      {
        id: 'gamble_play',
        text: '下注试试',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative: '你押了十文钱，仔细盯着那只碗翻开——豆子赫然在目！摊主二话不说给你赔了二十文。围观的人发出一阵惊呼，你心满意足地收起铜钱。',
          effects: { copper: 10, mood: 10 },
          narrativeTag: '赌运亨通',
        },
      },
      {
        id: 'gamble_lose',
        text: '下注试试（可能输）',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative: '你信心满满地押了十文钱，结果翻开碗——空空如也！摊主嘿嘿一笑："愿赌服输啊客官。"你只能自认倒霉。',
          effects: { copper: -10, mood: -5 },
          narrativeTag: '上过当',
        },
      },
      {
        id: 'expose_trick',
        text: '揭穿他的把戏',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你冷冷地说："那豆子根本就不在碗里，在你袖子里吧？"摊主脸色一变，围观的人起哄起来。他赶紧收摊跑了，有人在后面喊："抓住他！"',
          effects: { mood: 8 },
          narrativeTag: '揭过骗局',
          relationChange: 5,
        },
      },
    ],
  },
  {
    id: 'newcomer_help',
    name: '初来乍到',
    goalCategory: 'social',
    weight: 7,
    cooldownDays: 30,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'market'],
      dayRange: [3, 15],
    },
    openingNarrative: "一个背着包袱的年轻人正在街边东张西望，手里捏着一张皱巴巴的纸条。他看到你，怯生生地凑过来：\"敢问大哥，这纸上写的'汴河码头'怎么走？我……我刚来京城，迷路了。\"",
    choices: [
      {
        id: 'guide_newcomer',
        text: '亲自带他过去',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你领着他穿过几条街巷，到了码头。年轻人千恩万谢，从包袱里掏出一块家乡糕点："这是我娘做的，您尝尝。"你推辞不过，接了过来。',
          effects: { fatigue: -8, hunger: 8, mood: 8 },
          narrativeTag: '热心指路',
          relationChange: 8,
        },
      },
      {
        id: 'give_directions',
        text: '告诉他怎么走',
        consequence: {
          narrative: '"往东走两里，看到牌坊左转就是了。"年轻人连连道谢，你看着他记在手心里，心里涌起一丝当年自己初来乍到时的回忆。',
          effects: { mood: 5 },
          narrativeTag: '帮助过新人',
        },
      },
      {
        id: 'warn_newcomer',
        text: '提醒他注意安全',
        consequence: {
          narrative: '你详细叮嘱他城里哪些地方要小心、哪些人要提防。年轻人听得认真，连连点头。他走的时候，你看着他瘦小的背影，心里有些感慨。',
          effects: { mood: 7 },
          narrativeTag: '良师益友',
          relationChange: 5,
        },
      },
    ],
  },
  {
    id: 'temple_festival',
    name: '庙会偶遇',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 25,
    narrativeWeight: 'minor',
    conditions: {
      location: ['temple'],
      dayRange: [8, 999],
      season: ['春'],
    },
    openingNarrative: '相国寺今日举办庙会，香客络绎不绝。你正准备离开，一个熟悉的声音叫住了你。回头一看，竟是许久不见的老乡！他乡遇故知，两人都激动得说不出话来。',
    choices: [
      {
        id: 'catch_up_old_friend',
        text: '找个地方好好聊聊',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative: '你们来到茶馆，坐下来细细交谈。原来他也是来汴京谋生的，如今在一家布庄当伙计。两人聊起家乡的人和事，不知不觉说了大半个时辰。',
          effects: { copper: -8, mood: 18 },
          narrativeTag: '他乡遇故知',
          relationChange: 15,
        },
      },
      {
        id: 'exchange_contacts',
        text: '交换住址，改日再聚',
        consequence: {
          narrative: '"我现在住在城西，改天到你那儿坐坐！"两人交换了住址，约好改日再聚。你走在回家的路上，脚步轻快了不少。',
          effects: { mood: 12 },
          narrativeTag: '找到同乡',
        },
      },
      {
        id: 'brief_greeting',
        text: '简单寒暄几句就告辞',
        consequence: {
          narrative: '"哎呀，真巧！改天聊！"你匆匆寒暄了几句，因为有急事就先告辞了。虽然没多说几句，但心里还是暖暖的。',
          effects: { mood: 6 },
        },
      },
    ],
  },
  {
    id: 'merchant_dispute',
    name: '商贩纠纷',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 15,
    narrativeWeight: 'minor',
    conditions: {
      location: ['market'],
      actorMinHealth: 30,
    },
    openingNarrative: '一个卖鱼的商贩和顾客争吵起来。顾客说鱼不新鲜，商贩说顾客故意找茬，两人越吵越凶，周围的人都停下来看热闹。',
    choices: [
      {
        id: 'mediate_fish_dispute',
        text: '出面调解',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你走上前去，检查了一下鱼——确实不太新鲜。你对商贩说："做生意讲究诚信，这鱼确实不新鲜，你便宜点卖了吧。"又对顾客说："人家也不容易，各退一步。"最后双方都满意地解决了纠纷。',
          effects: { mood: 8, fatigue: -3 },
          narrativeTag: '善于调解',
          relationChange: 6,
        },
      },
      {
        id: 'side_with_customer',
        text: '帮顾客说话',
        consequence: {
          narrative: '"这鱼确实不太新鲜，你退钱吧！"你站在顾客这边，商贩脸都绿了，但看到周围人都在点头，只能不情愿地退了钱。顾客朝你点了点头。',
          effects: { mood: 5 },
          narrativeTag: '正义感强',
          relationChange: 3,
        },
      },
      {
        id: 'side_with_merchant',
        text: '帮商贩说话',
        consequence: {
          narrative: '"一大早卖鱼也不容易，你就别挑了。"你帮着商贩说话，顾客瞪了你一眼，嘟囔着走了。商贩感激地送了你一条小鱼。',
          effects: { hunger: 5, mood: 3 },
          narrativeTag: '体谅商贩',
          relationChange: -2,
        },
      },
    ],
  },
  {
    id: 'night_watch',
    name: '巡夜偶遇',
    goalCategory: 'social',
    weight: 4,
    cooldownDays: 18,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'residential'],
      dayRange: [5, 999],
      actorMinHealth: 40,
    },
    openingNarrative: '深夜，你正准备睡觉，外面传来巡逻打更的声音："天干物燥，小心火烛！"你从窗缝往外看，看到一个老更夫提着灯笼走过。突然，他停在一户人家门前，仔细听了听，然后轻轻敲门。',
    choices: [
      {
        id: 'investigate_night',
        text: '出去看看发生了什么',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你披上衣服出去。更夫看到你，压低声音说："这屋里有动静，我听着像有人翻墙。"你们一起查看，果然发现一个小偷正要翻墙逃跑！更夫吹哨子喊人，你一把抓住了小偷的腿。',
          effects: { fatigue: -10, mood: 15 },
          narrativeTag: '抓获小偷',
          relationChange: 12,
        },
      },
      {
        id: 'alert_from_window',
        text: '在窗口喊一声',
        consequence: {
          narrative: '"谁在那儿？"你大喝一声。黑影一闪，一个人翻墙跑了。更夫举灯笼照了照，发现墙上留下了一个脚印："算了，被吓跑了也好。"',
          effects: { mood: 5 },
          narrativeTag: '吓退小偷',
        },
      },
      {
        id: 'ignore_night',
        text: '关窗继续睡',
        consequence: {
          narrative: '你摇摇头，关上窗户。第二天听说那户人家确实被偷了些东西，你心里有些遗憾，但也庆幸自己没卷进去。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'water_dispute',
    name: '水井之争',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 20,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'farmland'],
      season: ['夏'],
    },
    openingNarrative: '天旱了好些日子，村口那口老井快干了。今早你挑着水桶去打水，发现两家人正在井边争执——一家的老井是祖传的，另一家是新搬来的，都说自己有优先用水权。',
    choices: [
      {
        id: 'mediate_water',
        text: '提议轮流用水',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '"现在是特殊时期，不如这样——每天你家用两个时辰，他家也用两个时辰，晚上谁都可以来取水。"两家商量了一下，觉得这个办法公道，争执总算平息了。',
          effects: { mood: 8 },
          narrativeTag: '解决过纠纷',
          relationChange: 8,
        },
      },
      {
        id: 'share_water',
        text: '让出自己的那一份',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative: '"你们别吵了，我今天不取水了，让你们先用。"两家听了都有些不好意思，争执声小了下去。一个老大娘说："你这孩子心善，明天我帮你打水。"',
          effects: { mood: 10 },
          narrativeTag: '懂得谦让',
          relationChange: 10,
        },
      },
      {
        id: 'wait_out',
        text: '等他们吵完再说',
        consequence: {
          narrative: '你坐在一旁的石磨上等。吵了半个时辰，最后两家都累了，各自散去。你这才去打水，却发现井水已经很浑浊了……',
          effects: { mood: -5 },
        },
      },
    ],
  },
  {
    id: 'talent_show',
    name: '才艺展示',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 22,
    narrativeWeight: 'minor',
    conditions: {
      location: ['teahouse', 'academy'],
      dayRange: [12, 999],
    },
    openingNarrative: '茶馆里举办才艺比拼，谁要是能露一手绝活，就能赢取老板提供的奖品。几个看客正在擂鼓助威，台上的主持人喊道："还有哪位客官要来试试？"',
    choices: [
      {
        id: 'show_talent',
        text: '上台展示才艺',
        condition: { field: 'mood', operator: 'gte', value: 45 },
        consequence: {
          narrative: '你走上台，施展了自己的才艺——也许是唱曲、也许是书法、也许是武术。台下爆发出阵阵掌声，老板笑呵呵地递给你一包茶叶："不错不错，这是今年的新茶，拿去尝尝！"',
          effects: { mood: 15 },
          narrativeTag: '展示过才艺',
          relationChange: 8,
        },
      },
      {
        id: 'audience_cheer',
        text: '在台下当观众',
        consequence: {
          narrative: '你坐在台下，欣赏着各路高手的才艺表演。一个说书的讲得绘声绘色，一个杂技艺人表演得惊险刺激，你看得津津有味。',
          effects: { mood: 8 },
        },
      },
      {
        id: 'bet_on_winner',
        text: '押注谁会赢',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative: '你押了一个看起来很厉害的汉子五文钱。结果他果然赢了，你拿到了十文的赔付，心里美滋滋的。',
          effects: { copper: 5, mood: 5 },
          narrativeTag: '押中获胜者',
        },
      },
    ],
  },
  {
    id: 'social_wedding_banquet',
    name: '婚宴宾客',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 25,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'teahouse'],
      dayRange: [10, 999],
      actorMinCopper: 10,
    },
    openingNarrative:
      '一位认识的朋友要成亲了，广邀宾客参加婚宴。你也在受邀之列。按照习俗，需要随礼出席。',
    choices: [
      {
        id: 'wedding_attend_generous',
        text: '大方随礼出席',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你包了厚礼，在婚宴上被安排在上座。酒席上觥筹交错，你也认识了不少新朋友。新人专门来敬酒，感谢你的捧场。',
          effects: { copper: -20, mood: 15, hunger: 15, health: 2 },
          narrativeTag: '婚宴贵客',
          relationChange: 8,
        },
      },
      {
        id: 'wedding_attend_modest',
        text: '量力而行',
        consequence: {
          narrative:
            '你随了份薄礼，在普通席位坐了。虽然不如上座风光，但婚宴的热闹气氛你也享受到了。',
          effects: { copper: -10, mood: 8, hunger: 12 },
          narrativeTag: '参加婚宴',
        },
      },
      {
        id: 'wedding_decline',
        text: '有事去不了',
        consequence: {
          narrative:
            '你托人带了礼过去，人没有到。后来听说婚宴很热闹，你有些遗憾没参加。',
          effects: { copper: -5, mood: 2 },
          narrativeTag: '缺席婚宴',
        },
      },
    ],
  },
  {
    id: 'social_community_project',
    name: '邻里修路',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 55,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'street'],
      dayRange: [15, 999],
      actorMinHealth: 40,
    },
    openingNarrative:
      '街坊邻居商议着一起修整门前那条泥泞的路。大家集资出力，把路面铺上石板。这事完成后对大家都好。',
    choices: [
      {
        id: 'road_participate',
        text: '参与修路',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你和邻居们一起搬石头、和泥浆、铺路面。虽然累得腰酸背痛，但看着崭新的石板路，心中很有成就感。邻里关系也更加融洽了。',
          effects: { health: -5, fatigue: 15, mood: 12 },
          narrativeTag: '修路功臣',
          relationChange: 6,
        },
      },
      {
        id: 'road_donate',
        text: '只出钱',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative:
            '你出了十五文钱作为赞助。邻居们也很感激，毕竟不是每个人都有力气出力。路修好后，大家出门方便多了。',
          effects: { copper: -15, mood: 6 },
          narrativeTag: '赞助修路',
          relationChange: 4,
        },
      },
      {
        id: 'road_free_rider',
        text: '不参与',
        consequence: {
          narrative:
            '你没有出钱也没有出力。路修好后你和其他人一样享受着便利，但邻里看你的眼神有些异样。',
          effects: { mood: -3 },
          narrativeTag: '搭便车',
        },
      },
    ],
  },
  {
    id: 'social_skill_sharing',
    name: '技艺交流',
    goalCategory: 'social',
    weight: 5,
    cooldownDays: 30,
    narrativeWeight: 'minor',
    conditions: {
      location: ['workshop', 'market', 'teahouse'],
      dayRange: [12, 999],
      requiredAnyNarrativeTags: ['学过打铁', '书生', '身手不凡'],
    },
    openingNarrative:
      '几个同行聚在一起交流技艺。有人提议大家互相学习，取长补短。你也被邀请参加。',
    choices: [
      {
        id: 'skill_share_teach',
        text: '分享自己的经验',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你毫无保留地分享了自己的心得。大家都很感激，也有人分享了自己的独门绝技给你。你感觉技艺有了很大提升。',
          effects: { mood: 12 },
          narrativeTag: '技艺切磋',
          relationChange: 6,
        },
      },
      {
        id: 'skill_learn_only',
        text: '只学不教',
        consequence: {
          narrative:
            '你只学别人的东西，却不肯分享自己的。大家慢慢看出你的心思，之后就不太愿意教你真东西了。',
          effects: { mood: 3 },
          narrativeTag: '自私',
          relationChange: -3,
        },
      },
      {
        id: 'skill_listen',
        text: '在旁边听听',
        consequence: {
          narrative:
            '你没有参与交流，只是在一旁旁听。虽然没有学到真东西，但也开阔了眼界。',
          effects: { mood: 5 },
        },
      },
    ],
  },
  {
    id: 'social_festival_preparation',
    name: '节日筹备',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 45,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'residential'],
      season: ['春', '秋'],
      dayRange: [8, 999],
    },
    openingNarrative:
      '马上要到重要节日了（春节或中秋），街坊们开始张罗着布置街道、搭戏台、准备活动。大家有钱出钱有力出力。',
    choices: [
      {
        id: 'festival_help_decorate',
        text: '帮忙布置',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你挂灯笼、贴对联、搭台子，忙得不亦乐乎。节日当天看到整条街张灯结彩、喜气洋洋，你心中充满自豪。',
          effects: { fatigue: 10, mood: 15 },
          narrativeTag: '节日筹备者',
          relationChange: 5,
        },
      },
      {
        id: 'festival_donate',
        text: '捐钱支持',
        condition: { field: 'copper', operator: 'gte', value: 12 },
        consequence: {
          narrative:
            '你捐了十二文钱用于购买装饰品。组织者把你的名字写在了红榜上，路过的人都能看到。',
          effects: { copper: -12, mood: 8 },
          narrativeTag: '节日捐助者',
          relationChange: 4,
        },
      },
      {
        id: 'festival_enjoy_only',
        text: '到时候享受就行',
        consequence: {
          narrative:
            '你没有参与筹备。节日当天你享受着别人劳动的成果，心里也有些过意不去。',
          effects: { mood: 5 },
        },
      },
    ],
  },
  {
    id: 'social_neighbor_borrow',
    name: '邻里借物',
    goalCategory: 'social',
    weight: 7,
    cooldownDays: 15,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['residential'],
      dayRange: [5, 999],
    },
    openingNarrative:
      '邻居王婶急匆匆地来敲门，说家里来客了，想借几把椅子和一桌酒菜用具，事后一定归还。',
    choices: [
      {
        id: 'borrow_lend_generously',
        text: '爽快借出',
        consequence: {
          narrative:
            '你把家里的椅子和餐具都借给了王婶。她千恩万谢，第二天按时归还，还送了一篮自家种的菜作为感谢。',
          effects: { mood: 10, hunger: 8 },
          narrativeTag: '邻里互助',
          relationChange: 6,
        },
      },
      {
        id: 'borrow_lend_reluctantly',
        text: '勉强借出',
        consequence: {
          narrative:
            '你虽然不太情愿，但还是借了。王婶也看出来了，归还时格外小心，还特意把东西擦拭干净。',
          effects: { mood: 4 },
          narrativeTag: '借过东西给邻居',
        },
      },
      {
        id: 'borrow_decline',
        text: '不方便借',
        consequence: {
          narrative:
            '你婉言拒绝了。王婶虽然有些失望，但也理解。之后见面时你们都有些尴尬。',
          effects: { mood: -3 },
          narrativeTag: '拒绝过邻居',
          relationChange: -2,
        },
      },
    ],
  },
  {
    id: 'social_public_bath',
    name: '公共澡堂',
    goalCategory: 'social',
    weight: 7,
    cooldownDays: 10,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['street', 'residential'],
      dayRange: [3, 999],
      actorMinCopper: 3,
    },
    openingNarrative:
      '街上的公共澡堂生意兴隆。花上三文钱就能舒舒服服泡个热水澡，还能和其他人唠唠嗑。',
    choices: [
      {
        id: 'bath_visit',
        text: '去洗个澡',
        condition: { field: 'copper', operator: 'gte', value: 3 },
        consequence: {
          narrative:
            '你花了三文钱泡了个热水澡，洗去了多日的疲惫。澡堂里人声鼎沸，你也顺便打听了些消息。',
          effects: { copper: -3, mood: 12, fatigue: -10, health: 3 },
          narrativeTag: '澡堂常客',
        },
      },
      {
        id: 'bath_chat',
        text: '去澡堂主要为了聊天',
        consequence: {
          narrative:
            '你在澡堂泡着，和旁边的人聊起了天。从生意经到家长里短，信息量很大。',
          effects: { copper: -3, mood: 8 },
          narrativeTag: '澡堂情报站',
        },
      },
      {
        id: 'bath_skip',
        text: '不去凑热闹',
        consequence: {
          narrative:
            '你嫌澡堂人太多，就在家简单擦洗了一下。虽然没有澡堂舒服，但也干净了。',
          effects: { mood: 2 },
        },
      },
    ],
  },
  {
    id: 'social_guest_visit',
    name: '客到访',
    goalCategory: 'social',
    weight: 6,
    cooldownDays: 20,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['residential'],
      dayRange: [8, 999],
    },
    openingNarrative:
      '有人敲门——是一位许久未见的老友路过，特意来看望你。你有些惊喜，赶紧招呼进屋。',
    choices: [
      {
        id: 'guest_treat_well',
        text: '好生招待',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative:
            '你请老友喝了酒、吃了饭，聊了许久。他走时说下次你到他的地界一定找他。故友重逢的喜悦让你心情大好。',
          effects: { copper: -8, mood: 15, hunger: 10 },
          narrativeTag: '热情待客',
          relationChange: 8,
        },
      },
      {
        id: 'guest_tea_only',
        text: '奉茶招待',
        consequence: {
          narrative:
            '你奉上清茶，和老友聊了一会儿。虽然没有大吃大喝，但叙旧的感觉很好。',
          effects: { mood: 10 },
          narrativeTag: '以茶待客',
        },
      },
      {
        id: 'guest_busy',
        text: '正好有事',
        consequence: {
          narrative:
            '你抱歉地说正好有急事要办，老友理解地离开了。你们约好改日再聚，但你心里有些过意不去。',
          effects: { mood: 2 },
        },
      },
    ],
  },
  {
    id: 'social_street_food',
    name: '路边小食',
    goalCategory: 'social',
    weight: 8,
    cooldownDays: 5,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['street', 'market'],
      dayRange: [2, 999],
      actorMinCopper: 2,
    },
    openingNarrative:
      '街边的小吃摊香气扑鼻——热腾腾的包子、炸得金黄的油条、香喷喷的豆腐脑……摊主的吆喝声此起彼伏。',
    choices: [
      {
        id: 'street_food_buy',
        text: '买点尝尝',
        condition: { field: 'copper', operator: 'gte', value: 3 },
        consequence: {
          narrative:
            '你花三文钱买了几样小吃，边走边吃。虽然不是什么山珍海味，但热乎乎的食物让人感到满足。摊主也是个健谈的人，和你聊了几句。',
          effects: { copper: -3, mood: 8, hunger: 10 },
          narrativeTag: '小吃爱好者',
        },
      },
      {
        id: 'street_food_chat',
        text: '和摊主聊聊天',
        consequence: {
          narrative:
            '你没有买吃的，但和摊主聊起了天。摊主告诉你不少街坊的趣事，你听得津津有味。',
          effects: { mood: 5 },
        },
      },
      {
        id: 'street_food_ignore',
        text: '继续赶路',
        consequence: {
          narrative:
            '你虽然被香味吸引，但还是忍住继续赶路。毕竟囊中羞涩，不能太随意花钱。',
          effects: { mood: 0 },
        },
      },
    ],
  },
];
