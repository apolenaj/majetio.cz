export {
  intentFromScenarioType,
  intentFromStrategy,
  parseCalculationIntent,
  type StrategyIntentInput,
} from "./intent";

export {
  allWarningMessages,
  mergeResultWarnings,
  resultWarningsFromIrr,
} from "./warning-helpers";

export {
  assumptionSetSchema,
  parseAssumptionSet,
  safeParseAssumptionSet,
  type AssumptionSet,
} from "./assumptions";

export {
  canonicalizeForHash,
  hashCalculationInput,
  stableSnapshotForHash,
  type CalculationHashInput,
} from "./hash";

export {
  buildPropertyInvestmentSnapshot,
  type PropertyInvestmentSnapshot,
  type PropertySourceForSnapshot,
} from "./property-snapshot";

export {
  mergeSnapshotWithAssumptions,
} from "./merge-input";

export {
  executeEngineCalculation,
  runInvestmentCalculationPure,
} from "./run-calculation";

export {
  createInvestmentCalculationService,
  type InvestmentCalculationService,
  type InvestmentCalculationRepository,
  type CachedCalculationRecord,
  type AnalysisScenarioWriteInput,
  type InvestmentCalculationWriteInput,
} from "./investment-calculation-service";

export { createPrismaInvestmentCalculationRepository } from "./prisma-repository";

export {
  ANALYSIS_SCENARIO_TYPES,
  ANALYSIS_SCENARIO_STATUSES,
  orchestratedCalculationResultSchema,
  splitMetrics,
  type AnalysisScenarioTypeCode,
  type AnalysisScenarioStatusCode,
  type OrchestratedCalculationResult,
  type PersistedScenarioRecord,
  type RunCalculationRequest,
  type MergedEngineInput,
  type CalculationIssue,
  type ResultWarning,
  type CalculationMetric,
  calculationIssueSchema,
  resultWarningSchema,
} from "./types";
