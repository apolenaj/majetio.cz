/**
 * Precomputed outputs for Majetio score + recommendation/search (job queue later).
 */

import { scrubCommercialSignalsFromFeatures } from "@/domains/listing-promotions/commercial-firewall";

export type YieldCfQualityBand = "strong" | "adequate" | "weak" | "unknown";
export type ReturnResilienceBand = "resilient" | "moderate" | "fragile" | "unknown";

export type MajetioScoreFeatures = {
  schemaVersion: "1.0.0";
  scenarioId: string | null;
  propertyId: string | null;
  assumptionConfigVersion: string;
  engineVersion: string;
  /** Net yield ratio (NOI/TAC) or null. */
  netYield: number | null;
  /** Monthly leveraged CF (major units). */
  monthlyCashFlow: number | null;
  dscr: number | null;
  ltv: number | null;
  yieldCfQuality: YieldCfQualityBand;
  returnResilience: ReturnResilienceBand;
  /** Opaque feature vector for future ML / ranking. */
  features: Record<string, number | null>;
  computedAt: string;
};

export type RecommendationSearchDocument = {
  schemaVersion: "1.0.0";
  propertyId: string;
  scenarioVariant: string;
  netYield: number | null;
  monthlyCashFlow: number | null;
  city: string | null;
  propertyType: string | null;
  askingPrice: number | null;
  scoreFeatures: MajetioScoreFeatures;
  /** Ready for queue worker: "pending" until job runs. */
  indexStatus: "pending" | "indexed" | "skipped";
};

export function classifyYieldCfQuality(input: {
  netYield: number | null;
  monthlyCashFlow: number | null;
}): YieldCfQualityBand {
  if (input.netYield == null || input.monthlyCashFlow == null) return "unknown";
  if (input.netYield >= 0.05 && input.monthlyCashFlow > 0) return "strong";
  if (input.netYield >= 0.03 && input.monthlyCashFlow >= 0) return "adequate";
  return "weak";
}

export function classifyReturnResilience(input: {
  dscr: number | null;
  /** Conservative CF / base CF — optional. */
  conservativeCfRatio: number | null;
}): ReturnResilienceBand {
  if (input.dscr == null) return "unknown";
  const stressOk =
    input.conservativeCfRatio == null || input.conservativeCfRatio >= 0;
  if (input.dscr >= 1.4 && stressOk) return "resilient";
  if (input.dscr >= 1.1) return "moderate";
  return "fragile";
}

export function buildMajetioScoreFeatures(input: {
  scenarioId?: string | null;
  propertyId?: string | null;
  assumptionConfigVersion: string;
  engineVersion: string;
  netYield: number | null;
  monthlyCashFlow: number | null;
  dscr: number | null;
  ltv: number | null;
  conservativeMonthlyCf?: number | null;
}): MajetioScoreFeatures {
  const yieldCfQuality = classifyYieldCfQuality({
    netYield: input.netYield,
    monthlyCashFlow: input.monthlyCashFlow,
  });
  const conservativeCfRatio =
    input.monthlyCashFlow != null &&
    input.monthlyCashFlow !== 0 &&
    input.conservativeMonthlyCf != null
      ? input.conservativeMonthlyCf / input.monthlyCashFlow
      : null;
  const returnResilience = classifyReturnResilience({
    dscr: input.dscr,
    conservativeCfRatio,
  });

  const rawFeatures = {
    netYield: input.netYield,
    monthlyCashFlow: input.monthlyCashFlow,
    dscr: input.dscr,
    ltv: input.ltv,
    conservativeCfRatio,
  };

  return {
    schemaVersion: "1.0.0",
    scenarioId: input.scenarioId ?? null,
    propertyId: input.propertyId ?? null,
    assumptionConfigVersion: input.assumptionConfigVersion,
    engineVersion: input.engineVersion,
    netYield: input.netYield,
    monthlyCashFlow: input.monthlyCashFlow,
    dscr: input.dscr,
    ltv: input.ltv,
    yieldCfQuality,
    returnResilience,
    // 218/224 — never persist commercial boost keys into score features
    features: scrubCommercialSignalsFromFeatures(rawFeatures),
    computedAt: new Date().toISOString(),
  };
}

/**
 * Placeholder enqueue for future job queue (BullMQ / etc.).
 * Does not perform I/O — returns a pending document for the worker.
 */
export function enqueueRecommendationIndex(
  doc: Omit<RecommendationSearchDocument, "indexStatus">,
): RecommendationSearchDocument {
  return { ...doc, indexStatus: "pending" };
}
