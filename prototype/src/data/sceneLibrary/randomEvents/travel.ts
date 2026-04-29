// === 随机事件 — 行旅 (Travel Random Events) ===
//
// 漫野奇谭式轻量级事件，宋代行旅背景。
// 玩家在场景转换间遇到的突发小事件，1-2幕，有意义的选择与后果。
// 包含：山路遇匪、迷途旅人、草丛包袱、野犬拦路、河边渡客、官道急递、夜路鬼火、桥头卖茶

import { RandomEvent } from '../../../ai/sceneLibrary/types';

export const TRAVEL_RANDOM_EVENTS: RandomEvent[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 山路遇匪 — Mountain Bandits
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_mountain_bandits',
    name: '山路遇匪',
    description: '山中道路偏僻，一伙剪径小贼拦住去路，可武力威慑、破财消灾或智取脱身。',
    trigger: {
      location: ['mountain', 'mountain_path', 'forest', 'forest_deep', 'hill'],
    },
    weight: 3,
    cooldownTicks: 30,
    scene: {
      id: 're_travel_mountain_bandits',
      name: '山路遇匪',
      description: '山路遭遇剪径贼人',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '你正走在一段偏僻的山路上，两侧松柏遮天蔽日。忽然，树丛中跳出三个蒙面大汉，为首那人提着一柄朴刀，挡在路中央，粗声喝道："此路是我开，此树是我栽！要想从此过，留下买路财！"身后两人各持木棍，将退路也堵了个严实。',
      entryPhase: 'bandit_encounter',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        bandit_encounter: {
          phaseId: 'bandit_encounter',
          narrative:
            '三个匪徒将你围在中间，为首的朴刀在阳光下闪着寒光。他打量了你一番，咧嘴笑道："看你这打扮，是个行商的吧？把包袱留下，爷放你走路。"山风呼啸，四下无人，远处只有松涛阵阵。',
          choices: [
            {
              id: 'fight_bandits',
              text: '拔出随身利刃，喝道："光天化日之下，岂容尔等放肆！"',
              condition: {
                field: 'health',
                operator: 'gte',
                value: 60,
              },
              consequence: {
                immediateEffects: { health: -15, mood: 8 },
                nextPhase: 'bandit_fight_result',
              },
            },
            {
              id: 'pay_toll',
              text: '好汉不吃眼前亏，掏出铜钱息事宁人。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 20,
              },
              consequence: {
                immediateEffects: { copper: -20, mood: -5 },
                nextPhase: null,
                endingNarrative:
                  '你叹了口气，从怀中摸出二十文铜钱，递给那为首的匪徒。他掂了掂分量，哼了一声："算你识相。"三个匪徒让开一条路，你快步走过去，头也不回。走出一里多地，心还在怦怦直跳。这世道，连山路都不得安宁了。',
              },
            },
            {
              id: 'bluff_authority',
              text: '亮出官府文书或假装自己是官差，吓退他们。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '精明',
              },
              consequence: {
                immediateEffects: { mood: 12 },
                nextPhase: null,
                endingNarrative:
                  '你镇定自若地整整衣冠，朗声道："我乃开封府差役，奉命押送要犯途经此地。你们若敢阻拦，便是妨碍公务！"为首的匪徒一愣，上下打量你几眼，面露迟疑。你趁势又喝道："怎么？还要我亮腰牌不成？"三个匪徒对视一眼，骂骂咧咧地退入林中，眨眼便不见了踪影。',
              },
            },
          ],
        },
        bandit_fight_result: {
          phaseId: 'bandit_fight_result',
          narrative:
            '你与匪徒搏斗起来。朴刀擦着你的衣袖划过，留下一道血痕。你咬牙反击，用随身短刀逼退了为首那人。其余两个匪徒见头领受伤，纷纷后退。',
          choices: [
            {
              id: 'press_attack',
              text: '乘胜追击，把他们彻底赶跑！',
              consequence: {
                immediateEffects: { health: -10, mood: 15, copper: 30 },
                nextPhase: null,
                endingNarrative:
                  '你大喝一声冲了上去，短刀划出一道弧光。匪徒们见势不妙，转身就跑，丢盔弃甲地消失在密林中。你喘着粗气环顾四周，地上散落着他们的杂物——一个粗布包袱里竟有三十文铜钱和半袋干粮。你收好战利品，包扎了伤口，继续上路。山风拂过，伤口虽然隐隐作痛，心中却涌起一股豪气。',
              },
            },
            {
              id: 'let_them_flee',
              text: '见好就收，让他们滚远些便罢。',
              consequence: {
                immediateEffects: { health: -5, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你收刀而立，冷冷看着三个匪徒狼狈逃窜的身影。为首那人捂着手臂上的伤口，回头恨恨看了你一眼，终究还是没敢再上前。你整理好衣衫，在路边扯了些草药敷在伤口上，继续赶路。松涛依旧在山间回响，好像什么都没发生过。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 迷途旅人 — Lost Traveler
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_lost_traveler',
    name: '迷途旅人',
    description: '一个迷路的旅人在路边徘徊，可以指路、同行一段或赠予干粮。',
    trigger: {},
    weight: 3,
    cooldownTicks: 20,
    scene: {
      id: 're_travel_lost_traveler',
      name: '迷途旅人',
      description: '路遇迷途之人，施以援手或漠然离去。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '你行至一处岔路口，见一个青衣书生模样的人正对着一棵老槐树发呆，手里拿着一张皱巴巴的地图，左右张望，满脸迷茫。他注意到你走近，连忙拱手作揖道："这位兄台请了！在下从临安来，本想去汴京投亲，可这岔路实在分不清南北，已经在此转了半个时辰了……"',
      entryPhase: 'lost_encounter',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        lost_encounter: {
          phaseId: 'lost_encounter',
          narrative:
            '书生将地图摊开给你看，上面密密麻麻标注了不少地名，但明显是旧版，好几条路早已改道。他苦笑道："在下读书还行，这认路的本事实在不灵光。"说着肚子咕噜作响，他尴尬地笑了笑："说来惭愧，干粮也快吃完了。"',
          choices: [
            {
              id: 'guide_him',
              text: '正好同路，带他一程吧。',
              consequence: {
                immediateEffects: { mood: 8 },
                nextPhase: 'lost_guide_result',
              },
            },
            {
              id: 'point_direction',
              text: '指明了方向，把地图上的错处帮他标出来。',
              consequence: {
                immediateEffects: { mood: 3 },
                nextPhase: null,
                endingNarrative:
                  '你接过他的地图，用炭笔将几处过时的路标注出来，又详细指明了去汴京的方向。书生连连道谢，将你说的每一句话都仔细记在纸上："往东北走三十里过石桥，再往北十里便是官道……多谢兄台！"你点点头继续赶路，身后传来他反复默念路线的声音。',
              },
            },
            {
              id: 'share_food',
              text: '把随身干粮分他一些，再给他指路。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 5,
              },
              consequence: {
                immediateEffects: { copper: -5, mood: 6 },
                nextPhase: null,
                endingNarrative:
                  '你从包袱里取出几个炊饼和一小包腌菜递给他，又把去汴京的路线仔细说了一遍。书生接过干粮，眼眶竟有些发红："萍水相逢，兄台却如此仗义。在下姓陈，家中排行第三，日后若到汴京，定当登门拜谢！"你摆摆手，各自上路。日头偏西，路边的槐树拖出长长的影子。',
              },
            },
            {
              id: 'ignore_him',
              text: '自己还赶路呢，没工夫管闲事。',
              consequence: {
                immediateEffects: { mood: -3 },
                nextPhase: null,
                endingNarrative:
                  '你摇了摇头："抱歉，我自己也是赶路，帮不了你。"书生的脸上闪过一丝失望，但还是客气地拱了拱手："无妨无妨，在下再想想办法。"你继续赶路，走了一箭之地回头看，他还站在那棵老槐树下，对着地图左看右看，身影越来越小。',
              },
            },
          ],
        },
        lost_guide_result: {
          phaseId: 'lost_guide_result',
          narrative:
            '你带着书生一同赶路。他话不多，但偶尔聊起临安的风物，倒是颇有见地。走了约莫半个时辰，官道已在望。书生忽然站定，从袖中取出一封书信道："在下临行前，家师曾嘱托若遇到汴京的读书人，可代为投递此信。兄台若方便，日后帮我送到太学附近的书肆便可。"他郑重地将信递过来。',
          choices: [
            {
              id: 'accept_letter',
              text: '接过书信，答应帮忙投递。',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你将书信小心收入怀中，书生拱手深深一揖："大恩不言谢，后会有期！"说罢转身大步朝官道走去，步伐比来时轻快了许多。你看着他远去的背影，心中感到一丝暖意。旅途漫漫，能与人同行一程，也是难得的缘分。',
              },
            },
            {
              id: 'decline_letter',
              text: '抱歉，自己行踪不定，怕误了要事。',
              consequence: {
                immediateEffects: { mood: 2 },
                nextPhase: null,
                endingNarrative:
                  '书生点点头，并不勉强："理解理解，在下再想别的法子便是。"两人在岔路口告别，他朝汴京方向走去，你继续自己的路。暮色渐浓，远处的官道上偶尔有车马经过，卷起一片尘烟。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 草丛包袱 — Bundle in the Bushes
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_bundle_in_bushes',
    name: '草丛包袱',
    description: '路边灌木丛中发现一个遗落的包袱，打开一看是财物。是据为己有还是归还失主？',
    trigger: {
      location: ['farmland', 'farmland_edge', 'forest', 'forest_edge', 'hill', 'village_road'],
    },
    weight: 2,
    cooldownTicks: 25,
    scene: {
      id: 're_travel_bundle_in_bushes',
      name: '草丛包袱',
      description: '路边草丛中意外发现一个包袱，内有铜钱与一封家书。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '你走在一条田埂小道上，忽然瞥见路边的灌木丛里有一角灰布露出来。拨开枝叶一看，竟是一个扎得紧紧的包袱，上面沾了些泥点，看样子被人遗落已有数日。',
      entryPhase: 'bundle_found',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        bundle_found: {
          phaseId: 'bundle_found',
          narrative:
            '你解开包袱，里面是一个粗布包裹，打开后赫然是五十文铜钱、一双新布鞋和一封家书。家书上写着"儿寄银回家，望母亲保重身体"，落款是一个叫"周大柱"的名字，地址是邻村李家庄。布鞋上绣着简单的花纹，看得出是给老人做的。',
          choices: [
            {
              id: 'return_bundle',
              text: '这定是穷苦人家寄给老母的钱，送到李家庄去。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '善良',
              },
              consequence: {
                immediateEffects: { mood: 15, health: -5 },
                nextPhase: null,
                endingNarrative:
                  '你按照家书上的地址一路打听，终于在傍晚时分找到了李家庄。一个白发苍苍的老太太正在门口张望，听你说完来意，颤巍巍地接过包袱，老泪纵横："大柱啊大柱……他在城里做工，攒了好几个月才攒下这些钱啊……"她拉着你的手不肯松开，非要留你吃饭。你婉言谢绝，只喝了一碗热粥便告辞了。月色下，老太太站在门口目送你远去，嘴里还在念叨着"好人有好报"。',
              },
            },
            {
              id: 'keep_money',
              text: '四下无人，铜钱归己，家书扔掉便是。',
              consequence: {
                immediateEffects: { copper: 50, mood: -12 },
                nextPhase: null,
                endingNarrative:
                  '你将铜钱揣入怀中，随手将家书和布鞋丢进了草丛。走出一里多地，不知为何心中隐隐不安。那封家书上歪歪扭扭的字迹在脑海里挥之不去——那是一个不太识字的人，一笔一划写出来的。你下意识地摸了摸怀里的铜钱，总觉得这些钱烫手得很。',
              },
            },
            {
              id: 'take_partial',
              text: '取走十文当跑腿费，剩下的送到李家庄。',
              condition: {
                field: 'copper',
                operator: 'lte',
                value: 30,
              },
              consequence: {
                immediateEffects: { copper: 40, mood: 3 },
                nextPhase: null,
                endingNarrative:
                  '你犹豫再三，从包袱里取出十文铜钱揣好，然后把剩下的包好送去了李家庄。老太太接过包袱千恩万谢，你含糊应了几句便匆匆离去。虽说送到了，心里总有点不是滋味——不知道那十文铜钱拿得该不该。',
              },
            },
            {
              id: 'leave_bundle',
              text: '别人的东西不碰，说不定失主会回来找。',
              consequence: {
                immediateEffects: { mood: 2 },
                nextPhase: null,
                endingNarrative:
                  '你将包袱重新包好，放回了灌木丛中，又折了根树枝插在旁边做个记号。也许失主还会回来找吧。你拍了拍手上的泥土，继续赶路。田埂上的风吹过来，带着稻花的清香，你的心里倒也坦然。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. 野犬拦路 — Wild Dogs Block Path
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_wild_dogs',
    name: '野犬拦路',
    description: '几只野狗挡住去路，龇牙低吼。可驱赶、喂食绕行或冒险冲过去。',
    trigger: {
      location: ['farmland', 'farmland_edge', 'alley', 'village_road', 'residential_north', 'residential_south'],
    },
    weight: 2,
    cooldownTicks: 15,
    scene: {
      id: 're_travel_wild_dogs',
      name: '野犬拦路',
      description: '一群饿犬挡在前方道上，低声咆哮不让通行。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '前方窄道上，四五只野狗横在路中央，其中一只黑色大狗正对着你龇牙低吼。它们的肋骨隐约可见，显然饿了好几天了。其余几只围成半圆，目光警惕地盯着你，喉咙里发出呜呜的声响。',
      entryPhase: 'dogs_block',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        dogs_block: {
          phaseId: 'dogs_block',
          narrative:
            '黑狗又往前逼了一步，露出森白的犬齿。路边一个正在收拾菜地的老农冲你喊道："当心啊！这几只野狗这几天凶得很，前天还咬伤了隔壁王家的小子！"',
          choices: [
            {
              id: 'throw_food',
              text: '从包袱里取出炊饼扔过去，趁机绕路走。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 3,
              },
              consequence: {
                immediateEffects: { copper: -3, mood: 3 },
                nextPhase: null,
                endingNarrative:
                  '你掰了块炊饼朝远处扔去，几只野狗立刻扑了过去，争抢着大快朵颐。你趁它们分神，快步从路旁的田埂绕了过去。回头看时，那只黑狗叼着最大的一块炊饼，竟抬头朝你的方向看了一眼，尾巴微微摇了摇——也许它并非真有恶意，只是实在太饿了。',
              },
            },
            {
              id: 'stand_ground',
              text: '捡起一根木棍，大声喝斥驱赶。',
              consequence: {
                immediateEffects: { health: -8, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你抄起路边一根粗木棍，在地上狠狠敲了两下，大喝一声："滚！"黑狗被你的气势震住了，往后退了几步。你继续举着木棍逼近，几只野狗终于夹着尾巴四散逃开。你的小腿被其中一只擦了一下，留下一道浅浅的抓痕，好在并不严重。老农在远处竖起了大拇指。',
              },
            },
            {
              id: 'rush_through',
              text: '趁它们还没扑上来，硬冲过去！',
              consequence: {
                immediateEffects: { health: -20, mood: -5 },
                nextPhase: null,
                endingNarrative:
                  '你拔腿就跑，野狗们立刻追了上来！那只黑狗一口咬住了你的裤腿，你摔了一跤，手肘磕在地上，疼得龇牙咧嘴。好在附近的老农闻声赶来，挥着锄头把野狗赶跑了。你爬起来拍拍身上的土，裤腿被撕了个大口子，手肘也在渗血。老农叹道："后生啊，见了野狗可不能跑，越跑它越追！"',
              },
            },
            {
              id: 'slow_retreat',
              text: '慢慢后退，不走这条路了，绕道而行。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '谨慎',
              },
              consequence: {
                immediateEffects: { mood: -2 },
                nextPhase: null,
                endingNarrative:
                  '你面朝野狗缓缓后退，始终不与黑狗对视，也不转身。退到安全距离后，你拐上了旁边一条小径绕行。多走了半里路，但总算安全避开了。你暗自庆幸自己没有逞强，这年头被野狗咬伤可不是闹着玩的——万一得了疯狗病，那才叫倒霉透顶。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. 河边渡客 — River Ferry Passenger
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_river_ferry',
    name: '河边渡客',
    description: '河边等渡船时遇到一个赶着赴任的小官，他邀请你同船并攀谈起来。',
    trigger: {
      location: ['river', 'river_bank', 'bridge', 'dock', 'ferry'],
    },
    weight: 3,
    cooldownTicks: 25,
    scene: {
      id: 're_travel_river_ferry',
      name: '河边渡客',
      description: '渡口偶遇赴任小吏，交谈中涉及一桩地方悬案。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '你来到河边渡口，渡船还在对岸，只得在柳树下等候。旁边站着一位身穿青绿官袍的中年人，身后跟着两个挑着行李的衙役。他见你也在等船，便攀谈起来："在下姓赵，新任清河县丞，赴任途中。兄台也是要过河么？不如同船而行，路上也好有个照应。"',
      entryPhase: 'ferry_encounter',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        ferry_encounter: {
          phaseId: 'ferry_encounter',
          narrative:
            '渡船缓缓靠岸，你与赵县丞一同登船。船至江心，他忽然压低声音道："实不相瞒，此番赴任，实则是上面派我去查一桩旧案——前任县令离奇失踪，府库亏空三千贯，其中怕是有人中饱私囊。兄台走南闯北，可曾听过清河县的事？"',
          choices: [
            {
              id: 'share_info',
              text: '"略知一二"，将自己听闻的一些消息告诉他。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '精明',
              },
              consequence: {
                immediateEffects: { mood: 10 },
                nextPhase: 'ferry_share_result',
              },
            },
            {
              id: 'warn_him',
              text: '"此案牵涉不小，大人万望小心行事。"',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '赵县丞闻言面色凝重地点了点头："多谢提醒。在下虽官微言轻，但既受命于此，自当尽心竭力。"他望着滔滔河水，沉吟片刻又道："若此行能查明真相，也不枉这一路奔波。"渡船靠岸，你与赵县丞在码头告别。他拱手道："后会有期！"转身带着衙役朝县衙方向去了，背影挺得笔直。',
              },
            },
            {
              id: 'plead_ignorance',
              text: '"在下只是一介行商，不清楚官府的事。"',
              consequence: {
                immediateEffects: { mood: 1 },
                nextPhase: null,
                endingNarrative:
                  '赵县丞并不介意，笑了笑："无妨无妨，是我唐突了。对了，清河县若有什么好买卖，兄台日后可记得照顾。"渡船靠岸，两人客气地拱手告别。你看着他远去的身影，心中暗想：那清河县的事，水恐怕深得很。',
              },
            },
          ],
        },
        ferry_share_result: {
          phaseId: 'ferry_share_result',
          narrative:
            '你将之前走商时听到的只言片语告诉了赵县丞——清河县前年大旱，赈灾银两不知去向，百姓怨声载道，之后县令便突然告病辞官，从此杳无音信。赵县丞听完，从袖中取出一本册子仔细记下，又郑重地向你道谢。船将靠岸时，他忽然道："兄台若日后途经清河，不妨来县衙坐坐。你我虽萍水相逢，但在下觉得你是个可靠之人。"',
          choices: [
            {
              id: 'accept_invitation',
              text: '答应日后一定登门拜访。',
              consequence: {
                immediateEffects: { mood: 6 },
                nextPhase: null,
                endingNarrative:
                  '渡船靠岸，你与赵县丞在码头上郑重作揖告别。他递给你一块铜制腰牌："持此牌入清河县衙，门房自会通报。"你收好腰牌，看着他带着衙役大步朝官道走去，夕阳将他们的影子拉得老长。河水拍打着码头石阶，不知这一别，日后会否再续这段渡口之缘。',
              },
            },
            {
              id: 'politely_decline',
              text: '婉言谢绝，自己行踪不定，怕是难得路过。',
              consequence: {
                immediateEffects: { mood: 3 },
                nextPhase: null,
                endingNarrative:
                  '赵县丞也不强求，只是拱手笑道："那便随缘吧。天底下没有不散的筵席，但有缘自会再相见。"两人在渡口分别，各奔东西。你走上大路，回望河边，渡船正载着新一批旅客缓缓驶向对岸。暮色苍茫，水天一色。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. 官道急递 — Urgent Courier
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_urgent_courier',
    name: '官道急递',
    description: '一个急递铺兵在官道上摔伤了腿，恳请路人帮忙传递公文。',
    trigger: {
      location: ['center_street', 'north_street', 'south_street', 'east_street', 'west_street', 'main_road'],
    },
    weight: 2,
    cooldownTicks: 25,
    scene: {
      id: 're_travel_urgent_courier',
      name: '官道急递',
      description: '急递铺兵受伤，请求帮助传递紧急公文。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '官道上马蹄声急，一个身着红衣的急递铺兵连人带马摔倒在你面前。他从地上爬起来，右腿明显受了伤，一瘸一拐却还紧紧护着怀中的油布包裹。他看见你，连忙单膝跪地："这位客官！在下是急递铺的铺兵，有八百里加急公文须在日落前送到下一驿站！在下腿伤走不动了，求客官帮帮忙！"',
      entryPhase: 'courier_encounter',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        courier_encounter: {
          phaseId: 'courier_encounter',
          narrative:
            '铺兵把油布包裹递向你，急切地说："公文在此，下一驿站就在官道往北三十里处。事关军情，万万不可延误！"他的右腿膝盖已经肿得老高，额头上满是汗珠，看样子是走不动了。路边偶尔有车马经过，却无人停下来。',
          choices: [
            {
              id: 'deliver_for_him',
              text: '接过公文，快马加鞭替他送到下一驿站。',
              condition: {
                field: 'health',
                operator: 'gte',
                value: 40,
              },
              consequence: {
                immediateEffects: { health: -10, mood: 12 },
                nextPhase: null,
                endingNarrative:
                  '你接过油布包裹，翻身上马，朝北疾驰而去。一路上不敢有丝毫耽搁，穿过田野、越过山坡，终于在日落前赶到了驿站。驿站的官员接过公文，验看火漆封印完好后，郑重向你道谢："辛苦了！军情紧急，你这可是立了大功！"他让人包扎好你的手——方才赶路太急，掌心已被缰绳磨出了血泡。铺兵的伤你也嘱咐驿站派人去接应了。',
              },
            },
            {
              id: 'help_stop_carriage',
              text: '拦一辆过路的马车，让车夫带铺兵去驿站。',
              consequence: {
                immediateEffects: { mood: 5, copper: -5 },
                nextPhase: null,
                endingNarrative:
                  '你站在路边拦住一辆路过的牛车，与车夫好说歹说，又塞了五文铜钱做车资，才说服他载铺兵一程。铺兵千恩万谢地爬上车，紧紧抱着公文包裹。车夫扬鞭赶牛，慢悠悠地朝北去了。你在后面望着牛车渐行渐远，心里有些担忧——牛车走得不快，但愿天黑前能到驿站吧。',
              },
            },
            {
              id: 'bind_wound_first',
              text: '先帮他包扎伤腿，再做打算。',
              consequence: {
                immediateEffects: { health: -3, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你蹲下身，撕了块衣襟给铺兵包扎好伤腿。他咬着牙忍痛，连声道谢。包扎完毕，他试了试腿脚，虽然还是一瘸一拐，但勉强能走动了。他重新抱紧公文，朝你深深一揖："大恩不言谢，在下拼了命也要把公文送到！"说罢咬着牙朝北边走去。你目送他远去，心中既佩服又有些担忧。',
              },
            },
            {
              id: 'refuse_courier',
              text: '抱歉，官府的事我可不敢沾手，你自己想办法吧。',
              consequence: {
                immediateEffects: { mood: -8 },
                nextPhase: null,
                endingNarrative:
                  '铺兵的脸上写满了失望和焦急，但他也没办法强求，只能拖着伤腿往路边挪了挪，朝每一个经过的路人呼救。你加快脚步走开了，身后传来他沙哑的喊声渐渐远去。走了好一段路，你忍不住回头看了一眼——他还坐在路边，抱着公文包裹，像一块红色的石头。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 7. 夜路鬼火 — Ghost Fire at Night
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_ghost_fire',
    name: '夜路鬼火',
    description: '夜间赶路时路边出现幽幽鬼火，走近一看原来是一个老猎户在烧纸祭奠亡妻。',
    trigger: {
      shichen: ['亥时', '子时', '丑时'],
    },
    weight: 2,
    cooldownTicks: 35,
    scene: {
      id: 're_travel_ghost_fire',
      name: '夜路鬼火',
      description: '夜行遇鬼火，走近发现是老猎户祭祀亡妻，一段凄凉往事。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '夜色如墨，你独自走在一条荒僻的小路上，四周寂静得只听得见自己的脚步声和远处的虫鸣。忽然，前方的路边树丛中亮起一团幽幽的蓝绿色火光，忽明忽暗地在夜风中摇曳。你停下脚步，一股寒意从脊背升起——那是鬼火吗？',
      entryPhase: 'ghost_fire_encounter',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        ghost_fire_encounter: {
          phaseId: 'ghost_fire_encounter',
          narrative:
            '鬼火在风中无声地跳动着，空气中弥漫着纸钱燃烧的焦糊味。你屏住呼吸，隐约听到火光旁有人低声呢喃，像是在念叨着什么。月光从云缝中透出来，你看见一个佝偻的身影蹲在火堆旁，正往里面一张一张地添纸钱。',
          choices: [
            {
              id: 'approach_fire',
              text: '壮着胆子走过去看看究竟。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '勇敢',
              },
              consequence: {
                immediateEffects: { mood: 8 },
                nextPhase: 'ghost_fire_truth',
              },
            },
            {
              id: 'call_out',
              text: '站在原地大声问："谁在那里？"',
              consequence: {
                immediateEffects: { mood: 3 },
                nextPhase: 'ghost_fire_truth',
              },
            },
            {
              id: 'detour',
              text: '鬼神之事宁可信其有，绕道走吧。',
              consequence: {
                immediateEffects: { mood: -5 },
                nextPhase: null,
                endingNarrative:
                  '你不敢久留，悄悄绕了一条远路避开那团鬼火。夜风吹来，你总觉得身后有什么东西在跟着，不敢回头。走了大半个时辰，终于看到了远处村落的灯火，这才松了口气。回头望去，那团鬼火已经看不见了，只剩下一片漆黑的旷野。直到躺进客栈的被窝里，你还在想——那到底是什么？',
              },
            },
          ],
        },
        ghost_fire_truth: {
          phaseId: 'ghost_fire_truth',
          narrative:
            '你走近了才发现，那根本不是什么鬼火——只是一个头发花白的老猎户蹲在路边，面前一堆正在燃烧的纸钱，蓝绿色的光是他往火里撒的一把不知什么粉末。他抬起头看你，眼圈通红，嗓音沙哑："吓着你了？老汉我在给亡妻烧纸……今儿是她三年祭日。这条路上，她当年就是在这里出了事。"他指了指路边一棵歪脖子老树，"被山上滚落的石头砸中了，就在那儿。"',
          choices: [
            {
              id: 'sit_with_him',
              text: '在火堆旁坐下来，陪老猎户说说话。',
              consequence: {
                immediateEffects: { mood: 10 },
                nextPhase: null,
                endingNarrative:
                  '你在老猎户身旁坐了下来。他给你讲了许多往事——他亡妻年轻时是远近闻名的绣娘，绣的牡丹栩栩如生，连太守夫人都赞不绝口。后来眼睛不好了，绣不了花，就改做豆腐，每天天不亮就挑着担子沿这条路去镇上卖。"那天早上也是这个时辰……"他说着说着就哽咽了。你默默听着，偶尔搭几句话，不知不觉坐到纸钱烧尽。火堆渐渐熄灭，东方露出了鱼肚白。老猎户站起来拍拍身上的灰："多谢你陪老汉坐了这一夜。你是个好人。"',
              },
            },
            {
              id: 'offer_money',
              text: '掏出几文铜钱递给他，劝他节哀。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 10,
              },
              consequence: {
                immediateEffects: { copper: -10, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你从怀中摸出十文铜钱递给老猎户："老人家，给嫂夫人多烧些纸钱吧。人虽走了，情分还在。"老猎户接过铜钱，浑浊的老眼里闪着泪光："好人啊……我这辈子怕是还不起这人情了。"你摇摇头："不是人情，是一点心意。"老猎户将铜钱放在纸钱堆旁，继续一张一张地往火里添纸。你轻手轻脚地走开了，身后传来他低低的絮叨声，像是在跟亡妻说着话。',
              },
            },
            {
              id: 'leave_quickly',
              text: '知道了不是鬼就放心了，告辞赶路。',
              consequence: {
                immediateEffects: { mood: 1 },
                nextPhase: null,
                endingNarrative:
                  '你点点头表示理解，说了几句安慰的话便告辞了。老猎户也不挽留，继续低头烧纸。你走了一段路回头看，那团蓝绿色的火光还在夜色中明灭，老人的身影愈发显得孤单。夜风吹过旷野，带着纸灰的味道，你裹紧了衣裳，加快了脚步。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 8. 桥头卖茶 — Bridge Tea Seller
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_travel_bridge_tea',
    name: '桥头卖茶',
    description: '桥头有个卖茶的老翁，一碗茶不过两文钱，却聊出了一桩奇事。',
    trigger: {},
    weight: 4,
    cooldownTicks: 20,
    scene: {
      id: 're_travel_bridge_tea',
      name: '桥头卖茶',
      description: '桥头茶摊老翁闲聊，透露一些路上有用的消息。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '一座石拱桥头，支着一面褪了色的茶旗，旗下摆着两张矮桌、几把竹凳。一个白须老翁正慢悠悠地扇着炉火，铜壶里咕嘟冒着热气。见你走近，他笑眯眯地招手道："客官歇歇脚吧！上好的蒙顶甘露，两文钱一碗，歇好了再赶路不迟。"',
      entryPhase: 'tea_seller',
      weight: 5,
      cooldownTicks: 5,
      phases: {
        tea_seller: {
          phaseId: 'tea_seller',
          narrative:
            '茶香袅袅升起，老翁一边斟茶一边絮叨："老汉在这桥头卖了三十年茶了，南来北往什么人没见过。"他压低声音，凑近了些："客官，你若是要往北走，可得小心——听说白马山那边闹山贼，已经劫了好几拨人了。不过要是走官道绕清水镇，虽然多走二十里，倒是太平得很。"',
          choices: [
            {
              id: 'buy_tea_and_tip',
              text: '喝碗茶，多给几文小费，再打听打听详细消息。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 8,
              },
              consequence: {
                immediateEffects: { copper: -8, mood: 10 },
                nextPhase: 'tea_seller_gossip',
              },
            },
            {
              id: 'buy_tea',
              text: '来一碗茶，歇歇脚。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 2,
              },
              consequence: {
                immediateEffects: { copper: -2, mood: 5, health: 5 },
                nextPhase: null,
                endingNarrative:
                  '你丢下两文铜钱，端起粗陶碗慢慢喝着。茶不算上等，但热乎乎地下肚，一路的疲惫消了大半。老翁又絮叨了几句闲话——今年的新茶比往年贵了、河里的鱼少了、镇上新开了家不错的客栈。你喝完茶，谢过老翁，继续上路。桥下的溪水哗哗地流着，阳光下波光粼粼，倒映着你远去的身影。',
              },
            },
            {
              id: 'chat_without_buying',
              text: '"多谢提醒，不过在下赶时间，就不喝茶了。"',
              consequence: {
                immediateEffects: { mood: -2 },
                nextPhase: null,
                endingNarrative:
                  '老翁的笑容淡了几分，摆摆手："不买就不买吧，不过那消息可就只说给喝茶的客官听了。"你拱拱手走了，总觉得错过了些什么。走了一箭之地回头望，老翁还在桥头扇着炉火，茶旗在风中猎猎作响。也许那碗茶里的消息，比你想的值钱得多。',
              },
            },
          ],
        },
        tea_seller_gossip: {
          phaseId: 'tea_seller_gossip',
          narrative:
            '老翁眉开眼笑地接过铜钱，又给你添了一碗茶，这才慢悠悠地说道："客官是个爽快人，那老汉就多唠叨几句。那白马山的山贼头目叫\'独眼龙\'，原是个退伍厢军，手下有二十来号人，专挑落单的客商下手。不过——"他神秘一笑，"他有个毛病，怕狗。你要是带着条大狗，他断不敢来犯。再者，你要是走清水镇那条路，记得在镇东头的\'杏花楼\'住店，老板娘做的一手好汤饼，而且消息最灵通，什么风声都知道。"',
          choices: [
            {
              id: 'thank_and_go',
              text: '谢过老翁的指点，记下消息继续赶路。',
              consequence: {
                immediateEffects: { mood: 8 },
                nextPhase: null,
                endingNarrative:
                  '你将老翁的话一一记在心里，再三道谢后起身告辞。老翁在身后喊道："客官路上小心！回头要是还走这条路，记得来喝茶啊！"你笑着挥挥手，踏上了桥面。桥下的溪水清澈见底，几条小鱼在石头间穿梭。你根据老翁的建议改走清水镇方向，虽然远了些，但心里踏实了许多。三十年的桥头茶摊，果然不是白开的。',
              },
            },
            {
              id: 'ask_more',
              text: '"老人家消息真灵通，再聊聊附近还有什么新鲜事？"',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '老翁来了兴致，滔滔不绝地讲了起来：东边村子里有人挖出了一坛古钱、城里的米价又涨了两成、邻县新来了个断案如神的好官……你听得津津有味，不知不觉又坐了半个时辰。老翁讲够了，拍拍你的肩膀："客官，时候不早了，上路吧。记住了——走清水镇，住杏花楼。"你起身行礼，带着满腹的新消息踏上了旅途。桥头的茶旗在你身后渐渐远了，老翁又开始招揽新的过客。',
              },
            },
          ],
        },
      },
    },
  },
];
