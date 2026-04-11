// === L0 精细场景 — 精神/信仰 (Spiritual) ===

import { L0Scene } from '../../../ai/sceneLibrary/types';

const S = { actorTraits: [] as string[], actorForbiddenTraits: [] as string[], targetRequired: false };

export const SPIRITUAL_SCENES: L0Scene[] = [
  // ── 迁移现有 ──
  {
    id: 'sp_pray_temple', name: '寺庙祈福', description: '在大相国寺跪拜祈福',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 5, cooldownTicks: 5,
    tags: ['spiritual', 'temple'],
    conditions: { actorTraits: ['善良', '胆小'], actorForbiddenTraits: [], targetRequired: false, location: ['temple'] },
    success: { narrative: '{npcName}跪在蒲团上，双手合十。嘴唇微微翕动。额头抵着蒲团，好半天才直起身来。', effects: { mood: 10, safety: 8, copper: -2 } },
  },
  {
    id: 'sp_fortune', name: '求签问卜', description: '抽签占卜吉凶',
    goalCategory: 'spiritual', outcomeType: 'chance', successChance: 0.5, weight: 4, cooldownTicks: 5,
    tags: ['spiritual', 'temple', 'chance'],
    conditions: { ...S, actorMinCopper: 3, location: ['temple'] },
    success: { narrative: '{npcName}摇了摇签筒，"哗啦"一声掉出一支签。捡起来一看——上上签。脸上绽开了笑容。', effects: { mood: 12, copper: -3 } },
    failure: { narrative: '签上写着——下下签。{npcName}的脸一下垮了。', effects: { mood: -10, copper: -3 } },
  },

  // ── 新增 ──
  {
    id: 'sp_incense_light', name: '点香', description: '在佛前上一炷香',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    tags: ['spiritual', 'temple'],
    conditions: { ...S, actorMinCopper: 2, location: ['temple'] },
    success: { narrative: '{npcName}从香案上取了三根香，在烛火上点燃。青烟袅袅升起，{npcName}闭上眼，双手合十。', effects: { mood: 8, safety: 5, copper: -2 } },
  },
  {
    id: 'sp_scripture_read', name: '读经', description: '在寺庙读经书',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['spiritual', 'temple', 'learning'],
    conditions: { actorTraits: ['善良', '温和'], actorForbiddenTraits: [], targetRequired: false, location: ['temple'] },
    success: { narrative: '{npcName}盘腿坐在经阁角落，翻开一卷经书。字字珠玑，读着读着，心就静了下来。', effects: { mood: 10, stressChange: -8 } },
  },
  {
    id: 'sp_meditate', name: '打坐冥想', description: '静坐调息',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    tags: ['spiritual', 'calm'],
    conditions: { actorTraits: ['温和'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}找了个安静的角落盘腿坐下，闭目调息。呼吸渐长，杂念渐消。再睁眼时，天色已经变了。', effects: { mood: 12, fatigue: 10, stressChange: -10 } },
  },
  {
    id: 'sp_monk_talk', name: '与僧人交谈', description: '向出家人请教',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['spiritual', 'temple', 'social'],
    conditions: { actorTraits: ['好奇'], actorForbiddenTraits: [], targetRequired: true, location: ['temple'] },
    success: { narrative: '{npcName}在廊下遇到一位老僧，攀谈起来。老僧说了句什么，{npcName}怔了半晌，若有所思地点了点头。', effects: { mood: 8, stressChange: -5 }, targetEffects: { mood: 3 }, relationChange: 3 },
  },
  {
    id: 'sp_vow_make', name: '许愿', description: '在佛前许下誓言',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 2, cooldownTicks: 10,
    tags: ['spiritual', 'temple'],
    conditions: { ...S, actorMinStress: 70, location: ['temple'] },
    success: { narrative: '{npcName}跪在佛前，重重地磕了三个头。"如果……就一定……"声音很小，但每一个字都很重。', effects: { mood: 5 }, stressChange: -15, memoryTag: '许愿' },
  },
  {
    id: 'sp_cleansing', name: '斋戒沐浴', description: '在寺庙进行净化仪式',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 2, cooldownTicks: 8,
    tags: ['spiritual', 'temple'],
    conditions: { ...S, actorMinCopper: 5, location: ['temple'] },
    success: { narrative: '{npcName}用寺里的井水净了手和脸，换上一件干净的衣裳。从外到内，都清清爽爽的。', effects: { mood: 10, fatigue: 5, copper: -5, stressChange: -5 } },
  },
  {
    id: 'sp_ancestor_pray', name: '祭拜祖先', description: '在家中祭拜先人',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['spiritual', 'family'],
    conditions: { actorTraits: ['正直'], actorForbiddenTraits: [], targetRequired: false, minNearbyNpcs: 1 },
    success: { narrative: '{npcName}在家中的牌位前摆上供果，点了三根香。"列祖列宗保佑……"低声说了几句家中的近况。', effects: { mood: 8, safety: 5 } },
  },
  {
    id: 'sp_gratitude', name: '感恩', description: '心怀感恩时默默致谢',
    goalCategory: 'spiritual', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['spiritual', 'positive'],
    conditions: { ...S, actorEmotion: 'happy' },
    success: { narrative: '{npcName}抬头看了看天，嘴角弯了起来。在心里默默地说了一声"谢谢"。也不知道是在谢谁。', effects: { mood: 5, safety: 3 } },
  },
];
