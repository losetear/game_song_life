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
];
