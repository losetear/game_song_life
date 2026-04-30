import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const DISASTER_EVENTS: BranchEvent[] = [
  {
    id: 'disaster_fire',
    name: '城中失火',
    goalCategory: 'disaster',
    weight: 5,
    cooldownDays: 50,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential', 'workshop', 'market'],
      weather: ['晴', '阴'],
      dayRange: [10, 999],
    },
    openingNarrative:
      '"走水了！走水了！"深夜里一阵急促的锣声将你从梦中惊醒。推开窗户一看——东边一片火光冲天！浓烟滚滚，人们的哭喊声和救火的吆喝声混成一片。',
    choices: [
      {
        id: 'fire_help',
        text: '加入救火队伍',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你提着水桶加入了救火的队伍。大火烧了三个时辰才被扑灭，你累得几乎站不住，但看到被救出的老人和孩子，一切都值了。官府给每个参与救火的人发了五文钱作为酬谢。',
          effects: { health: -10, fatigue: 20, copper: 5, mood: 8 },
          narrativeTag: '救火义士',
          relationChange: 6,
        },
      },
      {
        id: 'fire_evacuate',
        text: '先保住自己的财物撤离',
        consequence: {
          narrative:
            '你赶紧收拾了细软和干粮，跟着人群撤到了安全地带。大火烧毁了半条街，万幸你的住所在另一头。看着那些痛哭流涕的灾民，你默默捐出了三文钱。',
          effects: { copper: -3, fatigue: 8, mood: -3 },
          narrativeTag: '火灾逃生者',
        },
      },
      {
        id: 'fire_loot',
        text: '趁乱……',
        condition: { field: 'mood', operator: 'lte', value: 30 },
        consequence: {
          narrative:
            '你在混乱中趁没人注意拿了一些散落的财物。事后你既庆幸又愧疚——那些东西对失去一切的人来说可能意味着活下去的希望。',
          effects: { copper: 12, mood: -12 },
          narrativeTag: '趁火打劫',
          relationChange: -8,
        },
      },
    ],
  },
  {
    id: 'disaster_flood',
    name: '洪水泛滥',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      season: ['夏'],
      location: ['dock', 'farmland', 'riverbank'],
      weather: ['雨'],
      dayRange: [40, 80],
    },
    openingNarrative:
      '连下了半个月的暴雨，汴河水猛涨。堤坝发出危险的嘎吱声，浑浊的河水已经漫上了岸边的低洼地带。有人在喊："要决堤了！快跑啊！"',
    choices: [
      {
        id: 'flood_sandbag',
        text: '帮忙加固堤坝',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你和众人一起扛沙袋、打木桩，在堤坝最危险的一段加固了三层。洪峰来临时虽然还是漫出了一些水，但堤坝保住了！下游的村庄免遭灭顶之灾。',
          effects: { health: -12, fatigue: 20, copper: 8, mood: 12 },
          narrativeTag: '抗洪英雄',
          relationChange: 8,
          transformations: [
            { type: 'gain_tag', value: '乐善好施', description: '抗洪护民' },
          ],
        },
      },
      {
        id: 'flood_evacuate',
        text: '帮助老弱撤离',
        consequence: {
          narrative:
            '你没有去堤坝，而是帮着几位行动不便的老人和孩子转移到了高处。一个老太太握着你的手说："好人有好报啊。"',
          effects: { fatigue: 12, health: -3, mood: 8 },
          narrativeTag: '抗洪救人',
          relationChange: 5,
        },
      },
      {
        id: 'flood_run',
        text: '先顾自己逃命',
        consequence: {
          narrative:
            '你第一时间跑到了高地上。回头望去，洪水如猛兽般吞噬了低洼处的房屋。你安全了，但心里并不好受。',
          effects: { fatigue: 8, mood: -8 },
          narrativeTag: '洪水中逃生',
        },
      },
    ],
  },
  {
    id: 'disaster_plague',
    name: '瘟疫蔓延',
    goalCategory: 'disaster',
    weight: 3,
    cooldownDays: 70,
    narrativeWeight: 'milestone',
    conditions: {
      season: ['春', '夏'],
      dayRange: [15, 999],
      actorMaxHealth: 70,
    },
    openingNarrative:
      '城中开始流行一种怪病——发热、咳嗽、浑身无力。药铺门口排起了长队，郎中们忙得脚不沾地。街上行人稀少，人人自危。',
    choices: [
      {
        id: 'plague_help',
        text: '帮忙照顾病人',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你主动到药铺帮忙熬药分发。虽然自己也染上了轻症（在家躺了几天），但你帮助了许多人挺过了这场瘟疫。郎中李大夫后来送了你一本医书作为谢礼。',
          effects: { health: -18, fatigue: 10, copper: 5, mood: 5 },
          narrativeTag: '抗疫义士',
          relationChange: 8,
          transformations: [
            { type: 'gain_tag', value: '学过郎中', description: '抗疫期间学到的医术' },
          ],
        },
      },
      {
        id: 'plague_isolate',
        text: '闭门不出自我隔离',
        consequence: {
          narrative:
            '你足不出户，靠之前囤积的粮食度日。半个月后瘟疫消退时你安然无恙，只是瘦了一圈，也憋坏了。',
          effects: { hunger: -25, fatigue: -5, mood: -10, health: 2 },
          narrativeTag: '疫中幸存',
        },
      },
      {
        id: 'plague_sell_medicine',
        text: '倒卖药材赚钱',
        condition: { field: 'copper', operator: 'gte', value: 10 },
        consequence: {
          narrative:
            '你从乡下收购了一批草药，以三倍的价格在城中卖出。赚了不少钱，但良心上有些过不去——有些人因为买不起药而延误了病情。',
          effects: { copper: 25, mood: -10 },
          narrativeTag: '发国难财',
          relationChange: -10,
        },
      },
    ],
  },
  {
    id: 'disaster_locusts',
    name: '蝗虫过境',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 50,
    narrativeWeight: 'major',
    conditions: {
      season: ['夏', '秋'],
      location: ['farmland'],
      dayRange: [45, 90],
      actorMinHunger: 30,
    },
    openingNarrative:
      '天边忽然涌起一片乌云——不，那不是云！是蝗虫！铺天盖地的蝗群如同黑风般席卷而来，所过之处庄稼片叶不留。农夫们的哭声响彻田野。',
    choices: [
      {
        id: 'locusts_fight',
        text: '加入捕蝗队伍',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你挥动着树枝和布幔加入驱蝗大军。虽然无法完全阻止蝗灾，但你们保住了几块关键的田地。官府按工时发了救济粮。',
          effects: { hunger: 15, fatigue: 18, health: -5, copper: 5, mood: 5 },
          narrativeTag: '抗蝗勇士',
          relationChange: 4,
        },
      },
      {
        id: 'locusts_dig',
        text: '挖蝗虫卵（可以吃）',
        consequence: {
          narrative:
            '你跟着老农学习挖蝗虫卵的方法。虽然听起来恶心，但烤熟的蝗虫确实能充饥。这段时间你靠着"蝗虫大餐"活了下来。',
          effects: { hunger: 20, mood: -5, fatigue: 5 },
          narrativeTag: '吃过蝗虫',
        },
      },
    ],
  },
  {
    id: 'disaster_conscription',
    name: '官府征兵',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 60,
    narrativeWeight: 'milestone',
    conditions: {
      dayRange: [20, 999],
      location: ['street', 'residential'],
      forbiddenNarrativeTags: ['已从军', '逃兵役'],
      actorMinHealth: 40,
    },
    openingNarrative:
      '官府的告示贴满了大街小巷——边境战事吃紧，征召壮丁从军。每户必须出一名男丁，不去的要缴纳免役税五十文。差役已经开始挨家挨户登记了。',
    choices: [
      {
        id: 'conscript_enlist',
        text: '报名参军',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你穿上了粗布军装，告别了熟悉的一切。军旅生活艰苦卓绝，但也让你见识了从未见过的世界。两年后你因伤退役回乡，带着一身伤疤和一段刻骨铭心的记忆。',
          effects: { health: -20, copper: 30, mood: -5, fatigue: 10 },
          narrativeTag: '退伍军人',
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '军中历练' },
            { type: 'gain_tag', value: '已从军', description: '服过兵役' },
          ],
        },
      },
      {
        id: 'conscript_pay',
        text: '交免役税',
        condition: { field: 'copper', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你咬咬牙拿出五十文铜钱交了免役税。这笔钱是你攒了好久的，一下子没了大半，但至少不用去战场上拼命。',
          effects: { copper: -50, mood: -8 },
          narrativeTag: '纳钱免役',
        },
      },
      {
        id: 'conscript_flee',
        text: '躲避征兵',
        consequence: {
          narrative:
            '你躲到了山里的亲戚家避风头。三个月后征兵结束才敢回来。这段躲藏的日子让你心惊胆战，也让你对官府有了不同的认识。',
          effects: { hunger: -15, fatigue: 8, mood: -5 },
          narrativeTag: '逃兵役',
          relationChange: -3,
        },
      },
    ],
  },
  {
    id: 'disaster_bandits',
    name: '土匪劫掠',
    goalCategory: 'disaster',
    weight: 5,
    cooldownDays: 35,
    narrativeWeight: 'major',
    conditions: {
      location: ['farmland', 'dock', 'mountain'],
      dayRange: [12, 999],
      actorMinCopper: 10,
    },
    openingNarrative:
      '远处传来马蹄声和喊杀声。一伙骑马的土匪正在洗劫村庄/码头！人们四散奔逃，哭喊声此起彼伏。土匪头目挥舞着大刀大喊："把值钱的都交出来！"',
    choices: [
      {
        id: 'bandit_resist',
        text: '组织村民抵抗',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你号召大家拿起农具和土匪周旋。土匪没想到村民敢反抗，僵持了一会儿后抢了几户人家就撤了。虽然没有完全击退他们，但减少了损失。你成了村里的英雄。',
          effects: { copper: -8, health: -10, fatigue: 12, mood: 10 },
          narrativeTag: '抗匪英雄',
          relationChange: 8,
          transformations: [
            { type: 'gain_tag', value: '身手不凡', description: '组织抵抗土匪' },
          ],
        },
      },
      {
        id: 'bandit_hide',
        text: '藏好财物躲起来',
        consequence: {
          narrative:
            '你早有准备，把铜钱埋在了地窖的暗格里。土匪翻遍了屋子只找到了几文零钱，骂骂咧咧地走了。你损失不大，但邻居就没这么幸运了。',
          effects: { copper: -5, mood: -3, fatigue: 5 },
          narrativeTag: '智避土匪',
        },
      },
      {
        id: 'bandit_submit',
        text: '交出财物保命',
        consequence: {
          narrative:
            '你主动把身上的铜钱都交了出来。土匪拿了钱没有为难你就走了。钱财乃身外之物，留得青山在不怕没柴烧。',
          effects: { copper: -15, mood: -8 },
          narrativeTag: '被劫掠',
        },
      },
    ],
  },
  {
    id: 'disaster_earthquake',
    name: '地震塌房',
    goalCategory: 'disaster',
    weight: 3,
    cooldownDays: 65,
    narrativeWeight: 'major',
    conditions: {
      dayRange: [18, 999],
      location: ['residential', 'workshop', 'street'],
    },
    openingNarrative:
      '地面突然剧烈震动起来！房屋摇晃，瓦片纷纷坠落。人们惊叫着冲上街头，尘土飞扬中到处是倒塌的墙垣。远处传来沉闷的隆隆声，仿佛地龙翻身。',
    choices: [
      {
        id: 'quake_rescue',
        text: '救人要紧',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你顾不得余震未消，冲进摇摇欲坠的房子里背出了一个被困的孩子。紧接着又帮着搬开了压住老人的梁柱。双手磨出了血，但看到获救的人们，一切都值了。',
          effects: { health: -12, fatigue: 15, mood: 10, copper: 5 },
          narrativeTag: '抗震救灾',
          relationChange: 10,
          transformations: [
            { type: 'gain_tag', value: '乐善好施', description: '地震中救人' },
          ],
        },
      },
      {
        id: 'quake_rebuild',
        text: '参与重建家园',
        consequence: {
          narrative:
            '地震过后你参与了重建工作。搬砖、和泥、搭架子，一连干了十几天。虽然累得腰酸背痛，但看到新房子一间接一间立起来，心中充满成就感。',
          effects: { fatigue: 20, copper: 8, health: -3, mood: 5 },
          narrativeTag: '震后重建',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'disaster_drought',
    name: '旱魃为虐',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 48,
    narrativeWeight: 'major',
    conditions: {
      season: ['夏'],
      weather: ['晴'],
      dayRange: [50, 85],
      actorMaxHunger: 60,
    },
    openingNarrative:
      '已经三个月没下过一滴雨了。河床龟裂，庄稼枯死，井水也日渐枯竭。米价涨了三倍，城中开始出现逃荒的人潮。人们在龙王庙前跪拜祈雨，香火日夜不断。',
    choices: [
      {
        id: 'drought_share',
        text: '开仓放粮帮助邻里',
        condition: { field: 'copper', operator: 'gte', value: 20 },
        consequence: {
          narrative:
            '你打开自己的粮袋，分给了邻居一些存粮。一位老大娘感动得直掉眼泪："你这孩子，自己也不宽裕还想着别人。"旱情持续了一个月后才缓解，你靠着野菜勉强撑过来了。',
          effects: { copper: -15, hunger: -20, mood: 5, fatigue: 5 },
          narrativeTag: '施粮济邻',
          relationChange: 8,
          transformations: [
            { type: 'gain_tag', value: '乐善好施', description: '旱灾中施粮' },
          ],
        },
      },
      {
        id: 'drought_dig_well',
        text: '组织人挖井找水',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你带头在低洼处挖掘寻找地下水。挖了三天三夜终于冒出了清泉！全村人都来取水，你成了大功臣。官府听说后还赏了你十文钱。',
          effects: { health: -10, fatigue: 18, copper: 10, hunger: 5, mood: 12 },
          narrativeTag: '掘井造福',
          relationChange: 10,
        },
      },
      {
        id: 'drought_survive',
        text: '先管好自己',
        consequence: {
          narrative:
            '你精打细算地分配每一粒粮食和每一滴水。日子过得艰难但总算没饿死。旱情缓解后米价回落，你长舒了一口气。',
          effects: { hunger: -15, copper: -5, mood: -5, fatigue: 5 },
          narrativeTag: '旱灾幸存',
        },
      },
    ],
  },
  {
    id: 'disaster_blizzard',
    name: '风雪围困',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 45,
    narrativeWeight: 'major',
    conditions: {
      season: ['冬'],
      weather: ['雪'],
      dayRange: [30, 999],
      location: ['mountain', 'street', 'residential'],
    },
    openingNarrative:
      '一场突如其来的暴风雪封锁了道路，积雪没过了膝盖。你被困在了半路的一家客栈里，和十几个路人挤在一起取暖。外面的风声呼啸，谁也不知道这雪要下到什么时候。',
    choices: [
      {
        id: 'blizzard_share',
        text: '分享食物和干粮',
        condition: { field: 'hunger', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你拿出自己的干粮分给大家。一个小女孩把她的半块烤红薯塞给你吃。风雪中人们互相取暖，度过了最难熬的三天。雪停后，你们互相扶持着走出了困境。',
          effects: { hunger: -15, mood: 10 },
          narrativeTag: '雪中互助',
          relationChange: 6,
        },
      },
      {
        id: 'blizzard_wait',
        text: '节省粮食等待雪停',
        consequence: {
          narrative:
            '你精打细算地分配每一口食物，一个人缩在角落里等。第三天雪终于停了，你冻得几乎失去知觉，但总算活下来了。',
          effects: { hunger: -20, health: -8, mood: -5 },
          narrativeTag: '雪灾幸存',
        },
      },
      {
        id: 'blizzard_brave',
        text: '冒险冒雪前行',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你裹紧衣服，一头冲进风雪中。走了半个时辰，体力不支倒在雪地里。幸好被后来的搜救队发现，捡回一条命。',
          effects: { health: -15, fatigue: 15, hunger: -10, mood: -8 },
          narrativeTag: '雪中遇险',
        },
      },
    ],
  },
  {
    id: 'disaster_landslide',
    name: '山体滑坡',
    goalCategory: 'disaster',
    weight: 3,
    cooldownDays: 55,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain', 'farmland'],
      weather: ['雨'],
      dayRange: [15, 999],
      actorMinHealth: 35,
    },
    openingNarrative:
      '连日暴雨后，山上传来轰隆隆的闷响。你抬头望去——半座山都在往下滑！泥石流如黑色巨龙般冲了下来，直奔山下的村庄！',
    choices: [
      {
        id: 'landslide_warn',
        text: '大声警告村民',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative:
            '你一边往村里跑一边大喊"快跑！泥石流来了！"村民们听到你的喊声纷纷逃命。泥石流摧毁了十几间房屋，但因为你的警告，无人死亡。村民们感激涕零。',
          effects: { health: -5, fatigue: 10, mood: 15 },
          narrativeTag: '预警救命',
          relationChange: 12,
          transformations: [
            { type: 'gain_tag', value: '救命恩人', description: '泥石流预警' },
          ],
        },
      },
      {
        id: 'landslide_rescue',
        text: '帮助被困的人',
        consequence: {
          narrative:
            '你冲进即将被泥石流吞没的区域，背出了一个被困的老人。刚跑到高处，身后的房屋就被泥石流冲垮了。老人握着你的手不停地颤抖。',
          effects: { health: -8, fatigue: 12, mood: 12 },
          narrativeTag: '泥石流救人',
          relationChange: 10,
        },
      },
      {
        id: 'landslide_run',
        text: '先逃命要紧',
        consequence: {
          narrative:
            '你转身就往高处跑，头也不回。身后是泥石流吞没房屋的巨响。你安全了，但心里一直惦记着那些来不及逃跑的人……',
          effects: { fatigue: 8, mood: -5 },
          narrativeTag: '泥石流逃生',
        },
      },
    ],
  },
  {
    id: 'disaster_food_poisoning',
    name: '食物中毒',
    goalCategory: 'disaster',
    weight: 5,
    cooldownDays: 40,
    narrativeWeight: 'minor',
    conditions: {
      location: ['residential', 'street', 'market'],
      dayRange: [8, 999],
      actorMaxHealth: 60,
    },
    openingNarrative:
      '城中突然爆发了集体食物中毒事件！据说是有人在米铺出售霉变的陈米，已经有几十人上吐下泻被抬进了医馆。官府紧急封锁了那家米铺，正在追查米铺老板。',
    choices: [
      {
        id: 'poison_help',
        text: '去医馆帮忙',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative:
            '你主动到医馆帮忙照顾病人、煎药喂药。忙活了两三天，你也累得够呛，但看到病人们一个个好转，心里很欣慰。郎中送了你一包好茶叶。',
          effects: { copper: 3, health: -5, fatigue: 12, mood: 8 },
          narrativeTag: '医患互助',
          relationChange: 5,
        },
      },
      {
        id: 'poison_expose',
        text: '揭露米铺黑幕',
        consequence: {
          narrative:
            '你听说过那家米铺以前就干过这种事，主动到衙门作证。你的证词帮助官府定案，米铺老板被罚得倾家荡产。受害者们听说后纷纷来感谢你。',
          effects: { mood: 12 },
          narrativeTag: '伸张正义',
          relationChange: 8,
        },
      },
      {
        id: 'poison_avoid',
        text: '庆幸自己没买那家的米',
        consequence: {
          narrative:
            '你想起来前几天差点就在那家米铺买米了，幸好临时改了主意。看着那些中毒的人，你既同情又后怕。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'disaster_bridge_collapse',
    name: '桥梁坍塌',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 50,
    narrativeWeight: 'major',
    conditions: {
      location: ['dock', 'riverbank', 'street'],
      dayRange: [20, 999],
      weather: ['雨', '阴'],
    },
    openingNarrative:
      '汴河上的大桥突然发出断裂的巨响！桥面从中间垮塌，正在桥上行走的人们纷纷坠入河中。岸上人群发出惊恐的尖叫，有人已经跳下去救人。',
    choices: [
      {
        id: 'bridge_rescue',
        text: '跳下去救人',
        condition: { field: 'health', operator: 'gte', value: 55 },
        consequence: {
          narrative:
            '你毫不犹豫地跳进湍急的河水中。连拖带拽，你救起了三个人，自己也被水呛得半死，小腿还被木头划伤。上岸后，获救者的家人跪在地上向你磕头。',
          effects: { health: -12, fatigue: 15, mood: 15, copper: 8 },
          narrativeTag: '水中救人',
          relationChange: 15,
          transformations: [
            { type: 'gain_tag', value: '乐善好施', description: '水中救人' },
          ],
        },
      },
      {
        id: 'bridge_assist',
        text: '在岸边协助',
        consequence: {
          narrative:
            '你不会游泳，但在岸边帮忙拉人、找绳索、倒热水。虽然没有直接下水，但也尽了力。救援结束后你累得浑身是汗。',
          effects: { fatigue: 10, mood: 6 },
          narrativeTag: '协助救援',
          relationChange: 3,
        },
      },
      {
        id: 'bridge_watch',
        text: '在旁边看着',
        consequence: {
          narrative:
            '你站在人群中，看着这惊心动魄的一幕。有人指责你为什么不去帮忙，你无言以对。事后你捐了五文钱给遇难者家属。',
          effects: { copper: -5, mood: -8 },
          narrativeTag: '袖手旁观',
          relationChange: -5,
        },
      },
    ],
  },
  {
    id: 'disaster_granary_theft',
    name: '粮仓失窃',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 60,
    narrativeWeight: 'major',
    conditions: {
      location: ['residential', 'street'],
      dayRange: [25, 999],
      season: ['冬', '春'],
    },
    openingNarrative:
      '官府的粮仓被盗了！数百石粮食一夜之间不翼而飞。这是灾年的救命粮，现在却不知去向。官府震怒，全城戒严搜查，家家户户都被盘问。',
    choices: [
      {
        id: 'theft_report',
        text: '提供线索',
        condition: { field: 'mood', operator: 'gte', value: 35 },
        consequence: {
          narrative:
            '你前几天夜里看到几辆马车从粮仓方向驶出，形迹可疑。主动向捕快提供线索后，官府根据你的描述抓住了盗贼团伙。你领到了十文赏金。',
          effects: { copper: 10, mood: 10 },
          narrativeTag: '破案有功',
          relationChange: 8,
        },
      },
      {
        id: 'theft_suspect',
        text: '被当作嫌疑人',
        consequence: {
          narrative:
            '因为你最近买了一些粮食，被怀疑是赃物。被带到衙门盘问了半天才洗清嫌疑。虽然放回来了，但心里憋屈得很。',
          effects: { mood: -10, fatigue: 5 },
          narrativeTag: '被冤枉',
        },
      },
      {
        id: 'theft_ignore',
        text: '不参与这事',
        consequence: {
          narrative:
            '你闭门不出，等待事态平息。半个月后案子破了，盗粮的是粮仓内部的人监守自盗。你庆幸自己没卷进去。',
          effects: { mood: -2 },
        },
      },
    ],
  },
  {
    id: 'disaster_corvee',
    name: '强征劳役',
    goalCategory: 'disaster',
    weight: 4,
    cooldownDays: 70,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['residential', 'street', 'farmland'],
      dayRange: [30, 999],
      actorMinHealth: 40,
      forbiddenNarrativeTags: ['服过劳役'],
    },
    openingNarrative:
      '官府贴出告示——朝廷要修筑河堤/城墙，征召民夫。每家必须出一人劳役三个月，不去的要缴纳役银三十文。差役已经开始挨家抓人了。',
    choices: [
      {
        id: 'corvee_accept',
        text: '去服劳役',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative:
            '你和其他民夫一起被押送到工地。从早干到晚，吃的是粗茶淡饭，睡的是工棚。三个月后你被释放时，瘦了二十斤，手上全是老茧，但也练就了一身力气。',
          effects: { health: -15, fatigue: 25, copper: -5, mood: -10 },
          narrativeTag: '服过劳役',
          transformations: [
            { type: 'gain_tag', value: '吃苦耐劳', description: '服过劳役' },
          ],
        },
      },
      {
        id: 'corvee_pay',
        text: '交钱免役',
        condition: { field: 'copper', operator: 'gte', value: 30 },
        consequence: {
          narrative:
            '你咬咬牙拿出三十文铜钱交了役银。这笔钱是你好不容易攒下的，但想想工地上的苦，还是花钱买平安吧。',
          effects: { copper: -30, mood: -5 },
          narrativeTag: '纳钱免役',
        },
      },
      {
        id: 'corvee_hide',
        text: '躲起来',
        consequence: {
          narrative:
            '你躲到了山里的亲戚家避风头。差役抓不到你，把你家的东西搬走了一些抵债。三个月后你回来，家中空了不少，但人没事。',
          effects: { copper: -10, mood: -8, hunger: -15 },
          narrativeTag: '逃避劳役',
          relationChange: -3,
        },
      },
    ],
  },
];
