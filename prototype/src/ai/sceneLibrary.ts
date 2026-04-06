// === 演出库 (Scene Library) — 参考《漫野奇谭》(Wildermyth) ===
//
// 核心设计：
// 1. 每个演出有严格的发起者条件(actor)和目标条件(target)
// 2. 没有符合条件的目标NPC在场时，演出不触发
// 3. 互动型演出有成功/失败分支，效果作用于双方
// 4. 三种判定类型: certain(确定) / contested(对抗) / chance(概率)

export type OutcomeType = 'certain' | 'contested' | 'chance';
export type GoalCategory = 'survival' | 'social' | 'work' | 'leisure' | 'family' | 'move' | 'conflict' | 'mischief' | 'trade' | 'romance' | 'nature' | 'spiritual' | 'creativity' | 'faction';

export interface SceneCondition {
  actorTraits: string[];
  actorForbiddenTraits: string[];
  actorProfession?: string[];
  actorMinCopper?: number;
  actorMaxCopper?: number;
  actorEmotion?: string;
  actorMinHealth?: number;
  targetRequired: boolean;
  targetTraits?: string[];
  targetProfession?: string[];
  targetMinCopper?: number;
  targetMaxCopper?: number;
  targetRelationType?: string;
  targetMinHealth?: number;
  location?: string[];
  timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk';
  weather?: string[];
  season?: string[];
}

export interface SceneOutcome {
  narrative: string;
  effects: Record<string, number>;
  targetEffects?: Record<string, number>;
  relationChange?: number;
}

export interface Scene {
  id: string;
  name: string;
  goalCategory: GoalCategory;
  outcomeType: OutcomeType;
  contestedStat?: { actor: string; target: string };
  successChance?: number;
  conditions: SceneCondition;
  success: SceneOutcome;
  failure?: SceneOutcome;
  weight: number;
  cooldownTicks: number;
}

export interface NearbyNpcInfo {
  id: number;
  name: string;
  profession: string;
  personality: string[];
  copper: number;
  health: number;
  relationScore: number;
  relationType: string;
}

// ──── 演出库数据 ────

const S: SceneCondition = { actorTraits: [], actorForbiddenTraits: [], targetRequired: false };

