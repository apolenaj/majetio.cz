export { comparisonConfig, COMPARE_MAX } from "@/config/comparison";

export type {
  ComparisonViewModel,
  ComparisonMode,
  ComparisonMetricCategoryId,
  ComparisonMetricKey,
  ComparisonWarning,
  ComparisonSummaryHighlight,
} from "./types";

export {
  COMPARISON_UNAVAILABLE,
  COMPARISON_MODE_LABELS_CS,
  COMPARISON_CATEGORY_LABELS_CS,
} from "./types";

export {
  buildComparisonViewModel,
  formatComparisonCell,
} from "./service/build-view-model";

export { applyHighlights } from "./service/highlights";
export { buildComparisonWarnings } from "./service/warnings";
export { computePassportFinancing } from "./service/passport-financing";
export { buildComparisonSummary } from "./service/summary";
export {
  COMPARISON_METRIC_REGISTRY,
  metricsForMode,
} from "./metrics/registry";

export { updateComparisonOptimistic } from "./service/optimistic-update";

export type {
  ComparisonDecisionPack,
  ComparisonPropertyDecision,
  DecisionCompletenessStatus,
  DecisionAdvice,
  StaleDiff,
  NegotiationSpaceMetrics,
  RenovationDecisionMetrics,
  FinancingDecisionMetrics,
  RiskDecisionSummary,
  PropertyNextAction,
  ScoredMetric,
} from "./decision/types";

export {
  buildComparisonDecisionPack,
  refreshComparisonDecisionPack,
} from "./decision/build-decision-pack";

export { computeNegotiationSpace } from "./decision/negotiation-space";
export { detectStaleDiffs, formatAskingPriceDiffCs } from "./decision/fingerprints";
export {
  collectDecisionGaps,
  completenessFromGaps,
} from "./decision/completeness";
export { buildDecisionAdvice, buildPropertyNextAction } from "./decision/advice";
export { loadComparisonModuleBundle } from "./decision/load-modules";

export {
  createComparisonShare,
  listComparisonShares,
  revokeComparisonShare,
  resolveSecretShare,
  resolveInvitedShare,
  buildShareSafeView,
} from "./share/share-service";

export {
  classifySecretShareAccess,
  secretShareAccessErrorCs,
} from "./share/share-access";

export {
  assertShareSafePayload,
  DEFAULT_SHARE_INCLUDE,
  SHARE_FORBIDDEN_KEYS,
  type ShareIncludeFlags,
  type ShareSafeComparisonView,
} from "./share/share-safe";
