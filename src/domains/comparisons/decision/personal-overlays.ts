/**
 * Personal overlays — Match Score + Financing (BOD 146).
 * Never written to ComparisonSnapshot or public cache.
 */

import { calculatePropertyFinancing } from "@/domains/financing/property-financing";
import {
  computePropertyMatchScore,
  type MatchProfile,
} from "@/domains/properties/service/match-score";
import { comparisonConfig } from "@/config/comparison";
import type {
  ComparisonPublicPropertyMetrics,
  FinancingDecisionMetrics,
  ScoredMetric,
} from "./types";
import type { PassportState } from "@/lib/financial-passport/types";

export function passportToMatchProfile(
  passport: PassportState | null | undefined,
): MatchProfile | null {
  if (!passport) return null;
  return {
    maxPriceCzk: passport.maxPriceCzk ?? null,
    preferredCity: passport.preferredCity ?? null,
    regions: passport.regions ?? [],
    propertyTypes: (passport.propertyTypes ?? []) as string[],
    dispositions: passport.dispositions ?? [],
    minAreaSqm: passport.minAreaSqm ?? null,
    maxAreaSqm: passport.maxAreaSqm ?? null,
    strategies: passport.strategies ?? [],
    riskTolerance: passport.riskTolerance ?? null,
    goal: passport.goal ?? null,
    targetGrossYieldPct: passport.targetGrossYieldPct ?? null,
  };
}

export function computeMatchScoreOverlay(
  publicMetrics: ComparisonPublicPropertyMetrics,
  profile: MatchProfile | null,
): ScoredMetric {
  const result = computePropertyMatchScore(
    {
      id: publicMetrics.propertyId,
      askingPrice: publicMetrics.basics.askingPriceCzk,
      locationCity: publicMetrics.basics.city,
      propertyType: publicMetrics.basics.propertyType,
      layout: publicMetrics.basics.layout,
      usableArea: publicMetrics.basics.usableArea,
      condition: publicMetrics.basics.condition,
      grossYieldPct: publicMetrics.investment.grossYieldPct,
    },
    profile,
  );

  if (!result.profileComplete) {
    return {
      score: null,
      confidence: "unknown",
      confidenceScore: null,
      breakdown: result.reasons.map((r) => ({
        id: r.code,
        label: r.label,
        value: null,
        tone:
          r.tone === "positive"
            ? "positive"
            : r.tone === "warning"
              ? "warning"
              : "neutral",
      })),
    };
  }

  return {
    score: result.score,
    confidence: result.score >= 70 ? "high" : result.score >= 40 ? "medium" : "low",
    confidenceScore: Math.min(0.95, 0.4 + result.reasons.length * 0.08),
    breakdown: result.reasons.map((r) => ({
      id: r.code,
      label: r.label,
      value: null,
      tone:
        r.tone === "positive"
          ? "positive"
          : r.tone === "warning"
            ? "warning"
            : "neutral",
    })),
  };
}

export function computeFinancingOverlay(input: {
  askingPriceCzk: number | null;
  valuationMidCzk: number | null;
  passport: PassportState | null | undefined;
}): FinancingDecisionMetrics | null {
  if (input.askingPriceCzk == null || input.askingPriceCzk <= 0) {
    return {
      equityCzk: null,
      loanCzk: null,
      monthlyPaymentCzk: null,
      financingGapCzk: null,
      ltvPct: null,
      usedPersonalPassport: false,
      private: true,
    };
  }

  const equity =
    input.passport?.availableEquityCzk ??
    (input.passport?.equityPercent != null
      ? Math.round(
          (input.askingPriceCzk * input.passport.equityPercent) / 100,
        )
      : null);

  const summary = calculatePropertyFinancing({
    askingPriceCzk: input.askingPriceCzk,
    valuationCzk: input.valuationMidCzk,
    userEquityCzk: equity,
    requestedLoanCzk: null,
    termYears: comparisonConfig.illustrativeMortgage.termYears,
    nominalInterestRatePp: comparisonConfig.illustrativeMortgage.interestRatePp,
    aprPp: null,
    offerLtvMaxPct: 80,
    defaultEquityShareOfPrice:
      1 - comparisonConfig.illustrativeMortgage.defaultLtvRatio,
  });

  return {
    equityCzk: summary.availableEquityCzk,
    loanCzk: summary.requestedLoanCzk,
    monthlyPaymentCzk: summary.estimatedMonthlyPaymentCzk,
    financingGapCzk: summary.financingGapCzk,
    ltvPct: summary.ltvOnAskingPricePct,
    usedPersonalPassport: equity != null,
    private: true,
  };
}
