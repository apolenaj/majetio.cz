/**
 * B2C Entitlements domain — feature gates, usage metering, lifecycle grants.
 */

export {
  assertFeatureAccess,
  grantDeepAnalysis,
  grantBuyerPass,
  grantInvestorPro,
  transitionInvestorProLifecycle,
  nextInvestorProState,
  syncExpiredEntitlements,
  consumeBuyerPassDeepAnalysis,
  getFreeTierSummary,
  majetioFreeConfig,
  deepAnalysisConfig,
  buyerPassConfig,
  investorProConfig,
  entitlementsB2cConfig,
  type FeatureAccessResult,
} from "./service";

export {
  recordUsage,
  getUsageQuantity,
  usageDayKey,
  usageWeekKey,
} from "./usage";

export {
  assertOrderEligibleForEntitlementGrant,
  mapProductKeyToGrantRoute,
  isB2bSubscriptionProductKey,
  isProfessionalReviewProductKey,
  type GrantRouteKind,
} from "./grant-guard";

export {
  grantManualEntitlement,
  listManualEntitlementsForUser,
  revokeManualEntitlement,
} from "./manual";

export {
  ENTITLEMENT_FEATURES,
  isEntitlementFeature,
  type EntitlementFeature,
} from "@/config/entitlements-b2c";

export {
  parseMarketScope,
  marketScopeAllows,
  assertEntitlementMarketScope,
  entitlementCoversMarket,
  EntitlementMarketScopeError,
  type MarketScope,
} from "./market-scope";
