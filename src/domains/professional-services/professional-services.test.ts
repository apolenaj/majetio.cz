/**
 * Professional services — HITL workflow, partner agreements, concierge flag, PROTECTED tx.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  PROFESSIONAL_SERVICE_TRANSITIONS,
  assertPurchaseConciergeEnabled,
  getPurchaseConciergePublicSurface,
  isPurchaseConciergeEnabled,
  scrubConciergePromises,
  stripProtectedTransactionFields,
  toPublicAgreementSummary,
} from "@/domains/professional-services";

describe("Expert Review / Investment Audit workflow states", () => {
  it("defines human-in-the-loop transitions", () => {
    expect(PROFESSIONAL_SERVICE_TRANSITIONS.WAITING_FOR_INPUTS).toContain(
      "SUBMITTED",
    );
    expect(PROFESSIONAL_SERVICE_TRANSITIONS.SUBMITTED).toContain("ASSIGNED");
    expect(PROFESSIONAL_SERVICE_TRANSITIONS.ASSIGNED).toContain("IN_REVIEW");
    expect(PROFESSIONAL_SERVICE_TRANSITIONS.IN_REVIEW).toContain("DELIVERED");
    expect(PROFESSIONAL_SERVICE_TRANSITIONS.CLOSED).toEqual([]);
  });

  it("schema has ProfessionalServiceRequest kinds", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/EXPERT_REVIEW/);
    expect(schema).toMatch(/INVESTMENT_AUDIT/);
    expect(schema).toMatch(/WAITING_FOR_INPUTS/);
    expect(schema).toMatch(/model ProfessionalServiceRequest/);
  });
});

describe("Partner Marketplace agreements", () => {
  it("summarizes compensation without exposing amounts", () => {
    const summary = toPublicAgreementSummary({
      compensationModel: "REVENUE_SHARE",
      fixedFeeMinor: null,
      revenueShareBps: 1500,
    });
    expect(summary.compensationModel).toBe("REVENUE_SHARE");
    expect(summary.hasRevenueShare).toBe(true);
    expect(summary.hasFixedFee).toBe(false);
    expect(JSON.stringify(summary)).not.toMatch(/1500/);
  });

  it("schema covers inspection/legal/certificate + FIXED/REVENUE_SHARE", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model PartnerCommercialAgreement/);
    expect(schema).toMatch(/INSPECTION/);
    expect(schema).toMatch(/LEGAL/);
    expect(schema).toMatch(/CERTIFICATE/);
    expect(schema).toMatch(/FIXED/);
    expect(schema).toMatch(/REVENUE_SHARE/);
  });
});

describe("Purchase Concierge feature flag", () => {
  const prev = process.env.TRANSACTION_SUCCESS_FEE_ENABLED;

  beforeEach(() => {
    delete process.env.TRANSACTION_SUCCESS_FEE_ENABLED;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.TRANSACTION_SUCCESS_FEE_ENABLED;
    else process.env.TRANSACTION_SUCCESS_FEE_ENABLED = prev;
  });

  it("defaults to disabled — no public surface / no representation promises", () => {
    expect(isPurchaseConciergeEnabled()).toBe(false);
    expect(getPurchaseConciergePublicSurface()).toBeNull();
    expect(assertPurchaseConciergeEnabled()).toMatchObject({
      ok: false,
      code: "feature_disabled",
    });
    const scrubbed = scrubConciergePromises(
      "Zastoupíme vás při koupi a zajistíme převod vlastnictví jako agent.",
    );
    expect(scrubbed).toMatch(/\[nedostupné\]/);
    expect(scrubbed).not.toMatch(/Zastoupíme vás při koupi/i);
  });

  it("enables only when TRANSACTION_SUCCESS_FEE_ENABLED=true", () => {
    process.env.TRANSACTION_SUCCESS_FEE_ENABLED = "true";
    expect(isPurchaseConciergeEnabled()).toBe(true);
    expect(getPurchaseConciergePublicSurface()?.enabled).toBe(true);
  });
});

describe("PropertyTransaction PROTECTED fields", () => {
  it("strips agreed price from objects", () => {
    const safe = stripProtectedTransactionFields({
      id: "tx1",
      status: "AGREEMENT_REACHED",
      agreedPriceMinor: 9_990_000_00,
      agreedPriceSetAt: new Date(),
    });
    expect(safe).not.toHaveProperty("agreedPriceMinor");
    expect(safe).not.toHaveProperty("agreedPriceSetAt");
    expect(safe.id).toBe("tx1");
  });

  it("schema marks PROTECTED sensitivity and access log", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model PropertyTransaction/);
    expect(schema).toMatch(/DataSensitivityClass/);
    expect(schema).toMatch(/PROTECTED/);
    expect(schema).toMatch(/model PropertyTransactionAccessLog/);
    expect(schema).toMatch(/agreedPriceMinor/);
  });
});
