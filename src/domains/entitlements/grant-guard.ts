/**
 * Paid entitlement grant guard (checklist 177–179).
 * Paid products: grant ONLY after Order.status = PAID (set by payment webhook).
 * Free (gross = 0): allowed without PSP webhook.
 */

export type OrderGrantEligibility = {
  status: string;
  amountGrossMinor: number;
};

export function assertOrderEligibleForEntitlementGrant(
  order: OrderGrantEligibility,
): { ok: true; source: "PAID_ORDER" | "FREE_CHECKOUT" } | { ok: false; error: string } {
  if (order.amountGrossMinor <= 0) {
    return { ok: true, source: "FREE_CHECKOUT" };
  }
  if (order.status !== "PAID") {
    return {
      ok: false,
      error:
        "Entitlement lze přidělit jen po potvrzené platbě (payment.succeeded webhook).",
    };
  }
  return { ok: true, source: "PAID_ORDER" };
}

export type GrantRouteKind =
  | "deep_analysis"
  | "buyer_pass"
  | "investor_pro"
  | "b2b_plan"
  | "professional_review"
  | "listing_boost"
  | "legacy";

const B2B_KEYS = new Set([
  "agent_free",
  "agent_pro",
  "agency_growth",
  "developer_standard",
]);

const PROFESSIONAL_KEYS = new Set(["expert_review", "investment_audit"]);

export function mapProductKeyToGrantRoute(productKey: string): GrantRouteKind {
  if (productKey === "deep_analysis" || productKey === "full_analysis") {
    return productKey === "deep_analysis" ? "deep_analysis" : "legacy";
  }
  if (productKey === "buyer_pass") return "buyer_pass";
  if (
    productKey === "investor_pro" ||
    productKey === "investor_pro_monthly" ||
    productKey === "investor_pro_annual"
  ) {
    return "investor_pro";
  }
  if (B2B_KEYS.has(productKey)) return "b2b_plan";
  if (PROFESSIONAL_KEYS.has(productKey)) return "professional_review";
  if (productKey === "boost_7_days" || productKey === "boost_30_days") {
    return "listing_boost";
  }
  return "legacy";
}

export function isB2bSubscriptionProductKey(productKey: string): boolean {
  return B2B_KEYS.has(productKey);
}

export function isProfessionalReviewProductKey(productKey: string): boolean {
  return PROFESSIONAL_KEYS.has(productKey);
}
