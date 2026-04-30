import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const WORK_EVENTS: BranchEvent[] = [
  {
    id: 'apprentice_offer',
    name: '学徒机会',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 20,
    narrativeWeight: 'major',
    conditions: {
      location: ['workshop'],
      actorMaxCopper: 50,
      dayRange: [3, 30],
    },
    openingNarrative: '铁匠铺的老刘头打量了你一番，把锤子往砧上一放："小伙子，看你手脚利索。想不想学门手艺？我这缺个学徒。"',
    choices: [
      {
        id: 'accept_apprentice',
        text: '答应学艺',
        consequence: {
          narrative: '你拜了师傅，从此每日天不亮就起来生火、锤铁。日子虽然辛苦，但看着自己打出的第一把小刀，心里是说不出的滋味。',
          effects: { copper: 5, fatigue: -15, mood: 10 },
          narrativeTag: '铁匠学徒',
          transformations: [{ type: 'gain_tag', value: '学过打铁', description: '掌握了基本的锻造技术' }],
        },
      },
      {
        id: 'decline_apprentice',
        text: '婉拒',
        consequence: {
          narrative: '"多谢刘师傅好意，容我想想。"老刘头也不勉强，继续叮叮当当地打他的铁。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'market_opportunity',
    name: '集市机会',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 10,
    narrativeWeight: 'minor',
    conditions: {
      location: ['market'],
      actorMinCopper: 15,
    },
    openingNarrative: '集市角落有个外地来的小贩在甩卖货物，价格只有平时的一半。看起来是急着脱手。',
    choices: [
      {
        id: 'buy_cheap',
        text: '低价买入',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你挑了几样实用的东西付了钱。小贩千恩万谢地走了。这些东西拿去别处卖，应该能赚不少。',
          effects: { copper: -20 },
          narrativeTag: '低价进货',
        },
      },
      {
        id: 'ignore_deal',
        text: '不冒险',
        consequence: {
          narrative: '你看了看，总觉得事有蹊跷，还是算了。便宜没好货。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'hard_labor',
    name: '苦力活',
    goalCategory: 'work',
    weight: 7,
    cooldownDays: 5,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['dock', 'market'],
      actorMaxCopper: 30,
    },
    openingNarrative: '码头上有人在招搬工，一天下来能挣三十文。活儿不轻，但胜在现结。',
    choices: [
      {
        id: 'take_labor',
        text: '去搬货',
        consequence: {
          narrative: '你扛了一整天的大包小包，腰都快断了。日落时分拿到铜钱，虽然辛苦，也算有了收入。',
          effects: { copper: 30, fatigue: -25, mood: -5, health: -3 },
        },
      },
      {
        id: 'skip_labor',
        text: '不去了',
        consequence: {
          narrative: '你看了看那堆成山的货物，摇了摇头。今天还是算了。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'guild_recruit',
    name: '行会招募',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 20,
    narrativeWeight: 'major',
    conditions: {
      location: ['workshop', 'market'],
      dayRange: [5, 999],
    },
    openingNarrative: '汴京商行会的告示栏前围满了人。一张新贴出的红纸格外醒目："招纳各行匠人，入会者可享行会保护，承接官府采办。需缴入会费五十文，月缴会费十文。"',
    choices: [
      {
        id: 'join_guild',
        text: '加入行会',
        condition: { field: 'copper', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你咬咬牙交了入会费。管事的给你发了一块铜牌，上面刻着"汴京商行"四个字。从此你就是有组织的人了——至少接活时不会被地痞刁难。',
          effects: { copper: -50, mood: 8 },
          narrativeTag: '加入了行会',
          transformations: [{ type: 'gain_tag', value: '行会成员', description: '汴京商行会正式成员' }],
        },
      },
      {
        id: 'hesitate_guild',
        text: '再考虑考虑',
        consequence: {
          narrative: '五十文不是小数目。你把告示抄了一份，想着等攒够了钱再来。管事的看了你一眼，也没说什么。',
          effects: { mood: 0 },
        },
      },
      {
        id: 'ask_benefits',
        text: '问问具体有什么好处',
        consequence: {
          narrative: '你向旁边一个挂着行会腰牌的匠人打听。他掰着手指头数："第一，有人欺负你能出头；第二，官府的活儿优先分；第三，年底还有分红。"听得你心里痒痒的。',
          effects: { mood: 3 },
          narrativeTag: '了解过行会',
        },
      },
    ],
  },
  {
    id: 'urgent_delivery',
    name: '加急送货',
    goalCategory: 'work',
    weight: 6,
    cooldownDays: 7,
    narrativeWeight: 'minor',
    conditions: {
      location: ['dock', 'market', 'street'],
      actorMinHealth: 40,
    },
    openingNarrative: '一个满头大汗的信使拦住你的去路："这位兄弟，我家里急事走不开，这封信必须在今晚之前送到城西赵员外府上。送到了赏二十文！"',
    choices: [
      {
        id: 'accept_delivery',
        text: '接下这单',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你接过信一路小跑穿过半个汴京城。城西赵府的门房验过信后，如数给了你二十文外加两个馒头。虽然跑得气喘吁吁，但这一趟值了。',
          effects: { copper: 20, hunger: 8, fatigue: -12, health: -2, mood: 5 },
          narrativeTag: '做过加急送货',
        },
      },
      {
        id: 'negotiate_price',
        text: '讨价还价',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '"三十文，少一文不干。"信使犹豫了一下："成！快去快回！"你加了十文的辛苦费，心里美滋滋的。',
          effects: { copper: 30, hunger: 8, fatigue: -12, health: -2, mood: 8 },
          narrativeTag: '议价成功',
        },
      },
      {
        id: 'decline_delivery',
        text: '没空帮这个忙',
        consequence: {
          narrative: '你摇摇头说有事在身。信使叹了口气，转身去找下一个目标。你继续赶自己的路。',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'night_shift',
    name: '夜班值守',
    goalCategory: 'work',
    weight: 4,
    cooldownDays: 10,
    narrativeWeight: 'flavor',
    conditions: {
      actorMinHealth: 30,
    },
    openingNarrative: '城门的守更老张头找到你："小伙子，今晚我腰疼得厉害，能不能替我守两个时辰？每个时辰八文钱，天亮就换班。"',
    choices: [
      {
        id: 'take_night_shift',
        text: '答应下来',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你在城门楼子上坐了一整夜，看着月亮从东边升到西边。偶尔有几个晚归的行人，你都按规矩盘查了。天亮时老张头来了，递给你十六文和一块酱牛肉。',
          effects: { copper: 16, hunger: 10, fatigue: -20, mood: -3 },
          narrativeTag: '值过夜班',
        },
      },
      {
        id: 'ask_for_more',
        text: '要求加钱',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '"老张叔，夜里冷，二十五文吧。"老张头想了想："行吧行吧，你这小子倒是会做生意。"你多赚了几文，但整夜的寒风还是让你冻得不轻。',
          effects: { copper: 25, hunger: 10, fatigue: -22, health: -3, mood: 2 },
          narrativeTag: '议价夜班',
        },
      },
      {
        id: 'refuse_night',
        text: '晚上要休息',
        consequence: {
          narrative: '"实在对不住，今天太累了。"老张头点点头去找别人了。你回到住处躺下，踏踏实实睡了个好觉。',
          effects: { fatigue: 15, health: 3, mood: 2 },
        },
      },
    ],
  },
  {
    id: 'craft_competition',
    name: '匠艺比拼',
    goalCategory: 'work',
    weight: 3,
    cooldownDays: 25,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['workshop'],
      dayRange: [10, 999],
    },
    openingNarrative: '作坊区的广场上搭起了擂台，四面八方来了各路匠人——铁匠、木匠、漆匠、绣娘……今日是汴京一年一度的"百工大会"，各展绝活，胜者可得官府颁发的"巧匠"银牌一枚。',
    choices: [
      {
        id: 'enter_competition',
        text: '报名参加',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你报了名，选了自己最拿手的项目。比拼时你全神贯注，发挥出了最好的水平。虽然没有拿到头名，但评委会给了你一块铜牌"良匠"认证，也算没白来。',
          effects: { copper: 15, fatigue: -18, mood: 12 },
          narrativeTag: '参加过百工大会',
          transformations: [{ type: 'gain_tag', value: '良匠认证', description: '在百工大会中获得良匠称号' }],
          relationChange: 5,
        },
      },
      {
        id: 'watch_crafts',
        text: '先围观学习',
        consequence: {
          narrative: '你没敢报名，但从头到尾看完了比赛。一位老木匠的榫卯技艺让你大开眼界——原来木头可以拼接得天衣无缝，连一滴水都漏不进去。',
          effects: { mood: 6, fatigue: -5 },
          narrativeTag: '观摩过百工大会',
        },
      },
      {
        id: 'skip_competition',
        text: '跟我没关系',
        consequence: {
          narrative: '你看了看那些身怀绝技的匠人，摇摇头走了。自己那点手艺上去也是丢人，不如回去多练练再说。',
          effects: { mood: -3 },
        },
      },
    ],
  },
  {
    id: 'harvest_season',
    name: '收获时节',
    goalCategory: 'work',
    weight: 7,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['farmland'],
      season: ['秋'],
    },
    openingNarrative: '金风送爽，田野里一片金黄。稻穗低垂，高粱火红，到处是忙碌的身影。村头的李大户正在田边招短工："收庄稼啦！一天三十文，包两顿饭！"',
    choices: [
      {
        id: 'work_harvest',
        text: '去帮忙收割',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你跟着大伙儿从日出干到日落，镰刀割得虎口都裂了。但看着一捆捆稻谷堆成小山，闻着新米的香气，疲惫中竟有种踏实的满足感。',
          effects: { copper: 30, hunger: 20, fatigue: -25, health: -5, mood: 5 },
          narrativeTag: '参与过秋收',
        },
      },
      {
        id: 'negotiate_harvest',
        text: '谈个好价钱',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '"李员外，四十文一天，不然我去隔壁王大户家。"李大户瞪了你一眼，最后挥挥手："成成成，就四十！"多赚的十文让你走路都带风。',
          effects: { copper: 40, hunger: 20, fatigue: -25, health: -5, mood: 10 },
          narrativeTag: '议价农活',
        },
      },
      {
        id: 'skip_harvest',
        text: '农活太累了',
        consequence: {
          narrative: '你看了看那些弯腰劳作的背影，摇摇头走了。这种力气活不适合你，还是到城里找点别的营生吧。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'tax_collection',
    name: '催粮催款',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential', 'street'],
      season: ['秋'],
    },
    openingNarrative: '几个穿皂衣的差役挨家挨户地敲门："秋税该交了！每户米三斗、绢一匹、铜钱二百文！"街坊邻居们愁眉苦脸地翻箱倒柜，有人已经在门口抹眼泪了。',
    choices: [
      {
        id: 'pay_tax',
        text: '按时缴纳',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你早早准备好了税赋，差役来时一并交清。还额外得了张收据："完讫"。交完税口袋空了一大半，但至少不用担心被衙门传唤了。',
          effects: { copper: -20, mood: -5 },
          narrativeTag: '按时纳税',
        },
      },
      {
        id: 'help_neighbor_tax',
        text: '帮困难的邻居凑一点',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative: '隔壁刘大婶正抱着米缸发愁，缸底只剩半升米了。你默默塞给她十文钱："婶子，先拿去应个急。"她眼圈红了，千恩万谢。',
          effects: { copper: -30, mood: 5 },
          narrativeTag: '帮人交过税',
          relationChange: 10,
        },
      },
      {
        id: 'delay_tax',
        text: '请求宽限几日',
        consequence: {
          narrative: '你跟差役说了不少好话，对方勉强同意宽限三天，但要加收两文"滞纳金"。你松了口气，赶紧想办法筹钱。',
          effects: { copper: -2, mood: -3 },
          narrativeTag: '申请过延期纳税',
        },
      },
    ],
  },
  {
    id: 'merchant_caravan',
    name: '商队同行',
    goalCategory: 'work',
    weight: 4,
    cooldownDays: 18,
    narrativeWeight: 'minor',
    conditions: {
      location: ['dock', 'street'],
      actorMinCopper: 25,
    },
    openingNarrative: '码头上停着一支准备出发的商队，十几匹骡马驮满了货物。领队的胡商模样的中年人正在招护卫："去洛阳，路上五日，每日工钱十五文，管饭。要有力气的！"',
    choices: [
      {
        id: 'join_caravan',
        text: '加入商队',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative: '你跟着商队走了五天，路上遇到过一次山贼，但你和其他护卫合力把他们吓退了。到达洛阳后领队多赏了你十文作为"勇敢奖"。顺便还在洛阳城里逛了一圈。',
          effects: { copper: 85, fatigue: -30, health: -8, mood: 10 },
          narrativeTag: '随商队去过洛阳',
          transformations: [{ type: 'gain_tag', value: '去过洛阳', description: '曾随商队前往洛阳' }],
        },
      },
      {
        id: 'ask_destination',
        text: '问问去哪里做什么买卖',
        consequence: {
          narrative: '你凑过去问了个仔细。领队说这次运的是汴京的丝绸和瓷器到洛阳，再从洛阳带回药材和山货。一来一回利润能有近三成。你暗暗记下了这条商路信息。',
          effects: { mood: 3 },
          narrativeTag: '了解过商路',
        },
      },
      {
        id: 'decline_caravan',
        text: '离家太远了',
        consequence: {
          narrative: '你想了想，五天在外漂泊不太放心家里的营生。谢绝了领队的邀请，看着他带着队伍渐渐远去。',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'repair_request',
    name: '接修活计',
    goalCategory: 'work',
    weight: 6,
    cooldownDays: 8,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['workshop', 'residential'],
      dayRange: [3, 999],
    },
    openingNarrative: '邻居王二嫂急匆匆地敲开你的门："他大兄弟，我家那个水车坏了，能不能帮忙修修？给你十文工钱！"她身后传来哗啦啦的水声——果然是漏水漏得厉害。',
    choices: [
      {
        id: 'accept_repair',
        text: '接下这活',
        condition: { field: 'health', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你花了半天时间把水车的轴承换了，又加固了叶片。试转的时候水流顺畅，王二嫂高兴得直拍手。除了工钱她还硬塞给你两个熟鸡蛋。',
          effects: { copper: 10, hunger: 6, fatigue: -12, mood: 5 },
          narrativeTag: '帮人修过东西',
          relationChange: 5,
        },
      },
      {
        id: 'raise_price',
        text: '这活儿麻烦，得多给点',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '"王二嫂，这水车坏得厉害，零件也得换，十五文吧。"王二嫂犹豫了一下："行吧，能修好就行。"你多赚了五文，心里挺满意。',
          effects: { copper: 15, hunger: 6, fatigue: -12, mood: 8 },
          narrativeTag: '议价修理费',
        },
      },
      {
        id: 'decline_repair',
        text: '今天不方便',
        consequence: {
          narrative: '"实在对不住，今天约了别的事。"王二嫂失望地点点头走了。你听着那哗啦啦的水声，心里多少有点过意不去。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'merchant_caravan',
    name: '商队招募',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 25,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'dock'],
      dayRange: [10, 999],
      actorMinHealth: 50,
    },
    openingNarrative: '一个领头的商人在茶馆招募护卫，说是要往南边运送一批丝绸，路途遥远，可能会遇到山匪。每天给二十文钱，到目的地再给五十文赏钱。',
    choices: [
      {
        id: 'join_caravan',
        text: '加入商队',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative: '你跟着商队走了十天九夜，路上确实遇到了两次山匪，但都击退了。到达目的地后，商人兑现了承诺，你揣着沉甸甸的铜钱，觉得这趟苦没白吃。',
          effects: { copper: 80, fatigue: -35, health: -10, mood: 12 },
          narrativeTag: '护送过商队',
          relationChange: 10,
        },
      },
      {
        id: 'negotiate_pay',
        text: '讨价还价',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '"老板，这价太低了。路上山匪横行，我这可是把命别在裤腰带上。"商人叹了口气："好吧，每天加五文，到头再给三十文。"你满意地点点头。',
          effects: { copper: 35, fatigue: -30, health: -8, mood: 8 },
          narrativeTag: '议价护卫费',
        },
      },
      {
        id: 'decline_caravan',
        text: '风险太大，算了吧',
        consequence: {
          narrative: '你摇摇头走了。后来听说商队确实被劫了，护卫死了一个。你庆幸自己没去，但也错过了那笔钱。',
          effects: { mood: 2 },
        },
      },
    ],
  },
  {
    id: 'harvest_season',
    name: '秋收季节',
    goalCategory: 'work',
    weight: 8,
    cooldownDays: 30,
    narrativeWeight: 'minor',
    conditions: {
      location: ['farmland'],
      season: ['秋'],
      actorMinHealth: 35,
    },
    openingNarrative: '秋收时节，田里一片金黄。李大户站在田埂上高声喊道："招短工！割一天稻子三十文，管饭！手脚麻利的来！"周围的人纷纷报名。',
    choices: [
      {
        id: 'work_harvest',
        text: '报名干活',
        consequence: {
          narrative: '你从早干到晚，腰酸背痛，手上磨出了水泡。但拿到三十文钱时，心里的疲惫一扫而空。晚上的晚饭虽然简单，但也吃得格外香。',
          effects: { copper: 30, hunger: 15, fatigue: -20, health: -5, mood: 5 },
          narrativeTag: '参加秋收',
        },
      },
      {
        id: 'work_overtime',
        text: '多干半天',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你白天干满，晚上又主动加班收剩下的稻子。李大户看你勤快，额外给了你十文钱。你拖着沉重的身子回家，但口袋沉甸甸的。',
          effects: { copper: 40, hunger: 20, fatigue: -35, health: -8, mood: 8 },
          narrativeTag: '勤劳肯干',
          relationChange: 5,
        },
      },
      {
        id: 'skip_harvest',
        text: '太累了，算了',
        consequence: {
          narrative: '你看了看火辣辣的太阳，摇摇头走了。虽然少了三十文钱，但今天的清闲也是难得。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'craftsman_commission',
    name: '匠人订单',
    goalCategory: 'work',
    weight: 6,
    cooldownDays: 18,
    narrativeWeight: 'minor',
    conditions: {
      location: ['workshop'],
      actorMinHealth: 40,
      dayRange: [5, 999],
    },
    openingNarrative: '一个财大气粗的员外来到工坊，说要定制一套上好的红木家具，限期七天完成。工钱八十文，但做工必须精细。',
    choices: [
      {
        id: 'accept_commission',
        text: '接下订单',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative: '你接下来七天日夜赶工，精雕细琢。员外来取货时，连连称赞"好手艺"，额外赏了你二十文。你累得直不起腰，但看着自己的作品，心里美滋滋的。',
          effects: { copper: 100, fatigue: -40, health: -10, mood: 15 },
          narrativeTag: '完成定制',
          relationChange: 10,
        },
      },
      {
        id: 'rush_job',
        text: '赶工（质量可能下降）',
        consequence: {
          narrative: '你想早点完事，三天就做完了。员外来看时，皱着眉头说"太粗糙了"，只给了六十文。你虽然早几天休息，但心里不是滋味。',
          effects: { copper: 60, fatigue: -20, mood: -8 },
          narrativeTag: '粗制滥造',
          relationChange: -5,
        },
      },
      {
        id: 'decline_commission',
        text: '时间太紧，接不了',
        consequence: {
          narrative: '你看了看自己手头的活，摇摇头："员外，实在对不住，活儿排满了。"员外也不勉强，转身去找别的匠人了。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'night_shift',
    name: '夜班守更',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 12,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['street', 'residential'],
      dayRange: [8, 999],
      actorMinHealth: 40,
    },
    openingNarrative: '巡街的捕头在招人帮忙守夜——最近城里不太平，得有人夜里巡逻。一宿十文钱，天亮结账。',
    choices: [
      {
        id: 'take_night_shift',
        text: '接下夜班',
        consequence: {
          narrative: '你拿着灯笼，在街上来回走了一宿。困得眼皮打架，但好在没出什么事。天亮时拿到铜钱，回家补觉去了。',
          effects: { copper: 10, fatigue: -25, health: -3, mood: -5 },
          narrativeTag: '守过夜',
        },
      },
      {
        id: 'catch_thief',
        text: '认真巡逻（可能抓贼）',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你打起精神仔细巡视，果然在后巷抓住了两个偷鸡贼！捕头夸奖你，额外给了你二十文赏钱。一夜没白熬！',
          effects: { copper: 30, fatigue: -28, health: -5, mood: 12 },
          narrativeTag: '抓获窃贼',
          relationChange: 8,
        },
      },
      {
        id: 'decline_night',
        text: '身体受不了',
        consequence: {
          narrative: '你摇摇头："最近太累了，熬不动夜。"捕头也理解，转身去找别人了。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'fishing_competition',
    name: '捕鱼比赛',
    goalCategory: 'work',
    weight: 5,
    cooldownDays: 22,
    narrativeWeight: 'minor',
    conditions: {
      location: ['dock', 'riverside'],
      season: ['春', '夏'],
      actorMinHealth: 35,
    },
    openingNarrative: '汴河上的渔民们今天举办捕鱼比赛，谁捕的鱼最多，就能赢得五十文钱和"渔王"的称号。你也有一艘小船，想不想试试？',
    choices: [
      {
        id: 'join_competition',
        text: '参加比赛',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative: '你撒网收网，忙活了一天。最后称重时，你捕的鱼虽然不是最多，但也进了前十，得到了十五文钱的鼓励奖。不算白忙活！',
          effects: { copper: 15, hunger: 12, fatigue: -18, mood: 8 },
          narrativeTag: '参加渔赛',
        },
      },
      {
        id: 'help_competitor',
        text: '帮别人比赛',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你帮着老张头划船、收网。老张头经验丰富，在你配合下得了第三名！他高兴地分给你二十五文钱，说有你一半功劳。',
          effects: { copper: 25, hunger: 8, fatigue: -15, mood: 10 },
          narrativeTag: '合作捕鱼',
          relationChange: 10,
        },
      },
      {
        id: 'just_fish',
        text: '自己打鱼就好',
        consequence: {
          narrative: '你不想比赛，自己找个角落打鱼。一天下来打了些鱼，拿到集市卖了，也挣了十几文。安稳踏实。',
          effects: { copper: 12, hunger: 10, fatigue: -12, mood: 5 },
        },
      },
    ],
  },
  {
    id: 'herbal_gathering',
    name: '采药进山',
    goalCategory: 'work',
    weight: 6,
    cooldownDays: 15,
    narrativeWeight: 'minor',
    conditions: {
      location: ['mountain'],
      actorMinHealth: 40,
      dayRange: [7, 999],
    },
    openingNarrative: '药铺的郎中说最近急需几味草药——人参、黄芪、当归，如果有人能采来，他愿意高价收购。你记得山林深处有这些药。',
    choices: [
      {
        id: 'gather_herbs',
        text: '进山采药',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你在山林里转了两天，终于找到了那几味药。虽然被蚊子咬了一身包，也差点从山坡上滚下去，但把药卖给郎中后，得了四十五文，觉得值了。',
          effects: { copper: 45, health: -8, fatigue: -20, mood: 10 },
          narrativeTag: '采过草药',
          relationChange: 5,
        },
      },
      {
        id: 'hire_guide',
        text: '雇人带路',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative: '你花了十文钱雇了个熟悉山路的猎户带路。果然事半功倍，半天就采齐了药。扣除带路费，还赚了三十文。',
          effects: { copper: 30, fatigue: -12, mood: 8 },
          narrativeTag: '雇人采药',
        },
      },
      {
        id: 'too_dangerous',
        text: '山林里太危险',
        consequence: {
          narrative: '你摇摇头放弃了。最近听说山里有野兽出没，犯不着为了几十文钱冒险。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'business_partner',
    name: '合伙提议',
    goalCategory: 'work',
    weight: 4,
    cooldownDays: 28,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'teahouse'],
      dayRange: [15, 999],
      actorMinCopper: 50,
    },
    openingNarrative: '你常去买东西的那个杂货铺老板王掌柜，今天把你拉到一边："小兄弟，我看你为人实在，跟你商量个事。我想扩大生意，但本金不够，你入个股怎么样？利润三七开，你三我七。"',
    choices: [
      {
        id: 'invest_partner',
        text: '投资五十文',
        condition: { field: 'copper', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你拿出五十文钱给了王掌柜。三个月后，他带着一百文钱来找你："生意不错，这是你的分红。"你尝到了甜头，觉得投资这条路子或许可行。',
          effects: { copper: 50, mood: 15 },
          narrativeTag: '做过投资',
          transformations: [{ type: 'gain_tag', value: '有经商经验', description: '参与过商业投资' }],
          relationChange: 12,
        },
      },
      {
        id: 'decline_partner',
        text: '风险太大',
        consequence: {
          narrative: '"掌柜的，多谢好意。但这钱来得不易，我还是守着它踏实。"王掌柜也不勉强，笑笑说理解。后来听说他生意确实不错，但你也不后悔。',
          effects: { mood: -2 },
        },
      },
      {
        id: 'ask_details',
        text: '先问清楚生意计划',
        consequence: {
          narrative: '你详细问了王掌柜的经营计划，觉得还算靠谱。但你还是说"容我考虑几天"，想再观察观察。',
          effects: { mood: 3 },
          narrativeTag: '了解过经商',
        },
      },
    ],
  },
  {
    id: 'government_project',
    name: '官府征工',
    goalCategory: 'work',
    weight: 6,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'government_office'],
      dayRange: [20, 999],
      actorMinHealth: 45,
    },
    openingNarrative: '官府贴出告示，说要修筑河堤，招民夫。一个月工期，每天给二十五文钱，管饭。就是活儿重，得从早干到晚。',
    choices: [
      {
        id: 'join_project',
        text: '报名干活',
        consequence: {
          narrative: '你干了一个月，累得像条狗。但拿到七百五十文钱时，觉得一切辛苦都值了。回家好好休息了三天才缓过来。',
          effects: { copper: 75, hunger: 30, fatigue: -50, health: -15, mood: 5 },
          narrativeTag: '修过河堤',
        },
      },
      {
        id: 'work_half_month',
        text: '干半个月试试',
        consequence: {
          narrative: '你干了半个月就撑不住了，领了三百七十五文钱回家了。工头说你"吃不了苦"，但你觉得量力而行也挺好。',
          effects: { copper: 37, hunger: 15, fatigue: -25, health: -8, mood: 0 },
          narrativeTag: '短期苦力',
        },
      },
      {
        id: 'decline_project',
        text: '这活儿太重了',
        consequence: {
          narrative: '你看了看工地上那些累得直不起腰的民夫，摇摇头走了。这钱不是一般人能挣的。',
          effects: { mood: 0 },
        },
      },
    ],
  },
];
