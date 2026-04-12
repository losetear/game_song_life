// === L0 演出库 — 坏事/恶作剧 (Mischief) ===
//
// 包含：扒窃、骗术、勒索、抢劫、造谣、卖假药、设局、留贼标、
//       贿赂衙役、破坏财物、用假币、声东击西、短斤少两、告密、投毒

import type { L0Scene, L0SceneCondition } from '../../../ai/sceneLibrary/types';

const S: L0SceneCondition = { actorTraits: [], actorForbiddenTraits: [], targetRequired: false };

export const MISCHIEF_SCENES: L0Scene[] = [
  // ════════════════════════════════════════
  // 迁移自旧演出库的 5 个场景
  // ════════════════════════════════════════

  {
    id: 'mi_pickpocket', name: '扒窃', description: '狡猾者伸手摸人钱袋',
    goalCategory: 'mischief', outcomeType: 'multi_contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'cunning', target: 'alertness' },
    tags: ['stealing', 'street', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: ['正直'], actorMaxCopper: 30,
      targetRequired: true, targetMinCopper: 20,
    },
    success: {
      narrative: '{npcName}的手像蛇一样伸进了{targetName}的口袋。指尖触到铜钱的一刻，心跳猛地加速。得手了。',
      effects: { copper: 15, mood: 3, safety: -10 },
      targetEffects: { copper: -15, mood: -8 },
      relationChange: -15,
      memoryTag: '扒窃得手',
    },
    failure: {
      narrative: '{npcName}的手刚伸出去，{targetName}猛地回头，一把抓住了他的手腕。"抓小偷！"',
      effects: { mood: -15, safety: -25, health: -5 },
      targetEffects: { mood: 5 },
      relationChange: -25,
      memoryTag: '扒窃被抓',
    },
    resolution: {
      type: 'multi_contested',
      contestedStat: { actor: 'cunning', target: 'alertness' },
      multiContested: {
        actorStats: [
          { stat: 'cunning', weight: 1.2 },
          { stat: 'agility', weight: 0.6 },
          { stat: 'greed', weight: 0.3 },
        ],
        targetStats: [
          { stat: 'alertness', weight: 1.0 },
          { stat: 'cunning', weight: 0.4 },
        ],
        modifiers: [
          { condition: { field: 'nearbyCount', op: 'gte', value: 5 }, bonus: 8 },  // 人多好下手
          { condition: { field: 'nearbyCount', op: 'lte', value: 2 }, bonus: -10 }, // 人少容易暴露
          { condition: { field: 'actorEmotion', op: 'includes', value: 'tense' }, bonus: -8 }, // 紧张手抖
          { condition: { field: 'actorStress', op: 'gte', value: 60 }, bonus: -5 },
          { condition: { field: 'honor', op: 'gte', value: 60 }, bonus: -15 }, // 有荣誉感的不擅长偷窃
        ],
      },
    },
    tieredOutcomes: [
      {
        minScore: 90,
        tier: 'critical_success',
        outcome: {
          narrative: '{npcName}的手如鬼魅般探入{targetName}怀中，不仅摸走了钱袋，还顺手牵走了一块玉佩。等到{targetName}发现时，{npcName}早已消失在人群中。',
          effects: { copper: 25, mood: 8, safety: -5 },
          targetEffects: { copper: -25, mood: -15 },
          relationChange: -20,
          memoryTag: '满载而归',
        },
      },
      {
        minScore: 60,
        tier: 'success',
        outcome: {
          narrative: '{npcName}的手像蛇一样伸进了{targetName}的口袋。指尖触到铜钱的一刻，心跳猛地加速。得手了。',
          effects: { copper: 15, mood: 3, safety: -10 },
          targetEffects: { copper: -15, mood: -8 },
          relationChange: -15,
          memoryTag: '扒窃得手',
        },
      },
      {
        minScore: 40,
        tier: 'partial_success',
        outcome: {
          narrative: '{npcName}的手伸进{targetName}口袋，刚碰到铜钱，{targetName}似乎有所察觉，回了一下头。{npcName}赶紧缩手，只摸走了几文散钱。',
          effects: { copper: 5, mood: -2, safety: -15 },
          targetEffects: { copper: -5, mood: -2 },
          relationChange: -10,
          memoryTag: '勉强得手',
        },
      },
      {
        minScore: 20,
        tier: 'failure',
        outcome: {
          narrative: '{npcName}的手刚伸出去，{targetName}猛地回头，一把抓住了他的手腕。"抓小偷！"',
          effects: { mood: -15, safety: -25, health: -5 },
          targetEffects: { mood: 5 },
          relationChange: -25,
          memoryTag: '扒窃被抓',
        },
      },
      {
        minScore: 0,
        tier: 'critical_failure',
        outcome: {
          narrative: '{npcName}还没来得及下手，旁边的巡城甲士就注意到了他的可疑举动。一把扣住他的肩膀："鬼鬼祟祟干什么？"铜钱没偷到，自己倒被押进了府衙。',
          effects: { mood: -25, safety: -40, copper: -20 },
          targetEffects: { mood: 0 },
          relationChange: -30,
          memoryTag: '当场抓获',
        },
      },
    ],
  },
  {
    id: 'mi_con_game', name: '骗术', description: '用花言巧语骗人钱财',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 6,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    tags: ['deception', 'street', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾', '机灵'], actorForbiddenTraits: ['正直', '善良'],
      targetRequired: true, targetTraits: ['善良', '胆小', '好奇'], targetMinCopper: 10,
    },
    success: {
      narrative: '{npcName}拉住{targetName}，神秘兮兮地说："兄台，我有批货急出手，便宜到你不敢信……"{targetName}掏出了铜钱。',
      effects: { copper: 15, mood: 5 },
      targetEffects: { copper: -15, mood: -8 },
      relationChange: -10,
      memoryTag: '骗术得手',
    },
    failure: {
      narrative: '{targetName}上下打量了{npcName}一眼："这种把戏我见多了。"甩开手走了。',
      effects: { mood: -5 },
      relationChange: -5,
    },
  },
  {
    id: 'mi_extort', name: '勒索', description: '欺负老实人强要钱财',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 1, cooldownTicks: 10,
    contestedStat: { actor: 'aggression', target: 'courage' },
    tags: ['intimidation', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['暴躁', '狡猾'], actorForbiddenTraits: ['正直'],
      targetRequired: true, targetTraits: ['胆小', '温和'], targetMinCopper: 10,
    },
    success: {
      narrative: '{npcName}拦住{targetName}的去路："这路是我修的，想过得交点养路钱。"{targetName}哆嗦着掏出了铜钱。',
      effects: { copper: 10, mood: 3 },
      targetEffects: { copper: -10, mood: -12, safety: -10 },
      relationChange: -20,
      memoryTag: '勒索得手',
    },
    failure: {
      narrative: '{targetName}非但没害怕，反而大喊："有人打劫！"{npcName}吓得赶紧跑了。',
      effects: { mood: -10, safety: -15 },
      relationChange: -15,
    },
  },
  {
    id: 'mi_rob', name: '持械抢劫', description: '夜间持械劫掠行人',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 1, cooldownTicks: 15,
    contestedStat: { actor: 'bravery', target: 'courage' },
    tags: ['violent', 'night', 'aggressive'],
    priority: 2,
    conditions: {
      ...S, actorTraits: ['暴躁', '勇敢'], actorForbiddenTraits: ['正直', '善良'],
      actorMaxCopper: 20, targetRequired: true, targetMinCopper: 30, timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}从暗处跳出来，手里举着棍子。"把钱留下，人可以走！"{targetName}吓得瘫软在地。',
      effects: { copper: 30, mood: 3, safety: -20 },
      targetEffects: { copper: -30, mood: -20, safety: -20 },
      relationChange: -30,
      memoryTag: '抢劫得手',
    },
    failure: {
      narrative: '{targetName}一脚踢飞了{npcName}的棍子，大喊："来人啊！"{npcName}转身就跑。',
      effects: { mood: -15, health: -10, safety: -25 },
      relationChange: -25,
      memoryTag: '抢劫失败',
    },
  },
  {
    id: 'mi_spread_rumor', name: '散布谣言', description: '暗中散播流言蜚语',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 3, cooldownTicks: 5,
    contestedStat: { actor: 'eloquence', target: 'judgment' },
    tags: ['deception', 'social', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: ['正直'],
      targetRequired: true, targetTraits: ['好奇', '胆小'],
    },
    success: {
      narrative: '{npcName}凑到{targetName}耳边："你知道吗……那家的娘子跟隔壁的……"说着还四下张望了一圈，{targetName}听得瞪大了眼。',
      effects: { mood: 5 },
      targetEffects: { mood: -5 },
      relationChange: -8,
      memoryTag: '散布谣言',
    },
    failure: {
      narrative: '{targetName}听了两句就皱起了眉头："这种没影的事你也信？别传了。"{npcName}讪讪地走开了。',
      effects: { mood: -3 },
      relationChange: -3,
    },
  },

  // ════════════════════════════════════════
  // 新增 10 个场景
  // ════════════════════════════════════════

  {
    id: 'mi_fake_medicine', name: '卖假药', description: '狡猾者假扮郎中兜售假药',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    tags: ['deception', 'trade', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: [], actorProfession: undefined,
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}铺开一块布，上面摆满了瓶瓶罐罐。"祖传秘方，包治百病！"{targetName}信以为真，掏钱买了一瓶。',
      effects: { copper: 12, mood: 5 },
      targetEffects: { copper: -12, mood: -3 },
      relationChange: -10,
      memoryTag: '卖假药得手',
    },
    failure: {
      narrative: '{targetName}拿过药瓶闻了闻，脸色一变："这分明是面粉搓的丸子！"{npcName}赶紧收摊跑了。',
      effects: { mood: -10, safety: -15 },
      relationChange: -15,
    },
  },
  {
    id: 'mi_rigged_game', name: '街头设局', description: '夜间在街头设赌局骗人',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 7,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    tags: ['deception', 'gambling', 'night', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: [],
      targetRequired: true, timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}在地上铺了块布，摆出三个碗。"猜猜豆子在哪个碗里？"{targetName}押了铜钱，却怎么也猜不对。',
      effects: { copper: 10, mood: 5 },
      targetEffects: { copper: -10, mood: -8 },
      relationChange: -8,
      memoryTag: '设局骗钱',
    },
    failure: {
      narrative: '{targetName}盯着{npcName}的手看了半天，一把掀翻了碗："果然有诈！"{npcName}趁乱溜走了。',
      effects: { mood: -8, safety: -10 },
      relationChange: -12,
    },
  },
  {
    id: 'mi_mark_building', name: '留盗贼标记', description: '在仇家门上暗中留下贼人暗号',
    goalCategory: 'mischief', outcomeType: 'certain', weight: 2, cooldownTicks: 10,
    tags: ['stealing', 'sneaky', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: [],
      targetRequired: true, targetRelationType: 'enemy',
    },
    success: {
      narrative: '{npcName}趁四下无人，用炭笔在{targetName}的门框上画了个古怪的符号。这是贼人们的暗号——这家有油水。',
      effects: { mood: 5, safety: -5 },
      targetEffects: { safety: -15 },
      relationChange: -10,
      memoryTag: '留贼标',
    },
  },
  {
    id: 'mi_bribe_guard', name: '贿赂衙役', description: '商贩或无赖用铜钱买通衙役',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 10,
    contestedStat: { actor: 'cleverness', target: 'honor' },
    tags: ['corruption', 'social', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: [], actorMinCopper: 20,
      actorProfession: ['merchant', 'rogue'],
      targetRequired: true, targetProfession: ['guard'],
    },
    success: {
      narrative: '{npcName}把一袋铜钱悄悄塞进{targetName}手里，压低声音："这点心意，大人行个方便。"{targetName}掂了掂分量，点了点头。',
      effects: { copper: -20, mood: 5, safety: 10 },
      targetEffects: { copper: 20, mood: 3 },
      relationChange: 5,
      memoryTag: '贿赂衙役',
    },
    failure: {
      narrative: '{targetName}一巴掌拍开{npcName}的手："你想干什么？行贿衙役，罪加一等！"{npcName}吓得面如土色。',
      effects: { copper: -20, mood: -15, safety: -20 },
      relationChange: -15,
      memoryTag: '贿赂被拒',
    },
  },
  {
    id: 'mi_vandalism', name: '破坏财物', description: '夜间潜入仇家毁坏器物',
    goalCategory: 'mischief', outcomeType: 'certain', weight: 2, cooldownTicks: 10,
    tags: ['violent', 'night', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['暴躁'], actorForbiddenTraits: [],
      targetRequired: true, targetRelationType: 'enemy', timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}趁着夜色摸到{targetName}家门口，一脚踢翻了好端端摆在门口的花盆。又抓起石头砸碎了窗纸，这才解气地走了。',
      effects: { mood: 8, safety: -10 },
      targetEffects: { mood: -12, copper: -5 },
      relationChange: -20,
      memoryTag: '破坏财物',
    },
  },
  {
    id: 'mi_counterfeit', name: '用假币', description: '以假乱真混用伪造铜钱',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    tags: ['deception', 'trade', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾', '贪婪'], actorForbiddenTraits: ['正直'], actorMinCopper: 30,
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}把几枚打磨光亮的假铜钱混在真钱里递了过去。{targetName}数了数，没细看便收下了。',
      effects: { copper: 8, mood: 5 },
      targetEffects: { copper: -8 },
      relationChange: -8,
      memoryTag: '用假币得手',
    },
    failure: {
      narrative: '{targetName}拿起铜钱一掂，脸色就变了："这钱不对！"{npcName}赶紧装作无辜："啊？是吗？那我还回去……"',
      effects: { mood: -12, safety: -15 },
      relationChange: -15,
    },
  },
  {
    id: 'mi_distract_steal', name: '声东击西', description: '一人吸引注意力，同伙趁机下手',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 7,
    contestedStat: { actor: 'cleverness', target: 'alertness' },
    tags: ['stealing', 'deception', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['狡猾'], actorForbiddenTraits: [],
      minNearbyNpcs: 2, targetRequired: true,
    },
    success: {
      narrative: '{npcName}故意撞了{targetName}一下，连声道歉。趁对方弯腰去捡掉落的东西时，另一只手已经摸走了钱袋。',
      effects: { copper: 12, mood: 3, safety: -8 },
      targetEffects: { copper: -12, mood: -8 },
      relationChange: -12,
      memoryTag: '声东击西得手',
    },
    failure: {
      narrative: '{npcName}刚要出手，旁边一个路人眼尖喊了一嗓子。{targetName}回头一看，{npcName}的手正悬在自己腰间。顿时闹开了。',
      effects: { mood: -15, safety: -20 },
      relationChange: -20,
    },
  },
  {
    id: 'mi_cheat_weight', name: '短斤少两', description: '商人在秤上做手脚克扣斤两',
    goalCategory: 'mischief', outcomeType: 'contested', weight: 3, cooldownTicks: 6,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    tags: ['deception', 'trade', 'merchant', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['贪婪', '狡猾'], actorForbiddenTraits: [],
      actorProfession: ['merchant'], targetRequired: true,
    },
    success: {
      narrative: '{npcName}在秤杆上做了点手脚，称的时候拇指微微一压。{targetName}不明就里，付了钱提着短了几两的货走了。',
      effects: { copper: 8, mood: 3 },
      targetEffects: { copper: -8 },
      relationChange: -5,
      memoryTag: '短斤少两',
    },
    failure: {
      narrative: '{targetName}掂了掂袋子，面色一沉："这分量不对啊。"{npcName}赶紧赔笑："哎哟，手滑了手滑了，再给您添点。"',
      effects: { mood: -5 },
      relationChange: -8,
    },
  },
  {
    id: 'mi_snitch_guard', name: '向衙役告密', description: '精明者暗中向衙役揭发仇家',
    goalCategory: 'mischief', outcomeType: 'certain', weight: 3, cooldownTicks: 10,
    tags: ['betrayal', 'social', 'aggressive'],
    conditions: {
      ...S, actorTraits: ['精明'], actorForbiddenTraits: [],
      targetRequired: true, targetRelationType: 'enemy',
    },
    success: {
      narrative: '{npcName}悄悄溜进衙门，跟当值的衙役耳语了几句。临走时回头望了一眼{targetName}的方向，嘴角挂着一丝冷笑。',
      effects: { mood: 5 },
      targetEffects: { safety: -15, mood: -10 },
      relationChange: -25,
      memoryTag: '暗中告密',
    },
  },
  {
    id: 'mi_poison_well', name: '投毒', description: '极端压力下对公共水源下毒',
    goalCategory: 'mischief', outcomeType: 'chance', weight: 1, cooldownTicks: 30,
    successChance: 0.3,
    tags: ['violent', 'extreme', 'aggressive'],
    priority: 1,
    conditions: {
      ...S, actorTraits: ['狡猾', '暴躁'], actorForbiddenTraits: ['善良', '正直'],
      actorMinStress: 80, targetRequired: false,
    },
    success: {
      narrative: '{npcName}在四下无人时，将一包药粉倒进了井里。浑浊的井水看不出任何异样。{npcName}盯着井口看了很久，转身离去。',
      effects: { mood: -5, safety: -30 },
      memoryTag: '投毒',
      triggerChainReaction: 'well_poisoned',
    },
    failure: {
      narrative: '{npcName}刚掏出药包，就听到身后传来脚步声。赶紧把东西塞回袖子里，若无其事地走开了。',
      effects: { mood: -10, safety: -10 },
    },
  },
];
