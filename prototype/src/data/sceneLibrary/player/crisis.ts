// === 玩家多步骤场景 — 危机/紧急事件 ===

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_CRISIS_SCENES: PlayerScene[] = [
  {
    id: 'ps_fire_alarm',
    name: '火警',
    description: '街坊失火，玩家可以选择救火、救人或自保',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: false,
      location: ['residential_north', 'residential_south'],
    },
    participants: [
      { role: '受灾者', minCount: 1, maxCount: 2, requiredRelationType: 'any' },
    ],
    openingNarrative: '你突然闻到一股焦糊味。抬头一看，不远处浓烟滚滚——有人家着火了！街坊们慌作一团，到处是喊叫声。',
    entryPhase: 'phase1',
    phases: {
      phase1: {
        phaseId: 'phase1',
        narrative: '火势正在蔓延。浓烟从一扇窗户里涌出来，隐约能听到里面有孩子的哭声。旁边一个老妇人瘫坐在地上，声嘶力竭地喊着"我的孙子！"',
        choices: [
          {
            id: 'rush_in',
            text: '冲进去救人',
            condition: { field: 'health', operator: 'gte', value: 50 },
            consequence: {
              immediateEffects: { health: -20 },
              nextPhase: 'phase2a',
            },
          },
          {
            id: 'call_help',
            text: '大声呼救，组织街坊灭火',
            consequence: {
              nextPhase: 'phase2b',
            },
          },
          {
            id: 'save_stuff',
            text: '趁乱先把自己家值钱的东西搬出来',
            condition: { field: 'greed', operator: 'gte', value: 50 },
            consequence: {
              nextPhase: 'phase2c',
            },
          },
          {
            id: 'flee',
            text: '赶紧跑，火势太大保命要紧',
            consequence: {
              endingNarrative: '你转身就跑，身后传来老妇人的哭喊声。你跑出好远才停下来，回头看去，火光映红了半边天。那哭声渐渐听不见了。',
              immediateEffects: { mood: -15 },
              nextPhase: null,
            },
          },
        ],
      },
      phase2a: {
        phaseId: 'phase2a',
        narrative: '你用湿布捂住口鼻，冲进了火场。热浪扑面而来，烟熏得你睁不开眼。你循着哭声摸过去，在角落里找到了蜷缩着的孩子！',
        choices: [
          {
            id: 'carry_out',
            text: '抱起孩子往外冲',
            consequence: {
              immediateEffects: { health: -15, mood: 20 },
              relationChange: 30,
              endingNarrative: '你抱着孩子冲出了火场，头发被烧焦了一片，手臂也被烫出了水泡。但你怀里的孩子安然无恙。老妇人跪在地上给你磕头："恩人！你是我们家的恩人！"围观的街坊纷纷向你竖起大拇指。',
              nextPhase: null,
            },
          },
          {
            id: 'find_safe_spot',
            text: '先找安全角落躲避，等火势小些再走',
            consequence: {
              immediateEffects: { health: -10, mood: 10 },
              relationChange: 20,
              endingNarrative: '你抱着孩子躲到了远离火源的一间屋子里。浓烟越来越浓，你把自己的衣襟撕下来给孩子捂住口鼻。好在街坊们很快提来了水，火势渐渐被控制住了。你抱着孩子走出来时，所有人都鼓起了掌。',
              nextPhase: null,
            },
          },
        ],
      },
      phase2b: {
        phaseId: 'phase2b',
        narrative: '你站在街上大喊："着火了！快来人！"有人端着水盆跑过来，有人拆了隔壁的木板防火墙。你指挥着众人排成一排，一桶接一桶地传水。',
        choices: [
          {
            id: 'lead_firefight',
            text: '带头冲到最前面灭火',
            condition: { field: 'health', operator: 'gte', value: 40 },
            consequence: {
              immediateEffects: { health: -10, mood: 15, social: 10 },
              relationChange: 15,
              endingNarrative: '你提着水桶冲在最前面，一次次往火头上泼水。手臂被灼热的气浪烤得通红，但你咬牙不退。终于，在众人的合力下，大火被扑灭了。你瘫坐在地上，满脸黑灰，但心中满是温暖。',
              nextPhase: null,
            },
          },
          {
            id: 'organize_bucket_line',
            text: '组织水桶接力，在后方协调',
            consequence: {
              immediateEffects: { mood: 10, social: 8 },
              relationChange: 10,
              endingNarrative: '你指挥得井井有条：一排人传水，一排人拆火墙。很快街坊们就有了章法，火势被控制住了。事后有人拍着你的肩膀说："多亏你指挥得当，不然这半条街都保不住。"',
              nextPhase: null,
            },
          },
        ],
      },
      phase2c: {
        phaseId: 'phase2c',
        narrative: '你趁火场混乱，偷偷溜回自己家，把铜钱和值钱的东西塞进包袱里。',
        choices: [
          {
            id: 'also_help',
            text: '搬完自己的东西，也去帮忙救火',
            consequence: {
              immediateEffects: { mood: 5, social: 5 },
              relationChange: 5,
              endingNarrative: '你把自家东西搬到安全的地方后，犹豫了一下，还是跑去帮忙了。虽然出手晚了些，但总算出了力。街坊们也没说什么。',
              nextPhase: null,
            },
          },
          {
            id: 'just_leave',
            text: '东西搬完就走，不管别人的事',
            consequence: {
              immediateEffects: { mood: -10, social: -15 },
              relationChange: -10,
              endingNarrative: '你抱着包袱站在远处，看着街坊们手忙脚乱地救火。有人朝你喊了一声"来帮把手"，你假装没听见。事后，街坊们看你的眼神明显冷淡了许多。那场火虽然灭了，但有一间房子烧塌了，孩子也受了伤。',
              nextPhase: null,
            },
          },
        ],
      },
    },
    weight: 2,
    cooldownTicks: 60,
    tags: ['crisis', 'fire', 'heroic'],
  },
  {
    id: 'ps_theft_witness',
    name: '目击偷窃',
    description: '亲眼看到有人偷东西，是否揭发？',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['east_market', 'center_street'],
    },
    participants: [
      { role: '小偷', minCount: 1, requiredTraits: ['狡猾'] },
      { role: '受害者', minCount: 1, requiredTraits: ['善良', '胆小'] },
    ],
    openingNarrative: '你在{location}闲逛时，眼角余光瞥见一个鬼鬼祟祟的身影正悄悄靠近一个路人，一只手已经伸向了对方的钱袋。',
    entryPhase: 'phase1',
    phases: {
      phase1: {
        phaseId: 'phase1',
        narrative: '那小偷动作极快，眼看就要得手了。你如果出声，可能会被报复；如果不出声，受害者就要损失钱财。',
        choices: [
          {
            id: 'yell_thief',
            text: '大喊"抓小偷！"',
            condition: { field: 'honor', operator: 'gte', value: 40 },
            consequence: { nextPhase: 'phase2a' },
          },
          {
            id: 'quiet_alert',
            text: '悄悄走到受害者身边，低声提醒',
            consequence: { nextPhase: 'phase2b' },
          },
          {
            id: 'grab_hand',
            text: '一把抓住小偷的手',
            condition: { field: 'health', operator: 'gte', value: 50 },
            consequence: {
              nextPhase: 'phase2c',
              immediateEffects: { health: -5 },
            },
          },
          {
            id: 'look_away',
            text: '假装没看见，走开',
            consequence: {
              endingNarrative: '你移开了目光，快步走开。身后传来"我的钱！"的惊呼声。你加快脚步，心里有一种说不出的滋味。',
              immediateEffects: { mood: -5 },
              nextPhase: null,
            },
          },
        ],
      },
      phase2a: {
        phaseId: 'phase2a',
        narrative: '你大喊一声"抓小偷！"小偷被吓了一跳，手一抖钱袋掉在了地上。他恶狠狠地瞪了你一眼，转身就跑。',
        choices: [
          {
            id: 'chase',
            text: '追上去',
            condition: { field: 'health', operator: 'gte', value: 40 },
            consequence: {
              immediateEffects: { mood: 10, social: 5 },
              relationChange: 10,
              endingNarrative: '你追了两条街，小偷终于被你堵在了死胡同里。巡城甲士闻讯赶来，把他押走了。受害者感激不尽，街坊们也纷纷称赞你勇敢。',
              nextPhase: null,
            },
          },
          {
            id: 'help_victim',
            text: '不追了，先看看受害者有没有损失',
            consequence: {
              immediateEffects: { mood: 5, social: 3 },
              relationChange: 8,
              endingNarrative: '你走过去帮受害者捡起散落的铜钱。他连声道谢："多亏你喊了一声，不然钱袋就没了。"小偷虽然跑了，但总算保住了别人的财产。',
              nextPhase: null,
            },
          },
        ],
      },
      phase2b: {
        phaseId: 'phase2b',
        narrative: '你悄悄走到受害者身边，低声说："注意你的钱袋。"受害者一摸口袋，果然发现有人在动歪心思。',
        choices: [
          {
            id: 'point_out',
            text: '指出小偷是谁',
            consequence: {
              immediateEffects: { mood: 5, social: 5 },
              relationChange: 12,
              endingNarrative: '受害者大声呵斥小偷，周围的人围了上来。小偷见势不妙，丢下钱袋灰溜溜地跑了。受害者感谢你的提醒，还请了你一杯茶。',
              nextPhase: null,
            },
          },
        ],
      },
      phase2c: {
        phaseId: 'phase2c',
        narrative: '你一把抓住小偷的手腕！小偷吃了一惊，挣扎着想甩开你。',
        choices: [
          {
            id: 'hold_firm',
            text: '死死抓住不放，喊人来帮忙',
            consequence: {
              immediateEffects: { health: -8, mood: 10, social: 8 },
              relationChange: 15,
              endingNarrative: '你死死扣住小偷的手腕，他拼命挣扎但甩不掉。巡城甲士听到喊声赶来，把他铐走了。受害者跑来道谢，围观的人向你投来敬佩的目光。',
              nextPhase: null,
            },
          },
        ],
      },
    },
    weight: 3,
    cooldownTicks: 15,
    tags: ['crime', 'witness', 'heroic'],
  },
];
