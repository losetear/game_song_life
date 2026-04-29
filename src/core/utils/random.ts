/**
 * 可播种随机数生成器（xorshift128）
 * 同一种子始终产生相同序列，方便调试和存档复现
 */
export class SeededRandom {
  private state: [number, number, number, number];

  constructor(seed: number) {
    // 用种子初始化状态
    seed = seed | 0;
    this.state = [
      seed >>> 0,
      (seed ^ 0x12345678) >>> 0,
      (seed ^ 0x87654321) >>> 0,
      (seed ^ 0xDEADBEEF) >>> 0,
    ];
    // 预热：跳过前64个值
    for (let i = 0; i < 64; i++) this.next();
  }

  /** 返回 [0, 1) 的浮点数 */
  next(): number {
    let [s0, s1, s2, s3] = this.state;
    const t = s3 ^ (s3 << 11);
    s3 = s2;
    s2 = s1;
    s1 = s0;
    s0 = (s0 ^ (s0 >>> 19) ^ (t ^ (t >>> 8))) >>> 0;
    this.state = [s0, s1, s2, s3];
    return s0 / 0x100000000;
  }

  /** 返回 [min, max) 的整数 */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** 概率判定，p in [0, 1] */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** 从数组中随机选一个 */
  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length)]!;
  }

  /** 加权随机选择，权重数组长度必须与选项数组相同 */
  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }
}
