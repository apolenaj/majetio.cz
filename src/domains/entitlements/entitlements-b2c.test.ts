import { describe, expect, it } from "vitest";

import {
  buyerPassConfig,
  deepAnalysisConfig,
  investorProConfig,
  majetioFreeConfig,
} from "@/config/entitlements-b2c";
import {
  mapProviderStatusToEventType,
} from "@/domains/commerce/status-map";

/**
 * Pure B2C entitlement rules (no DB) — Free value, Deep refresh, Buyer Pass, Pro lifecycle.
 */
describe("Majetio Free — real value, no fake paywall", () => {
  it("always includes BASIC_SCORE and BASIC_RISKS", () => {
    expect(majetioFreeConfig.features).toEqual(
      expect.arrayContaining(["BASIC_SCORE", "BASIC_RISKS"]),
    );
    expect(majetioFreeConfig.features).not.toContain("DEEP_ANALYSIS");
    expect(majetioFreeConfig.copy.valuePromiseCs.toLowerCase()).toMatch(
      /skóre|rizik/,
    );
  });

  it("does not claim advanced comparison on free", () => {
    expect(majetioFreeConfig.features).not.toContain("ADVANCED_COMPARISON");
    expect(majetioFreeConfig.limits.simpleComparisonsMax).toBeGreaterThan(0);
  });
});

describe("Deep Analysis — property + version, not lifetime", () => {
  it("defines finite access and refresh windows", () => {
    expect(deepAnalysisConfig.accessDays).toBeGreaterThan(0);
    expect(deepAnalysisConfig.refreshDays).toBeGreaterThan(0);
    expect(deepAnalysisConfig.features).toContain("DEEP_ANALYSIS");
  });

  it("refresh window equals access by default (rebuy for new version)", () => {
    expect(deepAnalysisConfig.refreshDays).toBe(deepAnalysisConfig.accessDays);
  });
});

describe("Buyer Pass — time-boxed, anti-scrape, not subscription", () => {
  it("has duration and scrape caps", () => {
    expect(buyerPassConfig.durationDays).toBe(30);
    expect(buyerPassConfig.antiScrape.propertyViewsPerDay).toBeLessThanOrEqual(100);
    expect(buyerPassConfig.antiScrape.exportsPerDay).toBeGreaterThan(0);
    expect(buyerPassConfig.deepAnalysesIncluded).toBeGreaterThan(0);
  });

  it("includes advanced comparison", () => {
    expect(buyerPassConfig.features).toContain("ADVANCED_COMPARISON");
  });
});

describe("Investor Pro — lifecycle + annual + grace", () => {
  it("exposes monthly and annual plan keys", () => {
    expect(investorProConfig.planKeys.monthly).toBe("investor_pro_monthly");
    expect(investorProConfig.planKeys.annual).toBe("investor_pro_annual");
  });

  it("defines trial and grace for both intervals", () => {
    expect(investorProConfig.monthly.trialDays).toBeGreaterThan(0);
    expect(investorProConfig.monthly.graceDays).toBeGreaterThan(0);
    expect(investorProConfig.annual.periodDays).toBe(365);
    expect(investorProConfig.annual.graceDays).toBeGreaterThan(
      investorProConfig.monthly.graceDays,
    );
  });

  it("transitions trial → active → past_due → expired", async () => {
    const { nextInvestorProState } = await import(
      "@/domains/entitlements/service"
    );
    const now = new Date("2026-07-21T12:00:00Z");
    const afterTrial = nextInvestorProState({
      status: "TRIAL",
      event: "trial_end",
      billingInterval: "MONTHLY",
      gracePeriodEndsAt: null,
      trialEndsAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: new Date("2026-08-20T12:00:00Z"),
      expiresAt: new Date("2026-08-20T12:00:00Z"),
      cancelAtPeriodEnd: false,
      now,
    });
    expect(afterTrial.status).toBe("ACTIVE");

    const pastDue = nextInvestorProState({
      ...afterTrial,
      event: "payment_failed",
      billingInterval: "MONTHLY",
      now,
    });
    expect(pastDue.status).toBe("PAST_DUE");
    expect(pastDue.gracePeriodEndsAt).not.toBeNull();

    const expired = nextInvestorProState({
      ...pastDue,
      event: "period_end",
      billingInterval: "MONTHLY",
      now: new Date(pastDue.gracePeriodEndsAt!.getTime() + 1000),
    });
    expect(expired.status).toBe("EXPIRED");
  });

  it("annual cancel at period end expires", async () => {
    const { nextInvestorProState } = await import(
      "@/domains/entitlements/service"
    );
    const now = new Date("2026-07-21T12:00:00Z");
    const cancelled = nextInvestorProState({
      status: "ACTIVE",
      event: "cancel",
      billingInterval: "ANNUAL",
      gracePeriodEndsAt: null,
      trialEndsAt: null,
      currentPeriodStart: now,
      currentPeriodEnd: new Date("2027-07-21T12:00:00Z"),
      expiresAt: new Date("2027-07-21T12:00:00Z"),
      cancelAtPeriodEnd: false,
      now,
    });
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancelAtPeriodEnd).toBe(true);

    const ended = nextInvestorProState({
      ...cancelled,
      event: "period_end",
      billingInterval: "ANNUAL",
      now: new Date("2027-07-22T12:00:00Z"),
    });
    expect(ended.status).toBe("EXPIRED");
  });
});

describe("EntitlementService source contracts", () => {
  it("central service exports feature gate and grants", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = await fs.readFile(
      path.join(process.cwd(), "src/domains/entitlements/service.ts"),
      "utf8",
    );
    expect(file).toMatch(/assertFeatureAccess/);
    expect(file).toMatch(/grantDeepAnalysis/);
    expect(file).toMatch(/grantBuyerPass/);
    expect(file).toMatch(/grantInvestorPro/);
    expect(file).toMatch(/transitionInvestorProLifecycle/);
    expect(file).toMatch(/PAST_DUE/);
    expect(file).toMatch(/gracePeriodEndsAt/);
    expect(file).toMatch(/autoRenew: false/);
  });

  it("usage records support anti-scrape windows", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = await fs.readFile(
      path.join(process.cwd(), "src/domains/entitlements/usage.ts"),
      "utf8",
    );
    expect(file).toMatch(/recordUsage/);
    expect(file).toMatch(/usageDayKey/);
    expect(file).toMatch(/scopeKey/);
  });
});
