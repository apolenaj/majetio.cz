/**
 * Properties domain — taxonomy, units, detail plugins, search filters (17.3).
 */

export {
  CANONICAL_PROPERTY_TYPES,
  PRISMA_PROPERTY_TYPES,
  PROPERTY_TYPE_ALIASES,
  isCanonicalPropertyType,
  resolveCanonicalPropertyType,
  listAliasesForMarket,
  toAnalyticsPropertyType,
  toPrismaPropertyType,
  type CanonicalPropertyType,
  type PrismaPropertyType,
  type PropertyTypeAlias,
} from "@/domains/properties/taxonomy/canonical-types";

export {
  parseLayoutToCanonical,
  formatLayoutForMarket,
  resolveCanonicalLayout,
  type LayoutNotationSystem,
  type CanonicalLayout,
  type LocalizedLayoutDisplay,
} from "@/domains/properties/taxonomy/layout";

export {
  LISTING_MARKET_CHANNELS,
  CONSTRUCTION_STATUSES,
  defaultOffPlanFramework,
  inferListingMarketChannel,
  type ListingMarketChannel,
  type OffPlanConstructionStatus,
  type OffPlanProjectFramework,
} from "@/domains/properties/taxonomy/listing-channel";

export {
  SQM_TO_SQFT,
  sqmToSqft,
  sqftToSqm,
  toCanonicalSqm,
  fromCanonicalSqm,
  roundTripCanonicalSqm,
  formatAreaValue,
  pricePerDisplayArea,
  AreaConversionError,
  type AreaUnit,
} from "@/domains/properties/units/area";

export {
  parseMarketExtensions,
  serializeMarketExtensions,
  supportsTypedExtensions,
  MarketExtensionError,
  createLocalizedPropertyText,
  pickDisplayText,
  LocalizedTextError,
  type MarketPropertyAttributes,
  type UAEPropertyAttributes,
  type SpainPropertyAttributes,
  type CzechPropertyAttributes,
  type LocalizedPropertyText,
} from "@/domains/properties/extensions";

export {
  CORE_DETAIL_SECTIONS,
  DETAIL_SECTION_EXTRAS_CATALOG,
  resolvePropertyDetailSections,
  type PropertyDetailSectionId,
  type PropertyDetailSectionPlugin,
} from "@/domains/properties/detail/section-plugins";

export {
  buildPropertyDetailNavSections,
  SECTION_ANCHOR_BY_ID,
  type PropertyDetailNavItem,
} from "@/domains/properties/detail/nav-presentation";

export {
  SHARED_SEARCH_FILTERS,
  SEARCH_FILTER_EXTRAS_CATALOG,
  resolveSearchFiltersForMarket,
  isSearchFilterEnabled,
  type SearchFilterDefinition,
  type SearchFilterControl,
} from "@/domains/properties/search/filter-registry";

export {
  PAYMENT_PLAN_PHASE_KINDS,
  expandPaymentPlanSchedule,
  assertPaymentPlanBpsNearComplete,
  createDemoOffPlanPaymentPlan,
  type PaymentPlanPhaseKind,
  type PropertyPaymentPlan,
  type PropertyPaymentPlanPhase,
  type PaymentScheduleCashEvent,
} from "@/domains/properties/payment-plan/types";

export {
  buildFinancialEnginePaymentBundle,
  type FinancialEnginePaymentContext,
  type FinancialEnginePaymentBundle,
} from "@/domains/properties/payment-plan/to-investment-input";
