/**
 * B2B Organizations domain — agents, agencies, developers, plan quotas.
 */

export {
  createOrganization,
  addOrganizationMember,
  setOrganizationVerification,
  attachPropertyToOrganization,
  assertCanPublishListing,
  changeOrganizationPlan,
  countOverLimitListings,
} from "./service";

export {
  organizationCoversMarket,
  assertOrganizationCoversMarket,
  normalizeMarketCoverage,
  serviceTypeForOrganizationType,
  parseOrganizationServiceType,
  OrganizationMarketCoverageError,
  ORGANIZATION_SERVICE_TYPES,
  type OrganizationServiceType,
} from "./market-coverage";

export {
  reconcileListingQuota,
  resolveB2bPlanLimits,
  comparePlanTier,
  type QuotaListing,
  type QuotaReconcileResult,
} from "./quota";

export {
  assertOrganizationAccess,
  getOrganizationForActor,
  buildPropertyTenantWhere,
  type OrgAccessActor,
  type OrganizationAccess,
} from "./tenant";

export {
  startBrokerOnboarding,
  updateBrokerProfile,
  completeBrokerOnboarding,
  getBrokerProfile,
  setOrganizationVerificationByAdmin,
  resolveVerificationBadge,
  VERIFICATION_BADGE_COPY_CS,
} from "./broker-onboarding";

export { getAgencyDashboard } from "./agency-dashboard";

export {
  b2bPlansConfig,
  agentFreePlan,
  agentProPlan,
  agencyGrowthPlan,
  developerStandardPlan,
  OVER_LIMIT_CTA,
  QUOTA_CONSUMING_PROPERTY_STATUSES,
  isB2bPlanKey,
  defaultPlanKeyForOrgType,
  listingOwnerKindForOrgType,
  type B2bPlanKey,
  type B2bPlanLimits,
} from "@/config/organizations-b2b";
