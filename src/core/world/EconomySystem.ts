import type { Season } from './TimeSystem';
import { clamp } from '../utils/clamp';

export interface GoodDef {
  id: string;
  name: string;
  basePrice: number;
  /** 季节价格修正因子 */
  seasonFactor: Record<string, number>;
}

export const GOODS: GoodDef[] = [
  {
    id: 'grain',
    name: '粮食',
    basePrice: 10,
    seasonFactor: { '春': 1.0, '夏': 1.2, '秋': 0.7, '冬': 1.5 },
  },
  {
    id: 'cloth',
    name: '布匹',
    basePrice: 25,
    seasonFactor: { '春': 0.9, '夏': 1.0, '秋': 1.0, '冬': 1.3 },
  },
  {
    id: 'herb',
    name: '药材',
    basePrice: 15,
    seasonFactor: { '春': 0.8, '夏': 1.0, '秋': 1.1, '冬': 1.4 },
  },
];

export class EconomySystem {
  private prices: Record<string, number> = {};

  constructor() {
    for (const good of GOODS) {
      this.prices[good.id] = good.basePrice;
    }
  }

  getPrice(goodId: string): number {
    return this.prices[goodId] ?? 0;
  }

  getAllPrices(): Record<string, { name: string; price: number }> {
    const result: Record<string, { name: string; price: number }> = {};
    for (const good of GOODS) {
      result[good.id] = { name: good.name, price: this.prices[good.id]! };
    }
    return result;
  }

  /** 每季更新价格 */
  updatePrices(season: Season, rng: { next: () => number }): void {
    for (const good of GOODS) {
      const factor = good.seasonFactor[season] ?? 1.0;
      const noise = 0.9 + rng.next() * 0.2; // ±10% 随机波动
      const target = good.basePrice * factor * noise;
      // 平滑过渡：每天最多变动15%
      const current = this.prices[good.id]!;
      const maxChange = current * 0.15;
      const diff = target - current;
      this.prices[good.id] = clamp(
        current + Math.max(-maxChange, Math.min(maxChange, diff)),
        Math.floor(good.basePrice * 0.3),
        Math.ceil(good.basePrice * 3),
      );
    }
  }
}
