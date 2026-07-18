export type { PropertySourceAdapter, PropertySourceAdapterContext } from "./adapter";
export { runAdapter, collectAdapterErrors } from "./adapter";
export { GenericJsonPropertySourceAdapter } from "./generic-json-adapter";
export {
  normalizeCurrency,
  areaToSquareMeters,
  coerceNumber,
  slugifyTitle,
  buildCanonicalKey,
} from "./normalize";
export { sanitizeText, sanitizeListingDraft } from "./sanitize";
export {
  hashPayload,
  buildItemIdempotencyKey,
  buildJobIdempotencyKey,
} from "./idempotency";
export {
  emptyImportCounters,
  applyItemOutcome,
  finalizeImportJobStatus,
  appendImportError,
} from "./import-job";
export type { ImportJobCounters, ImportJobErrorEntry, ImportJobSnapshot } from "./import-job";
export { runIngestPipeline, markIdempotentSkip } from "./pipeline";
export type { PipelineResult, CanonicalUpdatePlan, RunPipelineInput } from "./pipeline";
