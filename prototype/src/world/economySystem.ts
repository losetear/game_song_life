// === 经济系统（简化供需） ===

export interface MarketPrices {
  food: number;
  herbs: number;
  cloth: number;
  material: number;
  cargo: number;
}

export class EconomySystem {
  private prices: MarketPrices = {
    food: 5,
    herbs: 10,
    cloth: 15,
    material: 8,
    cargo: 12,
  };

  private demand: Record<string, number> = {
    food: 100,
    herbs: 30,
    cloth: 50,
    material: 40,
    cargo: 60,
  };

  private supply: Record<string, number> = {
    food: 100,
    herbs: 30,
    cloth: 50,
    material: 40,
    cargo: 60,
  };

  /** 更新价格 */
  update(): void {
    for (const item of Object.keys(this.prices)) {
      const base = this.prices[item as keyof MarketPrices];
      const ratio = this.supply[item] / Math.max(1, this.demand[item]);
      // 价格在基础价的 0.5x ~ 2x 浮动
      this.prices[item as keyof MarketPrices] = Math.round(base * Math.max(0.5, Math.min(2.0, ratio)) * 100) / 100;
    }
  }

  getPrice(item: keyof MarketPrices): number {
    return this.prices[item];
  }

  adjustSupply(item: string, amount: number): void {
    if (this.supply[item] !== undefined) {
      this.supply[item] += amount;
    }
  }

  adjustDemand(item: string, amount: number): void {
    if (this.demand[item] !== undefined) {
      this.demand[item] += amount;
    }
  }

  getPrices(): MarketPrices {
    return { ...this.prices };
  }
}
