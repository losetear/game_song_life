import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const ADVENTURE_EVENTS: BranchEvent[] = [
  {
    id: 'adventure_tomb',
    name: '古墓探险',
    goalCategory: 'adventure',
    weight: 6,
    cooldownDays: 40,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain'],
      dayRange: [10, 999],
      requiredAnyNarrativeTags: ['探索者', '知道山洞位置'],
      actorMinHealth: 50,
    },
    openingNarrative:
      '你追踪着那个传说中的洞穴，越走越深。忽然脚下一空——你掉进了一条古老的甬道！四周石壁上刻满了看不懂的文字，空气中弥漫着陈腐的气息。前方隐约有光亮。',
    choices: [
      {
        id: 'tomb_explore',
        text: '壮着胆子往前走',
        consequence: {
          narrative:
            '你摸索前行，发现这是一座前朝的古墓！墓室中有一具石棺和随葬的青铜器。你小心翼翼地取了一件小巧的玉佩——这东西拿到集市上怕能值不少钱。',
          effects: { copper: 40, mood: 15, fatigue: 12, health: -5 },
          narrativeTag: '古墓探宝',
          relationChange: 3,
        },
      },
      {
        id: 'tomb_retreat',
        text: '赶紧找路出去',
        consequence: {
          narrative:
            '你不敢久留，沿着来路摸索回去。费了好大劲才从洞口爬出来，躺在地上喘了半天。虽然什么都没得到，但这条命保住了。',
          effects: { fatigue: 15, health: -3, mood: -2 },
          narrativeTag: '死里逃生',
        },
      },
      {
        id: 'tomb_search_thoroughly',
        text: '仔细搜索每个角落',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative:
            '你不放过任何细节，在墓室暗格中发现了一卷竹简和一把锈蚀的短剑。竹简上记载的是一套失传的剑法残篇！这可是真正的宝贝。',
          effects: { copper: 25, mood: 20, fatigue: 18, health: -8 },
          narrativeTag: '得获秘籍',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '习得剑法残篇' },
          ],
        },
      },
    ],
  },
  {
    id: 'adventure_treasure_map',
    name: '藏宝图',
    goalCategory: 'adventure',
    weight: 7,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'market', 'teahouse'],
      dayRange: [8, 999],
      forbiddenNarrativeTags: ['藏宝图'],
    },
    openingNarrative:
      '一个衣衫褴褛的老乞丐拦住了你，神神秘秘地从怀里掏出一张泛黄的羊皮纸："小伙子，看你面善，这个便宜卖你了，只要五文钱。"你凑近一看，那竟是一张画着山川地形的图纸。',
    choices: [
      {
        id: 'map_buy',
        text: '买下来看看',
        condition: { field: 'copper', operator: 'gte', value: 5 },
        consequence: {
          narrative:
            '你花五文钱买下羊皮纸，仔细辨认上面的标记——似乎是城外山林中某个地点的路线图，末端画着一个罐子的符号。老乞丐嘿嘿一笑，转眼就不见了人影。',
          effects: { copper: -5, mood: 8 },
          narrativeTag: '藏宝图',
        },
      },
      {
        id: 'map_refuse',
        text: '不上当，这是骗人的',
        consequence: {
          narrative:
            '你摇摇头走开了。身后传来老乞丐的嘀咕："啧，又是一个不信运气的。"你也没当回事，但后来几天总忍不住想——万一呢？',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'adventure_stranger',
    name: '神秘旅人',
    goalCategory: 'adventure',
    weight: 6,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'teahouse', 'mountain'],
      dayRange: [6, 999],
      forbiddenNarrativeTags: ['神秘朋友'],
    },
    openingNarrative:
      '茶馆角落坐着一个戴斗笠的陌生人，腰间挂着一把造型奇特的短刀。他独自饮酒，目光不时扫视全场，似乎在寻找什么人。忽然他的目光停在了你身上。',
    choices: [
      {
        id: 'stranger_talk',
        text: '主动过去搭话',
        consequence: {
          narrative:
            '你在他对面坐下。他上下打量了你一番，低声说："我在找一个胆子大的人。城外有件事，我一个人办不了，有兴趣吗？"他没说是什么事，但你从他眼中看到了一丝兴奋。',
          effects: { mood: 6 },
          narrativeTag: '神秘朋友',
          relationChange: 2,
        },
      },
      {
        id: 'stranger_ignore',
        text: '假装没注意到',
        consequence: {
          narrative:
            '你低头喝茶，尽量不与那人目光接触。过了一会儿，他起身走了。你松了口气，又隐隐有些好奇——他到底在找谁？',
          effects: { mood: 1 },
        },
      },
      {
        id: 'stranger_report',
        text: '告诉捕快这里有个可疑的人',
        consequence: {
          narrative:
            '你悄悄找到捕头说了这事。等你们回到茶馆时，那戴斗笠的人早已不知去向。桌上只留下一枚铜钱，压着一张纸条："多管闲事。"捕头皱起了眉头。',
          effects: { copper: 1, mood: -3 },
          narrativeTag: '得罪了神秘人',
          relationChange: -3,
        },
      },
    ],
  },
  {
    id: 'adventure_trap_room',
    name: '机关密室',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 45,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain', 'ruins'],
      requiredAnyNarrativeTags: ['探索者', '知道山洞位置', '古墓探宝'],
      actorMinHealth: 45,
      dayRange: [15, 999],
    },
    openingNarrative:
      '你在山中探索时发现了一个隐蔽的石门，门上刻着"入此门者，生死自负"八个大字。推开门后是一条狭长的通道，地面上的石板有些松动——显然是某种机关。',
    choices: [
      {
        id: 'trap_careful',
        text: '小心试探每一步',
        consequence: {
          narrative:
            '你用随身带的树枝逐一试探石板，花了半个时辰才通过通道。尽头是一间小小的密室，墙上挂着几把精良的兵器和一袋铜钱！看来是某位前辈留下的练功之所。',
          effects: { copper: 30, mood: 12, fatigue: 10 },
          narrativeTag: '破解机关',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '获得兵器' },
          ],
        },
      },
      {
        id: 'trap_dare',
        text: '凭直觉快速冲过去',
        condition: { field: 'health', operator: 'gte', value: 65 },
        consequence: {
          narrative:
            '你深吸一口气，飞奔而过！箭矢从两侧射出，有几支擦着你的皮肤掠过。你滚到通道尽头，手臂上多了道血口子，但身后的机关已经停止了。密室中的战利品归你了。',
          effects: { copper: 35, mood: 18, health: -10, fatigue: 5 },
          narrativeTag: '闯过机关',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '以胆识获得兵器' },
          ],
        },
      },
      {
        id: 'trap_retreat',
        text: '太危险了，撤吧',
        consequence: {
          narrative:
            '你看着那些松动的石板，摇摇头退了出来。也许有一天你会后悔今天的谨慎，但至少你还活着。',
          effects: { mood: -2 },
          narrativeTag: '知难而退',
        },
      },
    ],
  },
  {
    id: 'adventure_lost_book',
    name: '失落古籍',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 38,
    narrativeWeight: 'major',
    conditions: {
      location: ['market', 'street', 'residential'],
      dayRange: [12, 999],
      forbiddenNarrativeTags: ['古籍持有者'],
    },
    openingNarrative:
      '你在旧书摊上翻找时，一本落满灰尘的册子引起了你的注意。摊主说："这书是我从一处废宅收来的，字都看不太懂，你要的话两文钱拿走。"翻开第一页，上面写着《汴京风物异闻录》。',
    choices: [
      {
        id: 'book_buy',
        text: '买下来研究',
        condition: { field: 'copper', operator: 'gte', value: 2 },
        consequence: {
          narrative:
            '你将书带回家细细研读，里面记载了许多汴京城中鲜为人知的秘闻——哪口井的水能治病、哪个巷子里藏着暗道、哪家铺子的老板是前朝遗民……信息量巨大！',
          effects: { copper: -2, mood: 10 },
          narrativeTag: '古籍持有者',
        },
      },
      {
        id: 'book_flip',
        text: '翻翻就放回去',
        consequence: {
          narrative:
            '你随手翻了翻，觉得不过是些荒诞不经的故事，便放回原处。多年以后你才偶然听说，那本书曾被一位藏书家高价求购……',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'adventure_spirit_snake',
    name: '灵蛇守护',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 28,
    conditions: {
      location: ['mountain', 'forest'],
      season: ['春', '夏'],
      actorMinHealth: 55,
      dayRange: [8, 999],
    },
    openingNarrative:
      '你在溪边歇脚时，发现一块巨石后面隐隐有金光闪烁。刚要靠近，一条碗口粗的青蛇从石缝中游出，盘踞在石头前面，冰冷的蛇瞳死死盯着你。',
    choices: [
      {
        id: 'snake_fight',
        text: '找根棍子驱赶它',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative:
            '你抄起树枝与青蛇周旋了小半柱香的功夫，终于将它赶走。巨石后面是一个小小的洞穴，里面有一颗拳头大的珠子——夜明珠！',
          effects: { copper: 50, health: -8, fatigue: 10, mood: 15 },
          narrativeTag: '斗蛇得宝',
        },
      },
      {
        id: 'snake_wait',
        text: '耐心等待它离开',
        consequence: {
          narrative:
            '你远远地坐着等了大半个时辰，青蛇终于缓缓游进了草丛。你赶紧上前查看——洞穴中有几枚蛇蜕和一些散碎的金叶子。',
          effects: { copper: 20, fatigue: 8, mood: 8 },
          narrativeTag: '智取蛇宝',
        },
      },
      {
        id: 'snake_leave',
        text: '惹不起，溜了',
        consequence: {
          narrative:
            '你慢慢后退，转身离开。走了好远还心有余悸。后来你听猎户说，那种青蛇是有灵性的，守护的东西往往不一般。',
          effects: { mood: -3, fatigue: 2 },
          narrativeTag: '错失灵蛇之宝',
        },
      },
    ],
  },
  {
    id: 'adventure_dark_river',
    name: '暗河渡船',
    goalCategory: 'adventure',
    weight: 4,
    cooldownDays: 42,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain'],
      requiredAnyNarrativeTags: ['探索者', '知道山洞位置', '古墓探宝'],
      actorMinHealth: 40,
      dayRange: [14, 999],
    },
    openingNarrative:
      '洞穴深处传来水声。循声而去，你惊讶地发现一条地下暗河！河水漆黑如墨，却异常平静。岸边系着一艘腐朽的小舟，似乎可以乘坐。',
    choices: [
      {
        id: 'river_boat',
        text: '划船探索',
        consequence: {
          narrative:
            '你登上小舟，沿暗河而行。两岸岩壁上偶尔可见古代留下的壁画。行了约莫一盏茶的功夫，前方出现了一处溶洞，洞中堆放着大量前朝的钱币和器物——这里是某个逃亡贵族的藏匿之处！',
          effects: { copper: 55, mood: 18, fatigue: 12, health: -3 },
          narrativeTag: '暗河寻宝',
        },
      },
      {
        id: 'river_turn_back',
        text: '太危险了，返回',
        consequence: {
          narrative:
            '你看了看那摇摇欲坠的小舟，决定还是不要冒险。沿着原路返回时，你在洞口捡到了一块不错的玉石——大概是以前某个探险者落下的。',
          effects: { copper: 10, mood: 3 },
          narrativeTag: '拾遗而归',
        },
      },
    ],
  },
  {
    id: 'adventure_cliff_find',
    name: '悬崖发现',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 25,
    conditions: {
      location: ['mountain'],
      actorMinHealth: 50,
      dayRange: [6, 999],
    },
    openingNarrative:
      '你在山崖边行走时，脚下的碎石突然滑落。你险些跌下去，慌乱中抓住了一根从崖壁缝隙中长出的老藤。抬头一看，藤蔓后面的凹槽里似乎藏着什么东西。',
    choices: [
      {
        id: 'cliff_reach',
        text: '冒险伸手去够',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你一手紧抓老藤，一手探向凹槽。指尖触到了一个布包——里面是一包干粮和一袋铜钱，还有一张发黄的纸条："留给有缘人。"看来是某位前人留下的馈赠。',
          effects: { copper: 22, hunger: 15, mood: 10, health: -5, fatigue: 5 },
          narrativeTag: '悬崖得遇',
        },
      },
      {
        id: 'cliff_safe',
        text: '先爬上来再想办法',
        consequence: {
          narrative:
            '你小心翼翼地爬回安全地带，找了根长树枝去探那个凹槽。布包掉落下来，但里面的铜钱顺着崖缝滑落了几枚，只剩下一半。',
          effects: { copper: 10, hunger: 8, mood: 5 },
          narrativeTag: '化险为夷',
        },
      },
    ],
  },
  {
    id: 'adventure_undercity',
    name: '地下城入口',
    goalCategory: 'adventure',
    weight: 4,
    cooldownDays: 50,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['residential', 'workshop', 'street'],
      requiredAnyNarrativeTags: ['探索者', '古籍持有者'],
      actorMinHealth: 45,
      dayRange: [20, 999],
    },
    openingNarrative:
      '你家地窖的角落里有一块松动的砖。你一直以为那是老鼠洞，今天搬开一看——后面竟然是一条向下延伸的石阶！潮湿的气息扑面而来，隐约还能听到远处传来的滴水声。',
    choices: [
      {
        id: 'undercity_enter',
        text: '下去一探究竟',
        consequence: {
          narrative:
            '你点燃火把沿石阶而下，发现这是一条废弃的地道，据说曾是前朝的军事通道。地道四通八达，墙壁上有指示方向的标记。你只探索了一小段就不得不返回（火把快烧完了），但已经记住了入口的位置。',
          effects: { mood: 15, fatigue: 10, health: -2 },
          narrativeTag: '地下城发现者',
          transformations: [
            { type: 'gain_tag', value: '知道秘密通道', description: '发现地下城入口' },
          ],
        },
      },
      {
        id: 'undercity_seal',
        text: '封死它，太危险了',
        consequence: {
          narrative:
            '你用泥浆和砖块将洞口重新封死。谁知道下面有什么？还是不知道比较好。但那天晚上你梦见自己走在那条无尽的石阶上……',
          effects: { mood: -2 },
          narrativeTag: '封存秘密',
        },
      },
    ],
  },
  {
    id: 'adventure_immortal_guide',
    name: '仙人指路',
    goalCategory: 'adventure',
    weight: 3,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain', 'temple'],
      dayRange: [30, 999],
      actorMaxMood: 50,
    },
    openingNarrative:
      '山中迷雾弥漫，你不知不觉走上了岔路。雾气中走来一个白发苍苍的老者，手持竹杖，步履轻盈得不像是凡人。他看了你一眼，微微一笑："年轻人，迷路了吗？"',
    choices: [
      {
        id: 'immortal_follow',
        text: '跟着他走',
        consequence: {
          narrative:
            '你跟随老者在雾中穿行，不知走了多久。雾散时，你发现自己站在一条从未见过的小径旁，路边放着一个小包裹，里面有足够的干粮和铜钱，还有一张纸条："行善积德，自有福报。"回头望去，老者已不见踪影。',
          effects: { copper: 30, hunger: 20, mood: 20, fatigue: -10 },
          narrativeTag: '仙人指路',
        },
      },
      {
        id: 'immortal_ask',
        text: '向他请教人生困惑',
        consequence: {
          narrative:
            '你向老者倾诉了心中的困惑。他听完哈哈大笑："得失皆是缘，何必太执着？"说完用手杖在地上画了个圈，让你站进去。一阵微风吹过，雾气消散，你发现自己竟然回到了熟悉的山路上。心中的阴霾也散去了不少。',
          effects: { mood: 15, fatigue: -5 },
          narrativeTag: '仙人点化',
        },
      },
    ],
  },
  {
    id: 'adventure_hidden_cave',
    name: '隐秘洞窟',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 32,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain', 'forest'],
      actorMinHealth: 45,
      dayRange: [12, 999],
      requiredAnyNarrativeTags: ['探索者', '知道山洞位置'],
    },
    openingNarrative:
      '你在密林深处发现了一个被藤蔓遮蔽的洞口。扒开藤蔓，洞中透出微弱的蓝光。你犹豫了一下，点燃火把慢慢走了进去。洞壁上长满了发光的苔藓，空气中弥漫着奇异的花香。',
    choices: [
      {
        id: 'cave_explore_deep',
        text: '深入探索',
        consequence: {
          narrative:
            '你沿着洞穴走了约莫百步，豁然开朗——这是一个巨大的地下溶洞！中央有一方碧绿的水潭，潭边生长着你从未见过的奇花异草。你小心翼翼地采了几株，这东西在药铺应该能卖个好价钱。',
          effects: { copper: 35, mood: 15, fatigue: 12 },
          narrativeTag: '发现秘境',
          transformations: [
            { type: 'gain_tag', value: '见闻广博', description: '探索过隐秘洞窟' },
          ],
        },
      },
      {
        id: 'cave_collect_only',
        text: '只采集些苔藓就离开',
        consequence: {
          narrative:
            '你不想冒险深入，只在洞口采集了一些发光苔藓。这些苔藓拿回去可以当夜灯用，在黑市上也有销路。',
          effects: { copper: 15, mood: 6 },
          narrativeTag: '采集发光苔藓',
        },
      },
      {
        id: 'cave_mark_return',
        text: '做个标记，改日再来',
        consequence: {
          narrative:
            '你在洞口做了个记号，打算有准备之后再来探索。回家后你一直想着那个神秘的蓝光……',
          effects: { mood: 3 },
          narrativeTag: '发现秘洞位置',
        },
      },
    ],
  },
  {
    id: 'adventure_old_well',
    name: '古井秘密',
    goalCategory: 'adventure',
    weight: 4,
    cooldownDays: 38,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['residential', 'farmland', 'temple'],
      actorMinHealth: 40,
      dayRange: [15, 999],
      forbiddenNarrativeTags: ['古井探索者'],
    },
    openingNarrative:
      '废弃的庭院里有一口干涸的古井。井口刻着"此地无银三百两"的字样。你探头往里看，井壁上似乎有蹬踏的痕迹，而且深处隐约有风吹来——井底另有乾坤！',
    choices: [
      {
        id: 'well_climb_down',
        text: '爬下去看看',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你顺着井壁小心翼翼地爬下去。井底果然有一条横向的地道！沿着地道走了数十步，你发现了一个密室——墙上挂着前朝的藏宝图一角和一袋银币。看来有人曾在这里藏匿财物。',
          effects: { copper: 45, mood: 18, fatigue: 15, health: -5 },
          narrativeTag: '古井探索者',
          transformations: [
            { type: 'gain_tag', value: '知道宝藏线索', description: '获得藏宝图一角' },
          ],
        },
      },
      {
        id: 'well_throw_stone',
        text: '扔块石头探探路',
        consequence: {
          narrative:
            '你捡了块石头扔下去。过了很久才传来回声——井很深，而且底部似乎是空的。你不敢冒险下去，但心里一直想着那口井……',
          effects: { mood: 2 },
          narrativeTag: '古井好奇者',
        },
      },
      {
        id: 'well_ignore',
        text: '太危险了，离开',
        consequence: {
          narrative:
            '你摇摇头离开了。几天后你听说有人在附近挖出了前朝的文物，你心里隐隐有些后悔……',
          effects: { mood: -3 },
        },
      },
    ],
  },
  {
    id: 'adventure_abandoned_temple',
    name: '荒庙夜话',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 28,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain', 'forest'],
      weather: ['雨', '阴'],
      actorMinHealth: 35,
      dayRange: [8, 999],
    },
    openingNarrative:
      '夜幕降临，雨越下越大。你在山中发现了一座破败的庙宇，决定进去避雨。庙中神像残破，但香案上却有一盏刚点燃的油灯——有人刚刚来过！',
    choices: [
      {
        id: 'temple_wait',
        text: '等雨停了再走',
        consequence: {
          narrative:
            '你在角落里坐下，闭目养神。半夜时分，你听见外面有人说话的声音……"就在这儿交易……"你屏住呼吸，听出这是几个江湖人物的密谈。天快亮时他们离开了，你发现地上丢了一个小包袱。',
          effects: { copper: 20, mood: 12 },
          narrativeTag: '偷听到秘密',
        },
      },
      {
        id: 'temple_hide',
        text: '躲起来看看是谁',
        consequence: {
          narrative:
            '你躲到神像后面。不一会儿，三个黑衣人走了进来，开始搬运藏在神像后面的东西。你认出其中一人竟然是通缉的江洋大盗！等他们走后，你发现神像后面还有一个小箱子他们没来得及带走。',
          effects: { copper: 40, mood: 10, fatigue: 8 },
          narrativeTag: '神像藏宝',
        },
      },
      {
        id: 'temple_leave_immediately',
        text: '此地不宜久留',
        consequence: {
          narrative:
            '你不想惹麻烦，冒着雨离开了庙宇。第二天你听说那座庙被烧了，据说是因为江湖仇杀……',
          effects: { health: -5, mood: -2 },
        },
      },
    ],
  },
  {
    id: 'adventure_waterfall_cave',
    name: '瀑布洞穴',
    goalCategory: 'adventure',
    weight: 6,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain', 'riverbank'],
      season: ['春', '夏'],
      actorMinHealth: 50,
      dayRange: [10, 999],
    },
    openingNarrative:
      '山中瀑布飞流直下，水声震天。你注意到瀑布后面似乎有个凹陷，走近一看——果然有个洞穴！但水流湍急，要钻进去需要冒险。',
    choices: [
      {
        id: 'waterfall_dash',
        text: '冲过瀑布进入洞穴',
        condition: { field: 'health', operator: 'gte', value: 60 },
        consequence: {
          narrative:
            '你深吸一口气，猛地冲进瀑布！冰凉的水流打在身上，但你成功钻进了后面的洞穴。洞中干燥温暖，石壁上刻满了古代剑客的练功心得。你仔细研读了片刻，感觉受益匪浅。',
          effects: { mood: 20, health: -8, fatigue: 10 },
          narrativeTag: '水帘洞探险',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '学习古代剑客心得' },
          ],
        },
      },
      {
        id: 'waterfall_observe',
        text: '先观察一下',
        consequence: {
          narrative:
            '你在岸边观察了许久，发现水流在某些时候会变小。你耐心等待，终于等到水流减弱的间隙，小心翼翼地钻了进去。洞穴中没什么特别的东西，但有几块漂亮的玉石。',
          effects: { copper: 18, mood: 8, fatigue: 5 },
          narrativeTag: '耐心探索',
        },
      },
      {
        id: 'waterfall_give_up',
        text: '太危险了，放弃',
        consequence: {
          narrative:
            '你看了看那湍急的水流，摇摇头离开了。虽然没看到洞穴里面是什么，但至少保住了平安。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'adventure_jungle_ruins',
    name: '丛林遗迹',
    goalCategory: 'adventure',
    weight: 4,
    cooldownDays: 45,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain', 'forest'],
      requiredAnyNarrativeTags: ['探索者', '古籍持有者'],
      actorMinHealth: 45,
      dayRange: [20, 999],
    },
    openingNarrative:
      '深入密林后，你发现了一片被藤蔓覆盖的古老建筑。断壁残垣间依稀可见精美的石雕，似乎是一处前朝的遗迹。阳光透过树冠洒下，给这片废墟增添了神秘的色彩。',
    choices: [
      {
        id: 'ruins_excavate',
        text: '仔细挖掘',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你花了大半天时间清理废墟，发现了一块保存完好的石碑，上面记载着一段历史。更重要的是，你在石座下发现了一个精致的青铜器——这东西卖给古董商人能值不少钱！',
          effects: { copper: 55, mood: 18, fatigue: 18 },
          narrativeTag: '考古发现',
          transformations: [
            { type: 'gain_tag', value: '见闻广博', description: '研究过古代遗迹' },
          ],
        },
      },
      {
        id: 'ruins_sketch',
        text: '画下来，不挖掘',
        consequence: {
          narrative:
            '你拿出纸笔，仔细绘制了遗迹的平面图和石碑上的文字。虽然没有得到实物，但这些资料卖给学者也能赚些钱。',
          effects: { copper: 25, mood: 12 },
          narrativeTag: '记录古迹',
        },
      },
      {
        id: 'ruins_leave',
        text: '只是看看就走',
        consequence: {
          narrative:
            '你在遗迹中漫步了一会儿，感受着历史的厚重。虽然没有得到什么，但这种与古人对话的感觉让你心中平静。',
          effects: { mood: 8, fatigue: 3 },
        },
      },
    ],
  },
  {
    id: 'adventure_mysterious_merchant',
    name: '神秘商人',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain', 'forest', 'street'],
      dayRange: [12, 999],
      actorMinCopper: 20,
      forbiddenNarrativeTags: ['神秘商人相识'],
    },
    openingNarrative:
      '山间小路上，一个推着独轮车的商人叫住了你："年轻人，看看我的货？都是好东西。"车上摆满了各种奇奇怪怪的物品——石头、骨头、金属片……但最引人注目的是一个古旧的罗盘。',
    choices: [
      {
        id: 'merchant_buy_compass',
        text: '买下罗盘',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你花了三十文买下罗盘。商人嘿嘿一笑："这东西能指引你找到想要的东西……"你半信半疑，但后来发现罗盘确实有些奇怪——在某些地方指针会疯狂转动。',
          effects: { copper: -30, mood: 10 },
          narrativeTag: '神秘商人相识',
          transformations: [
            { type: 'gain_tag', value: '拥有奇物', description: '获得神秘罗盘' },
          ],
        },
      },
      {
        id: 'merchant_chat',
        text: '和他聊聊这些货物的来历',
        consequence: {
          narrative:
            '你和商人攀谈起来。他告诉你这些东西都是从各地收集的"有缘之物"。聊着聊着，你发现他对江湖秘闻了如指掌。你请他喝了壶茶，他告诉你一个关于山中宝藏的线索。',
          effects: { copper: -8, mood: 8 },
          narrativeTag: '神秘商人相识',
          transformations: [
            { type: 'gain_tag', value: '知道宝藏线索', description: '从神秘商人处得知' },
          ],
        },
      },
      {
        id: 'merchant_ignore',
        text: '不感兴趣',
        consequence: {
          narrative:
            '你摇摇头走开了。商人也不在意，继续推着车往前走。后来你听说有人从他那里买到了真正的好东西……',
          effects: { mood: -1 },
        },
      },
    ],
  },
  {
    id: 'adventure_battlefield_relics',
    name: '古战场遗物',
    goalCategory: 'adventure',
    weight: 5,
    cooldownDays: 40,
    narrativeWeight: 'minor',
    conditions: {
      location: ['mountain', 'farmland'],
      actorMinHealth: 40,
      dayRange: [15, 999],
    },
    openingNarrative:
      '你在山中发现了多年前古战场的遗迹。残破的兵器、朽烂的盔甲散落在荒草中，风一吹发出呜呜的声响。这里曾是一场惨烈战役的发生地。',
    choices: [
      {
        id: 'battlefield_search',
        text: '仔细搜寻',
        consequence: {
          narrative:
            '你在废墟中仔细翻找，发现了一把还能使用的断剑和一面盾牌。虽然不是什么宝物，但经过打磨修复还能用。更重要的是，你在尸骨下发现了一个钱袋。',
          effects: { copper: 22, mood: 8, fatigue: 10 },
          narrativeTag: '战场拾遗',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '获得战利品武器' },
          ],
        },
      },
      {
        id: 'battlefield_pray',
        text: '为死者祈祷',
        consequence: {
          narrative:
            '你双手合十，为那些战死的英魂祈祷。不知是不是错觉，你感觉周围的阴冷气息消散了不少。离开时，你在路边发现了一块可以用来磨刀的好石头。',
          effects: { mood: 12 },
          narrativeTag: '祭奠亡灵',
        },
      },
      {
        id: 'battlefield_leave_quickly',
        text: '速速离开',
        consequence: {
          narrative:
            '你总觉得这里阴森森的，加快脚步离开了。虽然什么都没得到，但心里踏实多了。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'adventure_mountain_hermit',
    name: '山中隐士',
    goalCategory: 'adventure',
    weight: 4,
    cooldownDays: 50,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain', 'temple'],
      dayRange: [25, 999],
      actorMaxMood: 60,
      requiredAnyNarrativeTags: ['探索者', '身手不凡'],
    },
    openingNarrative:
      '深山之中，你发现了一间简陋的茅屋。屋外种着几亩菜地，一个白发老者正在浇灌。看到你，他既不惊讶也不招呼，只是淡淡地说："难得有人能找到这里。"你突然意识到，这位老者定非等闲之辈。',
    choices: [
      {
        id: 'hermit_seek_guidance',
        text: '向他请教',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你在茅屋前跪下，恳求老者指点。老者看了你半晌，终于开口："心若如止水，万物自明。"他传授了你一套呼吸吐纳的方法。你按照方法修炼了几日，感觉身体轻盈了许多。',
          effects: { health: 20, mood: 15, fatigue: -10 },
          narrativeTag: '隐士传艺',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '习得养生之法' },
          ],
        },
      },
      {
        id: 'hermit_help_work',
        text: '帮他做些农活',
        consequence: {
          narrative:
            '你二话不说，拿起锄头帮老者锄草、浇水。老者也不说话，只是默默看着。日落时分，他递给你一个布包，里面是一些草药和干粮，还有一张纸条："有缘再见。"',
          effects: { hunger: 15, health: 5, mood: 10 },
          narrativeTag: '隐世高人相识',
        },
      },
      {
        id: 'hermit_respect_bow',
        text: '恭敬作揖后离开',
        consequence: {
          narrative:
            '你不想打扰这位隐士的清净，恭敬作揖后告辞。老者微微点头，目送你离开。下山路上，你觉得神清气爽，仿佛卸下了什么重担。',
          effects: { mood: 8, fatigue: -5 },
        },
      },
    ],
  },
];
