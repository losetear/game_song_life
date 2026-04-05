// === 涌现式行为规则引擎 ===
// 行为不再按类型硬编码，而是根据世界状态动态涌现

import { ActionRule, InteractionContext, EntityAction, ActionFeedback } from '../server/protocol';

// === 辅助函数 ===

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

/** 获取好感度 */
function getImpression(ctx: InteractionContext): number {
  return ctx.player.memory.impressions[String(ctx.target.id)] || 0;
}

function isRiverArea(areaId: string | null | undefined): boolean {
  return areaId === 'river';
}

function isFarmlandArea(areaId: string | null | undefined): boolean {
  return areaId === 'farmland';
}

function isMerchant(profession: string): boolean {
  return ['merchant', '商贩', '掌柜', '伙计', '药铺伙计', '布商'].includes(profession);
}

function isDoctor(profession: string): boolean {
  return ['doctor', '大夫', '药铺伙计', '药师'].includes(profession);
}

function isGuard(profession: string): boolean {
  return ['guard', '捕快', '衙役', '守卫', '军官', '校尉'].includes(profession);
}

function isRogue(profession: string): boolean {
  return ['rogue', '盗贼', '飞贼', '小偷', '暗探'].includes(profession);
}

function isBlacksmith(profession: string): boolean {
  return ['blacksmith', '铁匠', '铁匠铺'].includes(profession);
}

function isFarmer(profession: string): boolean {
  return ['farmer', '农夫', '农民', '佃户'].includes(profession);
}

function isHunter(profession: string): boolean {
  return ['hunter', '猎户', '猎人'].includes(profession);
}

function isTeacher(profession: string): boolean {
  return ['teacher', 'scholar', '先生', '书生', '教书先生', '学者'].includes(profession);
}

function isSkillTeacher(profession: string): boolean {
  return ['doctor', 'hunter', 'blacksmith', 'farmer', 'fisherman', 'carpenter',
    '大夫', '猎户', '铁匠', '农夫', '渔夫', '木匠'].includes(profession);
}

function nearbyRelevantCount(entities: { id: number; type: string }[]): number {
  return entities.filter(e => e.type === 'npc' || e.type === 'animal').length;
}

const SKILL_MAP: Record<string, string> = {
  'doctor': '辨认草药', 'hunter': '追踪术', 'blacksmith': '锻打技巧',
  'farmer': '种植知识', 'fisherman': '捕鱼技法', 'carpenter': '木工手艺',
  '大夫': '辨认草药', '猎户': '追踪术', '铁匠': '锻打技巧',
  '农夫': '种植知识', '渔夫': '捕鱼技法', '木匠': '木工手艺',
};

/** 判断玩家与目标是否同组织 */
function isSameFaction(ctx: InteractionContext): boolean {
  return ctx.player.factionId != null && ctx.player.factionId === ctx.target.identity?.factionId;
}

/** 判断玩家与目标是否敌对组织（需外部 faction relations 支持，此处简化：不同组织即可能敌对） */
function isRivalFaction(ctx: InteractionContext): boolean {
  return ctx.player.factionId != null
    && ctx.target.identity?.factionId != null
    && ctx.player.factionId !== ctx.target.identity.factionId;
}

// ============================================================
// 涌现规则定义（57条）
// ============================================================

