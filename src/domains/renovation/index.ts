/**
 * Renovation domain public barrel (Prompt 1/5 — scaffold only).
 */

export { RENOVATION_ENGINE_VERSION } from "./version";

export {
  RENOVATION_ANALYSIS_TYPES,
  RENOVATION_ANALYSIS_STATUSES,
  type RenovationAnalysis,
  type RenovationAnalysisType,
  type RenovationAnalysisStatus,
  type RenovationAnalysisCreateInput,
  type RenovationAnalysisUpdateInput,
} from "./types";

export {
  createRenovationAnalysisService,
  type RenovationAnalysisService,
  type RenovationAnalysisRepository,
} from "./service";

export { renovationEngine } from "./engine";

export {
  assessCondition,
  createConditionService,
  CONDITION_MODEL_VERSION,
  type RenovationConditionAssessment,
  type ConditionPropertyInput,
} from "./condition";

export {
  inferScopeFromCondition,
  applyUserScopeOverrides,
  createScopeService,
  SCOPE_MODEL_VERSION,
  type RenovationScope,
  type RenovationItem,
  type RenovationStandard,
} from "./scope";

export {
  estimateRenovationCosts,
  createCostsService,
  COST_MODEL_VERSION,
  type RenovationCostEstimate,
  type CostConfidenceLevel,
} from "./costs";

export {
  calculateContingency,
  createContingencyService,
  type ContingencyResult,
} from "./contingency";

export {
  estimateRenovationTimeline,
  createTimelineService,
  type RenovationTimelineEstimate,
} from "./timeline";

export {
  estimateHoldingCosts,
  type HoldingCostBreakdown,
} from "./holding";

export {
  estimateArv,
  computeRenovationOutcome,
  createArvService,
  type ArvEstimate,
  type RenovationEconomics,
  type PostRenovationPropertyScenario,
} from "./arv";

export {
  analyzeRenovation,
  analyzeFlipAndMaxOffer,
  type RenovationEngineAnalyzeInput,
  type RenovationEngineResult,
  type FlipAndOfferInput,
  type FlipAndOfferResult,
} from "./engine";

export {
  calculateRenovationFlip,
  breakEvenSalePrice,
  type RenovationFlipResult,
} from "./flip";

export {
  calculateMaximumOffer,
  createOfferService,
  compareAskingToMaxOffer,
  type MaxOfferResult,
  type AskingPriceComparison,
} from "./offer";
