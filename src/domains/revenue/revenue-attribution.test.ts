/**
 * Revenue attribution — billing modes, double-count, attribution window, disputes.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  computeSuccessFeeAmountMinor,
  decideLeadAttribution,
  revenueAttributionConfig,
  revenueIdempotencyKey,
} from "@/domains/revenue";

describe("billing modes config", () => {
  it("defines MODE A price and MODE B fee bps defaults", () => {
    expect(revenueAttributionConfig.defaultPayPerLeadPriceMinor).toBe(49_900);
    expect(revenueAttributionConfig.defaultSuccessFeeBps).toBe(1_000);
    expect(revenueAttributionConfig.disputeRequiresEvidenceToInvalidate).toBe(
      true,
    );
  });

  it("computes success fee from broker commission", () => {
    // 100_000 Kč commission (10_000_000 haléřů) @ 10% = 10_000 Kč
    expect(computeSuccessFeeAmountMinor(10_000_000, 1_000)).toBe(1_000_000);
    expect(computeSuccessFeeAmountMinor(0, 1_000)).toBe(0);
  });
});

describe("canonical RevenueEvent double-count keys", () => {
  it("builds stable idempotency keys", () => {
    expect(revenueIdempotencyKey("PAY_PER_LEAD", "lead_1")).toBe(
      "pay_per_lead:lead_1",
    );
    expect(revenueIdempotencyKey("SUCCESS_FEE", "fee_9")).toBe(
      "success_fee:fee_9",
    );
  });

  it("schema enforces unique sourceType+sourceEntityId", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model RevenueEvent/);
    expect(schema).toMatch(/@@unique\(\[sourceType, sourceEntityId\]\)/);
    expect(schema).toMatch(/model SuccessFeeRecord/);
    expect(schema).toMatch(/POTENTIAL/);
    expect(schema).toMatch(/VERIFIED/);
    expect(schema).toMatch(/INVOICED/);
    expect(schema).toMatch(/OrganizationLeadBillingMode/);
    expect(schema).toMatch(/PAY_PER_LEAD/);
    expect(schema).toMatch(/SUCCESS_FEE/);
  });
});

describe("attribution window", () => {
  const anchor = new Date("2026-07-21T12:00:00Z");

  it("attributes single source inside window", () => {
    const decision = decideLeadAttribution({
      anchorAt: anchor,
      windowDays: 30,
      touchpoints: [
        {
          sourceKey: "organic_search",
          channel: "web",
          touchedAt: "2026-07-10T10:00:00Z",
        },
      ],
    });
    expect(decision.status).toBe("ATTRIBUTED");
    expect(decision.primarySourceKey).toBe("organic_search");
  });

  it("forces MULTI_SOURCE_REVIEW when multiple sources compete", () => {
    const decision = decideLeadAttribution({
      anchorAt: anchor,
      windowDays: 30,
      touchpoints: [
        {
          sourceKey: "google_ads",
          channel: "paid",
          touchedAt: "2026-07-05T10:00:00Z",
        },
        {
          sourceKey: "partner_portal",
          channel: "partner",
          touchedAt: "2026-07-15T10:00:00Z",
        },
      ],
    });
    expect(decision.status).toBe("MULTI_SOURCE_REVIEW");
    expect(decision.primarySourceKey).toBeNull();
    expect(decision.competingSourceKeys.sort()).toEqual([
      "google_ads",
      "partner_portal",
    ]);
  });

  it("ignores touchpoints outside the window", () => {
    const decision = decideLeadAttribution({
      anchorAt: anchor,
      windowDays: 7,
      touchpoints: [
        {
          sourceKey: "old_campaign",
          channel: "email",
          touchedAt: "2026-06-01T10:00:00Z",
        },
      ],
    });
    expect(decision.status).toBe("UNATTRIBUTED");
  });
});

describe("dispute protective workflow", () => {
  it("documents evidence-required path in disputes module", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/revenue/disputes.ts"),
      "utf8",
    );
    expect(file).toMatch(/EVIDENCE_REQUIRED/);
    expect(file).toMatch(/leadRemainsBillable: true/);
    expect(file).toMatch(/Nelze uznat spor bez evidence/);
    expect(file).toMatch(/resolveLeadDispute/);
  });

  it("LeadDispute model exists with reason enum", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model LeadDispute/);
    expect(schema).toMatch(/ALREADY_CLIENT/);
    expect(schema).toMatch(/FAKE_CONTACT/);
  });
});
