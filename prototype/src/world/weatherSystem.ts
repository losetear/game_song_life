// === 天气状态机 — 因果驱动天气变化 ===

export type WeatherType = '晴' | '多云' | '小雨' | '暴雨' | '大暴雨' | '雪';

export interface WeatherState {
  current: WeatherType;
  history: WeatherType[];   // 最近 10 回合
  consecutiveRain: number;  // 连续暴雨/大暴雨回合数
  consecutiveSun: number;   // 连续晴天回合数
  floodRisk: boolean;       // 洪涝风险
}

// 季节 → 天气概率权重
const SEASON_WEIGHTS: Record<string, Record<WeatherType, number>> = {
  spring: { '晴': 30, '多云': 25, '小雨': 30, '暴雨': 10, '大暴雨': 3, '雪': 2 },
  summer: { '晴': 20, '多云': 20, '小雨': 20, '暴雨': 25, '大暴雨': 12, '雪': 3 },
  autumn: { '晴': 40, '多云': 25, '小雨': 20, '暴雨': 10, '大暴雨': 3, '雪': 2 },
  winter: { '晴': 20, '多云': 20, '小雨': 5, '暴雨': 5, '大暴雨': 0, '雪': 50 },
};

// 当前天气 → 下回合天气转移权重加成（马尔可夫链）
const TRANSITION_BONUS: Record<WeatherType, Partial<Record<WeatherType, number>>> = {
  '晴':     { '晴': 20, '多云': 10 },
  '多云':   { '多云': 15, '小雨': 10 },
  '小雨':   { '小雨': 20, '暴雨': 10, '多云': 5 },
  '暴雨':   { '暴雨': 25, '大暴雨': 15, '小雨': 5 },
  '大暴雨': { '大暴雨': 20, '暴雨': 20, '小雨': 5 },
  '雪':     { '雪': 25, '多云': 5 },
};

const ALL_WEATHERS: WeatherType[] = ['晴', '多云', '小雨', '暴雨', '大暴雨', '雪'];

export class WeatherSystem {
  private state: WeatherState;

  constructor() {
    this.state = {
      current: '晴',
      history: [],
      consecutiveRain: 0,
      consecutiveSun: 0,
      floodRisk: false,
    };
  }

  /** 每回合推进天气 */
  advance(season: string): void {
    // 1. 计算每种天气的权重
    const baseWeights = SEASON_WEIGHTS[season] || SEASON_WEIGHTS['spring'];
    const transitionBonus = TRANSITION_BONUS[this.state.current] || {};

    const weights: Record<WeatherType, number> = {} as any;
    for (const w of ALL_WEATHERS) {
      weights[w] = (baseWeights[w] || 0) + (transitionBonus[w] || 0);
    }

    // 2. 加权随机选择
    const newWeather = this.weightedPick(weights);

    // 3. 更新状态
    this.state.current = newWeather;
    this.state.history.push(newWeather);
    if (this.state.history.length > 10) {
      this.state.history.shift();
    }

    // 4. 更新连续计数
    if (newWeather === '暴雨' || newWeather === '大暴雨') {
      this.state.consecutiveRain++;
      this.state.consecutiveSun = 0;
    } else if (newWeather === '晴') {
      this.state.consecutiveSun++;
      this.state.consecutiveRain = 0;
    } else {
      this.state.consecutiveRain = 0;
      this.state.consecutiveSun = 0;
    }

    // 5. 洪涝风险：连续3回合暴雨/大暴雨
    this.state.floodRisk = this.state.consecutiveRain >= 3;
  }

  get weather(): WeatherType { return this.state.current; }
  get history(): WeatherType[] { return [...this.state.history]; }
  get isRaining(): boolean { return this.state.current === '小雨' || this.state.current === '暴雨' || this.state.current === '大暴雨'; }
  get isHeavyRain(): boolean { return this.state.current === '暴雨' || this.state.current === '大暴雨'; }
  get isSnowing(): boolean { return this.state.current === '雪'; }
  get isSunny(): boolean { return this.state.current === '晴'; }
  get floodRisk(): boolean { return this.state.floodRisk; }
  get consecutiveRain(): number { return this.state.consecutiveRain; }
  get consecutiveSun(): number { return this.state.consecutiveSun; }

  /** 天气对农业产量的影响系数 */
  get farmYieldMod(): number {
    if (this.state.current === '大暴雨') return 0.3;
    if (this.state.current === '暴雨') return 0.6;
    if (this.state.current === '小雨') return 0.9;
    if (this.state.current === '雪') return 0.7;
    if (this.state.consecutiveSun >= 3) return 1.2;
    return 1.0;
  }

  /** 天气对户外出行的影响 */
  get outdoorMod(): number {
    if (this.state.current === '大暴雨') return 0.1;
    if (this.state.current === '暴雨') return 0.2;
    if (this.state.current === '小雨') return 0.6;
    if (this.state.current === '雪') return 0.4;
    return 1.0;
  }

  /** 获取天气描述文字 */
  getDescription(): string {
    switch (this.state.current) {
      case '晴': return this.state.consecutiveSun >= 3 ? '连续几天好天气，阳光明媚' : '天朗气清，万里无云';
      case '多云': return '天空中飘着几朵云，时阴时晴';
      case '小雨': return '天空飘起了细雨，淅淅沥沥';
      case '暴雨': return '暴雨倾盆，电闪雷鸣';
      case '大暴雨': return '大暴雨！天地间一片水幕';
      case '雪': return '纷纷扬扬下起了雪，银装素裹';
    }
  }

  getState(): WeatherState {
    return { ...this.state, history: [...this.state.history] };
  }

  private weightedPick(weights: Record<WeatherType, number>): WeatherType {
    const entries = Object.entries(weights) as [WeatherType, number][];
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [weather, weight] of entries) {
      r -= weight;
      if (r <= 0) return weather;
    }
    return entries[entries.length - 1][0];
  }
}
