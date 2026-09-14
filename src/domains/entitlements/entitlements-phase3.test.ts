import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertOrderEligibleForEntitlementGrant,
  isB2bSubscriptionProductKey,
  isProfessionalReviewProductKey,
  mapProductKeyToGrantRoute,
} from "@/domains/entitlements/grant-guard";
import { buyerPassConfig, deepAnalysisConfig } from "@/config/entitlements-b2c";
import {
  agentFreePlan,
  agentProPlan,
  agencyGrowthPlan,
  reconcileListingQuota,
} from "@/domains/organizations";
import {
  isSubscriptionProductKey,
  subscriptionRenewConsentDefaults,
  describeSubscriptionGrantRuleCs,
} from "@/domains/subscriptions";

describe("Entitlement grant guard (177–179)", () => {
  it("blocks paid grant before Order is PAID", () => {
    const blocked = assertOrderEligibleForEntitlementGrant({
      status: "AWAITING_PAYMENT",
      amountGrossMinor: 499_000,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error).toMatch(/webhook|platb/i);
    }
  });

  it("allows grant only after PAID for paid orders", () => {
    const ok = assertOrderEligibleForEntitlementGrant({
      status: "PAID",
      amountGrossMinor: 149_900,
    });
    expect(ok).toEqual({ ok: true, source: "PAID_ORDER" });
  });

  it("allows free checkout without webhook", () => {
    const ok = assertOrderEligibleForEntitlementGrant({
      status: "PAID",
      amountGrossMinor: 0,
    });
    expect(ok).toEqual({ ok: true, source: "FREE_CHECKOUT" });
  });
});

describe("Product grant routing", () => {
  it("maps B2C Buyer Pass and Deep Analysis", () => {
    expect(mapProductKeyToGrantRoute("buyer_pass")).toBe("buyer_pass");
    expect(mapProductKeyToGrantRoute("deep_analysis")).toBe("deep_analysis");
    expect(buyerPassConfig.durationDays).toBe(30);
    expect(buyerPassConfig.deepAnalysesIncluded).toBe(2);
    expect(deepAnalysisConfig.productKey).toBe("deep_analysis");
  });

  it("maps B2B Agent Free / Pro / Growth (180)", () => {
    expect(mapProductKeyToGrantRoute("agent_free")).toBe("b2b_plan");
    expect(mapProductKeyToGrantRoute("agent_pro")).toBe("b2b_plan");
    expect(mapProductKeyToGrantRoute("agency_growth")).toBe("b2b_plan");
    expect(isB2bSubscriptionProductKey("agent_pro")).toBe(true);
    expect(agentFreePlan.limits.maxActiveListings).toBe(5);
    expect(agentProPlan.limits.maxActiveListings).toBe(40);
    expect(agencyGrowthPlan.limits.maxActiveListings).toBe(200);
  });

  it("maps Professional Review products (132)", () => {
    expect(mapProductKeyToGrantRoute("expert_review")).toBe(
      "professional_review",
    );
    expect(mapProductKeyToGrantRoute("investment_audit")).toBe(
      "professional_review",
    );
    expect(isProfessionalReviewProductKey("expert_review")).toBe(true);
  });
});

describe("B2B downgrade OVER_LIMIT (180)", () => {
  it("marks excess listings OVER_LIMIT without deleting", () => {
    const listings = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      rankAt: new Date(2026, 0, i + 1),
      listingQuotaState: "WITHIN_LIMIT" as const,
    }));
    const result = reconcileListingQuota({
      listings,
      listingsLimit: agentFreePlan.limits.maxActiveListings,
      reason: "Downgrade na agent_free",
    });
    expect(result.markOverLimitIds.length).toBe(3);
    expect(result.keepWithinLimitIds.length).toBe(5);
    expect(result.overLimitReason).toMatch(/Downgrade|agent_free/i);
  });
});

describe("Subscriptions renew consent", () => {
  it("never defaults auto-renew on", () => {
    const defaults = subscriptionRenewConsentDefaults();
    expect(defaults.autoRenewDefault).toBe(false);
    expect(defaults.initialChecked).toBe(false);
    expect(isSubscriptionProductKey("investor_pro_monthly")).toBe(true);
    expect(describeSubscriptionGrantRuleCs()).toMatch(/webhook/i);
  });
});

describe("Manual vs paid separation contracts (208/209)", () => {
  it("manual module never sets orderId and uses MANUAL_ADMIN", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/entitlements/manual.ts"),
      "utf8",
    );
    expect(file).toMatch(/source:\s*"MANUAL_ADMIN"/);
    expect(file).toMatch(/orderId:\s*null/);
    expect(file).toMatch(/manualReason/);
    expect(file).toMatch(/manualActorUserId/);
    expect(file).toMatch(/expiresAt/);
  });

  it("webhook grants only on payment.succeeded and passes property/org scope", () => {
    const webhook = readFileSync(
      join(process.cwd(), "src/domains/payments/service/webhook-handler.ts"),
      "utf8",
    );
    expect(webhook).toMatch(/payment\.succeeded/);
    expect(webhook).toMatch(/grantEntitlementForPaidOrder/);
    expect(webhook).toMatch(/propertyId:\s*order\.propertyId/);
    expect(webhook).toMatch(/organizationId:\s*order\.organizationId/);
    expect(webhook).toMatch(/do NOT create entitlement/);
  });

  it("paid grant path creates professional service order for expert_review", () => {
    const grant = readFileSync(
      join(process.cwd(), "src/domains/payments/service/entitlements.ts"),
      "utf8",
    );
    expect(grant).toMatch(/createProfessionalServiceRequest/);
    expect(grant).toMatch(/changeOrganizationPlan/);
    expect(grant).toMatch(/assertOrderEligibleForEntitlementGrant/);
  });
});
