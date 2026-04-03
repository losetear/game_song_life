// === 时间系统（时辰） ===

export const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export class TimeSystem {
  private tickCount = 0;
  private ticksPerShichen = 10;    // 10 ticks = 1 时辰
  private shichenPerDay = 12;      // 12 时辰 = 1 天

  get tick(): number { return this.tickCount; }
  get shichenIndex(): number { return Math.floor((this.tickCount / this.ticksPerShichen) % this.shichenPerDay); }
  get shichenName(): string { return SHICHEN_NAMES[this.shichenIndex]; }
  get hour(): number { return this.shichenIndex * 2 + 1; } // 粗略映射到小时
  get day(): number { return Math.floor(this.tickCount / (this.ticksPerShichen * this.shichenPerDay)); }
  get season(): string { return SEASONS[Math.floor((this.day % 120) / 30)]; } // 30天一季
  get isDaytime(): boolean { return this.hour >= 7 && this.hour <= 19; }

  advance(): void {
    this.tickCount++;
  }

  /** 每日检查 */
  get isNewDay(): boolean {
    return this.tickCount > 0 && this.tickCount % (this.ticksPerShichen * this.shichenPerDay) === 0;
  }
}
