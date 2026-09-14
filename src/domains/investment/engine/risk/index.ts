/**
 * Risk & sensitivity façade — stability evaluation for investments (pure).
 */

export {
  evaluateYear1Metrics,
  shiftNominalRateByPercentagePoints,
  type RiskBaseCase,
  type Year1OperatingMetrics,
} from "./base-case";

export {
  DEFAULT_CANONICAL_SPREADS,
  deriveCanonicalScenarios,
  type CanonicalSpreads,
  type CanonicalScenarioLabel,
  type CanonicalTripletResult,
} from "./canonical";

export {
  runOneWaySensitivity,
  runTwoWaySensitivity,
  type SensitivityFactor,
  type SensitivityMetricKey,
  type OneWaySensitivityResult,
  type TwoWaySensitivityResult,
  type OneWaySensitivityStep,
  type TwoWaySensitivityCell,
} from "./sensitivity";

export {
  calculateBreakEvenOccupancy,
  calculateBreakEvenInterestRate,
  calculateBreakEvenPurchasePrice,
  type BreakEvenOccupancyResult,
  type BreakEvenInterestResult,
  type BreakEvenPurchasePriceResult,
} from "./break-even";

export {
  STRESS_SHOCK_IDS,
  runStressTests,
  type StressShockId,
  type StressShockResult,
  type StressTestSuiteResult,
} from "./stress";

export {
  RISK_FLAG_CODES,
  DEFAULT_RISK_THRESHOLDS,
  evaluateRiskFlags,
  type RiskFlagCode,
  type RiskFlag,
  type RiskFlagSeverity,
  type RiskFlagsResult,
  type RiskFlagThresholds,
} from "./flags";

export {
  INPUT_PROVENANCE_KINDS,
  PROVENANCE_QUALITY,
  calculateConfidenceScore,
  type InputProvenanceKind,
  type InputFieldProvenance,
  type ConfidenceScoreResult,
} from "./confidence";

/**
 * Location Intelligence facts → annotate Risk Engine consumers.
 * Does not alter cash-flow math; use alongside evaluateRiskFlags.
 */
export {
  buildLocationRiskFacts,
  locationFactsForRiskEngine,
  LOCATION_RISK_FACT_CODES,
  type LocationRiskFact,
  type LocationRiskFactCode,
} from "@/domains/locations/integration/location-risk-facts";
