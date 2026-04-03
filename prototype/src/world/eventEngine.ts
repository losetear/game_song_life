// === 因果事件引擎 — 所有事件必须由状态变化触发 ===

import { WeatherSystem } from './weatherSystem';
import { EconomySystem, MarketPrices } from './economySystem';
import { RegionSimulator, RegionStats } from '../ai/statistics/regionSim';
import { EntityManager } from '../ecs/entityManager';

// === 因果事件 ===
export interface CausalEvent {
  tick: number;
  message: string;         // 叙事描述
  cause: string;           // 触发原因
  source: 'weather' | 'economy' | 'ecology' | 'npc' | 'player';
  sourceLocation?: string; // 发生地点
  spreadRadius: number;    // 传播范围（0=当前Grid, 1=相邻, 2=同城, 3=远方）
}

// === 因果规则 ===
interface CausalRule {
  id: string;
  source: CausalEvent['source'];
  check: (ctx: RuleContext) => boolean;
  generate: (ctx: RuleContext) => CausalEvent | null;
  cooldown: number;       // 同一规则连续触发的最小间隔 tick 数
}

interface RuleContext {
  tick: number;
  weather: WeatherSystem;
  economy: EconomySystem;
  oldPrices: MarketPrices;
  newPrices: MarketPrices;
  regions: RegionStats[];
  em: EntityManager;
  l0Entities: number[];
}

export class EventEngine {
  private lastFired: Map<string, number> = new Map(); // ruleId → lastTick

  /** 每回合检查所有因果规则，生成事件 */
  generateEvents(ctx: RuleContext): CausalEvent[] {
    const events: CausalEvent[] = [];

    for (const rule of CAUSAL_RULES) {
      // 冷却检查
      const lastTick = this.lastFired.get(rule.id) ?? -999;
      if (ctx.tick - lastTick < rule.cooldown) continue;

      if (rule.check(ctx)) {
        const evt = rule.generate(ctx);
        if (evt) {
          events.push(evt);
          this.lastFired.set(rule.id, ctx.tick);
        }
      }
    }

    return events;
  }
}

// ============================================================
// 因果规则表（30+ 条）
// ============================================================

