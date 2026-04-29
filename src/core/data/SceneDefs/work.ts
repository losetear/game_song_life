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
];
