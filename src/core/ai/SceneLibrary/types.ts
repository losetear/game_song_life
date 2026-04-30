/** 分支事件的核心类型定义 */

export type OutcomeType = 'certain' | 'contested' | 'chance';

export interface SceneCondition {
  // 发起者条件
  actorMinCopper?: number;
  actorMaxCopper?: number;
  actorMinHealth?: number;
  actorMaxHealth?: number;
  actorMinHunger?: number;
  actorMaxHunger?: number;
  actorMaxMood?: number;

  // 环境条件
  location?: string[];
  weather?: string[];
  season?: string[];
  dayRange?: [number, number];

  // 叙事标签条件（AND）
  requiredNarrativeTags?: string[];
  forbiddenNarrativeTags?: string[];
  // 叙事标签条件（OR）
  requiredAnyNarrativeTags?: string[];

  // 需要同地点有特定职业NPC
  targetRequired?: boolean;
  targetProfession?: string[];
}

export interface CharacterTransformation {
  type: 'gain_tag' | 'lose_tag' | 'attribute_change';
  value: string | number;
  description: string;
}

export interface EventConsequence {
  narrative: string;
  effects?: Record<string, number>;  // hunger/fatigue/health/mood/copper
  relationChange?: number;  // 对附近NPC的好感变化
  narrativeTag?: string;    // 获得的叙事标签
  transformations?: CharacterTransformation[];
}

export interface EventChoice {
  id: string;
  text: string;
  condition?: {
    field: 'copper' | 'health' | 'hunger' | 'mood' | 'fatigue';
    operator: 'gte' | 'lte';
    value: number;
  };
  consequence: EventConsequence;
}

export interface BranchEvent {
  id: string;
  name: string;
  goalCategory: string;
  weight: number;
  cooldownDays: number;
  conditions: SceneCondition;
  openingNarrative: string;
  choices: EventChoice[];
  priority?: number;
  narrativeWeight?: 'flavor' | 'minor' | 'major' | 'milestone';
}

/** 运行时事件状态 */
export interface ActiveEvent {
  eventId: string;
  openingNarrative: string;
  choices: EventChoice[];
}
