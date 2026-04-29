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
];
