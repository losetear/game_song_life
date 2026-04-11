// === L0 精细场景 — 自然 (Nature) ===

import { L0Scene } from '../../../ai/sceneLibrary/types';

const S = { actorTraits: [] as string[], actorForbiddenTraits: [] as string[], targetRequired: false };

export const NATURE_SCENES: L0Scene[] = [
  // ── 迁移现有 ──
  {
    id: 'n_pick_herb', name: '山间采药', description: '大夫进山采药',
    goalCategory: 'nature', outcomeType: 'chance', successChance: 0.4, weight: 5, cooldownTicks: 5,
    tags: ['nature', 'work'],
    conditions: { ...S, actorTraits: ['勤劳', '善良'], actorProfession: ['doctor'], location: ['shallow_mountain', 'deep_mountain'] },
    success: { narrative: '{npcName}蹲在岩石边上，小心翼翼地把一株草药连根拔起。叶子上还挂着露珠。', effects: { copper: 10, mood: 5 } },
    failure: { narrative: '找了一上午，一株像样的草药也没找到。', effects: { mood: -3, fatigue: -5 } },
  },
  {
    id: 'n_stargaze', name: '数星星', description: '夜里仰望星空',
    goalCategory: 'nature', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['nature', 'night'],
    conditions: { ...S, timeOfDay: 'night' },
    success: { narrative: '{npcName}躺在院子里，数着天上的星星。夜风凉凉的，蝉鸣阵阵。', effects: { mood: 10, fatigue: 5 } },
  },

  // ── 新增 ──
  {
    id: 'n_sunrise_watch', name: '观日出', description: '清晨登山看日出',
    goalCategory: 'nature', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['nature', 'dawn'],
    conditions: { actorTraits: ['勤劳', '勇敢'], actorForbiddenTraits: [], targetRequired: false, timeOfDay: 'dawn', location: ['shallow_mountain'] },
    success: { narrative: '{npcName}站在山顶，看着东方的天际从墨黑变成鱼肚白。一缕金光刺破云层，整个天地都被染红了。', effects: { mood: 15, fatigue: 5 } },
  },
  {
    id: 'n_rain_listen', name: '听雨', description: '雨天听雨声发呆',
    goalCategory: 'nature', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['nature', 'weather'],
    conditions: { actorTraits: ['温和'], actorForbiddenTraits: [], targetRequired: false, weather: ['小雨', '雨'] },
    success: { narrative: '{npcName}靠在窗边，听檐上的雨声。滴滴答答，打在芭蕉叶上格外好听。整个人都静了下来。', effects: { mood: 8, stressChange: -5 } },
  },
  {
    id: 'n_snow_catch', name: '接雪花', description: '冬日接雪花玩',
    goalCategory: 'nature', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['nature', 'winter', 'playful'],
    conditions: { ...S, season: ['冬'], weather: ['雪'] },
    success: { narrative: '{npcName}伸出手掌，一片雪花落在掌心，还没来得及看清就化了。忍不住又伸出手去接。', effects: { mood: 10 } },
  },
  {
    id: 'n_river_skip_stone', name: '打水漂', description: '在河边打水漂',
    goalCategory: 'nature', outcomeType: 'certain', weight: 3, cooldownTicks: 4,
    tags: ['nature', 'river'],
    conditions: { ...S, location: ['upstream', 'downstream', 'riverbank', 'stream'] },
    success: { narrative: '{npcName}捡起一块扁石子，侧着身子往水面一甩。石子在水面上跳了三下，荡出一串涟漪。', effects: { mood: 8 } },
  },
  {
    id: 'n_tree_climb', name: '爬树', description: '爬到树上远眺',
    goalCategory: 'nature', outcomeType: 'chance', successChance: 0.7, weight: 2, cooldownTicks: 6,
    tags: ['nature', 'adventure'],
    conditions: { actorTraits: ['勇敢'], actorForbiddenTraits: [], targetRequired: false, location: ['shallow_mountain', 'forest_edge'] },
    success: { narrative: '{npcName}三两下就攀上了一棵老槐树的枝头。风从耳畔吹过，远处的汴河如一条银线。', effects: { mood: 10 } },
    failure: { narrative: '{npcName}刚爬了半截，脚底一滑摔了下来。好在不高，只是蹭破了点皮。', effects: { health: -5, mood: -3 } },
  },
  {
    id: 'n_herb_identify', name: '辨认草药', description: '在山中识别草药',
    goalCategory: 'nature', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['nature', 'work'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], actorProfession: ['doctor'], targetRequired: false, location: ['shallow_mountain', 'deep_mountain'] },
    success: { narrative: '{npcName}蹲在一丛草前，摘下一片叶子搓了搓，凑到鼻子底下闻。"是金银花。"小心地整株挖了出来。', effects: { copper: 5, mood: 5 } },
  },
  {
    id: 'n_animal_track', name: '追踪兽迹', description: '追踪山中的动物脚印',
    goalCategory: 'nature', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['nature', 'work'],
    conditions: { actorTraits: ['勤劳', '勇敢'], actorForbiddenTraits: [], actorProfession: ['hunter'], targetRequired: false, location: ['shallow_mountain', 'deep_mountain'] },
    success: { narrative: '{npcName}蹲在地上辨认着泥地上的蹄印。新鲜的，朝北去了。他猫着腰跟了上去。', effects: { mood: 5, copper: 3 } },
  },
  {
    id: 'n_spring_bloom', name: '赏春花', description: '春天欣赏花开',
    goalCategory: 'nature', outcomeType: 'certain', weight: 5, cooldownTicks: 6,
    tags: ['nature', 'spring'],
    conditions: { actorTraits: ['善良'], actorForbiddenTraits: [], targetRequired: false, season: ['春'] },
    success: { narrative: '路边的一株桃花开得正盛。{npcName}停下脚步，深吸一口气。花瓣被风吹得纷纷扬扬，像下了一场粉色的雪。', effects: { mood: 12 } },
  },
  {
    id: 'n_autumn_leaf', name: '赏秋叶', description: '秋天赏红叶',
    goalCategory: 'nature', outcomeType: 'certain', weight: 4, cooldownTicks: 6,
    tags: ['nature', 'autumn'],
    conditions: { ...S, season: ['秋'] },
    success: { narrative: '{npcName}踩着满地的黄叶往前走。脚底发出沙沙的声响。一片红叶打着旋飘落在肩上。', effects: { mood: 10 } },
  },
  {
    id: 'n_thunder_storm', name: '观雷暴', description: '勇敢者在暴雨中看雷电',
    goalCategory: 'nature', outcomeType: 'certain', weight: 2, cooldownTicks: 8,
    tags: ['nature', 'weather', 'brave'],
    conditions: { actorTraits: ['勇敢'], actorForbiddenTraits: [], targetRequired: false, weather: ['暴雨', '大暴雨'] },
    success: { narrative: '一道闪电劈开了天幕，紧接着是震耳欲聋的雷声。{npcName}站在屋檐下，眼睛亮得吓人。"好大的雷！"', effects: { mood: 5, safety: -3 } },
  },
];
