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
  {
    id: 'mysterious_stranger',
    name: '神秘来客',
    goalCategory: 'special',
    weight: 4,
    cooldownDays: 25,
    narrativeWeight: 'major',
    conditions: {
      location: ['teahouse', 'street'],
      dayRange: [12, 999],
    },
    openingNarrative: '一个身穿黑衣、面容被斗笠遮住大半的人在茶馆角落里坐了很久。当你经过时，那人忽然低声说："京城里的秘密，你知道得太多了……小心点。"',
    choices: [
      {
        id: 'question_stranger',
        text: '追问对方是谁',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你正要追问，那人已经起身匆匆离去。桌上留下了一枚铜钱，上面刻着奇怪的符号。你把它收了起来，总觉得这事没那么简单。',
          effects: { mood: 5 },
          narrativeTag: '卷入神秘事件',
          transformations: [{ type: 'gain_tag', value: '被神秘人警告', description: '引起某些人注意' }],
        },
      },
      {
        id: 'ignore_warning',
        text: '装作没听见',
        consequence: {
          narrative: '你装作没听见，继续走自己的路。但心里总有些不安——那人的声音里透着警告，还是威胁？',
          effects: { mood: -2 },
        },
      },
      {
        id: 'report_authorities',
        text: '报告巡街捕快',
        consequence: {
          narrative: '你找到巡街的捕快，说了刚才的事。捕快皱着眉头记录下来，说会留意。但后来你总感觉有人在暗中盯着你……',
          effects: { mood: 0 },
          narrativeTag: '报过官',
        },
      },
    ],
  },
  {
    id: 'ancient_scroll',
    name: '古卷残篇',
    goalCategory: 'special',
    weight: 3,
    cooldownDays: 30,
    narrativeWeight: 'major',
    conditions: {
      location: ['ruins', 'mountain'],
      dayRange: [20, 999],
      actorMinHealth: 30,
    },
    openingNarrative: '你在一处荒废的寺庙里翻找，发现了一个布满灰尘的木盒。打开一看——里面是一卷残破的竹简，上面密密麻麻写满了古文。隐约能辨认出"阵法"、"秘术"等字样。',
    choices: [
      {
        id: 'study_scroll',
        text: '仔细研究',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你花了几个晚上研究这卷竹简，虽然只能看懂一小部分，但觉得记载的东西很不寻常。也许真有什么古代秘术？',
          effects: { mood: 8, fatigue: -10 },
          narrativeTag: '研究过古卷',
          transformations: [{ type: 'gain_tag', value: '懂些秘术', description: '研究过古代秘籍残篇' }],
        },
      },
      {
        id: 'sell_scroll',
        text: '卖给收藏家',
        condition: { field: 'copper', operator: 'gte', value: 0 },
        consequence: {
          narrative: '你把竹简卖给了一个收藏古董的员外，得了五十文钱。员外高兴得合不拢嘴，你却觉得这东西可能价值远超这个数。',
          effects: { copper: 50, mood: 5 },
          narrativeTag: '卖过古董',
        },
      },
      {
        id: 'destroy_scroll',
        text: '可能是邪术，毁掉它',
        consequence: {
          narrative: '你觉得这东西来路不正，当场烧掉了竹简。火光中，你隐约看到竹简上的文字仿佛在流动……也许你做错了，也许你做对了。',
          effects: { mood: -3 },
          narrativeTag: '毁过古卷',
        },
      },
    ],
  },
  {
    id: 'ghost_sighting',
    name: '夜半鬼影',
    goalCategory: 'special',
    weight: 4,
    cooldownDays: 22,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['residential', 'ruins'],
      dayRange: [15, 999],
      weather: ['阴', '雨'],
    },
    openingNarrative: '深夜，你起夜时看到窗外有个白影飘过！那影子若隐若现，像是个人形，又像是别的什么。你揉了揉眼睛，再看时已经不见了。',
    choices: [
      {
        id: 'investigate_ghost',
        text: '出去看看',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你壮着胆子出去查看，发现是一只白色的大野猫窜进了草丛。原来是虚惊一场，你松了口气，笑着回屋继续睡觉。',
          effects: { fatigue: -5, mood: 5 },
          narrativeTag: '查过鬼影',
        },
      },
      {
        id: 'stay_inside',
        text: '锁好门窗待着',
        consequence: {
          narrative: '你赶紧关好窗户，用柜子顶住门。一晚上都没睡好，第二天顶着黑眼圈起床。村里人笑你胆小，你也不辩解。',
          effects: { fatigue: -15, mood: -5 },
          narrativeTag: '怕过鬼',
        },
      },
      {
        id: 'invite_in',
        text: '对着窗外说"进来坐坐"',
        consequence: {
          narrative: '你对着窗外的黑影喊道"进来喝杯茶"。什么都没发生。但第二天，你发现门口放着一把野花——是谁放的？',
          effects: { mood: 3 },
          narrativeTag: '与鬼神开玩笑',
        },
      },
    ],
  },
  {
    id: 'prophetic_dream',
    name: '奇异梦境',
    goalCategory: 'special',
    weight: 5,
    cooldownDays: 28,
    narrativeWeight: 'minor',
    conditions: {
      dayRange: [18, 999],
      actorMinFatigue: 40,
    },
    openingNarrative: '昨晚你做了一个极其清晰的梦——梦见自己走进一个从未去过的地方，看到一些人脸，听见了几句对话。那种真实感让你醒来后久久不能平静。',
    choices: [
      {
        id: 'interpret_dream',
        text: '找圆梦先生解梦',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative: '你花了八文钱找街边的圆梦先生。他听完你的描述，沉思许久说："此梦大吉，数日内必有贵人相助。"你半信半疑，但心里多少有了点期待。',
          effects: { copper: -8, mood: 8 },
          narrativeTag: '解过梦',
        },
      },
      {
        id: 'dismiss_dream',
        text: '只是梦罢了',
        consequence: {
          narrative: '你摇摇头，把这事儿抛在脑后。可三天后，你真的在街上看到了梦里那个地方！你不由得倒吸一口凉气……',
          effects: { mood: 3 },
          narrativeTag: '梦成真',
        },
      },
      {
        id: 'write_dream',
        text: '把梦记下来',
        consequence: {
          narrative: '你把梦里的细节都记录下来。后来发生的事证明，你的梦确实预示了什么。这个本子成了你的秘密，谁都没告诉。',
          effects: { mood: 5 },
          narrativeTag: '记录过梦境',
        },
      },
    ],
  },
  {
    id: 'reincarnation_clue',
    name: '前世记忆',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 40,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [30, 999],
      location: ['temple', 'ruins'],
    },
    openingNarrative: '你在一座古寺的大殿里，看到一幅画像时忽然头脑一阵眩晕——无数陌生又熟悉的画面涌入脑海！你仿佛是另一个人，在另一个时代，经历着完全不同的人生……',
    choices: [
      {
        id: 'embrace_memory',
        text: '接纳这些记忆',
        consequence: {
          narrative: '你任由那些画面在脑海中流淌。片刻后，你睁开眼睛，整个世界仿佛都不一样了。你多了一些从未学过的技能和知识，却又说不清从何而来。',
          effects: { mood: 12 },
          narrativeTag: '觉醒前世记忆',
          transformations: [{ type: 'gain_tag', value: '有前世记忆', description: '仿佛活过另一世' }],
        },
      },
      {
        id: 'seek_guidance',
        text: '找高僧解惑',
        consequence: {
          narrative: '你找到住持方丈说了刚才的体验。老僧捻须微笑："施主与佛有缘。前世今生，皆是缘分。"他给了你一串佛珠，说能帮你镇定心神。',
          effects: { mood: 10 },
          narrativeTag: '被高僧点化',
          relationChange: 8,
        },
      },
      {
        id: 'ignore_experience',
        text: '可能是中暑了',
        consequence: {
          narrative: '你摇摇头，觉得可能是太累了。出了寺门，那种奇怪的感觉渐渐消失了。但偶尔，一些画面还是会不经意地浮现。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'parallel_world',
    name: '时空错位',
    goalCategory: 'special',
    weight: 1,
    cooldownDays: 50,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [40, 999],
      location: ['ruins', 'mountain'],
    },
    openingNarrative: '你走进一片浓雾中，周围的声音渐渐消失。等雾气散去时，你发现自己站在一个完全陌生的地方——建筑风格不同，人们的穿着也不同，说的话也听不太懂……',
    choices: [
      {
        id: 'explore_parallel',
        text: '探索这个新世界',
        consequence: {
          narrative: '你小心翼翼地在这个陌生的世界里走了半天。看到的、听到的都让你困惑不已。突然，一阵大雾再次袭来，等它散去时，你又回到了原来的地方。这一切是真的吗？',
          effects: { mood: 15, fatigue: -10 },
          narrativeTag: '到过平行世界',
          transformations: [{ type: 'gain_tag', value: '时空旅人', description: '经历过时空错位' }],
        },
      },
      {
        id: 'seek_way_back',
        text: '想办法回去',
        consequence: {
          narrative: '你慌了，到处寻找回去的路。终于在一处山泉边，你再次走进雾中，拼命奔跑。当你停下来喘气时，发现自己回到了熟悉的山林。你瘫坐在地上，庆幸不已。',
          effects: { mood: 5, health: -5, fatigue: -15 },
          narrativeTag: '穿越归来',
        },
      },
      {
        id: 'accept_fate',
        text: '既来之则安之',
        consequence: {
          narrative: '你平静地接受了这个现实，开始在新世界寻找生存之道。然而第二天醒来，你发现自己躺在原来的地方。难道一切只是梦？但你口袋里确实多了一枚奇怪的铜钱……',
          effects: { mood: 8 },
          narrativeTag: '迷失过时空',
        },
      },
    ],
  },
  {
    id: 'special_mysterious_mirror',
    name: '古镜奇遇',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [35, 999],
      location: ['residential', 'market'],
      actorMaxMood: 70,
    },
    openingNarrative:
      '你在古玩摊上看到一面铜镜，镜面模糊，看起来很普通。但当你凑近看时，镜中映出的不是你的脸，而是一个陌生的地方！你眨眨眼，镜中又恢复了正常。',
    choices: [
      {
        id: 'mirror_buy',
        text: '买下这面镜子',
        condition: { field: 'copper', operator: 'gte', value: 25 },
        consequence: {
          narrative:
            '你花了二十五文买下铜镜。深夜，你再次凝视镜面，镜中景象开始流动——你看到了一个古代的场景，似乎是在这面镜子的主人身上发生了什么。你恍然大悟：这面镜子记录了往事！',
          effects: { copper: -25, mood: 18 },
          narrativeTag: '古镜持有者',
          transformations: [{ type: 'gain_tag', value: '拥有奇物', description: '古铜镜' }],
        },
      },
      {
        id: 'mirror_touch',
        text: '伸手触摸镜面',
        consequence: {
          narrative:
            '你的手指触碰到镜面的瞬间，一阵电流般的麻感传遍全身！镜中景象模糊闪过，你看到了一些片段——战火、逃亡、一个孩子将镜子藏起……你意识到这面镜子承载着某段历史。',
          effects: { mood: 12, health: -3 },
          narrativeTag: '触碰过古镜',
        },
      },
      {
        id: 'mirror_leave',
        text: '太诡异了，离开',
        consequence: {
          narrative:
            '你摇摇头离开了摊位。但那面镜子的影像一直在你脑海中挥之不去。后来你听说那个古玩摊莫名其妙地消失了……',
          effects: { mood: 3 },
        },
      },
    ],
  },
  {
    id: 'special_animal_guide',
    name: '灵兽引路',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [25, 999],
      location: ['mountain', 'forest'],
      requiredNarrativeTags: ['探索者'],
    },
    openingNarrative:
      '山中迷路时，一只白狐出现在你面前。它看了你一眼，转身就走，走几步又回头看你，似乎在示意你跟上。直觉告诉你，跟着它就能找到出路。',
    choices: [
      {
        id: 'animal_follow',
        text: '跟着白狐走',
        consequence: {
          narrative:
            '你跟着白狐在山林中走了约莫一个时辰。它最终将你带到一条小径旁，然后消失在林中。你顺着小径走，果然找到了回城的道路。回想起来，那只白狐的眼神似乎充满灵性。',
          effects: { mood: 15, fatigue: 8 },
          narrativeTag: '被灵兽救助',
          transformations: [{ type: 'gain_tag', value: '与兽有缘', description: '灵兽引路' }],
        },
      },
      {
        id: 'animal_offer_food',
        text: '给白狐些食物',
        condition: { field: 'hunger', operator: 'gte', value: 10 },
        consequence: {
          narrative:
            '你拿出一些干粮放在地上。白狐吃下后，似乎在向你道谢，然后转身离开。奇怪的是，它离开的方向正是你该走的路。',
          effects: { hunger: -10, mood: 12 },
          narrativeTag: '善待灵兽',
        },
      },
      {
        id: 'animal_ignore',
        text: '不跟陌生人走',
        consequence: {
          narrative:
            '你警惕地没有跟随。白狐看了你几眼，最终离开了。你在山里多绕了半天才找到路，但你始终无法确定那只狐狸是善意的还是……',
          effects: { fatigue: 10, mood: -5 },
          narrativeTag: '拒绝了引路',
        },
      },
    ],
  },
  {
    id: 'special_time_slip',
    name: '时空裂缝',
    goalCategory: 'special',
    weight: 1,
    cooldownDays: 70,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [50, 999],
      location: ['ruins', 'mountain', 'temple'],
      actorMaxMood: 60,
    },
    openingNarrative:
      '你走过一处古老的遗迹时，周围的声音突然消失了——鸟鸣、风声、虫叫，统统消失。你发现自己处在一个静止的世界里，连落叶都停在半空中！',
    choices: [
      {
        id: 'time_embrace',
        text: '静静感受',
        consequence: {
          narrative:
            '你闭上眼睛，感受着这个时空裂缝的奇妙。恍惚间，你看到了几百年前这里的景象——繁华的街道、忙碌的人们、战火、废墟……你理解了历史的车轮滚滚向前。',
          effects: { mood: 20 },
          narrativeTag: '时空见证者',
          transformations: [{ type: 'gain_tag', value: '见闻广博', description: '见证历史' }],
        },
      },
      {
        id: 'time_panic',
        text: '惊慌失措',
        consequence: {
          narrative:
            '你拼命奔跑，想逃离这个诡异的地方。突然，一切声音恢复了——你发现自己躺在地上，浑身是汗。但你的手里多了一枚前朝的铜钱。',
          effects: { mood: 5, health: -5, fatigue: 10 },
          narrativeTag: '时空惊魂',
        },
      },
      {
        id: 'time_wait',
        text: '等待恢复正常',
        consequence: {
          narrative:
            '你坐在原地，静静等待。大约过了一盏茶的功夫，时空裂缝渐渐消散。周围的声音重新响起，仿佛什么都没发生过。但你知道，刚才经历的一切都是真实的。',
          effects: { mood: 10 },
          narrativeTag: '穿越时空裂缝',
        },
      },
    ],
  },
  {
    id: 'special_dream_prophecy',
    name: '梦境预言',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 45,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [20, 999],
      location: ['residential'],
      actorMaxHealth: 70,
    },
    openingNarrative:
      '夜里你做了一个奇怪的梦——梦中大火烧毁了半个汴京城，人们在哭喊、逃亡。你看到自己站在城墙上，看着这一切发生。惊醒时，你发现冷汗浸透了衣衫。',
    choices: [
      {
        id: 'dream_warn',
        text: '向官府报告',
        consequence: {
          narrative:
            '你来到衙门，将梦境告诉了捕头。捕头起初不信，但你的诚恳打动了他，他派人加强了巡逻。一个月后，一场火灾真的发生了，但因为提前准备，伤亡大大减少。捕头专程来感谢你。',
          effects: { mood: 15 },
          narrativeTag: '预言成真',
          relationChange: 10,
        },
      },
      {
        id: 'dream_prepare',
        text: '自己做好准备',
        consequence: {
          narrative:
            '你虽然不知道预言会不会成真，但还是买了些灭火用品和干粮。半个月后，小范围起火时，你及时帮助邻居扑灭了火苗。你开始相信那个梦了。',
          effects: { copper: -8, mood: 8 },
          narrativeTag: '相信预知梦',
        },
      },
      {
        id: 'dream_ignore',
        text: '只是个梦而已',
        consequence: {
          narrative:
            '你告诉自己不要多想，继续照常生活。但心里总觉得不安。后来真的发生火灾时，你庆幸自己至少提前买了灭火工具。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'special_ghost_encounter',
    name: '魂灵相见',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 50,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [30, 999],
      location: ['residential', 'temple', 'ruins'],
      weather: ['阴', '雨'],
    },
    openingNarrative:
      '月黑风高的夜晚，你看到一个半透明的身影站在不远处。仔细辨认，那是个老人，穿着古旧的服饰。他看着你，似乎想说什么。',
    choices: [
      {
        id: 'ghost_listen',
        text: '听他说什么',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你鼓起勇气走近。老人的声音飘渺而空洞："年轻人，帮帮我……我在这里等了一百年……"他请求你帮他找到一件遗物，好让他安息。你答应尽力而为。老人渐渐消失了。',
          effects: { mood: 10 },
          narrativeTag: '与鬼魂对话',
          transformations: [{ type: 'gain_tag', value: '见过鬼魂', description: '魂灵托付' }],
        },
      },
      {
        id: 'ghost_flee',
        text: '吓得跑掉',
        consequence: {
          narrative:
            '你转身就跑，一口气跑回住处，把门关得死死的。那天晚上你再也睡不着了。后来你听说那个地方确实有些灵异传闻……',
          effects: { mood: -8, health: -2 },
          narrativeTag: '被鬼魂吓到',
        },
      },
      {
        id: 'ghost_pray',
        text: '为亡魂祈祷',
        consequence: {
          narrative:
            '你双手合十，为那个亡魂祈祷。老人看着你，露出感激的神色，然后渐渐消失。你虽然不知道他是谁，但希望他安息。',
          effects: { mood: 8 },
          narrativeTag: '超度亡魂',
        },
      },
    ],
  },
  {
    id: 'special_meteor',
    name: '流星异象',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 65,
    narrativeWeight: 'minor',
    conditions: {
      dayRange: [15, 999],
      weather: ['晴'],
      location: ['street', 'residential', 'mountain'],
    },
    openingNarrative:
      '深夜，一道耀眼的流星划过天际，但它没有消失，而是坠落在城外的山里！第二天，人们纷纷议论着这个异象。有人说是不祥之兆，有人说祥瑞降临。',
    choices: [
      {
        id: 'meteor_investigate',
        text: '去坠落地点看看',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你来到坠落地点，发现一个被烧焦的坑洞，里面有一块奇异的石头，散发着微弱的蓝光。你小心翼翼地捡起来，石头立刻恢复了普通。但这块石头确实有些不寻常。',
          effects: { copper: 8, mood: 12, health: -3, fatigue: 10 },
          narrativeTag: '流星碎片',
          transformations: [{ type: 'gain_tag', value: '拥有奇物', description: '流星石' }],
        },
      },
      {
        id: 'meteor_interpret',
        text: '请教先生如何解读',
        consequence: {
          narrative:
            '你找到一位通晓天文的先生。他说这是"天星降世"，主大吉。他建议你做些善事来应验这个吉兆。你虽然半信半疑，但还是捐了几文钱给施粥棚。',
          effects: { copper: -5, mood: 6 },
          narrativeTag: '应验吉兆',
        },
      },
      {
        id: 'meteor_ignore',
        text: '不参与此事',
        consequence: {
          narrative:
            '你觉得这只是个自然现象，没有太在意。日子照常过，流星坠落的传闻慢慢也平息了。',
          effects: { mood: 0 },
        },
      },
    ],
  },
  {
    id: 'special_book_world',
    name: '书中世界',
    goalCategory: 'special',
    weight: 1,
    cooldownDays: 80,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [45, 999],
      location: ['residential', 'academy'],
      requiredNarrativeTags: ['读过书', '书生'],
    },
    openingNarrative:
      '你在读一本古书时，文字突然开始移动，组成了一幅幅画面。你感觉被吸进了书中的世界——周围是古代的场景，人物们走来走去，仿佛真实存在。',
    choices: [
      {
        id: 'book_explore',
        text: '探索书中世界',
        consequence: {
          narrative:
            '你在书中世界游历了许久，看到了历史事件的真面目，结识了书中的人物。最后，一束光将你送回现实。你手中的古书已经破旧不堪，但你明白了书中记载的深意。',
          effects: { mood: 20 },
          narrativeTag: '书中游历',
          transformations: [{ type: 'gain_tag', value: '见闻广博', description: '书中世界' }],
        },
      },
      {
        id: 'book_learn',
        text: '向书中人物学习',
        consequence: {
          narrative:
            '你向书中的圣贤请教问题，他们耐心地为你解答。虽然时间不长，但你学到了许多平时无法学到的知识。回到现实后，你发现自己对书中内容的理解加深了。',
          effects: { mood: 15 },
          narrativeTag: '得圣贤教诲',
        },
      },
      {
        id: 'book_return_quickly',
        text: '尽快回来',
        consequence: {
          narrative:
            '你害怕被困住，拼命寻找回来的路。终于在书页翻动的瞬间，你回到了现实。但那段经历让你对这本书有了全新的认识。',
          effects: { mood: 8 },
          narrativeTag: '书中逃生',
        },
      },
    ],
  },
  {
    id: 'special_mysterious_stranger',
    name: '神秘来客',
    goalCategory: 'special',
    weight: 2,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [35, 999],
      location: ['residential', 'teahouse'],
      requiredNarrativeTags: ['身手不凡', '探索者'],
    },
    openingNarrative:
      '一个斗笠压得很低的人找到你，低声说："我观察你很久了，你不是普通人。"他摘下斗笠，露出一张布满伤疤的脸，"我代表一个组织，想邀请你加入。"',
    choices: [
      {
        id: 'stranger_join',
        text: '加入组织',
        condition: { field: 'mood', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你点头同意。那人给了你一块令牌："凭此可联络各地组织成员。我们行侠仗义，维护正义。但记住，组织的事不可外传。"从此你多了一个身份。',
          effects: { mood: 12 },
          narrativeTag: '秘密组织成员',
          transformations: [{ type: 'gain_tag', value: '有秘密身份', description: '加入神秘组织' }],
        },
      },
      {
        id: 'stranger_decline',
        text: '婉言拒绝',
        consequence: {
          narrative:
            '你摇摇头说不想卷入复杂的事。那人也不勉强，留下了一句："若改变主意，去城东老树下拍三下掌。"说完就消失在人群中。',
          effects: { mood: 3 },
          narrativeTag: '拒绝过神秘组织',
        },
      },
      {
        id: 'stranger_investigate',
        text: '先打听组织底细',
        consequence: {
          narrative:
            '你没有立刻答应，而是托人打听了这个组织。原来他们确实是行侠仗义的义士组织，但也做过一些争议之事。你决定再考虑考虑。',
          effects: { copper: -3, mood: 5 },
          narrativeTag: '了解过神秘组织',
        },
      },
    ],
  },
];
