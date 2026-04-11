// === L0 精细场景 — 创造/学习 (Creativity) ===

import { L0Scene } from '../../../ai/sceneLibrary/types';

const S = { actorTraits: [] as string[], actorForbiddenTraits: [] as string[], targetRequired: false };

export const CREATIVITY_SCENES: L0Scene[] = [
  // ── 迁移现有 ──
  {
    id: 'cr_calligraphy', name: '练字', description: '练习书法',
    goalCategory: 'creativity', outcomeType: 'certain', weight: 4, cooldownTicks: 3,
    tags: ['creativity', 'learning'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}铺开宣纸，蘸了墨，一笔一画地写。第三张纸才写出个像样的"永"字。', effects: { mood: 5, fatigue: -3 } },
  },
  {
    id: 'cr_teach', name: '教徒弟', description: '手把手教导学徒',
    goalCategory: 'creativity', outcomeType: 'contested', weight: 4, cooldownTicks: 4,
    contestedStat: { actor: 'patience', target: 'talent' },
    tags: ['creativity', 'social', 'teaching'],
    conditions: { actorTraits: ['勤劳', '善良'], actorForbiddenTraits: [], targetRequired: true, targetTraits: ['勤劳', '好奇'] },
    success: { narrative: '{npcName}手把手地教{targetName}。大手覆在小手上，一步一步地教。', effects: { mood: 5, fatigue: -3 }, targetEffects: { mood: 5 }, relationChange: 8 },
    failure: { narrative: '教了三遍，{targetName}还是不会。"算了，你先回去想想吧。"', effects: { mood: -3 }, relationChange: -2 },
  },

  // ── 新增 ──
  {
    id: 'cr_paint', name: '绘画', description: '画一幅画',
    goalCategory: 'creativity', outcomeType: 'certain', weight: 3, cooldownTicks: 4,
    tags: ['creativity', 'art'],
    conditions: { actorTraits: ['善良', '勤劳'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}铺开绢帛，提笔蘸墨。远山近水，一笔一景。画到兴头上，连时辰都忘了。', effects: { mood: 12, fatigue: -5 } },
  },
  {
    id: 'cr_poetry_write', name: '写诗', description: '独自吟诗',
    goalCategory: 'creativity', outcomeType: 'certain', weight: 3, cooldownTicks: 4,
    tags: ['creativity', 'art'],
    conditions: { actorTraits: ['温和'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}踱着步，嘴里念念有词。忽然停住脚步，快步走到桌前，提笔写下两句诗。自己读了一遍，满意地点了点头。', effects: { mood: 10 } },
  },
  {
    id: 'cr_song_compose', name: '作曲', description: '哼一段新曲子',
    goalCategory: 'creativity', outcomeType: 'certain', weight: 2, cooldownTicks: 5,
    tags: ['creativity', 'music'],
    conditions: { actorTraits: ['健谈', '机灵'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}哼着一段谁也没听过的调子。哼到一半停下来，摇摇头，换了个节拍重新来过。嘴角的笑意怎么也压不住。', effects: { mood: 10 } },
  },
  {
    id: 'cr_wood_carve', name: '木雕', description: '雕刻木头',
    goalCategory: 'creativity', outcomeType: 'certain', weight: 3, cooldownTicks: 4,
    tags: ['creativity', 'craft'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}拿着小刀，一刀一刀地在木头上刻着。木屑纷飞，一只小鸟的轮廓渐渐显现出来。', effects: { mood: 8, fatigue: -3 } },
  },
  {
    id: 'cr_invent_gadget', name: '做小机关', description: '制作奇巧小装置',
    goalCategory: 'creativity', outcomeType: 'chance', successChance: 0.4, weight: 2, cooldownTicks: 6,
    tags: ['creativity', 'craft'],
    conditions: { actorTraits: ['机灵', '勤劳'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}捣鼓了半天，手里的木头机关"咔哒"一声弹开了。眼睛一亮，拍着大腿说："成了！"', effects: { mood: 15, copper: 5 } },
    failure: { narrative: '捣鼓了半天，"啪"一声散了架。{npcName}看着一地的零件，叹了口气。', effects: { mood: -3, fatigue: -5 } },
  },
  {
    id: 'cr_recipe_create', name: '研创菜谱', description: '尝试新菜式',
    goalCategory: 'creativity', outcomeType: 'chance', successChance: 0.5, weight: 3, cooldownTicks: 5,
    tags: ['creativity', 'cooking'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], actorProfession: ['chef'], targetRequired: false },
    success: { narrative: '{npcName}往锅里加了一小撮从未试过的香料。揭盖一闻——好香！尝了一口，连连点头。"就是这个味儿！"', effects: { mood: 12, copper: 8 } },
    failure: { narrative: '{npcName}满怀期待地尝了一口自己新创的菜，脸色一变，赶紧吐了出来。"这不行……"', effects: { mood: -5, hunger: -5 } },
  },
  {
    id: 'cr_joke_tell', name: '讲笑话', description: '给人讲笑话逗乐',
    goalCategory: 'creativity', outcomeType: 'contested', weight: 4, cooldownTicks: 3,
    contestedStat: { actor: 'eloquence', target: 'judgment' },
    tags: ['creativity', 'social', 'humor'],
    conditions: { actorTraits: ['健谈', '机灵'], actorForbiddenTraits: [], targetRequired: true },
    success: { narrative: '{npcName}讲了个笑话。{targetName}先是一愣，然后噗嗤笑了出来。笑得停不下来，弯着腰直拍大腿。', effects: { mood: 8 }, targetEffects: { mood: 10 }, relationChange: 5 },
    failure: { narrative: '{npcName}讲了个笑话。{targetName}面无表情地看了一眼。"……哪里好笑了？"', effects: { mood: -5 }, relationChange: -2 },
  },
  {
    id: 'cr_dance', name: '起舞', description: '高兴时翩翩起舞',
    goalCategory: 'creativity', outcomeType: 'certain', weight: 2, cooldownTicks: 5,
    tags: ['creativity', 'joyful'],
    conditions: { actorTraits: ['大方'], actorForbiddenTraits: [], targetRequired: false, actorEmotion: 'happy', minNearbyNpcs: 2 },
    success: { narrative: '{npcName}不知为何高兴得很，竟在原地转了个圈。衣袂飞扬，脚步轻快。旁人看了一眼，也忍不住跟着笑了。', effects: { mood: 10 } },
  },
];
