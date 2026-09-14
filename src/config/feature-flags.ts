/**
 * Product feature flags — Phase 1 monetization (checklist 165 / 166)
 * + Phase 7 legal gates (213–215).
 * Defaults match bod 166: conservative OFF for legal/risk products.
 */

export type FeatureFlagKey =
  | "TRANSACTION_SUCCESS_FEE_ENABLED"
  | "INVESTOR_PRO_ENABLED"
  | "LISTING_BOOST_ENABLED"
  | "B2B_AGENT_PLANS_ENABLED"
  | "B2B_AGENCY_PLANS_ENABLED"
  | "B2B_DEVELOPER_PLANS_ENABLED"
  | "EXPERT_REVIEW_ENABLED"
  | "INVESTMENT_AUDIT_ENABLED"
  | "PARTNER_MARKETPLACE_ENABLED"
  /** LEGAL_REVIEW 213 — consumer withdrawal UX for digital content. */
  | "CONSUMER_WITHDRAWAL_ENABLED"
  /** LEGAL_REVIEW 215 — automated tax invoice / fiscal document generation. */
  | "AUTOMATED_INVOICE_ENABLED";

/**
 * Bod 166 / 213–215 — default rollout state.
 * Disputed legal/accounting features stay OFF until review.
 */
export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  TRANSACTION_SUCCESS_FEE_ENABLED: false,
  INVESTOR_PRO_ENABLED: true,
  LISTING_BOOST_ENABLED: true,
  B2B_AGENT_PLANS_ENABLED: true,
  B2B_AGENCY_PLANS_ENABLED: true,
  B2B_DEVELOPER_PLANS_ENABLED: true,
  EXPERT_REVIEW_ENABLED: true,
  INVESTMENT_AUDIT_ENABLED: true,
  PARTNER_MARKETPLACE_ENABLED: false,
  CONSUMER_WITHDRAWAL_ENABLED: false,
  AUTOMATED_INVOICE_ENABLED: false,
};

function envFlag(name: FeatureFlagKey, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true";
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return envFlag(key, FEATURE_FLAG_DEFAULTS[key]);
}

export function getFeatureFlagSnapshot(): Record<FeatureFlagKey, boolean> {
  const out = {} as Record<FeatureFlagKey, boolean>;
  for (const key of Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlagKey[]) {
    out[key] = isFeatureEnabled(key);
  }
  return out;
}

/** Purchase Concierge / transaction success-fee agency. */
export function isTransactionSuccessFeeEnabled(): boolean {
  return isFeatureEnabled("TRANSACTION_SUCCESS_FEE_ENABLED");
}

export function isPurchaseConciergeEnabled(): boolean {
  return isTransactionSuccessFeeEnabled();
}

export const PURCHASE_CONCIERGE_DISABLED_COPY_CS = {
  title: "Purchase Concierge zatím není dostupný",
  body:
    "Služba zastoupení při koupi a success-fee model budou spuštěny až po právním rámci. Majetio aktuálně nenabízí realitní zastoupení.",
  forbiddenClaims: [
    "zastoupíme vás při koupi",
    "jsme váš realitní zástupce",
    "zajistíme převod vlastnictví jako agent",
    "provize z úspěšné transakce",
  ],
} as const;

export function getPurchaseConciergePublicSurface(): null | {
  enabled: true;
  labelCs: string;
} {
  if (!isPurchaseConciergeEnabled()) return null;
  return { enabled: true, labelCs: "Purchase Concierge" };
}

export function assertPurchaseConciergeEnabled():
  | { ok: true }
  | { ok: false; error: string; code: "feature_disabled" } {
  if (!isPurchaseConciergeEnabled()) {
    return {
      ok: false,
      error: PURCHASE_CONCIERGE_DISABLED_COPY_CS.body,
      code: "feature_disabled",
    };
  }
  return { ok: true };
}

export function scrubConciergePromises(copy: string): string {
  if (isPurchaseConciergeEnabled()) return copy;
  let out = copy;
  for (const claim of PURCHASE_CONCIERGE_DISABLED_COPY_CS.forbiddenClaims) {
    const re = new RegExp(claim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, "[nedostupné]");
  }
  return out;
}
