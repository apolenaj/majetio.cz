export {
  propertySearchInputSchema,
  SEARCH_SORT_PRESETS,
  SEARCH_PROPERTY_TYPES,
  SEARCH_CONDITIONS,
  SEARCH_OWNERSHIP_TYPES,
} from "../../schemas/search";
export type { PropertySearchInput, SearchSortPreset } from "../../schemas/search";

export { normalizeSearchFilters, buildSearchWhere } from "./filters";
export type { NormalizedSearchFilters, FilterNormalizeResult } from "./filters";

export { resolveSearchSort, toPrismaOrderBy } from "./sorts";

export { createPropertySearchService } from "./property-search-service";
export type {
  PropertySearchService,
  PropertySearchRepository,
} from "./property-search-service";

export type { PropertySearchHitDto, PropertySearchPageDto } from "./search-dto";
export { toSearchHitDto } from "./search-dto";

export { searchDiscovery } from "./discovery-search";
