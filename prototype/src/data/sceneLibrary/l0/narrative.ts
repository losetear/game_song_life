// ════════════════════════════════════════
// L0 叙事驱动场景（漫野奇谭化）
//
// 这些场景依赖叙事标签（narrativeTags）触发，
// 体现"前文影响后文"的人物驱动涌现叙事。
// ════════════════════════════════════════

import { L0Scene } from '../../../ai/sceneLibrary/types';

export const NARRATIVE_DRIVEN_SCENES: L0Scene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 旧伤复发 — 要求 scarred 标签
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_old_wound',
    name: '旧伤复发',
    description: '曾经的伤疤在天阴时隐隐作痛，唤起当时的记忆',
    goalCategory: 'survival',
    outcomeType: 'certain',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: [],
      requiredNarrativeTags: ['scarred'],
      targetRequired: false,
      weather: ['小雨', '暴雨', '阴'],
    },
    success: {
      narrative: '{npcName}的手不自觉地摸向脖子上的伤疤。{if hasTag:刀伤惨胜}那是上次持刀相向时留下的——赢了，但代价不轻。{/if}{if hasTag:被缴械}那次被人拿刀架在脖子上的屈辱，至今刻在皮肉里。{/if}阴天总是让它隐隐作痛，像是在提醒什么。',
      effects: { health: -5, mood: -8 },
      stressChange: 5,
      memoryTag: '旧伤发作',
    },
    weight: 5,
    cooldownTicks: 15,
    priority: 3,
    tags: ['scarred', 'survival', 'memory'],
    narrativeWeight: 'minor',
  },

  // ══════════════════════════════════════════════════════════════════
  // 伤疤引来的注目 — 要求 scarred 标签，有目标NPC
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_scar_stared',
    name: '伤疤引人注目',
    description: '别人注意到你脸上的伤疤，目光复杂',
    goalCategory: 'social',
    outcomeType: 'certain',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: [],
      requiredNarrativeTags: ['scarred'],
      targetRequired: true,
      location: ['east_market', 'west_market', 'center_street'],
    },
    success: {
      narrative: '{targetName}的目光在{npcName}脸上停留了一瞬——那道疤太显眼了。{npcName}注意到了这道目光，下意识地偏了偏头。{targetName}连忙收回视线，装作在看别处。',
      effects: { mood: -3, social: 2 },
      relationChange: 2,
    },
    weight: 4,
    cooldownTicks: 10,
    tags: ['scarred', 'social', 'memory'],
    narrativeWeight: 'flavor',
  },

  // ══════════════════════════════════════════════════════════════════
  // 复仇追杀 — 要求 被攻击 或 被缴械 标签
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_revenge_stalk',
    name: '暗中跟踪',
    description: '曾经被攻击/羞辱的人暗中尾随仇人，伺机报复',
    goalCategory: 'conflict',
    outcomeType: 'contested',
    contestedStat: { actor: 'cunning', target: 'alertness' },
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: ['善良', '温和'],
      requiredAnyNarrativeTags: ['被攻击', '被缴械', '被侮辱', '被羞辱'],
      targetRequired: true,
      targetRelationType: 'enemy',
      timeOfDay: 'night',
    },
    success: {
      narrative: '月色昏暗。{npcName}在{targetName}身后远远跟着，脚步压得极低。旧恨在心头燃烧——{if hasTag:被缴械}脖子上的疤还在发痒。{/if}就是今夜了。{npcName}攥紧了手中的木棍。',
      effects: { mood: 5 },
      relationChange: -5,
      memoryTag: '暗中跟踪',
    },
    failure: {
      narrative: '{npcName}试图跟踪{targetName}，但走了两条街就跟丢了。夜风吹得浑身发冷，心中的恨意却更加炽热。"下次……"{npcName}低声自语。',
      effects: { mood: -3, fatigue: -5 },
    },
    weight: 3,
    cooldownTicks: 20,
    priority: 7,
    tags: ['revenge', 'conflict', 'night'],
    narrativeWeight: 'major',
  },

  // ══════════════════════════════════════════════════════════════════
  // 受恩图报 — 要求 受恩 标签
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_repay_kindness',
    name: '报恩之心',
    description: '曾受人恩惠，现在找到机会回报',
    goalCategory: 'social',
    outcomeType: 'certain',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: ['吝啬'],
      requiredNarrativeTags: ['受恩'],
      targetRequired: true,
      targetRelationType: 'friend',
    },
    success: {
      narrative: '{npcName}看到{targetName}的摊位上客人稀少，想起了之前落难时{targetName}帮过自己一把。二话不说走上前去，买了好几样东西，还多给了些铜钱。{targetName}愣了一下，然后笑了。',
      effects: { mood: 8, copper: -5, social: 5 },
      relationChange: 8,
      transformations: [
        { type: 'lose_narrative_tag', value: '受恩', description: '恩情报答，心中的欠条撕了' },
        { type: 'gain_narrative_tag', value: '报恩', description: '{npcName}知恩图报，名声渐起' },
      ],
    },
    weight: 6,
    cooldownTicks: 15,
    tags: ['gratitude', 'social', 'memory'],
    narrativeWeight: 'minor',
  },

  // ══════════════════════════════════════════════════════════════════
  // 浪子回头 — 要求 偷窃 标签 + 善良性格
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_reformed_thief',
    name: '浪子回头',
    description: '曾经偷窃过的人决定改过自新，把偷来的东西还回去',
    goalCategory: 'social',
    outcomeType: 'chance',
    successChance: 0.6,
    conditions: {
      actorTraits: ['善良', '正直'],
      actorForbiddenTraits: [],
      requiredNarrativeTags: ['偷窃'],
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}攥着那包东西，在{targetName}门前站了很久。最终还是敲了门。"这个……是你的。"声音很低，但手没有抖。{targetName}接过包裹，看着{npcName}的眼睛，沉默了一会儿，然后说："进来喝杯茶吧。"',
      effects: { mood: 15, social: 10 },
      relationChange: 15,
      transformations: [
        { type: 'lose_narrative_tag', value: '偷窃', description: '{npcName}归还了赃物，洗清了污名' },
        { type: 'gain_narrative_tag', value: 'reformed', description: '{npcName}改过自新，获得新生' },
      ],
    },
    failure: {
      narrative: '{npcName}鼓起勇气敲了门，但{targetName}看到包裹后脸色大变。"原来是你偷的！"门砰地关上了。{npcName}站在门外，手里的包裹沉甸甸的。想回头，没回成。',
      effects: { mood: -10, social: -5 },
      relationChange: -10,
    },
    weight: 2,
    cooldownTicks: 30,
    priority: 9,
    tags: ['redemption', 'social', 'memory'],
    narrativeWeight: 'milestone',
  },

  // ══════════════════════════════════════════════════════════════════
  // 决斗者的名声 — 要求 决斗胜利 标签
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_duelist_fame',
    name: '决斗者的名声',
    description: '曾在决斗中获胜的人被旁人认出，引发议论',
    goalCategory: 'social',
    outcomeType: 'certain',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: [],
      requiredAnyNarrativeTags: ['决斗胜利', '刀伤惨胜', '完胜街头打架'],
      targetRequired: true,
      location: ['east_market', 'west_market', 'tea_house'],
      minNearbyNpcs: 3,
    },
    success: {
      narrative: '"那不是{npcName}吗？"有人低声议论。"听说在城外决斗，一个人打赢了——""嘘，小声点，人家听到了。"{targetName}好奇地打量着{npcName}，眼中带着几分敬畏。{npcName}感受到周围的目光，不动声色地端起茶碗。',
      effects: { mood: 3, social: 5 },
      relationChange: 3,
    },
    weight: 4,
    cooldownTicks: 12,
    tags: ['reputation', 'social', 'memory'],
    narrativeWeight: 'minor',
  },

  // ══════════════════════════════════════════════════════════════════
  // 屡败者低头 — 要求 被打/惨败街头 标签
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_defeated_humbled',
    name: '败者的隐忍',
    description: '被打败过的人在街头遇到仇人，选择低头',
    goalCategory: 'social',
    outcomeType: 'certain',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: ['勇敢', '暴躁'],
      requiredAnyNarrativeTags: ['被打', '惨败街头', '被缴械'],
      targetRequired: true,
      targetRelationType: 'enemy',
    },
    success: {
      narrative: '{npcName}远远看到{targetName}走过来，脚步顿了顿。{if hasTag:被缴械}脖子上的疤在提醒着那次的屈辱。{/if}低着头，加快脚步从旁边绕了过去。身后传来{targetName}的笑声。{npcName}的手攥紧了，又慢慢松开。',
      effects: { mood: -5 },
      relationChange: -2,
      stressChange: 5,
    },
    weight: 4,
    cooldownTicks: 10,
    tags: ['defeat', 'social', 'memory'],
    narrativeWeight: 'flavor',
  },

  // ══════════════════════════════════════════════════════════════════
  // 以暴制暴 — 要求 被攻击 标签 + 暴躁性格，对同一敌人
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_violent_payback',
    name: '以牙还牙',
    description: '曾被攻击的暴躁之人再次遇到仇人，新仇旧恨一起算',
    goalCategory: 'conflict',
    outcomeType: 'multi_contested',
    contestedStat: { actor: 'aggression', target: 'strength' },
    conditions: {
      actorTraits: ['暴躁'],
      actorForbiddenTraits: [],
      requiredNarrativeTags: ['被攻击'],
      targetRequired: true,
      targetRelationType: 'enemy',
    },
    success: {
      narrative: '{npcName}在街上撞见了{targetName}，旧恨涌上心头。不废话，直接一拳砸了过去。"上次你打我，这次轮到我了！"',
      effects: { mood: 10, health: -5 },
      targetEffects: { health: -12, mood: -8 },
      relationChange: -15,
      memoryTag: '以牙还牙',
      transformations: [
        { type: 'lose_narrative_tag', value: '被攻击', description: '新仇已报' },
      ],
    },
    failure: {
      narrative: '{npcName}冲上去想揍{targetName}，但被旁边的人拉住了。"别打了！"人多势众，{npcName}挣不开。{targetName}冷笑着走了。恨意更浓了。',
      effects: { mood: -10, health: -3 },
      relationChange: -10,
    },
    resolution: {
      type: 'multi_contested',
      multiContested: {
        actorStats: [
          { stat: 'aggression', weight: 1.2 },
          { stat: 'strength', weight: 0.8 },
        ],
        targetStats: [
          { stat: 'strength', weight: 1.0 },
          { stat: 'agility', weight: 0.5 },
        ],
        modifiers: [
          { condition: { field: 'actorEmotion', op: 'includes', value: 'angry' }, bonus: 15 },
        ],
      },
    },
    tieredOutcomes: [
      {
        minScore: 80,
        tier: 'success',
        outcome: {
          narrative: '{npcName}在街上撞见了{targetName}，旧恨涌上心头。不废话，直接一拳砸了过去。"上次你打我，这次轮到我了！"{targetName}被打翻在地，鼻血直流。围观的人议论纷纷，但没人同情{targetName}。',
          effects: { mood: 12, health: -3 },
          targetEffects: { health: -15, mood: -12, social: -5 },
          relationChange: -20,
          memoryTag: '以牙还牙',
          transformations: [
            { type: 'lose_narrative_tag', value: '被攻击', description: '新仇已报' },
          ],
        },
      },
      {
        minScore: 40,
        tier: 'partial_success',
        outcome: {
          narrative: '{npcName}看到{targetName}就走过去推了一把。两人扭打在一起，互相给了对方几拳。旧伤未好又添新伤，但这口气总算是出了一半。',
          effects: { mood: 5, health: -8 },
          targetEffects: { health: -8, mood: -5 },
          relationChange: -15,
          memoryTag: '互殴',
          transformations: [
            { type: 'lose_narrative_tag', value: '被攻击', description: '互殴一场，恩怨暂了' },
          ],
        },
      },
      {
        minScore: 0,
        tier: 'failure',
        outcome: {
          narrative: '{npcName}冲上去想揍{targetName}，但被旁边的人拉住了。"别打了！"人多势众，{npcName}挣不开。{targetName}冷笑着走了。恨意更浓了。',
          effects: { mood: -10, health: -3 },
          relationChange: -10,
          memoryTag: '复仇未遂',
        },
      },
    ],
    weight: 3,
    cooldownTicks: 15,
    priority: 6,
    tags: ['revenge', 'conflict', 'memory'],
    narrativeWeight: 'major',
  },

  // ══════════════════════════════════════════════════════════════════
  // 改过者的新机会 — 要求 reformed 标签
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'n_reformed_opportunity',
    name: '新的人生',
    description: '改过自新后获得新的机会，旁人愿意给予信任',
    goalCategory: 'work',
    outcomeType: 'certain',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: [],
      requiredNarrativeTags: ['reformed'],
      targetRequired: true,
      targetRelationType: 'friend',
    },
    success: {
      narrative: '{targetName}在街边摆了个小摊，看到{npcName}走过来，招了招手。"上次你把东西还给我，我记着呢。我这儿正缺人手，你愿不愿意帮忙？工钱不多，但管饭。"{npcName}愣了好一会儿，然后用力点了点头。',
      effects: { mood: 15, copper: 3, social: 8 },
      relationChange: 10,
      transformations: [
        { type: 'gain_narrative_tag', value: '受恩', description: '{npcName}获得新的工作机会' },
      ],
    },
    weight: 3,
    cooldownTicks: 30,
    tags: ['redemption', 'work', 'memory'],
    narrativeWeight: 'milestone',
  },
];
