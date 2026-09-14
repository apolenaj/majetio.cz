/**
 * Per-dimension score computation — raw inputs → normalization → weighted result.
 */

import {
  categoryFromAccessibilityKey,
  computeWeightedAccessibilityScore,
  relevanceProfileForDimension,
} from "@/domains/locations/scoring/amenities/relevance-profiles";
import { DIMENSION_REGISTRY } from "@/domains/locations/scoring/dimension-registry";
import {
  computeEnvironmentalImpacts,
  sumAdjustmentsForDimension,
} from "@/domains/locations/scoring/environment/compute-impacts";
import {
  clampScore,
  normalizeHigherIsBetter,
  normalizeLowerIsBetter,
  normalizePercentBand,
  weightedAverage,
} from "@/domains/locations/scoring/normalize";
import type {
  DimensionScoreResult,
  LocationScoreDimension,
  LocationScoreInput,
  NormalizedInput,
  RawInputValue,
} from "@/domains/locations/scoring/types";

function normInput(
  key: string,
  label: string,
  raw: RawInputValue,
  normalized: number | null,
  weight: number,
): NormalizedInput {
  return {
    key,
    label,
    raw,
    normalized,
    weight,
    available: normalized != null,
  };
}

function coverage(inputs: NormalizedInput[], required: string[]): number {
  if (required.length === 0) return 1;
  const available = required.filter((k) =>
    inputs.some((i) => i.key === k && i.available),
  );
  return available.length / required.length;
}

function buildOwnUseFit(input: LocationScoreInput): DimensionScoreResult {
  const def = DIMENSION_REGISTRY.OWN_USE_FIT;
  const rawInputs: Record<string, RawInputValue> = {};
  const parts: NormalizedInput[] = [];

  let accessibilityScore: number | null = null;
  let accessibilityConf = 0;

  if (input.accessibility) {
    const profile = relevanceProfileForDimension("OWN_USE_FIT");
    const weighted = computeWeightedAccessibilityScore(
      input.accessibility.subIndices,
      profile,
      categoryFromAccessibilityKey,
    );
    accessibilityScore = weighted.score;
    accessibilityConf = weighted.confidence;
    rawInputs.accessibility_score = accessibilityScore;
    rawInputs.accessibility_categories = weighted.usedCategories.join(",");
  } else {
    rawInputs.accessibility_score = null;
  }

  parts.push(
    normInput("accessibility_score", "Dostupnost služeb (Majetio)", accessibilityScore, accessibilityScore, 0.45),
  );

  const schoolSub = input.accessibility?.subIndices.find((s) =>
    s.key.includes("school"),
  );
  const schoolNorm = schoolSub?.value ?? null;
  rawInputs.school_proximity = schoolSub?.explanation ?? null;
  parts.push(normInput("school_proximity", "Dostupnost škol", schoolNorm, schoolNorm, 0.2));

  const greenSub = input.accessibility?.subIndices.find((s) =>
    s.key.includes("green"),
  );
  const greenNorm = greenSub?.value ?? null;
  rawInputs.green_proximity = greenSub?.explanation ?? null;
  parts.push(normInput("green_proximity", "Dostupnost zeleně", greenNorm, greenNorm, 0.15));

  const transitSub = input.accessibility?.subIndices.find(
    (s) => s.key.includes("metro") || s.key.includes("transit"),
  );
  const transitNorm = transitSub?.value ?? null;
  rawInputs.transit_proximity = transitSub?.explanation ?? null;
  parts.push(normInput("transit_proximity", "Dopravní dostupnost", transitNorm, transitNorm, 0.2));

  const cov = coverage(parts, def.requiredInputs);
  const { score: baseScore, confidence: baseConf } = weightedAverage(
    parts.map((p) => ({
      value: p.normalized,
      weight: p.weight,
      confidence: p.key === "accessibility_score" ? accessibilityConf : 0.75,
    })),
  );

  const envImpacts = computeEnvironmentalImpacts(input.environment);
  const envAdj = sumAdjustmentsForDimension(envImpacts, "OWN_USE_FIT");

  const missing = def.requiredInputs.filter(
    (k) => !parts.some((p) => p.key === k && p.available),
  );

  if (cov < def.minInputCoverage || baseScore == null) {
    return {
      dimension: "OWN_USE_FIT",
      availability: "insufficient_data",
      score: null,
      confidence: 0,
      weight: def.weight,
      rawInputs,
      normalizedInputs: parts,
      explanations: ["Nedostatek dat pro hodnocení vhodnosti pro vlastní bydlení."],
      missingInputs: missing,
    };
  }

  const finalScore = clampScore(baseScore + envAdj.total);
  return {
    dimension: "OWN_USE_FIT",
    availability: "available",
    score: finalScore,
    confidence: baseConf,
    weight: def.weight,
    rawInputs,
    normalizedInputs: parts,
    explanations: [
      `Dostupnost služeb pro vlastní bydlení: ${finalScore}/100.`,
      ...envAdj.reasons,
    ],
    missingInputs: missing,
  };
}

