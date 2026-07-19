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

export {
  toPublicPropertyDto,
  toPublicPropertyListItemDto,
} from "./dto";
export type {
  PropertyRecord,
  PublicPropertyDto,
  PublicPropertyListItemDto,
  ToPublicDtoOptions,
  PublicPriceHistoryPoint,
  PublicFieldConflict,
} from "./dto";

export {
  resolvePagination,
  resolvePropertySort,
  encodeCursor,
  decodeCursor,
  PROPERTY_SORT_FIELDS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./pagination";
export type { PaginationInput, PropertySort, ResolvedPagination } from "./pagination";

export { createPropertySearchProvider } from "./search-provider";
export type {
  PropertySearchFilters,
  PropertySearchProvider,
  PropertySearchQuery,
} from "./search-provider";

export {
  createPropertySearchService,
  normalizeSearchFilters,
  buildSearchWhere,
  resolveSearchSort,
  toPrismaOrderBy,
  propertySearchInputSchema,
  SEARCH_SORT_PRESETS,
} from "./search";
export type {
  PropertySearchService,
  PropertySearchRepository,
  PropertySearchInput,
  PropertySearchPageDto,
  PropertySearchHitDto,
  NormalizedSearchFilters,
  SearchSortPreset,
} from "./search";

export {
  computePropertyMatchScore,
  isMatchProfileComplete,
  sortByMatchScore,
} from "./match-score";
export type {
  MatchListing,
  MatchProfile,
  MatchReason,
  PropertyMatchScore,
} from "./match-score";
export { passportToMatchProfile, listingToMatchInput } from "./match-profile";

export { createPropertyService } from "./property-service";
export type { PropertyService, PropertyRepository } from "./property-service";

export { canViewProperty, resolveViewerRole } from "./authorization";
export type { PropertyViewer } from "./authorization";

export {
  loadPropertyDetailBySlug,
  buildPropertyDetailBreadcrumbs,
  propertyListingStatusTone,
} from "./detail-loader";

export { canDisplayMediaUrl, toPublicMediaList } from "./media-public";
export type { PublicMediaItem } from "./media-public";

export { formatAreaConflict, formatNumericRangeConflict } from "./field-conflicts";
export { mapPublicDtoToPropertyCard } from "./card-mapper";

export {
  buildPropertyDetailMetadata,
  buildPropertyDetailJsonLd,
  isPropertyDetailIndexable,
} from "./detail-seo";
export { resolveDaysOnMarket, daysBetweenIso } from "./market-timing";
export { derivePriceDecrease } from "./price-change";
