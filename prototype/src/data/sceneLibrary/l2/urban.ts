// ════════════════════════════════════════
// L2 粗粒场景 — 城市区域 (8个)
// 描写区域级城市现象：市集、治安、节庆、灾后
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

export const L2_URBAN_SCENES: L2Scene[] = [
  // ──── 市场繁荣 ────
  {
    id: 'l2_market_buzz',
    name: '市场繁荣',
    category: 'atmosphere',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.4,
    },
    outcomes: [
      {
        narrative: '{regionName}的集市上人头攒动，叫卖声、讨价还价声此起彼伏。布庄里挂满了各色绸缎，粮铺前排队的人从街头排到街尾。铁匠铺的锤声叮叮当当，和远处茶楼的说书声混在一起，热闹极了。',
        atmosphereTag: '市井繁华',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.95 }, { good: 'silk', priceMultiplier: 0.95 }],
        npcMoraleEffect: 4,
      },
      {
        narrative: '晨光中的{regionName}已是一派繁忙。菜贩子挑着担子吆喝着走过长街，早起的茶客在茶馆里品着新茶。货郎的拨浪鼓声由远及近，引得巷子里的孩子追着跑。',
        atmosphereTag: '市井繁华',
        npcMoraleEffect: 3,
      },
    ],
    weight: 7,
    cooldownTicks: 8,
    priority: 4,
  },

  // ──── 夜街寂静 ────
  {
    id: 'l2_quiet_night',
    name: '夜街寂静',
    category: 'atmosphere',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '入夜后的{regionName}渐渐安静下来，沿街的店铺依次打烊，只剩几盏灯笼在风中摇曳。打更人的梆子声在空旷的长街上回荡，偶尔有野猫从墙头窜过，留下一串窸窣声。',
        atmosphereTag: '夜色静谧',
        npcMoraleEffect: 1,
      },
      {
        narrative: '月色照在{regionName}的青石板路上，泛着冷冷的光。酒楼最后几位客人踉踉跄跄地出来，高声唱着走了调的小曲。更夫提着灯笼走过来，提醒他们早些回家。',
        atmosphereTag: '夜色静谧',
        npcMoraleEffect: 2,
      },
    ],
    weight: 6,
    cooldownTicks: 8,
    priority: 3,
  },

  // ──── 节日气氛 ────
  {
    id: 'l2_festival_mood',
    name: '节日气氛',
    category: 'seasonal',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
      season: ['春', '秋'],
    },
    outcomes: [
      {
        narrative: '{regionName}的大街小巷张灯结彩，红绸从这头挂到那头。街头搭起了戏台子，锣鼓家伙一响，人群就围了上来。小贩推着车叫卖糖人和糖葫芦，空气里弥漫着节日的甜蜜气息。',
        atmosphereTag: '节日欢庆',
        npcMoraleEffect: 8,
      },
      {
        narrative: '节日的{regionName}人声鼎沸，花车从正街缓缓驶过，上面站着扮仙女的姑娘，朝人群撒着花瓣。孩子们骑在大人肩上看热闹，笑声和锣鼓声汇成了一片欢乐的海洋。',
        atmosphereTag: '节日欢庆',
        npcMoraleEffect: 10,
      },
    ],
    weight: 5,
    cooldownTicks: 15,
    priority: 6,
  },

  // ──── 灾后检查 ────
  {
    id: 'l2_post_storm',
    name: '灾后恢复',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'weather',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
      weather: ['暴雨', '大暴雨'],
    },
    outcomes: [
      {
        narrative: '暴雨过后的{regionName}满目疮痍，街面积水未退，屋瓦碎了一地。衙役们在街上巡视，排查受损的房屋。街坊们互相帮着清理门前的淤泥和断枝，日子还得继续过。',
        atmosphereTag: '灾后恢复',
        npcMoraleEffect: -8,
      },
      {
        narrative: '风雨终于停了，{regionName}的居民们走出家门查看损失。有的店铺招牌被风刮跑了，有的院墙塌了一角。邻里之间互相问安，帮忙收拾残局，倒也显出几分患难真情。',
        atmosphereTag: '灾后恢复',
        npcMoraleEffect: -5,
      },
    ],
    weight: 4,
    cooldownTicks: 12,
    priority: 7,
  },

  // ──── 市场恐慌 ────
  {
    id: 'l2_market_crash',
    name: '市场恐慌',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '{regionName}的集市上一片萧条，商贩们愁眉苦脸地守着空荡荡的摊位。物价飞涨，铜钱的购买力一天不如一天。有人开始囤积粮食，更加剧了恐慌。穷苦人家已经买不起米了。',
        atmosphereTag: '市场恐慌',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.8 }, { good: 'salt', priceMultiplier: 1.5 }],
        npcMoraleEffect: -12,
      },
      {
        narrative: '物价像脱缰的野马一样往上窜，{regionName}的百姓怨声载道。粮店门前排起了长队，可到手的粮食却越来越少。有人在街角低声议论，说官府也束手无策了。',
        atmosphereTag: '市场恐慌',
        economicEffect: [{ good: 'grain', priceMultiplier: 1.6 }],
        npcMoraleEffect: -10,
      },
    ],
    weight: 3,
    cooldownTicks: 18,
    priority: 9,
  },

  // ──── 戒严气氛 ────
  {
    id: 'l2_martial_law',
    name: '戒严气氛',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '{regionName}的街头多了许多持刀巡逻的衙役，天还没黑就开始清街。行人们低头快步走过，不敢多做停留。酒楼茶馆里说话都压低了嗓子，生怕隔墙有耳。',
        atmosphereTag: '戒严紧张',
        npcMoraleEffect: -10,
      },
      {
        narrative: '沉重的脚步声在{regionName}的石板路上回响，甲胄碰撞的声音令人不安。宵禁的告示贴满了城墙，日落后就不准出门。百姓们缩在家里，连窗户都不敢开。',
        atmosphereTag: '戒严紧张',
        npcMoraleEffect: -12,
      },
    ],
    weight: 3,
    cooldownTicks: 15,
    priority: 8,
  },

  // ──── 瘟疫恐惧 ────
  {
    id: 'l2_plague_fear',
    name: '瘟疫恐惧',
    category: 'disaster',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'below',
      thresholdValue: 0.4,
    },
    outcomes: [
      {
        narrative: '有传言说{regionName}出现了瘟疫，街上的人都用布巾捂着口鼻。药铺门前排起了长队，艾草和雄黄卖到了天价。家家户户大门紧闭，平日热闹的街巷冷清得像鬼城。',
        atmosphereTag: '瘟疫恐惧',
        economicEffect: [{ good: 'medicine', priceMultiplier: 2.0 }, { good: 'herb', priceMultiplier: 1.8 }],
        npcMoraleEffect: -15,
      },
      {
        narrative: '{regionName}的大夫们忙得脚不沾地，求诊的人从药铺门口排到了巷子尾。空气里弥漫着药汤和艾烟的气味。没有人敢串门，邻居之间隔着一道墙说话，声音都带着颤抖。',
        atmosphereTag: '瘟疫恐惧',
        economicEffect: [{ good: 'medicine', priceMultiplier: 1.8 }],
        npcMoraleEffect: -12,
      },
    ],
    weight: 2,
    cooldownTicks: 20,
    priority: 9,
  },

  // ──── 盛世景象 ────
  {
    id: 'l2_golden_age',
    name: '盛世景象',
    category: 'prosperity',
    conditions: {
      regionType: ['urban'],
      thresholdType: 'mood',
      thresholdOperator: 'above',
      thresholdValue: 0.8,
    },
    outcomes: [
      {
        narrative: '{regionName}如今是一派太平盛世的气象。市井繁华，百业兴旺，街道整洁有序。学堂里书声琅琅，酒楼里觥筹交错。就连乞丐脸上都带着几分满足的笑意，这是难得的好时候。',
        atmosphereTag: '盛世太平',
        economicEffect: [{ good: 'grain', priceMultiplier: 0.85 }, { good: 'silk', priceMultiplier: 0.9 }, { good: 'fish', priceMultiplier: 0.9 }],
        npcMoraleEffect: 10,
      },
      {
        narrative: '家家户户丰衣足食，{regionName}的百姓安居乐业。街头巷尾都能听到笑声，孩子们衣着整洁地嬉闹玩耍。老人们坐在茶馆里感慨：活了这么多年，就数现在的日子最好过。',
        atmosphereTag: '盛世太平',
        npcMoraleEffect: 12,
      },
    ],
    weight: 3,
    cooldownTicks: 20,
    priority: 7,
  },
];
