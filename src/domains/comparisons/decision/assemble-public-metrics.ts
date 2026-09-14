/**
 * Assemble public per-property metrics from a module bundle (pure + cache).
 */

import { getPropertyFinancialDemo } from "@/content/demo-property-financial";
import { getPropertyContextDemo } from "@/content/demo-property-context";
import { confidenceFromScore } from "./confidence";
import {
  computeDaysOnMarket,
  computeNegotiationSpace,
  modeledMaxFromValuation,
} from "./negotiation-space";
import { buildRenovationDecisionMetrics } from "./renovation-metrics";
import { summarizeRisks } from "./risk-summary";
import type {
  ComparisonPublicPropertyMetrics,
  RiskDecisionItem,
  ScoredMetric,
} from "./types";
import { buildFingerprint } from "./fingerprints";
import {
  buildPublicMetricsCacheKey,
  getCachedPublicMetrics,
  setCachedPublicMetrics,
} from "./public-module-cache";
import type { ComparisonModuleBundle, ComparisonPropertyRow } from "./load-modules";

function readInvestmentOutputs(outputs: unknown): {
  grossYieldPct: number | null;
  netYieldPct: number | null;
  cashFlowMonthlyCzk: number | null;
  estimatedRentMonthlyCzk: number | null;
  maxOfferCzk: number | null;
  arvCzk: number | null;
} {
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    return {
      grossYieldPct: null,
      netYieldPct: null,
      cashFlowMonthlyCzk: null,
      estimatedRentMonthlyCzk: null,
      maxOfferCzk: null,
      arvCzk: null,
    };
  }
  const o = outputs as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    grossYieldPct: num(o.grossYieldPct ?? o.gross_yield_pct),
    netYieldPct: num(o.netYieldPct ?? o.net_yield_pct),
    cashFlowMonthlyCzk: num(o.cashFlowMonthlyCzk ?? o.monthlyCashFlow),
    estimatedRentMonthlyCzk: num(
      o.estimatedRentMonthlyCzk ?? o.rentMonthlyCzk,
    ),
    maxOfferCzk: num(o.maxOfferCzk ?? o.maximumOfferCzk),
    arvCzk: num(o.arvCzk ?? o.valueAfterRenovationCzk),
  };
}

function emptyScore(): ScoredMetric {
  return {
    score: null,
    confidence: "unknown",
    confidenceScore: null,
    breakdown: [],
  };
}

function buildMajetioScored(input: {
  score: number | null;
  grossYieldPct: number | null;
  cashFlowMonthlyCzk: number | null;
  valuationConfidence: number | null;
}): ScoredMetric {
  if (input.score == null) return emptyScore();
  const confScore =
    input.valuationConfidence != null
      ? input.valuationConfidence / 100
      : input.grossYieldPct != null
        ? 0.55
        : 0.35;
  return {
    score: input.score,
    confidence: confidenceFromRatioSafe(confScore),
    confidenceScore: confScore,
    breakdown: [
      {
        id: "majetio",
        label: "Majetio Score",
        value: Math.round(input.score),
        tone: "neutral",
      },
      {
        id: "yield",
        label: "Hrubý výnos",
        value:
          input.grossYieldPct != null
            ? `${input.grossYieldPct.toFixed(1)} %`
            : null,
        tone:
          input.grossYieldPct != null && input.grossYieldPct >= 5
            ? "positive"
            : "neutral",
      },
      {
        id: "cash_flow",
        label: "Měsíční CF",
        value: input.cashFlowMonthlyCzk,
        tone:
          input.cashFlowMonthlyCzk != null && input.cashFlowMonthlyCzk > 0
            ? "positive"
            : input.cashFlowMonthlyCzk != null
              ? "warning"
              : "neutral",
      },
    ],
  };
}

function confidenceFromRatioSafe(ratio: number) {
  if (ratio >= 0.75) return "high" as const;
  if (ratio >= 0.45) return "medium" as const;
  return "low" as const;
}

function buildLocationScored(input: {
  city: string | null;
  district: string | null;
  label: string | null;
}): ScoredMetric {
  if (!input.city && !input.district && !input.label) return emptyScore();
  const parts = [input.label, input.district, input.city].filter(Boolean);
  return {
    score: null,
    confidence: "low",
    confidenceScore: 0.3,
    breakdown: [
      {
        id: "location_label",
        label: "Lokalita",
        value: parts[0] ?? null,
        tone: "neutral",
      },
      {
        id: "city",
        label: "Město",
        value: input.city,
        tone: "neutral",
      },
      {
        id: "note",
        label: "Poznámka",
        value:
          "Kompozitní Location Score doplní Location Intelligence (market metriky).",
        tone: "neutral",
      },
    ],
  };
}

function buildRisksForProperty(property: ComparisonPropertyRow) {
  const items: RiskDecisionItem[] = [];
  const ctx = getPropertyContextDemo(property.slug);
  for (const r of ctx?.risks ?? []) {
    items.push({
      id: r.id,
      title: r.title,
      severity: r.severity,
      detail: r.text,
    });
  }
  const summary = summarizeRisks(items);
  if (
    summary.items.length === 0 &&
    property.condition === "NEEDS_RENOVATION"
  ) {
    return summarizeRisks([
      {
        id: "needs_renovation",
        title: "Stav vyžaduje rekonstrukci",
        severity: "high",
        detail: "Inzerovaný stav je k rekonstrukci — ověřte rozpočet a ARV.",
      },
    ]);
  }
  return summary;
}

