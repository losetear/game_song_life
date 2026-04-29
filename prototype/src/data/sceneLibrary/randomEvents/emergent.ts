// === 涌现随机事件 — Emergent Random Events ===
//
// 轻量级随机事件（1-2幕），场景转换间插入。
// 宋代汴京日常生活中的意外遭遇，强调玩家选择与后果。
// 包含：偷听密语、目击行窃、路人争吵、迷路幼童、街头艺人、官府队伍

import { RandomEvent } from '../../../ai/sceneLibrary/types';

export const EMERGENT_RANDOM_EVENTS: RandomEvent[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 偷听密语 — Overhearing Secrets
  // 任何地点都有可能听到不该听的对话。
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_emergent_overhear_secrets',
    name: '偷听密语',
    description: '无意中听到两个人的私密对话，涉及一桩不可告人的秘密。可以选择假装没听见、仔细偷听、或现身让对方知道。',
    trigger: {
      // 任何地点、任何时间皆可触发
    },
    weight: 2,
    cooldownTicks: 25,
    scene: {
      id: 're_emergent_overhear_secrets',
      name: '偷听密语',
      description: '无意中听到两个人的私密对话',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '你正经过一处僻静的角落，忽然听到墙壁后面传来压低了嗓音的交谈。两个人似乎在争论什么，语气急切而隐秘。你下意识放轻了脚步——',
      entryPhase: 'overhear_1',
      phases: {
        overhear_1: {
          phaseId: 'overhear_1',
          narrative:
            '透过半掩的门窗，隐约能看见两个身影。其中一人将一卷文书塞进袖中，低声道："东西在此，三日内若不把账册销毁，你我都要掉脑袋。"另一人咬牙道："我知道了，但那账房先生嘴巴不严，得先想个法子堵住他的嘴。"两人又压低了声音，你只能听到断断续续的几个词——"知县""库银""失火"。',
          choices: [
            {
              id: 'listen_carefully',
              text: '屏息凝神，继续偷听下去。',
              consequence: {
                resolution: {
                  type: 'chance',
                  successChance: 45,
                },
                tieredResults: {
                  success: {
                    narrative:
                      '你又听了片刻，终于拼凑出事情的全貌——有人在挪用官府库银，打算纵火销毁账册。这是天大的把柄。你悄悄退开，心跳如鼓。手中的这个秘密，既可能是升官发财的阶梯，也可能是杀身之祸的开端。',
                    effects: { mood: -5 },
                  },
                  failure: {
                    narrative:
                      '你不小心踩到了一根枯枝，"咔嚓"一声在寂静中格外刺耳。里面的对话戛然而止，紧接着门窗"砰"地被推开。你与里面的人四目相对——一个穿皂衣的中年人，目光阴鸷如刀。"你听到了多少？"他的声音像从牙缝里挤出来的。你装作若无其事地摆了摆手："路过，路过。"快步走开了。但你能感觉到那道目光一直钉在你背上，直到你拐过街角。',
                    effects: { mood: -8, health: -2 },
                  },
                },
                nextPhase: null,
              },
            },
            {
              id: 'pretend_nothing',
              text: '赶紧走开，这种事少沾为妙。',
              consequence: {
                immediateEffects: { mood: -3 },
                nextPhase: null,
                endingNarrative:
                  '你深吸一口气，转身快步离开。有些事情不知道比知道好，这个道理你明白。走出几条街之后，那两人的对话内容已经模糊了，但"掉脑袋"三个字还在你脑海里回响。你不由得加快了脚步。',
              },
            },
            {
              id: 'reveal_presence',
              text: '故意咳嗽一声，让他们知道有人。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '勇敢',
              },
              consequence: {
                immediateEffects: { mood: -5, social: -3 },
                nextPhase: null,
                endingNarrative:
                  '你清了清嗓子，重重地咳嗽了一声。里面顿时一片死寂。片刻后，门开了，一个面容阴沉的中年人走出来，上下打量着你。他挤出一个笑容："这位兄台，多有冒犯，我们在谈些买卖上的私事。"另一个人的目光却像在评估一个威胁。你点了点头，不紧不慢地走开了。你知道自己被记住了——至于是福是祸，还要走着瞧。',
              },
            },
          ],
        },
      },
      weight: 2,
      cooldownTicks: 25,
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 目击行窃 — Witnessing a Theft
  // 市集或街巷中目睹小偷行窃，道德抉择。
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_emergent_witness_theft',
    name: '目击行窃',
    description: '在热闹的市集或街巷中，亲眼目睹一个小偷将手伸进别人的钱袋。',
    trigger: {
      location: ['east_market', 'west_market', 'south_street', 'north_street', 'market'],
    },
    weight: 3,
    cooldownTicks: 20,
    scene: {
      id: 're_emergent_witness_theft',
      name: '目击行窃',
      description: '目睹小偷行窃，做出道德抉择',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '人来人往的市集上，叫卖声此起彼伏。你的目光无意间扫过人群，忽然捕捉到一个不和谐的画面——一个瘦小的身影正贴在一个衣着体面的商人身后，灵巧的手指已经探入了商人的钱袋。',
      entryPhase: 'theft_1',
      phases: {
        theft_1: {
          phaseId: 'theft_1',
          narrative:
            '那小偷手法极为老练，三两下便从商人腰间摸出了一只鼓囊囊的钱袋，迅速塞入自己袖中。商人浑然不觉，正和一个布匹贩子讨价还价。小偷转身就要消失在人群中——你只有一瞬间的反应时间。',
          choices: [
            {
              id: 'grab_thief',
              text: '一把抓住小偷的手腕！',
              consequence: {
                immediateEffects: { mood: 8, social: 10 },
                nextPhase: 'theft_2a',
              },
            },
            {
              id: 'shout_warning',
              text: '冲商人喊："小心你的钱袋！"',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: 'theft_2b',
              },
            },
            {
              id: 'let_it_go',
              text: '装作没看见，少管闲事。',
              consequence: {
                immediateEffects: { mood: -5 },
                nextPhase: null,
                endingNarrative:
                  '你移开了目光，继续走自己的路。身后人群熙熙攘攘，没有人注意到那一幕。走了几步，你回头看了一眼——商人还在和布匹贩子讨价还价，丝毫不知钱袋已经轻了许多。那个瘦小的身影早已消失在人群中。你摇了摇头，说不清是庆幸还是愧疚。',
              },
            },
          ],
        },
        theft_2a: {
          phaseId: 'theft_2a',
          narrative:
            '你一个箭步冲上去，死死扣住了小偷的手腕。那人吃了一惊，挣扎着想甩开你，但你抓得紧紧的。"干什么！放开我！"他压着嗓子叫道，面露凶光。周围的路人开始围拢过来。商人听到动静回过头来，一摸腰间——钱袋没了。他脸色大变。',
          choices: [
            {
              id: 'return_to_owner',
              text: '从小偷袖中搜出钱袋，还给商人。',
              consequence: {
                immediateEffects: { mood: 10, social: 12, copper: 5 },
                nextPhase: null,
                endingNarrative:
                  '你一把从小偷袖中拽出钱袋，商人接过来一数，一文不少。他激动地朝你连连作揖："多谢壮士！这里面有五十多文呢，丢了可如何是好！"他从钱袋里摸出几文要酬谢你，你推辞了一番，最终还是收下了。围观的路人纷纷叫好。小偷见势不妙，趁众人不备一溜烟跑了，但今天这条街上怕是没人再敢让他得手。',
              },
            },
            {
              id: 'demand_cut',
              text: '暗示商人分你一些好处。',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '贪婪',
              },
              consequence: {
                immediateEffects: { copper: 15, mood: -3, social: -5 },
                nextPhase: null,
                endingNarrative:
                  '你抓住小偷，但没急着把钱袋还回去。你看了商人一眼，又看了看钱袋，意思是明摆着的。商人犹豫了一下，从袋中数了十五文递给你："算是谢礼。"你接过来放走了小偷。钱是到手了，但周围几个路人的目光让你不太自在。有人小声嘀咕了句什么，你装没听见，转身走了。',
              },
            },
          ],
        },
        theft_2b: {
          phaseId: 'theft_2b',
          narrative:
            '你扯开嗓子喊了一声："小心你的钱袋！"商人一惊，下意识摸向腰间——果然空了。他抬头四望，正看到那个瘦小的身影混在人群中匆匆远去。"抓贼啊！"商人喊了一声，但市集上人声嘈杂，没几个人注意到。小偷已经快消失在人群中了。',
          choices: [
            {
              id: 'chase_thief',
              text: '追上去！不能让他跑了！',
              condition: {
                field: 'health',
                operator: 'gte',
                value: 40,
              },
              consequence: {
                resolution: {
                  type: 'chance',
                  successChance: 55,
                },
                tieredResults: {
                  success: {
                    narrative:
                      '你拨开人群追了上去，在一条窄巷尽头堵住了小偷。他无路可退，乖乖交出了钱袋。你把钱袋带回给了商人，他激动得几乎要给你跪下。"兄弟！汴京城里还是好人多啊！"他拉着你要请你去喝茶，你婉言谢绝了。这一追，倒追出了几分侠气。',
                    effects: { mood: 10, social: 12, fatigue: -5 },
                  },
                  failure: {
                    narrative:
                      '你追了三条街，还是被小偷甩掉了。这人在汴京的巷弄里如鱼得水，你一个转弯就不见了他的踪影。你扶着墙喘了半天粗气，空着手回去找商人。他倒也没怪你，只是苦笑着叹了口气："算了，你尽力了。"',
                    effects: { mood: -3, fatigue: -8 },
                  },
                },
                nextPhase: null,
              },
            },
            {
              id: 'comfort_victim',
              text: '追不上了，安慰一下商人吧。',
              consequence: {
                immediateEffects: { mood: 2, social: 3 },
                nextPhase: null,
                endingNarrative:
                  '你走到商人身边，拍了拍他的肩膀："节哀。汴京城里鱼龙混杂，下次小心些。"商人苦笑着摇头："做生意十几年，头一回被偷。"你帮他报了巡检铺，虽然找回的希望不大，但至少走了个流程。商人叹了口气，重新支起了摊子。日子还得过。',
              },
            },
          ],
        },
      },
      weight: 3,
      cooldownTicks: 20,
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 路人争吵 — Street Argument
  // 任何地点都可能遇到的日常争执，调解或围观。
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_emergent_street_argument',
    name: '路人争吵',
    description: '两个路人因为鸡毛蒜皮的小事吵得不可开交，路人围观议论纷纷。可以选择劝架、煽风点火或袖手旁观。',
    trigger: {
      // 任何地点皆可触发
    },
    weight: 4,
    cooldownTicks: 15,
    scene: {
      id: 're_emergent_street_argument',
      name: '路人争吵',
      description: '两个路人激烈争吵，日常冲突',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '街上一阵喧哗引起了你的注意。两个汉子面红耳赤地对着骂，一个叉着腰，一个拍着大腿，唾沫星子飞了半丈远。围观的人越来越多，有的窃窃私语，有的起哄叫好，还有的远远绕开，生怕溅了一身泥。你走近几步，听出了个大概——好像是因为走路撞了一下肩膀，谁也不肯认错。',
      entryPhase: 'argument_1',
      phases: {
        argument_1: {
          phaseId: 'argument_1',
          narrative:
            '甲方的汉子膀大腰圆，指着对方鼻子骂道："你走路不长眼啊！撞了人还理直气壮！"乙方是个精瘦的中年人，也不甘示弱："你那膀子像堵墙似的，谁撞谁还不一定呢！"两人越吵越凶，眼看就要动手。周围的路人有的劝"算了算了"，有的却幸灾乐祸地叫"打一架"。',
          choices: [
            {
              id: 'step_in_peace',
              text: '挤到中间劝架："消消气，都是街坊，犯不着。"',
              consequence: {
                immediateEffects: { mood: 3, social: 5 },
                nextPhase: 'argument_2a',
              },
            },
            {
              id: 'egg_on',
              text: '在旁边起哄："打！打起来才好看！"',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '调皮',
              },
              consequence: {
                immediateEffects: { mood: 5, social: -5 },
                nextPhase: null,
                endingNarrative:
                  '你跟着人群起哄，喊了两嗓子"打起来"。两个汉子被周围人的叫嚣声刺激得更来劲了，推搡之间真的动起了手。一阵混乱之后，甲方被打出了鼻血，乙方也被扯破了衣裳。巡检闻讯赶来，两人连同几个起哄最凶的都被带走了。你赶紧缩在人群里溜了。回头看时，心里有点不是滋味——不就是起个哄嘛，谁知道真打起来了。',
              },
            },
            {
              id: 'call_guard',
              text: '转身去找巡检来处理。',
              consequence: {
                immediateEffects: { mood: 2, social: 3 },
                nextPhase: null,
                endingNarrative:
                  '你没闲着，转身跑去找了附近的巡检铺。两个巡检很快赶到，把争吵的两人分开。一顿训斥之后，两人各自消停了。巡检朝你点了点头："还是这位通情达理。"你笑了笑，心里倒也踏实。街上恢复了平静，叫卖声重新填满了空气，好像刚才那场闹剧从未发生过。',
              },
            },
          ],
        },
        argument_2a: {
          phaseId: 'argument_2a',
          narrative:
            '你挤到两人中间，张开双臂把他们隔开。"二位消消气，何必为这点小事伤了和气？"你先安抚了甲方："大哥，撞一下又不少块肉，你先消消气。"又转向乙方："这位也是，说句软话又不丢人。"两人虽然嘴上还哼哼唧唧，但火气已经消了大半。',
          choices: [
            {
              id: 'buy_drinks_peace',
              text: '请两人喝碗浆水，化干戈为玉帛。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 3,
              },
              consequence: {
                immediateEffects: { copper: -3, mood: 8, social: 10 },
                nextPhase: null,
                endingNarrative:
                  '你花了三文钱买了三碗浆水，一人一碗。两个汉子端着碗互相看了一眼，甲方先绷不住笑了："算了算了，为这点事吵半天，倒是让这位破费了。"乙方也笑了，把碗一碰："是我不对，走路毛毛躁躁的。"两人居然聊了起来，还发现是同一个坊的邻居。你在旁边看着，觉得这三文钱花得值当。',
              },
            },
            {
              id: 'leave_them_be',
              text: '劝得差不多了，见好就收。',
              consequence: {
                immediateEffects: { mood: 3, social: 5 },
                nextPhase: null,
                endingNarrative:
                  '见两人消了气，你拍了拍手准备走人。甲方忽然叫住你："等等，你是哪个坊的？回头请你喝酒。"你笑着摆了摆手："举手之劳，不必放在心上。"乙方也冲你抱了抱拳。你转身走了，身后传来两人有一搭没一搭的闲聊声。汴京城大，人情味倒也不少。',
              },
            },
          ],
        },
      },
      weight: 4,
      cooldownTicks: 15,
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. 迷路幼童 — Lost Child
  // 任何地点都可能遇到迷路的孩子，温情或风险。
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_emergent_lost_child',
    name: '迷路幼童',
    description: '在街头发现一个与家人走散的小童，啼哭不止。可以选择帮忙寻找家人、带孩子去报官、或交给旁人处理。',
    trigger: {
      // 任何地点皆可触发
    },
    weight: 3,
    cooldownTicks: 30,
    scene: {
      id: 're_emergent_lost_child',
      name: '迷路幼童',
      description: '发现迷路的幼童，做出善意选择',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '你听到一阵细弱的哭声，循声望去，只见路边的石阶上蹲着一个四五岁的小童，扎着两个小揪揪，手里攥着一只泥老虎，哭得满脸是泪。周围来来往往的行人匆匆而过，有人看了一眼便走开了，有人摇头叹了口气。小童抬头看了看经过的每一个人，眼里满是惶恐和无助。',
      entryPhase: 'lost_child_1',
      phases: {
        lost_child_1: {
          phaseId: 'lost_child_1',
          narrative:
            '小童看到你走近，止住了哭泣，怯生生地望着你。你蹲下身来，尽量让自己看起来不那么可怕。"小家伙，你家大人呢？"你轻声问道。小童吸了吸鼻涕，奶声奶气地说："娘亲……娘亲去买糖人，让我在这里等……等了好久好久，娘亲没有回来……"说着又要哭出来。你看了看四周，并没有看到焦急寻人的家长。',
          choices: [
            {
              id: 'stay_and_wait',
              text: '陪着孩子在原地等，家长应该很快会回来找。',
              consequence: {
                immediateEffects: { fatigue: -3 },
                nextPhase: 'lost_child_2a',
              },
            },
            {
              id: 'search_together',
              text: '牵着孩子的手，去附近找找他家人。',
              consequence: {
                immediateEffects: { fatigue: -5 },
                nextPhase: 'lost_child_2b',
              },
            },
            {
              id: 'take_to_guard',
              text: '把孩子送到巡检铺，让公人来处理。',
              consequence: {
                immediateEffects: { social: 5, fatigue: -3 },
                nextPhase: null,
                endingNarrative:
                  '你牵着小童的手，朝最近的巡检铺走去。小童紧紧攥着你的手指，另一只手还抱着那只泥老虎。到了巡检铺，值班的差役把孩子接了过去，夸你做得对："丢孩子的事时有发生，放在这里最稳妥，家长一定会来找的。"你叮嘱了差役几句才离开。走出门口时回头看了一眼，小童正坐在条凳上，两只脚够不着地，晃啊晃的。但愿他娘亲快点来。',
              },
            },
          ],
        },
        lost_child_2a: {
          phaseId: 'lost_child_2a',
          narrative:
            '你在孩子身边坐了下来。小童起初还有些怕生，但见你没什么恶意，便慢慢安静了下来。他给你看他的泥老虎，说是"爹爹买的"。你有一搭没一搭地和他聊天，得知他叫"石头"，家就在附近的坊巷里。等了大约半柱香的功夫，远处忽然传来一个女人焦急的呼喊："石头！石头——！"',
          choices: [
            {
              id: 'reunite_mother',
              text: '应一声，把孩子送过去。',
              consequence: {
                immediateEffects: { mood: 12, social: 8 },
                nextPhase: null,
                endingNarrative:
                  '你站起来冲那妇人挥了挥手。她跑过来，一把搂住小童，眼泪扑簌簌地掉下来。"石头！你吓死娘了！"小童被搂得喘不过气，但还是紧紧抱住了母亲的脖子。妇人缓过神来，连连向你道谢："多谢多谢！方才买糖人时人多，一转眼孩子就不见了，我急得都快疯了……"她从篮子里拿出两个刚买的糖人，硬塞给你一个。你笑着接过来，看着母子俩手拉手远去的背影，觉得这糖人格外甜。',
              },
            },
            {
              id: 'stay_back',
              text: '让孩子自己喊一声，在旁边看着就好。',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你轻轻拍了拍石头的肩膀："你娘来了，快应一声。"小童扯着嗓子喊了一声"娘——！"妇人循声跑来，一把抱住了孩子。母子团聚的一幕让周围几个路人也不禁露出笑容。你悄悄站起来，拍了拍衣上的灰，转身走了。做了件好事，心里舒坦。',
              },
            },
          ],
        },
        lost_child_2b: {
          phaseId: 'lost_child_2b',
          narrative:
            '你牵着石头的小手，顺着他说的大致方向在附近找了起来。石头记得家门口有一棵大槐树，旁边是一家卖炊饼的铺子。你带着他在坊巷里转了几圈，逢人便问有没有人丢了孩子。有的大婶摇头，有的说见过这对母子。石头走了两条街就走不动了，你把他背了起来，小家伙趴在你背上，泥老虎硌得你后背生疼。',
          choices: [
            {
              id: 'keep_searching',
              text: '再坚持找找，一定能在附近找到。',
              consequence: {
                resolution: {
                  type: 'chance',
                  successChance: 65,
                },
                tieredResults: {
                  success: {
                    narrative:
                      '又走了半条街，你终于看到了一棵粗壮的老槐树，树旁果然有一间炊饼铺。石头在你背上喊了一声"到了！"你放下他，他的母亲正坐在铺子门前抹眼泪，看到石头的瞬间猛地站起来，冲过来跪在地上紧紧搂住了孩子。"我的儿啊！"她的哭声引得左邻右舍纷纷探头。石头被搂得咯咯笑，还不忘指着你说："娘，是这个大哥哥带我回来的。"妇人朝你连连磕头，你赶紧扶她起来，说了几句安慰的话便告辞了。背后传来石头稚嫩的声音："大哥哥再见！"',
                    effects: { mood: 15, social: 10, fatigue: -8 },
                  },
                  failure: {
                    narrative:
                      '你在坊巷里转了好一阵，但始终没有找到石头说的那棵大槐树。天色渐暗，石头的眼皮也越来越沉。你最终决定带他去巡检铺，让公人帮忙寻亲。石头在你背上睡着了，小手还紧紧攥着那只泥老虎。到了巡检铺，差役把孩子接过去安置好，说你做得对。你走出巡检铺，夜风一吹，背上有些凉——那是孩子趴了一路的余温。',
                    effects: { mood: 3, fatigue: -10 },
                  },
                },
                nextPhase: null,
              },
            },
            {
              id: 'ask_around',
              text: '停下来请路人帮忙一起找。',
              consequence: {
                immediateEffects: { social: 8, fatigue: -5 },
                nextPhase: null,
                endingNarrative:
                  '你在坊巷口停下来，把石头的情况告诉了几个大婶和一个卖豆腐的大叔。他们一听有孩子走丢了，纷纷热心帮忙。不一会儿就有十几个人在附近帮忙喊、帮忙找。不到半炷香功夫，远处传来一个妇人撕心裂肺的呼喊——"石头！"石头在你背上一下子弹了起来："娘亲！"母子重逢的场面让在场的人都红了眼眶。妇人拉着你的手说了无数声谢谢，又转身感谢帮忙的街坊们。你站在人群边上，心里暖暖的，觉得汴京城虽大，人心还是暖的。',
              },
            },
          ],
        },
      },
      weight: 3,
      cooldownTicks: 30,
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. 街头艺人 — Street Performer
  // 市集或街巷中遇到卖艺的民间艺人，欣赏或资助。
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_emergent_street_performer',
    name: '街头艺人',
    description: '在市集或街巷遇到一位街头卖艺的民间艺人，技艺精湛但生计艰难。可以选择打赏、学艺、或者帮忙招揽客人。',
    trigger: {
      location: ['east_market', 'west_market', 'south_street', 'north_street', 'market', 'street'],
    },
    weight: 4,
    cooldownTicks: 18,
    scene: {
      id: 're_emergent_street_performer',
      name: '街头艺人',
      description: '遇见街头卖艺的民间艺人',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '一阵清越的笛声穿过喧嚣的市集，吸引了你的注意。循声而去，只见一位白发苍苍的老者坐在街角，手持一根斑竹笛，吹奏着一支你从未听过的曲子。那曲调时而高亢如鹤唳九天，时而低回如溪涧潺潺。他的面前摆着一只破碗，里面只有零星几文铜钱。围观的人不多，但驻足的人无一不被那笛声所动。',
      entryPhase: 'performer_1',
      phases: {
        performer_1: {
          phaseId: 'performer_1',
          narrative:
            '老者一曲终了，缓缓放下竹笛。他的衣衫打了好几个补丁，手指上满是老茧，但握笛的姿态却稳如泰山。他朝围观的人拱了拱手，嗓音苍老却中气十足："老朽不才，一曲《鹧鸪飞》献丑了。若还入得了各位的耳，赏几文铜钱，够买个炊饼填填肚子便是。"围观的人群中有人丢了几文钱，但多数人只是看了一眼便走开了。',
          choices: [
            {
              id: 'tip_generously',
              text: '慷慨打赏十文铜钱。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 10,
              },
              consequence: {
                immediateEffects: { copper: -10, mood: 10, social: 5 },
                nextPhase: null,
                endingNarrative:
                  '你从怀中摸出十文铜钱，轻轻放入碗中，铜钱碰出清脆的声响。老者抬起头来，浑浊的双眼里闪过一丝光亮。他郑重地朝你鞠了一躬："多谢这位小哥。"然后又举起竹笛，吹起了另一支曲子——这支更加婉转动听，像是专门为你而奏。你在街角站了好一会儿，听得入了神。身旁有人被笛声吸引也停下了脚步，碗里的铜钱渐渐多了几枚。你不知道老者的故事，但那笛声里的味道，你听懂了。',
              },
            },
            {
              id: 'request_song',
              text: '上前攀谈，请老者再奏一曲。',
              consequence: {
                immediateEffects: { mood: 8 },
                nextPhase: 'performer_2',
              },
            },
            {
              id: 'help_attract',
              text: '帮忙吆喝几句，给他招揽听众。',
              consequence: {
                immediateEffects: { social: 8, mood: 5, fatigue: -3 },
                nextPhase: null,
                endingNarrative:
                  '你站在老者身旁，冲着来往的行人吆喝："来来来，都听听！好听的笛子，错过可惜了！"你的嗓门不小，果然吸引了不少人停下脚步。老者见来了听众，精神一振，又吹了一曲。围观的人渐渐多了起来，有人跟着打起了拍子，有人往碗里丢铜钱。一曲终了，碗里竟然多了二十多文。老者朝你连连点头，眼里满是感激。你摆了摆手，听着身后又响起的笛声，继续赶路。',
              },
            },
            {
              id: 'walk_past',
              text: '好听归好听，还有事要忙，走了。',
              consequence: {
                immediateEffects: { mood: 2 },
                nextPhase: null,
                endingNarrative:
                  '你驻足听了片刻，那笛声确实好听。但手头还有事，你便继续赶路了。笛声在你身后渐渐远去，混入市井的嘈杂之中。走了几步，你忽然觉得那曲调好像还在耳边回响。你回头看了一眼——老者还在吹着，面前的人换了又换。你微微摇头，转身消失在人群中。',
              },
            },
          ],
        },
        performer_2: {
          phaseId: 'performer_2',
          narrative:
            '你走过去和老者攀谈起来。他姓孙，年轻时曾是汴京教坊司的乐师，后来年纪大了被裁了出来，如今只能靠街头卖艺糊口。他叹了口气："教坊里如今都是年轻人，谁还稀罕老头子的笛声。"但说起笛子，他的眼睛便亮了起来。他从布袋里又取出一支短笛，比之前那支更小巧精致。"这是老朽压箱底的家伙，用泰山斑竹做的，跟了我四十年。"',
          choices: [
            {
              id: 'buy_flute',
              text: '出五十文把这支短笛买下来。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 50,
              },
              consequence: {
                immediateEffects: { copper: -50, mood: 12 },
                nextPhase: null,
                endingNarrative:
                  '老者愣了一下，迟疑地摸了摸那支短笛，像是舍不得。但最终还是递了过来："你若识货，这笛子便不算明珠暗投了。"他把笛子擦了又擦，又教了你几个基本的指法。你接过来试了试，音色清亮圆润，果然是件好物。老者把铜钱收进怀里，拍了拍你的肩膀："年轻人，好好吹。"你握着短笛，看着他佝偻的背影被夕阳拉得很长很长。手里的笛子微凉，却像握着一段故事。',
              },
            },
            {
              id: 'learn_melody',
              text: '请老者教你吹这支曲子。',
              consequence: {
                immediateEffects: { mood: 8, copper: -5, fatigue: -5 },
                nextPhase: null,
                endingNarrative:
                  '你把仅有的五文铜钱放进碗里，请老者教你吹那支《鹧鸪飞》。老者笑了笑，把竹笛递给你，手把手地教你按孔。你笨拙地吹了半天，只吹出了几声刺耳的怪音，但老者一直耐心地纠正你的指法和气息。"不急，不急，"他笑着说，"老朽当年学了三年才入门呢。"你在街角跟老者学了大半个时辰，终于能磕磕绊绊地吹出完整的旋律了。虽算不上好听，但那是你第一次用笛子吹出一支曲子。临走时老者冲你点了点头："有天赋，好好练。"',
              },
            },
          ],
        },
      },
      weight: 4,
      cooldownTicks: 18,
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. 官府队伍 — Official Procession
  // 官员出行，百姓须回避。权力与平民的日常碰撞。
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_emergent_official_procession',
    name: '官府队伍',
    description: '一队官差护卫着官员出行，鸣锣开道，百姓须回避让路。可以选择恭敬避让、偷偷观察、或试图趁乱做些什么。',
    trigger: {
      location: ['center_street', 'main_road', 'south_street', 'north_street'],
    },
    weight: 2,
    cooldownTicks: 40,
    scene: {
      id: 're_emergent_official_procession',
      name: '官府队伍',
      description: '官员出行，百姓回避',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '远处忽然传来"砰砰砰"的锣声，紧接着是一声声威严的吆喝："回避——！肃静——！"街上的人群如潮水般涌向两侧，摊贩们手忙脚乱地收摊，行人纷纷贴墙站好。一队皂衣差役手持水火棍，大摇大摆地开路而来。后面跟着数顶青布小轿，轿帘紧闭，看不清里面坐的是什么人物。',
      entryPhase: 'procession_1',
      phases: {
        procession_1: {
          phaseId: 'procession_1',
          narrative:
            '队伍浩浩荡荡地从街头推进过来。打头的是四名鸣锣的差役，后面是两排持棍护卫，再后面才是那几顶轿子。街边的百姓都低着头，大气不敢出。你注意到有人在队伍经过时偷偷抬眼张望，也有小贩趁机捡起被挤落的货物。队伍中间有一顶轿子的帘子微微掀起了一角，似乎里面的人在打量着街上的情形。',
          choices: [
            {
              id: 'bow_and_wait',
              text: '低头恭敬避让，等队伍过去。',
              consequence: {
                immediateEffects: { mood: -2 },
                nextPhase: null,
                endingNarrative:
                  '你低下头，老老实实地贴在墙根。队伍从你面前经过，差役的水火棍在地上敲得咚咚响，轿子的轮子碾过石板发出吱呀声。你能闻到轿子里飘出的熏香气味，与街上的汗臭和烟火气格格不入。过了好一会儿，队伍才走完。街上的百姓陆续散开，摊贩们重新支起摊子，一切好像什么也没发生过。只是你的耳朵还在嗡嗡响，那锣声实在太吵了。',
              },
            },
            {
              id: 'peek_at_official',
              text: '趁轿帘掀开的间隙，偷看一眼里面。',
              consequence: {
                resolution: {
                  type: 'chance',
                  successChance: 40,
                },
                tieredResults: {
                  success: {
                    narrative:
                      '你抬起头的角度恰到好处，正好对上轿帘掀起的那道缝隙。里面端坐着一个穿紫袍的中年官员，面容白净、双目如鹰，手中捏着一串檀木念珠，嘴角带着一丝不易察觉的冷笑。他的目光扫过街面，像在审视一群蝼蚁。在那一瞬间，他似乎也看到了你。四目相对，你打了个寒颤，赶紧低下头。但你已经记住了那张脸——在这个城里，记住一张有权的面孔，未必是坏事。',
                    effects: { mood: -3 },
                  },
                  failure: {
                    narrative:
                      '你正要抬头偷看，一个差役的目光忽然扫了过来。他举起水火棍朝你一指："那个！头低下去！"你赶紧缩了缩脖子，周围几个百姓也跟着吓了一跳。差役又瞪了你一眼才继续往前走。你感觉后背渗出了一层冷汗。在汴京，官威不可犯，这是铁打的规矩。',
                    effects: { mood: -8 },
                  },
                },
                nextPhase: null,
              },
            },
            {
              id: 'pick_pocket',
              text: '趁混乱之际，从旁边的摊贩或行人那里……',
              condition: {
                field: 'personality',
                operator: 'includes',
                value: '狡猾',
              },
              consequence: {
                resolution: {
                  type: 'chance',
                  successChance: 35,
                },
                tieredResults: {
                  success: {
                    narrative:
                      '所有人的注意力都被官府队伍吸引走了。你如一条游鱼般在人丛中穿梭，趁一个摊贩仰头看热闹的时候，眼疾手快地从摊子上顺走了一包蜜饯。你把蜜饯揣进袖中，继续低头站着，心跳得厉害。队伍走远了，人群散开，没有人注意到你的小动作。你找了个僻静的角落，打开蜜饯看了看——还挺新鲜。你嚼了一颗，酸甜酸甜的，心里却说不上是什么滋味。',
                    effects: { copper: 3, mood: -5 },
                  },
                  failure: {
                    narrative:
                      '你的手刚伸出去，就被旁边一个大婶一把攥住了手腕。"干什么呢你！"她大声嚷嚷起来。几个路人扭头看过来，差役也注意到了这边的动静。你赶紧缩回手，赔着笑脸说认错了摊子。大婶狠狠瞪了你一眼，但还是放你走了。你在众目睽睽之下灰溜溜地退到了人群后面，脸上火辣辣的。这个险冒得太不值了。',
                    effects: { mood: -12, social: -10 },
                  },
                },
                nextPhase: null,
              },
            },
          ],
        },
      },
      weight: 2,
      cooldownTicks: 40,
    },
  },
];
