/**
 * Recommendation / analytics commercial firewall (checklist 218, 217, 224).
 *
 * Paid Boost / sponsored placement signals must NEVER enter:
 * - Majetio Score feature vectors
 * - Valuation inputs
 * - Organic recommendation ranking
 */

import type { MajetioScoreFeatures } from "@/domains/investment/integrations/score-search-dto";
import {
  boost7DaysProduct,
  boost30DaysProduct,
} from "@/config/listing-promotions";

/** Keys that must never appear in score / recommendation feature maps. */
export const FORBIDDEN_COMMERCIAL_FEATURE_KEYS = [
  "placementWeight",
  "boost",
  "boosted",
  "sponsored",
  "sponsoredPlacement",
  "listingBoost",
  "listingBoostId",
  "paidPlacement",
  "adWeight",
  "promoWeight",
  "boost_7_days",
  "boost_30_days",
] as const;

export type ForbiddenCommercialFeatureKey =
  (typeof FORBIDDEN_COMMERCIAL_FEATURE_KEYS)[number];

export const COMMERCIAL_FIREWALL_CONTRACT = {
  boostAffectsMajetioScore: false,
  boostAffectsValuation: false,
  boostAffectsRiskAnalysis: false,
  boostAffectsOrganicRanking: false,
  boostAffectsRecommendations: false,
  sponsoredLabelRequired: true,
} as const;

/** Product-level firewall must stay hard-false (never flip via env). */
export function assertProductFirewallHardFalse(): {
  ok: true;
} | { ok: false; violations: string[] } {
  const violations: string[] = [];
  for (const p of [boost7DaysProduct, boost30DaysProduct]) {
    const f = p.firewall;
    if (f.affectsMajetioScore) violations.push(`${p.productKey}.affectsMajetioScore`);
    if (f.affectsValuation) violations.push(`${p.productKey}.affectsValuation`);
    if (f.affectsRiskAnalysis) violations.push(`${p.productKey}.affectsRiskAnalysis`);
    if (f.affectsOrganicRanking) violations.push(`${p.productKey}.affectsOrganicRanking`);
  }
  if (
    COMMERCIAL_FIREWALL_CONTRACT.boostAffectsMajetioScore ||
    COMMERCIAL_FIREWALL_CONTRACT.boostAffectsOrganicRanking
  ) {
    violations.push("COMMERCIAL_FIREWALL_CONTRACT");
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

export function scrubCommercialSignalsFromFeatures(
  features: Record<string, number | null | undefined>,
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(features)) {
    if (
      (FORBIDDEN_COMMERCIAL_FEATURE_KEYS as readonly string[]).includes(key)
    ) {
      continue;
    }
    out[key] = value ?? null;
  }
  return out;
}

/**
 * Stable fingerprint of analytical score inputs — ignores computedAt and
 * any commercial keys that might have been injected by a buggy caller.
 */
export function majetioScoreIntegrityFingerprint(
  score: MajetioScoreFeatures,
): string {
  const features = scrubCommercialSignalsFromFeatures(score.features);
  const payload = {
    schemaVersion: score.schemaVersion,
    scenarioId: score.scenarioId,
    propertyId: score.propertyId,
    assumptionConfigVersion: score.assumptionConfigVersion,
    engineVersion: score.engineVersion,
    netYield: score.netYield,
    monthlyCashFlow: score.monthlyCashFlow,
    dscr: score.dscr,
    ltv: score.ltv,
    yieldCfQuality: score.yieldCfQuality,
    returnResilience: score.returnResilience,
    features,
  };
  return JSON.stringify(payload);
}

/**
 * Prove score is unchanged when a commercial boost signal is present on the side.
 * Boost metadata must not be an input to buildMajetioScoreFeatures.
 */
export function assertScoreUnchangedByBoost(input: {
  scoreBeforeBoost: MajetioScoreFeatures;
  scoreAfterBoost: MajetioScoreFeatures;
}): { ok: true } | { ok: false; reason: string } {
  const a = majetioScoreIntegrityFingerprint(input.scoreBeforeBoost);
  const b = majetioScoreIntegrityFingerprint(input.scoreAfterBoost);
  if (a !== b) {
    return {
      ok: false,
      reason: "Majetio Score fingerprint changed after boost — firewall breach.",
    };
  }
  return { ok: true };
}

export function detectCommercialContamination(
  features: Record<string, unknown>,
): ForbiddenCommercialFeatureKey[] {
  return FORBIDDEN_COMMERCIAL_FEATURE_KEYS.filter((k) => k in features);
}