export function assemblePublicPropertyMetrics(
  property: ComparisonPropertyRow,
  bundle: ComparisonModuleBundle,
): ComparisonPublicPropertyMetrics {
  const cacheKey = buildPublicMetricsCacheKey({
    propertyId: property.id,
    updatedAt: property.updatedAt.toISOString(),
  });
  const cached = getCachedPublicMetrics(cacheKey);
  if (cached) return cached;

  const valuation = bundle.valuationsByProperty.get(property.id);
  const renovation = bundle.renovationsByProperty.get(property.id);
  const investment = bundle.investmentsByProperty.get(property.id);
  const analysis = bundle.analysesByProperty.get(property.id);
  const inv = readInvestmentOutputs(investment?.outputs);

  const demoFin = property.isDemo
    ? getPropertyFinancialDemo(property.slug)
    : null;

  const asking = property.askingPrice ?? property.priceCzk ?? null;
  const valuationMid =
    valuation?.estimatedValue ?? demoFin?.valuation?.midCzk ?? null;
  const valuationLow =
    valuation?.lowerBound ?? demoFin?.valuation?.lowCzk ?? null;
  const valuationHigh =
    valuation?.upperBound ?? demoFin?.valuation?.highCzk ?? null;
  const valuationConfScore =
    valuation?.confidenceScore ??
    (demoFin?.valuation?.confidence === "high"
      ? 80
      : demoFin?.valuation?.confidence === "medium"
        ? 55
        : demoFin?.valuation?.confidence === "low"
          ? 30
          : null);

  const renoLow =
    renovation?.estimatedLow ?? demoFin?.renovation?.costCzk ?? null;
  const renoBase =
    renovation?.estimatedBase ?? demoFin?.renovation?.costCzk ?? null;
  const renoHigh =
    renovation?.estimatedHigh ??
    (demoFin?.renovation?.costCzk != null
      ? Math.round(demoFin.renovation.costCzk * 1.25)
      : null);
  const arv = inv.arvCzk ?? demoFin?.renovation?.valueAfterCzk ?? null;
  const maxOffer =
    inv.maxOfferCzk ??
    demoFin?.renovation?.maxOfferCzk ??
    modeledMaxFromValuation(valuationMid);

  const grossYield =
    inv.grossYieldPct ?? demoFin?.investment?.grossYieldPct ?? null;
  const netYield =
    inv.netYieldPct ?? demoFin?.investment?.netYieldPct ?? null;
  const cashFlow =
    inv.cashFlowMonthlyCzk ??
    demoFin?.investment?.cashFlowMonthlyCzk ??
    null;
  const rent =
    inv.estimatedRentMonthlyCzk ??
    demoFin?.investment?.estimatedRentMonthlyCzk ??
    null;

  const daysOnMarket = computeDaysOnMarket(property.publishedAt);
  const recentDrop = bundle.priceDropsByProperty.get(property.id) ?? null;

  const renovationMetrics = buildRenovationDecisionMetrics({
    costLowCzk: renoLow,
    costBaseCzk: renoBase,
    costHighCzk: renoHigh,
    durationDays: renovation?.estimatedDuration ?? null,
    arvCzk: arv,
    askingPriceCzk: asking,
    confidenceScore: renovation?.confidence ?? null,
  });

  const negotiation = computeNegotiationSpace({
    askingPriceCzk: asking,
    originalAskingPriceCzk: property.originalAskingPrice,
    modeledMaxOfferCzk: maxOffer,
    daysOnMarket,
    recentPriceDropCzk: recentDrop,
  });

  const majetioScore = buildMajetioScored({
    score: analysis?.majetioScore ?? null,
    grossYieldPct: grossYield,
    cashFlowMonthlyCzk: cashFlow,
    valuationConfidence: valuationConfScore,
  });

  const locationScore = buildLocationScored({
    city: property.publicCity,
    district: property.publicDistrict,
    label: property.publicLabel,
  });

  const risks = buildRisksForProperty(property);

  const basics = {
    askingPriceCzk: asking,
    pricePerSqm: property.pricePerSqm,
    usableArea: property.usableArea,
    layout: property.layout,
    propertyType: property.propertyType,
    condition: property.condition,
    city: property.publicCity,
    daysOnMarket,
  };

  const valuationBlock = {
    midCzk: valuationMid,
    lowCzk: valuationLow,
    highCzk: valuationHigh,
    confidence: confidenceFromScore(valuationConfScore),
    confidenceScore:
      valuationConfScore != null ? valuationConfScore / 100 : null,
  };

  const metrics: ComparisonPublicPropertyMetrics = {
    propertyId: property.id,
    slug: property.slug,
    title: property.title,
    href: `/nemovitosti/${property.slug}`,
    isDemo: property.isDemo,
    basics,
    majetioScore,
    locationScore,
    valuation: valuationBlock,
    investment: {
      grossYieldPct: grossYield,
      netYieldPct: netYield,
      cashFlowMonthlyCzk: cashFlow,
      estimatedRentMonthlyCzk: rent,
      confidence:
        grossYield != null || cashFlow != null
          ? confidenceFromScore(valuationConfScore ?? 50)
          : "unknown",
    },
    negotiation,
    renovation: renovationMetrics,
    risks,
    fingerprint: buildFingerprint({
      propertyId: property.id,
      basics,
      valuation: valuationBlock,
      renovation: renovationMetrics,
      majetioScore,
      status: property.status,
      updatedAt: property.updatedAt.toISOString(),
    }),
  };

  setCachedPublicMetrics(cacheKey, metrics);
  return metrics;
}

export function assembleAllPublicMetrics(
  bundle: ComparisonModuleBundle,
): ComparisonPublicPropertyMetrics[] {
  return bundle.properties.map((p) => assemblePublicPropertyMetrics(p, bundle));
}