function buildRentalInvestmentFit(input: LocationScoreInput): DimensionScoreResult {
  const def = DIMENSION_REGISTRY.RENTAL_INVESTMENT_FIT;
  const m = input.market;
  const rawInputs: Record<string, RawInputValue> = {
    gross_rental_yield: m.grossRentalYieldPct ?? null,
    rent_level: m.medianAskingRentSqm ?? null,
    price_reduction_rate: m.priceReductionRate ?? null,
  };

  const parts: NormalizedInput[] = [
    normInput(
      "gross_rental_yield",
      "Hrubý výnos",
      m.grossRentalYieldPct ?? null,
      normalizeHigherIsBetter(m.grossRentalYieldPct, 5, 2.5),
      0.35,
    ),
    normInput(
      "rent_level",
      "Úroveň nájmu",
      m.medianAskingRentSqm ?? null,
      normalizeHigherIsBetter(m.medianAskingRentSqm, 400, 250),
      0.2,
    ),
    normInput(
      "price_reduction_rate",
      "Podíl slev (poptávka)",
      m.priceReductionRate ?? null,
      normalizeLowerIsBetter(m.priceReductionRate, 0.15, 0.35),
      0.15,
    ),
  ];

  if (input.accessibility) {
    const profile = relevanceProfileForDimension("RENTAL_INVESTMENT_FIT");
    const weighted = computeWeightedAccessibilityScore(
      input.accessibility.subIndices,
      profile,
      categoryFromAccessibilityKey,
    );
    rawInputs.transit_proximity = weighted.score;
    parts.push(
      normInput("transit_proximity", "MHD pro nájemníky", weighted.score, weighted.score, 0.3),
    );
  }

  const cov = coverage(parts, def.requiredInputs);
  const { score: baseScore, confidence } = weightedAverage(
    parts.map((p) => ({
      value: p.normalized,
      weight: p.weight,
      confidence: m.confidences?.gross_rental_yield ?? 0.7,
    })),
  );

  const envAdj = sumAdjustmentsForDimension(
    computeEnvironmentalImpacts(input.environment),
    "RENTAL_INVESTMENT_FIT",
  );

  const missing = def.requiredInputs.filter(
    (k) => !parts.some((p) => p.key === k && p.available),
  );

  if (cov < def.minInputCoverage || baseScore == null) {
    return {
      dimension: "RENTAL_INVESTMENT_FIT",
      availability: "insufficient_data",
      score: null,
      confidence: 0,
      weight: def.weight,
      rawInputs,
      normalizedInputs: parts,
      explanations: ["Nedostatek tržních dat pro nájemní investici."],
      missingInputs: missing,
    };
  }

  const finalScore = clampScore(baseScore + envAdj.total);
  return {
    dimension: "RENTAL_INVESTMENT_FIT",
    availability: "available",
    score: finalScore,
    confidence,
    weight: def.weight,
    rawInputs,
    normalizedInputs: parts,
    explanations: [
      `Vhodnost pro nájemní investici: ${finalScore}/100.`,
      m.grossRentalYieldPct != null
        ? `Hrubý výnos ${m.grossRentalYieldPct.toFixed(1)} %.`
        : "",
      ...envAdj.reasons,
    ].filter(Boolean),
    missingInputs: missing,
  };
}

