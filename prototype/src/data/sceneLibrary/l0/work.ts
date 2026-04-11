// === L0 演出库 — 工作 (Work) ===
//
// 包含：热情叫卖、坐堂看诊、田里忙活、认真巡逻、进山打猎、
//       补货、向人群推销、盘点库存、播种、收割、修水渠、
//       设卡检查、夜巡、抓捕窃贼、进山采药、上门看诊、开方售药、
//       追踪猎物、下套子、剥皮硝制、生火打铁、修理农具、
//       大锅炒菜、采购食材、授课讲学、抄写典籍、
//       扛包搬运、帮工建房、销赃、收保护费

import type { L0Scene, L0SceneCondition } from '../../../ai/sceneLibrary/types';

const S: L0SceneCondition = { actorTraits: [], actorForbiddenTraits: [], targetRequired: false };

export const WORK_SCENES: L0Scene[] = [
  // ════════════════════════════════════════
  // 迁移自旧演出库的 5 个场景
  // ════════════════════════════════════════

  {
    id: 'w_hard_sell', name: '热情叫卖', description: '商贩拼命推销货物',
    goalCategory: 'work', outcomeType: 'contested', weight: 7, cooldownTicks: 3,
    contestedStat: { actor: 'eloquence', target: 'wallet' },
    tags: ['merchant', 'selling', 'trade'],
    conditions: {
      ...S, actorTraits: ['勤劳', '健谈'], actorProfession: ['merchant'],
      targetRequired: true, targetMinCopper: 10, location: ['east_market', 'west_market'],
    },
    success: {
      narrative: '{npcName}扯着嗓子吆喝，把自家货物的优点翻来覆去夸了个遍。{targetName}被吸引了过来，掏钱买了两件。',
      effects: { copper: 15, mood: 3, fatigue: -10 },
      targetEffects: { copper: -10, mood: 3 },
      relationChange: 2,
    },
    failure: {
      narrative: '{npcName}喊了半天，{targetName}看了一眼就走了。"太贵了。"',
      effects: { fatigue: -5, mood: -3 },
    },
  },
  {
    id: 'w_treat_patient', name: '坐堂看诊', description: '大夫为病人诊治',
    goalCategory: 'work', outcomeType: 'contested', weight: 6, cooldownTicks: 4,
    contestedStat: { actor: 'medicine', target: 'disease' },
    tags: ['doctor', 'healing', 'medicine'],
    conditions: {
      ...S, actorTraits: ['善良', '勤劳'], actorProfession: ['doctor'],
      targetRequired: true, targetMinHealth: 50, location: ['east_market'],
    },
    success: {
      narrative: '{npcName}仔细地为{targetName}把了脉，开了方子。"按时服药，三日后再来复诊。"{targetName}千恩万谢地走了。',
      effects: { copper: 20, mood: 5, fatigue: -10 },
      targetEffects: { health: 15, mood: 5, copper: -10 },
      relationChange: 5,
    },
    failure: {
      narrative: '{npcName}把了半天脉，眉头紧锁。"这病……不太好办。老朽尽力了。"{targetName}面如死灰。',
      effects: { mood: -5 },
      targetEffects: { mood: -8 },
      relationChange: -3,
    },
  },
  {
    id: 'w_farm_work', name: '田里忙活', description: '农夫在田间劳作',
    goalCategory: 'work', outcomeType: 'certain', weight: 7, cooldownTicks: 3,
    tags: ['farmer', 'farming', 'labor'],
    conditions: {
      ...S, actorTraits: ['勤劳', '善良'], actorProfession: ['farmer'],
      targetRequired: false, location: ['east_farm', 'south_farm'],
    },
    success: {
      narrative: '{npcName}弯着腰在田里忙了一整天。日头毒辣，汗水湿透了衣裳，但看着庄稼的长势，心里踏实。',
      effects: { copper: 8, hunger: -15, fatigue: -20 },
    },
  },
  {
    id: 'w_patrol_duty', name: '认真巡逻', description: '衙役沿街巡查',
    goalCategory: 'work', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    tags: ['guard', 'patrol', 'duty'],
    conditions: {
      ...S, actorTraits: ['正直', '勇敢'], actorProfession: ['guard'],
      targetRequired: false,
    },
    success: {
      narrative: '{npcName}沿着街巷一路巡查，目光如炬。街边的闲杂人等都收敛了几分。手里的棍子在地上敲得笃笃响。',
      effects: { copper: 8, mood: 3, safety: 5 },
    },
  },
  {
    id: 'w_hunt', name: '进山打猎', description: '猎人进山寻觅猎物',
    goalCategory: 'work', outcomeType: 'chance', weight: 6, cooldownTicks: 5, successChance: 0.5,
    tags: ['hunter', 'hunting', 'mountain'],
    conditions: {
      ...S, actorTraits: ['勇敢', '勤劳'], actorProfession: ['hunter'],
      targetRequired: false, location: ['shallow_mountain', 'deep_mountain'],
    },
    success: {
      narrative: '{npcName}背着弓进了山。半日后回来时，肩上多了只野兔。"今天运气不错。"嘴角挂着笑。',
      effects: { copper: 12, hunger: -10, fatigue: -15 },
    },
    failure: {
      narrative: '{npcName}在山里转了一整天，连根兔子毛都没见到。背着空弓回来了。',
      effects: { hunger: -15, fatigue: -20, mood: -5 },
    },
  },

  // ════════════════════════════════════════
  // 新增 25 个场景
  // ════════════════════════════════════════

  // ──── 商人 (Merchant) ────

  {
    id: 'w_merchant_restock', name: '补货', description: '商人去码头进货',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    tags: ['merchant', 'trade', 'dock'],
    conditions: {
      ...S, actorProfession: ['merchant'], actorMinCopper: 20,
      targetRequired: false, location: ['dock'],
    },
    success: {
      narrative: '{npcName}在码头上和船老大讨价还价，最后以满意的价格进了批货。背着沉甸甸的包裹往回走，心里盘算着能赚多少。',
      effects: { copper: -20, fatigue: -5 },
      memoryTag: '补货',
    },
  },
  {
    id: 'w_merchant_pitch', name: '向人群推销', description: '商人对着人群大力推销',
    goalCategory: 'work', outcomeType: 'contested', weight: 5, cooldownTicks: 4,
    contestedStat: { actor: 'eloquence', target: 'wallet' },
    tags: ['merchant', 'selling', 'group', 'trade'],
    conditions: {
      ...S, actorProfession: ['merchant'], actorTraits: ['健谈'],
      minNearbyNpcs: 2, targetRequired: false,
    },
    success: {
      narrative: '{npcName}站到高处，扯开嗓子就是一通吆喝。把货物夸得天花乱坠，围过来的人越来越多，掏钱的也越来越多。',
      effects: { copper: 18, mood: 5, fatigue: -8 },
    },
    failure: {
      narrative: '{npcName}喊得口干舌燥，围过来的人不少，掏钱的却没几个。"光看不买，白费力气。"擦了把汗，继续吆喝。',
      effects: { fatigue: -8, mood: -3 },
    },
  },
  {
    id: 'w_merchant_inventory', name: '盘点库存', description: '勤劳商人清点存货',
    goalCategory: 'work', outcomeType: 'certain', weight: 4, cooldownTicks: 3,
    tags: ['merchant', 'inventory', 'labor'],
    conditions: {
      ...S, actorProfession: ['merchant'], actorTraits: ['勤劳'],
      targetRequired: false,
    },
    success: {
      narrative: '{npcName}把铺子里的货物一件件清点过去，用炭笔在木板上记了密密麻麻的数字。哪些好卖、哪些积压，心里有了数。',
      effects: { copper: 5, mood: 3, fatigue: -3 },
    },
  },

  // ──── 农夫 (Farmer) ────

  {
    id: 'w_farmer_plant', name: '播种', description: '春耕时节下种',
    goalCategory: 'work', outcomeType: 'certain', weight: 7, cooldownTicks: 4,
    tags: ['farmer', 'planting', 'spring', 'labor'],
    conditions: {
      ...S, actorProfession: ['farmer'],
      targetRequired: false, location: ['east_farm', 'south_farm'], season: ['春'],
    },
    success: {
      narrative: '春风送暖，{npcName}弯着腰在田垄间播下种子。一粒粒种子落入湿润的泥土，像埋下了一个个希望。"但愿今年收成好。"',
      effects: { copper: -3, hunger: -10, fatigue: -15, mood: 5 },
    },
  },
  {
    id: 'w_farmer_harvest', name: '收割', description: '秋收时节割麦打谷',
    goalCategory: 'work', outcomeType: 'certain', weight: 7, cooldownTicks: 4,
    tags: ['farmer', 'harvest', 'autumn', 'labor'],
    conditions: {
      ...S, actorProfession: ['farmer'],
      targetRequired: false, location: ['east_farm', 'south_farm'], season: ['秋'],
    },
    success: {
      narrative: '金灿灿的稻穗压弯了腰。{npcName}挥着镰刀，一茬一茬地割过去。汗水滴进土里，但脸上的笑容怎么也藏不住。今年是个好年景。',
      effects: { copper: 15, hunger: -15, fatigue: -20, mood: 10 },
    },
  },
  {
    id: 'w_farmer_irrigate', name: '修水渠', description: '农夫去水渠疏浚灌溉',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 5,
    tags: ['farmer', 'irrigation', 'labor'],
    conditions: {
      ...S, actorProfession: ['farmer'],
      targetRequired: false, location: ['irrigation'],
    },
    success: {
      narrative: '{npcName}扛着锄头去了水渠，和几个农夫一起清淤疏浚。泥水溅了一身，但渠水终于畅通了。"这下庄稼有水喝了。"',
      effects: { copper: 5, fatigue: -15, hunger: -10, mood: 3 },
    },
  },

  // ──── 衙役 (Guard) ────

  {
    id: 'w_guard_checkpoint', name: '设卡检查', description: '衙役在要道设卡盘查',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    tags: ['guard', 'checkpoint', 'duty'],
    conditions: {
      ...S, actorProfession: ['guard'],
      targetRequired: false, location: ['center_street', 'government'],
    },
    success: {
      narrative: '{npcName}在路口设了检查站，对来往的行人逐一盘查。手里的令牌一亮，过往行人都老老实实地停下来。',
      effects: { copper: 5, mood: 3, safety: 8 },
    },
  },
  {
    id: 'w_guard_night_watch', name: '夜巡', description: '衙役夜间巡逻',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    tags: ['guard', 'patrol', 'night', 'duty'],
    conditions: {
      ...S, actorProfession: ['guard'],
      targetRequired: false, timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}提着灯笼，独自走在空荡荡的街上。更声一下一下地响着。夜风冷飕飕的，但脚步不停。这是职责所在。',
      effects: { copper: 8, fatigue: -10, mood: -2, safety: 5 },
    },
  },
  {
    id: 'w_guard_arrest', name: '抓捕窃贼', description: '衙役当场擒拿盗贼',
    goalCategory: 'work', outcomeType: 'contested', weight: 4, cooldownTicks: 8,
    contestedStat: { actor: 'bravery', target: 'cunning' },
    tags: ['guard', 'arrest', 'combat', 'duty'],
    conditions: {
      ...S, actorProfession: ['guard'],
      targetRequired: true, targetProfession: ['rogue'],
    },
    success: {
      narrative: '{npcName}发现了{targetName}形迹可疑，一个箭步冲上去，一把按住了肩膀。"老实点！跟我走一趟！"{targetName}还想挣扎，已经被铐上了。',
      effects: { copper: 15, mood: 8, safety: 10 },
      targetEffects: { mood: -15, safety: -20 },
      relationChange: -20,
      memoryTag: '抓捕窃贼',
    },
    failure: {
      narrative: '{npcName}追了{targetName}三条街，最后还是让人给跑了。气得直跺脚。"下次别让我逮着你！"',
      effects: { fatigue: -10, mood: -5 },
    },
  },

  // ──── 大夫 (Doctor) ────

  {
    id: 'w_doctor_herbs_gather', name: '进山采药', description: '大夫进山寻觅草药',
    goalCategory: 'work', outcomeType: 'chance', weight: 5, cooldownTicks: 5, successChance: 0.6,
    tags: ['doctor', 'herbs', 'mountain', 'medicine'],
    conditions: {
      ...S, actorProfession: ['doctor'],
      targetRequired: false, location: ['shallow_mountain', 'deep_mountain'],
    },
    success: {
      narrative: '{npcName}蹲在岩石边上，小心翼翼地把一株草药连根拔起。叶子上还挂着露珠，药香沁人心脾。"好药！这株至少值三十文。"',
      effects: { copper: 10, mood: 5 },
    },
    failure: {
      narrative: '{npcName}在山里转了大半天，找到的几株草药品相都不好。叹了口气，背起药篓往回走。',
      effects: { mood: -3, fatigue: -5 },
    },
  },
  {
    id: 'w_doctor_house_call', name: '上门看诊', description: '大夫上门为重症患者诊治',
    goalCategory: 'work', outcomeType: 'contested', weight: 5, cooldownTicks: 5,
    contestedStat: { actor: 'medicine', target: 'disease' },
    tags: ['doctor', 'healing', 'house_call', 'medicine'],
    conditions: {
      ...S, actorProfession: ['doctor'],
      targetRequired: true, targetMinHealth: 10,
    },
    success: {
      narrative: '{npcName}背着药箱赶到{targetName}家中。把了脉，又看了看舌苔，开了方子。"病来如山倒，病去如抽丝。按时服药，会好的。"',
      effects: { copper: 15, mood: 5, fatigue: -8 },
      targetEffects: { health: 20, mood: 10, copper: -10 },
      relationChange: 8,
    },
    failure: {
      narrative: '{npcName}尽力了，但{targetName}的病已入膏肓。"我……开个方子试试吧，但不要抱太大希望。"',
      effects: { mood: -10 },
      targetEffects: { mood: -5 },
      relationChange: -2,
    },
  },
  {
    id: 'w_doctor_prescribe', name: '开方售药', description: '大夫在药铺坐堂开方',
    goalCategory: 'work', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    tags: ['doctor', 'prescription', 'medicine', 'trade'],
    conditions: {
      ...S, actorProfession: ['doctor'],
      targetRequired: false, location: ['east_market'],
    },
    success: {
      narrative: '{npcName}在药铺里坐了一上午，看了好几个病人。望闻问切，一丝不苟。每开一张方子都反复斟酌，不敢有半分马虎。',
      effects: { copper: 12, fatigue: -5, mood: 3 },
    },
  },

  // ──── 猎人 (Hunter) ────

  {
    id: 'w_hunter_track', name: '追踪猎物', description: '猎人循踪追猎',
    goalCategory: 'work', outcomeType: 'contested', weight: 5, cooldownTicks: 5,
    contestedStat: { actor: 'perception', target: 'stealth' },
    tags: ['hunter', 'tracking', 'mountain'],
    conditions: {
      ...S, actorProfession: ['hunter'],
      targetRequired: false, location: ['shallow_mountain', 'deep_mountain'],
    },
    success: {
      narrative: '{npcName}蹲下来仔细看了看地上的蹄印，嘴角一扬。"是头野猪，刚过去不久。"弯着腰循着痕迹追了过去。半个时辰后，扛着猎物回来了。',
      effects: { copper: 15, hunger: -10, fatigue: -15, mood: 5 },
    },
    failure: {
      narrative: '{npcName}跟着蹄印走了大半天，最后痕迹在一处溪水边消失了。蹲在溪边愣了半晌，叹了口气。',
      effects: { hunger: -10, fatigue: -15, mood: -5 },
    },
  },
  {
    id: 'w_hunter_trap_set', name: '下套子', description: '猎人在山里布置陷阱',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 5,
    tags: ['hunter', 'trap', 'mountain'],
    conditions: {
      ...S, actorProfession: ['hunter'],
      targetRequired: false, location: ['shallow_mountain', 'deep_mountain'],
    },
    success: {
      narrative: '{npcName}选了一处兽径，小心翼翼地布下绳套。又折了几根树枝做伪装，撒了把枯叶盖住痕迹。"明天来看看运气。"',
      effects: { copper: -2, fatigue: -8, mood: 3 },
    },
  },
  {
    id: 'w_hunter_skin', name: '剥皮硝制', description: '猎人处理猎物皮毛',
    goalCategory: 'work', outcomeType: 'certain', weight: 4, cooldownTicks: 4,
    tags: ['hunter', 'crafting', 'labor'],
    conditions: {
      ...S, actorProfession: ['hunter'], actorMinCopper: 5,
      targetRequired: false,
    },
    success: {
      narrative: '{npcName}把猎物的皮毛整张剥下来，用硝石细细地揉搓。手法娴熟，一张完整的皮子就在手里渐渐变得柔软。这活儿急不得，得慢慢来。',
      effects: { copper: 8, fatigue: -8, mood: 2 },
    },
  },

  // ──── 铁匠 (Blacksmith) ────

  {
    id: 'w_blacksmith_forge', name: '生火打铁', description: '铁匠在炉前锤炼铁器',
    goalCategory: 'work', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    tags: ['blacksmith', 'forge', 'crafting', 'labor'],
    conditions: {
      ...S, actorProfession: ['blacksmith'],
      targetRequired: false,
    },
    success: {
      narrative: '{npcName}把铁块烧得通红，抡起锤子叮叮当当地敲打着。火星四溅，汗水和铁屑混在一起。一件趁手的铁器渐渐成型。',
      effects: { copper: 10, fatigue: -15, hunger: -10, mood: 3 },
    },
  },
  {
    id: 'w_blacksmith_repair', name: '修理农具', description: '铁匠帮人修缮损坏的工具',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['blacksmith', 'repair', 'crafting', 'labor'],
    conditions: {
      ...S, actorProfession: ['blacksmith'],
      targetRequired: true,
    },
    success: {
      narrative: '{targetName}拿来一把卷了刃的镰刀。{npcName}接过来端详了一下，放入炉中烧红，几锤下去便修整如新。"拿好了，不收钱，下次带点酒来就行。"',
      effects: { copper: 5, fatigue: -5, mood: 5 },
      targetEffects: { mood: 5 },
      relationChange: 3,
    },
  },

  // ──── 厨子 (Chef) ────

  {
    id: 'w_chef_cook', name: '大锅炒菜', description: '厨子在东市支摊炒菜',
    goalCategory: 'work', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    tags: ['chef', 'cooking', 'food', 'trade'],
    conditions: {
      ...S, actorProfession: ['chef'],
      targetRequired: false, location: ['east_market'],
    },
    success: {
      narrative: '{npcName}在大锅前颠勺翻炒，油烟滋滋作响。葱姜蒜的香气飘出老远，引得路人纷纷驻足。一盘盘热气腾腾的菜端上了桌。',
      effects: { copper: 12, fatigue: -10, mood: 5 },
    },
  },
  {
    id: 'w_chef_buy_ingredient', name: '采购食材', description: '厨子去东市采购新鲜食材',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['chef', 'shopping', 'food', 'trade'],
    conditions: {
      ...S, actorProfession: ['chef'], actorMinCopper: 10,
      targetRequired: false, location: ['east_market'],
    },
    success: {
      narrative: '{npcName}一大早就到了东市，在各摊位间挑挑拣拣。翻看了白菜的叶子，闻了闻鱼的眼睛，最后挑了满满一筐新鲜的回去。',
      effects: { copper: -10, fatigue: -3, mood: 3 },
    },
  },

  // ──── 先生 (Teacher) ────

  {
    id: 'w_teacher_lecture', name: '授课讲学', description: '先生给学生讲课',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 3,
    tags: ['teacher', 'lecture', 'education'],
    conditions: {
      ...S, actorProfession: ['teacher'], actorTraits: ['勤劳'],
      targetRequired: true,
    },
    success: {
      narrative: '{npcName}捧着书卷，清了清嗓子，开始讲课。从"学而时习之"讲到"温故而知新"，声音不高，但字字清晰。{targetName}在下面听得连连点头。',
      effects: { copper: 8, mood: 5, fatigue: -5 },
      targetEffects: { mood: 3 },
      relationChange: 2,
    },
  },
  {
    id: 'w_teacher_copy', name: '抄写典籍', description: '勤劳先生伏案抄书',
    goalCategory: 'work', outcomeType: 'certain', weight: 4, cooldownTicks: 3,
    tags: ['teacher', 'writing', 'education', 'labor'],
    conditions: {
      ...S, actorProfession: ['teacher'], actorTraits: ['勤劳'],
      targetRequired: false,
    },
    success: {
      narrative: '{npcName}伏在案前，一笔一画地抄写着典籍。墨香弥漫，窗外的光影不知不觉就移了半丈。揉了揉酸痛的手腕，继续落笔。',
      effects: { copper: 5, fatigue: -5, mood: 3 },
    },
  },

  // ──── 苦力 (Laborer) ────

  {
    id: 'w_laborer_carry', name: '扛包搬运', description: '苦力在码头扛活',
    goalCategory: 'work', outcomeType: 'certain', weight: 6, cooldownTicks: 3,
    tags: ['laborer', 'carrying', 'dock', 'labor'],
    conditions: {
      ...S, actorProfession: ['laborer'],
      targetRequired: false, location: ['dock'],
    },
    success: {
      narrative: '{npcName}把麻袋往肩上一甩，咬着牙往货仓走。一袋又一袋，汗水湿透了衣背。码头管事记了数，扔过来几枚铜钱。',
      effects: { copper: 10, hunger: -15, fatigue: -20 },
    },
  },
  {
    id: 'w_laborer_build', name: '帮工建房', description: '苦力参与建房',
    goalCategory: 'work', outcomeType: 'certain', weight: 5, cooldownTicks: 4,
    tags: ['laborer', 'building', 'group', 'labor'],
    conditions: {
      ...S, actorProfession: ['laborer'],
      minNearbyNpcs: 2, targetRequired: false,
    },
    success: {
      narrative: '{npcName}和几个工友一起搬砖和泥，砌墙搭梁。有人搬砖，有人搅泥，配合默契。日头偏西时，一面墙已经砌了起来。',
      effects: { copper: 8, hunger: -15, fatigue: -18, mood: 3 },
    },
  },

  // ──── 无赖 (Rogue) ────

  {
    id: 'w_rogue_fence', name: '销赃', description: '无赖夜间暗中变卖赃物',
    goalCategory: 'work', outcomeType: 'contested', weight: 3, cooldownTicks: 8,
    contestedStat: { actor: 'cleverness', target: 'judgment' },
    tags: ['rogue', 'fence', 'night', 'crime'],
    conditions: {
      ...S, actorProfession: ['rogue'], actorTraits: ['狡猾'],
      targetRequired: false, timeOfDay: 'night',
    },
    success: {
      narrative: '{npcName}趁着夜色在暗巷里和一个收赃的人碰了头。把东西往对方手里一塞，铜钱就到了自己手里。全程没超过十句话。',
      effects: { copper: 20, mood: 3 },
      memoryTag: '销赃',
    },
    failure: {
      narrative: '{npcName}等了半天，买家没来。又等了一阵，远处传来更夫的梆子声。只好悻悻地收起东西走了。',
      effects: { mood: -5, safety: -5 },
    },
  },
  {
    id: 'w_rogue_protection', name: '收保护费', description: '无赖向有钱人收取保护费',
    goalCategory: 'work', outcomeType: 'contested', weight: 2, cooldownTicks: 10,
    contestedStat: { actor: 'aggression', target: 'courage' },
    tags: ['rogue', 'extortion', 'crime'],
    conditions: {
      ...S, actorProfession: ['rogue'],
      targetRequired: true, targetMinCopper: 30,
    },
    success: {
      narrative: '{npcName}晃到{targetName}面前，拍了拍对方的肩膀。"生意不错嘛。这一带的治安归我管，每月意思意思？"{targetName}掏出了铜钱。',
      effects: { copper: 15, mood: 5, safety: -5 },
      targetEffects: { copper: -15, mood: -10, safety: -8 },
      relationChange: -15,
      memoryTag: '收保护费',
    },
    failure: {
      narrative: '{targetName}非但不给钱，还威胁要报官。"你这无赖，再来缠着我，叫衙役抓你！"{npcName}骂骂咧咧地走了。',
      effects: { mood: -8, safety: -10 },
      relationChange: -10,
    },
  },
];
