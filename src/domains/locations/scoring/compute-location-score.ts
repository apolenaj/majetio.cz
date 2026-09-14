/**
 * Location Score orchestrator — multi-dimensional, no universal black-box.
 */

import { computeAllDimensionScores } from "@/domains/locations/scoring/compute-dimensions";
import { SCORE_DISCLAIMERS } from "@/domains/locations/scoring/guardrails";
import type {
  LocationScoreDimension,
  LocationScoreInput,
  LocationScoreResult,
} from "@/domains/locations/scoring/types";
import { LOCATION_SCORE_METHODOLOGY_VERSION } from "@/domains/locations/scoring/types";

export function inferPrimaryDimension(input: {
  goal?: string | null;
  strategies?: string[];
}): LocationScoreDimension | null {
  const strategies = input.strategies ?? [];
  if (input.goal === "OWN_HOME") return "OWN_USE_FIT";
  if (input.goal === "FLIP" || strategies.includes("flip")) return "FLIP_FIT";
  if (
    input.goal === "INVESTMENT" ||
    strategies.some((s) => s.includes("pronajem"))
  ) {
    return "RENTAL_INVESTMENT_FIT";
  }
  return null;
}

export function computeLocationScore(
  input: LocationScoreInput,
  options?: {
    /** When set, expose composite ONLY for this dimension (never a city-wide number). */
    primaryDimension?: LocationScoreDimension | null;
  },
): LocationScoreResult {
  const dimensions = computeAllDimensionScores(input);
  const primary =
    options?.primaryDimension ?? null;

  let strategyComposite: LocationScoreResult["strategyComposite"] = null;

  if (primary) {
    const dim = dimensions.find((d) => d.dimension === primary);
    if (dim?.availability === "available" && dim.score != null) {
      strategyComposite = {
        dimension: primary,
        score: dim.score,
        confidence: dim.confidence,
      };
    }
  }

  return {
    locationId: input.locationId,
    segmentKey: input.segmentKey,
    methodologyVersion: LOCATION_SCORE_METHODOLOGY_VERSION,
    computedAt: new Date().toISOString(),
    dimensions,
    strategyComposite,
    disclaimers: [...SCORE_DISCLAIMERS],
  };
}
