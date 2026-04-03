// === 经济系统 — 供需驱动，L2统计支撑 ===

import { WeatherSystem } from './weatherSystem';
import { RegionStats } from '../ai/statistics/regionSim';

export interface MarketPrices {
  [key: string]: number;
  food: number;
  herbs: number;
  cloth: number;
  material: number;
  cargo: number;
}

// 基础价格
const BASE_PRICES: MarketPrices = {
  food: 10,
  herbs: 15,
  cloth: 20,
  material: 8,
  cargo: 12,
};

export class EconomySystem {
  private prices: MarketPrices = { ...BASE_PRICES };
  private demand: Record<string, number> = {
    food: 100, herbs: 30, cloth: 50, material: 40, cargo: 60,
  };
  private supply: Record<string, number> = {
    food: 100, herbs: 30, cloth: 50, material: 40, cargo: 60,
  };
  /** 最近30回合的价格历史 */
  private priceHistory: Record<string, number[]> = {
    food: [BASE_PRICES.food],
    herbs: [BASE_PRICES.herbs],
    cloth: [BASE_PRICES.cloth],
    material: [BASE_PRICES.material],
    cargo: [BASE_PRICES.cargo],
  };
  /** 最近的价格变动记录 */
  private recentChanges: { item: string; change: string; reason: string }[] = [];

  /** 基于供需和天气更新价格 */
  update(weather?: WeatherSystem, regions?: RegionStats[]): void {
    // 1. 根据 L2 区域统计更新供给
    if (regions) {
      let totalFarmYield = 0;
      let totalFishYield = 0;
      for (const r of regions) {
        if (r.regionType === 'farmland') totalFarmYield += r.yieldAmount;
        if (r.regionType === 'river') totalFishYield += r.fishAmount;
      }
      // 农田产量 → 粮食供给
      this.supply['food'] = Math.max(10, totalFarmYield / 50);
      // 鱼获 → 增加食物供给
      this.supply['food'] += totalFishYield / 100;

      // 山林动物 → 材料供给
      const mountains = regions.filter(r => r.regionType === 'mountain');
      const totalAnimals = mountains.reduce((s, r) => s + r.wildAnimalCount, 0);
      this.supply['material'] = Math.max(5, totalAnimals / 10);
    }

    // 2. 天气对需求和供给的影响
    if (weather) {
      if (weather.isSnowing) {
        this.demand['material'] = 80; // 大雪天燃料需求增加
      } else {
        this.demand['material'] = 40;
      }
      if (weather.isHeavyRain) {
        this.supply['cargo'] = Math.max(5, (this.supply['cargo'] || 60) * 0.6); // 暴雨天货运减少
      }
    }

    // 3. 根据供需比计算价格
    for (const item of Object.keys(BASE_PRICES)) {
      const base = BASE_PRICES[item as keyof MarketPrices];
      const ratio = this.supply[item] / Math.max(1, this.demand[item]);
      // 价格 = 基础价 × (需求/供给)，限制在 0.3x ~ 3x
      const targetPrice = base * Math.max(0.3, Math.min(3.0, ratio));
      // 平滑过渡：价格每回合最多变动 15%
      const oldPrice = this.prices[item as keyof MarketPrices];
      const maxChange = oldPrice * 0.15;
      const newPrice = Math.max(oldPrice - maxChange, Math.min(oldPrice + maxChange, targetPrice));
      this.prices[item as keyof MarketPrices] = Math.round(newPrice * 100) / 100;
    }

    // 4. 记录价格历史
    for (const item of Object.keys(this.prices)) {
      if (!this.priceHistory[item]) this.priceHistory[item] = [];
      this.priceHistory[item].push(this.prices[item as keyof MarketPrices]);
      if (this.priceHistory[item].length > 30) {
        this.priceHistory[item].shift();
      }
    }
  }

  getPrice(item: keyof MarketPrices): number {
    return this.prices[item];
  }

  getBasePrice(item: keyof MarketPrices): number {
    return BASE_PRICES[item];
  }

  adjustSupply(item: string, amount: number): void {
    if (this.supply[item] !== undefined) {
      this.supply[item] = Math.max(1, this.supply[item] + amount);
    }
  }

  adjustDemand(item: string, amount: number): void {
    if (this.demand[item] !== undefined) {
      this.demand[item] = Math.max(1, this.demand[item] + amount);
    }
  }

  getPrices(): MarketPrices {
    return { ...this.prices };
  }

  getSupply(): Record<string, number> {
    return { ...this.supply };
  }

  getDemand(): Record<string, number> {
    return { ...this.demand };
  }

  getPriceHistory(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    for (const key of Object.keys(this.priceHistory)) {
      result[key] = [...this.priceHistory[key]];
    }
    return result;
  }

  getRecentChanges(): { item: string; change: string; reason: string }[] {
    return [...this.recentChanges];
  }

  /** 记录价格变动（由 worldEngine 在计算价格变动后调用） */
  recordChange(item: string, change: string, reason: string): void {
    this.recentChanges.push({ item, change, reason });
    if (this.recentChanges.length > 20) {
      this.recentChanges.shift();
    }
  }
}
