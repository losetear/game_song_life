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
];
