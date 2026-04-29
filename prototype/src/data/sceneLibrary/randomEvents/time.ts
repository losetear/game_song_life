// === 随机事件 — 时辰 (Random Time-of-Day Events) ===
//
// 宋代时辰相关随机事件，1-2幕轻量场景。
// 包含：远处鼓声、开市锣响、宵禁巡街、晨钟暮鼓、夜市灯火、午后小憩

import { RandomEvent } from '../../../ai/sceneLibrary/types';

export const TIME_RANDOM_EVENTS: RandomEvent[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 远处鼓声 — Distant Drumbeats (午/未)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_time_distant_drums',
    name: '远处鼓声',
    description: '午后时分，远处传来阵阵鼓声，似是官府在操练兵马，又似是哪座庙宇在做法事。好奇心驱使你前去一探究竟。',
    trigger: {
      shichen: ['午', '未'],
    },
    weight: 3,
    cooldownTicks: 30,
    scene: {
      id: 're_time_distant_drums',
      name: '远处鼓声',
      description: '午后鼓声引来一段际遇。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '日头偏西，正是一天中最困顿的时辰。你昏昏欲睡地走在街上，忽然一阵沉闷的鼓声从远处传来——"咚……咚……咚……"节奏沉稳有力，震得胸腔都跟着共鸣。街上的人纷纷驻足侧耳，有人说是城外军营在操练，有人说是大相国寺在做法事。鼓声越来越近，越来越急，像是有什么大事正在发生。',
      weight: 3,
      cooldownTicks: 30,
      entryPhase: 'drums_1',
      phases: {
        drums_1: {
          phaseId: 'drums_1',
          narrative:
            '你循着鼓声走了一段路，来到一座庙宇的广场前。只见数十个壮汉赤着上身，在烈日下齐声呐喊着拉动绳索——原来是在修缮庙门前的一对石狮子，鼓声是用来统一步调的。领头的工匠满头大汗，正扯着嗓子喊号子。旁边围了一圈看热闹的百姓，有个卖酸梅汤的老妇人正在人群中穿梭叫卖。',
          choices: [
            {
              id: 'watch_and_chat',
              text: '驻足看热闹，和旁边的百姓聊聊天。',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你挤进人群，和旁边一个扛着扁担的老汉搭上了话。他说这对石狮子是百年前的高僧从五台山运来的，前些日子裂了一道缝，这才请了城里的石匠来修缮。你一边听着他絮絮叨叨地讲庙里的传说，一边看着工匠们把石狮子一点一点地扶正。鼓声戛然而止，人群发出一阵喝彩。你忽然觉得，午后原本困乏的时光，因为这一段意外的热闹而变得有滋有味。',
              },
            },
            {
              id: 'buy_plum_drink',
              text: '日头太毒，先买一碗酸梅汤解解渴。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 3,
              },
              consequence: {
                immediateEffects: { copper: -3, health: 4, mood: 6 },
                nextPhase: null,
                endingNarrative:
                  '你叫住那个卖酸梅汤的老妇人，花了三文钱买了一碗。碗是粗瓷的，酸梅汤却是冰镇的——她说是用井水镇了一上午。你仰头喝了一大口，酸甜冰凉，暑气消了大半。老妇人笑眯眯地看着你："后生，喝完了碗还我啊，这碗我洗洗还能用。"你把碗递回去，谢了一声，抹了把嘴，觉得这午后倒也不那么难熬了。',
              },
            },
            {
              id: 'offer_to_help',
              text: '看工匠们人手不够，上去搭把手。',
              condition: {
                field: 'health',
                operator: 'gte',
                value: 50,
              },
              consequence: {
                immediateEffects: { health: -6, mood: 8, copper: 8 },
                relationChange: 8,
                nextPhase: null,
                endingNarrative:
                  '你撸起袖子走上前去，对领头的工匠说："大哥，我来帮把手。"工匠上下打量了你一眼，把一根粗绳塞到你手里："行，跟着鼓声拉，别抢拍！"你咬着牙和一群壮汉一起拉绳，手掌被粗糙的麻绳磨得火辣辣的。石狮子在一阵齐声呐喊中被缓缓扶正，人群中爆发出一阵叫好声。工匠拍了拍你的肩膀，塞给你一小袋铜钱："辛苦了兄弟，买碗酒喝。"你接过铜钱，甩了甩酸麻的胳膊，心里倒是痛快得很。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 开市锣响 — Morning Market Gong (辰/巳)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_time_market_gong',
    name: '开市锣响',
    description: '辰时刚过，东市的市令敲响了开市铜锣，各色摊贩如潮水般涌入，一天中最热闹的市集开始了。',
    trigger: {
      shichen: ['辰', '巳'],
    },
    weight: 4,
    cooldownTicks: 25,
    scene: {
      id: 're_time_market_gong',
      name: '开市锣响',
      description: '开市之初，人声鼎沸，到处是叫卖声和讨价还价声。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '"当当当——"三声铜锣响过，东市的栅门轰然洞开。早已等候多时的摊贩们肩挑背扛地涌了进来，眨眼间空荡荡的广场便变成了热闹非凡的集市。布匹、瓷器、果蔬、活鱼、药材、胭脂……各色货物琳琅满目，叫卖声此起彼伏，讨价还价声不绝于耳。空气里混杂着炊饼的麦香和鲜鱼的腥气，热闹得让人喘不过气来。',
      weight: 4,
      cooldownTicks: 25,
      entryPhase: 'market_gong_1',
      phases: {
        market_gong_1: {
          phaseId: 'market_gong_1',
          narrative:
            '你被人流裹挟着往前走，两边都是密密麻麻的摊位。左手边一个卖绸缎的商人正扯着嗓子喊"杭州织造 上等云锦"，右手边一个卖药的郎中在地上摊开了一堆草根树皮，声称包治百病。再往前走，一股烤肉的香味飘了过来——是个卖胡饼的摊子，刚刚出炉的胡饼焦黄酥脆，热气腾腾。你的肚子不争气地叫了一声。',
          choices: [
            {
              id: 'buy_hu_bing',
              text: '来一个刚出炉的胡饼，先填饱肚子再说。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 5,
              },
              consequence: {
                immediateEffects: { copper: -5, mood: 6, health: 3 },
                nextPhase: null,
                endingNarrative:
                  '你花了五文钱买了一个比巴掌还大的胡饼，上面撒满了芝麻，掰开来里面还夹着一层薄薄的羊肉馅。你站在路边大口大口地啃着，芝麻粒沾了一嘴，酥脆的外皮掉了一地。旁边一条黄狗蹲在你脚边，眼巴巴地望着你手里的饼。你掰了一块丢给它，它叼着就跑了。你吃完胡饼，拍掉手上的芝麻渣，混在人群中继续逛集。这汴京的早市，果然名不虚传。',
              },
            },
            {
              id: 'window_shopping',
              text: '不买东西，随便逛逛看看热闹。',
              consequence: {
                immediateEffects: { mood: 4 },
                nextPhase: 'market_gong_haggling',
              },
            },
            {
              id: 'find_bargain',
              text: '趁开市的时候仔细挑挑，说不定能捡个便宜。',
              consequence: {
                immediateEffects: { mood: 3 },
                nextPhase: 'market_gong_bargain',
              },
            },
          ],
        },
        market_gong_haggling: {
          phaseId: 'market_gong_haggling',
          narrative:
            '你东逛逛西看看，走到一个卖杂货的摊前，发现摊主正在和一个客人争得面红耳赤。那客人拿着一把铜壶说壶嘴有砂眼，摊主拍着胸脯说那是花纹不是砂眼。两人越吵越凶，旁边看热闹的人越围越多。摊主忽然看见你路过，一把拉住你的袖子："这位客官您来评评理！您看看这壶嘴，到底是不是砂眼？"',
          choices: [
            {
              id: 'side_with_vendor',
              text: '仔细看了看，确实是花纹不是砂眼，帮摊主说句公道话。',
              consequence: {
                immediateEffects: { copper: 3, mood: 3 },
                relationChange: 5,
                nextPhase: null,
                endingNarrative:
                  '你拿过铜壶对着光照了照，又用指甲在壶嘴上轻轻刮了刮，的确是工匠刻的花纹，不是砂眼。你如实说了，那客人脸上一红，嘟囔了两句放下壶走了。摊主感激地朝你拱了拱手，从摊上抓了一把红枣硬塞给你："客官好眼力！这红枣您拿着，自家树上结的。"你接过红枣，嚼着甜甜的枣肉继续往前逛。',
              },
            },
            {
              id: 'side_with_customer',
              text: '看了看确实有点像砂眼，如实说了。',
              consequence: {
                immediateEffects: { mood: -2 },
                relationChange: -3,
                nextPhase: null,
                endingNarrative:
                  '你仔细端详了一番，觉得壶嘴处确实有一处不太平整，摸上去有点剌手。你犹豫了一下还是说了实话。摊主的脸一下子拉了下来，一把夺过铜壶："你懂什么！不买别乱说！"那客人倒是得意地朝你点了点头，又借机砍了半价买走了铜壶。你被摊主瞪了一眼，讪讪地走开了，心想以后这种闲事还是少管为妙。',
              },
            },
            {
              id: 'walk_away',
              text: '摆摆手说不懂，赶紧走开别掺和。',
              consequence: {
                immediateEffects: { mood: -1 },
                nextPhase: null,
                endingNarrative:
                  '你挣脱了摊主的手，摇了摇头说："我对铜器不在行，帮不上忙。"摊主失望地松了手，转而又去拉别人评理了。你快步走开，身后还传来两人越吵越大的声音。你耸了耸肩，心想早市的热闹中总少不了这些鸡毛蒜皮的纠纷，这大概就是人间烟火气吧。',
              },
            },
          ],
        },
        market_gong_bargain: {
          phaseId: 'market_gong_bargain',
          narrative:
            '你在一个角落的摊位上发现了一件有意思的东西——一只小巧的竹编蟋蟀笼子，编得极为精致，竹篾细如发丝，笼门还能开合。摊主是个头发花白的老篾匠，面前摆满了各式竹编器物。他见你盯着蟋蟀笼子看，便拿起来递到你眼前："客官好眼力，这可是我编了整整两天的，整条街上找不到第二只。"',
          choices: [
            {
              id: 'buy_cage',
              text: '确实精巧，买下来。讨个价。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 12,
              },
              consequence: {
                immediateEffects: { copper: -12, mood: 7 },
                relationChange: 5,
                nextPhase: null,
                endingNarrative:
                  '你把蟋蟀笼子翻来覆去看了又看，越看越喜欢。问价，老篾匠说要十五文。你跟他磨了半天嘴皮子，最后十二文成交。老篾匠一边收钱一边笑着说："客官是个识货的，这笼子配得上好蟋蟀。"你把笼子小心翼翼地揣进怀里，像揣着一件宝贝。回家路上你已经盘算好了——城南那片草丛里蟋蟀最多，改天非得捉一只"大将军"来住这豪宅。',
              },
            },
            {
              id: 'chat_with_craftsman',
              text: '不买了，但跟老篾匠聊两句，这手艺确实稀罕。',
              consequence: {
                immediateEffects: { mood: 5 },
                relationChange: 3,
                nextPhase: null,
                endingNarrative:
                  '你把笼子还给老篾匠，夸了几句手艺好。老人很高兴，打开了话匣子，说自家三代人都做竹编，从前还给府衙编过灯笼。他边说边从摊子底下摸出一个巴掌大的竹编蝈蝈，轻轻一捏还会动，活灵活现。你看得目瞪口呆，老人笑得胡子直颤："这手艺啊，急不来，得慢慢磨。"你和他聊了好一阵，直到旁边摊位收摊了才起身告辞。虽然什么都没买，但这段闲聊让你心情格外舒畅。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 宵禁巡街 — Night Patrol (戌/亥)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_time_night_patrol',
    name: '宵禁巡街',
    description: '戌时已到，城门落锁，巡街的差役开始清街。逗留在外的人若被拿住，轻则挨骂，重则罚款。',
    trigger: {
      shichen: ['戌', '亥'],
    },
    weight: 3,
    cooldownTicks: 35,
    scene: {
      id: 're_time_night_patrol',
      name: '宵禁巡街',
      description: '宵禁时分还在街上，需要想办法避开巡街差役。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '远处传来"梆——梆——梆——"的三声梆子响，这是宵禁的信号。戌时已到，街上的人加快了脚步往家赶。你看见两个穿着皂衣的差役提着灯笼从街角转了过来，一边走一边吆喝："宵禁了！都回家了！不许在街上逗留！"他们的腰间挂着水火棍，走起路来哗啦作响。你还隔了好几条街才到家。',
      weight: 3,
      cooldownTicks: 35,
      entryPhase: 'night_patrol_1',
      phases: {
        night_patrol_1: {
          phaseId: 'night_patrol_1',
          narrative:
            '差役的脚步声越来越近，灯笼的光在墙上投下摇曳的影子。你必须做出决定——是老老实实上前说明情况碰碰运气，还是找个地方躲一躲等他们过去。',
          choices: [
            {
              id: 'explain_to_patrol',
              text: '迎上去老实说明情况，请求通融。',
              consequence: {
                immediateEffects: { mood: -3 },
                nextPhase: 'night_patrol_encounter',
              },
            },
            {
              id: 'hide_in_alley',
              text: '闪身躲进旁边的巷子里，等他们过去再走。',
              consequence: {
                immediateEffects: { mood: -2 },
                nextPhase: null,
                endingNarrative:
                  '你侧身钻进一条窄巷，贴着墙根站定。差役的灯笼光从巷口扫过，你没敢出声，连呼吸都放轻了。脚步声和吆喝声渐渐远了，你才松了口气。你在黑暗中小心翼翼地往前摸，借着屋檐下残留的灯笼微光认路。左拐右绕，总算摸到了家门口。推开门的那一刻，你长出了一口气——下次一定记得早些动身回家。',
              },
            },
            {
              id: 'bribe_patrol',
              text: '塞几文钱给差役，求个方便。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 10,
              },
              consequence: {
                immediateEffects: { copper: -10, mood: -5 },
                nextPhase: null,
                endingNarrative:
                  '你迎着差役走上去，拱了拱手，从袖中摸出一小把铜钱悄悄塞过去："差大哥辛苦了，小人贪了点路，家就在前面不远……"年长的那个差役扫了一眼铜钱，不动声色地收进袖里，朝年轻的那个努了努嘴。年轻差役会意，提着灯笼往前走了。年长的低声说了句："快回去，别再让我看见。"你连声道谢，快步往家赶去。铜钱花得肉疼，但总比被抓进衙门强。',
              },
            },
          ],
        },
        night_patrol_encounter: {
          phaseId: 'night_patrol_encounter',
          narrative:
            '你硬着头皮迎上去，拱手道："差大哥，小人住的远，一时赶不回去，能否通融一二？"年长的差役上下打量了你一番，眯着眼说："宵禁是规矩，不是我说通融就能通融的。"他旁边那个年轻差役却饶有兴致地看着你，似乎在等你拿出什么说法来。',
          choices: [
            {
              id: 'plead_hardship',
              text: '苦着脸说自己刚从药铺抓了药，家中有人等着用。',
              consequence: {
                immediateEffects: { mood: 2 },
                nextPhase: null,
                endingNarrative:
                  '年长的差役听了，脸色缓和了些："既然是急事，那你赶紧走吧，别在街上磨蹭。"年轻差役还想说什么，被年长的瞪了一眼便闭了嘴。你千恩万谢地作了个揖，转身快步走了。走出老远回头看了一眼，两个差役的灯笼光已经移到了另一条街上。你暗自庆幸，心想下次出门一定看好时辰。',
              },
            },
            {
              id: 'get_fined',
              text: '实在没什么好借口，认罚吧。',
              consequence: {
                immediateEffects: { copper: -15, mood: -8 },
                nextPhase: null,
                endingNarrative:
                  '你支支吾吾说不出个所以然来，年长差役不耐烦了："行了行了，罚款十五文，明早去衙门交。名字报上来！"你报了名字和住处，他在手本上记了一笔。年轻差役在旁边偷笑。你垂头丧气地被放行走了，心里盘算着十五文钱够买好几天的炊饼了。这下真是赔了夫人又折兵，以后再也不敢在宵禁后还在街上晃悠了。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. 晨钟暮鼓 — Morning Bell and Evening Drum (寅/卯)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_time_morning_bell',
    name: '晨钟暮鼓',
    description: '寅卯之交，天色将明未明，城中钟楼敲响了晨钟。悠远的钟声穿越薄雾，将汴京城从沉睡中唤醒。',
    trigger: {
      shichen: ['寅', '卯'],
    },
    weight: 3,
    cooldownTicks: 30,
    scene: {
      id: 're_time_morning_bell',
      name: '晨钟暮鼓',
      description: '晨钟响起，新的一天开始了。黎明的静谧中，偶遇一段温暖的插曲。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '天边刚泛起一抹鱼肚白，城中钟楼便响起了晨钟——"嗡——嗡——嗡——"悠长的钟声穿透了薄薄的晨雾，在空旷的街巷中回荡。报更的老更夫敲着竹梆子从你身边走过，嘴里含糊地念叨着"寅时三刻——天亮咧——"。你裹紧衣衫站在街头，呵出的白气在昏黄的灯笼光中飘散。整座城市像一只正在伸懒腰的猫，慢慢苏醒过来。',
      weight: 3,
      cooldownTicks: 30,
      entryPhase: 'morning_bell_1',
      phases: {
        morning_bell_1: {
          phaseId: 'morning_bell_1',
          narrative:
            '晨光渐明，街角的一家豆腐坊已经开了张。热气从半掩的木门里涌出来，带着豆浆特有的醇香。老板娘正在灶台前忙碌，一个半大的孩子在门口支起了桌子，摆上碗筷。豆腐坊旁边的井台边，几个早起的妇人正在打水洗衣，棒槌声一下一下地响着。这大概是一天中最安静也最温馨的时刻。',
          choices: [
            {
              id: 'breakfast_at_tofu_shop',
              text: '来一碗热豆浆配油条，开个早灶。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 5,
              },
              consequence: {
                immediateEffects: { copper: -5, health: 5, mood: 8 },
                nextPhase: null,
                endingNarrative:
                  '你走进豆腐坊坐下，花五文钱要了一碗热豆浆和两根刚炸好的油条。豆浆滚烫，上面飘着一层薄薄的豆皮，你撕了油条浸进去，看着它吸饱了豆浆慢慢膨胀。一口咬下去，外酥里嫩，满嘴豆香。老板娘见你吃得香，又给你添了半碗豆浆："不要钱，喝吧。"你端起碗一口气喝干了，从里到外都暖透了。走出豆腐坊时，天已经大亮，街上的人渐渐多了起来。新的一天，就这样从一个温暖早晨开始了。',
              },
            },
            {
              id: 'help_well_women',
              text: '井台边有个老妇人的水桶太重了，帮她提一桶。',
              consequence: {
                immediateEffects: { health: -2, mood: 7 },
                relationChange: 8,
                nextPhase: null,
                endingNarrative:
                  '你走过去，二话不说从老妇人手里接过水桶。满满一桶井水少说有二三十斤，你提着走了二十来步才到她家门口。老妇人连声道谢，非要拉你进去喝口水再走。你摆了摆手说不用了，老妇人便从围裙口袋里摸出一颗饴糖塞到你手里："拿着，甜的。"你笑了笑接过饴糖，把糖纸剥了含进嘴里。甜丝丝的味道在舌尖化开，你踩着清晨的石板路继续往前走，觉得这一天开头就不错。',
              },
            },
            {
              id: 'watch_sunrise',
              text: '站在高处看看日出，这难得的景致不常有。',
              consequence: {
                immediateEffects: { mood: 10 },
                nextPhase: null,
                endingNarrative:
                  '你爬上了附近一座小石桥的桥栏，面朝东方坐着。薄雾渐渐散去，天际线从灰蓝变成了橙红，最后一轮红日从远处的山头后面跳了出来——金色的光芒瞬间铺满了整个汴京城。河面上波光粼粼，柳枝在晨风中轻轻摇曳，远处的楼阁和城墙被镀上了一层温暖的金边。你深吸一口清冽的空气，觉得浑身说不出的舒畅。钟声再次响起，这一次不再催促，而是像一声温柔的问候：早安，新的一天。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. 夜市灯火 — Night Market Lights (酉/戌/亥)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_time_night_market',
    name: '夜市灯火',
    description: '酉时过后，夜市开张。灯火辉煌，人声鼎沸，处处是酒香和歌声。宋代不夜城的繁华尽在眼前。',
    trigger: {
      shichen: ['酉', '戌', '亥'],
    },
    weight: 4,
    cooldownTicks: 25,
    scene: {
      id: 're_time_night_market',
      name: '夜市灯火',
      description: '汴京夜市的繁华景象，处处是诱惑和热闹。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '夜幕降临，但汴京城才刚刚苏醒。州桥两侧的夜市一条街灯火通明，数不清的灯笼和油灯把黑夜照得如同白昼。叫卖声、吆喝声、丝竹声、划拳声交织在一起，汇成一曲喧嚣的夜之乐章。空气中弥漫着烤肉、酒酿、桂花糕和煮花生混在一起的浓烈香气，勾得人馋虫直动。',
      weight: 4,
      cooldownTicks: 25,
      entryPhase: 'night_market_1',
      phases: {
        night_market_1: {
          phaseId: 'night_market_1',
          narrative:
            '你被人流推着往前走，两边是望不到头的小摊。卖水粉的姑娘在灯笼下笑得明媚，卖糖人的老人手指翻飞捏出一只糖兔子，卖杂耍的汉子赤脚踩在碎瓷片上引来一阵叫好。你面前有三个去处——左边的酒肆里传出悠扬的琵琶声和笑声，正前方有个卖糖炒栗子的摊子热气腾腾，右边一帮人围成了一圈，不知在看什么热闹。',
          choices: [
            {
              id: 'enter_tavern',
              text: '去那家酒肆坐坐，听曲儿喝酒。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 15,
              },
              consequence: {
                immediateEffects: { copper: -15, mood: 10 },
                nextPhase: null,
                endingNarrative:
                  '你掀开酒肆的门帘走了进去。里头不大，却坐满了人。一个弹琵琶的姑娘坐在角落，指尖流出一串清越的音符。你要了一壶热黄酒和一碟盐水花生，花了十五文。酒是温的，入口甘醇。你坐在角落里慢慢喝着，听着琵琶曲《春江花月夜》，看着窗外灯火阑珊的夜市。酒意微醺之际，你觉得整个世界都柔和了下来。曲终人散，你放下酒杯，付了账，脚步轻飘飘地走进了夜色里。',
              },
            },
            {
              id: 'buy_chestnuts',
              text: '买一包糖炒栗子，边走边吃。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 6,
              },
              consequence: {
                immediateEffects: { copper: -6, mood: 7 },
                nextPhase: null,
                endingNarrative:
                  '你花了六文钱买了一纸包糖炒栗子，摊主用荷叶包好递过来，还烫着手呢。你剥开一颗，金黄色的栗子肉又甜又糯，热乎乎地从嘴里暖到胃里。你一边剥栗子一边在夜市里闲逛，路过一个卖灯笼的摊子时，买了一盏莲花纸灯，不是为了照明，只是觉得好看。你举着纸灯，嚼着栗子，在灯火辉煌的夜市里慢慢走着，心想：这大概就是太平盛世该有的模样吧。',
              },
            },
            {
              id: 'watch_performance',
              text: '挤进人群看看到底在热闹什么。',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: 'night_market_show',
              },
            },
          ],
        },
        night_market_show: {
          phaseId: 'night_market_show',
          narrative:
            '你挤进人群一看——原来是个说书人！一个花白胡子的老先生站在一张木桌后面，手里拿着一把折扇，正说到精彩处："……那武二郎手起刀落，那大虫便——啪！"他猛地一拍惊堂木，吓得前排的人往后一缩，随即爆发出一片叫好声。老先生讲的正是《武松打虎》，说到武松骑在老虎背上挥拳那一段，绘声绘色，唾沫横飞。',
          choices: [
            {
              id: 'tip_storyteller',
              text: '说得真好！打赏几文钱。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 3,
              },
              consequence: {
                immediateEffects: { copper: -3, mood: 8 },
                relationChange: 5,
                nextPhase: null,
                endingNarrative:
                  '你从袖中摸出三文钱，等老先生讲到一段落处，上前放在他的铜盘里。老先生微微颔首致谢，折扇一收，清了清嗓子接着往下讲。你站在人群中听完了整段武松打虎，直到老先生拱手说"今日到此为止"才意犹未尽地散去。夜风吹来一丝凉意，你揉了揉笑酸了的脸，觉得这六文钱花得值当——三文栗子，三文听书，这就是汴京夜晚的价钱。',
              },
            },
            {
              id: 'listen_and_leave',
              text: '站着听了一会儿就走了，明天再来接着听。',
              consequence: {
                immediateEffects: { mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你靠着墙根听了一会儿，老先生确实讲得好——声情并茂，节奏拿捏得恰到好处。但你站了一天的路，腿脚有些酸了。你趁一段间隙退出了人群，往回走的时候还听到身后传来老先生抑扬顿挫的声音和人群的阵阵喝彩。你回头望了一眼灯火通明的夜市，心想这个说书先生明晚一定还在，改日再来听个痛快。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. 午后小憩 — Afternoon Rest (午/未)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_time_afternoon_rest',
    name: '午后小憩',
    description: '午后的困倦如潮水般涌来，眼皮重得像灌了铅。找一个地方歇歇脚，是此刻最要紧的事。',
    trigger: {
      shichen: ['午', '未'],
    },
    weight: 3,
    cooldownTicks: 20,
    scene: {
      id: 're_time_afternoon_rest',
      name: '午后小憩',
      description: '午后困倦难当，需要找个地方歇脚。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '午后的阳光像一床厚棉被，铺天盖地地压下来。你走了大半天的路，双腿像灌了铅，眼皮一个劲儿地往下坠。街上的行人也都无精打采的，连狗都趴在阴凉处吐着舌头。蝉鸣声单调而执着，像一支催眠曲。你打了个长长的哈欠，必须赶紧找个地方歇一歇，否则真要站着睡着了。',
      weight: 3,
      cooldownTicks: 20,
      entryPhase: 'afternoon_rest_1',
      phases: {
        afternoon_rest_1: {
          phaseId: 'afternoon_rest_1',
          narrative:
            '你揉了揉惺忪的睡眼，环顾四周。左手边是一家茶肆，门口挂着"午歇 茶 二文"的木牌，里面几张竹榻上已经躺了三两个人。右手边的柳树下有一排石凳，虽然硬了点，但树荫浓密，还时不时有一阵穿堂风吹过。再远一些，你看到一座小石桥的桥洞下铺着干草，似乎是个不错的午睡之所。',
          choices: [
            {
              id: 'teahouse_nap',
              text: '去茶肆花两文钱，在竹榻上好好歇一会儿。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 2,
              },
              consequence: {
                immediateEffects: { copper: -2, health: 6, mood: 6 },
                nextPhase: null,
                endingNarrative:
                  '你走进茶肆，把两文钱放在柜台上。掌柜指了指角落里一张空着的竹榻，又端来一盏凉茶。你躺上去，竹榻发出轻微的吱嘎声。凉茶放在旁边的矮凳上，头顶的吊扇被穿堂风带动着慢慢转。你闭上眼睛，听着隔壁桌两个人有一搭没一搭地聊着城南的新开的胭脂铺，不知不觉就睡着了。醒来时不知过了多久，只觉得神清气爽，口中的凉茶已经被掌柜续过了——还是凉的。你道了声谢，伸着懒腰走出了茶肆。',
              },
            },
            {
              id: 'tree_bench_nap',
              text: '在柳树下的石凳上靠一会儿，不花钱。',
              consequence: {
                immediateEffects: { health: 3, mood: 2 },
                nextPhase: 'afternoon_rest_dream',
              },
            },
            {
              id: 'bridge_nap',
              text: '去桥洞底下铺点干草，睡个踏实的午觉。',
              consequence: {
                immediateEffects: { health: 5, mood: 4 },
                nextPhase: null,
                endingNarrative:
                  '你钻进桥洞，发现干草堆比想象中干净柔软。你枕着胳膊躺了下来，头顶是石桥拱形的底面，耳边是桥上偶尔走过的脚步声和桥下潺潺的流水声。阳光从桥洞口斜射进来，在水面上映出一片碎金。你听着水声，像听着大自然最温柔的催眠曲，很快就沉入了梦乡。醒来时日头已经偏西，你坐起来伸了个大大的懒腰，揉了揉脸上被干草压出的印子。河水清凉，你捧起来洗了把脸，精神抖擞地踏上了接下来的路。',
              },
            },
          ],
        },
        afternoon_rest_dream: {
          phaseId: 'afternoon_rest_dream',
          narrative:
            '你靠在柳树干上，在石凳上半躺半坐。柳枝垂下来，在脸上轻轻拂动，痒痒的。你迷迷糊糊地快要睡着了，忽然听到身旁有人轻轻叫你："喂，醒醒，你的钱袋露出来了。"你一激灵睁开眼，发现一个十来岁的小童蹲在你旁边，正指着你腰间半露出来的钱袋。他穿着一身打了补丁的短褐，脚上的草鞋破了一个洞，但一双眼睛清亮得很。',
          choices: [
            {
              id: 'thank_and_reward',
              text: '感谢小童提醒，给他两文钱买个炊饼。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 2,
              },
              consequence: {
                immediateEffects: { copper: -2, mood: 8 },
                relationChange: 6,
                nextPhase: null,
                endingNarrative:
                  '你赶紧把钱袋掖好，从里面摸出两文铜钱递给小童："多谢你提醒，拿着买两个炊饼吃。"小童接过铜钱，咧嘴一笑，露出缺了一颗门牙的嘴："谢谢大叔！"说完撒丫子就跑了，跑了两步又回过头来喊："大叔你别在这儿睡了，小心着凉！"你望着他跑远的背影，忍不住笑了。你在石凳上又歇了片刻，这回把钱袋捂得严严实实，然后心满意足地起身继续赶路。',
              },
            },
            {
              id: 'thank_no_reward',
              text: '谢过小童，继续歇息。',
              consequence: {
                immediateEffects: { mood: 3 },
                nextPhase: null,
                endingNarrative:
                  '你把钱袋收好，对那小童说了声谢谢。小童歪着头看了你一眼，说："大叔你看起来好累。"说完便跑到旁边的柳树下去捉知了了。你靠回树干，这次学乖了，一手捂着钱袋一手枕着头。柳枝还在脸上拂动，蝉鸣又响了起来，但这一次你心里踏实了许多，很快就沉沉地睡了过去。等你再睁开眼时，日头已经西斜，树影拉得老长。你站起来抖了抖衣上的树皮碎屑，迈着轻快的步子继续赶路。',
              },
            },
          ],
        },
      },
    },
  },
];
