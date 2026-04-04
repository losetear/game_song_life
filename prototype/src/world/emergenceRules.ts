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

// ============================================================
// 涌现规则定义（31条）
// ============================================================

export const EMERGENCE_RULES: ActionRule[] = [

  // ═══ NPC 相关（13条） ═══

  // 1. 攀谈
  {
    id: 'talk_to', name: '攀谈', icon: '💬', apCost: 1,
    shouldAppear: (ctx) => ctx.target.type === 'npc',
    canExecute: (ctx) => ctx.player.ap < 1 ? { met: false, reason: '行动点不足' } : { met: true, reason: '' },
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

      return {
        success: true, message,
        impressionChange: randInt(1, 5),
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
      if (getImpression(ctx) < -10) return { met: false, reason: '对方不想理你' };
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
      const impression = getImpression(ctx);

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
      const price = randInt(5, Math.min(50, copper));
      const items = ['一袋粗粮', '几尺麻布', '一包药材', '一捆柴火', '一壶浊酒', '几个炊饼'];
      const item = pick(items);

      const messages = [
        `${name}从柜台后取出${item}："${price}文，童叟无欺。"你掏出铜板，对方满意地收了。`,
        `"要这个？"${name}指着${item}，"${price}文，不还价。"你犹豫了一下，还是买了。`,
        `${name}麻利地包好${item}递给你："承惠${price}文。"你付了钱，感觉还算公道。`,
      ];

      return {
        success: true, message: pick(messages),
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
      const price = randInt(3, 30);
      const personality = ctx.target.identity?.personality || [];

      let message = '';
      if (personality.includes('精明') || personality.includes('狡猾')) {
        message = `${name}翻看了一下你的${item.itemType}，挑剔地摇摇头："成色一般，${price}文，不能再多了。"你心里知道他压了价，但也不好反驳。`;
      } else {
        message = `${name}看了看你的${item.itemType}，点了点头："还行，给你${price}文。"你收了铜板，交易完成。`;
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
      const personality = ctx.target.identity?.personality || [];

      // 成功率基于周围人数和NPC警觉性
      let successChance = 0.6 - nearby * 0.1;
      if (personality.includes('精明') || personality.includes('狡猾')) successChance -= 0.2;
      if (personality.includes('胆小')) successChance += 0.1;
      const success = Math.random() < successChance;

      if (success) {
        const stolen = randInt(1, Math.min(targetCopper, 50));
        return {
          success: true,
          message: `你的手悄无声息地伸向${name}的腰包——摸到了几枚铜板！${stolen}文到手。你不动声色地收回手，心跳如鼓。`,
          copperChange: stolen,
          moodChange: -3,
        };
      }

      // 失败
      const failMessages = [
        `你的手刚伸出去，就被${name}一把抓住了！"小贼！"${name}大喊一声，街坊邻居纷纷看了过来。你灰溜溜地缩回了手。`,
        `你悄悄靠近${name}，脚下却踩到了一块碎瓦——"咔嚓"一声，${name}猛然回头，你赶紧装作若无其事的样子。`,
        `"干什么呢！"${name}猛地转身，差点撞到你伸出的手。你干笑了两声："没什么，没什么..."赶紧退开。`,
      ];

      return {
        success: false,
        message: pick(failMessages),
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
      return isDoctor(ctx.target.identity?.profession || '') && ctx.player.vital.health < 60;
    },
    canExecute: (ctx) => {
      if (ctx.player.ap < 2) return { met: false, reason: '行动点不足' };
      if (ctx.player.vital.health >= 60) return { met: false, reason: '你身体无恙' };
      if (ctx.player.wallet.copper < 20) return { met: false, reason: '诊金不够（需20文）' };
      return { met: true, reason: '' };
    },
    describeEffects: (ctx) => `请${ctx.target.identity?.name || '大夫'}为你诊治（诊金20文）`,
    execute: (ctx) => {
      const name = ctx.target.identity?.name || '大夫';
      const health = ctx.player.vital.health;

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
    },
  },

  // 11. 挑衅
  {
    id: 'provoke', name: '挑衅', icon: '👊', apCost: 2,
    shouldAppear: (ctx) => {
      if (ctx.target.type !== 'npc') return false;
      const mood = ctx.target.vital?.mood ?? 50;
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
      const personality = ctx.target.identity?.personality || [];

      const isBrave = personality.includes('勇敢') || personality.includes('刚烈');
      const isTimid = personality.includes('胆小');

      if (isTimid) {
        return {
          success: true,
          message: `你朝${name}叫嚣了几句，他吓得往后退了两步，不敢回嘴。旁边的人看不过去，朝你投来鄙夷的目光。你觉得自己有些过分了。`,
          impressionChange: -10, moodChange: -5,
        };
      }

      if (isBrave || Math.random() < 0.5) {
        return {
          success: true,
          message: pick([
            `${name}被你一激，顿时火冒三丈："你说什么？！"他撸起袖子就要动手。周围的人赶紧拉开，但你的嘴角还是挨了一拳。鼻血直流。`,
            `你挑衅的话刚出口，${name}一脚就踹了过来！"啪"的一声，你被打翻在地。他冷笑道："不长眼的东西。"`,
          ]),
          impressionChange: -20, healthChange: -randInt(5, 15), moodChange: -15,
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