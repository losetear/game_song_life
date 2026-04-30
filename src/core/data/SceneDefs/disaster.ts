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
];
