export type {
  IngestionStage,
  IngestionPipelineResult,
  RateAnomaly,
  NormalizedOfferDraft,
  ExistingStoredOffer,
} from "./types";

export { validateExternalOffers } from "./validate";
export { normalizeExternalOffers, offerDedupeKey } from "./normalize";
export { deduplicateOffers } from "./deduplicate";
export { compareWithStored } from "./compare";
export {
  detectRateAnomalies,
  applyAnomalyStatus,
  RATE_JUMP_THRESHOLD_PP,
} from "./anomaly";
export {
  resolveMortgageFreshness,
  dataTierForFetch,
} from "./freshness";
export {
  runRateIngestionPipeline,
  type MortgageOfferStore,
} from "./ingest";
