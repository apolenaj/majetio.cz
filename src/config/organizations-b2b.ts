/**
 * B2B SaaS config for real-estate professionals.
 * Limits are mirrored on PricingPlan.limits — config is the product contract.
 */

export const B2B_PLAN_KEYS = [
  "agent_free",
  "agent_pro",
  "agency_growth",
  "developer_standard",
] as const;

export type B2bPlanKey = (typeof B2B_PLAN_KEYS)[number];

export function isB2bPlanKey(value: string): value is B2bPlanKey {
  return (B2B_PLAN_KEYS as readonly string[]).includes(value);
}

export type B2bPlanLimits = {
  maxActiveListings: number;
  seats: number;
  projectsMax?: number;
};

/** Agent Free — real value, capped at 5 active offers (no fake empty tier). */
export const agentFreePlan = {
  planKey: "agent_free" as const,
  nameCs: "Agent Free",
  organizationTypes: ["REAL_ESTATE_AGENT"] as const,
  limits: {
    maxActiveListings: 5,
    seats: 1,
  } satisfies B2bPlanLimits,
  features: ["LISTING_BASIC", "LEAD_INBOX"] as const,
};

export const agentProPlan = {
  planKey: "agent_pro" as const,
  nameCs: "Agent Pro",
  organizationTypes: ["REAL_ESTATE_AGENT"] as const,
  limits: {
    maxActiveListings: 40,
    seats: 1,
  } satisfies B2bPlanLimits,
  features: [
    "LISTING_BASIC",
    "LISTING_PROMO",
    "LEAD_INBOX",
    "IDENTITY_BADGE",
  ] as const,
};

export const agencyGrowthPlan = {
  planKey: "agency_growth" as const,
  nameCs: "Agency Growth",
  organizationTypes: ["AGENCY"] as const,
  limits: {
    maxActiveListings: 200,
    seats: 15,
  } satisfies B2bPlanLimits,
  features: [
    "LISTING_BASIC",
    "LISTING_PROMO",
    "LEAD_INBOX",
    "ORG_BADGE",
    "TEAM_ROLES",
  ] as const,
};

export const developerStandardPlan = {
  planKey: "developer_standard" as const,
  nameCs: "Developer Standard",
  organizationTypes: ["DEVELOPER"] as const,
  limits: {
    maxActiveListings: 500,
    seats: 25,
    projectsMax: 20,
  } satisfies B2bPlanLimits,
  features: [
    "LISTING_BASIC",
    "LISTING_PROMO",
    "LEAD_INBOX",
    "ORG_BADGE",
    "PROJECT_UNITS",
  ] as const,
};

export const b2bPlansConfig = {
  agent_free: agentFreePlan,
  agent_pro: agentProPlan,
  agency_growth: agencyGrowthPlan,
  developer_standard: developerStandardPlan,
} as const;

/** Statuses that consume listing quota (live / sellable inventory). */
export const QUOTA_CONSUMING_PROPERTY_STATUSES = [
  "ACTIVE",
  "RESERVED",
] as const;

export const OVER_LIMIT_CTA = {
  code: "UPGRADE_OR_ARCHIVE" as const,
  titleCs: "Nabídka je nad limitem tarifu",
  bodyCs:
    "Po snížení tarifu jsme nabídku neodstranili. Upgradujte plán, archivujte jinou nabídku, nebo tuto nabídku stáhněte.",
  actions: ["upgrade_plan", "archive_other", "withdraw_listing"] as const,
};

export function defaultPlanKeyForOrgType(
  type: "REAL_ESTATE_AGENT" | "AGENCY" | "DEVELOPER" | "PARTNER",
): B2bPlanKey {
  switch (type) {
    case "AGENCY":
      return "agency_growth";
    case "DEVELOPER":
      return "developer_standard";
    case "PARTNER":
    case "REAL_ESTATE_AGENT":
    default:
      return "agent_free";
  }
}

export function listingOwnerKindForOrgType(
  type: "REAL_ESTATE_AGENT" | "AGENCY" | "DEVELOPER" | "PARTNER",
): "AGENT" | "AGENCY" | "DEVELOPER" | "PARTNER" {
  switch (type) {
    case "AGENCY":
      return "AGENCY";
    case "DEVELOPER":
      return "DEVELOPER";
    case "PARTNER":
      return "PARTNER";
    default:
      return "AGENT";
  }
}
