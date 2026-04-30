import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const SPECIAL_EVENTS: BranchEvent[] = [
  {
    id: 'festival_day',
    name: '佳节',
    goalCategory: 'special',
    weight: 15,
    cooldownDays: 30,
    narrativeWeight: 'milestone',
    conditions: {
      season: ['春'],
      dayRange: [15, 20],
    },
    openingNarrative: '今日是上元佳节，满街挂满了花灯，烟火在夜空中绽放。到处是欢声笑语，空气中弥漫着甜食的香气。',
    choices: [
      {
        id: 'join_festival',
        text: '加入庆祝',
        consequence: {
          narrative: '你随着人群赏灯、猜谜，还吃了碗热腾腾的汤圆。难得的好时光，心情格外舒畅。',
          effects: { mood: 20, hunger: 10, copper: -5 },
          narrativeTag: '过上元节',
        },
      },
      {
        id: 'sell_at_festival',
        text: '趁机做买卖',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你进了一批花灯和糖果，在人群中叫卖。节日气氛好，生意也格外红火。',
          effects: { copper: 35, fatigue: -10, mood: 5 },
          narrativeTag: '节日商贩',
        },
      },
      {
        id: 'stay_home',
        text: '在家待着',
        consequence: {
          narrative: '热闹是他们的，与你无关。你窝在住处听着远处的喧嚣声，倒也别有一番滋味。',
          effects: { mood: -5 },
        },
      },
    ],
  },
  {
    id: 'stray_dog',
    name: '流浪狗',
    goalCategory: 'special',
    weight: 4,
    cooldownDays: 15,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['street', 'residential', 'farmland'],
    },
    openingNarrative: '路边蹲着一只瘦骨嶙峋的小狗，眼神怯怯地看着过路人。它脖子上没有项圈，看起来是只流浪狗。',
    choices: [
      {
        id: 'feed_dog',
        text: '喂它点吃的',
        consequence: {
          narrative: '你掰了半块饼扔给它。小狗叼起来狼吞虎咽，然后摇着尾巴跟了你几步。',
          effects: { hunger: -5, mood: 5, copper: 0 },
          narrativeTag: '喂过流浪狗',
        },
      },
      {
        id: 'adopt_dog',
        text: '带它回家',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你蹲下来，小狗犹豫了一下，慢慢凑过来舔了舔你的手。你给它取了个名字，从此多了个伴。',
          effects: { mood: 15, hunger: -8 },
          narrativeTag: '养了条狗',
          transformations: [{ type: 'gain_tag', value: '有狗陪伴', description: '一只忠心的小狗跟随左右' }],
        },
      },
      {
        id: 'ignore_dog',
        text: '走开',
        consequence: {
          narrative: '你从它身边走过。小狗目送你离去，又缩回了角落。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'found_purse',
    name: '捡到钱袋',
    goalCategory: 'special',
    weight: 3,
    cooldownDays: 25,
    narrativeWeight: 'minor',
    conditions: {
      location: ['street', 'market'],
    },
    openingNarrative: '地上有一个鼓囊囊的钱袋，四周无人注意。你捡起来打开一看——里面至少有二百文铜钱。',
    choices: [
      {
        id: 'keep_purse',
        text: '据为己有',
        consequence: {
          narrative: '你四下张望，迅速把钱袋揣进怀里。心跳加速，但铜钱的分量让理智变得模糊。',
          effects: { copper: 80, mood: -10 },
          narrativeTag: '捡过钱袋',
        },
      },
      {
        id: 'return_purse',
        text: '寻找失主',
        consequence: {
          narrative: '你举起钱袋大喊："谁掉了钱袋？"一个商人模样的中年人急匆匆跑来，千恩万谢。他硬塞给你十文作为酬谢。',
          effects: { copper: 10, mood: 15 },
          narrativeTag: '拾金不昧',
          relationChange: 5,
        },
      },
      {
        id: 'leave_purse',
        text: '装没看见',
        consequence: {
          narrative: '你犹豫了一下，还是把钱袋放回原处，继续走自己的路。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'mountain_discovery',
    name: '山中奇遇',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 30,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain'],
      dayRange: [10, 999],
    },
    openingNarrative: '你在山林深处发现了一个隐蔽的山洞。洞口被藤蔓遮掩，隐约能看到里面有微弱的光。',
    choices: [
      {
        id: 'enter_cave',
        text: '进入山洞',
        consequence: {
          narrative: '你拨开藤蔓走了进去。山洞不大，但石壁上刻着一些你看不懂的古文。角落里有一只破旧的木箱，里面装着一些铜钱和一把生锈的匕首。',
          effects: { copper: 50, mood: 10 },
          narrativeTag: '发现山洞',
          transformations: [{ type: 'gain_tag', value: '探索者', description: '探索过山中隐秘洞穴' }],
        },
      },
      {
        id: 'mark_cave',
        text: '标记位置，改天再来',
        consequence: {
          narrative: '你记住了山洞的位置，在附近的树上刻了个记号。改日准备妥当了再来探索。',
          effects: { mood: 5 },
          narrativeTag: '知道山洞位置',
        },
      },
      {
        id: 'leave_cave',
        text: '不冒险，离开',
        consequence: {
          narrative: '山里蛇虫多，还是别冒这个险。你转身原路返回。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'winter_cold',
    name: '寒冬难熬',
    goalCategory: 'special',
    weight: 6,
    cooldownDays: 20,
    narrativeWeight: 'major',
    conditions: {
      season: ['冬'],
      actorMaxCopper: 30,
      weather: ['雪'],
    },
    openingNarrative: '大雪纷飞，北风刺骨。你的冬衣单薄，冻得直打哆嗦。路边一个炭火摊前，几个人正围着取暖。',
    choices: [
      {
        id: 'buy_coal',
        text: '买炭取暖',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative: '你花了十文钱买了一篓炭，回到住处生起了火。屋里暖和起来，终于不再发抖了。',
          effects: { copper: -10, health: 5, mood: 8 },
        },
      },
      {
        id: 'share_fire',
        text: '蹭炭火',
        consequence: {
          narrative: '你凑到炭火摊旁边取暖。摊主瞪了你一眼，但也没赶你。你和几个陌生人挤在一起，勉强过了这一关。',
          effects: { health: -3, mood: -5 },
          relationChange: 2,
        },
      },
      {
        id: 'endure_cold',
        text: '硬扛着',
        consequence: {
          narrative: '你缩着脖子快步走回住处。没有炭火，只能裹紧被子。这一夜格外漫长。',
          effects: { health: -10, mood: -10 },
        },
      },
    ],
  },
  {
    id: 'temple_fair',
    name: '庙会',
    goalCategory: 'special',
    weight: 12,
    cooldownDays: 35,
    narrativeWeight: 'milestone',
    conditions: {
      season: ['春', '秋'],
      dayRange: [1, 5],
    },
    openingNarrative: '相国寺门前人山人海，庙会的热闹气氛从城门口一直蔓延到寺内。杂耍的、卖糖人的、算命的、演皮影戏的……各种摊位一字排开。香火缭绕中，钟声悠扬，善男信女们摩肩接踵。',
    choices: [
      {
        id: 'join_temple_fair',
        text: '逛逛庙会',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative: '你随着人流在庙会里转了一圈。看了场精彩的舞狮表演，吃了串糖葫芦，还求了个签——上上签！说是"逢凶化吉，贵人相助"。花了几文钱，但心情格外好。',
          effects: { copper: -10, mood: 18, hunger: 8 },
          narrativeTag: '逛过相国寺庙会',
        },
      },
      {
        id: 'sell_at_fair',
        text: '摆个小摊赚一笔',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative: '你进了一些小玩意儿在庙会上叫卖。人流量大，生意出奇地好，不到半天就卖光了。刨去本钱，净赚了四十多文。',
          effects: { copper: 30, fatigue: -12, mood: 10 },
          narrativeTag: '庙会做过生意',
        },
      },
      {
        id: 'pray_temple',
        text: '进去烧柱香祈福',
        consequence: {
          narrative: '你挤进大雄宝殿，在蒲团上跪下，默默许了个心愿。香烟袅袅中，你心里平静了许多。出来时一个老僧递给你一张符纸："施主，此乃平安符，收好吧。"',
          effects: { mood: 8, health: 2 },
          narrativeTag: '拜过相国寺',
          transformations: [{ type: 'gain_tag', value: '持有平安符', description: '相国寺老僧所赠平安符' }],
        },
      },
    ],
  },
  {
    id: 'imperial_edict',
    name: '圣旨下达',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [20, 999],
    },
    openingNarrative: '大街上突然安静下来——一队骑着高头大马的仪仗缓缓驶来，中间的差役高举明黄色的卷轴高声宣读："奉天承运，皇帝诏曰……"路人纷纷跪伏在地，屏息凝神。原来是朝廷下了新的政令！',
    choices: [
      {
        id: 'listen_carefully',
        text: '仔细听内容',
        condition: { field: 'mood', operator: 'gte', value: 25 },
        consequence: {
          narrative: '你竖起耳朵仔细听完了整道圣旨。原来是要在汴京增设惠民药局，还要减免今年三成的秋税。这个消息让你和周围的人都松了口气——朝廷总算做了件好事。',
          effects: { mood: 10 },
          narrativeTag: '听过圣旨',
          transformations: [{ type: 'gain_tag', value: '见证过朝廷政令', description: '亲耳听闻朝廷颁布新政' }],
        },
      },
      {
        id: 'discuss_with_others',
        text: '跟旁边的人议论',
        consequence: {
          narrative: '等仪仗走远后，你和周围的人七嘴八舌地议论起来。有人说这是好事，有人担心"减免的税迟早要从别处补回来"。众说纷纭，你也拿不准该信谁的。',
          effects: { mood: 3 },
          narrativeTag: '议论过朝政',
        },
      },
      {
        id: 'ignore_edict',
        text: '跟我没什么关系',
        consequence: {
          narrative: '你混在人群中低着头，等队伍过去后拍拍膝盖上的土继续赶路。朝廷的事离你太远了，还是想想今天的晚饭从哪儿来吧。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'traveling_troupe',
    name: '路过戏班',
    goalCategory: 'special',
    weight: 5,
    cooldownDays: 20,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['street', 'market'],
    },
    openingNarrative: '街角临时搭起了一座戏台，一个路过的南方戏班正在演出。台上旦角水袖翻飞，唱腔婉转动听；丑角插科打诨引得观众阵阵哄笑。台下围满了人，连路边卖茶水的都忘了吆喝。',
    choices: [
      {
        id: 'watch_opera',
        text: '驻足看一出',
        condition: { field: 'copper', operator: 'gte', value: 3 },
        consequence: {
          narrative: '你挤进人群看了一整出《西厢记》。虽然之前听过故事梗概，但亲眼看到张生跳墙那一场时还是忍不住叫了声好。散场时往戏班的帽子里扔了几文铜钱。',
          effects: { copper: -3, mood: 14, fatigue: -5 },
          narrativeTag: '看过路过的戏班',
        },
      },
      {
        id: 'chat_with_actor',
        text: '散场后找艺人聊聊',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '散场后你追上那个扮旦角的年轻人，问他们下一站去哪里。"去开封府辖下的几个县，再往北走到大名府。"他递给你一块自己做的面具小挂件："留个纪念吧，有缘再见。"',
          effects: { mood: 10 },
          narrativeTag: '结交过戏班艺人',
          transformations: [{ type: 'gain_tag', value: '戏班面具挂件', description: '南方戏班艺人所赠的小礼物' }],
        },
      },
      {
        id: 'pass_by',
        text: '没空看戏',
        consequence: {
          narrative: '你从戏台旁边走过，断断续续听到几句唱词。虽然没停下来看，但那婉转的调子在你脑子里转了好久才散去。',
          effects: { mood: 2 },
        },
      },
    ],
  },
  {
    id: 'rare_herb_discovery',
    name: '发现珍稀药材',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 35,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain'],
      season: ['春', '夏'],
    },
    openingNarrative: '你在山林深处拨开一片灌木丛，眼前忽然一亮——一株通体紫红色的人参静静地生长在岩石缝隙中，根须粗壮，叶片肥厚。这品相……怕是生长了几十年的野山参！',
    choices: [
      {
        id: 'dig_herb',
        text: '小心挖出来',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你用随身带的木棍小心翼翼地挖掘，生怕伤了根须。足足花了半个时辰才完整地将这株人参起出来。用布包好揣进怀里，沉甸甸的分量让你心跳加速——这东西拿到药铺能换不少钱！',
          effects: { copper: 60, fatigue: -15, mood: 20 },
          narrativeTag: '采到过野山参',
          transformations: [{ type: 'gain_tag', value: '采药经验', description: '曾在山中采得珍稀药材' }],
        },
      },
      {
        id: 'mark_location',
        text: '标记位置以后再来',
        consequence: {
          narrative: '你在旁边的树上刻了个记号，打算等带了合适的工具再来挖。但等你几天后再来时，那株人参已经不见了——大概是被别人发现了。你懊恼不已。',
          effects: { mood: -10 },
          narrativeTag: '错过珍稀药材',
        },
      },
      {
        id: 'leave_herb',
        text: '不动它，让它继续长',
        consequence: {
          narrative: '你蹲下来看了看这株人参，最终决定不去打扰它。"万物有灵，让它好好长着吧。"你起身离开，心里却莫名觉得轻松。',
          effects: { mood: 5 },
          narrativeTag: '放过珍稀药材',
        },
      },
    ],
  },
  {
    id: 'abandoned_temple',
    name: '废弃古庙',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 40,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['mountain'],
      dayRange: [15, 999],
    },
    openingNarrative: '山腰处一座破败的古庙半掩在荒草之中。朱红的大门已经褪成了暗褐色，门上的漆皮剥落大半。透过门缝可以看到里面供桌倾倒，神像蒙尘，蛛网密布。但隐约间，你似乎听到了什么声音……',
    choices: [
      {
        id: 'enter_temple',
        text: '推门进去看看',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你推开吱呀作响的大门走了进去。声音来自后殿——一个落魄的老僧正在那里打坐。他睁开眼看了看你："施主，这座庙荒废三十年了，只有老衲一人守着。若不嫌弃，喝杯茶再走吧。"茶是野菜泡的，但老僧讲的故事让你受益匪浅。',
          effects: { mood: 12, fatigue: 5 },
          narrativeTag: '探访过废弃古庙',
          relationChange: 8,
          transformations: [{ type: 'gain_tag', value: '见过隐世高僧', description: '在废弃古庙中遇到一位神秘的守庙老僧' }],
        },
      },
      {
        id: 'peek_from_outside',
        text: '在外面偷看就好',
        consequence: {
          narrative: '你趴在门缝往里瞧了半天，除了灰尘和蜘蛛什么也没看到。那声音大概是风吹过破窗的声响。你打了个寒颤，快步离开了这个地方。',
          effects: { mood: -3 },
        },
      },
      {
        id: 'offer_incense',
        text: '在门外拜一拜',
        condition: { field: 'copper', operator: 'gte', value: 2 },
        consequence: {
          narrative: '你在庙门前找了三块石头垒成一个小香炉的形状，默念了几句祈祷的话。虽然庙已废弃，但你相信神佛无处不在。做完这些，心里踏实了不少。',
          effects: { copper: -2, mood: 6 },
          narrativeTag: '在古庙前祈福',
        },
      },
    ],
  },
  {
    id: 'shooting_star',
    name: '流星划过',
    goalCategory: 'special',
    weight: 4,
    cooldownDays: 22,
    narrativeWeight: 'flavor',
    conditions: {
      weather: ['晴'],
    },
    openingNarrative: '夜空中忽然划过一道耀眼的光芒，拖着长长的尾巴从天际坠向大地。周围有人惊呼："流星！快许愿！"那道光亮持续了好几息才消失在远方的山峦之后。',
    choices: [
      {
        id: 'make_wish',
        text: '赶紧许个愿',
        consequence: {
          narrative: '你闭上眼睛，在心里默念了一个愿望。虽然不知道流星是否真的能听见，但这一刻的虔诚让你觉得——也许，事情真的会变好的。',
          effects: { mood: 10 },
          narrativeTag: '对流星许过愿',
        },
      },
      {
        id: 'find_impact',
        text: '去找坠落地点',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative: '你朝着流星消失的方向走了半夜，翻过两座山头后终于在一处山谷里找到了——一块拳头大小的陨石，还冒着微弱的热气。你把它捡起来揣进怀里，这可是稀罕物！',
          effects: { fatigue: -20, health: -5, mood: 15, copper: 0 },
          narrativeTag: '捡到过陨石',
          transformations: [{ type: 'gain_tag', value: '天外陨石', description: '一颗从天而降的陨石碎片' }],
        },
      },
      {
        id: 'share_moment',
        text: '和身边的人一起看',
        consequence: {
          narrative: '你没有急着许愿或行动，而是静静地看着那道光消失在夜空中。旁边一个陌生人喃喃道："真美啊……"你们相视一笑，一同目送星空恢复宁静。',
          effects: { mood: 7 },
          narrativeTag: '与陌生人共赏流星',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'time_capsule',
    name: '前人遗物',
    goalCategory: 'special',
    weight: 3,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['farmland', 'residential'],
      dayRange: [30, 999],
    },
    openingNarrative: '你在翻修住处的地基时，锄头碰到了什么硬邦邦的东西。扒开泥土一看——是个锈迹斑斑的铁盒子，盖子上刻着"崇宁元年封"几个字。这东西在这里埋了至少几十年了！',
    choices: [
      {
        id: 'open_capsule',
        text: '打开看看',
        consequence: {
          narrative: '你费了好大劲才撬开铁盒。里面是一封信和几枚铜钱。信纸上写着："吾辈商贾，遭金兵之乱，仓皇南逃。留此盒于故土，望后人见之，知汴京曾有我等在此生活。"读罢你久久无言。',
          effects: { copper: 15, mood: 8 },
          narrativeTag: '发现前人遗物',
          transformations: [{ type: 'gain_tag', value: '前人书信', description: '一封来自数十年前的汴京遗民手书' }],
        },
      },
      {
        id: 'rebury_capsule',
        text: '原样埋回去',
        consequence: {
          narrative: '你想了想，把铁盒重新埋好，恢复了原状。"让它继续睡在这里吧，这是属于它的地方。"你拍了拍手上的土，继续干活。',
          effects: { mood: 5 },
          narrativeTag: '尊重前人遗物',
        },
      },
      {
        id: 'ask_elderly',
        text: '问问村里的老人',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你带着铁盒找到村里最年长的老人。老人戴上老花镜看了半天，浑浊的眼睛忽然亮了："崇宁元年……这是我祖父那一辈的事了！据说当年确实有一户姓陈的人家住在这一带，后来战乱就不知去向了……"',
          effects: { mood: 5 },
          narrativeTag: '探究过前人往事',
          relationChange: 5,
        },
      },
    ],
  },
];
