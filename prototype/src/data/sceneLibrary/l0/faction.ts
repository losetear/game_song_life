// === L0 精细场景 — 组织/派系 (Faction) ===

import { L0Scene } from '../../../ai/sceneLibrary/types';

const S = { actorTraits: [] as string[], actorForbiddenTraits: [] as string[], targetRequired: false };

export const FACTION_SCENES: L0Scene[] = [
  // ── 迁移现有 ──
  {
    id: 'fa_secret_meeting', name: '秘密集会', description: '夜间秘密集会',
    goalCategory: 'faction', outcomeType: 'certain', weight: 2, cooldownTicks: 8,
    tags: ['faction', 'night', 'secret'],
    conditions: { actorTraits: ['狡猾', '勇敢'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend', timeOfDay: 'night' },
    success: { narrative: '{npcName}推开一间破屋的门，里面已经有几个人在等。蜡烛只点了一根。', effects: { mood: 3 }, targetEffects: { mood: 2 }, relationChange: 5 },
  },
  {
    id: 'fa_patrol_route', name: '按线巡逻', description: '衙役沿固定路线巡查',
    goalCategory: 'faction', outcomeType: 'certain', weight: 4, cooldownTicks: 3,
    tags: ['faction', 'guard', 'patrol'],
    conditions: { actorTraits: ['正直'], actorForbiddenTraits: [], actorProfession: ['guard'], targetRequired: false },
    success: { narrative: '{npcName}沿着固定路线一路巡查，逢巷必入。手里的棍子在地上敲得笃笃响。', effects: { safety: 8, copper: 5, fatigue: -5 } },
  },

  // ── 新增 ──
  {
    id: 'fa_report_superior', name: '向上级汇报', description: '衙役向长官汇报',
    goalCategory: 'faction', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['faction', 'guard', 'hierarchy'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], actorProfession: ['guard'], targetRequired: true, targetSameFaction: true, location: ['government'] },
    success: { narrative: '{npcName}整理了一下衣裳，推门进去行了个礼。"禀报大人……"一条一条地把近日的见闻说了个清楚。', effects: { copper: 3, mood: 3 }, targetEffects: { mood: 3 }, relationChange: 3 },
  },
  {
    id: 'fa_rally_members', name: '召集人手', description: '召集同伙商议',
    goalCategory: 'faction', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['faction', 'leadership'],
    conditions: { actorTraits: ['勇敢', '健谈'], actorForbiddenTraits: [], targetRequired: true, targetSameFaction: true, minNearbyNpcs: 2 },
    success: { narrative: '{npcName}拍了一下桌子，把周围几个人都招了过来。"听我说——"几颗脑袋凑在一起，压低了声音。', effects: { mood: 5 }, targetEffects: { mood: 3 }, relationChange: 3 },
  },
  {
    id: 'fa_distribute_task', name: '分派任务', description: '头目分派差事',
    goalCategory: 'faction', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['faction', 'leadership'],
    conditions: { actorTraits: ['勤劳', '精明'], actorForbiddenTraits: [], targetRequired: true, targetSameFaction: true },
    success: { narrative: '"你去东边盯着，你把消息递给上面。"{npcName}有条不紊地安排着。{targetName}点了点头，转身就走了。', effects: { copper: 3, mood: 3 }, targetEffects: { mood: 2 }, relationChange: 2 },
  },
  {
    id: 'fa_spy_rival', name: '刺探敌情', description: '暗中侦察对手派系',
    goalCategory: 'faction', outcomeType: 'contested', weight: 2, cooldownTicks: 8,
    contestedStat: { actor: 'cunning', target: 'alertness' },
    tags: ['faction', 'spy', 'stealth'],
    conditions: { actorTraits: ['狡猾'], actorForbiddenTraits: [], targetRequired: true, targetDifferentFaction: true },
    success: { narrative: '{npcName}远远地跟着{targetName}，把他的行踪记了个一清二楚。回到自己的地盘，把消息传了出去。', effects: { copper: 5, mood: 3, safety: -5 }, relationChange: -5 },
    failure: { narrative: '{targetName}忽然回头看了一眼。{npcName}赶紧闪进巷子里，心提到了嗓子眼。好在对方没再追究。', effects: { mood: -5, safety: -10 } },
  },
  {
    id: 'fa_sabotage_rival', name: '暗中破坏', description: '夜间破坏对手的据点',
    goalCategory: 'faction', outcomeType: 'contested', weight: 1, cooldownTicks: 12,
    contestedStat: { actor: 'cunning', target: 'alertness' },
    tags: ['faction', 'sabotage', 'night'],
    conditions: { actorTraits: ['狡猾', '暴躁'], actorForbiddenTraits: ['正直'], targetRequired: true, targetDifferentFaction: true, timeOfDay: 'night' },
    success: { narrative: '{npcName}摸黑到了对方的地盘，三两下做了手脚。第二天天一亮，{targetName}那边就乱了套。', effects: { mood: 5, safety: -10 }, targetEffects: { mood: -10, copper: -15 }, relationChange: -15 },
    failure: { narrative: '刚动手就被抓住了。{targetName}的人把{npcName}按在地上，一顿好打。"敢来我们这里撒野？"', effects: { health: -15, mood: -10, safety: -20 }, relationChange: -25 },
  },
  {
    id: 'fa_bribe_official', name: '贿赂官吏', description: '用钱打通关节',
    goalCategory: 'faction', outcomeType: 'contested', weight: 1, cooldownTicks: 10,
    contestedStat: { actor: 'wallet', target: 'honor' },
    tags: ['faction', 'corruption'],
    conditions: { actorTraits: ['贪婪', '精明'], actorForbiddenTraits: ['正直'], actorMinCopper: 50, targetRequired: true, targetDifferentFaction: true },
    success: { narrative: '{npcName}把一个鼓鼓的荷包推到{targetName}面前。"一点心意。"对方掂了掂分量，微微点了点头。', effects: { copper: -30, mood: 5 }, targetEffects: { copper: 30 }, relationChange: 8 },
    failure: { narrative: '{targetName}把荷包推了回去，面色一沉。"你把我当什么人了？"周围的气氛一下子冷了下来。', effects: { copper: -5, mood: -10, safety: -10 }, relationChange: -15 },
  },
  {
    id: 'fa_protection_racket', name: '收保护费', description: '向商户收取保护费',
    goalCategory: 'faction', outcomeType: 'contested', weight: 2, cooldownTicks: 7,
    contestedStat: { actor: 'aggression', target: 'courage' },
    tags: ['faction', 'underground', 'extortion'],
    conditions: { actorTraits: ['暴躁'], actorForbiddenTraits: ['正直', '善良'], targetRequired: true, targetProfession: ['merchant'], targetMinCopper: 20 },
    success: { narrative: '{npcName}拍了拍{targetName}的摊子："这个月的份子钱，该交了吧？"{targetName}哆哆嗦嗦地掏出了铜板。', effects: { copper: 15, mood: 3 }, targetEffects: { copper: -15, mood: -10, safety: -8 }, relationChange: -15 },
    failure: { narrative: '"你敢在我这儿收钱？"{targetName}一把拍开了{npcName}的手。周围的人围了过来，{npcName}只好灰溜溜地走了。', effects: { mood: -8, safety: -10 }, relationChange: -10 },
  },
  {
    id: 'fa_charity_drive', name: '组织善举', description: '组织慈善施舍',
    goalCategory: 'faction', outcomeType: 'certain', weight: 3, cooldownTicks: 6,
    tags: ['faction', 'religion', 'charity'],
    conditions: { actorTraits: ['大方', '善良'], actorForbiddenTraits: [], actorMinCopper: 30, targetRequired: true, targetMaxCopper: 10, location: ['temple'] },
    success: { narrative: '{npcName}在寺庙门口摆了个摊，给过路的穷人每人一碗粥。{targetName}端着碗，眼圈都红了。', effects: { copper: -15, mood: 10 }, targetEffects: { hunger: 15, mood: 8, copper: 3 }, relationChange: 10 },
  },
  {
    id: 'fa_training_session', name: '操练', description: '组织衙役训练',
    goalCategory: 'faction', outcomeType: 'certain', weight: 3, cooldownTicks: 5,
    tags: ['faction', 'guard', 'training'],
    conditions: { actorTraits: ['勇敢', '勤劳'], actorForbiddenTraits: [], actorProfession: ['guard'], targetRequired: true, targetSameFaction: true },
    success: { narrative: '"立正！"{npcName}一声令下，几个衙役立刻站直了。棍法、步法、合围之术，练了整整一个时辰。', effects: { copper: 3, fatigue: -10, health: -3 }, targetEffects: { fatigue: -8 }, relationChange: 3 },
  },
  {
    id: 'fa_trade_deal', name: '派系交易', description: '两个派系间的商业往来',
    goalCategory: 'faction', outcomeType: 'contested', weight: 3, cooldownTicks: 6,
    contestedStat: { actor: 'eloquence', target: 'cleverness' },
    tags: ['faction', 'merchant', 'trade'],
    conditions: { actorTraits: ['精明'], actorForbiddenTraits: [], actorProfession: ['merchant'], targetRequired: true, targetDifferentFaction: true, targetProfession: ['merchant'] },
    success: { narrative: '{npcName}和{targetName}在一张桌子两边坐下。讨价还价了半个时辰，最后握了握手。"成交。"', effects: { copper: 20, mood: 5 }, targetEffects: { copper: 15, mood: 3 }, relationChange: 8 },
    failure: { narrative: '谈了半天，{targetName}拍拍屁股站了起来。"这买卖做不了。"头也不回地走了。', effects: { mood: -5 }, relationChange: -3 },
  },
  {
    id: 'fa_scholarly_debate', name: '学术辩论', description: '太学中的学术争论',
    goalCategory: 'faction', outcomeType: 'contested', weight: 3, cooldownTicks: 5,
    contestedStat: { actor: 'cleverness', target: 'cleverness' },
    tags: ['faction', 'scholar', 'debate'],
    conditions: { actorTraits: ['机灵'], actorForbiddenTraits: [], targetRequired: true, targetTraits: ['机灵', '勤劳'] },
    success: { narrative: '{npcName}引经据典，侃侃而谈。{targetName}被驳得哑口无言，涨红了脸。"你……你等着。"', effects: { mood: 10 }, targetEffects: { mood: -5 }, relationChange: -3 },
    failure: { narrative: '{npcName}刚开口说了两句，就被{targetName}一个反问堵了回去。想了半天，竟无话可说。', effects: { mood: -5 }, relationChange: -2 },
  },
  {
    id: 'fa_tax_collect', name: '收税', description: '挨家挨户征收税赋',
    goalCategory: 'faction', outcomeType: 'certain', weight: 2, cooldownTicks: 7,
    tags: ['faction', 'government', 'tax'],
    conditions: { actorTraits: ['勤劳'], actorForbiddenTraits: [], targetRequired: true, targetMinCopper: 10, location: ['east_market', 'west_market', 'center_street'] },
    success: { narrative: '{npcName}拿着税单，敲开了{targetName}的门。"这个月的税，该交了。"{targetName}苦着脸掏出了铜板。', effects: { copper: 5, mood: -3 }, targetEffects: { copper: -10, mood: -5 }, relationChange: -5 },
  },
  {
    id: 'fa_religious_procession', name: '法会游行', description: '寺庙举行法会',
    goalCategory: 'faction', outcomeType: 'certain', weight: 2, cooldownTicks: 10,
    tags: ['faction', 'religion', 'ceremony'],
    conditions: { actorTraits: ['善良', '温和'], actorForbiddenTraits: [], targetRequired: false, location: ['temple'], minNearbyNpcs: 3 },
    success: { narrative: '钟声悠悠地响了三下。{npcName}跟在僧侣的队伍后面，手里捧着经幡。沿途的人纷纷合十。', effects: { mood: 10, safety: 5 } },
  },
];
