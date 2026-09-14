import { describe, expect, it } from "vitest";

import {
  mapProductKeyToRevenueSource,
  normalizeToMonthlyMinor,
} from "@/domains/revenue/metrics";
import {
  estimateCustomerLtvMinor,
  estimateCacMinor,
  ltvToCacRatio,
  resolveCacInputs,
  assertLtvDoesNotUseGmv,
  LTV_CAC_GUARDRAILS,
} from "@/domains/revenue/ltv-cac";
import { assertNoForcedDoubleAttribution } from "@/domains/revenue/double-attribution";
import { scrubPii } from "@/lib/analytics/scrub-pii";
import { buildAnalyticsContext } from "@/lib/analytics/context";
import { getAnalyticsProvider, setAnalyticsProvider } from "@/lib/analytics/provider";
import {
  detectFakeListingSignals,
  detectPromotionAbuse,
  isBlockedByAbuse,
} from "@/domains/fraud";
import { MONETIZATION_AUDIT_ACTIONS } from "@/domains/revenue/monetization-audit";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Monetization metrics definitions (146–151)", () => {
  it("maps subscription products to SUBSCRIPTION source", () => {
    expect(mapProductKeyToRevenueSource("investor_pro_monthly")).toBe(
      "SUBSCRIPTION",
    );
    expect(mapProductKeyToRevenueSource("agent_pro")).toBe("SUBSCRIPTION");
    expect(mapProductKeyToRevenueSource("deep_analysis")).toBe("ANALYSIS");
    expect(mapProductKeyToRevenueSource("boost_7_days")).toBe("LISTING_BOOST");
  });

  it("normalizes annual amounts to monthly for MRR", () => {
    expect(normalizeToMonthlyMinor(999_000, "investor_pro_annual")).toBe(
      83_250,
    );
    expect(normalizeToMonthlyMinor(99_900, "investor_pro_monthly")).toBe(
      99_900,
    );
  });
});

describe("LTV / CAC foundations (153 / 154)", () => {
  it("computes LTV and forbids GMV as LTV input by policy", () => {
    const ltv = estimateCustomerLtvMinor({
      avgMonthlyRevenueMinor: 10_000,
      grossMargin: 0.7,
      monthlyChurnRate: 0.05,
    });
    expect(ltv.ltvMinor).toBe(140_000);
    expect(LTV_CAC_GUARDRAILS.forbidGmvAsLtvInput).toBe(true);
    const cac = estimateCacMinor({
      marketingSpendMinor: 50_000,
      newPayingCustomers: 10,
    });
    expect(cac.cacMinor).toBe(5_000);
    expect(ltvToCacRatio(ltv.ltvMinor, cac.cacMinor)).toBe(28);
  });

  it("resolveCacInputs reads env and assertLtvDoesNotUseGmv blocks GMV", () => {
    const inputs = resolveCacInputs({
      env: {
        MARKETING_SPEND_MINOR_30D: "100000",
        NEW_PAYING_CUSTOMERS_30D: "4",
      } as unknown as NodeJS.ProcessEnv,
    });
    expect(inputs.marketingSpendMinor).toBe(100_000);
    expect(inputs.newPayingCustomers).toBe(4);
    expect(
      assertLtvDoesNotUseGmv({
        avgMonthlyRevenueMinor: 50_000,
        gmvMinor: 50_000,
      }).ok,
    ).toBe(false);
    expect(
      assertLtvDoesNotUseGmv({
        avgMonthlyRevenueMinor: 10_000,
        gmvMinor: 50_000,
      }).ok,
    ).toBe(true);
  });
});

describe("Double attribution guard (155 / 156)", () => {
  it("blocks forced primary when multi-source", () => {
    const result = assertNoForcedDoubleAttribution({
      touchpoints: [
        { sourceKey: "portal_a", channel: "web", touchedAt: new Date() },
        { sourceKey: "portal_b", channel: "web", touchedAt: new Date() },
      ],
      proposedPrimarySourceKey: "portal_a",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("multi_source");
  });

  it("createLeadAttribution wires assertNoForcedDoubleAttribution", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/revenue/attribution-service.ts"),
      "utf8",
    );
    expect(file).toMatch(/assertNoForcedDoubleAttribution/);
    expect(file).toMatch(/createsRevenue:\s*false/);
  });
});