function buildFlipFit(input: LocationScoreInput): DimensionScoreResult {
  const def = DIMENSION_REGISTRY.FLIP_FIT;
  const m = input.market;
  const txCount = m.sampleCounts?.transaction ?? null;

  const rawInputs: Record<string, RawInputValue> = {
    median_days_on_market: m.medianDaysOnMarket ?? null,
    price_reduction_rate: m.priceReductionRate ?? null,
    transaction_volume: txCount,
  };

  const parts: NormalizedInput[] = [
    normInput(
      "median_days_on_market",
      "Days on market",
      m.medianDaysOnMarket ?? null,
      normalizeLowerIsBetter(m.medianDaysOnMarket, 35, 90),
      0.4,
    ),
    normInput(
      "price_reduction_rate",
      "Podíl slev",
      m.priceReductionRate ?? null,
      normalizeLowerIsBetter(m.priceReductionRate, 0.18, 0.35),
      0.25,
    ),
    normInput(
      "transaction_volume",
      "Objem transakcí (vzorek)",
      txCount,
      normalizeHigherIsBetter(txCount, 50, 10),
      0.35,
    ),
  ];

  const momProxy = normalizePercentBand(
    m.medianAskingPriceSqm && m.medianTransactionPriceSqm
      ? ((m.medianAskingPriceSqm - m.medianTransactionPriceSqm) /
          m.medianTransactionPriceSqm) *
        100
      : null,
    8,
    5,
  );
  if (momProxy != null) {
    parts.push(
      normInput("asking_tx_spread", "Spread asking/transakce", momProxy, momProxy, 0.15),
    );
  }

  const cov = coverage(parts, def.requiredInputs);
  const { score: baseScore, confidence } = weightedAverage(
    parts.map((p) => ({ value: p.normalized, weight: p.weight, confidence: 0.75 })),
  );

  const envAdj = sumAdjustmentsForDimension(
    computeEnvironmentalImpacts(input.environment),
    "FLIP_FIT",
  );

  const missing = def.requiredInputs.filter(
    (k) => !parts.some((p) => p.key === k && p.available),
  );

  if (cov < def.minInputCoverage || baseScore == null) {
    return {
      dimension: "FLIP_FIT",
      availability: "insufficient_data",
      score: null,
      confidence: 0,
      weight: def.weight,
      rawInputs,
      normalizedInputs: parts,
      explanations: ["Nedostatek dat o likviditě pro flip."],
      missingInputs: missing,
    };
  }

  const finalScore = clampScore(baseScore + envAdj.total);
  return {
    dimension: "FLIP_FIT",
    availability: "available",
    score: finalScore,
    confidence,
    weight: def.weight,
    rawInputs,
    normalizedInputs: parts,
    explanations: [
      `Vhodnost pro flip: ${finalScore}/100.`,
      m.medianDaysOnMarket != null ? `Medián DOM ${Math.round(m.medianDaysOnMarket)} dní.` : "",
      ...envAdj.reasons,
    ].filter(Boolean),
    missingInputs: missing,
  };
}

function buildMarketLiquidity(input: LocationScoreInput): DimensionScoreResult {
  const def = DIMENSION_REGISTRY.MARKET_LIQUIDITY;
  const m = input.market;

  const rawInputs: Record<string, RawInputValue> = {
    median_days_on_market: m.medianDaysOnMarket ?? null,
    active_listings_count: m.activeListingsCount ?? null,
    price_reduction_rate: m.priceReductionRate ?? null,
  };

  const parts: NormalizedInput[] = [
    normInput(
      "median_days_on_market",
      "Medián DOM",
      m.medianDaysOnMarket ?? null,
      normalizeLowerIsBetter(m.medianDaysOnMarket, 30, 75),
      0.45,
    ),
    normInput(
      "active_listings_count",
      "Aktivní nabídka",
      m.activeListingsCount ?? null,
      normalizeHigherIsBetter(m.activeListingsCount, 400, 80),
      0.3,
    ),
    normInput(
      "price_reduction_rate",
      "Podíl slev",
      m.priceReductionRate ?? null,
      normalizeLowerIsBetter(m.priceReductionRate, 0.2, 0.4),
      0.25,
    ),
  ];

  const cov = coverage(parts, def.requiredInputs);
  const { score, confidence } = weightedAverage(
    parts.map((p) => ({ value: p.normalized, weight: p.weight, confidence: 0.8 })),
  );

  const missing = def.requiredInputs.filter(
    (k) => !parts.some((p) => p.key === k && p.available),
  );

  if (cov < def.minInputCoverage || score == null) {
    return {
      dimension: "MARKET_LIQUIDITY",
      availability: "insufficient_data",
      score: null,
      confidence: 0,
      weight: def.weight,
      rawInputs,
      normalizedInputs: parts,
      explanations: ["Nedostatek dat o likviditě trhu."],
      missingInputs: missing,
    };
  }

  return {
    dimension: "MARKET_LIQUIDITY",
    availability: "available",
    score,
    confidence,
    weight: def.weight,
    rawInputs,
    normalizedInputs: parts,
    explanations: [
      `Likvidita trhu: ${score}/100.`,
      m.medianDaysOnMarket != null
        ? `Medián days on market ${Math.round(m.medianDaysOnMarket)} dní.`
        : "",
    ].filter(Boolean),
    missingInputs: missing,
  };
}

const BUILDERS: Record<
  LocationScoreDimension,
  (input: LocationScoreInput) => DimensionScoreResult
> = {
  OWN_USE_FIT: buildOwnUseFit,
  RENTAL_INVESTMENT_FIT: buildRentalInvestmentFit,
  FLIP_FIT: buildFlipFit,
  MARKET_LIQUIDITY: buildMarketLiquidity,
};

export function computeDimensionScore(
  dimension: LocationScoreDimension,
  input: LocationScoreInput,
): DimensionScoreResult {
  return BUILDERS[dimension](input);
}

export function computeAllDimensionScores(
  input: LocationScoreInput,
): DimensionScoreResult[] {
  return (Object.keys(BUILDERS) as LocationScoreDimension[]).map((d) =>
    computeDimensionScore(d, input),
  );
}
