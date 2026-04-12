// === 玩家多步骤演出 — 社交 (Player Social) ===
//
// 漫野奇谭式分支叙事场景，宋代背景。
// 包含：商贩的求助、深夜遇劫、邻人纠纷、落难书生、街头骗局

import type { PlayerScene } from '../../../ai/sceneLibrary/types';

export const PLAYER_SOCIAL_SCENES: PlayerScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 商贩的求助 — A Merchant's Plea
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_merchant_plea',
    name: '商贩的求助',
    description: '一个走街串巷的小商贩被人骗了货物，拦住玩家求助。可以帮忙追查、出谋划策、施舍几文钱或拒绝。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['商贩', '小贩', '货郎'],
      location: ['east_market', 'west_market', 'south_street', 'north_street'],
      timeOfDay: 'day',
    },
    participants: [
      {
        role: '求助者',
        requiredProfession: ['商贩', '小贩', '货郎'],
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '你正走在闹市之间，忽见一个肩挑货担的小贩急匆匆迎面而来，衣衫凌乱、满面焦急。他一把拦住你的去路，连声作揖道："客官行行好！方才有个泼皮骗走了我半担丝线，那可是我全家的活命钱啊！求客官帮我做主！"',
    entryPhase: 'merchant_plea_1',
    phases: {
      // ── 第一阶段：商贩求助 ──
      merchant_plea_1: {
        phaseId: 'merchant_plea_1',
        narrative:
          '小贩说着便要跪下，眼眶泛红。他指着东边一条巷子说："那人往那条巷子去了，穿着灰布短褐，手里还拿着我的丝线包！"周围的路人有的摇头叹息，有的漠然走开。你可以帮他追回货物，也可以用别的方式帮忙。',
        choices: [
          {
            id: 'chase_thief',
            text: '帮他追上去！往那条巷子跑。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '勇敢',
            },
            consequence: {
              nextPhase: 'merchant_plea_2a',
            },
          },
          {
            id: 'give_advice',
            text: '先别急，帮他想想办法。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '精明',
            },
            consequence: {
              nextPhase: 'merchant_plea_2b',
            },
          },
          {
            id: 'give_copper',
            text: '追不回来了，给他几文钱应急吧。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 5,
            },
            consequence: {
              immediateEffects: { copper: -5, mood: 3 },
              targetEffects: { copper: 5, mood: 10 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative:
                '你从袖中摸出五文铜钱塞到小贩手里："拿着吧，先买两个炊饼垫垫。"小贩攥着铜钱，感激得又要跪下。你扶住他的胳膊，摆了摆手便走了。身后传来他一声长长的叹息，混入市井的嘈杂之中。',
            },
          },
          {
            id: 'refuse_help',
            text: '摇摇头，转身走开。',
            consequence: {
              immediateEffects: { mood: -3 },
              targetEffects: { mood: -5 },
              relationChange: -3,
              nextPhase: null,
              endingNarrative:
                '你摆了摆手："抱歉，帮不了你。"小贩的眼神一下子暗了下去，嘴唇翕动着还想说什么，终究没再开口。你转身走了几步，身后的叫卖声依旧热闹，却好像远了几分。',
            },
          },
        ],
      },

      // ── 第二阶段A：追上骗子 ──
      merchant_plea_2a: {
        phaseId: 'merchant_plea_2a',
        narrative:
          '你二话不说，撒腿便朝巷子追去。巷子又窄又深，两侧是斑驳的土墙，头顶只露出一线天光。跑过两个拐角，果然看见前方有个灰衣汉子，腋下夹着一个布包，脚步匆匆。他似乎察觉身后有人追来，脚步加快了几分。',
        choices: [
          {
            id: 'confront_thief',
            text: '大喝一声，上前对质！',
            consequence: {
              nextPhase: 'merchant_plea_3a',
            },
          },
          {
            id: 'steal_back',
            text: '悄悄跟上去，找机会把东西拿回来。',
            consequence: {
              nextPhase: 'merchant_plea_3b',
            },
          },
        ],
      },

      // ── 第二阶段B：分析情况出计划 ──
      merchant_plea_2b: {
        phaseId: 'merchant_plea_2b',
        narrative:
          '你拦住小贩，让他把事情经过仔细说一遍。原来那骗子先是以高价收丝线为名，趁小贩不备将货包调了包。你问清了骗子的样貌和去向，心中有了计较——那人应当还没走远，或许还在附近找下一个猎物。',
        choices: [
          {
            id: 'bait_self',
            text: '自己拿钱做饵，引那骗子现身。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 20,
            },
            consequence: {
              nextPhase: 'merchant_plea_3c',
            },
          },
          {
            id: 'bait_merchant',
            text: '让商贩自己去报官，你去附近找找线索。',
            consequence: {
              immediateEffects: { mood: 5 },
              targetEffects: { mood: 3 },
              relationChange: 4,
              nextPhase: null,
              endingNarrative:
                '你叮嘱小贩先去巡检铺报案，自己则去附近茶肆和脚店打听了一圈。掌柜们都说见过那么个人，但不清楚去了哪里。你把打听到的消息托人转告了小贩。虽没能亲手抓到骗子，也算尽力了。小贩后来托人送来一包点心表示感谢。',
            },
          },
        ],
      },

      // ── 第三阶段A：正面与骗子对质 ──
      merchant_plea_3a: {
        phaseId: 'merchant_plea_3a',
        narrative:
          '你大喝一声"站住！"快步冲上前去，一把揪住灰衣汉子的衣领。那汉子先是一惊，随即恼羞成怒："你是什么人？放手！"布包从他腋下滑落，露出里面花花绿绿的丝线。巷子两头都有人探头张望。',
        choices: [
          {
            id: 'reason_crowd',
            text: '大声说清来龙去脉，让街坊们评理。',
            consequence: {
              immediateEffects: { mood: 8, social: 10 },
              targetEffects: { copper: 15, mood: 15 },
              relationChange: 12,
              nextPhase: null,
              endingNarrative:
                '你提高嗓门，将小贩被骗的经过一五一十说给围上来的街坊听。众人一听纷纷指责那汉子，有人已跑去叫巡检。灰衣汉子见势不妙，挣扎两下便软了嘴，丝线包被你夺回交还给了小贩。小贩捧着失而复得的货物，眼泪都下来了。',
              outcome: {
                narrative: '当街揭穿骗子，帮小贩夺回货物。',
                effects: { mood: 8, social: 10 },
                targetEffects: { copper: 15, mood: 15 },
                relationChange: 12,
                memoryTag: '帮助商贩追回货物',
              },
            },
          },
          {
            id: 'threaten_fist',
            text: '扬起拳头，让他识趣点。',
            consequence: {
              immediateEffects: { mood: 5, health: -3, social: 5 },
              targetEffects: { copper: 10, mood: 10 },
              relationChange: 8,
              nextPhase: null,
              endingNarrative:
                '你攥紧了拳头，那汉子却也不是省油的灯，两人推搡起来，你手臂上挨了一下，但也把丝线包抢了回来。汉子见打不过，骂骂咧咧地跑了。你把货包带回给小贩，他连连道谢，又心疼地看着你手臂上的淤青。',
              outcome: {
                narrative: '以武力夺回货物，受了点轻伤。',
                effects: { mood: 5, health: -3, social: 5 },
                targetEffects: { copper: 10, mood: 10 },
                relationChange: 8,
                memoryTag: '帮商贩打架夺回货物',
              },
            },
          },
        ],
      },

      // ── 第三阶段B：偷偷拿回货物 ──
      merchant_plea_3b: {
        phaseId: 'merchant_plea_3b',
        narrative:
          '你放轻脚步，远远跟着那灰衣汉子。他走到一处茶肆门前，将布包往桌上一搁，叫了壶茶慢悠悠地喝起来。你的目光锁定在桌角的布包上——距离不远，但茶肆里还有他两个同伴。',
        choices: [
          {
            id: 'grab_and_run',
            text: '等他分神的一瞬间，抢了包就跑！',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 50,
              },
              tieredResults: {
                critical_success: {
                  narrative:
                    '你瞅准灰衣汉子转头和同伴说话的空档，箭步冲上前，一把抄起布包转身就跑！待那几个人反应过来，你已经拐过了两条街。你气喘吁吁地把丝线还给了小贩，他高兴得几乎要跳起来。',
                  effects: { mood: 12, social: 8, fatigue: -5 },
                },
                success: {
                  narrative:
                    '你趁灰衣汉子招呼茶博士添水的时候，快步上前拿到了布包。虽被他同伴喊了一声，但你跑得快，七拐八拐便甩掉了追兵。小贩接过丝线，千恩万谢。',
                  effects: { mood: 8, social: 5, fatigue: -3 },
                },
                failure: {
                  narrative:
                    '你伸手去拿布包的时候，被灰衣汉子一把扣住了手腕。他的同伴也围了上来，你只得松手，狼狈地退了出来。小贩在巷口等你，你摇了摇头："没成。"他叹了口气，却还是谢了你的心意。',
                  effects: { mood: -5, health: -2, social: -2 },
                },
              },
              nextPhase: null,
            },
          },
          {
            id: 'wait_for_opening',
            text: '耐心等，总有机会的。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 65,
              },
              tieredResults: {
                success: {
                  narrative:
                    '你等了大半个时辰，灰衣汉子终于起身去茅房，布包留在了桌上。你不动声色地走过去，将布包揣入怀中，从容离开。回到巷口，小贩接过丝线时手都在发抖。',
                  effects: { mood: 10, social: 5 },
                },
                failure: {
                  narrative:
                    '你等了很久，但那灰衣汉子始终把布包带在身边，一刻也不离手。天色渐晚，你只得回去告诉小贩今天没机会下手。小贩虽失望，却也感激你费了这番功夫。',
                  effects: { mood: -2, fatigue: -5 },
                },
              },
              nextPhase: null,
            },
          },
        ],
      },

      // ── 第三阶段C：自己做饵引骗子 ──
      merchant_plea_3c: {
        phaseId: 'merchant_plea_3c',
        narrative:
          '你将二十文铜钱摊在手中晃了晃，故意在人多的地方装作数钱、找东西的样子。果然没过多久，一个灰衣汉子凑了过来，嘴里说着"客官可是丢了东西"，手却朝你袖口探来。',
        choices: [
          {
            id: 'catch_red_handed',
            text: '当场抓住他的手！',
            consequence: {
              immediateEffects: { copper: -20, mood: 10, social: 12 },
              targetEffects: { copper: 20, mood: 15 },
              relationChange: 15,
              nextPhase: null,
              endingNarrative:
                '你一把扣住灰衣汉子的手腕，高声喊道："抓骗子了！"围观的人迅速围拢过来。汉子百般狡辩，但你从他身上搜出了小贩的丝线包，人赃并获。巡检闻讯而来，将骗子押走。小贩捧着失而复得的丝线，对你连连作揖。这一仗打得漂亮，周围的人都在议论你的胆识。',
              outcome: {
                narrative: '做饵引出骗子，人赃并获。',
                effects: { copper: -20, mood: 10, social: 12 },
                targetEffects: { copper: 20, mood: 15 },
                relationChange: 15,
                memoryTag: '智擒骗子帮商贩追回货物',
              },
            },
          },
        ],
      },
    },
    weight: 6,
    cooldownTicks: 15,
    priority: 3,
    tags: ['social', 'help', 'merchant', 'day'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 深夜遇劫 — Night Ambush
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_night_ambush',
    name: '深夜遇劫',
    description: '夜归途中遭遇劫匪拦路，可以选择搏斗、破财免灾或逃跑。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['south_street', 'north_street', 'city_gate', 'alley'],
      timeOfDay: 'night',
    },
    participants: [
      {
        role: '劫匪',
        requiredTraits: ['暴躁', '贪婪'],
        minCount: 1,
        maxCount: 3,
      },
    ],
    openingNarrative:
      '夜深了，街巷中空无一人。你裹紧衣衫匆匆赶路，路过一条昏暗的小巷时，前方忽然闪出一条黑影。紧接着，身后也传来脚步声——你被堵住了。火折子的微光映出两三张粗犷的面孔，为首那人手里攥着一根木棍，瓮声瓮气道："把身上的钱留下，爷们儿饶你一条路。"',
    entryPhase: 'night_ambush_1',
    phases: {
      // ── 第一阶段：劫匪拦路 ──
      night_ambush_1: {
        phaseId: 'night_ambush_1',
        narrative:
          '三个汉子呈半包围之势将你逼在墙根。为首那人嚼着一根草茎，目光在你身上来回打量。身后的同伙嘿嘿笑着，手里抛着一颗石子。巷口的风灌进来，吹得你脖颈发凉。你的心跳加快了，但脑子还算清醒。',
        choices: [
          {
            id: 'fight_robbers',
            text: '绝不屈服！跟他们打！',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '勇敢',
            },
            consequence: {
              nextPhase: 'night_ambush_2a',
            },
          },
          {
            id: 'pay_robbers',
            text: '好汉不吃眼前亏，交钱保命。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 30,
            },
            consequence: {
              immediateEffects: { copper: -30, mood: -8 },
              targetEffects: { copper: 30, mood: 10 },
              relationChange: -10,
              nextPhase: null,
              endingNarrative:
                '你缓缓从怀中摸出铜钱，数了三十文递过去。为首那人掂了掂分量，满意地笑了笑："识时务。"三人让开一条路，你低着头快步走了出去。走出巷口才敢回头看一眼——黑暗中什么也看不见。三十文钱换一条命，你不知道该庆幸还是窝囊。',
            },
          },
          {
            id: 'run_away',
            text: '趁他们还没合围，拔腿就跑！',
            consequence: {
              nextPhase: 'night_ambush_2b',
            },
          },
        ],
      },

      // ── 第二阶段A：搏斗 ──
      night_ambush_2a: {
        phaseId: 'night_ambush_2a',
        narrative:
          '你猛地推开面前那人，一个箭步冲向为首的劫匪。那人显然没料到你会反抗，仓促间举起木棍横扫过来——',
        choices: [
          {
            id: 'fight_head_on',
            text: '迎上去，拳脚相加！',
            consequence: {
              resolution: {
                type: 'contested',
                contestedStat: { actor: 'health', target: 'health' },
              },
              tieredResults: {
                critical_success: {
                  narrative:
                    '你侧身避开木棍，一拳捣在那人面门上。他踉跄后退，撞翻了身后的同伙。你没给他们喘息的机会，三拳两脚将三个人打翻在地。为首那人捂着鼻子嗷嗷叫："走！走！"三人连滚带爬地消失在黑暗中。你站在原地，喘着粗气，指关节隐隐作痛，但心里痛快极了。',
                  effects: { mood: 15, health: -2, social: 5 },
                },
                success: {
                  narrative:
                    '一阵混乱的搏斗之后，你虽然挨了几下，但也把那几个劫匪打退了。为首那人见你不好惹，骂了一句"算你狠"，招呼同伙跑了。你揉着肋骨上的淤青，暗自庆幸。',
                  effects: { mood: 8, health: -8, social: 3 },
                },
                partial_success: {
                  narrative:
                    '你和他们打成一团，虽打伤了其中一个，但自己也挂了彩。最终双方都精疲力竭，劫匪们互搀着走了，临走前还不忘撂下一句狠话。你靠在墙上歇了好一会儿，才缓过劲来。',
                  effects: { mood: 2, health: -15, social: 2 },
                },
                failure: {
                  narrative:
                    '你寡不敌众，被三个人按在地上揍了一顿。铜钱被搜刮一空，连袖口里藏的几文零钱都没能幸免。三人扬长而去，留你躺在冰冷的石板路上。过了好一阵子，你才扶着墙勉强站起来，浑身上下没有一块好地方。',
                  effects: { mood: -15, health: -25, copper: -20 },
                },
              },
              nextPhase: null,
            },
          },
        ],
      },

      // ── 第二阶段B：逃跑 ──
      night_ambush_2b: {
        phaseId: 'night_ambush_2b',
        narrative:
          '你猛然转身，朝巷口冲去！身后传来一声暴喝："追！"脚步声在狭窄的巷子里回荡，像追命的鼓点。前方巷口隐约有月光，那是唯一的出路——',
        choices: [
          {
            id: 'run_with_wits',
            text: '跑！顺手掀翻路边的杂物阻挡追兵。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 60,
              },
              tieredResults: {
                success: {
                  narrative:
                    '你一路狂奔，经过一户人家的柴垛时一脚踹翻，劈柴哗啦啦倒了一地。身后传来绊倒的叫声和咒骂声。你没敢回头，一口气跑出巷口，穿过两条街才停下来。扶着墙喘了半天，你确信身后没有人追来，这才慢慢走回住处。今夜怕是睡不安稳了。',
                  effects: { mood: 5, fatigue: -8 },
                },
                failure: {
                  narrative:
                    '你拼了命地跑，但巷子里七拐八弯，一个不慎踩到水洼滑了一跤。身后追兵转瞬即至，你被按在地上，铜钱被抢了个干净。三人得手后扬长而去。你趴在冰冷的地面上，膝盖和手掌都磨破了皮。',
                  effects: { mood: -12, health: -10, copper: -15, fatigue: -10 },
                },
              },
              nextPhase: null,
            },
          },
        ],
      },
    },
    weight: 4,
    cooldownTicks: 20,
    priority: 5,
    tags: ['conflict', 'danger', 'night', 'robbery'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 邻人纠纷 — Neighbor Dispute
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_neighbor_dispute',
    name: '邻人纠纷',
    description: '两户邻居因琐事争执不下，玩家可以选择调停、帮一方或旁观。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['residential', 'east_market', 'west_market'],
      minNearbyNpcs: 2,
    },
    participants: [
      {
        role: '争执甲方',
        minCount: 1,
        maxCount: 1,
      },
      {
        role: '争执乙方',
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '你走在坊巷之中，远远就听到一阵激烈的争吵声。走近一看，是两户人家的门户前，一男一女正争得面红耳赤。地上散落着几片碎瓦和一滩污水，似乎是屋顶漏水引发的矛盾。左邻右舍有人开门探头，有人摇头叹气，却没人上前劝解。',
    entryPhase: 'neighbor_dispute_1',
    phases: {
      // ── 第一阶段：两家吵架 ──
      neighbor_dispute_1: {
        phaseId: 'neighbor_dispute_1',
        narrative:
          '甲方的汉子指着地上的污水道："你家屋顶年久失修，漏下来的水泡坏了我门口堆的柴火！"乙方的妇人叉着腰反驳："那柴火本来就该放在屋檐底下吗？你自己占了我的地界还不算，倒怪起我来了！"两人越吵越凶，嗓门一个赛一个高。',
        choices: [
          {
            id: 'mediate',
            text: '上前进言，试着帮两家调解。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '温和',
            },
            consequence: {
              nextPhase: 'neighbor_dispute_2a',
            },
          },
          {
            id: 'take_side',
            text: '仔细看看情况，帮有理的一方说话。',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '精明',
            },
            consequence: {
              nextPhase: 'neighbor_dispute_2b',
            },
          },
          {
            id: 'watch_and_leave',
            text: '不关己事，看看热闹就走了。',
            consequence: {
              immediateEffects: { mood: -2 },
              nextPhase: null,
              endingNarrative:
                '你站在人群边上看了片刻，两人吵得不可开交。你摇了摇头，转身离去。身后传来更尖锐的骂声和摔东西的声响。这种邻里纠纷，不插手也罢。',
            },
          },
        ],
      },

      // ── 第二阶段A：调停 ──
      neighbor_dispute_2a: {
        phaseId: 'neighbor_dispute_2a',
        narrative:
          '你走到两人中间，先朝两边拱了拱手："两位且消消气，街坊邻里的，有什么话不能好好说？"两人见有外人来劝，倒是各自收了几分火气，但嘴上谁也不肯让步。甲方说乙方不修屋顶，乙方说甲方占了过道。你心里盘算着，得想个法子让两人都下得来台。',
        choices: [
          {
            id: 'treat_tea',
            text: '请两位喝壶茶，坐下来慢慢说。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 3,
            },
            consequence: {
              nextPhase: 'neighbor_dispute_3',
            },
          },
          {
            id: 'reason_with_them',
            text: '不用花钱，跟他们摆道理。',
            consequence: {
              nextPhase: 'neighbor_dispute_3',
            },
          },
        ],
      },

      // ── 第二阶段B：帮有理的一方 ──
      neighbor_dispute_2b: {
        phaseId: 'neighbor_dispute_2b',
        narrative:
          '你仔细看了看现场。甲方堆柴火的地方确实占了一截公共过道，但乙方屋顶年久失修也是事实——漏水的地方长了青苔，显然不是一天两天的事。两方都有不对之处，但甲方的过错更明显些。',
        choices: [
          {
            id: 'side_with_a',
            text: '甲方占道不对，但先帮他解决漏水问题，两家都有台阶下。',
            consequence: {
              immediateEffects: { mood: 5, social: 8 },
              targetEffects: { mood: 5 },
              relationChange: 6,
              nextPhase: null,
              endingNarrative:
                '你当着两人的面说道："这位大哥，柴火确实不该堆在过道上，先挪了吧。这位嫂子，屋顶该修也趁早修，拖下去两家都受累。"两人听你说得在理，各自找了个台阶。甲方开始挪柴火，乙方也答应找泥瓦匠来看看屋顶。一场风波总算平息了。',
            },
          },
        ],
      },

      // ── 第三阶段：调停结果 ──
      neighbor_dispute_3: {
        phaseId: 'neighbor_dispute_3',
        narrative:
          '经过一番劝解，两人的火气渐渐消退。你趁热打铁，帮他们分析利弊——为这点小事伤了邻里和气，实在不值当。甲方答应把柴火挪到自家墙根下，乙方也承诺尽快修补屋顶。两人虽还有些不自在，但面子总算都过得去了。',
        choices: [
          {
            id: 'shake_hands',
            text: '趁势让他们互相敬杯酒，化干戈为玉帛。',
            consequence: {
              immediateEffects: { mood: 10, social: 15 },
              targetEffects: { mood: 8, social: 5 },
              relationChange: 10,
              nextPhase: null,
              endingNarrative:
                '你从旁边小铺买了一壶浊酒，给两人各倒了一碗。甲方端起碗来有些不好意思，乙方也是红着脸。但对视一眼后，两人还是碰了碰碗，各自饮了一口。"远亲不如近邻嘛。"你笑道。围观的邻居们也跟着笑了起来，纷纷散去。巷子里又恢复了往日的安宁。',
              outcome: {
                narrative: '成功调解邻里纠纷，两家重归于好。',
                effects: { mood: 10, social: 15 },
                targetEffects: { mood: 8, social: 5 },
                relationChange: 10,
                memoryTag: '调解邻里纠纷',
              },
            },
          },
        ],
      },
    },
    weight: 5,
    cooldownTicks: 12,
    priority: 2,
    tags: ['social', 'mediation', 'neighbor', 'day'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. 落难书生 — Stranded Scholar
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_stranded_scholar',
    name: '落难书生',
    description: '一个赴京赶考的书生在途中被盗，身无分文困在城中，玩家可以选择施以援手。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      targetProfession: ['书生', '秀才'],
      location: ['east_market', 'west_market', 'tea_house', 'academy'],
      timeOfDay: 'day',
    },
    participants: [
      {
        role: '落难书生',
        requiredProfession: ['书生', '秀才'],
        minCount: 1,
        maxCount: 1,
      },
    ],
    openingNarrative:
      '你在街角看到一个青衫落拓的年轻人，面容清瘦却眉宇间有股子书卷气。他靠在墙根下，手里捧着一卷皱巴巴的书册，嘴唇干裂，神情落寞。见你走近，他犹豫了一下，起身拱手行了一礼，声音沙哑："这位仁兄，在下姓周，赴京应试途中遭了贼……不知可否行个方便？"',
    entryPhase: 'scholar_1',
    phases: {
      // ── 第一阶段：书生求助 ──
      scholar_1: {
        phaseId: 'scholar_1',
        narrative:
          '周书生苦笑着说，他在客栈被偷了盘缠，已经两天没正经吃过饭了。身上除了几本书册，再无他物。他不是本地人，举目无亲，实在走投无路才开口求人。从他的言谈举止来看，确实是个读书人，不是那种职业骗子。',
        choices: [
          {
            id: 'treat_meal',
            text: '先请他吃顿饱饭再说。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 10,
            },
            consequence: {
              immediateEffects: { copper: -10 },
              targetEffects: { mood: 12, health: 5 },
              relationChange: 5,
              nextPhase: 'scholar_2',
            },
          },
          {
            id: 'help_letter',
            text: '帮他写封家书，寄钱过来。',
            consequence: {
              nextPhase: 'scholar_2',
            },
          },
          {
            id: 'point_direction',
            text: '指给他去官府求助的路，自己赶时间。',
            consequence: {
              immediateEffects: { mood: -2 },
              targetEffects: { mood: -3 },
              relationChange: -2,
              nextPhase: null,
              endingNarrative:
                '你给周书生指了指衙门的方向："那边可以去报官，或者找善堂试试。"他点了点头，目光中有些失望，但还是道了谢。你走了几步，回头看了一眼——他还站在墙根下，捧着那卷皱巴巴的书册，像是捧着全部的尊严。',
            },
          },
        ],
      },

      // ── 第二阶段：深入交谈 ──
      scholar_2: {
        phaseId: 'scholar_2',
        narrative:
          '周书生感激不已，和你攀谈起来。原来他是江南人氏，寒窗苦读十年，好不容易凑了盘缠进京赶考，却在途中遭了贼。他叹了口气："功名未就，倒先把面子丢尽了。"言语间虽然自嘲，但眼底的光还没灭。你看得出来，此人确有几分才学和志向。',
        choices: [
          {
            id: 'fund_journey',
            text: '资助他五十文盘缠，让他继续赶路。',
            condition: {
              field: 'copper',
              operator: 'gte',
              value: 50,
            },
            consequence: {
              immediateEffects: { copper: -50, mood: 15, social: 10 },
              targetEffects: { copper: 50, mood: 20 },
              relationChange: 15,
              nextPhase: null,
              endingNarrative:
                '你从怀中取出五十文铜钱，包好了递过去："拿着赶路吧，别误了考期。"周书生双手接过，竟红了眼眶。他深深作了一揖："仁兄大恩，周某铭刻五内。他日若有所成，必不忘今日之德。"他从书册中撕下一页，写下了自己的姓名籍贯递给你。你目送他远去的背影，心中觉得这五十文花得值。',
              outcome: {
                narrative: '资助落难书生五十文盘缠赶考。',
                effects: { copper: -50, mood: 15, social: 10 },
                targetEffects: { copper: 50, mood: 20 },
                relationChange: 15,
                memoryTag: '资助落难书生赶考',
              },
            },
          },
          {
            id: 'find_work',
            text: '帮他在城里找份抄书写信的活计。',
            consequence: {
              immediateEffects: { mood: 8, social: 8 },
              targetEffects: { mood: 10, copper: 5 },
              relationChange: 10,
              nextPhase: null,
              endingNarrative:
                '你带着周书生在附近几间铺子和茶楼打听了一圈。一家书铺的掌柜正缺人抄书，听说是读书人，便答应先试用几天。周书生虽有些不好意思，但还是欣然接受了。"先糊了口再说。"他朝你拱手笑道，"多谢仁兄指点。"你拍了拍他的肩膀，叮嘱了几句便告辞了。好人做到了这一步，也算是仁至义尽。',
              outcome: {
                narrative: '帮落难书生在书铺找到抄书的活计。',
                effects: { mood: 8, social: 8 },
                targetEffects: { mood: 10, copper: 5 },
                relationChange: 10,
                memoryTag: '帮落难书生找活',
              },
            },
          },
          {
            id: 'bid_farewell',
            text: '已经帮了不少了，就此告辞。',
            consequence: {
              immediateEffects: { mood: 3 },
              targetEffects: { mood: 3 },
              relationChange: 4,
              nextPhase: null,
              endingNarrative:
                '你起身告辞，周书生再次拱手致谢。你走出几步，听见身后传来他轻轻吟诵诗句的声音——"天将降大任于斯人也……"声音虽轻，却带着一股倔强劲儿。你微微一笑，继续赶路。',
            },
          },
        ],
      },
    },
    weight: 5,
    cooldownTicks: 15,
    priority: 2,
    tags: ['social', 'help', 'scholar', 'day'],
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. 街头骗局 — Street Scam
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ps_street_scam',
    name: '街头骗局',
    description: '玩家在街头目睹一个精心设计的骗局，可以选择揭穿、暗中提醒、走开或参与其中。',
    triggerCondition: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['east_market', 'west_market', 'south_street', 'north_street'],
      timeOfDay: 'day',
      minNearbyNpcs: 3,
    },
    participants: [
      {
        role: '设局者',
        requiredTraits: ['狡猾', '贪婪'],
        minCount: 1,
        maxCount: 2,
      },
      {
        role: '受害者',
        minCount: 1,
        maxCount: 1,
        forbiddenTraits: ['狡猾'],
      },
    ],
    openingNarrative:
      '你路过一处热闹的地摊，看见一个老妇人正被几个摊贩围着。其中一个摊贩手持一只"金蟾"，说得天花乱坠："这是从雷峰塔下挖出来的宝贝，见者有缘，只卖三十文！"另外两个"路人"在一旁帮腔叫好，一个说"我刚买了，果然灵验"，另一个说"这可是千载难逢的好事"。你一看就知道——这是经典的托儿骗局。',
    entryPhase: 'street_scam_1',
    phases: {
      // ── 第一阶段：目睹骗局 ──
      street_scam_1: {
        phaseId: 'street_scam_1',
        narrative:
          '老妇人将信将疑，从布包里掏出一个旧钱袋。几个摊贩的眼睛一下子亮了起来，嘴上却装作漫不经心。周围真正的路人有的好奇驻足，有的匆匆走过。你看得分明——那"金蟾"不过是一块涂了金漆的铜疙瘩。老妇人似乎就要掏钱了。',
        choices: [
          {
            id: 'expose_scam',
            text: '上前大声揭穿他们的骗局！',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '勇敢',
            },
            consequence: {
              nextPhase: 'street_scam_2a',
            },
          },
          {
            id: 'warn_victim',
            text: '悄悄走到老妇人身边，低声提醒她。',
            consequence: {
              nextPhase: 'street_scam_2b',
            },
          },
          {
            id: 'walk_away',
            text: '事不关己，走开算了。',
            consequence: {
              immediateEffects: { mood: -3 },
              nextPhase: null,
              endingNarrative:
                '你摇了摇头，转身离去。身后传来摊贩的吆喝声和老妇人的犹豫声。你没回头，但那声音跟了你很远。走了一条街之后，你隐隐觉得有些不安，但也说不上来该怎么做。毕竟这世上骗局太多了，管得过来吗？',
            },
          },
          {
            id: 'join_scam',
            text: '看出来门道了，不如也掺和一脚……',
            condition: {
              field: 'personality',
              operator: 'includes',
              value: '狡猾',
            },
            consequence: {
              nextPhase: 'street_scam_2c',
            },
          },
        ],
      },

      // ── 第二阶段A：当众揭穿 ──
      street_scam_2a: {
        phaseId: 'street_scam_2a',
        narrative:
          '你挤进人群，指着那"金蟾"大声道："大家且慢！这分明是铜的，涂了一层金漆而已。这位老嫂子千万别上当！"摊贩脸色一变，两个托儿也露出凶光。围观的路人纷纷低头看那"宝贝"，有人拿起来刮了一下，果然露出铜色。',
        choices: [
          {
            id: 'expose_triumph',
            text: '继续大声揭发，让所有人都看清。',
            consequence: {
              immediateEffects: { mood: 12, social: 15 },
              targetEffects: { mood: -10, copper: -30 },
              relationChange: -15,
              nextPhase: null,
              endingNarrative:
                '你越说越有底气，把骗局的手法当着众人的面一一拆解。围观的人越来越多，有人已经开始起哄。摊贩见势不妙，一把收起摊子想溜，但被几个路过的壮汉拦住了。老妇人把钱袋紧紧攥在怀里，连声向你道谢。不一会儿巡检来了，把几个骗子押走了。围观的百姓纷纷朝你竖起大拇指。你拍了拍手，心里踏实得很。',
              outcome: {
                narrative: '当众揭穿骗局，骗子被巡检带走。',
                effects: { mood: 12, social: 15 },
                targetEffects: { mood: -10, copper: -30 },
                relationChange: -15,
                memoryTag: '当众揭穿街头骗局',
              },
            },
          },
        ],
      },

      // ── 第二阶段B：暗中提醒 ──
      street_scam_2b: {
        phaseId: 'street_scam_2b',
        narrative:
          '你不动声色地绕到老妇人身后，趁摊贩忙着吹嘘的当口，轻声在她耳边说："大嫂，那是假的，涂了金漆的铜块。旁边那几个叫好的都是一伙的。"老妇人一愣，看了你一眼，又看了看那几个热情的"路人"，似乎明白了什么。',
        choices: [
          {
            id: 'whisper_success',
            text: '再叮嘱几句，帮她脱身。',
            consequence: {
              immediateEffects: { mood: 8, social: 5 },
              relationChange: 8,
              nextPhase: null,
              endingNarrative:
                '老妇人把钱袋揣回怀里，对着摊贩摆了摆手："不买了，不买了。"摊贩还想纠缠，但老妇人已经转身走了，你紧随其后，用身体挡在中间。走出几十步远，老妇人才松了口气，拉着你的手说："多亏了你啊后生，老婆子差点就把棺材本搭进去了。"你笑了笑，嘱咐她以后小心便告别了。',
              outcome: {
                narrative: '暗中提醒受害者，帮老妇人免于上当。',
                effects: { mood: 8, social: 5 },
                relationChange: 8,
                memoryTag: '暗中提醒老妇人避开了骗局',
              },
            },
          },
        ],
      },

      // ── 第二阶段C：参与骗局 ──
      street_scam_2c: {
        phaseId: 'street_scam_2c',
        narrative:
          '你挤到摊前，装作好奇的样子拿起那"金蟾"端详。摊贩警惕地看了你一眼，你冲他使了个眼色，压低声音说："老板，我也算是同道中人，能不能搭个伙？"摊贩上下打量了你一番，嘿嘿一笑。',
        choices: [
          {
            id: 'scam_join',
            text: '试试和他们合作，分一杯羹。',
            consequence: {
              resolution: {
                type: 'chance',
                successChance: 30,
              },
              tieredResults: {
                success: {
                  narrative:
                    '摊贩接纳了你，让你充当新的"托儿"。你鼓动三寸不烂之舌，帮着又骗了两个路人。事后摊贩分给你二十文铜钱。你把钱攥在手里，走了几步，心里说不上是得意还是别扭。',
                  effects: { copper: 20, mood: -5, social: -10 },
                },
                failure: {
                  narrative:
                    '摊贩表面上答应了，但趁你不注意，偷了你袖口里的钱袋。等你反应过来，他们已经收摊跑远了。想黑吃黑？你才是那个被黑的人。你站在原地，又气又恼，周围路人的目光让你恨不得找个地缝钻进去。',
                  effects: { copper: -25, mood: -15, social: -8 },
                },
              },
              nextPhase: null,
            },
          },
        ],
      },
    },
    weight: 5,
    cooldownTicks: 18,
    priority: 4,
    tags: ['social', 'scam', 'market', 'day', 'choice_morality'],
  },
];
