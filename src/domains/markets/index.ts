/**
 * Markets domain — Majetio Core international foundation (Prompt 17.1).
 *
 * Architecture:
 *   Core (shared) ← MarketRegistry ← MarketPlugin (per market folder)
 * New market = new plugins/{code}/ + registration in plugins/index.ts
 */

export type {
  LaunchStatus,
  CapabilityStatus,
  MeasurementSystem,
  MarketCapabilityKey,
  MarketDefinition,
  MarketRegionDefinition,
  MarketPublicSurface,
  MarketCode,
  CountryCode,
  LocaleCode,
  MarketCodeLiteral,
} from "./types";

export {
  LAUNCH_STATUSES,
  CAPABILITY_STATUSES,
  MEASUREMENT_SYSTEMS,
  MARKET_CAPABILITY_KEYS,
  PUBLIC_LAUNCH_STATUSES,
  MARKET_CODES,
  HOME_MARKET_CODE,
  isMarketCode,
  toMarketCode,
  tryMarketCode,
  isCountryCode,
  toCountryCode,
  tryCountryCode,
  isLocaleCode,
  toLocaleCode,
  tryLocaleCode,
  marketCodeFromCurrency,
  resolveExplicitMarketCode,
  MARKET_DEFAULT_COUNTRY,
  MARKET_DEFAULT_CURRENCY,
} from "./types";

export type {
  MarketPlugin,
  PropertyMarketConfig,
  TransactionCostConfig,
  FinancingMarketConfig,
  TaxationMarketConfig,
  RegulatoryMarketConfig,
} from "./plugins/types";

export {
  emptyCapabilities,
} from "./plugins/types";

export {
  MARKET_PLUGINS,
  getMarketPlugin,
  listMarketPlugins,
} from "./plugins";

export {
  MarketRegistry,
  marketRegistry,
  isMarketPubliclyActive,
  reasonMarketNotPubliclyActive,
  type MarketRegistryEntry,
} from "./registry/market-registry";

export {
  buildCapabilityMatrix,
  getMarketCapability,
  marketFeatureFlagKey,
  isMarketFeatureEnabled,
  isMarketValuationEnabled,
  getMarketFeatureFlagSnapshot,
  type CapabilityMatrix,
  type CapabilityMatrixRow,
} from "./capabilities/matrix";

export {
  toUiCapabilityState,
  capabilityUnavailableMessage,
  UI_CAPABILITY_STATES,
  type UiCapabilityState,
} from "./capabilities/ui-state";

export {
  getMarketKillSwitch,
  setMarketKillSwitch,
  applyKillSwitch,
  resetMarketKillSwitches,
  listMarketKillSwitches,
  isNewListingsPaused,
  isValuationPaused,
  isLeadRoutingPaused,
  isMarketReviewRequired,
  type MarketKillSwitchState,
  type KillSwitchTarget,
} from "./capabilities/kill-switch";

export {
  resolveEffectiveCapability,
  isCapabilityUiAvailable,
  isEffectiveValuationEnabled,
  isEffectiveLeadRoutingEnabled,
  isEffectiveNewListingEnabled,
  type EffectiveCapability,
} from "./capabilities/effective";

export {
  evaluateStaleRegulationForMarket,
  evaluateStaleRegulationAllMarkets,
  DEFAULT_REGULATION_MAX_AGE_MS,
  type StaleRegulationScanResult,
} from "./capabilities/stale-regulation";

export {
  CONFIG_REVIEW_STATUSES,
  assertConfigEditable,
  transitionConfigStatus,
  isProductionConfigStatus,
  ConfigReviewError,
  type ConfigReviewStatus,
  type ConfigReviewRecord,
} from "./capabilities/config-review";

export {
  buildAdminMarketsDashboard,
  type AdminMarketsDashboard,
  type AdminMarketRow,
} from "./service/admin-dashboard";

export {
  MARKET_DATA_SOURCE_REGISTRY,
  listMarketDataSources,
  getMarketDataSource,
  marketHasMinimumSeoDataCoverage,
  type MarketDataSource,
} from "./data-sources/registry";

export {
  MARKET_LAUNCH_READINESS_STATUSES,
  evaluateMarketLaunchReadiness,
  evaluateAllMarketLaunchReadiness,
  assertMarketCanGoLive,
  assertCanSetLaunchStatus,
  canMarketGoLive,
  MarketLaunchBlockedError,
  type MarketLaunchReadiness,
  type MarketLaunchReadinessStatus,
  type MarketReadinessCheck,
} from "./launch-readiness";
