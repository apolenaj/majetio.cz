import { describe, expect, it } from "vitest";

import { resolveActiveMortgageRegulatoryConfig } from "@/domains/financing/regulatory/regulatory-config";
import { evaluateLtvScenarioMatch } from "@/domains/financing/regulatory/ltv-scenario-match";
import { computeOrientationalMortgageReadiness } from "@/domains/financing/regulatory/orientational-readiness";
import { resolveMortgageLeadRouting } from "@/domains/leads/service/routing";
import {
  computeInternalLeadValueMetrics,
  stripInternalLeadFields,
} from "@/domains/leads/service/internal-value-metrics";

describe("CZ mortgage regulatory config", () => {
  it("resolves active version by date", () => {
    const config = resolveActiveMortgageRegulatoryConfig({
      marketCountry: "CZ",
      at: new Date("2026-07-15"),
    });
    expect(config?.version).toBe("cz-mortgage-regulatory.v2026.07");
    expect(config?.limits.maxLtvPctInvestment).toBe(80);
  });

  it("evaluates LTV scenario without approval language", () => {
    const result = evaluateLtvScenarioMatch({
      ltvOnAskingPricePct: 75,
      propertyPurpose: "investment",
    });
    expect(result?.matches).toBe(true);
    expect(result?.userMessage).toContain("odpovídá zadanému LTV");
    expect(result?.userMessage.toLowerCase()).not.toContain("schvál");
  });

  it("flags LTV above orientační limit", () => {
    const result = evaluateLtvScenarioMatch({
      ltvOnAskingPricePct: 85,
      propertyPurpose: "investment",
    });
    expect(result?.matches).toBe(false);
    expect(result?.userMessage).toContain("překračuje orientační limit");
  });
});

describe("orientational mortgage readiness", () => {
  it("never mentions bank approval", () => {
    const readiness = computeOrientationalMortgageReadiness({
      readinessInput: {
        askingPriceCzk: 4_000_000,
        availableEquityCzk: 800_000,
        monthlyIncomeCzk: 80_000,
        monthlyLiabilitiesCzk: 10_000,
        hasContact: true,
      },
      financingSummary: {
        purchasePriceCzk: 4_000_000,
        valuationCzk: null,
        valuationBelowPriceWarning: false,
        availableEquityCzk: 800_000,
        requestedLoanCzk: 3_200_000,
        maxEligibleLoanCzk: 3_200_000,
        financingGapCzk: 0,
        ltvOnAskingPricePct: 80,
        ltvOnValuationPct: null,
        nominalInterestRatePp: 5.19,
        aprPp: null,
        estimatedMonthlyPaymentCzk: 17_000,
        totalPaidCzk: 6_000_000,
        totalInterestCzk: 2_800_000,
        termYears: 30,
        rateTier: "cached",
        postFixationRateAssumptionPp: 6.19,
        futureRefinanceRateAssumptionPp: 6.19,
      },
    });

    expect(readiness.label).not.toMatch(/schvál/i);
    expect(readiness.ltvScenarioAssessment?.matches).toBe(true);
  });
});

describe("mortgage lead routing", () => {
  it("defaults to HypotekaJasne for CZ", () => {
    const routing = resolveMortgageLeadRouting({ marketCountry: "CZ" });
    expect(routing.partner).toBe("hypotekajasne");
    expect(routing.routingRuleKey).toBe("cz-default-hypotekajasne");
  });
});

describe("internal lead value metrics", () => {
  it("computes loan and commission internally", () => {
    const metrics = computeInternalLeadValueMetrics({
      purchasePriceCzk: 4_000_000,
      availableEquityCzk: 1_000_000,
    });
    expect(metrics.estimatedLoanAmountCzk).toBe(3_000_000);
    expect(metrics.estimatedCommissionCzk).toBe(15_000);
  });

  it("strips internal fields from user payloads", () => {
    const safe = stripInternalLeadFields({
      correlationId: "ml_test",
      estimatedCommissionCzk: 999,
      statusLabel: "Odesláno",
    });
    expect(safe).toEqual({
      correlationId: "ml_test",
      statusLabel: "Odesláno",
    });
  });
});
