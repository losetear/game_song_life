// === 演出库公共 API ===

export { SceneLibraryManager } from './sceneLibraryManager';
export {
  // 类型
  OutcomeType, GoalCategory, L1Category, L2Category, TimeOfDay,
  L0Scene, L0SceneCondition, L0SceneOutcome, L0ActorContext,
  L1Scene, L1SceneCondition, L1SceneOutcome, L1MatchContext, L1MatchResult,
  L2Scene, L2SceneCondition, L2SceneOutcomeVariant, L2RegionStats, L2MatchResult,
  NearbyNpcInfo, SceneDecisionResult,
  // 漫野奇谭化新增
  SceneResolution, TieredOutcome, OutcomeTier,
  PlayerScene, PlayerSceneStep, PlayerSceneChoice, PlayerSceneConsequence,
  PlayerSceneParticipant, PlayerSceneState, PlayerSceneMatchResult,
  PlayerChoiceCondition,
  // 多步演出新增
  L0SceneChoice, L0SceneConsequence, L0ScenePhase, L0PhaseScene, L0SceneRuntimeState,
} from './types';
export { resolveScene, resolveSceneV2, selectTieredOutcome } from './resolver';
export type { ResolveContext, ResolveResult } from './resolver';
export { formatNarrative, PROFESSION_DISPLAY, shichenDesc, gridDisplayName } from './narrativeFormatter';
export { matchL0Scene, matchL1Scene, matchL2Scenes } from './matcher';
export { ActiveSceneManager } from './activeSceneManager';
export { chooseBestForNPC } from './npcChoiceAI';
export type { NPCChoiceContext } from './npcChoiceAI';
// 兼容旧导入
export { resolveScene as resolveSceneOld } from './resolver';
export { formatNarrative as formatNarrativeOld } from './narrativeFormatter';
