// === L0 精细场景 — 季节限定 (Seasonal) ===
// 新类别：只在特定季节/时间触发

import { L0Scene } from '../../../ai/sceneLibrary/types';

const S = { actorTraits: [] as string[], actorForbiddenTraits: [] as string[], targetRequired: false };

export const SEASONAL_SCENES: L0Scene[] = [
  {
    id: 'se_spring_festival', name: '春节庆典', description: '春节期间的热闹场景',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 5, cooldownTicks: 8,
    tags: ['seasonal', 'spring', 'festival'],
    conditions: { ...S, season: ['春'], minNearbyNpcs: 3 },
    success: { narrative: '爆竹声声，锣鼓喧天。{npcName}挤在人群里看舞龙，手里举着一串糖葫芦。四周都是笑脸，连空气里都飘着年味。', effects: { mood: 15, hunger: 5, social: 8 } },
  },
  {
    id: 'se_summer_heat_rest', name: '纳凉', description: '夏日酷暑中找阴凉',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    tags: ['seasonal', 'summer', 'rest'],
    conditions: { ...S, season: ['夏'], weather: ['晴', '晴朗'] },
    success: { narrative: '日头毒辣辣地晒着，{npcName}找了棵大槐树，往底下一躺。蒲扇摇啊摇，知了叫得人昏昏欲睡。', effects: { fatigue: 10, mood: 5 } },
  },
  {
    id: 'se_autumn_moon', name: '赏月', description: '中秋之夜赏月',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 5, cooldownTicks: 8,
    tags: ['seasonal', 'autumn', 'moon'],
    conditions: { actorTraits: ['温和', '善良'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend', season: ['秋'], timeOfDay: 'night' },
    success: { narrative: '月圆如盘，清辉洒满了院子。{npcName}和{targetName}并肩坐着，一人一块月饼，谁也没说话。月色太好了，不说话也觉得满足。', effects: { mood: 15, social: 8 }, targetEffects: { mood: 12, social: 5 }, relationChange: 5 },
  },
  {
    id: 'se_winter_shiver', name: '寒冬', description: '冬天里衣衫单薄瑟瑟发抖',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['seasonal', 'winter', 'hardship'],
    conditions: { ...S, actorMaxCopper: 10, season: ['冬'] },
    success: { narrative: '北风刀子一样割在脸上。{npcName}把衣裳裹紧了又裹紧，还是冷得直打哆嗦。呵出的白气还没散就结了霜。', effects: { mood: -8, health: -5, fatigue: -5 }, stressChange: 5 },
  },
  {
    id: 'se_new_year_feast', name: '年夜饭', description: '新年吃团圆饭',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 5, cooldownTicks: 10,
    tags: ['seasonal', 'spring', 'festival', 'family'],
    conditions: { ...S, actorMinCopper: 20, season: ['春'], minNearbyNpcs: 2 },
    success: { narrative: '桌上摆满了鸡鸭鱼肉，烛火把每个人的脸都映得红彤彤的。{npcName}举碗碰了一圈。"过年好！"笑声溢出了屋子。', effects: { mood: 20, hunger: 30, social: 10, copper: -15 } },
  },
  {
    id: 'se_lantern_festival', name: '元宵灯会', description: '元宵节赏花灯',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 5, cooldownTicks: 10,
    tags: ['seasonal', 'spring', 'festival', 'night'],
    conditions: { actorTraits: ['好奇', '健谈'], actorForbiddenTraits: [], targetRequired: true, season: ['春'], timeOfDay: 'night', minNearbyNpcs: 3 },
    success: { narrative: '满街都是花灯，兔子灯、鱼灯、莲花灯……{npcName}和{targetName}挤在人群里，东看看西看看，眼睛都不够使了。', effects: { mood: 15, social: 5, copper: -3 }, targetEffects: { mood: 12 }, relationChange: 3 },
  },
  {
    id: 'se_harvest_festival', name: '丰收祭', description: '秋天庆祝丰收',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 5, cooldownTicks: 8,
    tags: ['seasonal', 'autumn', 'festival', 'harvest'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], actorProfession: ['farmer'], targetRequired: false, season: ['秋'], location: ['east_farm', 'south_farm'] },
    success: { narrative: '金灿灿的谷子堆满了粮仓。{npcName}擦了一把汗，看着自家今年的收成，咧嘴笑了。"老天爷赏饭吃。"', effects: { mood: 15, copper: 15, hunger: 10 } },
  },
  {
    id: 'se_river_flood', name: '洪水担忧', description: '夏天暴雨担心河水泛滥',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 2, cooldownTicks: 8,
    tags: ['seasonal', 'summer', 'disaster'],
    conditions: { ...S, season: ['夏'], weather: ['暴雨', '大暴雨'], location: ['upstream', 'downstream', 'riverbank'] },
    success: { narrative: '河水又涨了一截。{npcName}站在岸边，脸色凝重。浑浊的河水翻涌着，裹挟着树枝和泥沙。再涨就要淹到田了。', effects: { mood: -10, safety: -15 }, stressChange: 10 },
  },
  {
    id: 'se_winter_store', name: '清点冬储', description: '入冬前检查储备',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 4, cooldownTicks: 6,
    tags: ['seasonal', 'winter', 'preparation'],
    conditions: { actorTraits: ['勤劳', '精明'], actorForbiddenTraits: [], targetRequired: false, season: ['冬'] },
    success: { narrative: '{npcName}把家里的粮袋一个个提起来掂了掂。又数了数盐罐和柴火。"还能撑两个月。"松了口气。', effects: { mood: 3, safety: 5 } },
  },
  {
    id: 'se_blossom_picnic', name: '赏花野餐', description: '春天约友赏花',
    goalCategory: 'seasonal', outcomeType: 'certain', weight: 4, cooldownTicks: 6,
    tags: ['seasonal', 'spring', 'social'],
    conditions: { actorTraits: ['大方', '温和'], actorForbiddenTraits: [], actorMinCopper: 10, targetRequired: true, targetRelationType: 'friend', season: ['春'], weather: ['晴', '晴朗'] },
    success: { narrative: '桃林深处，花瓣如雨。{npcName}铺了块布，摆上酒菜。和{targetName}碰了碰碗，不说话，光看着花笑。', effects: { mood: 15, social: 8, copper: -8 }, targetEffects: { mood: 12, social: 5 }, relationChange: 5 },
  },
];
