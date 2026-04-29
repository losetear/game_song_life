import type { SeededRandom } from '../utils/random';
import type { Season } from './TimeSystem';

export type Weather = '晴' | '阴' | '雨' | '雪';

/** 每个季节的天气概率权重 */
const SEASON_WEATHER: Record<Season, [Weather, number][]> = {
  '春': [['晴', 5], ['阴', 3], ['雨', 4], ['雪', 0]],
  '夏': [['晴', 6], ['阴', 2], ['雨', 3], ['雪', 0]],
  '秋': [['晴', 5], ['阴', 3], ['雨', 2], ['雪', 0]],
  '冬': [['晴', 3], ['阴', 3], ['雨', 1], ['雪', 4]],
};

/** 马尔可夫链转移：如果昨天是某天气，今天的倾向 */
const PERSIST_BONUS = 0.4; // 保持昨天天气的额外权重

export class WeatherSystem {
  private current: Weather = '晴';

  get(): Weather {
    return this.current;
  }

  update(season: Season, rng: SeededRandom): boolean {
    const prev = this.current;
    const weights = SEASON_WEATHER[season];

    // 基础权重 + 持续性加成
    const adjusted = weights.map(([w, base]) => {
      const bonus = w === prev ? base * PERSIST_BONUS : 0;
      return [w, base + bonus] as [Weather, number];
    });

    const totalWeight = adjusted.reduce((s, [, w]) => s + w, 0);
    let r = rng.next() * totalWeight;

    for (const [weather, weight] of adjusted) {
      r -= weight;
      if (r <= 0) {
        this.current = weather;
        return prev !== this.current;
      }
    }

    this.current = adjusted[adjusted.length - 1]![0];
    return prev !== this.current;
  }

  set(weather: Weather): void {
    this.current = weather;
  }
}
