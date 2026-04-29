import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const SURVIVAL_EVENTS: BranchEvent[] = [
  {
    id: 'hungry_beggar',
    name: '饥饿难耐',
    goalCategory: 'survival',
    weight: 10,
    cooldownDays: 8,
    narrativeWeight: 'minor',
    conditions: {
      actorMaxMood: 30,
      actorMaxCopper: 5,
    },
    openingNarrative: '你已经好几天没吃饱了。肚子咕咕叫个不停，头也开始发晕。路边飘来炊烟的味道……',
    choices: [
      {
        id: 'find_wild_food',
        text: '去城外找吃的',
        consequence: {
          narrative: '你拖着疲惫的身子来到城外，在田埂边挖了些野菜。虽然难以下咽，好歹填了填肚子。',
          effects: { hunger: 15, fatigue: -10, mood: -5 },
        },
      },
      {
        id: 'ask_for_food',
        text: '向人求助',
        consequence: {
          narrative: '你红着脸向一个卖饼的大婶开口。大婶叹了口气，递给你一个冷馒头："拿去吧，可怜见的。"',
          effects: { hunger: 20, mood: -3 },
          narrativeTag: '受过施舍',
        },
      },
      {
        id: 'steal_food',
        text: '偷点吃的',
        consequence: {
          narrative: '你趁人不注意，从摊子上顺了一个馒头。心跳如擂鼓，好在没人发现。但心里五味杂陈。',
          effects: { hunger: 20, mood: -15 },
          narrativeTag: '偷过食物',
        },
      },
    ],
  },
  {
    id: 'sudden_illness',
    name: '身体不适',
    goalCategory: 'survival',
    weight: 4,
    cooldownDays: 20,
    narrativeWeight: 'major',
    conditions: {
      actorMaxMood: 25,
      dayRange: [7, 999],
    },
    openingNarrative: '今早起来，你觉得浑身发冷，额头滚烫。周围的声响变得模糊，腿也发软。',
    choices: [
      {
        id: 'go_clinic',
        text: '去看郎中',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative: '你强撑着来到药铺。郎中把了脉，说是风寒，开了三副药。你回去煎了服下，出了一身汗，好歹压住了。',
          effects: { copper: -15, health: 15, fatigue: -5 },
        },
      },
      {
        id: 'rest_it_out',
        text: '硬扛着休息',
        consequence: {
          narrative: '你躺在住处硬扛。烧了一整天，第二天总算退了些，但身子还是很虚。',
          effects: { health: -10, fatigue: 10, hunger: -10 },
          narrativeTag: '硬扛过病',
        },
      },
      {
        id: 'ask_help',
        text: '找人帮忙',
        condition: { field: 'mood', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你找到一个还算熟悉的人，说明了情况。对方二话没说，帮你请了郎中，还送了碗粥。',
          effects: { health: 10, mood: 5, hunger: 10 },
          narrativeTag: '受人恩惠',
          relationChange: 10,
        },
      },
    ],
  },
  {
    id: 'storm_shelter',
    name: '暴风骤雨',
    goalCategory: 'survival',
    weight: 6,
    cooldownDays: 12,
    narrativeWeight: 'minor',
    conditions: {
      weather: ['雨', '雪'],
      location: ['street', 'market', 'farmland', 'dock'],
    },
    openingNarrative: '天色骤变，豆大的雨点噼里啪啦砸了下来。转眼间街上就湿透了，行人四散奔逃。',
    choices: [
      {
        id: 'find_shelter',
        text: '找个地方避雨',
        consequence: {
          narrative: '你钻进一个屋檐下，和几个同样被淋的人挤在一起。大家面面相觑，倒有些可笑。',
          effects: { mood: -2, health: -3 },
        },
      },
      {
        id: 'brave_storm',
        text: '冒雨赶路',
        consequence: {
          narrative: '你咬牙在雨中快步前行。到家时已经浑身湿透，打了好几个喷嚏。',
          effects: { health: -8, fatigue: -5, mood: -5 },
        },
      },
      {
        id: 'help_stranger',
        text: '帮旁边淋雨的老人',
        consequence: {
          narrative: '你脱下外衫披在老人身上，扶着他走到屋檐下。老人感动得直说谢谢。',
          effects: { health: -5, mood: 8 },
          narrativeTag: '雨中助人',
          relationChange: 8,
        },
      },
    ],
  },
];
