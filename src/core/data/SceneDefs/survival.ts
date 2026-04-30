import type { BranchEvent } from '../../ai/SceneLibrary/types';

export const SURVIVAL_EVENTS: BranchEvent[] = [
  {
    id: 'hungry_beggar',
    name: '饥饿难耐',
    goalCategory: 'survival',
    weight: 10,
    cooldownDays: 8,
    narrativeWeight: 'minor',
    conditions: {
      actorMaxMood: 30,
      actorMaxCopper: 5,
    },
    openingNarrative: '你已经好几天没吃饱了。肚子咕咕叫个不停，头也开始发晕。路边飘来炊烟的味道……',
    choices: [
      {
        id: 'find_wild_food',
        text: '去城外找吃的',
        consequence: {
          narrative: '你拖着疲惫的身子来到城外，在田埂边挖了些野菜。虽然难以下咽，好歹填了填肚子。',
          effects: { hunger: 15, fatigue: -10, mood: -5 },
        },
      },
      {
        id: 'ask_for_food',
        text: '向人求助',
        consequence: {
          narrative: '你红着脸向一个卖饼的大婶开口。大婶叹了口气，递给你一个冷馒头："拿去吧，可怜见的。"',
          effects: { hunger: 20, mood: -3 },
          narrativeTag: '受过施舍',
        },
      },
      {
        id: 'steal_food',
        text: '偷点吃的',
        consequence: {
          narrative: '你趁人不注意，从摊子上顺了一个馒头。心跳如擂鼓，好在没人发现。但心里五味杂陈。',
          effects: { hunger: 20, mood: -15 },
          narrativeTag: '偷过食物',
        },
      },
    ],
  },
  {
    id: 'sudden_illness',
    name: '身体不适',
    goalCategory: 'survival',
    weight: 4,
    cooldownDays: 20,
    narrativeWeight: 'major',
    conditions: {
      actorMaxMood: 25,
      dayRange: [7, 999],
    },
    openingNarrative: '今早起来，你觉得浑身发冷，额头滚烫。周围的声响变得模糊，腿也发软。',
    choices: [
      {
        id: 'go_clinic',
        text: '去看郎中',
        condition: { field: 'copper', operator: 'gte', value: 15 },
        consequence: {
          narrative: '你强撑着来到药铺。郎中把了脉，说是风寒，开了三副药。你回去煎了服下，出了一身汗，好歹压住了。',
          effects: { copper: -15, health: 15, fatigue: -5 },
        },
      },
      {
        id: 'rest_it_out',
        text: '硬扛着休息',
        consequence: {
          narrative: '你躺在住处硬扛。烧了一整天，第二天总算退了些，但身子还是很虚。',
          effects: { health: -10, fatigue: 10, hunger: -10 },
          narrativeTag: '硬扛过病',
        },
      },
      {
        id: 'ask_help',
        text: '找人帮忙',
        condition: { field: 'mood', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你找到一个还算熟悉的人，说明了情况。对方二话没说，帮你请了郎中，还送了碗粥。',
          effects: { health: 10, mood: 5, hunger: 10 },
          narrativeTag: '受人恩惠',
          relationChange: 10,
        },
      },
    ],
  },
  {
    id: 'storm_shelter',
    name: '暴风骤雨',
    goalCategory: 'survival',
    weight: 6,
    cooldownDays: 12,
    narrativeWeight: 'minor',
    conditions: {
      weather: ['雨', '雪'],
      location: ['street', 'market', 'farmland', 'dock'],
    },
    openingNarrative: '天色骤变，豆大的雨点噼里啪啦砸了下来。转眼间街上就湿透了，行人四散奔逃。',
    choices: [
      {
        id: 'find_shelter',
        text: '找个地方避雨',
        consequence: {
          narrative: '你钻进一个屋檐下，和几个同样被淋的人挤在一起。大家面面相觑，倒有些可笑。',
          effects: { mood: -2, health: -3 },
        },
      },
      {
        id: 'brave_storm',
        text: '冒雨赶路',
        consequence: {
          narrative: '你咬牙在雨中快步前行。到家时已经浑身湿透，打了好几个喷嚏。',
          effects: { health: -8, fatigue: -5, mood: -5 },
        },
      },
      {
        id: 'help_stranger',
        text: '帮旁边淋雨的老人',
        consequence: {
          narrative: '你脱下外衫披在老人身上，扶着他走到屋檐下。老人感动得直说谢谢。',
          effects: { health: -5, mood: 8 },
          narrativeTag: '雨中助人',
          relationChange: 8,
        },
      },
    ],
  },
  {
    id: 'robbery_encounter',
    name: '遇劫',
    goalCategory: 'survival',
    weight: 5,
    cooldownDays: 15,
    narrativeWeight: 'major',
    conditions: {
      location: ['street', 'mountain', 'dock'],
      actorMinCopper: 15,
    },
    openingNarrative: '你正走着，忽然从旁边窜出两个蒙面汉子，一左一右堵住了去路。领头的亮出一把短刀，压低声音道："把值钱的东西交出来，留你一条命。"',
    choices: [
      {
        id: 'handover',
        text: '交出钱财保命',
        consequence: {
          narrative: '你颤抖着把铜钱袋递了过去。那汉子掂了掂，冷笑一声："算你识相。"两人迅速消失在巷子深处。你空着口袋站在原地，万幸人没事。',
          effects: { copper: -20, mood: -10 },
          narrativeTag: '被抢劫过',
        },
      },
      {
        id: 'fight_back',
        text: '反抗',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你趁其不备，猛地朝左边那人裆部踢了一脚，然后拔腿就跑。身后传来咒骂声，但你钻进人群后他们就找不着了。身上多了几道擦伤，但钱保住了。',
          effects: { health: -12, mood: 8, fatigue: -10 },
          narrativeTag: '勇斗歹徒',
        },
      },
      {
        id: 'call_for_help',
        text: '大声呼救',
        condition: { field: 'mood', operator: 'gte', value: 30 },
        consequence: {
          narrative: '你扯开嗓子大喊"抓贼啊！"附近几个过路的壮汉闻声围了过来。蒙面人见势不妙，骂了一句转身就跑。你惊魂未定，但分文未失。',
          effects: { mood: 5 },
          narrativeTag: '遇劫呼救',
          relationChange: 3,
        },
      },
    ],
  },
  {
    id: 'fire_escape',
    name: '火警逃生',
    goalCategory: 'survival',
    weight: 4,
    cooldownDays: 22,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['residential', 'workshop', 'market'],
      weather: ['晴'],
    },
    openingNarrative: '"走水了！走水了！"一阵急促的锣声划破了宁静。你抬头望去——不远处冒起了滚滚浓烟，火舌已经舔上了邻家的屋檐。人们尖叫着四散奔逃。',
    choices: [
      {
        id: 'help_fight_fire',
        text: '帮忙救火',
        condition: { field: 'health', operator: 'gte', value: 45 },
        consequence: {
          narrative: '你加入了救火的队伍，端水、传递、搬东西。烟熏火燎中忙活了一个时辰，火终于被扑灭了。虽然满脸黑灰，但邻居们纷纷向你道谢。',
          effects: { health: -18, fatigue: -25, mood: 5 },
          narrativeTag: '参与救火',
          relationChange: 10,
        },
      },
      {
        id: 'save_belongings',
        text: '先抢救自己的财物',
        consequence: {
          narrative: '你冲回住处，抢在被烧到之前把铺盖卷和仅有的几件家当搬了出来。火势蔓延到隔壁才被控制住，你的屋子只烧焦了窗框。财物保住了大半，心里松了口气。',
          effects: { fatigue: -15, mood: 0 },
          narrativeTag: '火灾逃生',
        },
      },
      {
        id: 'run_away',
        text: '赶紧逃命要紧',
        consequence: {
          narrative: '你什么都没拿，跟着人群往外跑。等跑到安全地带回头一看——好大的火！后来听说烧了十几间房。你庆幸自己跑得快，但也心疼那些没带出来的东西。',
          effects: { copper: -10, mood: -10, fatigue: -8 },
        },
      },
    ],
  },
  {
    id: 'food_poisoning',
    name: '吃坏肚子',
    goalCategory: 'survival',
    weight: 7,
    cooldownDays: 14,
    narrativeWeight: 'minor',
    conditions: {
      actorMinHealth: 10,
    },
    openingNarrative: '中午吃的那碗凉粉……好像不太对劲。这会儿肚子开始咕噜咕噜地响，一股寒意从胃里直往上涌。你脸色发青，额头冒出了冷汗。',
    choices: [
      {
        id: 'seek_medicine',
        text: '去买药',
        condition: { field: 'copper', operator: 'gte', value: 8 },
        consequence: {
          narrative: '你强撑着来到药铺，郎中给你包了一帖"藿香正气散"。煎服之后上吐下泻了一番，折腾了大半夜总算缓过来了。',
          effects: { copper: -8, health: -8, fatigue: -15, hunger: -15 },
          narrativeTag: '食物中毒',
        },
      },
      {
        id: 'rest_recover',
        text: '躺着硬扛',
        consequence: {
          narrative: '你蜷缩在床上，一会儿冷一会儿热，肚子绞着疼。折腾了整整一天一夜，第二天才能勉强下床走路。整个人瘦了一圈。',
          effects: { health: -15, fatigue: -20, hunger: -20, mood: -10 },
          narrativeTag: '扛过食物中毒',
        },
      },
      {
        id: 'find_cause',
        text: '去找那个卖凉粉的',
        condition: { field: 'mood', operator: 'gte', value: 20 },
        consequence: {
          narrative: '你捂着肚子找到那个摊贩，质问他凉粉的事。摊贩一脸无辜："别人吃了都没事啊？"围观的人指指点点，你也没力气争辩，只能灰溜溜地走了。',
          effects: { health: -10, mood: -15 },
          narrativeTag: '找过不良商家',
          relationChange: -5,
        },
      },
    ],
  },
  {
    id: 'heatstroke',
    name: '中暑',
    goalCategory: 'survival',
    weight: 6,
    cooldownDays: 10,
    narrativeWeight: 'minor',
    conditions: {
      season: ['夏'],
      weather: ['晴'],
    },
    openingNarrative: '日头毒辣得像要把人烤化。汴河的水面都冒着热气，街上的石板烫得能煎鸡蛋。你走了没几步就觉得头晕目眩，眼前开始发黑。',
    choices: [
      {
        id: 'find_shade',
        text: '找个阴凉处歇息',
        consequence: {
          narrative: '你踉跄着走到一棵大槐树下，靠着树干坐了下来。一个好心的大婶看你不对劲，递过来一碗绿豆汤："喝了吧，这天儿可不能硬撑。"',
          effects: { health: 5, fatigue: 5, mood: 5, hunger: 5 },
          narrativeTag: '受过路人帮助',
          relationChange: 3,
        },
      },
      {
        id: 'push_through',
        text: '咬牙坚持赶路',
        consequence: {
          narrative: '你咬着牙继续往前走。没走出二里地，两眼一黑就栽倒了。醒来时发现自己躺在路边茶棚的竹榻上，老板说你晕倒了一个时辰。',
          effects: { health: -15, fatigue: -15, copper: -5, mood: -5 },
          narrativeTag: '中暑晕倒',
        },
      },
      {
        id: 'buy_drink',
        text: '买碗酸梅汤解暑',
        condition: { field: 'copper', operator: 'gte', value: 3 },
        consequence: {
          narrative: '你在路边摊买了一碗冰镇酸梅汤，一口灌下去，酸甜冰凉的液体顺着喉咙滑下去，顿时觉得活过来了。这才是夏天该有的味道。',
          effects: { copper: -3, health: 3, mood: 8 },
        },
      },
    ],
  },
  {
    id: 'wolf_howl',
    name: '夜半狼嚎',
    goalCategory: 'survival',
    weight: 3,
    cooldownDays: 20,
    narrativeWeight: 'flavor',
    conditions: {
      location: ['mountain', 'farmland'],
      dayRange: [5, 999],
    },
    openingNarrative: '深夜，一声凄厉的狼嚎从远处的山林中传来，在寂静的夜里格外刺耳。紧接着是第二声、第三声……听起来不止一只。附近的狗狂吠起来，村里的鸡也乱了窝。',
    choices: [
      {
        id: 'stay_alert',
        text: '整夜保持警惕',
        consequence: {
          narrative: '你不敢深睡，抱着根木棍守到天亮。好在狼群只是路过没有进村，但一宿没合眼让你头重脚轻，眼睛都快睁不开了。',
          effects: { fatigue: -20, mood: -5, health: -2 },
          narrativeTag: '警惕过狼群',
        },
      },
      {
        id: 'fortify_shelter',
        text: '加固门窗',
        condition: { field: 'health', operator: 'gte', value: 35 },
        consequence: {
          narrative: '你用柜子顶住门，把窗户用木板钉死。忙完这些才敢和衣躺下。外面偶尔还能听到狼嚎声，但离村子似乎越来越远了。',
          effects: { fatigue: -10, mood: 2 },
          narrativeTag: '防备野兽',
        },
      },
      {
        id: 'ignore_and_sleep',
        text: '应该不会来村里吧',
        consequence: {
          narrative: '你翻了个身继续睡。第二天早上听邻居说昨晚有户人家的羊被叼走了两只，就在村口。你后背一阵发凉——还好昨晚运气不错。',
          effects: { mood: -8 },
        },
      },
    ],
  },
  {
    id: 'bridge_collapse',
    name: '桥梁断裂',
    goalCategory: 'survival',
    weight: 3,
    cooldownDays: 28,
    narrativeWeight: 'milestone',
    conditions: {
      location: ['dock', 'farmland'],
      weather: ['雨'],
    },
    openingNarrative: '连日大雨，河水暴涨。你正走在汴河支流的一座木桥上，突然听到"咔嚓"一声脆响——桥身剧烈晃动了一下！桥面上的人群瞬间乱作一团。',
    choices: [
      {
        id: 'run_across',
        text: '拼命冲过去',
        condition: { field: 'health', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你用尽全身力气冲向对岸。脚下的木板在你身后一块块断裂坠入河中。你扑倒在岸边的泥地上，回头看时，整座桥已经被洪水冲垮了。',
          effects: { health: -10, fatigue: -15, mood: 5 },
          narrativeTag: '从断桥逃生',
        },
      },
      {
        id: 'help_others',
        text: '帮老人和孩子先走',
        condition: { field: 'mood', operator: 'gte', value: 40 },
        consequence: {
          narrative: '你背起一个摔倒的老太太往对岸冲，又拉起两个孩子一起跑。最后你自己跳入河中才勉强抓住一根浮木。被下游的船夫捞上来时，你已经冻得嘴唇发紫。',
          effects: { health: -20, fatigue: -20, mood: 10 },
          narrativeTag: '舍己救人',
          relationChange: 15,
        },
      },
      {
        id: 'freeze_panic',
        text: '吓僵了动不了',
        consequence: {
          narrative: '你的腿像灌了铅一样迈不开步子。桥面塌陷的那一刻，你随着断裂的木板一起掉进了湍急的河水中。冰冷刺骨，你拼命挣扎，最终抓住了岸边垂下的柳枝。',
          effects: { health: -25, fatigue: -20, mood: -15 },
          narrativeTag: '落水获救',
        },
      },
    ],
  },
  {
    id: 'snake_bite',
    name: '毒蛇咬伤',
    goalCategory: 'survival',
    weight: 4,
    cooldownDays: 18,
    narrativeWeight: 'major',
    conditions: {
      location: ['mountain', 'farmland'],
    },
    openingNarrative: '你拨开草丛的时候，脚踝处突然传来一阵剧痛！低头一看——一条青色的蛇正迅速钻进草丛深处。伤口处有两个清晰的牙印，已经开始肿胀发黑。',
    choices: [
      {
        id: 'suck_out_venom',
        text: '吸出毒血',
        condition: { field: 'health', operator: 'gte', value: 50 },
        consequence: {
          narrative: '你立刻蹲下，用嘴用力吸吮伤口，吐出几口黑血。又撕下衣襟扎紧小腿根部防止毒气扩散。折腾一番后肿势稍微控制住了，但整个人虚脱得厉害。',
          effects: { health: -15, fatigue: -15, mood: -5 },
          narrativeTag: '处理过蛇咬',
        },
      },
      {
        id: 'rush_to_clinic',
        text: '赶紧去药铺',
        condition: { field: 'copper', operator: 'gte', value: 12 },
        consequence: {
          narrative: '你一瘸一拐地赶到药铺，郎中一看伤口脸色就变了："这是七步蛇！"他立刻给你敷上解毒药膏，又开了内服的方子。折腾了三天才算完全消肿。',
          effects: { copper: -12, health: -10, fatigue: -10 },
          narrativeTag: '被毒蛇咬过',
        },
      },
      {
        id: 'use_herb',
        text: '自己找草药处理',
        consequence: {
          narrative: '你想起老人说过雄黄可以驱蛇毒，在附近找了些替代的草药嚼碎了敷在伤口上。效果不太确定，肿倒是慢慢消了，但这几天一直发烧说胡话。',
          effects: { health: -20, fatigue: -20, mood: -8 },
          narrativeTag: '土法解毒',
        },
      },
    ],
  },
];
