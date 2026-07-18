export { computeDedupeScore, orderedPropertyPairIds, DEDUPE_WEIGHTS, DEDUPE_REVIEW_THRESHOLD } from "./dedupe-score";
export type { DedupePropertySnapshot, DedupeScoreResult } from "./dedupe-score";

export {
  planNonDestructiveMerge,
  shouldApplyIncomingField,
  mapSourceTypeToTrust,
} from "./merge-strategy";
export type { FieldCandidate, MergePlan, SourceTrustTier } from "./merge-strategy";

export { detectDataQualityIssues } from "./data-quality";
export type { DetectedQualityIssue, QualityPropertySnapshot } from "./data-quality";

export { computeCompletenessScore } from "./completeness";
export type { CompletenessResult, CompletenessPropertySnapshot } from "./completeness";

export { applyOverridesToIncomingFields, resolveFieldValue } from "./field-overrides";
export type { FieldOverrideRecord, IncomingFieldUpdate } from "./field-overrides";