describe("Analytics PII scrub (157 / 158)", () => {
  it("removes email, phone, notes keys and redacts substrings", () => {
    const scrubbed = scrubPii({
      product_key: "buyer_pass",
      email: "user@example.com",
      notes: "tajná poznámka",
      phone: "+420123456789",
      label: "Contact me at user@example.com please",
    });
    expect(scrubbed).not.toHaveProperty("email");
    expect(scrubbed).not.toHaveProperty("notes");
    expect(scrubbed).not.toHaveProperty("phone");
    expect(scrubbed.product_key).toBe("buyer_pass");
    expect(String(scrubbed.label)).toContain("[redacted_email]");
  });

  it("exposes analytics provider adapter", () => {
    const prev = getAnalyticsProvider();
    let sent = 0;
    setAnalyticsProvider({
      name: "test",
      send() {
        sent += 1;
      },
    });
    expect(getAnalyticsProvider().name).toBe("test");
    void getAnalyticsProvider().send({
      name: "pricing_viewed",
      props: {},
      context: buildAnalyticsContext("server"),
    });
    expect(sent).toBe(1);
    setAnalyticsProvider(null);
    expect(getAnalyticsProvider().name).not.toBe("test");
    void prev;
  });
});

describe("Fraud / abuse (159)", () => {
  it("flags fake listing spam and blocks high severity", () => {
    const signals = detectFakeListingSignals({
      isDemo: true,
      title: "WhatsApp garantovaný výnos",
      askingPrice: 0,
      listingVerificationStatus: "UNVERIFIED",
    });
    expect(signals.some((s) => s.code === "demo_listing")).toBe(true);
    expect(isBlockedByAbuse(signals)).toBe(true);
  });

  it("detectPromotionAbuse is exported and callable", async () => {
    expect(typeof detectPromotionAbuse).toBe("function");
  });
});

describe("Audit + reconciliation contracts (196–199, 207, 210)", () => {
  it("defines monetization audit actions including refund and attribution", () => {
    expect(MONETIZATION_AUDIT_ACTIONS).toContain("entitlement.manual.grant");
    expect(MONETIZATION_AUDIT_ACTIONS).toContain("success_fee.verify");
    expect(MONETIZATION_AUDIT_ACTIONS).toContain("reconciliation.run");
    expect(MONETIZATION_AUDIT_ACTIONS).toContain("payment.refund.admin");
    expect(MONETIZATION_AUDIT_ACTIONS).toContain("attribution.resolve");
    expect(MONETIZATION_AUDIT_ACTIONS).toContain("fraud.signal.blocked");
  });

  it("webhook recognizes commerce revenue after grant", () => {
    const webhook = readFileSync(
      join(process.cwd(), "src/domains/payments/service/webhook-handler.ts"),
      "utf8",
    );
    expect(webhook).toMatch(/recognizeCommerceRevenueForPaidOrder/);
  });

  it("fraud detectors are wired into register, checkout, and boost", () => {
    const register = readFileSync(
      join(process.cwd(), "src/lib/auth/actions.ts"),
      "utf8",
    );
    expect(register).toMatch(/detectFreeAccountVelocity/);
    expect(register).toMatch(/fraud\.signal\.blocked/);

    const order = readFileSync(
      join(process.cwd(), "src/domains/orders/service/create-order.ts"),
      "utf8",
    );
    expect(order).toMatch(/detectPromotionAbuse/);

    const boost = readFileSync(
      join(process.cwd(), "src/domains/listing-promotions/service.ts"),
      "utf8",
    );
    expect(boost).toMatch(/detectFakeListingSignals/);

    const catalog = readFileSync(
      join(process.cwd(), "src/domains/commerce/catalog.ts"),
      "utf8",
    );
    expect(catalog).toMatch(/pricing\.plan\.upsert/);
  });

  it("reconciliation covers refund drift (199) and package scripts exist", () => {
    const recon = readFileSync(
      join(process.cwd(), "src/domains/revenue/reconciliation.ts"),
      "utf8",
    );
    expect(recon).toMatch(/refunded_with_active_entitlement/);
    expect(recon).toMatch(/refunded_with_recognized_revenue/);

    const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
    expect(pkg).toMatch(/revenue:reconcile/);

    const auditPage = readFileSync(
      join(process.cwd(), "src/app/(admin)/admin/audit-log/page.tsx"),
      "utf8",
    );
    expect(auditPage).toMatch(/listMonetizationAuditLogs/);
    expect(auditPage).not.toMatch(/PreparingPage/);
  });
});
