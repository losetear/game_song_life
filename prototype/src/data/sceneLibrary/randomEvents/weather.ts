// === 随机事件 — 天气 (Random Weather Events) ===
//
// 宋代天气相关随机事件，1-2幕轻量场景。
// 包含：骤雨来袭、烈日中暑、雪困归途、寒风凛冽、雨后彩虹、雷暴惊马

import { RandomEvent } from '../../../ai/sceneLibrary/types';

export const WEATHER_RANDOM_EVENTS: RandomEvent[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. 骤雨来袭 — Sudden Downpour
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_weather_sudden_rain',
    name: '骤雨来袭',
    description: '天色骤变，乌云翻涌，豆大的雨点劈头盖脸地砸下来。路人四散奔逃，寻找避雨之处。',
    trigger: {
      weather: ['rain', 'heavy_rain', 'storm', 'thunderstorm'],
    },
    weight: 3,
    cooldownTicks: 25,
    scene: {
      id: 're_weather_sudden_rain',
      name: '骤雨来袭',
      description: '突如其来的暴雨，需要快速做出反应。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '方才还是好好的天，转眼间乌云如泼墨般漫过天际。一阵狂风卷着土腥味扑面而来，紧接着豆大的雨点便砸了下来——先是零零落落，转瞬便成了瓢泼大雨。街上的行人惊叫着四散奔逃，有头顶菜叶跑的，有拎着裙摆跑的，好不热闹。',
      weight: 3,
      cooldownTicks: 25,
      entryPhase: 'sudden_rain_1',
      phases: {
        sudden_rain_1: {
          phaseId: 'sudden_rain_1',
          narrative:
            '雨水顺着你的额头淌下来，眨眼的功夫衣衫便湿透了。前方的茶肆屋檐下已经挤满了避雨的人，有人朝你招手喊着"这边！"路边的布幌子被风扯得猎猎作响，地上积水汇成小溪，裹挟着落叶和碎纸往低处涌。你必须赶紧做出决定。',
          choices: [
            {
              id: 'run_to_teahouse',
              text: '三步并作两步，冲向那家茶肆避雨。',
              consequence: {
                immediateEffects: { mood: -2, health: -3 },
                nextPhase: 'sudden_rain_teahouse',
              },
            },
            {
              id: 'buy_umbrella',
              text: '路边有个卖油纸伞的小贩，花几文钱买把伞。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 8,
              },
              consequence: {
                immediateEffects: { copper: -8, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你掏出八文铜钱，从小贩手里接过一把崭新的油纸伞。竹骨油面，伞面上还画着一枝淡墨兰花。撑开伞的那一刻，雨声突然变得遥远而温柔，仿佛天地间只剩你和这一方小小的晴空。你踩着水洼慢悠悠地继续赶路，反倒觉得雨天也别有一番趣味。',
              },
            },
            {
              id: 'help_old_man',
              text: '雨中有个老人滑倒在泥水里，去扶他一把。',
              consequence: {
                immediateEffects: { health: -5, mood: 8 },
                relationChange: 10,
                nextPhase: null,
                endingNarrative:
                  '你趟着没过脚踝的积水跑过去，一把扶起了那个老人。他浑身湿透，膝盖上蹭破了皮，直说"多谢小哥多谢小哥"。你搀着他慢慢走到屋檐下，从怀里掏出干净的帕子让他擦擦脸。老人颤巍巍地接过帕子，一双浑浊的眼睛里满是感激："这年头，还有你这般心善的年轻人。"雨幕中，你虽然浑身湿冷，心里却暖烘烘的。',
              },
            },
          ],
        },
        sudden_rain_teahouse: {
          phaseId: 'sudden_rain_teahouse',
          narrative:
            '你挤进了茶肆的屋檐下，浑身滴着水。屋里弥漫着茶香和潮气，掌柜正在灶台后煮着一壶姜茶。旁边一个书生模样的人正在拧干袖子，看见你狼狈的样子笑了笑："兄台也是被这鬼天气耍了吧？"桌上有几碟点心，灶上姜茶正冒着热气。',
          choices: [
            {
              id: 'ginger_tea',
              text: '来一碗热姜茶暖暖身子，花不了几个钱。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 3,
              },
              consequence: {
                immediateEffects: { copper: -3, health: 5, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你花了三文钱要了一碗姜茶。滚烫的茶汤入喉，一股暖意从胃里向四肢蔓延开来。你捧着粗瓷碗，看着檐外的雨帘出神。雨势渐小，远处的天际竟透出了一线亮光。书生朝你拱了拱手，说声"后会有期"，便冒着残雨走了。你将碗中的姜茶一饮而尽，觉得这突如其来的雨倒也不算坏事。',
              },
            },
            {
              id: 'chat_with_scholar',
              text: '和那书生聊聊天，等雨停了再走。',
              consequence: {
                immediateEffects: { mood: 6 },
                relationChange: 5,
                nextPhase: null,
                endingNarrative:
                  '你挨着书生坐下，两人有一搭没一搭地聊了起来。他说自己是今年要赴秋闱的举子，租住在城南的破庙里苦读。聊着聊着，话题从经史子集扯到了汴京城里哪家炊饼最好吃，两人不约而同笑出了声。雨渐渐停了，书生起身告辞："兄台为人洒脱，日后若我中了第，定当请你喝酒。"你笑着摆手，目送他撑着一把旧伞消失在街角。',
              },
            },
            {
              id: 'wait_and_leave',
              text: '安静等雨变小就赶紧走，别耽搁了。',
              consequence: {
                immediateEffects: { health: 3 },
                nextPhase: null,
                endingNarrative:
                  '你靠着柱子等了约莫一盏茶的功夫，雨势渐收。你抖了抖衣衫上的水珠，深吸一口雨后清新的空气，继续赶路。脚下的青石板被雨水冲刷得油亮，倒映着头顶渐渐散开的云层。虽然衣衫未干，但好在没有着凉。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. 烈日中暑 — Heatstroke under Scorching Sun
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_weather_heatstroke',
    name: '烈日中暑',
    description: '盛夏酷暑，骄阳似火，走在路上热浪滚滚，令人头晕目眩。',
    trigger: {
      weather: ['sunny', 'clear', 'hot'],
      season: ['summer'],
    },
    weight: 3,
    cooldownTicks: 30,
    scene: {
      id: 're_weather_heatstroke',
      name: '烈日中暑',
      description: '酷暑难耐，中暑倒地，需要自救或求人相助。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '头顶一轮毒日头，明晃晃地悬在正当空。地上的石板被晒得滚烫，隔着鞋底都能感觉到灼人的热气。蝉鸣震耳欲聋，热浪扭曲了远处的景物，连空气都像是被煮开了。你走着走着，忽然觉得眼前一阵发黑，双腿发软，额头上的汗珠大颗大颗地往下淌。',
      weight: 3,
      cooldownTicks: 30,
      entryPhase: 'heatstroke_1',
      phases: {
        heatstroke_1: {
          phaseId: 'heatstroke_1',
          narrative:
            '你的脑袋嗡嗡作响，眼前的景象开始扭曲模糊。路边的槐树投下一片难得的阴凉，树根处有人摆了个凉水摊子，一块木板上歪歪扭扭写着"凉水 三文"。你的嘴唇干裂得快要出血，身体摇晃不定，随时都可能一头栽倒在地。',
          choices: [
            {
              id: 'buy_cold_water',
              text: '赶紧凑到凉水摊前，买一碗凉水灌下去。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 3,
              },
              consequence: {
                immediateEffects: { copper: -3, health: 8, mood: 4 },
                nextPhase: null,
                endingNarrative:
                  '你跌跌撞撞地摸到凉水摊前，把三文钱往木板上一拍。摊主是个半大孩子，手脚利索地舀了一碗井水递过来，水里还漂着几片薄荷叶。你接过来仰头灌下，冰凉的水顺着喉咙淌进胃里，整个人像是被从火炉里捞出来一样，瞬间活过来了。你在树荫下又歇了片刻，等头不晕了才起身继续赶路。',
              },
            },
            {
              id: 'rest_under_tree',
              text: '撑着最后一口气，挪到树荫底下歇一歇。',
              consequence: {
                immediateEffects: { health: -5, mood: -3 },
                nextPhase: 'heatstroke_tree',
              },
            },
            {
              id: 'push_through',
              text: '咬咬牙硬撑着继续走，不能耽误工夫。',
              consequence: {
                immediateEffects: { health: -15, mood: -8 },
                nextPhase: null,
                endingNarrative:
                  '你咬紧牙关，强迫自己继续迈步。然而走了不到二十丈，眼前彻底黑了下来——你一头栽倒在滚烫的石板路上，额头磕出一片血印。不知过了多久，你被一阵清凉弄醒，有人正在往你脸上撩水。你挣扎着坐起来，发现自己躺在一间药铺的门槛边，一个好心的伙计正守在旁边。"你可算醒了，"他松了口气，"中暑可不是闹着玩的，再躺一会儿吧。"你浑身上下又酸又痛，这下至少得歇上两天才能缓过来。',
              },
            },
          ],
        },
        heatstroke_tree: {
          phaseId: 'heatstroke_tree',
          narrative:
            '你瘫坐在槐树根下，背靠着粗糙的树皮，大口大口地喘着粗气。头顶的蝉鸣震得你太阳穴突突直跳。这时一位提着竹篮的大婶从旁边经过，看见你脸色煞白，便从篮子里掏出一个水囊递过来："后生，你这是中暑了吧？快喝口水。"她又在篮子里翻了翻，摸出两颗青梅："酸梅，含着，解暑的。"',
          choices: [
            {
              id: 'thank_and_accept',
              text: '感激地接过水囊和青梅，道谢不迭。',
              consequence: {
                immediateEffects: { health: 6, mood: 8 },
                relationChange: 8,
                nextPhase: null,
                endingNarrative:
                  '你接过水囊咕咚咕咚灌了几口，又把青梅含在嘴里，酸得龇牙咧嘴，但精神确实好了许多。大婶看着你的样子笑了："这才像话。大热天的出门记得戴顶帽子，别仗着年轻就不管不顾。"你连声道谢，目送她提着竹篮远去。嘴里的青梅慢慢化开，酸中带甜，你忽然觉得这人世间到底还是好人多。',
              },
            },
            {
              id: 'pay_for_water',
              text: '喝了水后坚持要付钱给大婶。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 5,
              },
              consequence: {
                immediateEffects: { copper: -5, health: 6, mood: 10 },
                relationChange: 12,
                nextPhase: null,
                endingNarrative:
                  '你喝完水，从袖中摸出五文钱硬塞到大婶手里："不成敬意，多谢您搭救。"大婶连连推辞，你坚持了半天她才收下，嘴上说"用不着用不着"，脸上却笑开了花。临走时她还回头叮嘱了一句："下次出门带把扇子！"你含着青梅坐在树荫下，望着她远去的背影，心想这世上终究是暖意多过寒凉。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. 雪困归途 — Snowed In on the Way Home
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_weather_snow_trapped',
    name: '雪困归途',
    description: '隆冬时节大雪纷飞，积雪没过脚踝，前路难辨，归途受阻。',
    trigger: {
      weather: ['snow', 'heavy_snow', 'blizzard'],
      season: ['winter'],
    },
    weight: 3,
    cooldownTicks: 35,
    scene: {
      id: 're_weather_snow_trapped',
      name: '雪困归途',
      description: '大雪封路，进退两难，需要在严寒中做出抉择。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '朔风呼啸，鹅毛大雪铺天盖地地倾泻下来。不过一炷香的功夫，地上的积雪便没了脚踝。天地间白茫茫一片，分不清哪里是路、哪里是沟渠。远处隐约可见几点灯火，但被风雪搅得忽明忽暗，辨不清方向。你的手指已经冻得僵硬，再这样下去怕是要出事。',
      weight: 3,
      cooldownTicks: 35,
      entryPhase: 'snow_trapped_1',
      phases: {
        snow_trapped_1: {
          phaseId: 'snow_trapped_1',
          narrative:
            '风雪越来越大，脚下的路已经完全被雪覆盖。你隐隐约约看到前方有一间孤零零的茅屋，屋檐下挂着一盏被风吹得摇摇晃晃的风灯。那是猎户歇脚的山棚。另一个方向，你记得来时的路大概在那个方位，但暴雪中什么都看不清。你的衣领里灌满了雪，冷得直打哆嗦。',
          choices: [
            {
              id: 'go_to_cabin',
              text: '朝那间亮着灯的茅屋走去，先避一避风雪。',
              consequence: {
                immediateEffects: { health: -5 },
                nextPhase: 'snow_trapped_cabin',
              },
            },
            {
              id: 'push_homeward',
              text: '凭着记忆硬闯回去，不想耽搁。',
              consequence: {
                immediateEffects: { health: -15, mood: -8 },
                nextPhase: null,
                endingNarrative:
                  '你低头顶着风雪，凭着模糊的记忆往回走。然而大雪早已改变了所有参照物，你越走越觉得不对——脚下的路从石板变成了泥地，又从泥地变成了冰冻的河面。一声脆响，脚下的冰面裂开一道缝！你吓得魂飞魄散，连滚带爬地退回岸上。这一折腾耗尽了最后的力气，你跌坐在雪地里，不知道过了多久才被一队巡夜的差役发现抬了回去。醒来时你躺在自家床上，盖了三层棉被，手脚都生了冻疮。',
              },
            },
            {
              id: 'dig_snow_shelter',
              text: '就地挖一个雪窝，等暴雪过去再说。',
              consequence: {
                immediateEffects: { health: -8, mood: -3 },
                nextPhase: null,
                endingNarrative:
                  '你找了路边一棵大松树，靠着树根刨开积雪，把自己蜷成一团缩了进去。松枝挡住了大部分风雪，雪窝里虽然冷，但至少比外头好受些。你搓着僵硬的双手，把脸埋进衣领里取暖。风声在头顶呼啸，你闭着眼睛数着自己的心跳，一下、两下……不知过了多久，风声渐渐弱了下来。你探出头，发现雪已经停了，月光洒在银白色的天地间，清冷而明亮。你抖落身上的积雪，辨认了一下方向，深一脚浅一脚地踏上了归途。',
              },
            },
          ],
        },
        snow_trapped_cabin: {
          phaseId: 'snow_trapped_cabin',
          narrative:
            '你推开茅屋吱嘎作响的木门，一股柴火味扑面而来。屋里不大，只有一张破旧的木板床和一个土灶。灶膛里还有未熄的余烬，散发着微弱的暖意。墙角堆着几捆干柴，桌上有一只豁了口的陶碗和半罐粗盐。屋外的风雪声透过墙缝呜呜地传进来，但屋内总算是个避风港。',
          choices: [
            {
              id: 'light_fire_and_rest',
              text: '添些柴火把灶膛烧旺，暖暖身子再走。',
              consequence: {
                immediateEffects: { health: 10, mood: 5 },
                nextPhase: null,
                endingNarrative:
                  '你从墙角抱了几捆干柴塞进灶膛，用火折子引燃了。火苗舔着柴梗，发出噼啪的声响，暖光渐渐充满了整间茅屋。你把手伸到灶前烤着，冻僵的手指慢慢恢复了知觉，又痒又痛。你在木板床上坐了一会儿，听着外面的风雪声渐渐变小。等到灶火快灭的时候，你起身拍了拍衣上的灰，推开木门走了出去。雪已经停了，天边透出一线鱼肚白。空气冷冽而清新，脚下的积雪在晨光中闪着细碎的光芒。',
              },
            },
            {
              id: 'take_firewood_leave',
              text: '歇一歇就走，再带上几根柴火路上用。',
              consequence: {
                immediateEffects: { health: 5, mood: -2 },
                nextPhase: null,
                endingNarrative:
                  '你在灶前暖了暖手，没敢久留。临走时从墙角抽了几根干柴夹在腋下，心想路上万一撑不住还能生火。你重新裹紧衣衫，推开木门钻进了风雪里。好在暴雪已经转小，你凭着那几点微弱的灯光和记忆，总算摸到了回城的路上。到家时天色已经大亮，你抖落一身积雪，灌了一大碗热姜汤，心想：明年冬天一定备好御寒之物。',
              },
            },
            {
              id: 'leave_payment',
              text: '用了人家的柴火，留几文钱在桌上。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 5,
              },
              consequence: {
                immediateEffects: { copper: -5, health: 10, mood: 8 },
                nextPhase: null,
                endingNarrative:
                  '你在灶前把身子暖透了，又烧了些雪水化开喝了几口。临走时从袖中摸出五文铜钱，整整齐齐地码在桌上，又找了一块木炭在桌面上写了"借宿谢过"四个字。你推门而出，风雪已经停了，阳光穿破云层照在皑皑白雪上，刺得人眼睛发酸。你深吸一口气，冰冷的空气灌进肺里，精神为之一振。归途上你回头望了一眼那间茅屋，风灯已经灭了，但你知道，那盏灯曾在最冷的夜里给了你最需要的温暖。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. 寒风凛冽 — Bitter Cold Wind
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_weather_cold_wind',
    name: '寒风凛冽',
    description: '隆冬腊月，北风呼啸如刀，冻得人寸步难行。',
    trigger: {
      weather: ['cold', 'windy', 'freezing'],
      season: ['winter'],
    },
    weight: 4,
    cooldownTicks: 30,
    scene: {
      id: 're_weather_cold_wind',
      name: '寒风凛冽',
      description: '刺骨寒风让人瑟瑟发抖，需要想办法抵御寒冷。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '北风像一把把看不见的刀子，专往衣裳的缝隙里钻。你裹紧了身上的棉袍，却仍挡不住那股从骨头缝里渗出来的寒意。街上的行人都缩着脖子、揣着手，走得飞快。路旁的水沟已经结了冰，枯枝上挂着晶莹的冰凌，在惨白的日头下闪闪发亮。你的鼻尖冻得通红，呼出的每一口气都化成白雾。',
      weight: 4,
      cooldownTicks: 30,
      entryPhase: 'cold_wind_1',
      phases: {
        cold_wind_1: {
          phaseId: 'cold_wind_1',
          narrative:
            '一阵猛烈的北风灌进你的领口，你不由自主地打了个寒颤，牙关咬得咯咯响。前方不远处的街角有个烤红薯的摊子，炉子上冒着腾腾热气，香甜的焦味顺着风飘了过来。摊主是个裹着羊皮袄的壮汉，正跺着脚取暖。另一边，你看到一间成衣铺门口挂着"清仓 冬衣半价"的幌子。',
          choices: [
            {
              id: 'buy_sweet_potato',
              text: '去买一个烤红薯暖暖手，也填填肚子。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 4,
              },
              consequence: {
                immediateEffects: { copper: -4, health: 5, mood: 6 },
                nextPhase: null,
                endingNarrative:
                  '你花了四文钱买了一个拳头大的烤红薯，捧在手心里暖烘烘的。剥开焦黑的薯皮，露出金黄色的薯肉，热气和甜香一齐涌上来。你咬了一大口，烫得龇牙咧嘴，但那股暖意顺着食道滑进胃里，整个人顿时舒服了不少。你蹲在炉子旁边，一边吃一边听那壮汉絮叨今年的冬天比去年还冷，连运河都冻上了。吃完最后一口红薯，你拍了拍手上的灰，觉得身上暖和了许多，便顶着北风继续赶路。',
              },
            },
            {
              id: 'buy_winter_coat',
              text: '咬咬牙买件厚实的冬衣，这风实在受不住。',
              condition: {
                field: 'copper',
                operator: 'gte',
                value: 50,
              },
              consequence: {
                immediateEffects: { copper: -50, health: 10, mood: 8 },
                nextPhase: null,
                endingNarrative:
                  '你推开成衣铺的棉帘走进去，一股暖气裹住了你。掌柜是个精明的中年妇人，见你冻得嘴唇发紫，二话不说从架子上取下一件厚棉袍："客官好眼光，这可是双层面子的，絮的是新棉花，保暖得很。"你摸了摸那棉袍，确实厚实柔软。咬牙付了五十文钱，当堂把新棉袍套在了身上。走出铺门时，北风依旧呼啸，但这一次风被厚实的棉袍挡在了外面。你挺直了腰板，在寒风中迈开了大步。',
              },
            },
            {
              id: 'brave_the_wind',
              text: '省着点花，加快脚步赶紧到地方。',
              consequence: {
                immediateEffects: { health: -8, mood: -5 },
                nextPhase: null,
                endingNarrative:
                  '你把领子竖起来，低着头冲进了风里。冷风像鞭子一样抽在脸上，耳朵和鼻尖很快就失去了知觉。你咬着牙一路快走，心里默数着还要走多少步。等终于到了目的地，你的双手已经冻得通红肿胀，捧着热茶杯好半天才缓过来。你暗暗发誓，下个月的月钱一定先攒着买件厚衣裳。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. 雨后彩虹 — Rainbow after Rain
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_weather_rainbow',
    name: '雨后彩虹',
    description: '一场雨过后，天边横跨一道绚丽的彩虹，引得路人纷纷驻足。',
    trigger: {
      weather: ['clear', 'sunny'],
    },
    weight: 2,
    cooldownTicks: 40,
    scene: {
      id: 're_weather_rainbow',
      name: '雨后彩虹',
      description: '雨过天晴，彩虹横空，一桩难得的美景。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '方才还阴沉沉的天空不知何时放晴了，阳光从云层的缝隙中倾泻而下，将雨后的街道照得一片金红。空气里弥漫着泥土和青草的气息，屋檐上的雨滴在阳光下闪烁着碎金般的光芒。忽然，人群中有人惊呼一声，纷纷抬头望去——一道巨大的彩虹横亘天际，赤橙黄绿青蓝紫，七色分明，美得不像真的。',
      weight: 2,
      cooldownTicks: 40,
      entryPhase: 'rainbow_1',
      phases: {
        rainbow_1: {
          phaseId: 'rainbow_1',
          narrative:
            '你停下脚步，仰头望着那道彩虹。周围的行人也都驻足了，有孩童拍着手欢呼，有老人双手合十念念有词，说这是吉兆。彩虹的一端落在远处的青山之上，另一端隐入城中的烟雨楼阁之间，将整个汴京城映衬得如同一幅泼墨山水画。旁边的茶楼二层有人正在弹琵琶，清越的乐声随风飘来。',
          choices: [
            {
              id: 'enjoy_moment',
              text: '找个好位置坐下来，静静地看一会儿。',
              consequence: {
                immediateEffects: { mood: 12 },
                nextPhase: null,
                endingNarrative:
                  '你在路边的石阶上坐了下来，双手撑在身后，仰头望着那道彩虹。它静静地挂在天边，缓慢地变化着，颜色一点点变得柔和。琵琶声从茶楼上传来，和着雨后的鸟鸣，像一首即兴的小曲。你不知道坐了多久，直到彩虹渐渐淡去，天空恢复了雨后特有的澄澈碧蓝。你站起来，拍了拍衣摆上的水渍，长长地舒了一口气——这一刻的宁静与美好，值得你花时间去记住。',
              },
            },
            {
              id: 'share_with_child',
              text: '旁边有个小童在问娘亲"那是什么桥"，你蹲下来给他讲讲。',
              consequence: {
                immediateEffects: { mood: 10 },
                relationChange: 5,
                nextPhase: null,
                endingNarrative:
                  '你蹲下身来，对那个瞪着大眼睛的小童说："那叫彩虹。是天上的仙女用七色丝线织成的桥，下雨过后才会出来。"小童"哇"了一声，又问："那仙女从桥上走过吗？"你笑着说："当然会啊，不过她们走得很快，凡人的眼睛看不见。"小童高兴得手舞足蹈，他娘亲朝你感激地笑了笑。你站起身来，望着彩虹微微一笑——这世间有些美好，本就该讲给孩子听。',
              },
            },
            {
              id: 'rush_past',
              text: '看了一眼便继续赶路，别为这点小事耽搁。',
              consequence: {
                immediateEffects: { mood: 2 },
                nextPhase: null,
                endingNarrative:
                  '你扫了一眼天边的彩虹，心想不过是日光照在雨雾上的折射罢了，没什么稀奇。你加快脚步走过了驻足的人群。走了几步之后，不知为何又回头看了一眼——彩虹已经不如方才鲜明了，颜色正在一点一点褪去。你收回目光，继续赶路。你告诉自己不值得为此停留，但不知怎的，脚步却不由自主地慢了下来。',
              },
            },
          ],
        },
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. 雷暴惊马 — Thunderstorm Startles Horses
  // ══════════════════════════════════════════════════════════════════
  {
    id: 're_weather_thunder_horse',
    name: '雷暴惊马',
    description: '雷暴骤起，惊雷炸响，街上的骡马受惊狂奔，场面一片混乱。',
    trigger: {
      weather: ['storm', 'thunderstorm'],
    },
    weight: 3,
    cooldownTicks: 25,
    scene: {
      id: 're_weather_thunder_horse',
      name: '雷暴惊马',
      description: '惊雷吓得骡马失控，街上乱作一团，需要迅速反应。',
      triggerCondition: {
        actorTraits: [],
        actorForbiddenTraits: [],
        targetRequired: false,
      },
      participants: [],
      openingNarrative:
        '一道惨白的闪电劈开了昏暗的天幕，紧接着一声炸雷在头顶炸响——"轰隆！"震得地面都在颤抖。街角停着的一辆运货马车上的骡子受了惊，嘶鸣一声挣脱了缰绳，拉着板车疯了似地在街上狂奔！车上的货物七零八落地砸了一地，行人尖叫着四散奔逃。',
      weight: 3,
      cooldownTicks: 25,
      entryPhase: 'thunder_horse_1',
      phases: {
        thunder_horse_1: {
          phaseId: 'thunder_horse_1',
          narrative:
            '受惊的骡子拉着板车朝你冲了过来！车板上还散落着半车陶罐和布匹，颠簸间陶罐不断摔落碎裂。那骡子双眼圆睁、鼻孔喷着白气，已经完全失控。你右边是一堵矮墙，左边是一排摊位，身后是惊慌的人群——退路有限，必须立刻做出反应。',
          choices: [
            {
              id: 'grab_reins',
              text: '冲上去抓住骡子的缰绳，制止它继续狂奔！',
              condition: {
                field: 'health',
                operator: 'gte',
                value: 40,
              },
              consequence: {
                immediateEffects: { health: -12, mood: 8 },
                relationChange: 15,
                nextPhase: 'thunder_horse_aftermath',
              },
            },
            {
              id: 'dodge_aside',
              text: '翻身躲到矮墙后面，先保住自己要紧。',
              consequence: {
                immediateEffects: { health: -3 },
                nextPhase: null,
                endingNarrative:
                  '你一个侧翻跃过矮墙，蹲在墙根下面。骡子拉着板车从你面前呼啸而过，一只陶罐飞起来在墙上砸了个粉碎，碎片擦着你的头顶飞了过去。惊马拖着板车一路冲到了街尾，最后撞在一堆草垛上才停下来，骡子腿上淌着血，车板断成了两截。你拍了拍身上的碎陶片，从矮墙上翻回来，心还在怦怦直跳。',
              },
            },
            {
              id: 'help_fallen_person',
              text: '有个老妇人被人群撞倒在路中央，先去拉她起来！',
              consequence: {
                immediateEffects: { health: -8, mood: 10 },
                relationChange: 12,
                nextPhase: null,
                endingNarrative:
                  '你看见老妇人跌坐在路中央，浑然不知身后惊马将至。你箭步冲过去，一把拽住她的胳膊将她拖到路边的摊位后面。几乎同一瞬间，骡子和板车从她方才坐的位置呼啸而过，带起一阵腥风。老妇人吓得脸色惨白，紧紧攥着你的胳膊不放，浑身抖得像筛糠。你拍着她的后背安慰道："没事了，没事了。"远处传来骡子主人焦急的呼喊声，你把老妇人交给赶来的家人，默默退出了人群。',
              },
            },
          ],
        },
        thunder_horse_aftermath: {
          phaseId: 'thunder_horse_aftermath',
          narrative:
            '你抓住缰绳的瞬间，骡子猛地一甩头，差点把你甩飞出去。你死死扣住缰绳，脚跟蹬地，被骡子拖出去了好几步。好在骡子跑了半条街之后终于力竭，喘着粗气停了下来。它的身上满是汗沫，腿上有几道擦伤。骡子的主人——一个黑脸膛的中年汉子气喘吁吁地跑过来，脸上又是后怕又是感激。',
          choices: [
            {
              id: 'accept_reward',
              text: '帮人帮到底，帮他把骡子牵回去，看看有没有什么谢礼。',
              consequence: {
                immediateEffects: { copper: 10, mood: 5 },
                relationChange: 8,
                nextPhase: null,
                endingNarrative:
                  '你牵着骡子跟着汉子回到了他的铺子。他连声道谢，从柜台底下翻出一小袋铜钱硬塞到你手里："十文钱，不多，但这是我的一点心意。今儿要不是你，这骡子非得闯出大祸不可。"你推辞了两句便收下了。汉子又给你倒了碗水，你一饮而尽，揉了揉被缰绳勒红的手掌，感觉虽然受了些皮肉苦，倒也值了。',
              },
            },
            {
              id: 'decline_and_leave',
              text: '"举手之劳，不必放在心上。"转身就走。',
              consequence: {
                immediateEffects: { mood: 12 },
                relationChange: 15,
                nextPhase: null,
                endingNarrative:
                  '你把缰绳交到汉子手里，摆了摆手："举手之劳罢了，不必谢。"汉子还想说些什么，你已经转身走进了人群。身后传来他的声音："这位小哥——你叫什么名字？"你没有回头，只是微微抬起手晃了晃，便消失在了街角。手心被缰绳勒出的红印还在隐隐作痛，但你嘴角不自觉地翘了起来。雷声渐渐远去，暴风雨也快要过去了。',
              },
            },
          ],
        },
      },
    },
  },
];
