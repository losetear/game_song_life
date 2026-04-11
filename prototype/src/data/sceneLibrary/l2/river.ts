// ════════════════════════════════════════
// L2 粗粒场景 — 河流区域 (10个)
// 描写区域级河域现象：鱼获、水情、航运、节庆
// ════════════════════════════════════════

import { L2Scene } from '../../../ai/sceneLibrary/types';

export const L2_RIVER_SCENES: L2Scene[] = [
  // ──── 鱼获丰收 ────
  {
    id: 'l2_fish_abundant',
    name: '鱼获丰收',
    category: 'fishing',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.8,
    },
    outcomes: [
      {
        narrative: '{regionName}的渔民们今天乐开了花，一网下去满是银光闪闪的鱼。大鱼小鱼翻腾跳跃，渔船的舱底很快就堆满了。码头上讨价还价的声音此起彼伏。',
        atmosphereTag: '鱼获丰收',
        economicEffect: [{ good: 'fish', priceMultiplier: 0.7 }],
        npcMoraleEffect: 8,
      },
      {
        narrative: '河水清澈见底，{regionName}的鱼群多得几乎可以用手捞。渔民们忙着补网晒鱼，晒架上的鱼干在阳光下泛着金色的油光。今年水族兴旺，河神保佑。',
        atmosphereTag: '鱼获丰收',
        economicEffect: [{ good: 'fish', priceMultiplier: 0.75 }],
        npcMoraleEffect: 6,
      },
    ],
    weight: 6,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 鱼获稀少 ────
  {
    id: 'l2_fish_scarce',
    name: '鱼获稀少',
    category: 'fishing',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'below',
      thresholdValue: 0.5,
    },
    outcomes: [
      {
        narrative: '{regionName}的渔民愁眉不展，撒了一天的网只捞上来几条小猫鱼。河水里看不到半点鱼影，鱼鹰蹲在船头无聊地梳理羽毛。老渔民说，河里的鱼一年比一年少了。',
        atmosphereTag: '鱼获萧条',
        economicEffect: [{ good: 'fish', priceMultiplier: 1.6 }],
        npcMoraleEffect: -8,
      },
      {
        narrative: '空荡荡的渔网挂在{regionName}的船桅上随风飘荡，渔民们坐在船头抽烟发呆。市场上鲜鱼的价格涨了好几成，可就是有价无市。水里的鱼像是约好了似地躲起来了。',
        atmosphereTag: '鱼获萧条',
        economicEffect: [{ good: 'fish', priceMultiplier: 1.5 }],
        npcMoraleEffect: -6,
      },
    ],
    weight: 5,
    cooldownTicks: 12,
    priority: 6,
  },

  // ──── 河水暴涨 ────
  {
    id: 'l2_stormy_river',
    name: '河水暴涨',
    category: 'disaster',
    conditions: {
      regionType: ['river'],
      thresholdType: 'weather',
      thresholdOperator: 'above',
      thresholdValue: 0.7,
      weather: ['暴雨', '大暴雨', '连阴雨'],
    },
    outcomes: [
      {
        narrative: '暴雨倾盆，{regionName}的河水猛涨，浑浊的洪流裹挟着泥沙和断木翻涌而下。码头被淹了一半，船只全拴在桩上随浪颠簸。渔民们退到高地上，忧心忡忡地望着河面。',
        atmosphereTag: '河水暴涨',
        economicEffect: [{ good: 'fish', priceMultiplier: 1.4 }],
        npcMoraleEffect: -12,
      },
      {
        narrative: '{regionName}的水位一夜之间涨了三尺，河面变得又宽又急。激流拍打着岸边的石头，发出震耳欲聋的轰鸣。没有人敢在这时候下河，连渡船都停了。',
        atmosphereTag: '河水暴涨',
        npcMoraleEffect: -10,
      },
    ],
    weight: 4,
    cooldownTicks: 15,
    priority: 8,
  },

  // ──── 河面结冰 ────
  {
    id: 'l2_ice_river',
    name: '河面结冰',
    category: 'seasonal',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.2,
      season: ['冬'],
    },
    outcomes: [
      {
        narrative: '{regionName}的河面结了一层厚厚的冰，渔船全部搁浅在岸边。孩子们在冰面上打陀螺、滑冰车，笑声在空旷的河谷中回荡。渔民们则盘算着冰下的鱼什么时候才能再打。',
        atmosphereTag: '冰封河面',
        economicEffect: [{ good: 'fish', priceMultiplier: 1.6 }],
        npcMoraleEffect: -2,
      },
      {
        narrative: '寒风凛冽，{regionName}的河水凝固成了一面巨大的银镜。偶尔有冰裂的声音从河心传来，像是大地在打寒颤。胆大的渔民凿开冰面下网，但收获寥寥。',
        atmosphereTag: '冰封河面',
        economicEffect: [{ good: 'fish', priceMultiplier: 1.5 }],
        npcMoraleEffect: -3,
      },
    ],
    weight: 6,
    cooldownTicks: 10,
    priority: 5,
  },

  // ──── 商船往来 ────
  {
    id: 'l2_trade_boats',
    name: '商船往来',
    category: 'fishing',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.6,
    },
    outcomes: [
      {
        narrative: '{regionName}上商船络绎不绝，满载着丝绸、盐巴和粮食的货船首尾相接。码头上工人们扛着麻袋来回穿梭，商贩们操着各地口音讨价还价。水路通，则百业兴。',
        atmosphereTag: '航运繁忙',
        economicEffect: [{ good: 'silk', priceMultiplier: 0.85 }, { good: 'salt', priceMultiplier: 0.9 }],
        npcMoraleEffect: 5,
      },
      {
        narrative: '桅杆林立的{regionName}码头，商船排成了长队等待卸货。船工们的号子声、车轮的辘辘声、小贩的叫卖声交织在一起，好一派繁忙景象。',
        atmosphereTag: '航运繁忙',
        economicEffect: [{ good: 'salt', priceMultiplier: 0.88 }],
        npcMoraleEffect: 4,
      },
    ],
    weight: 5,
    cooldownTicks: 10,
    priority: 5,
  },

  // ──── 河水平静 ────
  {
    id: 'l2_river_peaceful',
    name: '河水平静',
    category: 'atmosphere',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.3,
    },
    outcomes: [
      {
        narrative: '{regionName}的水面波光粼粼，映着两岸的翠柳和蓝天白云。渔船悠悠地漂在水上，鸬鹚站在船头时而扎入水中，时而叼着鱼浮上来。岁月静好，不过如此。',
        atmosphereTag: '河水平静',
        npcMoraleEffect: 3,
      },
      {
        narrative: '碧波荡漾的{regionName}上，几叶扁舟随波逐流。岸边有人在洗菜浣衣，对岸的水车吱呀作响。河风带着湿润的水汽拂过面颊，令人心旷神怡。',
        atmosphereTag: '河水平静',
        npcMoraleEffect: 2,
      },
    ],
    weight: 7,
    cooldownTicks: 8,
    priority: 3,
  },

  // ──── 渔民节庆 ────
  {
    id: 'l2_fishing_festival',
    name: '渔民节庆',
    category: 'seasonal',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.5,
      season: ['春'],
    },
    outcomes: [
      {
        narrative: '春天是{regionName}渔民祭河神的日子。家家户户在船头挂上红灯笼，供奉鲜鱼和米酒。鞭炮声响彻河谷，渔民们跪在船头叩拜，祈求今年鱼虾满仓、出行平安。',
        atmosphereTag: '渔民节庆',
        npcMoraleEffect: 8,
      },
      {
        narrative: '{regionName}的渔民们聚在一起庆祝开渔节。大伙儿把最大的鱼系上红绸，敲锣打鼓地绕着河岸游行。孩子们脖子上挂着鱼形护身符，跑来跑去好不热闹。',
        atmosphereTag: '渔民节庆',
        npcMoraleEffect: 6,
      },
    ],
    weight: 4,
    cooldownTicks: 20,
    priority: 6,
  },

  // ──── 洪水预警 ────
  {
    id: 'l2_flood_warning',
    name: '洪水预警',
    category: 'disaster',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.9,
      weather: ['暴雨', '大暴雨'],
    },
    outcomes: [
      {
        narrative: '{regionName}的水位已经超过了警戒线，河水浑浊翻涌，裹挟着上游冲下来的树枝和杂物。渡口的船夫连夜撤走了船只，码头上堆满了沙袋。所有人都知道，更大的洪水还在路上。',
        atmosphereTag: '洪水预警',
        npcMoraleEffect: -15,
      },
      {
        narrative: '上游来的急报说暴雨还在持续，{regionName}的堤坝已经开始渗水。村里敲响了铜锣，青壮年们扛着沙袋冲上堤岸加固。妇孺老幼开始往高处转移，气氛紧张到了极点。',
        atmosphereTag: '洪水预警',
        npcMoraleEffect: -18,
      },
    ],
    weight: 2,
    cooldownTicks: 25,
    priority: 10,
  },

  // ──── 河水清澈 ────
  {
    id: 'l2_clear_water',
    name: '河水清澈',
    category: 'atmosphere',
    conditions: {
      regionType: ['river'],
      thresholdType: 'weather',
      thresholdOperator: 'below',
      thresholdValue: 0.3,
      season: ['春', '秋'],
      weather: ['晴', '晴朗'],
    },
    outcomes: [
      {
        narrative: '碧蓝如洗的天空下，{regionName}的河水清澈得能看见河底的鹅卵石。水草随波飘摇，一群小鱼在石缝间穿梭嬉戏。岸边柳条低垂，拂过水面荡起圈圈涟漪。',
        atmosphereTag: '河水清澈',
        npcMoraleEffect: 4,
      },
      {
        narrative: '秋日的阳光照在{regionName}的水面上，河水透亮如镜，倒映着两岸金黄的树影。白鹭涉水觅食，翅膀在阳光下闪着银光。好一幅秋水长天的画卷。',
        atmosphereTag: '河水清澈',
        npcMoraleEffect: 5,
      },
    ],
    weight: 5,
    cooldownTicks: 10,
    priority: 4,
  },

  // ──── 龙舟竞渡 ────
  {
    id: 'l2_dragon_boat',
    name: '龙舟竞渡',
    category: 'seasonal',
    conditions: {
      regionType: ['river'],
      thresholdType: 'fish',
      thresholdOperator: 'above',
      thresholdValue: 0.3,
      season: ['夏'],
    },
    outcomes: [
      {
        narrative: '{regionName}上鼓声震天，几条龙舟在河面上你追我赶。划桨的汉子们光着膀子，古铜色的肌肉在阳光下闪着汗光。两岸的观众呐喊助威，热闹非凡。',
        atmosphereTag: '龙舟竞渡',
        npcMoraleEffect: 8,
      },
      {
        narrative: '端午时节，{regionName}的龙舟赛吸引了十里八乡的人来观看。彩旗飘扬，鼓点激越，龙舟如箭一般在河面上飞驰。岸上的大人和孩子挤得水泄不通，叫好声响成一片。',
        atmosphereTag: '龙舟竞渡',
        npcMoraleEffect: 10,
      },
    ],
    weight: 4,
    cooldownTicks: 20,
    priority: 6,
  },
];
