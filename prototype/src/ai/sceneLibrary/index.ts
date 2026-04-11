// === 演出库公共 API ===

export { SceneLibraryManager } from './sceneLibraryManager';
export {
  // 类型
  OutcomeType, GoalCategory, L1Category, L2Category, TimeOfDay,
  L0Scene, L0SceneCondition, L0SceneOutcome, L0ActorContext,
  L1Scene, L1SceneCondition, L1SceneOutcome, L1MatchContext, L1MatchResult,
  L2Scene, L2SceneCondition, L2SceneOutcomeVariant, L2RegionStats, L2MatchResult,
  NearbyNpcInfo, SceneDecisionResult,
} from './types';
export { resolveScene } from './resolver';
export { formatNarrative, PROFESSION_DISPLAY, shichenDesc, gridDisplayName } from './narrativeFormatter';
export { matchL0Scene, matchL1Scene, matchL2Scenes } from './matcher';
// 兼容旧导入
export { resolveScene as resolveSceneOld } from './resolver';
export { formatNarrative as formatNarrativeOld } from './narrativeFormatter';