const CAUSAL_RULES: CausalRule[] = [

  // ── 天气因果链 ──────────────────────────────────────────
  {
    id: 'weather_light_rain',
    source: 'weather',
    cooldown: 2,
    check: (ctx) => ctx.weather.weather === '小雨',
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '天空飘起了细雨，街上的行人加快了脚步，纷纷撑起油纸伞。',
      cause: '天气: 小雨',
      source: 'weather',
      spreadRadius: 1,
    }),
  },
  {
    id: 'weather_heavy_rain',
    source: 'weather',
    cooldown: 2,
    check: (ctx) => ctx.weather.weather === '暴雨',
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '暴雨倾盆，街上几乎看不到人。商铺纷纷关门，只有茶楼里还亮着灯。',
      cause: '天气: 暴雨',
      source: 'weather',
      spreadRadius: 1,
    }),
  },
  {
    id: 'weather_torrential_rain',
    source: 'weather',
    cooldown: 5,
    check: (ctx) => ctx.weather.weather === '大暴雨',
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '大暴雨！天地间一片水幕，屋顶都在漏水！低洼处积水没过脚踝。',
      cause: '天气: 大暴雨',
      source: 'weather',
      spreadRadius: 2,
    }),
  },
  {
    id: 'weather_flood_risk',
    source: 'weather',
    cooldown: 8,
    check: (ctx) => ctx.weather.floodRisk,
    generate: (ctx) => ({
      tick: ctx.tick,
      message: `连续${ctx.weather.consecutiveRain}时辰暴雨，河水暴涨，低洼处开始积水，百姓忧心忡忡。`,
      cause: `天气: 连续${ctx.weather.consecutiveRain}回合暴雨 → 洪涝风险`,
      source: 'weather',
      sourceLocation: '河岸',
      spreadRadius: 3,
    }),
  },
  {
    id: 'weather_snow',
    source: 'weather',
    cooldown: 3,
    check: (ctx) => ctx.weather.weather === '雪',
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '下雪了！路上结了冰，行人小心翼翼。卖炭翁推着炭车艰难前行。',
      cause: '天气: 大雪',
      source: 'weather',
      spreadRadius: 1,
    }),
  },
  {
    id: 'weather_sunny_streak',
    source: 'weather',
    cooldown: 5,
    check: (ctx) => ctx.weather.consecutiveSun >= 3,
    generate: (ctx) => ({
      tick: ctx.tick,
      message: `连续${ctx.weather.consecutiveSun}个时辰好天气，街上人多了起来，小贩的吆喝声此起彼伏。`,
      cause: `天气: 连续${ctx.weather.consecutiveSun}回合晴天`,
      source: 'weather',
      spreadRadius: 1,
    }),
  },
  {
    id: 'weather_clear',
    source: 'weather',
    cooldown: 3,
    check: (ctx) => ctx.weather.weather === '晴' && ctx.weather.consecutiveSun < 3,
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '天朗气清，惠风和畅，是个出门的好天气。',
      cause: '天气: 晴',
      source: 'weather',
      spreadRadius: 0,
    }),
  },
  {
    id: 'weather_cloudy',
    source: 'weather',
    cooldown: 3,
    check: (ctx) => ctx.weather.weather === '多云',
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '天空中飘着几朵云，遮住了太阳，光线柔和了不少。',
      cause: '天气: 多云',
      source: 'weather',
      spreadRadius: 0,
    }),
  },

  // ── 经济因果链 ──────────────────────────────────────────
  {
    id: 'economy_food_price_up',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'food');
      return diff > 15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'food');
      return {
        tick: ctx.tick,
        message: `最近米价涨了${diff.toFixed(0)}%，粮铺门口排起了长队，百姓怨声载道。`,
        cause: `经济: 粮价上涨${diff.toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_food_price_down',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'food');
      return diff < -15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'food');
      return {
        tick: ctx.tick,
        message: `粮价降了${Math.abs(diff).toFixed(0)}%，百姓们很高兴，都说今年日子好过。`,
        cause: `经济: 粮价下降${Math.abs(diff).toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_cloth_price_down',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cloth');
      return diff < -15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cloth');
      return {
        tick: ctx.tick,
        message: `听说新到一批货，市面上的布匹便宜了${Math.abs(diff).toFixed(0)}%，妇人们都赶着去买。`,
        cause: `经济: 布价下降${Math.abs(diff).toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_cloth_price_up',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cloth');
      return diff > 15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cloth');
      return {
        tick: ctx.tick,
        message: `布价涨了${diff.toFixed(0)}%，裁缝铺的生意冷清了不少。`,
        cause: `经济: 布价上涨${diff.toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_herbs_price_up',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'herbs');
      return diff > 15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'herbs');
      return {
        tick: ctx.tick,
        message: `药材涨了${diff.toFixed(0)}%，病人叫苦不迭，李大夫也直摇头。`,
        cause: `经济: 药价上涨${diff.toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_herbs_price_down',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'herbs');
      return diff < -15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'herbs');
      return {
        tick: ctx.tick,
        message: `药材便宜了${Math.abs(diff).toFixed(0)}%，有人趁便宜多买了几副备着。`,
        cause: `经济: 药价下降${Math.abs(diff).toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 1,
      };
    },
  },
  {
    id: 'economy_material_price_up',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'material');
      return diff > 15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'material');
      return {
        tick: ctx.tick,
        message: `最近矿石不好收，铁器涨了${diff.toFixed(0)}%，孙铁匠叹气不止。`,
        cause: `经济: 材料价上涨${diff.toFixed(0)}%`,
        source: 'economy',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_cargo_price_up',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cargo');
      return diff > 15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cargo');
      return {
        tick: ctx.tick,
        message: `码头的货价涨了${diff.toFixed(0)}%，商贩们叫苦不迭。`,
        cause: `经济: 货运价上涨${diff.toFixed(0)}%`,
        source: 'economy',
        sourceLocation: '汴河码头',
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'economy_cargo_price_down',
    source: 'economy',
    cooldown: 5,
    check: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cargo');
      return diff < -15;
    },
    generate: (ctx) => {
      const diff = priceChangePercent(ctx.oldPrices, ctx.newPrices, 'cargo');
      return {
        tick: ctx.tick,
        message: `码头来了新货，货运价降了${Math.abs(diff).toFixed(0)}%，是囤货的好时机。`,
        cause: `经济: 货运价下降${Math.abs(diff).toFixed(0)}%`,
        source: 'economy',
        sourceLocation: '汴河码头',
        spreadRadius: 2,
      };
    },
  },

  // ── 生态因果链（基于 L2 统计） ──────────────────────────
  {
    id: 'ecology_farm_good',
    source: 'ecology',
    cooldown: 8,
    check: (ctx) => {
      const farms = ctx.regions.filter(r => r.regionType === 'farmland');
      return farms.some(r => r.yieldAmount > r.area * r.baseYield * 1.3);
    },
    generate: (ctx) => {
      const farm = ctx.regions.filter(r => r.regionType === 'farmland').find(r => r.yieldAmount > r.area * r.baseYield * 1.3);
      return {
        tick: ctx.tick,
        message: `今年年成不错，粮食充裕，百姓脸上都挂着笑。`,
        cause: `生态: ${farm?.regionId || '农庄'} 产量高于正常×1.3`,
        source: 'ecology',
        sourceLocation: farm?.regionId,
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'ecology_farm_bad',
    source: 'ecology',
    cooldown: 8,
    check: (ctx) => {
      const farms = ctx.regions.filter(r => r.regionType === 'farmland');
      return farms.some(r => r.yieldAmount < r.area * r.baseYield * 0.3);
    },
    generate: (ctx) => {
      const farm = ctx.regions.filter(r => r.regionType === 'farmland').find(r => r.yieldAmount < r.area * r.baseYield * 0.3);
      return {
        tick: ctx.tick,
        message: `城外庄稼不好，今年怕是要欠收，百姓们愁眉不展。`,
        cause: `生态: ${farm?.regionId || '农庄'} 产量低于正常×0.5`,
        source: 'ecology',
        sourceLocation: farm?.regionId,
        spreadRadius: 3,
      };
    },
  },
  {
    id: 'ecology_animal_low',
    source: 'ecology',
    cooldown: 10,
    check: (ctx) => {
      const mountains = ctx.regions.filter(r => r.regionType === 'mountain');
      return mountains.some(r => r.wildAnimalCount < r.maxAnimal * 0.3);
    },
    generate: (ctx) => {
      const mt = ctx.regions.filter(r => r.regionType === 'mountain').find(r => r.wildAnimalCount < r.maxAnimal * 0.3);
      return {
        tick: ctx.tick,
        message: '最近山里猎物稀少，猎户们跑了一天也打不到几只兔子。肉价怕是要涨。',
        cause: `生态: ${mt?.regionId || '山林'} 动物数量低于容量×0.3`,
        source: 'ecology',
        sourceLocation: mt?.regionId,
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'ecology_fish_good',
    source: 'ecology',
    cooldown: 8,
    check: (ctx) => {
      const rivers = ctx.regions.filter(r => r.regionType === 'river');
      return rivers.some(r => r.fishAmount > r.fishBase * 1.5);
    },
    generate: (ctx) => {
      const river = ctx.regions.filter(r => r.regionType === 'river').find(r => r.fishAmount > r.fishBase * 1.5);
      return {
        tick: ctx.tick,
        message: '码头那边今天鱼获大丰收！鱼贩子乐得合不拢嘴，鱼价也便宜了不少。',
        cause: `生态: ${river?.regionId || '河流'} 鱼获>正常×1.5`,
        source: 'ecology',
        sourceLocation: river?.regionId,
        spreadRadius: 2,
      };
    },
  },
  {
    id: 'ecology_fish_bad',
    source: 'ecology',
    cooldown: 8,
    check: (ctx) => {
      const rivers = ctx.regions.filter(r => r.regionType === 'river');
      return rivers.some(r => r.fishAmount < r.fishBase * 0.3);
    },
    generate: (ctx) => {
      const river = ctx.regions.filter(r => r.regionType === 'river').find(r => r.fishAmount < r.fishBase * 0.3);
      return {
        tick: ctx.tick,
        message: '最近河里打不到鱼，渔夫们唉声叹气。鱼价涨了不少。',
        cause: `生态: ${river?.regionId || '河流'} 鱼获<正常×0.3`,
        source: 'ecology',
        sourceLocation: river?.regionId,
        spreadRadius: 2,
      };
    },
  },

  // ── NPC 行为因果链 ──────────────────────────────────────
  {
    id: 'npc_hungry_poor',
    source: 'npc',
    cooldown: 5,
    check: (ctx) => {
      return ctx.l0Entities.some(id => {
        const vital = ctx.em.getComponent(id, 'Vital');
        const wallet = ctx.em.getComponent(id, 'Wallet');
        return vital && wallet && vital.hunger < 30 && wallet.copper < 10;
      });
    },
    generate: (ctx) => {
      for (const id of ctx.l0Entities) {
        const vital = ctx.em.getComponent(id, 'Vital');
        const wallet = ctx.em.getComponent(id, 'Wallet');
        const identity = ctx.em.getComponent(id, 'Identity');
        if (vital && wallet && vital.hunger < 30 && wallet.copper < 10 && identity) {
          return {
            tick: ctx.tick,
            message: `${identity.name}饿得面黄肌瘦，身无分文，正在街头徘徊，不知在想什么。`,
            cause: `NPC: ${identity.name} 饥饿${vital.hunger}<30 且 铜钱${wallet.copper}<10`,
            source: 'npc',
            spreadRadius: 0,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'npc_rich_consume',
    source: 'npc',
    cooldown: 5,
    check: (ctx) => {
      return ctx.l0Entities.some(id => {
        const wallet = ctx.em.getComponent(id, 'Wallet');
        return wallet && wallet.copper > 500;
      });
    },
    generate: (ctx) => {
      for (const id of ctx.l0Entities) {
        const wallet = ctx.em.getComponent(id, 'Wallet');
        const identity = ctx.em.getComponent(id, 'Identity');
        if (wallet && wallet.copper > 500 && identity) {
          return {
            tick: ctx.tick,
            message: `看来${identity.name}最近发了笔小财，出手阔绰了不少。`,
            cause: `NPC: ${identity.name} 铜钱${wallet.copper}>500`,
            source: 'npc',
            spreadRadius: 1,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'npc_mood_low',
    source: 'npc',
    cooldown: 5,
    check: (ctx) => {
      return ctx.l0Entities.some(id => {
        const vital = ctx.em.getComponent(id, 'Vital');
        return vital && vital.mood < 25;
      });
    },
    generate: (ctx) => {
      for (const id of ctx.l0Entities) {
        const vital = ctx.em.getComponent(id, 'Vital');
        const identity = ctx.em.getComponent(id, 'Identity');
        if (vital && vital.mood < 25 && identity) {
          return {
            tick: ctx.tick,
            message: `${identity.name}愁眉苦脸，在茶馆里独自喝闷酒。`,
            cause: `NPC: ${identity.name} 心情${vital.mood}<25`,
            source: 'npc',
            spreadRadius: 0,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'npc_high_fatigue',
    source: 'npc',
    cooldown: 5,
    check: (ctx) => {
      return ctx.l0Entities.some(id => {
        const vital = ctx.em.getComponent(id, 'Vital');
        return vital && vital.fatigue > 85;
      });
    },
    generate: (ctx) => {
      for (const id of ctx.l0Entities) {
        const vital = ctx.em.getComponent(id, 'Vital');
        const identity = ctx.em.getComponent(id, 'Identity');
        if (vital && vital.fatigue > 85 && identity) {
          return {
            tick: ctx.tick,
            message: `${identity.name}累得直不起腰，找个地方歇着了。`,
            cause: `NPC: ${identity.name} 疲劳${vital.fatigue}>85`,
            source: 'npc',
            spreadRadius: 0,
          };
        }
      }
      return null;
    },
  },

  // ── 天气对经济的连锁影响 ────────────────────────────────
  {
    id: 'weather_flood_farm',
    source: 'weather',
    cooldown: 10,
    check: (ctx) => ctx.weather.floodRisk,
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '连续暴雨冲毁了城外不少农田，今年收成堪忧，粮食怕是要涨价了。',
      cause: `天气: 洪涝 → 农田减产`,
      source: 'weather',
      sourceLocation: '东郊农庄',
      spreadRadius: 3,
    }),
  },
  {
    id: 'weather_snow_fuel',
    source: 'weather',
    cooldown: 6,
    check: (ctx) => ctx.weather.isSnowing,
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '大雪天，城里燃料需求猛增，炭价跟着涨了不少。穷人家只能多穿几件旧衣凑合。',
      cause: `天气: 大雪 → 燃料需求增加`,
      source: 'weather',
      spreadRadius: 2,
    }),
  },
  {
    id: 'weather_rain_trade',
    source: 'weather',
    cooldown: 5,
    check: (ctx) => ctx.weather.isHeavyRain,
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '暴雨天，码头的船都不敢出港，货运中断，商贩们急得团团转。',
      cause: `天气: 暴雨 → 货运中断`,
      source: 'weather',
      sourceLocation: '汴河码头',
      spreadRadius: 2,
    }),
  },

  // ── 玩家状态事件 ────────────────────────────────────────
  {
    id: 'player_rich',
    source: 'player',
    cooldown: 10,
    check: (ctx) => {
      // 查找玩家（wanderer 职业）
      const allIds = ctx.em.allEntities();
      for (const id of allIds) {
        const identity = ctx.em.getComponent(id, 'Identity');
        const wallet = ctx.em.getComponent(id, 'Wallet');
        if (identity?.profession === 'wanderer' && wallet && wallet.copper > 500) {
          return true;
        }
      }
      return false;
    },
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '看来你最近发了笔小财，街上的人看你的眼神都不一样了。',
      cause: `玩家: 铜钱>500`,
      source: 'player',
      spreadRadius: 0,
    }),
  },
  {
    id: 'player_poor',
    source: 'player',
    cooldown: 10,
    check: (ctx) => {
      const allIds = ctx.em.allEntities();
      for (const id of allIds) {
        const identity = ctx.em.getComponent(id, 'Identity');
        const wallet = ctx.em.getComponent(id, 'Wallet');
        if (identity?.profession === 'wanderer' && wallet && wallet.copper < 10) {
          return true;
        }
      }
      return false;
    },
    generate: (ctx) => ({
      tick: ctx.tick,
      message: '你囊中羞涩，卖炊饼的大娘看你可怜，送了你半个冷饼。',
      cause: `玩家: 铜钱<10`,
      source: 'player',
      spreadRadius: 0,
    }),
  },

  // ── 综合因果：天气+经济 ─────────────────────────────────
  {
    id: 'composite_rain_hunger',
    source: 'npc',
    cooldown: 8,
    check: (ctx) => {
      // 暴雨 + 有NPC饥饿
      if (!ctx.weather.isHeavyRain) return false;
      return ctx.l0Entities.some(id => {
        const vital = ctx.em.getComponent(id, 'Vital');
        return vital && vital.hunger < 40;
      });
    },
    generate: (ctx) => {
      for (const id of ctx.l0Entities) {
        const vital = ctx.em.getComponent(id, 'Vital');
        const identity = ctx.em.getComponent(id, 'Identity');
        if (vital && vital.hunger < 40 && identity) {
          return {
            tick: ctx.tick,
            message: `暴雨天饿着肚子可不好受。${identity.name}缩在屋檐下，等着雨停。`,
            cause: `天气:暴雨 + NPC:${identity.name} 饥饿${vital.hunger}<40`,
            source: 'npc',
            spreadRadius: 0,
          };
        }
      }
      return null;
    },
  },
];

// === 工具函数 ===

function priceChangePercent(oldPrices: MarketPrices, newPrices: MarketPrices, item: keyof MarketPrices): number {
  const old = oldPrices[item] || 1;
  const nw = newPrices[item] || 1;
  return ((nw - old) / old) * 100;
}
