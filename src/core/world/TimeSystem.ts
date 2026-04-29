import type { SeededRandom } from '../utils/random';

export type Season = '春' | '夏' | '秋' | '冬';

const SEASON_ORDER: Season[] = ['春', '夏', '秋', '冬'];
const DAYS_PER_SEASON = 30;

export class TimeSystem {
  private day = 1;

  getDay(): number {
    return this.day;
  }

  getSeason(): Season {
    const seasonIndex = Math.floor(((this.day - 1) / DAYS_PER_SEASON) % 4);
    return SEASON_ORDER[seasonIndex]!;
  }

  getDayOfSeason(): number {
    return ((this.day - 1) % DAYS_PER_SEASON) + 1;
  }

  getYear(): number {
    return Math.floor((this.day - 1) / (DAYS_PER_SEASON * 4)) + 1;
  }

  advanceDay(): void {
    this.day++;
  }

  /** 季节是否在这一天发生了变化 */
  isSeasonChanged(): boolean {
    return this.getDayOfSeason() === 1 && this.day > 1;
  }

  setDay(day: number): void {
    this.day = day;
  }
}
