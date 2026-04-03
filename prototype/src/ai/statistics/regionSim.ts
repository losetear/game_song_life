// === L2 统计模拟 — 10 区域 ===

export interface RegionStats {
  regionId: string;
  regionType: 'farmland' | 'mountain' | 'river' | 'urban';

  // 农田
  area: number;           // 亩
  baseYield: number;      // 基础亩产
  laborCount: number;     // 劳力人数

  // 山林
  wildAnimalCount: number;
  breedRate: number;
  huntRate: number;
  deathRate: number;
  maxAnimal: number;

  // 河流
  fishBase: number;
  fisherCount: number;

  // 通用
  weatherMod: number;     // 0.5-1.5
  seasonMod: number;      // 0.3-1.5

  // 产出
  yieldAmount: number;
  fishAmount: number;
}

export const REGION_DEFS: Omit<RegionStats, 'yieldAmount' | 'fishAmount'>[] = [
  { regionId: 'east_farm', regionType: 'farmland', area: 500, baseYield: 3, laborCount: 50, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 0, fisherCount: 0, weatherMod: 1, seasonMod: 1 },
  { regionId: 'south_farm', regionType: 'farmland', area: 400, baseYield: 3, laborCount: 40, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 0, fisherCount: 0, weatherMod: 1, seasonMod: 1 },
  { regionId: 'irrigation', regionType: 'farmland', area: 100, baseYield: 4, laborCount: 10, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 0, fisherCount: 0, weatherMod: 1, seasonMod: 1 },
  { regionId: 'shallow_mountain', regionType: 'mountain', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 200, breedRate: 0.05, huntRate: 0.02, deathRate: 0.01, maxAnimal: 500, fishBase: 0, fisherCount: 0, weatherMod: 1, seasonMod: 1 },
  { regionId: 'deep_mountain', regionType: 'mountain', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 300, breedRate: 0.03, huntRate: 0.01, deathRate: 0.01, maxAnimal: 800, fishBase: 0, fisherCount: 0, weatherMod: 1, seasonMod: 1 },
  { regionId: 'mountain_village', regionType: 'mountain', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 50, breedRate: 0.04, huntRate: 0.03, deathRate: 0.01, maxAnimal: 100, fishBase: 0, fisherCount: 0, weatherMod: 1, seasonMod: 1 },
  { regionId: 'upstream', regionType: 'river', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 100, fisherCount: 5, weatherMod: 1, seasonMod: 1 },
  { regionId: 'downstream', regionType: 'river', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 150, fisherCount: 8, weatherMod: 1, seasonMod: 1 },
  { regionId: 'riverbank', regionType: 'river', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 80, fisherCount: 3, weatherMod: 1, seasonMod: 1 },
  { regionId: 'stream', regionType: 'river', area: 0, baseYield: 0, laborCount: 0, wildAnimalCount: 0, breedRate: 0, huntRate: 0, deathRate: 0, maxAnimal: 0, fishBase: 60, fisherCount: 2, weatherMod: 1, seasonMod: 1 },
];

export class RegionSimulator {
  private regions: Map<string, RegionStats> = new Map();

  constructor() {
    for (const def of REGION_DEFS) {
      this.regions.set(def.regionId, { ...def, yieldAmount: 0, fishAmount: 0 });
    }
  }

  /** 更新所有区域统计 */
  update(season: string, weather: number): void {
    this.regions.forEach(region => {
      region.weatherMod = weather;
      region.seasonMod = this.getSeasonMod(season, region.regionType);

      switch (region.regionType) {
        case 'farmland':
          region.yieldAmount = region.area * region.baseYield * region.weatherMod * region.seasonMod * (region.laborCount / 100);
          region.fishAmount = 0;
          break;
        case 'mountain':
          region.wildAnimalCount = Math.min(
            region.maxAnimal,
            Math.floor(region.wildAnimalCount * (1 + region.breedRate - region.huntRate - region.deathRate))
          );
          region.yieldAmount = 0;
          region.fishAmount = 0;
          break;
        case 'river':
          region.fishAmount = region.fishBase * region.seasonMod * (region.fisherCount / 10);
          region.yieldAmount = 0;
          break;
        case 'urban':
          break;
      }
    });
  }

  private getSeasonMod(season: string, type: string): number {
    const mods: Record<string, Record<string, number>> = {
      farmland: { spring: 1.0, summer: 1.3, autumn: 1.5, winter: 0.3 },
      mountain: { spring: 1.0, summer: 1.2, autumn: 1.0, winter: 0.5 },
      river:    { spring: 0.8, summer: 1.2, autumn: 1.0, winter: 0.6 },
    };
    return mods[type]?.[season] ?? 1.0;
  }

  getRegion(id: string): RegionStats | undefined {
    return this.regions.get(id);
  }

  getAllRegions(): RegionStats[] {
    return Array.from(this.regions.values());
  }

  /** 更新劳力/渔民数量 */
  setLabor(regionId: string, count: number): void {
    const r = this.regions.get(regionId);
    if (r) {
      if (r.regionType === 'farmland') r.laborCount = count;
      else if (r.regionType === 'river') r.fisherCount = count;
    }
  }
}
