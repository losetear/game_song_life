// === 抱负系统 (Aspiration System) — 参考 Sims 终身抱负 ===
//
// 4种抱负对行为提供持续加成，NPC模板中按职业倾向分配。

import { AspirationType } from '../ecs/types';

// ──── 抱负对行动类别的加成系数 ────
export const ASPIRATION_CATEGORY_BIAS: Record<AspirationType, Record<string, number>> = {
  wealth: {
    work: 0.3,
    faction: 0.2,
    social: 0.0,
    leisure: -0.1,
    survival: 0.0,
    family: 0.0,
    move: 0.0,
  },
  knowledge: {
    work: 0.1,
    leisure: 0.3,
    social: 0.0,
    faction: 0.0,
    survival: 0.0,
    family: 0.0,
    move: -0.1,
  },
  social: {
    social: 0.4,
    leisure: 0.2,
    work: -0.1,
    faction: 0.1,
    survival: 0.0,
    family: 0.2,
    move: 0.0,
  },
  family: {
    family: 0.4,
    social: 0.2,
    work: -0.1,
    leisure: 0.1,
    survival: 0.0,
    faction: 0.0,
    move: 0.1,
  },
};

// ──── 职业默认抱负映射 ────
export const PROFESSION_ASPIRATION: Record<string, AspirationType> = {
  merchant: 'wealth',
  farmer: 'family',
  guard: 'knowledge',
  doctor: 'knowledge',
  hunter: 'wealth',
  rogue: 'wealth',
  laborer: 'wealth',
  blacksmith: 'knowledge',
  teacher: 'knowledge',
  chef: 'family',
};

/** 获取职业的默认抱负 */
export function getDefaultAspiration(profession: string): AspirationType {
  return PROFESSION_ASPIRATION[profession] || 'wealth';
}
