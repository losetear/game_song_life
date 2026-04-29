// === 休闲场景 ===
// 说书擂台、诗会、豪赌

import {
  PlayerScene, PlayerSceneChoice, PlayerSceneStep,
  SceneVisualMeta,
} from '../../../ai/sceneLibrary/types';

export const PLAYER_LEISURE_SCENES: PlayerScene[] = [
  // ════════════════════════════════════════
  // 说书擂台 (4幕)
  // ════════════════════════════════════════
  {
    id: 'ps_storytelling_contest',
    name: '说书擂台',
    description: '茶楼中的说书比赛',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: false,
      location: ['tea_house'],
      timeOfDay: 'day',
      minNearbyNpcs: 3,
    },
    participants: [{ role: '听众', minCount: 1, maxCount: 3 }],
    openingNarrative: '茶楼里热闹非凡，今日是每月一次的说书擂台。台上醒木一拍，{npcName}正讲得绘声绘色。台下的茶客们忽然起哄："让新面孔也来讲一段！"',
    openingVisual: {
      background: 'teahouse',
      location: '汴京 · 茶楼大厅',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'storyteller', name: '{npcName}', glyph: '说', position: 'center', mood: 'happy' },
      ],
      dialogue: [
        { speaker: '茶客们', text: '来一段！来一段！' },
      ],
    },
    entryPhase: 'story_1',
    phases: {
      story_1: {
        phaseId: 'story_1',
        narrative: '众人的目光都投向了你。你可以讲一个英雄故事、一段凄美爱情、或者一个鬼故事。茶楼掌柜笑眯眯地说："讲得好，今晚茶钱免了。"',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼台前',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'st1_hero',
            text: '讲一个行侠仗义的英雄故事。',
            consequence: { nextPhase: 'story_2a' },
          },
          {
            id: 'st1_love',
            text: '讲一段刻骨铭心的爱情传奇。',
            consequence: { nextPhase: 'story_2b' },
          },
          {
            id: 'st1_ghost',
            text: '讲一个令人毛骨悚然的鬼故事。',
            consequence: { nextPhase: 'story_2c' },
          },
        ],
      },
      story_2a: {
        phaseId: 'story_2a',
        narrative: '你清了清嗓子，开始讲述一个侠客闯荡江湖的故事。讲到精彩处，手舞足蹈，台下听众屏息凝神。有人忍不住叫好，有人拍桌赞叹。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'happy' },
            { id: 'crowd', name: '听众', glyph: '众', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'st2a_grand',
            text: '越讲越投入，来个大场面收尾。',
            consequence: {
              immediateEffects: { mood: 5, copper: 3 },
              relationChange: 3,
              nextPhase: 'story_3',
            },
          },
          {
            id: 'st2a_twist',
            text: '在结尾来个出人意料的反转。',
            condition: { field: 'personality', operator: 'includes', value: '狡猾' },
            consequence: {
              immediateEffects: { mood: 6, copper: 5 },
              relationChange: 4,
              nextPhase: 'story_3',
            },
          },
        ],
      },
      story_2b: {
        phaseId: 'story_2b',
        narrative: '你缓缓道来一段月下誓言、一场生离死别的爱情。讲到动情处，茶楼里安静得能听到茶水冒泡的声音。有人偷偷擦了擦眼角。',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'sad' },
            { id: 'crowd', name: '听众', glyph: '众', position: 'right', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 'st2b_happy',
            text: '给故事一个团圆的结局。',
            consequence: {
              immediateEffects: { mood: 4, copper: 3 },
              relationChange: 2,
              nextPhase: 'story_3',
            },
          },
          {
            id: 'st2b_tragic',
            text: '讲一个催人泪下的悲剧结尾。',
            consequence: {
              immediateEffects: { mood: -2, copper: 5 },
              relationChange: 3,
              nextPhase: 'story_3',
            },
          },
        ],
      },
      story_2c: {
        phaseId: 'story_2c',
        narrative: '你压低声音，讲起了夜半无人时的诡异遭遇。说到"忽然，门吱呀一声开了"时，茶楼里恰好一阵风把窗户吹开——满堂惊叫！',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼（烛火摇曳）',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'neutral' },
            { id: 'crowd', name: '听众', glyph: '众', position: 'right', mood: 'sad' },
          ],
        },
        choices: [
          {
            id: 'st2c_relief',
            text: '赶紧揭开谜底，让大家松口气。',
            consequence: {
              immediateEffects: { mood: 3, copper: 4 },
              relationChange: 3,
              nextPhase: 'story_3',
            },
          },
          {
            id: 'st2c_more',
            text: '趁热打铁，再吓他们一跳。',
            consequence: {
              immediateEffects: { mood: -1, copper: 6 },
              relationChange: 2,
              nextPhase: 'story_3',
            },
          },
        ],
      },
      story_3: {
        phaseId: 'story_3',
        narrative: '故事讲完了，茶楼里掌声雷动。{npcName}走上前来，拱手道："后生可畏！这一段讲得比我强。"掌柜也端上一壶好茶："今儿茶钱免了，改日再来啊。"',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'center', mood: 'happy' },
            { id: 'storyteller', name: '{npcName}', glyph: '说', position: 'left', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'st3_humble',
            text: '"承让承让，下次还得向先生多请教。"',
            consequence: {
              relationChange: 4,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: '你谦逊的态度赢得了所有人的好感。{npcName}甚至邀请你下次一起合作说书。茶楼里的这一下午，让你觉得生活其实处处是舞台。',
            },
          },
          {
            id: 'st3_challenge',
            text: '"下次咱们正式比一场，分个高下！"',
            consequence: {
              relationChange: 2,
              immediateEffects: { mood: 4 },
              nextPhase: null,
              endingNarrative: '{npcName}哈哈大笑："好小子，有胆气！下月擂台，咱们一决高下！"茶客们已经开始期待下一场好戏了。',
            },
          },
        ],
      },
    },
    weight: 10,
    cooldownTicks: 8,
  },

  // ════════════════════════════════════════
  // 诗会 (3幕)
  // ════════════════════════════════════════
  {
    id: 'ps_poetry_gathering',
    name: '诗会',
    description: '文人雅集中的诗词唱和',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['书生', '秀才', '说书人'],
      location: ['tea_house', 'center_street'],
      timeOfDay: 'day',
    },
    participants: [{ role: '文友', minCount: 1, maxCount: 1 }],
    openingNarrative: '茶楼一角，几位文人雅士正在吟诗作对。{npcName}见你路过，招手道："来来来，正缺一位高手。今日以「春」为题，各赋一首，如何？"',
    openingVisual: {
      background: 'teahouse',
      location: '汴京 · 茶楼雅座',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'scholar', name: '{npcName}', glyph: '文', position: 'right', mood: 'happy' },
      ],
    },
    entryPhase: 'poem_1',
    phases: {
      poem_1: {
        phaseId: 'poem_1',
        narrative: '众人纷纷落座，笔墨纸砚已备好。{npcName}率先赋了一首，虽然中规中矩，倒也工整。轮到你了——',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼雅集',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'scholar', name: '{npcName}', glyph: '文', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'p1_original',
            text: '静心凝思，写一首原创的。',
            consequence: { nextPhase: 'poem_2a' },
          },
          {
            id: 'p1_match',
            text: '和{npcName}的诗，对一首。',
            consequence: { nextPhase: 'poem_2b' },
          },
          {
            id: 'p1_decline',
            text: '"我才疏学浅，就不献丑了。在一旁品鉴便好。"',
            consequence: {
              relationChange: 1,
              immediateEffects: { mood: 1 },
              nextPhase: null,
              endingNarrative: '你在一旁静静听了几首佳作。虽然没有参与，但耳濡目染，也有所感悟。文人相轻也好、惺惺相惜也罢，这茶楼里的风雅，也算是一种享受。',
            },
          },
        ],
      },
      poem_2a: {
        phaseId: 'poem_2a',
        narrative: '你提笔沉思片刻，一气呵成写就一首。众人传阅，有人频频点头，有人低声品评。{npcName}看完后眼睛一亮："妙！尤其是这句——"',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'scholar', name: '{npcName}', glyph: '文', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'p2a_modest',
            text: '"随手写的，见笑了。"',
            consequence: {
              relationChange: 5,
              immediateEffects: { mood: 4 },
              nextPhase: null,
              endingNarrative: '你的谦逊赢得了众人好感。{npcName}私下说："改日到我书房来，我有些好书借你。"这场诗会，让你交到了一个志趣相投的朋友。',
            },
          },
          {
            id: 'p2a_challenge',
            text: '"承蒙夸奖。不如再出一个题目？"',
            consequence: {
              relationChange: 3,
              immediateEffects: { mood: 5 },
              nextPhase: null,
              endingNarrative: '你又作了一首，虽不如第一首惊艳，但也足以让人刮目相看。诗会散后，{npcName}特地留下来说："你是我见过的最有灵气的年轻人之一。"',
            },
          },
        ],
      },
      poem_2b: {
        phaseId: 'poem_2b',
        narrative: '你照着{npcName}的韵脚和了一首。虽然技法上略显生涩，但意境却别出心裁。{npcName}抚掌笑道："有趣！这个角度我倒没想到。"',
        visual: {
          background: 'teahouse',
          location: '汴京 · 茶楼',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'scholar', name: '{npcName}', glyph: '文', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'p2b_learn',
            text: '"先生的功底深厚，还望不吝赐教。"',
            consequence: {
              relationChange: 6,
              immediateEffects: { mood: 3 },
              nextPhase: null,
              endingNarrative: '{npcName}欣然应允，此后每隔几日便在茶楼教你品诗论文。你虽然不是读书人，却也渐渐沾了几分书卷气。这段忘年之交，成了你人生中的一段佳话。',
            },
          },
        ],
      },
    },
    weight: 9,
    cooldownTicks: 7,
  },

  // ════════════════════════════════════════
  // 豪赌 (4幕)
  // ════════════════════════════════════════
  {
    id: 'ps_gambling_high_stakes',
    name: '豪赌',
    description: '一场步步升级的赌局',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['center_street', 'residential_north', 'residential_south'],
    },
    participants: [{ role: '赌友', minCount: 1, maxCount: 1 }],
    openingNarrative: '一间昏暗的屋子里，几张桌子上铜板堆积如山。{npcName}搓着手，眼中闪烁着兴奋的光芒。"来吧，今晚手气旺不旺，一试便知！"',
    openingVisual: {
      background: 'night_street',
      location: '汴京 · 地下赌坊',
      characters: [
        { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
        { id: 'gambler', name: '{npcName}', glyph: '赌', position: 'right', mood: 'happy' },
      ],
    },
    entryPhase: 'gamble_1',
    phases: {
      gamble_1: {
        phaseId: 'gamble_1',
        narrative: '第一局开始了。{npcName}摇了摇骰子："小赌怡情，先来十文热热手？"',
        visual: {
          background: 'night_street',
          location: '汴京 · 赌桌',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'gambler', name: '{npcName}', glyph: '赌', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'g1_bet',
            text: '"来！押大。"',
            condition: { field: 'copper', operator: 'gte', value: 20 },
            consequence: {
              immediateEffects: { copper: -10 },
              nextPhase: 'gamble_2',
            },
          },
          {
            id: 'g1_quit',
            text: '想了想，还是算了。"今晚不赌。"',
            consequence: {
              immediateEffects: { mood: -1 },
              nextPhase: null,
              endingNarrative: '你转身离开了赌坊。身后传来{npcName}的笑声和骰子的响声。也许这是对的——不赌就不会输。但心里多少有些不甘。',
            },
          },
        ],
      },
      gamble_2: {
        phaseId: 'gamble_2',
        narrative: '骰子停了——你赢了！铜板推到你面前，{npcName}的脸上闪过一丝不甘。"好手气！敢不敢加注？这次翻倍，二十文。"',
        visual: {
          background: 'night_street',
          location: '汴京 · 赌桌',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'happy' },
            { id: 'gambler', name: '{npcName}', glyph: '赌', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'g2_double',
            text: '"翻倍就翻倍！"',
            condition: { field: 'copper', operator: 'gte', value: 30 },
            consequence: {
              immediateEffects: { copper: -20 },
              nextPhase: 'gamble_3',
            },
          },
          {
            id: 'g2_take_win',
            text: '"见好就收，不赌了。"',
            consequence: {
              immediateEffects: { mood: 3, copper: 10 },
              nextPhase: null,
              endingNarrative: '你拿着赢来的铜板离开了赌坊。{npcName}在身后喊："可惜了，你今晚手气正旺啊！"你笑了笑，头也不回。赢的时候走，才是真赢家。',
            },
          },
          {
            id: 'g2_bluff',
            text: '虚张声势，装作胸有成竹地加注。',
            condition: { field: 'personality', operator: 'includes', value: '狡猾' },
            consequence: {
              immediateEffects: { copper: -15 },
              nextPhase: 'gamble_3',
            },
          },
        ],
      },
      gamble_3: {
        phaseId: 'gamble_3',
        narrative: '第二局结果揭晓——你输了！刚才赢的全赔了进去，还倒贴了本钱。{npcName}得意地笑着收铜板。"赌场就是这样，十赌九输。还来吗？"',
        visual: {
          background: 'night_street',
          location: '汴京 · 赌桌',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'sad' },
            { id: 'gambler', name: '{npcName}', glyph: '赌', position: 'right', mood: 'happy' },
          ],
        },
        choices: [
          {
            id: 'g3_allin',
            text: '"梭哈！把我剩下的全押上！"',
            condition: { field: 'copper', operator: 'gte', value: 30 },
            consequence: {
              immediateEffects: { copper: -30 },
              nextPhase: 'gamble_4',
            },
          },
          {
            id: 'g3_walk',
            text: '"认栽。今天就到这儿。"',
            consequence: {
              immediateEffects: { mood: -5 },
              nextPhase: null,
              endingNarrative: '你垂头丧气地走出了赌坊。口袋空了，心里更空。"十赌九输"，这四个字你终于亲身体会了。下次……下次再也不来了。大概。',
            },
          },
          {
            id: 'g3_cheat',
            text: '趁人不注意，做点手脚。',
            condition: { field: 'greed', operator: 'gte', value: 60 },
            consequence: {
              immediateEffects: { copper: 40, mood: -3 },
              relationChange: -5,
              nextPhase: null,
              endingNarrative: '你成功地做了手脚，赢回了一大笔。但{npcName}似乎察觉了什么，眼神变得阴冷。你带着铜板匆匆离开，却觉得背后有人盯着你。这笔钱，烫手得很。',
            },
          },
        ],
      },
      gamble_4: {
        phaseId: 'gamble_4',
        narrative: '你把所有铜板推到了桌子中央。骰子在碗中翻滚……所有人的呼吸都停了。碗揭开的那一刻——',
        visual: {
          background: 'night_street',
          location: '汴京 · 赌桌',
          characters: [
            { id: 'player', name: '你', glyph: '你', position: 'left', mood: 'neutral' },
            { id: 'gambler', name: '{npcName}', glyph: '赌', position: 'right', mood: 'neutral' },
          ],
        },
        choices: [
          {
            id: 'g4_fate',
            text: '等待命运的裁决……',
            consequence: {
              resolution: { type: 'chance', successChance: 0.35 },
              tieredResults: {
                critical_success: {
                  narrative: '双六！大赢！铜板哗啦啦地推到你面前。{npcName}目瞪口呆，半晌才挤出一句话："今天真是遇到财神了。"',
                  effects: { copper: 80, mood: 15 },
                },
                success: {
                  narrative: '你赢了！虽然不是大赢，但也把本钱赢回来了还多了一些。{npcName}苦笑着付了钱。',
                  effects: { copper: 40, mood: 8 },
                },
                partial_success: {
                  narrative: '平局。你没赢也没输。{npcName}松了口气，你却也觉得如释重负。',
                  effects: { copper: 0, mood: 0 },
                },
                failure: {
                  narrative: '你输了。所有的铜板都被收走了。{npcName}叹了口气："赌场无父子啊。"',
                  effects: { copper: -30, mood: -8 },
                },
              },
              nextPhase: null,
              endingNarrative: '赌局结束了。你走出赌坊，夜风一吹，才觉得后背全是冷汗。这一夜，不论是赢是输，你都明白了一个道理——赌桌上没有常胜将军。',
            },
          },
        ],
      },
    },
    weight: 8,
    cooldownTicks: 8,
  },
];