export const EMERGENCE_RULES: ActionRule[] = [

  // ═══ NPC 相关（13条） ═══

  // 1. 攀谈
  {
    id: 'talk_to', name: '攀谈', icon: '💬', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'npc',
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      // 敌对组织可能拒绝攀谈
      if (isRivalFaction(ctx) && getImpression(ctx) < -30) {
        return { met: false, reason: '对方因组织敌意拒绝与你交谈' };
      }
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const v = ctx.target.vital;
      if (v && v.hunger < 30) return `${name}看起来饿坏了，或许能聊聊哪里有饭吃`;
      if (v && v.mood < 30) return `${name}面色不善，攀谈需谨慎`;
      if (v && v.fatigue < 30) return `${name}看起来很疲惫，不一定有心情聊天`;
      return `和${name}聊几句，或许能打听到有用的消息`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const mood = ctx.target.vital?.mood ?? 50;
      const personality = ctx.target.identity?.personality || [];
      const profession = ctx.target.identity?.profession || '';
      let message = '';

      if (mood > 70) {
        message = pick([
          `${name}笑着说："今天运气不错，你呢？"`,
          `${name}热情地招呼你："来来来，坐下聊！最近有什么新鲜事？"`,
          `${name}拍了拍你的肩膀："咱俩谁跟谁，说吧。"`,
        ]);
      } else if (mood > 30) {
        message = pick([
          `${name}点了点头："嗯，什么事？"语气不冷不热。`,
          `${name}看了你一眼："说吧，我听着呢。"`,
          `${name}"嗯"了一声，等着你开口。`,
        ]);
      } else {
        message = pick([
          `${name}皱着眉："现在不想说话。"`,
          `${name}叹了口气："你要是说不了什么好事，就别来烦我。"`,
          `${name}白了你一眼："没心情，走开。"`,
        ]);
      }

      // 根据职业追加专属话题
      if (isGuard(profession)) {
        message += `\n\n${name}压低声音："最近城里不太平，巡逻的时候多留个心眼。前天东市那边闹了贼。"`;
      } else if (isMerchant(profession)) {
        message += `\n\n${name}掰着手指头："南边的丝绸涨了三成，粮食倒是稳住了。做买卖嘛，消息最重要。"`;
      } else if (isDoctor(profession)) {
        message += `\n\n${name}打量了你的面色："气色还行，不过别熬夜。最近换季，风寒的人不少，注意保暖。"`;
      } else if (isRogue(profession)) {
        message += `\n\n${name}嘿嘿一笑，凑近你耳边："听说城东那个大户最近在找一批丢失的货物...你懂的。"`;
      } else if (isFarmer(profession)) {
        const seasonChat = ctx.world.season === '春' ? '今年春雨来得及时，秧苗长势喜人' :
          ctx.world.season === '夏' ? '这大太阳烤得庄稼都快蔫了，就盼着下场透雨' :
          ctx.world.season === '秋' ? '秋收在即，看这架势是个丰收年' :
          '冬天地里没什么活，就窝在家里修补农具';
        message += `\n\n${name}聊起农事来滔滔不绝："${seasonChat}。"`;
      } else if (isBlacksmith(profession)) {
        message += `\n\n${name}拍着砧板："最近铁料不好买，不过我这手艺还在。你的刀要是钝了，拿过来我给你磨磨。"`;
      } else if (isHunter(profession)) {
        message += `\n\n${name}擦了擦弓弦："后山那头野猪又出现了，好几户人家的篱笆都给拱坏了。"`;
      }

      // 根据性格追加
      if (personality.includes('精明') || personality.includes('狡猾')) {
        message += `\n\n${name}上下打量了你一眼，似乎在盘算什么。`;
      }
      if (personality.includes('善良')) {
        message += `\n\n${name}的语气柔和了些："有什么难处尽管说。"`;
      }

      // 根据NPC状态追加
      if (ctx.target.vital && ctx.target.vital.hunger < 30) {
        message += `\n\n${name}的肚子咕噜响了一声，他不好意思地笑了笑："说来惭愧，今天还没吃东西呢。"`;
      }
      if (ctx.world.weather === '暴雨') {
        message += `\n\n外面雨声如注，${name}搓着手说："这鬼天气，哪儿也去不了。"`;
      }

      // 组织加成：同组织好感度变化 +50%
      let impressionGain = randInt(1, 5);
      if (isSameFaction(ctx)) {
        impressionGain = Math.ceil(impressionGain * 1.5);
        message += `\n\n${name}认出了你的身份，语气格外亲切："自己人，不必客气。"`;
      }

      return {
        success: true, message,
        impressionChange: impressionGain,
        moodChange: 2,
      };
    },
  },

  // 2. 打听消息
  {
    id: 'ask_rumor', name: '打听消息', icon: '👂', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const events = ctx.target.memory?.recentEvents;
      return !!(events && events.length > 0);
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      // 同组织降低好感度门槛
      const threshold = isSameFaction(ctx) ? -30 : -10;
      if (getImpression(ctx) < threshold) return { met: false, reason: '对方不想理你' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const events = ctx.target.memory?.recentEvents || [];
      if (events.length > 0) return `对方似乎知道些什么（知道${events.length}件事）`;
      return '听听最近发生了什么';
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const events = ctx.target.memory?.recentEvents || [];
      // 同组织NPC降低分享门槛
      const impressionBonus = isSameFaction(ctx) ? 20 : 0;
      const impression = getImpression(ctx) + impressionBonus;

      if (events.length === 0) {
        return { success: true, message: `${name}想了想："最近没什么特别的事。"`, impressionChange: 1 };
      }

      const event = pick(events);
      let detail = event.content || event.toString();

      if (impression > 50) {
        return {
          success: true,
          message: `${name}凑近你，压低声音说："我跟你说个事——${detail}"他看了看四周，又补了句："别跟别人说是我说的。"`,
          impressionChange: 2,
          moodChange: 3,
        };
      } else if (impression > 0) {
        return {
          success: true,
          message: `${name}随口提了句："哦，听说${detail}。"语气平淡，似乎不太想说太多。`,
          impressionChange: 1,
        };
      } else {
        return {
          success: true,
          message: `${name}犹豫了一下："这个...你自己去打听吧。"他似乎对你还有几分戒心。`,
          impressionChange: 0,
        };
      }
    },
  },

  // 3. 购买
  {
    id: 'trade_buy', name: '购买', icon: '💰', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      return isMerchant(ctx.target.identity?.profession || '');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 5) return { met: false, reason: '铜钱不够' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => `从${ctx.target.identity?.name || '商贩'}处购买商品`,
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '商贩';
      const copper = ctx.player.wallet.copper;
      const targetCopper = ctx.target.wallet?.copper ?? 50;

      // 根据玩家财富和商人财富决定商品档次
      const isRichMerchant = targetCopper >= 100;
      let price = randInt(5, Math.min(50, copper));

      // 同组织打8折
      if (isSameFaction(ctx)) {
        price = Math.max(1, Math.floor(price * 0.8));
      }

      // 基础商品 vs 高档商品
      const baseItems = ['一袋粗粮', '几尺麻布', '一包药材', '一捆柴火', '一壶浊酒', '几个炊饼'];
      const luxuryItems = ['一匹丝绸', '上等宣纸', '精致陶器', '铜镜', '香囊', '雕花木梳'];
      const items = isRichMerchant ? [...baseItems, ...luxuryItems] : baseItems;
      const item = pick(items);

      // 财富限制：穷人只能买低价物品
      if (copper < 20 && price > 15) {
        price = randInt(3, Math.min(15, copper));
      }

      const messages = [
        `${name}从柜台后取出${item}："${price}文，童叟无欺。"你掏出铜板，对方满意地收了。`,
        `"要这个？"${name}指着${item}，"${price}文，不还价。"你犹豫了一下，还是买了。`,
        `${name}麻利地包好${item}递给你："承惠${price}文。"你付了钱，感觉还算公道。`,
      ];

      let msg = pick(messages);
      if (isSameFaction(ctx)) {
        msg += `\n\n${name}压低声音："自己人，给你算便宜了。"`;
      }
      if (isRichMerchant) {
        msg += `\n\n${name}得意地说："我这儿的货，别家可找不着。好东西都是南边运来的。"`;
      }

      return {
        success: true, message: msg,
        copperChange: -price,
        itemsGained: [{ itemType: 'goods', amount: 1 }],
        impressionChange: 2,
        moodChange: 3,
      };
    },
  },

  // 4. 出售
  {
    id: 'trade_sell', name: '出售', icon: '💹', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (!isMerchant(ctx.target.identity?.profession || '')) return false;
      return ctx.player.inventory.items.length > 0;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.inventory.items.length === 0) return { met: false, reason: '背包没有物品' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => `出售：${ctx.player.inventory.items.map(i => i.itemType).join('、')}`,
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '商贩';
      const item = ctx.player.inventory.items[0];
      let price = randInt(3, 30);
      // 同组织收购价更高（+20%）
      if (isSameFaction(ctx)) {
        price = Math.ceil(price * 1.2);
      }
      // 职业商人给出更高收购价（+15%）
      const profession = ctx.target.identity?.profession || '';
      if (isMerchant(profession)) {
        price = Math.ceil(price * 1.15);
      }
      const personality = ctx.target.identity?.personality || [];

      let message = '';
      if (personality.includes('精明') || personality.includes('狡猾')) {
        message = `${name}翻看了一下你的${item.itemType}，挑剔地摇摇头："成色一般，${price}文，不能再多了。"你心里知道他压了价，但也不好反驳。`;
      } else {
        message = `${name}看了看你的${item.itemType}，点了点头："还行，给你${price}文。"你收了铜板，交易完成。`;
      }
      if (isSameFaction(ctx)) {
        message += `\n\n${name}低声说："自家兄弟，我多给了些，别跟外人说。"`;
      }

      return {
        success: true, message,
        copperChange: price,
        itemsLost: [item],
        impressionChange: 1,
      };
    },
  },

  // 5. 请吃饭
  {
    id: 'share_food', name: '请吃饭', icon: '🍱', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (!ctx.target.vital || ctx.target.vital.hunger >= 50) return false;
      return ctx.player.inventory.items.some(i => i.itemType === 'food');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      if (!ctx.player.inventory.items.some(i => i.itemType === 'food')) return { met: false, reason: '没有食物' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const hunger = ctx.target.vital?.hunger || 50;
      if (hunger < 20) return `${name}饿得面黄肌瘦，急需一顿饭`;
      return `${name}看起来有些饿，请他吃一顿饭`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const hunger = ctx.target.vital?.hunger ?? 50;

      let message = '';
      if (hunger < 20) {
        message = `你把食物递给${name}，他愣了一下，眼眶微微泛红。"你...你是个好人。"他小声说着，大口吃了起来，像是饿了很久。`;
      } else {
        message = pick([
          `你递上食物，${name}有些意外："给我的？"他接过去，笑着说："多谢，正饿着呢。"`,
          `${name}接过你递来的食物，三两口就吃完了。"嗝——"他不好意思地笑了笑，"不好意思，太香了。"`,
          `"这怎么好意思..."${name}嘴上推辞，手却已经接了过去。吃完后他拍了拍肚子："承蒙款待，这份情我记下了。"`,
        ]);
      }

      return {
        success: true, message,
        impressionChange: randInt(8, 15),
        itemsLost: [{ itemType: 'food', amount: 1 }],
        moodChange: 5,
      };
    },
  },

  // 6. 伸出援手
  {
    id: 'help_request', name: '伸出援手', icon: '🤝', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (!ctx.target.vital) return false;
      return ctx.target.vital.health < 30 || ctx.target.vital.hunger < 20;
    },
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      if (ctx.target.vital && ctx.target.vital.health < 30) return `${name}病得不轻，需要帮助`;
      return `${name}已经饿得不行了`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const isSick = ctx.target.vital && ctx.target.vital.health < 30;

      if (isSick) {
        const copperCost = randInt(10, 30);
        if (ctx.player.wallet.copper >= copperCost) {
          return {
            success: true,
            message: `你扶着${name}坐下，给他买了些药。"多谢..."他虚弱地说，"等我好了，一定报答你。"你花了${copperCost}文。`,
            copperChange: -copperCost,
            impressionChange: randInt(10, 20),
            moodChange: 5,
          };
        }
        return {
          success: true,
          message: `你很想帮${name}，但囊中羞涩。你扶他在墙边坐下，帮他倒了碗水。"歇歇吧，"你说。他感激地点了点头。`,
          impressionChange: randInt(5, 10),
        };
      }

      return {
        success: true,
        message: `你把自己仅有的食物分给了${name}。他狼吞虎咽地吃完，眼里含着泪光："这世上还是有好人的。"`,
        impressionChange: randInt(10, 18),
        itemsLost: [{ itemType: 'food', amount: 1 }],
      };
    },
  },

  // 7. 偷窃
  {
    id: 'steal', name: '偷窃', icon: '🤏', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (!ctx.target.wallet || ctx.target.wallet.copper <= 0) return false;
      return nearbyRelevantCount(ctx.world.nearbyEntities) < 5;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (nearbyRelevantCount(ctx.world.nearbyEntities) >= 5) return { met: false, reason: '周围人太多' };
      if (!ctx.target.wallet || ctx.target.wallet.copper <= 0) return { met: false, reason: '对方没有铜钱' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const guardCount = nearbyRelevantCount(ctx.world.nearbyEntities);
      return `偷取${name}的铜钱（周围${guardCount}人）`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const targetCopper = ctx.target.wallet?.copper ?? 0;
      const nearby = nearbyRelevantCount(ctx.world.nearbyEntities);
      const targetPersonality = ctx.target.identity?.personality || [];
      const targetProfession = ctx.target.identity?.profession || '';
      const playerProfession = ctx.player.profession || '';
      const playerPersonality = ctx.player.personality || [];

      // 成功率基于周围人数、NPC警觉性、职业和性格
      let successChance = 0.6 - nearby * 0.1;
      if (targetPersonality.includes('精明') || targetPersonality.includes('狡猾')) successChance -= 0.2;
      if (targetPersonality.includes('胆小')) successChance += 0.1;

      // 玩家是rogue时成功率更高
      if (isRogue(playerProfession)) successChance += 0.2;

      // 目标是guard/军官时更难成功
      if (isGuard(targetProfession)) successChance -= 0.25;

      // 玩家性格影响：狡猾/精明性格成功率+20%
      if (playerPersonality.includes('狡猾') || playerPersonality.includes('精明')) successChance += 0.2;

      const success = Math.random() < successChance;

      if (success) {
        // rogue偷窃数量更多
        const maxSteal = isRogue(playerProfession) ? Math.min(targetCopper, 80) : Math.min(targetCopper, 50);
        const stolen = randInt(1, maxSteal);

        let msg = `你的手悄无声息地伸向${name}的腰包——摸到了几枚铜板！${stolen}文到手。你不动声色地收回手，心跳如鼓。`;
        if (isRogue(playerProfession)) {
          msg += `\n\n你的手法干净利落，这是多年的老本行。`;
        }

        // 善良/正直性格偷窃后有愧疚debuff
        let moodChange = -3;
        if (playerPersonality.includes('善良') || playerPersonality.includes('正直')) {
          moodChange = -13; // 额外-10愧疚
          msg += `\n\n得手后你心里却有些不安，那枚铜钱在口袋里仿佛发烫...`;
        }

        return {
          success: true, message: msg,
          copperChange: stolen,
          moodChange,
        };
      }

      // 失败
      const failMessages = [
        `你的手刚伸出去，就被${name}一把抓住了！"小贼！"${name}大喊一声，街坊邻居纷纷看了过来。你灰溜溜地缩回了手。`,
        `你悄悄靠近${name}，脚下却踩到了一块碎瓦——"咔嚓"一声，${name}猛然回头，你赶紧装作若无其事的样子。`,
        `"干什么呢！"${name}猛地转身，差点撞到你伸出的手。你干笑了两声："没什么，没什么..."赶紧退开。`,
      ];

      let failMsg = pick(failMessages);
      if (isGuard(targetProfession)) {
        failMsg += `\n\n${name}眼中精光一闪："贼手伸到我面前来了？跟我走一趟！"你的心一下子凉了半截。`;
      }

      return {
        success: false,
        message: failMsg,
        impressionChange: randInt(-15, -5),
        moodChange: -10,
      };
    },
  },

  // 8. 请教技能
  {
    id: 'learn_skill', name: '请教技能', icon: '📖', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (getImpression(ctx) < 50) return false;
      return isSkillTeacher(ctx.target.identity?.profession || '');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (getImpression(ctx) < 50) return { met: false, reason: '好感度不够（需50以上）' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const skill = SKILL_MAP[ctx.target.identity?.profession || ''] || '技艺';
      return `向${name}学习${skill}`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const profession = ctx.target.identity?.profession || '';
      const skill = SKILL_MAP[profession] || '某种技艺';

      const messages = [
        `${name}点了点头："既然你诚心求学，我就教你${skill}的窍门。"他仔细讲解了要领，你听得连连点头，感觉受益匪浅。`,
        `"${skill}的精髓在于..."${name}边说边示范，你照着做了一遍，虽然生疏，但也算入了门。"不错，"他赞许道，"假以时日，必成大器。"`,
        `${name}从怀里掏出一本泛黄的小册子："这是我多年${skill}的心得，你拿去看看。"你如获至宝，连忙道谢。`,
      ];

      return {
        success: true, message: pick(messages),
        impressionChange: 3,
        moodChange: 8,
      };
    },
  },

  // 9. 邀请同行
  {
    id: 'invite_travel', name: '邀请同行', icon: '🚶', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'npc' && getImpression(ctx) >= 30,
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      if (getImpression(ctx) < 30) return { met: false, reason: '好感度不够' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => `邀请${ctx.target.identity?.name || '对方'}与你同行`,
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const impression = getImpression(ctx);
      const personality = ctx.target.identity?.personality || [];

      const accept = Math.random() < (impression / 100);
      if (accept) {
        let msg = `${name}想了想，笑着说："也好，一个人走也无聊，咱们搭个伴。"你们并肩而行，${name}给你讲起了沿途的风物。`;
        if (personality.includes('勇敢')) msg = `${name}二话不说："走！有我在，保你安全。"他拍了拍腰间的刀。`;
        return { success: true, message: msg, impressionChange: 3, moodChange: 5 };
      }

      let msg = `${name}摇了摇头："抱歉，我还有事要办，改天吧。"他看起来确实很忙。`;
      if (personality.includes('胆小')) msg = `${name}面露难色："外面不太平...我、我还是不去了。"他缩了缩脖子。`;
      return { success: true, message: msg, impressionChange: -1 };
    },
  },

  // 10. 求医
  {
    id: 'heal', name: '求医', icon: '💊', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const profession = ctx.target.identity?.profession || '';
      // 大夫：玩家健康<60时出现
      if (isDoctor(profession)) return ctx.player.vital.health < 60;
      // 非大夫：玩家健康<50时，任何人可能帮忙包扎
      return ctx.player.vital.health < 50;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.vital.health >= 60) return { met: false, reason: '你身体无恙' };
      const profession = ctx.target.identity?.profession || '';
      const cost = isDoctor(profession) ? 20 : 5;
      if (ctx.player.wallet.copper < cost) return { met: false, reason: `诊金不够（需${cost}文）` };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const profession = ctx.target.identity?.profession || '';
      if (isDoctor(profession)) return `请${name}为你诊治（诊金20文）`;
      return `请${name}帮你简单包扎（花费5文）`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const profession = ctx.target.identity?.profession || '';
      const isDoc = isDoctor(profession);

      if (isDoc) {
        const messages = [
          `${name}让你伸出舌头，又搭了搭你的脉。"嗯..."他沉吟片刻，开了副药方。"按方服用，三日后便有起色。"你付了20文诊金，心里踏实了不少。`,
          `${name}仔细检查了你的面色和脉象，写了张药方递给你："最近劳累过度，气血不顺。这副药煎水服下，注意休息。"你感激地付了诊金。`,
          `"气色不好啊。"${name}摇着头说，"让我给你瞧瞧。"一番望闻问切之后，他开了药方，叮嘱道："忌辛辣，早入睡。"`,
        ];
        return {
          success: true, message: pick(messages),
          copperChange: -20,
          healthChange: randInt(10, 20),
          impressionChange: 2,
        };
      }

      // 非大夫的简单包扎
      return {
        success: true,
        message: `${name}虽然不是大夫，但看你伤得不轻，从包袱里翻出一块干净的布条。"忍着点。"他笨手笨脚地帮你包扎了一番。虽然不专业，但好歹止了血。"还是去找个正经大夫看看吧。"他关切地说。`,
        copperChange: -5,
        healthChange: randInt(3, 8),
        impressionChange: 3,
      };
    },
  },

  // 11. 挑衅
  {
    id: 'provoke', name: '挑衅', icon: '👊', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const mood = ctx.target.vital?.mood ?? 50;
      // 敌对组织间更容易出现挑衅选项
      if (isRivalFaction(ctx)) return mood < 30 ? Math.random() < 0.6 : Math.random() < 0.35;
      return mood < 30 ? Math.random() < 0.4 : Math.random() < 0.2;
    },
    canExecute: (ctx) => ctx.player.ap < 2 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const mood = ctx.target.vital?.mood ?? 50;
      if (mood < 30) return `${name}正憋着一肚子火，别去招惹`;
      return `挑衅${name}，可能引发冲突`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const mood = ctx.target.vital?.mood ?? 50;
      const targetPersonality = ctx.target.identity?.personality || [];
      const playerPersonality = ctx.player.personality || [];

      const isBrave = targetPersonality.includes('勇敢') || targetPersonality.includes('刚烈');
      const isTimid = targetPersonality.includes('胆小');
      const playerBrave = playerPersonality.includes('勇敢') || playerPersonality.includes('刚烈');
      const playerTimid = playerPersonality.includes('胆小');
      // 敌对组织间冲突概率更高
      const conflictBoost = isRivalFaction(ctx) ? 0.25 : 0;

      if (isTimid) {
        return {
          success: true,
          message: `你朝${name}叫嚣了几句，他吓得往后退了两步，不敢回嘴。旁边的人看不过去，朝你投来鄙夷的目光。你觉得自己有些过分了。`,
          impressionChange: -10, moodChange: -5,
        };
      }

      if (isBrave || Math.random() < (0.5 + conflictBoost)) {
        let conflictMsg = pick([
          `${name}被你一激，顿时火冒三丈："你说什么？！"他撸起袖子就要动手。周围的人赶紧拉开，但你的嘴角还是挨了一拳。鼻血直流。`,
          `你挑衅的话刚出口，${name}一脚就踹了过来！"啪"的一声，你被打翻在地。他冷笑道："不长眼的东西。"`,
        ]);
        if (isRivalFaction(ctx)) {
          conflictMsg += `\n\n旁边有人低声议论："这两个组织的恩怨可不是一天两天了..."`;
        }
        // 勇敢/刚烈性格：挑衅成功后热血上头，心情反而+5
        let playerMoodChange = -15;
        if (playerBrave) {
          playerMoodChange = -10; // 虽然挨打了但心里爽
          conflictMsg += `\n\n你抹了一把嘴角的血，心中反而热血沸腾——这才像话！`;
        }
        // 胆小性格：被反击后额外心情-5
        if (playerTimid) {
          playerMoodChange -= 5;
          conflictMsg += `\n\n你吓得两腿发软，这才意识到自己惹了不该惹的人。`;
        }
        return {
          success: true,
          message: conflictMsg,
          impressionChange: -20, healthChange: -randInt(5, 15), moodChange: playerMoodChange,
        };
      }

      return {
        success: true,
        message: pick([
          `${name}冷冷地看了你一眼，没有理会。"懒得跟你一般见识。"他转身走了。`,
          `${name}嗤笑一声："就你？"他摇了摇头，不再搭理你。你觉得自己像个傻子。`,
        ]),
        impressionChange: -8, moodChange: -5,
      };
    },
  },

  // 12. 义结金兰
  {
    id: 'sworn_brothers', name: '义结金兰', icon: '🙏', apCost: 3,
    shouldAppear: (ctx) => ctx.target.type === 'npc' && getImpression(ctx) >= 80,
    canExecute: (ctx) => {
      if (ctx.player.ap < 3) return { met: false, reason: '行动点不足' };
      if (getImpression(ctx) < 80) return { met: false, reason: '好感不够' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => `与${ctx.target.identity?.name || '对方'}义结金兰`,
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return {
        success: true,
        message: '你郑重地对' + name + '说出了结拜之意。他怔了一瞬，随即大笑起来：好！我' + name + '今日与你结为异姓兄弟，有福同享，有难同当！二人对拜三拜，从此情同手足。路过的行人纷纷驻足，有人鼓掌，有人擦泪。',
        impressionChange: 30,
        moodChange: 20,
      };
    },
  },

  // ═══ 环境相关 ═══

  // 13. 避雨
  {
    id: 'shelter', name: '避雨', icon: '☔', apCost: 0,
    shouldAppear: (ctx) => ctx.world.weather === '暴雨' && ctx.world.nearbyEntities.some(e => e.type === 'building'),
    canExecute: () => ({ met: true, reason: '' }),
    describeEffects: () => '暴雨如注，快找个地方避一避',
    execute: () => ({
      success: true,
      message: pick([
        '你三步并作两步冲进最近的屋檐下，浑身已经湿透。雨点打在瓦片上噼啪作响，你拧了拧衣角的水，长舒一口气。',
        '你贴着墙根跑到了一间店铺的廊下，抖落身上的雨水。旁边还有几个避雨的人，大家相视苦笑。',
      ]),
      moodChange: 2,
    }),
  },

  // 14. 采摘（植物成熟）
  {
    id: 'gather_fruit', name: '采摘', icon: '✋', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'plant' && (ctx.target.growth?.stage ?? 0) >= 2,
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '采集成熟的果实',
    execute: () => ({
      success: true,
      message: pick([
        '你仔细采摘了一把果实，放进背包里。虽然不多，但聊胜于无。',
        '你小心翼翼地摘下成熟的果子，品质还不错。阳光透过树叶洒下来，你觉得心里很踏实。',
      ]),
      itemsGained: [{ itemType: 'food', amount: randInt(1, 3) }],
      fatigueChange: -3,
    }),
  },

  // 15. 捕鱼
  {
    id: 'fish', name: '捕鱼', icon: '🎣', apCost: 2,
    shouldAppear: (ctx) => {
      const g = ctx.player.position.gridId;
      return ['upstream', 'downstream', 'riverbank', 'dock'].includes(g);
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.vital.fatigue < 15) return { met: false, reason: '太累了' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => '寅卯'.includes(ctx.world.shichen) ? '清晨鱼多，好时候' : '试试能否有所收获',
    execute: (ctx) => {
      let chance = 0.5;
      if ('寅卯'.includes(ctx.world.shichen)) chance += 0.2;
      if (ctx.world.season === '冬') chance -= 0.3;
      if (Math.random() < chance) {
        return {
          success: true,
          message: pick([
            '浮标猛地一沉！你眼疾手快，拉起鱼竿——一条大鱼跃出水面！你满意地笑了。',
            '你耐心等了好一阵，终于感觉到了鱼咬钩的力道。小心翼翼地收线，收获不错。',
          ]),
          itemsGained: [{ itemType: 'food', amount: randInt(2, 6) }],
          fatigueChange: -8,
        };
      }
      return {
        success: false,
        message: pick([
          '你守了半天，浮标纹丝不动。最终只收获了满身的蚊子包和一身疲惫。',
          '好不容易等到浮标动了，你一拉——是个破草鞋。你叹了口气。',
        ]),
        fatigueChange: -5, moodChange: -3,
      };
    },
  },

  // 16. 拾取（物品）
  {
    id: 'pickup', name: '拾取', icon: '✋', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'item',
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '拾起物品放入背包',
    execute: () => ({
      success: true,
      message: pick([
        '你弯腰拾起了地上的物品。掸掉灰，仔细看了看——也许以后用得着。',
        '这件物品躺在地上不起眼，但你被吸引了。捡起来掂了掂，放进背包里。',
      ]),
      itemsGained: [{ itemType: 'misc', amount: 1 }],
      moodChange: 1,
    }),
  },

  // 17. 翻找（山区建筑）
  {
    id: 'scavenge', name: '翻找', icon: '🔍', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'building' && ctx.target.position?.areaId === 'mountain',
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '翻翻看有没有有用的东西',
    execute: () => {
      if (Math.random() < 0.4) {
        return {
          success: true,
          message: pick([
            '你在角落里翻到了一个布满灰尘的木箱。撬开一看——里面有几枚铜板和一卷发黄的纸。',
            '一堆破烂下面，你摸到了一个还算完整的陶罐。晃了晃，里面有东西响。',
          ]),
          copperChange: randInt(5, 25),
        };
      }
      return {
        success: false,
        message: pick([
          '你翻了个遍，只找到些腐烂的木头和蛛网。白忙活一场。',
          '灰尘呛得你直咳嗽，翻了半天一无所获。这座废弃的小屋已经被掏空了。',
        ]),
      };
    },
  },

  // ═══ 动物相关 ═══

  // 18. 投喂
  {
    id: 'feed_animal', name: '投喂', icon: '🌾', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'animal' && ctx.player.inventory.items.some(i => i.itemType === 'food'),
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '喂食动物，增进亲近感',
    execute: () => ({
      success: true,
      message: pick([
        '你蹲下身，把食物慢慢递过去。小家伙犹豫了一下，小心翼翼地凑上来吃了。',
        '动物嗅了嗅你手里的食物，大着胆子吃了起来。吃完还蹭了蹭你的手。',
      ]),
      itemsLost: [{ itemType: 'food', amount: 1 }],
      impressionChange: 5, moodChange: 3,
    }),
  },

  // 19. 驱赶
  {
    id: 'chase_away', name: '驱赶', icon: '💨', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'animal') return false;
      const a = ctx.target.position?.areaId;
      return a === 'farmland' || ['residential_north', 'residential_south'].includes(ctx.target.position?.gridId || '');
    },
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '把这只动物赶走',
    execute: () => ({
      success: true,
      message: pick([
        '你挥着手大喊："去！去！"动物被你吓了一跳，撒腿就跑。',
        '"嘘——走开！"你拍着手驱赶。动物不情不愿地挪开，回头看了你一眼。',
      ]),
      moodChange: 1,
    }),
  },

  // 20. 跟踪
  {
    id: 'track_animal', name: '跟踪', icon: '🐾', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'animal' && Math.random() < 0.5,
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '悄悄跟上，看看它要去哪里',
    execute: () => ({
      success: true,
      message: pick([
        '你蹑手蹑脚地跟了上去。动物七拐八绕，最终钻进了一片灌木丛。',
        '跟着它走了好一段路，来到了一处你从没到过的地方。动物早已不见踪影。',
      ]),
      fatigueChange: -3, moodChange: 2,
    }),
  },

  // 21. 观察（动物）
  {
    id: 'observe_animal', name: '观察', icon: '👁', apCost: 0,
    shouldAppear: (ctx) => ctx.target.type === 'animal',
    canExecute: () => ({ met: true, reason: '' }),
    describeEffects: () => '仔细观察这只动物的习性',
    execute: () => ({
      success: true,
      message: pick([
        '你安静地蹲在一旁观察。它在地上刨了刨，似乎在找虫子吃。动作灵敏，警惕性很高。',
        '这只动物毛色光亮，看起来状态不错。它时而低头觅食，时而抬头张望。',
      ]),
    }),
  },

  // 22. 捕猎
  {
    id: 'hunt', name: '捕猎', icon: '🏹', apCost: 2,
    shouldAppear: (ctx) => ctx.target.type === 'animal',
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.vital.fatigue < 15) return { met: false, reason: '太累了' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '尝试捕获或猎杀',
    execute: (ctx) => {
      const chance = 0.4 + ctx.player.vital.fatigue / 200;
      if (Math.random() < chance) {
        return {
          success: true,
          message: pick([
            '你屏息凝神，猛地出手——抓到了！今晚有肉吃了。',
            '一番追逐之后，你终于把它逼到了死角。干净利落地解决。',
          ]),
          itemsGained: [{ itemType: 'food', amount: randInt(2, 5) }],
          fatigueChange: -12, moodChange: 5,
        };
      }
      return {
        success: false,
        message: pick([
          '你扑了上去，但它比你想象的敏捷得多——一个闪身就溜走了。你扑了个空。',
          '追了好一阵子，这畜生东拐西绕，最终钻进了一个你进不去的洞里。',
        ]),
        fatigueChange: -8, moodChange: -3,
      };
    },
  },

  // 23. 驯服
  {
    id: 'tame', name: '驯服', icon: '🤲', apCost: 3,
    shouldAppear: (ctx) => ctx.target.type === 'animal',
    canExecute: (ctx) => ctx.player.ap < 3 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '尝试驯化（需多次尝试）',
    execute: () => {
      if (Math.random() < 0.25) {
        return {
          success: true,
          message: pick([
            '你耐心地慢慢靠近，轻声细语地安抚。它终于让你摸到了它的头。这一刻，你感觉它接纳了你。',
            '经过反复尝试，它终于不再抗拒你的靠近了。它甚至主动蹭了蹭你的手。',
          ]),
          impressionChange: 15, moodChange: 8,
        };
      }
      return {
        success: false,
        message: pick([
          '它对你依然充满戒备，你一靠近它就跑开了。驯服需要时间和耐心。',
          '你试图靠近，但它警惕地退后了几步，还朝你嘶了一声。',
        ]),
        fatigueChange: -3,
      };
    },
  },

  // ═══ 建筑/植物/矿物/物品 补充 ═══

  // 24. 进入建筑
  {
    id: 'enter_building', name: '进入', icon: '🚪', apCost: 0,
    shouldAppear: (ctx) => ctx.target.type === 'building',
    canExecute: () => ({ met: true, reason: '' }),
    describeEffects: () => '进入建筑内部',
    execute: () => ({
      success: true,
      message: pick([
        '你推开门走了进去。里面比外面凉快些，光线透过窗户洒进来。',
        '你迈步走进去，门吱呀一声。里面隐约传来人声和器物碰撞的声音。',
      ]),
    }),
  },

  // 25. 打听（建筑附近）
  {
    id: 'ask_around', name: '打听', icon: '👂', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'building',
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '向周围的人打听消息',
    execute: () => ({
      success: true,
      message: pick([
        '有人悄悄告诉你：最近粮价涨了不少，听说南郊遭了虫灾。',
        '一个老者对你说："年轻人，最近城里不太平，晚上别出门。"',
        '闲聊中得知：东市的药铺进了批好药材，有需要趁早去。',
        '有人说码头来了条大船，运的全是丝绸。',
      ]),
      impressionChange: 1, moodChange: 2,
    }),
  },

  // 26. 砍伐植物
  {
    id: 'chop', name: '砍伐', icon: '🪓', apCost: 2,
    shouldAppear: (ctx) => ctx.target.type === 'plant',
    canExecute: (ctx) => ctx.player.ap < 2 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '获取木材',
    execute: () => ({
      success: true,
      message: pick([
        '你抡起斧头砍了下去。木屑飞溅，终于放倒了一棵。你擦擦汗，把木材整理好。',
        '一声声斧砍声中，木头终于倒下。你把木材劈成段，绑成一捆。虽然累，但很有成就感。',
      ]),
      itemsGained: [{ itemType: 'material', amount: randInt(2, 5) }],
      fatigueChange: -15,
    }),
  },

  // 27. 浇水
  {
    id: 'water_plant', name: '浇水', icon: '💧', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'plant' && (ctx.target.growth?.stage ?? 0) < 2,
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '浇水促进生长',
    execute: () => ({
      success: true,
      message: pick([
        '你从河边打了一桶水，仔细地浇在根部。植物在微风中轻轻摇曳，似乎在感谢你。',
        '水慢慢渗入泥土，你看着植物叶片上挂着的水珠，心里有种踏实的感觉。',
      ]),
      moodChange: 2,
    }),
  },

  // 28. 采集植物
  {
    id: 'gather', name: '采集', icon: '🌿', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'plant',
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: () => '采集一些材料',
    execute: () => ({
      success: true,
      message: pick([
        '你弯腰采集了一些有用的植物材料。仔细分拣后放进背包，不时能闻到淡淡的草药香气。',
        '你小心翼翼地采下几株，抖掉根上的泥土。虽然不是什么珍稀药材，但日常生活中总能用得上。',
      ]),
      itemsGained: [{ itemType: 'herbs', amount: randInt(1, 3) }],
      fatigueChange: -2,
    }),
  },

  // 29. 开采矿物
  {
    id: 'mine', name: '开采', icon: '⛏', apCost: 3,
    shouldAppear: (ctx) => ctx.target.type === 'mineral',
    canExecute: (ctx) => {
      if (ctx.player.ap < 3) return { met: false, reason: '行动点不足' };
      if (ctx.player.vital.fatigue < 20) return { met: false, reason: '太累了' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '深度开采矿石',
    execute: () => {
      if (Math.random() < 0.7) {
        return {
          success: true,
          message: pick([
            '一镐下去，碎石飞溅。你仔细分辨——含铜量还不错！继续挖了好一阵，收获了一堆矿石。',
            '叮叮当当一阵之后，你终于撬出了一块不错的矿石。在阳光下闪着金属光泽，分量十足。',
          ]),
          itemsGained: [{ itemType: 'mineral', amount: randInt(1, 4) }],
          fatigueChange: -20, moodChange: 3,
        };
      }
      return {
        success: false,
        message: pick([
          '挖了半天全是废石。你的虎口都震裂了，却一无所获。',
          '镐头打到硬石上弹了回来，震得你手发麻。这块石头下面没什么有价值的东西。',
        ]),
        fatigueChange: -15, moodChange: -5,
      };
    },
  },

  // 30. 检查物品
  {
    id: 'inspect', name: '检查', icon: '🔍', apCost: 0,
    shouldAppear: (ctx) => ctx.target.type === 'item',
    canExecute: () => ({ met: true, reason: '' }),
    describeEffects: () => '仔细查看这个物品',
    execute: () => ({
      success: true,
      message: pick([
        '你拿起来仔细端详。做工还算精细，上面刻着模糊的花纹。似乎有些年头了。',
        '翻来覆去看了看——普普通通的物件，但保养得不错。也许值几个钱。',
        '你掂了掂分量，又闻了闻。没什么特殊的，但也许对某些人有价值。',
      ]),
      moodChange: 1,
    }),
  },

  // ═══ 组织涌现规则（5条） ═══

  // 31. 组织认同
  {
    id: 'faction_ally', name: '同袍情谊', icon: '🤝', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const tFactionId = ctx.target.identity?.factionId;
      const pFactionId = ctx.player.factionId;
      return pFactionId != null && tFactionId != null && pFactionId === tFactionId;
    },
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `与${name}叙同袍之情，增进彼此信赖`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const messages = [
        `${name}认出了你，眼中闪过一丝亲切："自家兄弟，不必多礼！"你们相视而笑，一股暖意涌上心头。`,
        `你朝${name}点了点头，他立刻会意，低声道："在这儿遇见自己人，真好。"`,
        `${name}拍了拍你的肩膀："同门之谊，比金子还珍贵。"两人相谈甚欢。`,
      ];
      return {
        success: true, message: pick(messages),
        impressionChange: randInt(3, 8),
        moodChange: 3,
      };
    },
  },

  // 32. 组织对立
  {
    id: 'faction_rival', name: '警惕对峙', icon: '⚠️', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const tFactionId = ctx.target.identity?.factionId;
      const pFactionId = ctx.player.factionId;
      // 只在分属不同组织时出现（敌对判断在 canExecute 中细化）
      return pFactionId != null && tFactionId != null && pFactionId !== tFactionId;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `${name}的组织与你的组织不和，需要警惕`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const messages = [
        `你察觉到${name}身上的组织标记，心中警觉。他似乎也注意到了你，目光中带着几分戒备。两人擦肩而过，空气中弥漫着紧张的气息。`,
        `${name}打量了你一眼，嘴角微微抽动。你心知肚明——你们分属不同的势力。虽然暂时相安无事，但谁也不敢掉以轻心。`,
        `"哼。"${name}从牙缝里挤出一个字，故意避开你的目光。你知道他认出了你的身份。在汴京的街头上，双方都克制着没有发作。`,
      ];
      return {
        success: true, message: pick(messages),
        impressionChange: randInt(-5, -1),
        moodChange: -3,
      };
    },
  },

  // 33. 组织俸禄
  {
    id: 'faction_salary', name: '领取俸禄', icon: '💰', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 只有对方是组织成员时才出现（通过对方获取俸禄信息）
      return ctx.target.identity?.factionId != null && ctx.target.identity?.factionRole === 'leader';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      const pFactionId = ctx.player.factionId;
      const tFactionId = ctx.target.identity?.factionId;
      if (pFactionId == null || tFactionId == null || pFactionId !== tFactionId) {
        return { met: false, reason: '你不在对方组织中' };
      }
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '首领';
      return `向${name}领取本月俸禄`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '首领';
      const salary = randInt(10, 50);
      const messages = [
        `${name}点了点头，从箱中取出一袋铜板递给你："这是你本月的份，收好了。"你接过俸禄，心中安定。`,
        `"俸禄到了。"${name}把几串铜钱放到桌上，"不多，但也不至于饿着。好好干。"`,
      ];
      return {
        success: true, message: pick(messages),
        copperChange: salary,
        impressionChange: 2,
        moodChange: 5,
      };
    },
  },

  // 34. 势力巡逻
  {
    id: 'faction_patrol', name: '巡逻报告', icon: '🗺️', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const tFactionId = ctx.target.identity?.factionId;
      const pFactionId = ctx.player.factionId;
      if (pFactionId == null || tFactionId == null || pFactionId !== tFactionId) return false;
      // 同组织，且在组织领地内（简化判断：在同一区域即可）
      return true;
    },
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `与${name}交换巡逻情报`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const reports = [
        `${name}低声汇报："一切正常，东边有几个生面孔，不过看起来像是行商的。"你点了点头。`,
        `${name}凑近说道："码头上来了几条船，货物不少。另外，西边的巷子里似乎有人鬼鬼祟祟的，我已让人盯着了。"`,
        `"这片区域还算太平，"${name}环顾四周，"不过最近城里的暗流不少，大人您多加小心。"`,
      ];
      return {
        success: true, message: pick(reports),
        impressionChange: 2,
        moodChange: 2,
      };
    },
  },

  // 35. 组织招募
  {
    id: 'faction_recruit', name: '招募引荐', icon: '📜', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 玩家无组织，对方有组织
      const pFactionId = ctx.player.factionId;
      const tFactionId = ctx.target.identity?.factionId;
      return pFactionId == null && tFactionId != null;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (getImpression(ctx) < 20) return { met: false, reason: '好感度不够' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `请${name}引荐加入其组织`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const impression = getImpression(ctx);
      const accept = impression > 50 ? 0.7 : 0.3;

      if (Math.random() < accept) {
        return {
          success: true,
          message: `${name}打量了你一番，点了点头："你这人还算可靠，我替你引荐一下。不过能不能留下，还得看上面的意思。"他写了一封推荐信交给你。`,
          impressionChange: randInt(5, 10),
          moodChange: 5,
        };
      }
      return {
        success: true,
        message: `${name}犹豫了一下："这个...我也做不了主。你先在旁边多露露脸，等有机会了我再帮你说话。"他看起来有些为难。`,
        impressionChange: 1,
      };
    },
  },

  // 36. 组织任务
  {
    id: 'faction_quest', name: '组织委托', icon: '📜', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 只有属于同一组织的 NPC 且对方是 leader 时才出现
      if (ctx.player.factionId == null) return false;
      return ctx.target.identity?.factionId === ctx.player.factionId
        && ctx.target.identity?.factionRole === 'leader';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (getImpression(ctx) < 10) return { met: false, reason: '与首领不够熟络' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '首领';
      return `向${name}请求一份组织委托任务`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '首领';
      const quests = [
        { desc: '送一封密信到城南', reward: randInt(15, 30) },
        { desc: '收集三份情报', reward: randInt(20, 40) },
        { desc: '在集市上打探竞争对手的动向', reward: randInt(10, 25) },
        { desc: '护送一批货物到码头', reward: randInt(25, 50) },
        { desc: '调查最近城内的异常事件', reward: randInt(20, 45) },
      ];
      const quest = pick(quests);

      return {
        success: true,
        message: `${name}点了点头："正好有件事需要人手——${quest.desc}。你若办妥了，赏${quest.reward}文。"你领了令牌，心中暗暗盘算着如何完成。`,
        copperChange: quest.reward,
        impressionChange: randInt(5, 10),
        moodChange: 5,
      };
    },
  },

  // 37. 缴纳会费
  {
    id: 'faction_dues', name: '缴纳会费', icon: '🏛️', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 玩家属于某组织，且对方是同组织的首领
      if (ctx.player.factionId == null) return false;
      return ctx.target.identity?.factionId === ctx.player.factionId
        && ctx.target.identity?.factionRole === 'leader';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 20) return { met: false, reason: '铜钱不足（至少需20文）' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '首领';
      return `向${name}缴纳组织会费，提升组织影响力（20~50文）`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '首领';
      const dues = Math.min(randInt(20, 50), ctx.player.wallet.copper);

      return {
        success: true,
        message: `你从钱袋中取出${dues}文，恭敬地呈给${name}。他点了点头，将铜钱收入公账："忠心可嘉。组织不会忘记你的贡献。"你的付出为组织增添了几分实力。`,
        copperChange: -dues,
        impressionChange: randInt(3, 8),
        moodChange: 3,
      };
    },
  },

  // ═══ 职业专属规则（9条） ═══

  // 38. 巡逻同行
  {
    id: 'guard_patrol', name: '巡逻同行', icon: '🛡️', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const playerProf = ctx.player.profession || '';
      const targetProf = ctx.target.identity?.profession || '';
      // 玩家是guard/军事组织成员，或目标NPC是guard
      return isGuard(playerProf) || isGuard(targetProf)
        || ctx.player.factionType === 'military';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `与${name}一起巡逻，获取安全情报`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const intel = pick([
        `${name}带你走了一圈，低声说："西边巷子里最近有生面孔出没，不太对劲。"你记在了心里。`,
        `"跟我来。"${name}领你巡视了一圈，指着一处墙角："那里有人翻墙的痕迹，已经让人盯上了。"`,
        `${name}边走边说："最近码头上来的陌生人不少，我让人盯着呢。你要是发现什么，记得报我。"`,
      ]);
      return {
        success: true, message: intel,
        impressionChange: randInt(2, 5),
        moodChange: 3,
      };
    },
  },

  // 39. 黑市交易
  {
    id: 'black_market', name: '黑市交易', icon: '🕴', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const playerProf = ctx.player.profession || '';
      const targetProf = ctx.target.identity?.profession || '';
      return isRogue(playerProf) || isRogue(targetProf);
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 15) return { met: false, reason: '铜钱不够（至少15文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '在黑市购买情报或非法物品',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const copper = ctx.player.wallet.copper;
      const price = randInt(15, Math.min(60, copper));
      const goods = pick([
        { item: '一封密信，上面写着某位大户人家的动向', type: 'intel' },
        { item: '一小瓶粉末，据说能让人昏睡不醒', type: 'poison' },
        { item: '一枚不知来路的玉佩，成色上佳', type: 'loot' },
        { item: '一张城防布局草图，标注了几个暗哨的位置', type: 'intel' },
      ]);

      return {
        success: true,
        message: `${name}左右看了看，从怀里掏出${goods.item}。"${price}文，概不还价。"你迅速掏出铜板，东西到手。${name}嘱咐道："别说是从我这里拿的。"`,
        copperChange: -price,
        itemsGained: [{ itemType: goods.type, amount: 1 }],
        impressionChange: randInt(3, 8),
        moodChange: -2,
      };
    },
  },

  // 40. 铁匠锻造
  {
    id: 'blacksmith_craft', name: '铁匠锻造', icon: '🔨', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      return isBlacksmith(ctx.target.identity?.profession || '');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 30) return { met: false, reason: '铜钱不够（至少30文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '请铁匠修理或升级武器装备（30~80文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '铁匠';
      const price = randInt(30, Math.min(80, ctx.player.wallet.copper));
      const service = pick([
        `你把钝了的刀递过去。${name}接过来打量了一眼，架到砧板上叮叮当当一阵锤打。火星飞溅中，刀刃重新泛起寒光。"${price}文，试试。"你挥了两下，手感好了许多。`,
        `${name}看了看你的装备，皱了皱眉："该修了。"他麻利地换了条新刀柄，又加固了护甲的铆钉。${price}文花得值。`,
        `"要淬火？"${name}把烧红的铁件浸入水中，"嗤——"一声白汽升腾。他擦了擦汗："${price}文。这把家伙现在比原来还利索。"`,
      ]);

      return {
        success: true, message: service,
        copperChange: -price,
        impressionChange: randInt(2, 5),
        moodChange: 3,
      };
    },
  },

  // 41. 奢侈品交易
  {
    id: 'luxury_deal', name: '奢侈品交易', icon: '💎', apCost: 3,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (!isMerchant(ctx.target.identity?.profession || '')) return false;
      return ctx.player.wallet.copper >= 100;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 3) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 50) return { met: false, reason: '铜钱不够（至少50文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '购买高端稀有商品（50~200文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '大商人';
      const price = randInt(50, Math.min(200, ctx.player.wallet.copper));
      const item = pick([
        '一匹上好的蜀锦，手感如丝般顺滑',
        '一套精致的文房四宝，笔架是翡翠的',
        '一坛窖藏二十年的女儿红',
        '一把精钢折扇，扇骨刻着名家字迹',
        '一块和田玉佩，温润通透',
      ]);

      return {
        success: true,
        message: `${name}从里间取出一个锦盒，小心翼翼地打开——${item}。"这可是我从南边特意带回来的，${price}文，识货的人自然知道它的价值。"你爽快地付了钱，心中暗喜。`,
        copperChange: -price,
        itemsGained: [{ itemType: 'luxury', amount: 1 }],
        impressionChange: randInt(3, 8),
        moodChange: 5,
      };
    },
  },

  // 42. 农活
  {
    id: 'farm_work', name: '帮农干活', icon: '🌾', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      return isFarmer(ctx.target.identity?.profession || '');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.vital.fatigue < 20) return { met: false, reason: '太累了' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const seasonBonus = ctx.world.season === '春' || ctx.world.season === '夏';
      return `帮农夫干活赚铜钱${seasonBonus ? '（当季收益更高）' : ''}`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '农夫';
      const season = ctx.world.season;
      // 春天/夏天收益更高
      const basePay = randInt(10, 30);
      const pay = (season === '春' || season === '夏') ? Math.ceil(basePay * 1.5) : basePay;

      const tasks = season === '春' ? '你跟着他插秧、挑水，泥巴糊了一腿' :
        season === '夏' ? '烈日下你帮忙锄草、浇水，汗如雨下' :
        season === '秋' ? '你帮着收割、打谷，忙得腰都直不起来' :
        '冬天没什么农活，你帮他修了修篱笆、翻了翻土';

      return {
        success: true,
        message: `${name}见你愿意帮忙，高兴地说："来得正好！"${tasks}。干完活，${name}从怀里掏出${pay}文递给你："辛苦了，这是你的工钱。"你擦了把汗，心里踏实。`,
        copperChange: pay,
        impressionChange: randInt(5, 10),
        fatigueChange: -15,
        moodChange: 3,
      };
    },
  },

  // 43. 授课学习
  {
    id: 'teach', name: '授课学习', icon: '📚', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      return isTeacher(ctx.target.identity?.profession || '');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 10) return { met: false, reason: '学费不够（至少10文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '向先生学习知识技能（10~40文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '先生';
      const fee = randInt(10, Math.min(40, ctx.player.wallet.copper));
      const subject = pick([
        { topic: '《论语》大义', desc: '你跟着诵读了几段，对为人处世有了新的领悟。' },
        { topic: '算术之法', desc: '先生教了你几招心算口诀，你试了试，果然快了不少。' },
        { topic: '书法基础', desc: '你握着笔，在宣纸上歪歪扭扭写了几行字，先生直摇头，但也耐心纠正了你的姿势。' },
        { topic: '历史典故', desc: '先生讲了一段前朝旧事，你听得入神，感叹兴亡无常。' },
      ]);

      return {
        success: true,
        message: `${name}清了清嗓子："今日讲${subject.topic}。"束脩${fee}文，不算多。${subject.desc}"回去好好揣摩，"他叮嘱道。`,
        copperChange: -fee,
        impressionChange: randInt(2, 5),
        moodChange: 5,
      };
    },
  },

  // 44. 狩猎指导
  {
    id: 'hunt_guide', name: '狩猎指导', icon: '🏹', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      return isHunter(ctx.target.identity?.profession || '');
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 20) return { met: false, reason: '铜钱不够（至少20文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '向猎户学习狩猎技巧（20~50文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '猎户';
      const fee = randInt(20, Math.min(50, ctx.player.wallet.copper));
      const lesson = pick([
        `${name}教你辨认地上的足迹："看，这爪印深浅不一，是只瘸腿的野兔。"他又教你如何设置陷阱，如何顺风接近猎物。你认真记下每一个要点。`,
        `"打猎最要紧的是耐心和安静。"${name}示范了正确的拉弓姿势，又教你怎么从风向判断猎物的位置。你试了几次，虽然射术还差得远，但已经入了门。`,
        `${name}带你到了一处灌木丛前，蹲下身指了指地上的痕迹："看到没？新鲜粪便，毛发还在枝叶上。"他传授你追踪的要诀，你恍然大悟。`,
      ]);

      return {
        success: true, message: lesson,
        copperChange: -fee,
        itemsGained: [{ itemType: 'hunting_tool', amount: 1 }],
        impressionChange: randInt(3, 8),
        moodChange: 5,
      };
    },
  },

  // 45. 贿赂
  {
    id: 'bribe', name: '贿赂', icon: '💰', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const targetProf = ctx.target.identity?.profession || '';
      // 目标是guard/官方人员
      return isGuard(targetProf) || ctx.target.identity?.factionRole === 'leader';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 50) return { met: false, reason: '铜钱不够（至少50文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '花钱买通关节，获取通行便利（50~100文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const bribe = randInt(50, Math.min(100, ctx.player.wallet.copper));
      const targetPersonality = ctx.target.identity?.personality || [];

      // 善良/正直性格的人可能拒绝
      if (targetPersonality.includes('正直') || targetPersonality.includes('善良')) {
        if (Math.random() < 0.5) {
          return {
            success: false,
            message: `你悄悄把铜板往${name}手里塞，他猛地把你的手推了回来。"你在干什么？！"${name}压低声音，眼神锐利，"收回去，否则我不客气了。"你讪讪地缩回了手。`,
            impressionChange: randInt(-15, -5),
            moodChange: -5,
          };
        }
      }

      return {
        success: true,
        message: `你趁人不注意，将${bribe}文铜钱悄悄塞到${name}手中。他飞快地收进了袖子里，面上不动声色："放心，这一带的事我说了算。有什么需要帮忙的尽管来。"你心中暗暗松了口气。`,
        copperChange: -bribe,
        impressionChange: randInt(5, 12),
        moodChange: -2,
      };
    },
  },

  // 46. 占卜
  {
    id: 'fortune_telling', name: '占卜', icon: '🔮', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 目标NPC的身份暗示宗教相关（简化：目标是religion类型组织成员或职业是宗教相关）
      const profession = ctx.target.identity?.profession || '';
      return ctx.target.identity?.factionId != null
        || ['道士', '和尚', '尼姑', '算命先生', '庙祝'].includes(profession);
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 10) return { met: false, reason: '铜钱不够（至少10文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '请人占卜运势（10~30文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '道长';
      const fee = randInt(10, Math.min(30, ctx.player.wallet.copper));
      const fortune = pick([
        { text: '大吉', detail: `${name}掐指一算，微微点头："近期运势大吉，诸事顺遂。但切记不可骄纵，福兮祸所伏。"你听了心中欢喜，但还是记下了他的告诫。`, moodChange: 8 },
        { text: '中吉', detail: `${name}看了你的面相，沉吟道："近期有小波折，但无大碍。遇事三思而后行，自可逢凶化吉。"你若有所思地点了点头。`, moodChange: 3 },
        { text: '小凶', detail: `${name}皱了皱眉："最近恐怕有些不顺。出门多留个心眼，钱财之事格外谨慎。"你心里咯噔一下，但安慰自己：宁可信其有。`, moodChange: -3 },
        { text: '大凶', detail: `${name}脸色一变，低声说："大凶之兆...近期恐有血光之灾。切记：勿涉险地，勿近水火。"他的话让你后背发凉。`, moodChange: -8 },
      ]);

      return {
        success: true,
        message: fortune.detail + `\n\n你付了${fee}文的卦金。`,
        copperChange: -fee,
        impressionChange: randInt(2, 5),
        moodChange: fortune.moodChange,
      };
    },
  },

  // ═══ 家庭相关规则（3条） ═══

  // 47. 家宴
  {
    id: 'family_feast', name: '家宴', icon: '🍲', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const familyMembers = ctx.player.familyMembers || [];
      if (familyMembers.length === 0) return false;
      // 目标是家庭成员
      return familyMembers.includes(ctx.target.id);
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 10) return { met: false, reason: '铜钱不够（至少10文办家宴）' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '家人';
      return `与${name}共进家宴，增进亲情`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '家人';
      const cost = randInt(10, 30);
      const relation = ctx.target.id === ctx.player.spouseId ? '配偶' : '家人';

      const feastMsg = relation === '配偶'
        ? `你和${name}围坐桌前，几盘家常菜，一壶温酒。烛光摇曳中，你们聊着日常琐事，格外温馨。${name}给你夹了块肉："多吃点，瘦了。"你心中一暖。`
        : `${name}见到你张罗饭菜，忙过来帮忙。不多时几道菜摆上了桌，虽然不是什么山珍海味，但一家人坐在一起，格外踏实。${name}笑着说："这才是过日子的样子。"`;

      return {
        success: true,
        message: feastMsg + `\n\n家宴花费${cost}文，但一家人在一起的时光是钱买不来的。`,
        copperChange: -cost,
        impressionChange: randInt(10, 20),
        moodChange: 10,
      };
    },
  },

  // 48. 家族传承
  {
    id: 'family_legacy', name: '家族传承', icon: '📜', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const familyMembers = ctx.player.familyMembers || [];
      if (familyMembers.length === 0) return false;
      // 目标是家庭成员中的子女（年龄较轻，简化判断年龄<30）
      return familyMembers.includes(ctx.target.id)
        && (ctx.target.identity?.age ?? 99) < 30;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '孩子';
      return `传授经验和技艺给${name}`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '孩子';
      const profession = ctx.player.profession || '';
      const teaching = profession
        ? `你把多年${profession}的经验倾囊相授，${name}听得认真，不时点头。`
        : `你把自己的人生阅历讲给${name}听，他似懂非懂，但记在了心里。`;

      return {
        success: true,
        message: `${teaching}\n\n"记住，"你语重心长地说，"做人做事，要踏踏实实。"${name}乖巧地点了点头："我记住了。"看着他的眼神，你觉得这份传承比什么都重要。`,
        impressionChange: randInt(8, 15),
        moodChange: 8,
      };
    },
  },

  // 49. 家庭援助
  {
    id: 'family_aid', name: '家庭援助', icon: '🆘', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 玩家健康<30或铜钱<10，且附近有家庭成员
      const familyMembers = ctx.player.familyMembers || [];
      if (familyMembers.length === 0) return false;
      if (ctx.player.vital.health >= 30 && ctx.player.wallet.copper >= 10) return false;
      return familyMembers.includes(ctx.target.id);
    },
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '家人';
      return `向${name}求助`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '家人';
      const isHealthCrisis = ctx.player.vital.health < 30;
      const isBroke = ctx.player.wallet.copper < 10;

      if (isHealthCrisis) {
        return {
          success: true,
          message: `${name}看你脸色苍白，急了："你怎么了？快坐下歇歇！"他忙前忙后，给你端水、找药。"别硬撑着，"他忧心忡忡地说，"家里有我呢。"`,
          healthChange: randInt(5, 15),
          impressionChange: randInt(5, 12),
          moodChange: 5,
        };
      }

      // 没钱的情况
      const aid = randInt(5, 20);
      return {
        success: true,
        message: `${name}看出你的窘迫，从钱袋里掏出${aid}文塞到你手里："拿着，一家人不说两家话。"你想推辞，但他硬是塞给了你。"等你宽裕了再说。"`,
        copperChange: aid,
        impressionChange: randInt(5, 10),
        moodChange: 5,
      };
    },
  },

  // ═══ 组织首领专属规则（5条） ═══

  // 50. 下令
  {
    id: 'faction_order', name: '下达命令', icon: '📢', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (ctx.player.factionRole !== 'leader') return false;
      return ctx.player.factionId != null
        && ctx.target.identity?.factionId === ctx.player.factionId
        && ctx.target.identity?.factionRole !== 'leader';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '下属';
      return `向${name}下达命令`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '下属';
      const impression = getImpression(ctx);
      const orders = pick([
        '去巡逻一圈，注意可疑人物',
        '去打探一下竞争对手的动向',
        '去城门口接应一批货物',
        '去盯着某某，有任何异动立即汇报',
      ]);

      // 下属好感度影响执行效果
      if (impression >= 40) {
        return {
          success: true,
          message: `你唤来${name}，低声交代："${orders}。"${name}抱拳道："属下领命，定不辱使命。"他干脆利落地转身离去，你满意地点了点头。`,
          impressionChange: randInt(2, 5),
          moodChange: 3,
        };
      }

      return {
        success: true,
        message: `你命令${name}："${orders}。"他犹豫了一下，嘟囔着应了一声。虽然答应了，但看起来不太情愿。你得想想怎么提升他的忠心了。`,
        impressionChange: -2,
        moodChange: -2,
      };
    },
  },

  // 51. 召集会议
  {
    id: 'faction_meeting', name: '召集会议', icon: '🏛', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.player.factionRole !== 'leader') return false;
      if (ctx.player.factionId == null) return false;
      // 附近有>=2个同组织成员
      const sameFactionCount = ctx.world.nearbyEntities.filter(e => {
        // 通过target检查不太方便，简化处理：附近NPC数量>=2即可
        return e.type === 'npc';
      }).length;
      return sameFactionCount >= 2;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '召集组织成员开会，提升整体士气',
    execute: (ctx) => {
      return {
        success: true,
        message: pick([
          '你拍了拍手，将周围的弟兄们召集起来。"今日召集大家，是有要事商议。"你简明扼要地讲了近期的安排，众人纷纷点头。会议结束后，大家都精神了不少。',
          '你站在众人面前，扫视一圈："兄弟们，咱们最近干得不错。但也不能掉以轻心，有几件事要注意..."你布置了接下来的任务，大家领命散去，士气高涨。',
        ]),
        impressionChange: randInt(3, 6),
        moodChange: 10,
      };
    },
  },

  // 52. 赏罚
  {
    id: 'faction_reward', name: '赏罚', icon: '🎁', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (ctx.player.factionRole !== 'leader') return false;
      return ctx.player.factionId != null
        && ctx.target.identity?.factionId === ctx.player.factionId
        && ctx.target.identity?.factionRole !== 'leader';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '赏赐或惩戒下属（可花费铜钱提升好感）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '下属';
      const isReward = Math.random() < 0.7; // 70%概率赏，30%概率罚

      if (isReward && ctx.player.wallet.copper >= 20) {
        const reward = randInt(20, Math.min(50, ctx.player.wallet.copper));
        return {
          success: true,
          message: `你从钱袋中取出${reward}文赏给${name}："你最近表现不错，这是你应得的。"${name}喜出望外，连忙跪下谢恩："多谢大人栽培！属下定当更加尽力！"周围的弟兄看了，也暗暗铆足了劲。`,
          copperChange: -reward,
          impressionChange: randInt(10, 20),
          moodChange: 5,
        };
      }

      if (isReward) {
        return {
          success: true,
          message: `你拍了拍${name}的肩膀："干得好，继续保持。"虽然没有实质性的赏赐，但${name}依然受到鼓舞。`,
          impressionChange: randInt(3, 8),
          moodChange: 3,
        };
      }

      // 惩罚
      return {
        success: true,
        message: `你面色一沉，训斥${name}："最近办事不力，成何体统！"他低着头不敢吭声。虽然降了好感，但组织纪律需要维护。周围的弟兄也都噤了声。`,
        impressionChange: randInt(-15, -5),
        moodChange: -3,
      };
    },
  },

  // 53. 扩张招募
  {
    id: 'faction_expand', name: '扩张招募', icon: '📜', apCost: 3,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (ctx.player.factionRole !== 'leader') return false;
      if (ctx.player.factionId == null) return false;
      // 目标不是同组织成员
      return ctx.target.identity?.factionId !== ctx.player.factionId
        || ctx.target.identity?.factionId == null;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 3) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `邀请${name}加入你的组织`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const impression = getImpression(ctx);

      // 好感度>40更容易加入
      const joinChance = impression > 40 ? 0.6 : 0.25;

      if (Math.random() < joinChance) {
        return {
          success: true,
          message: `你向${name}伸出手："我观察你很久了。你的能力我们都看在眼里，有没有兴趣加入我们？"${name}想了想，握住了你的手："好，承蒙看重。"一个新成员加入了组织的行列。`,
          impressionChange: randInt(8, 15),
          moodChange: 5,
        };
      }

      return {
        success: true,
        message: `${name}摇了摇头："多谢你的好意，但我现在不太想加入什么组织。"他语气平和但坚定。你不便强求，但留下了话："随时欢迎你改变主意。"`,
        impressionChange: randInt(-2, 2),
        moodChange: -2,
      };
    },
  },

  // 54. 收税
  {
    id: 'collect_tax', name: '收税', icon: '💰', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      // 玩家是government类型组织首领
      return ctx.player.factionRole === 'leader'
        && ctx.player.factionType === 'government';
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `向${name}收取税收`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const targetCopper = ctx.target.wallet?.copper ?? 0;
      const tax = randInt(5, Math.min(15, targetCopper));

      if (targetCopper >= tax) {
        return {
          success: true,
          message: `你亮出官府令牌："按律纳税，${tax}文。"${name}虽然心疼铜板，但也不敢违抗，乖乖掏了钱。"知道了，大人。"他勉强挤出一丝笑容。`,
          copperChange: tax,
          impressionChange: randInt(-10, -3),
          moodChange: -3,
        };
      }

      return {
        success: true,
        message: `你亮出官府令牌要收税，${name}摊开双手："大人明鉴，小人实在拿不出来..."看着他的窘态，你叹了口气，这次就算了。`,
        impressionChange: randInt(-5, 0),
        moodChange: -2,
      };
    },
  },

  // ═══ 资产相关规则（3条） ═══

  // 55. 慈善捐款
  {
    id: 'charity', name: '慈善捐款', icon: '🙏', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (ctx.player.wallet.copper < 50) return false;
      return (ctx.target.wallet?.copper ?? 100) < 20;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 50) return { met: false, reason: '铜钱不够（至少50文）' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `捐助${name}一些铜钱（10~30文）`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const donation = randInt(10, 30);

      return {
        success: true,
        message: `你看到${name}衣衫褴褛，从钱袋里取出${donation}文递过去。他愣了一下，眼眶泛红："多谢...多谢恩人！"他想跪下磕头，你连忙扶住了他。"拿着吧，好好过日子。"`,
        copperChange: -donation,
        impressionChange: 15,
        moodChange: 10,
      };
    },
  },

  // 56. 赌博
  {
    id: 'gambling', name: '赌博', icon: '🎲', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      return ctx.player.wallet.copper >= 30;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 30) return { met: false, reason: '铜钱不够（至少30文）' };
      return { met: true, reason: '' };
    },
    describeEffects: () => '和对方赌一把（10~50文）',
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const mood = ctx.player.vital.mood;
      const stake = randInt(10, Math.min(50, ctx.player.wallet.copper));

      // 心情影响胜率：心情好时运气更好
      const winChance = 0.45 + (mood / 500); // 基础45%，心情100时+20%
      const won = Math.random() < winChance;

      if (won) {
        return {
          success: true,
          message: `"赌不赌？"${name}来了兴致。你们说好了赌${stake}文。骰子掷下——你赢了！${name}苦笑着掏出铜板："手气真不错。"你得意地收了钱，心里美滋滋的。`,
          copperChange: stake,
          impressionChange: randInt(-3, 3),
          moodChange: 5,
        };
      }

      return {
        success: true,
        message: `"来来来，赌一把！"${name}搓着手说。你押了${stake}文。结果运气不佳——输了！${name}笑着收走了铜板："承让承让。"你懊恼地叹了口气，手气这东西果然说不准。`,
        copperChange: -stake,
        impressionChange: randInt(-2, 2),
        moodChange: -5,
      };
    },
  },

  // 57. 借贷
  {
    id: 'loan', name: '借贷', icon: '📝', apCost: 1,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      if (ctx.player.wallet.copper < 50) return false;
      return (ctx.target.wallet?.copper ?? 100) < 30;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 1) return { met: false, reason: '行动点不足' };
      if (ctx.player.wallet.copper < 50) return { met: false, reason: '铜钱不够（至少50文）' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      return `借铜钱给${name}（20~50文）`;
    },
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '对方';
      const amount = randInt(20, 50);

      return {
        success: true,
        message: `${name}面露难色，你看出他的窘境，主动开口："缺钱用？我借你${amount}文，不用急着还。"${name}感激不已："多谢！等我手头宽裕了，一定连本带利还你。"他郑重地记下这笔账。`,
        copperChange: -amount,
        impressionChange: 10,
        moodChange: 3,
      };
    },
  },
];

/** 获取所有在当前上下文中涌现的行为 */
export function getEmergentActions(ctx: InteractionContext): EntityAction[] {
  const actions: EntityAction[] = [];
  for (const rule of EMERGENCE_RULES) {
    try {
      if (!rule.shouldAppear(ctx)) continue;
      actions.push({
        id: rule.id,
        name: rule.name,
        icon: rule.icon,
        apCost: rule.apCost,
        conditions: rule.canExecute(ctx),
        effects: rule.describeEffects(ctx),
      });
    } catch (e) {
      continue;
    }
  }
  return actions;
}

/** 执行涌现行为 */
export function executeEmergentAction(actionId: string, ctx: InteractionContext): ActionFeedback | null {
  const rule = EMERGENCE_RULES.find(r => r.id === actionId);
  if (!rule || !rule.execute) return null;
  return rule.execute(ctx);
}