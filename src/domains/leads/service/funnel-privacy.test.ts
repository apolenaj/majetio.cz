import { describe, expect, it } from "vitest";

import {
  buildMortgageLeadContextSnapshot,
  MORTGAGE_LEAD_SNAPSHOT_SCHEMA_VERSION,
} from "@/domains/leads/service/context-snapshot";
import {
  sanitizeMortgageLeadAuditMeta,
} from "@/domains/leads/service/privacy-guards";
import { stripInternalLeadFields } from "@/domains/leads/service/internal-value-metrics";
import { computeMortgageLeadRetentionExpiresAt } from "@/domains/leads/service/retention";

describe("mortgage lead context snapshot", () => {
  it("freezes property and financing context", () => {
    const snapshot = buildMortgageLeadContextSnapshot({
      propertyId: "prop_1",
      propertySlug: "demo-byt",
      askingPriceCzk: 4_500_000,
      valuationCzk: 4_200_000,
      requestedLoanCzk: 3_600_000,
      ltvOnAskingPricePct: 80,
      nominalInterestRatePp: 5.19,
      estimatedMonthlyPaymentCzk: 19_800,
      termYears: 30,
    });

    expect(snapshot.schemaVersion).toBe(MORTGAGE_LEAD_SNAPSHOT_SCHEMA_VERSION);
    expect(snapshot.property.askingPriceCzk).toBe(4_500_000);
    expect(snapshot.property.valuationCzk).toBe(4_200_000);
    expect(snapshot.financing.ltvOnAskingPricePct).toBe(80);
    expect(snapshot.property.propertyUrl).toContain("/nemovitosti/demo-byt");
  });
});

describe("mortgage lead privacy guards", () => {
  it("strips financial values from audit meta", () => {
    const safe = sanitizeMortgageLeadAuditMeta({
      correlationId: "ml_abc",
      monthlyIncomeCzk: 80_000,
      purchasePriceCzk: 4_000_000,
      sharedFields: ["email", "monthlyIncomeCzk"],
      fieldCount: 2,
    });

    expect(safe.correlationId).toBe("ml_abc");
    expect(safe.fieldCount).toBe(2);
    expect(safe).not.toHaveProperty("monthlyIncomeCzk");
    expect(safe).not.toHaveProperty("purchasePriceCzk");
  });
});

describe("mortgage lead retention", () => {
  it("computes retention expiry from creation", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const expires = computeMortgageLeadRetentionExpiresAt({ createdAt: created });
    expect(expires.getFullYear()).toBeGreaterThan(2030);
  });
});

describe("internal field strip (regression)", () => {
  it("never exposes commission in user payloads", () => {
    const safe = stripInternalLeadFields({
      correlationId: "ml_test",
      estimatedCommissionCzk: 12_000,
    });
    expect(safe).toEqual({ correlationId: "ml_test" });
  });
});