export const ALL_SCENES: Scene[] = [
  // ════════════════════════════════════════
  // SURVIVAL — 生存/觅食
  // ════════════════════════════════════════
  {
    id: 's_street_food', name: '街边小摊', goalCategory: 'survival', outcomeType: 'certain', weight: 8, cooldownTicks: 3,
    conditions: { ...S, actorMinCopper: 5 },
    success: { narrative: '{npcName}在街边小摊前停下脚步，买了两个热腾腾的炊饼，一口咬下去，外皮酥脆。', effects: { hunger: 25, mood: 3, copper: -5 } },
  },
  {
    id: 's_feast', name: '酒楼大餐', goalCategory: 'survival', outcomeType: 'certain', weight: 3, cooldownTicks: 10,
    conditions: { actorTraits: ['精明', '贪婪', '大方'], actorForbiddenTraits: [], actorMinCopper: 50, targetRequired: false, location: ['east_market'] },
    success: { narrative: '{npcName}推开酒楼的门，叫了一桌好菜。红烧肉肥瘦相间，糖醋鱼酸甜适口。吃得心满意足。', effects: { hunger: 45, mood: 18, copper: -25 } },
  },
  {
    id: 's_friend_meal', name: '找朋友蹭饭', goalCategory: 'survival', outcomeType: 'contested', weight: 4, cooldownTicks: 5,
    contestedStat: { actor: 'social', target: '吝啬' },
    conditions: { actorTraits: ['健谈', '大方'], actorForbiddenTraits: [], targetRequired: true, targetMinCopper: 10, targetRelationType: 'friend' },
    success: { narrative: '{npcName}笑嘻嘻地凑到{targetName}身边："吃了吗？没吃一起呗！"两人找了个路边摊坐下来。', effects: { hunger: 25, mood: 8 }, targetEffects: { hunger: 15, mood: 5, copper: -8 }, relationChange: 3 },
    failure: { narrative: '{npcName}凑上去想蹭饭，被{targetName}笑着推开了："今天手头紧，改天吧。"', effects: { mood: -3 }, relationChange: -1 },
  },
  {
    id: 's_steal_food', name: '偷食物', goalCategory: 'survival', outcomeType: 'contested', weight: 1, cooldownTicks: 8,
    contestedStat: { actor: 'cunning', target: 'alertness' },
    conditions: { actorTraits: ['狡猾', '暴躁'], actorForbiddenTraits: ['正直'], actorMaxCopper: 10, targetRequired: true, targetProfession: ['merchant', 'chef'], targetMinCopper: 10, location: ['east_market', 'west_market'] },
    success: { narrative: '{npcName}趁{targetName}转身的间隙，飞快地拿了一个炊饼塞进怀里。心跳如擂鼓，但脚步没停。', effects: { hunger: 20, mood: -5 }, targetEffects: { copper: -5, mood: -5 }, relationChange: -15 },
    failure: { narrative: '{npcName}的手刚伸出去，就被{targetName}一把抓住了。"抓小偷！"喊声立刻引来了周围的人。', effects: { mood: -15, safety: -20, health: -5 }, targetEffects: { mood: 5 }, relationChange: -20 },
  },
  {
    id: 's_shared_meal', name: '和人分食', goalCategory: 'survival', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    conditions: { actorTraits: ['善良', '大方'], actorForbiddenTraits: [], targetRequired: true },
    success: { narrative: '{npcName}把炊饼掰成两半，递了一半给{targetName}。"你也饿了吧？"两个人蹲在墙根吃了起来。', effects: { hunger: 10, mood: 10 }, targetEffects: { hunger: 15, mood: 8 }, relationChange: 8 },
  },
  {
    id: 's_beg', name: '乞讨', goalCategory: 'survival', outcomeType: 'contested', weight: 1, cooldownTicks: 8,
    contestedStat: { actor: 'pity', target: 'kindness' },
    conditions: { actorTraits: ['胆小'], actorForbiddenTraits: [], actorMaxCopper: 5, targetRequired: true, targetMinCopper: 10 },
    success: { narrative: '{npcName}低着头蹲在路边。{targetName}路过时掏出两文钱放进了破碗。"谢……谢谢。"', effects: { copper: 5, mood: -3 }, targetEffects: { copper: -2, mood: 3 }, relationChange: 2 },
    failure: { narrative: '{npcName}伸出的手被{targetName}视若无睹地走过去了。碗还是空的。', effects: { mood: -8 } },
  },
  {
    id: 's_temple_food', name: '寺庙施粥', goalCategory: 'survival', outcomeType: 'certain', weight: 5, cooldownTicks: 5,
    conditions: { actorTraits: ['善良', '胆小'], actorForbiddenTraits: [], actorMaxCopper: 15, targetRequired: false, location: ['temple'] },
    success: { narrative: '{npcName}端着一碗寺庙施的粥，蹲在台阶上喝。粥很稀，但热乎乎的。', effects: { hunger: 15, mood: 3, safety: 3 } },
  },
  {
    id: 's_go_hungry', name: '省一顿', goalCategory: 'survival', outcomeType: 'certain', weight: 3, cooldownTicks: 3,
    conditions: { actorTraits: ['勤劳', '吝啬'], actorForbiddenTraits: [], actorMaxCopper: 15, targetRequired: false },
    success: { narrative: '{npcName}摸了摸咕咕叫的肚子，咽了口唾沫。"忍忍吧，省一文是一文。"又低头干起活来。', effects: { hunger: -15, mood: -5, copper: 2 } },
  },

  // ════════════════════════════════════════
  // MISCHIEF — 坏事/偷窃
  // ════════════════════════════════════════
  {
    id: 'mi_pickpocket', name: '扒窃', goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'cunning', target: 'alertness' },
    conditions: { actorTraits: ['狡猾'], actorForbiddenTraits: ['正直'], actorMaxCopper: 30, targetRequired: true, targetMinCopper: 20 },
    success: { narrative: '{npcName}的手像蛇一样伸进了{targetName}的口袋。指尖触到铜钱的一刻，心跳猛地加速。得手了。', effects: { copper: 15, mood: 3, safety: -10 }, targetEffects: { copper: -15, mood: -8 }, relationChange: -15 },
    failure: { narrative: '{npcName}的手刚伸出去，{targetName}猛地回头，一把抓住了他的手腕。"抓小偷！"', effects: { mood: -15, safety: -25, health: -5 }, targetEffects: { mood: 5 }, relationChange: -25 },
  },
  {
    id: 'mi_con_game', name: '骗术', goalCategory: 'mischief', outcomeType: 'contested', weight: 2, cooldownTicks: 6,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    conditions: { actorTraits: ['狡猾', '机灵'], actorForbiddenTraits: ['正直', '善良'], targetRequired: true, targetTraits: ['善良', '胆小', '好奇'], targetMinCopper: 10 },
    success: { narrative: '{npcName}拉住{targetName}，神秘兮兮地说："兄台，我有批货急出手，便宜到你不敢信……"{targetName}掏出了铜钱。', effects: { copper: 15, mood: 5 }, targetEffects: { copper: -15, mood: -8 }, relationChange: -10 },
    failure: { narrative: '{targetName}上下打量了{npcName}一眼："这种把戏我见多了。"甩开手走了。', effects: { mood: -5 }, relationChange: -5 },
  },
  {
    id: 'mi_extort', name: '勒索', goalCategory: 'mischief', outcomeType: 'contested', weight: 1, cooldownTicks: 10,
    contestedStat: { actor: 'aggression', target: 'courage' },
    conditions: { actorTraits: ['暴躁', '狡猾'], actorForbiddenTraits: ['正直'], targetRequired: true, targetTraits: ['胆小', '温和'], targetMinCopper: 10 },
    success: { narrative: '{npcName}拦住{targetName}的去路："这路是我修的，想过得交点养路钱。"', effects: { copper: 10, mood: 3 }, targetEffects: { copper: -10, mood: -12, safety: -10 }, relationChange: -20 },
    failure: { narrative: '{targetName}非但没害怕，反而大喊："有人打劫！"{npcName}吓得赶紧跑了。', effects: { mood: -10, safety: -15 }, relationChange: -15 },
  },
  {
    id: 'mi_rob', name: '持械抢劫', goalCategory: 'mischief', outcomeType: 'contested', weight: 1, cooldownTicks: 15,
    contestedStat: { actor: 'bravery', target: 'courage' },
    conditions: { actorTraits: ['暴躁', '勇敢'], actorForbiddenTraits: ['正直', '善良'], actorMaxCopper: 20, targetRequired: true, targetMinCopper: 30, timeOfDay: 'night' },
    success: { narrative: '{npcName}从暗处跳出来，手里举着棍子。"把钱留下，人可以走！"', effects: { copper: 30, mood: 3, safety: -20 }, targetEffects: { copper: -30, mood: -20, safety: -20 }, relationChange: -30 },
    failure: { narrative: '{targetName}一脚踢飞了{npcName}的棍子，大喊："来人啊！"{npcName}转身就跑。', effects: { mood: -15, health: -10, safety: -25 }, relationChange: -25 },
  },
  {
    id: 'mi_spread_rumor', name: '散布谣言', goalCategory: 'mischief', outcomeType: 'contested', weight: 3, cooldownTicks: 5,
    contestedStat: { actor: 'eloquence', target: 'judgment' },
    conditions: { actorTraits: ['狡猾'], actorForbiddenTraits: ['正直'], targetRequired: true, targetTraits: ['好奇', '胆小'] },
    success: { narrative: '{npcName}凑到{targetName}耳边："你知道吗……"说着还四下张望了一圈。', effects: { mood: 5 }, targetEffects: { mood: -5 }, relationChange: -8 },
    failure: { narrative: '{targetName}听了两句就皱起了眉头："这种没影的事你也信？别传了。"', effects: { mood: -3 }, relationChange: -3 },
  },

  // ════════════════════════════════════════
  // CONFLICT — 冲突/暴力
  // ════════════════════════════════════════
  {
    id: 'c_street_fight', name: '街头打架', goalCategory: 'conflict', outcomeType: 'contested', weight: 3, cooldownTicks: 10,
    contestedStat: { actor: 'bravery', target: 'strength' },
    conditions: { actorTraits: ['暴躁', '勇敢'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'enemy' },
    success: { narrative: '{npcName}一拳砸在{targetName}脸上。围观的人炸了锅。尘土飞扬，{targetName}被打翻在地。', effects: { mood: 5, health: -5 }, targetEffects: { health: -15, mood: -10 }, relationChange: -20 },
    failure: { narrative: '{targetName}更快，一脚踹在{npcName}肚子上。踉跄倒退几步，撞翻了路边的水缸。', effects: { health: -15, mood: -10 }, targetEffects: { health: -3, mood: 3 }, relationChange: -20 },
  },
  {
    id: 'c_shout_match', name: '当街对骂', goalCategory: 'conflict', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    conditions: { actorTraits: ['暴躁'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'enemy' },
    success: { narrative: '{npcName}和{targetName}隔着三尺远，指头戳着对方的鼻子骂。唾沫星子飞出老远。', effects: { mood: 3, social: -5 }, targetEffects: { mood: -3, social: -5 }, relationChange: -10 },
  },
  {
    id: 'c_insult', name: '当众羞辱', goalCategory: 'conflict', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    conditions: { actorTraits: ['狡猾', '暴躁'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'enemy' },
    success: { narrative: '{npcName}当着众人的面冷笑道："有些人啊，脸皮比城墙还厚。"说完斜了{targetName}一眼。', effects: { mood: 3 }, targetEffects: { mood: -15, social: -5 }, relationChange: -15 },
  },
  {
    id: 'c_protect_weak', name: '挺身护弱', goalCategory: 'conflict', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'bravery', target: 'aggression' },
    conditions: { actorTraits: ['正直', '勇敢'], actorForbiddenTraits: [], targetRequired: true, targetTraits: ['暴躁'] },
    success: { narrative: '{npcName}挡在那个被欺负的人前面。"欺软怕硬算什么本事？"{targetName}嘟囔了几句走了。', effects: { mood: 8, safety: 3 }, relationChange: 5 },
    failure: { narrative: '{targetName}一拳就打在了{npcName}肩上："少管闲事！"', effects: { health: -8, mood: 3 }, relationChange: -10 },
  },
  {
    id: 'c_draw_weapon', name: '拔刀相向', goalCategory: 'conflict', outcomeType: 'contested', weight: 1, cooldownTicks: 20,
    contestedStat: { actor: 'bravery', target: 'bravery' },
    conditions: { actorTraits: ['勇敢', '暴躁'], actorForbiddenTraits: [], actorMinHealth: 40, targetRequired: true, targetRelationType: 'enemy', targetMinHealth: 40 },
    success: { narrative: '"呛"地一声拔出刀来。铁器出鞘的声音尖利刺耳，周围的人哗地往后退。鲜血淌了下来。', effects: { health: -10, mood: 3 }, targetEffects: { health: -25, mood: -10 }, relationChange: -30 },
    failure: { narrative: '{targetName}一脚踢在{npcName}手腕上，刀飞出去了。紧接着一拳砸在面门上。', effects: { health: -25, mood: -15 }, relationChange: -30 },
  },

  // ════════════════════════════════════════
  // SOCIAL — 社交
  // ════════════════════════════════════════
  {
    id: 'so_tea_chat', name: '茶楼闲谈', goalCategory: 'social', outcomeType: 'certain', weight: 7, cooldownTicks: 3,
    conditions: { actorTraits: ['健谈', '温和'], actorForbiddenTraits: [], actorMinCopper: 2, targetRequired: true, location: ['tea_house'] },
    success: { narrative: '{npcName}在茶楼里找了个位子坐下，和旁边的{targetName}聊了起来。从天气聊到粮价，从粮价聊到八卦。', effects: { social: 15, mood: 5, copper: -2 }, targetEffects: { social: 10, mood: 3 }, relationChange: 3 },
  },
  {
    id: 'so_drink_together', name: '对饮', goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    conditions: { actorTraits: ['大方', '暴躁'], actorForbiddenTraits: [], actorMinCopper: 10, targetRequired: true, targetRelationType: 'friend', location: ['east_market'] },
    success: { narrative: '{npcName}倒了两碗酒，推了一碗给{targetName}。"来。"碗碰碗，一饮而尽。', effects: { social: 10, mood: 8, copper: -5 }, targetEffects: { social: 8, mood: 5 }, relationChange: 5 },
  },
  {
    id: 'so_share_news', name: '分享消息', goalCategory: 'social', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    conditions: { actorTraits: ['健谈', '善良'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend' },
    success: { narrative: '{npcName}拉住{targetName}："你听说了吗？"两人站在路边，就着最新发生的事议论了好一阵。', effects: { social: 12, mood: 5 }, targetEffects: { social: 8, mood: 3 }, relationChange: 3 },
  },
  {
    id: 'so_help_carry', name: '帮人搬东西', goalCategory: 'social', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    conditions: { actorTraits: ['善良', '勤劳'], actorForbiddenTraits: [], targetRequired: true },
    success: { narrative: '{npcName}看见{targetName}扛着一大包东西，赶紧上前搭了把手。"来，我帮你扛这头。"', effects: { mood: 5, social: 5, fatigue: -3 }, targetEffects: { fatigue: 10, mood: 5 }, relationChange: 8 },
  },
  {
    id: 'so_quiet_walk', name: '默默同行', goalCategory: 'social', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    conditions: { actorTraits: ['沉默', '胆小'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend' },
    success: { narrative: '{npcName}和{targetName}并肩走着，谁也没说话。但两个人都没觉得不自在。', effects: { social: 10, mood: 3 }, targetEffects: { social: 8, mood: 3 }, relationChange: 2 },
  },

  // ════════════════════════════════════════
  // WORK — 工作
  // ════════════════════════════════════════
  {
    id: 'w_hard_sell', name: '热情叫卖', goalCategory: 'work', outcomeType: 'contested', weight: 7, cooldownTicks: 3,
    contestedStat: { actor: 'eloquence', target: 'wallet' },
    conditions: { actorTraits: ['勤劳', '健谈'], actorForbiddenTraits: [], actorProfession: ['merchant'], targetRequired: true, targetMinCopper: 10, location: ['east_market', 'west_market'] },
    success: { narrative: '{npcName}扯着嗓子吆喝，把自家货物的优点翻来覆去夸了个遍。{targetName}被吸引了过来，掏钱买了两件。', effects: { copper: 15, mood: 3, fatigue: -10 }, targetEffects: { copper: -10, mood: 3 }, relationChange: 2 },
    failure: { narrative: '{npcName}喊了半天，{targetName}看了一眼就走了。"太贵了。"', effects: { fatigue: -5, mood: -3 } },
  },
  {
    id: 'w_treat_patient', name: '坐堂看诊', goalCategory: 'work', outcomeType: 'contested', weight: 6, cooldownTicks: 4,
    contestedStat: { actor: 'medicine', target: 'disease' },
    conditions: { actorTraits: ['善良', '勤劳'], actorForbiddenTraits: [], actorProfession: ['doctor'], targetRequired: true, targetMinHealth: 50, location: ['east_market'] },
    success: { narrative: '{npcName}仔细地为{targetName}把了脉，开了方子。"按时服药，三日后再来复诊。"', effects: { copper: 20, mood: 5, fatigue: -10 }, targetEffects: { health: 15, mood: 5, copper: -10 }, relationChange: 5 },
    failure: { narrative: '{npcName}把了半天脉，眉头紧锁。"这病……不太好办。"', effects: { mood: -5 }, targetEffects: { mood: -8 }, relationChange: -3 },
  },
  {
    id: 'w_farm_work', name: '田里忙活', goalCategory: 'work', outcomeType: 'certain', weight: 7, cooldownTicks: 3,
    conditions: { actorTraits: ['勤劳', '善良'], actorForbiddenTraits: [], actorProfession: ['farmer'], targetRequired: false, location: ['east_farm', 'south_farm'] },
    success: { narrative: '{npcName}弯着腰在田里忙了一整天。日头毒辣，汗水湿透了衣裳，但看着庄稼的长势，心里踏实。', effects: { copper: 8, hunger: -15, fatigue: -20 } },
  },
  {
    id: 'w_patrol_duty', name: '认真巡逻', goalCategory: 'work', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    conditions: { actorTraits: ['正直', '勇敢'], actorForbiddenTraits: [], actorProfession: ['guard'], targetRequired: false },
    success: { narrative: '{npcName}沿着街巷一路巡查，目光如炬。街边的闲杂人等都收敛了几分。', effects: { copper: 8, mood: 3, safety: 5 } },
  },
  {
    id: 'w_hunt', name: '进山打猎', goalCategory: 'work', outcomeType: 'chance', weight: 6, cooldownTicks: 5, successChance: 0.5,
    conditions: { actorTraits: ['勇敢', '勤劳'], actorForbiddenTraits: [], actorProfession: ['hunter'], targetRequired: false, location: ['shallow_mountain', 'deep_mountain'] },
    success: { narrative: '{npcName}背着弓进了山。半日后回来时，肩上多了只野兔。"今天运气不错。"', effects: { copper: 12, hunger: -10, fatigue: -15 } },
    failure: { narrative: '{npcName}在山里转了一整天，连根兔子毛都没见到。背着空弓回来了。', effects: { hunger: -15, fatigue: -20, mood: -5 } },
  },

  // ════════════════════════════════════════
  // LEISURE — 休闲
  // ════════════════════════════════════════
  {
    id: 'l_tea_listen', name: '茶楼听书', goalCategory: 'leisure', outcomeType: 'certain', weight: 7, cooldownTicks: 4,
    conditions: { ...S, actorMinCopper: 2, location: ['tea_house'] },
    success: { narrative: '{npcName}在茶楼里叫了壶茶，听先生说书。说到精彩处，和满堂人一起拍手叫好。', effects: { mood: 10, fatigue: 5, copper: -2 } },
  },
  {
    id: 'l_chess_game', name: '和人下棋', goalCategory: 'leisure', outcomeType: 'contested', weight: 4, cooldownTicks: 4,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    conditions: { actorTraits: ['机灵', '精明'], actorForbiddenTraits: [], targetRequired: true, targetTraits: ['机灵', '精明', '勤劳'] },
    success: { narrative: '{npcName}和{targetName}摆开棋盘。两人你来我往，杀得难解难分。最后{npcName}险胜半子。', effects: { mood: 10, social: 8 }, targetEffects: { mood: -2, social: 5 }, relationChange: 3 },
    failure: { narrative: '{targetName}一步妙棋，{npcName}满盘皆输。"再来！"', effects: { mood: -2, social: 5 }, relationChange: 3 },
  },
  {
    id: 'l_nap', name: '午睡', goalCategory: 'leisure', outcomeType: 'certain', weight: 4, cooldownTicks: 5,
    conditions: { actorTraits: ['懒散'], actorForbiddenTraits: [], targetRequired: false, timeOfDay: 'day' },
    success: { narrative: '{npcName}找了一棵大树，靠着树根就睡了。蝉在头顶叫得欢，但丝毫不影响鼾声。', effects: { fatigue: 15, mood: 5 } },
  },
  {
    id: 'l_street_wander', name: '街上看热闹', goalCategory: 'leisure', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    conditions: { actorTraits: ['好奇', '健谈'], actorForbiddenTraits: [], targetRequired: false, location: ['east_market', 'center_street'] },
    success: { narrative: '{npcName}在街上东看看西看看。有人耍猴，有人变戏法，看了一圈，心情好多了。', effects: { mood: 8 } },
  },

  // ════════════════════════════════════════
  // TRADE — 交易
  // ════════════════════════════════════════
  {
    id: 't_haggle_hard', name: '狠砍价', goalCategory: 'trade', outcomeType: 'contested', weight: 6, cooldownTicks: 3,
    contestedStat: { actor: 'eloquence', target: 'cleverness' },
    conditions: { actorTraits: ['精明', '吝啬'], actorForbiddenTraits: [], actorMinCopper: 5, targetRequired: true, targetProfession: ['merchant'], targetMinCopper: 10, location: ['east_market', 'west_market'] },
    success: { narrative: '{npcName}拿起货看了看，眉头皱成一团。"这成色……五文，多一文不要。"', effects: { copper: 8, mood: 3 }, targetEffects: { copper: -8 }, relationChange: -2 },
    failure: { narrative: '两个人讨价还价了半个时辰，最后没谈拢。', effects: { mood: -2 } },
  },
  {
    id: 't_charity', name: '施舍穷人', goalCategory: 'trade', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    conditions: { actorTraits: ['善良', '大方'], actorForbiddenTraits: [], actorMinCopper: 20, targetRequired: true, targetMaxCopper: 10 },
    success: { narrative: '{npcName}把几个铜板放在那个乞讨的老人手里。"买碗热粥喝吧。"', effects: { copper: -5, mood: 8 }, targetEffects: { copper: 5, mood: 5 }, relationChange: 5 },
  },
  {
    id: 't_black_market', name: '黑市交易', goalCategory: 'trade', outcomeType: 'chance', weight: 1, cooldownTicks: 10, successChance: 0.6,
    conditions: { actorTraits: ['狡猾', '贪婪'], actorForbiddenTraits: ['正直'], targetRequired: false, timeOfDay: 'night' },
    success: { narrative: '{npcName}在城角的暗处和一个人碰了头。一个布包递过来，一袋铜钱递过去。全程没说一句话。', effects: { copper: 20, safety: -10 } },
    failure: { narrative: '对方没出现。{npcName}在暗处等了半天，白冻了一身。', effects: { mood: -5, safety: -5 } },
  },

  // ════════════════════════════════════════
  // MOVE — 移动
  // ════════════════════════════════════════
  {
    id: 'm_go_home_rest', name: '回家歇息', goalCategory: 'move', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    conditions: { ...S, timeOfDay: 'night' },
    success: { narrative: '{npcName}拖着疲惫的身子往家走。街上的灯火次第熄灭。推开家门的那一刻，终于松了口气。', effects: { fatigue: 20, mood: 3 } },
  },
  {
    id: 'm_night_market', name: '逛夜市', goalCategory: 'move', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    conditions: { actorTraits: ['好奇', '贪吃'], actorForbiddenTraits: [], targetRequired: false, timeOfDay: 'night', location: ['east_market', 'center_street'] },
    success: { narrative: '{npcName}混在夜市的人群里，左边是卖糖葫芦的，右边是变戏法的。灯火辉煌，热闹得像过年。', effects: { mood: 10, hunger: 5, copper: -3 } },
  },
  {
    id: 'm_visit_friend', name: '拜访友人', goalCategory: 'move', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    conditions: { actorTraits: ['健谈', '善良'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend' },
    success: { narrative: '{npcName}提着一包点心，拐进了{targetName}住的那条巷子。门一开，屋里飘出茶香。', effects: { social: 12, mood: 5, copper: -3 }, targetEffects: { social: 8, mood: 5 }, relationChange: 3 },
  },

  // ════════════════════════════════════════
  // FAMILY — 家庭
  // ════════════════════════════════════════
  {
    id: 'f_go_home', name: '回家陪伴', goalCategory: 'family', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    conditions: { actorTraits: ['温和', '善良'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}推开家门。屋里传来家人的声音。一天的疲惫好像都消散了。', effects: { mood: 15, fatigue: 10, hunger: 5 } },
  },
  {
    id: 'f_neighbor_chat', name: '和邻居闲话', goalCategory: 'family', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    conditions: { actorTraits: ['健谈', '好客'], actorForbiddenTraits: [], targetRequired: true },
    success: { narrative: '{npcName}站在门口和邻居拉起了家常。从东家长到西家短。不知不觉就聊了半个时辰。', effects: { social: 8, mood: 5 }, targetEffects: { social: 5 }, relationChange: 2 },
  },
  {
    id: 'f_child_play', name: '陪孩子玩', goalCategory: 'family', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    conditions: { actorTraits: ['温和', '善良'], actorForbiddenTraits: [], targetRequired: true },
    success: { narrative: '{npcName}把孩子举过头顶，转了一个圈。孩子咯咯笑个不停。"再来一次！"', effects: { mood: 15 }, targetEffects: { mood: 10 }, relationChange: 8 },
  },

  // ════════════════════════════════════════
  // ROMANCE — 感情
  // ════════════════════════════════════════
  {
    id: 'r_glance', name: '偷偷看一眼', goalCategory: 'romance', outcomeType: 'certain', weight: 4, cooldownTicks: 2,
    conditions: { ...S, targetRequired: true },
    success: { narrative: '{npcName}的目光不经意地落在{targetName}身上，又飞快地移开。心跳漏了一拍。', effects: { mood: 3 } },
  },
  {
    id: 'r_hold_hand', name: '牵手', goalCategory: 'romance', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'courage', target: 'shyness' },
    conditions: { actorTraits: ['勇敢'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'close_friend' },
    success: { narrative: '{npcName}鼓起全部勇气，握住了{targetName}的手。手心沁出了汗。但对方没有挣开。', effects: { mood: 12 }, targetEffects: { mood: 10 }, relationChange: 8 },
    failure: { narrative: '{npcName}刚伸出手，{targetName}就把手缩了回去。"你干什么？"', effects: { mood: -8 }, relationChange: -3 },
  },

  // ════════════════════════════════════════
  // NATURE — 自然
  // ════════════════════════════════════════
  {
    id: 'n_pick_herb', name: '山间采药', goalCategory: 'nature', outcomeType: 'chance', weight: 5, cooldownTicks: 5, successChance: 0.4,
    conditions: { actorTraits: ['勤劳', '善良'], actorForbiddenTraits: [], actorProfession: ['doctor'], targetRequired: false, location: ['shallow_mountain', 'deep_mountain'] },
    success: { narrative: '{npcName}蹲在岩石边上，小心翼翼地把一株草药连根拔起。叶子上还挂着露珠。', effects: { copper: 10, mood: 5 } },
    failure: { narrative: '找了一上午，一株像样的草药也没找到。', effects: { mood: -3, fatigue: -5 } },
  },
  {
    id: 'n_stargaze', name: '数星星', goalCategory: 'nature', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    conditions: { ...S, timeOfDay: 'night' },
    success: { narrative: '{npcName}躺在院子里，数着天上的星星。夜风凉凉的，蝉鸣阵阵。', effects: { mood: 10, fatigue: 5 } },
  },

  // ════════════════════════════════════════
  // SPIRITUAL — 精神/信仰
  // ════════════════════════════════════════
  {
    id: 'sp_pray_temple', name: '寺庙祈福', goalCategory: 'spiritual', outcomeType: 'certain', weight: 5, cooldownTicks: 5,
    conditions: { actorTraits: ['善良', '胆小'], actorForbiddenTraits: [], targetRequired: false, location: ['temple'] },
    success: { narrative: '{npcName}跪在蒲团上，双手合十。嘴唇微微翕动。额头抵着蒲团，好半天才直起身来。', effects: { mood: 10, safety: 8, copper: -2 } },
  },
  {
    id: 'sp_fortune', name: '求签问卜', goalCategory: 'spiritual', outcomeType: 'chance', weight: 4, cooldownTicks: 5, successChance: 0.5,
    conditions: { ...S, actorMinCopper: 3, location: ['temple'] },
    success: { narrative: '{npcName}摇了摇签筒，"哗啦"一声掉出一支签。捡起来一看——上上签。脸上绽开了笑容。', effects: { mood: 12, copper: -3 } },
    failure: { narrative: '签上写着——下下签。{npcName}的脸一下垮了。', effects: { mood: -10, copper: -3 } },
  },

  // ════════════════════════════════════════
  // CREATIVITY — 创造/学习
  // ════════════════════════════════════════
  {
    id: 'cr_calligraphy', name: '练字', goalCategory: 'creativity', outcomeType: 'certain', weight: 4, cooldownTicks: 3,
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], targetRequired: false },
    success: { narrative: '{npcName}铺开宣纸，蘸了墨，一笔一画地写。第三张纸才写出个像样的"永"字。', effects: { mood: 5, fatigue: -3 } },
  },
  {
    id: 'cr_teach', name: '教徒弟', goalCategory: 'creativity', outcomeType: 'contested', weight: 4, cooldownTicks: 4,
    contestedStat: { actor: 'patience', target: 'talent' },
    conditions: { actorTraits: ['勤劳', '善良'], actorForbiddenTraits: [], targetRequired: true, targetTraits: ['勤劳', '好奇'] },
    success: { narrative: '{npcName}手把手地教{targetName}。大手覆在小手上，一步一步地教。', effects: { mood: 5, fatigue: -3 }, targetEffects: { mood: 5 }, relationChange: 8 },
    failure: { narrative: '教了三遍，{targetName}还是不会。"算了，你先回去想想吧。"', effects: { mood: -3 }, relationChange: -2 },
  },

  // ════════════════════════════════════════
  // FACTION — 组织/派系
  // ════════════════════════════════════════
  {
    id: 'fa_secret_meeting', name: '秘密集会', goalCategory: 'faction', outcomeType: 'certain', weight: 2, cooldownTicks: 8,
    conditions: { actorTraits: ['狡猾', '勇敢'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend', timeOfDay: 'night' },
    success: { narrative: '{npcName}推开一间破屋的门，里面已经有几个人在等。蜡烛只点了一根。', effects: { mood: 3 }, targetEffects: { mood: 2 }, relationChange: 5 },
  },
  {
    id: 'fa_patrol_route', name: '按线巡逻', goalCategory: 'faction', outcomeType: 'certain', weight: 4, cooldownTicks: 3,
    conditions: { actorTraits: ['正直'], actorForbiddenTraits: [], actorProfession: ['guard'], targetRequired: false },
    success: { narrative: '{npcName}沿着固定路线一路巡查，逢巷必入。手里的棍子在地上敲得笃笃响。', effects: { safety: 8, copper: 5, fatigue: -5 } },
  },
];

// ──── 演出匹配与判定 ────

export interface SceneDecisionResult {
  sceneId: string;
  sceneName: string;
  goalCategory: string;
  narrative: string;
  success: boolean;
  effects: Record<string, number>;
  targetEffects?: Record<string, number>;
  relationChange?: number;
  targetName?: string;
  completedWhim?: { name: string; moodReward: number };
}

function matchesTrait(npcTraits: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some(t => npcTraits.includes(t));
}

function matchesRelation(relationType: string, required: string): boolean {
  if (!required || required === 'any') return true;
  if (required === 'friend') return ['friend', 'close_friend'].includes(relationType);
  if (required === 'enemy') return ['enemy'].includes(relationType);
  if (required === 'stranger') return ['stranger', 'acquaintance'].includes(relationType);
  return relationType === required;
}

function isDaytime(shichen: string): boolean {
  return ['辰', '巳', '午', '未', '申', '酉'].includes(shichen);
}

function isDawn(shichen: string): boolean {
  return ['寅', '卯'].includes(shichen);
}

function isDusk(shichen: string): boolean {
  return ['酉', '戌'].includes(shichen);
}

function checkTimeOfDay(shichen: string, required?: string): boolean {
  if (!required) return true;
  switch (required) {
    case 'day': return isDaytime(shichen);
    case 'night': return !isDaytime(shichen);
    case 'dawn': return isDawn(shichen);
    case 'dusk': return isDusk(shichen);
    default: return true;
  }
}

export function findMatchingScene(
  goalCategory: string,
  actorTraits: string[],
  actorProfession: string,
  actorCopper: number,
  actorHealth: number,
  actorEmotion: string,
  currentGrid: string,
  shichen: string,
  weather: string,
  season: string,
  nearbyNpcs: NearbyNpcInfo[],
  recentSceneIds: string[],
): { scene: Scene; target?: NearbyNpcInfo } | null {
  const candidates: { scene: Scene; target?: NearbyNpcInfo; score: number }[] = [];

  for (const scene of ALL_SCENES) {
    if (scene.goalCategory !== goalCategory) continue;

    // 冷却检查
    if (recentSceneIds.includes(scene.id)) continue;

    const cond = scene.conditions;

    // 发起者性格检查
    if (!matchesTrait(actorTraits, cond.actorTraits)) continue;
    if (cond.actorForbiddenTraits.some(t => actorTraits.includes(t))) continue;

    // 发起者职业检查
    if (cond.actorProfession && cond.actorProfession.length > 0 && !cond.actorProfession.includes(actorProfession)) continue;

    // 发起者铜钱检查
    if (cond.actorMinCopper !== undefined && actorCopper < cond.actorMinCopper) continue;
    if (cond.actorMaxCopper !== undefined && actorCopper > cond.actorMaxCopper) continue;

    // 发起者健康检查
    if (cond.actorMinHealth !== undefined && actorHealth < cond.actorMinHealth) continue;

    // 发起者情绪检查
    if (cond.actorEmotion && cond.actorEmotion !== actorEmotion) continue;

    // 地点检查
    if (cond.location && cond.location.length > 0 && !cond.location.includes(currentGrid)) continue;

    // 时段检查
    if (!checkTimeOfDay(shichen, cond.timeOfDay)) continue;

    // 天气检查
    if (cond.weather && cond.weather.length > 0 && !cond.weather.includes(weather)) continue;

    // 季节检查
    if (cond.season && cond.season.length > 0 && !cond.season.includes(season)) continue;

    // 目标NPC检查
    let target: NearbyNpcInfo | undefined;
    if (cond.targetRequired) {
      const matchingTarget = nearbyNpcs.find(npc => {
        if (cond.targetTraits && !matchesTrait(npc.personality, cond.targetTraits)) return false;
        if (cond.targetProfession && cond.targetProfession.length > 0 && !cond.targetProfession.includes(npc.profession)) return false;
        if (cond.targetMinCopper !== undefined && npc.copper < cond.targetMinCopper) return false;
        if (cond.targetMaxCopper !== undefined && npc.copper > cond.targetMaxCopper) return false;
        if (cond.targetRelationType && !matchesRelation(npc.relationType, cond.targetRelationType)) return false;
        if (cond.targetMinHealth !== undefined && npc.health < cond.targetMinHealth) return false;
        return true;
      });
      if (!matchingTarget) continue; // 没有符合条件的目标 → 跳过此演出
      target = matchingTarget;
    }

    candidates.push({ scene, target, score: scene.weight + Math.random() * 2 });
  }

  if (candidates.length === 0) return null;

  // 按权重排序，取top-3，随机选一个
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, Math.min(3, candidates.length));
  const chosen = top[Math.floor(Math.random() * top.length)];

  return { scene: chosen.scene, target: chosen.target };
}

export function resolveScene(scene: Scene, actorStats: Record<string, number>, targetStats?: Record<string, number>): boolean {
  switch (scene.outcomeType) {
    case 'certain':
      return true;
    case 'contested': {
      if (!scene.contestedStat || !targetStats) return true;
      const actorVal = (actorStats[scene.contestedStat.actor] as number) || 50;
      const targetVal = (targetStats[scene.contestedStat.target] as number) || 50;
      const successRate = actorVal / (actorVal + targetVal + 1);
      return Math.random() < successRate;
    }
    case 'chance':
      return Math.random() < (scene.successChance || 0.5);
    default:
      return true;
  }
}

export function formatNarrative(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  }
  return result;
}
