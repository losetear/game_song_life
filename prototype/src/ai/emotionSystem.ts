// === 情绪系统 (Emotion System) — 参考 Sims 4 ===
//
// 情绪由需求水平聚合计算，每个 tick 重新计算。
// 情绪对行动类别提供加成/减成。

import { NeedsComponent, EmotionType, EmotionComponent } from '../ecs/types';

// ──── 情绪对行动类别的加成系数 ────
// 正值=加成，负值=减成
export const EMOTION_CATEGORY_BIAS: Record<EmotionType, Record<string, number>> = {
  happy:         { social: 0.5, leisure: 0.3, work: 0.1, family: 0.3, survival: 0.0, move: 0.0, faction: 0.1 },
  sad:           { social: -0.2, leisure: -0.1, work: -0.1, family: 0.3, survival: 0.0, move: 0.0, faction: -0.1 },
  angry:         { social: -0.3, leisure: -0.2, work: -0.3, family: -0.2, survival: 0.1, move: 0.1, faction: 0.2 },
  tense:         { social: -0.2, leisure: -0.1, work: -0.1, family: -0.1, survival: 0.3, move: 0.2, faction: 0.0 },
  uncomfortable: { social: -0.3, leisure: -0.2, work: -0.2, family: -0.1, survival: 0.4, move: -0.1, faction: -0.2 },
  energized:     { social: 0.2, leisure: 0.1, work: 0.3, family: 0.1, survival: 0.0, move: 0.2, faction: 0.2 },
  focused:       { social: -0.1, leisure: -0.1, work: 0.4, family: 0.0, survival: 0.0, move: -0.1, faction: 0.1 },
  social:        { social: 0.5, leisure: 0.2, work: -0.1, family: 0.3, survival: 0.0, move: 0.1, faction: 0.2 },
  bored:         { social: 0.2, leisure: 0.4, work: -0.2, family: 0.1, survival: -0.1, move: 0.3, faction: -0.1 },
};

export interface EmotionCalcInput {
  needs: NeedsComponent;
  personality: string[];
  recentWorkActions: number;  // 近3回合中工作类行动数
}

/** 根据需求/性格/近期行为计算当前情绪 */
export function calculateEmotion(input: EmotionCalcInput): { type: EmotionType; intensity: number } {
  const { needs, personality, recentWorkActions } = input;
  const candidates: { type: EmotionType; priority: number }[] = [];

  // 不舒服：hunger<30 或 health<40
  if (needs.hunger < 30 || needs.health < 40) {
    const intensity = Math.max(
      needs.hunger < 30 ? (30 - needs.hunger) / 30 : 0,
      needs.health < 40 ? (40 - needs.health) / 40 : 0,
    );
    candidates.push({ type: 'uncomfortable', priority: 8 + intensity * 5 });
  }

  // 紧张：safety<40 或 任何需求<30
  const anyLow = [needs.hunger, needs.fatigue, needs.health, needs.mood, needs.safety, needs.social]
    .some(v => v < 30);
  if (needs.safety < 40 || anyLow) {
    const intensity = Math.max(
      needs.safety < 40 ? (40 - needs.safety) / 40 : 0,
      anyLow ? 0.5 : 0,
    );
    candidates.push({ type: 'tense', priority: 7 + intensity * 4 });
  }

  // 悲伤：mood<25 且 social<30
  if (needs.mood < 25 && needs.social < 30) {
    const intensity = ((25 - needs.mood) / 25 + (30 - needs.social) / 30) / 2;
    candidates.push({ type: 'sad', priority: 7 + intensity * 4 });
  }

  // 愤怒：mood<20 且 性格含暴躁
  if (needs.mood < 20 && personality.includes('暴躁')) {
    const intensity = (20 - needs.mood) / 20;
    candidates.push({ type: 'angry', priority: 9 + intensity * 5 });
  }

  // 精神焕发：fatigue>80 且 mood>60
  if (needs.fatigue > 80 && needs.mood > 60) {
    const intensity = ((needs.fatigue - 80) / 20 + (needs.mood - 60) / 40) / 2;
    candidates.push({ type: 'energized', priority: 4 + intensity * 3 });
  }

  // 社交：social<40 且 mood>50
  if (needs.social < 40 && needs.mood > 50) {
    const intensity = (40 - needs.social) / 40;
    candidates.push({ type: 'social', priority: 4 + intensity * 3 });
  }

  // 专注：mood>60 且 近期在工作类行动
  if (needs.mood > 60 && recentWorkActions >= 2) {
    const intensity = (needs.mood - 60) / 40;
    candidates.push({ type: 'focused', priority: 3 + intensity * 3 });
  }

  // 快乐：mood>70 且 没有极低需求
  const noCritical = [needs.hunger, needs.fatigue, needs.health, needs.safety].every(v => v > 30);
  if (needs.mood > 70 && noCritical) {
    const intensity = (needs.mood - 70) / 30;
    candidates.push({ type: 'happy', priority: 2 + intensity * 3 });
  }

  // 烦躁：所有需求>60（什么都不缺）
  const allHigh = [needs.hunger, needs.fatigue, needs.health, needs.mood, needs.safety, needs.social]
    .every(v => v > 60);
  if (allHigh) {
    candidates.push({ type: 'bored', priority: 1 });
  }

  // 按优先级排序，选最高
  candidates.sort((a, b) => b.priority - a.priority);

  if (candidates.length === 0) {
    // 默认：快乐
    return { type: 'happy', intensity: 20 };
  }

  const best = candidates[0];
  return { type: best.type, intensity: Math.min(100, best.priority * 10) };
}

/** 更新情绪组件 */
export function updateEmotionComponent(
  emotion: EmotionComponent,
  input: EmotionCalcInput,
): void {
  const result = calculateEmotion(input);
  if (result.type !== emotion.current) {
    emotion.current = result.type;
    emotion.ticksInEmotion = 0;
  } else {
    emotion.ticksInEmotion++;
  }
  emotion.intensity = result.intensity;
}
