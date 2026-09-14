/**
 * LocationMatchScore — explainable fit between location and user preferences.
 */

import type { MatchProfile } from "@/domains/properties/service/match-score";
import { DIMENSION_REGISTRY } from "@/domains/locations/scoring/dimension-registry";
import { normalizeLowerIsBetter } from "@/domains/locations/scoring/normalize";
import type {
  LocationMatchPreferences,
  LocationMatchReason,
  LocationMatchScore,
  LocationScoreInput,
} from "@/domains/locations/scoring/types";

import { computeLocationScore, inferPrimaryDimension } from "@/domains/locations/scoring/compute-location-score";

const FOLD = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

export function matchProfileToLocationPreferences(
  profile: MatchProfile | null | undefined,
): LocationMatchPreferences {
  if (!profile) return {};
  return {
    maxPriceCzk: profile.maxPriceCzk,
    preferredCity: profile.preferredCity,
    regions: profile.regions,
    strategies: profile.strategies,
    goal: profile.goal,
    targetGrossYieldPct: profile.targetGrossYieldPct,
    riskTolerance: profile.riskTolerance,
    primaryDimension: inferPrimaryDimension({
      goal: profile.goal,
      strategies: profile.strategies,
    }),
  };
}

export function isLocationMatchProfileComplete(
  prefs: LocationMatchPreferences,
): boolean {
  const hasBudget =
    (prefs.maxPriceCzk != null && prefs.maxPriceCzk > 0) ||
    (prefs.maxPricePerSqm != null && prefs.maxPricePerSqm > 0);
  const hasLocation =
    Boolean(prefs.preferredCity?.trim()) || (prefs.regions?.length ?? 0) > 0;
  const hasStrategy =
    Boolean(prefs.goal) || (prefs.strategies?.length ?? 0) > 0;
  return hasBudget || hasLocation || hasStrategy;
}

export function computeLocationMatchScore(input: {
  scoreInput: LocationScoreInput;
  preferences: LocationMatchPreferences;
  locationName: string;
  locationSlug: string;
}): LocationMatchScore {
  const { preferences: prefs, scoreInput, locationName, locationSlug } = input;

  if (!isLocationMatchProfileComplete(prefs)) {
    return {
      available: false,
      score: null,
      confidence: 0,
      emphasizedDimension: null,
      reasons: [
        {
          code: "PROFILE_INCOMPLETE",
          tone: "neutral",
          label: "Doplňte Finanční pas pro shodu lokality s cíli",
        },
      ],
      profileComplete: false,
      dimensionScores: [],
    };
  }

  const primaryDim =
    prefs.primaryDimension ??
    inferPrimaryDimension({ goal: prefs.goal, strategies: prefs.strategies });

  const locationScore = computeLocationScore(scoreInput, {
    primaryDimension: primaryDim,
  });

  const reasons: LocationMatchReason[] = [];
  let points = 0;
  let maxPoints = 0;

  // Location name fit (25)
  maxPoints += 25;
  const preferred = prefs.preferredCity ? FOLD(prefs.preferredCity) : "";
  const nameFold = FOLD(locationName);
  const slugFold = FOLD(locationSlug);
  if (
    preferred &&
    (nameFold.includes(preferred) ||
      preferred.includes(nameFold) ||
      slugFold.includes(preferred))
  ) {
    points += 25;
    reasons.push({
      code: "LOCATION_CITY",
      tone: "positive",
      label: `✓ Lokalita odpovídá preferenci (${prefs.preferredCity})`,
    });
  } else if ((prefs.regions ?? []).some((r) => nameFold.includes(FOLD(r)))) {
    points += 18;
    reasons.push({
      code: "LOCATION_REGION",
      tone: "positive",
      label: "✓ V preferovaném regionu",
    });
  } else if (preferred || (prefs.regions?.length ?? 0) > 0) {
    reasons.push({
      code: "LOCATION_MISS",
      tone: "warning",
      label: "! Mimo preferovanou lokalitu",
    });
  }

  // Budget vs median price (30)
  maxPoints += 30;
  const medianSqm = scoreInput.market.medianAskingPriceSqm;
  const maxPerSqm =
    prefs.maxPricePerSqm ??
    (prefs.maxPriceCzk && medianSqm
      ? prefs.maxPriceCzk / 70
      : null);

  if (maxPerSqm != null && medianSqm != null) {
    if (medianSqm <= maxPerSqm) {
      points += 30;
      reasons.push({
        code: "BUDGET_OK",
        tone: "positive",
        label: "✓ Medián cen spadá do vašeho rozpočtu",
      });
    } else if (medianSqm <= maxPerSqm * 1.1) {
      points += 15;
      reasons.push({
        code: "BUDGET_TIGHT",
        tone: "warning",
        label: "! Medián mírně nad rozpočtem (+10 %)",
      });
    } else {
      reasons.push({
        code: "BUDGET_OVER",
        tone: "warning",
        label: "! Medián cen nad vaším rozpočtem",
      });
    }
  } else {
    reasons.push({
      code: "BUDGET_UNKNOWN",
      tone: "neutral",
      label: "Nelze ověřit rozpočet — chybí medián cen nebo limit",
    });
  }

  // Strategy dimension fit (35)
  maxPoints += 35;
  const emphasized = primaryDim
    ? locationScore.dimensions.find((d) => d.dimension === primaryDim)
    : null;

  if (emphasized?.availability === "available" && emphasized.score != null) {
    const dimPoints = Math.round((emphasized.score / 100) * 35);
    points += dimPoints;
    const dimLabel = DIMENSION_REGISTRY[emphasized.dimension].labelCs;
    reasons.push({
      code: "DIMENSION_FIT",
      tone: emphasized.score >= 65 ? "positive" : "neutral",
      label: `${emphasized.score >= 65 ? "✓" : "–"} ${dimLabel}: ${emphasized.score}/100`,
    });
    for (const ex of emphasized.explanations.slice(0, 2)) {
      reasons.push({ code: "DIMENSION_DETAIL", tone: "neutral", label: ex });
    }
  } else if (primaryDim) {
    reasons.push({
      code: "DIMENSION_UNAVAILABLE",
      tone: "neutral",
      label: `Skóre „${DIMENSION_REGISTRY[primaryDim].labelCs}“ není k dispozici — chybí data`,
    });
  }

  // Yield target (10 bonus)
  maxPoints += 10;
  const yieldPct = scoreInput.market.grossRentalYieldPct;
  if (prefs.targetGrossYieldPct != null && yieldPct != null) {
    const yieldNorm = normalizeLowerIsBetter(
      prefs.targetGrossYieldPct - yieldPct,
      0,
      1.5,
    );
    if (yieldNorm != null && yieldNorm >= 70) {
      points += 10;
      reasons.push({
        code: "YIELD_OK",
        tone: "positive",
        label: "✓ Hrubý výnos plní cíl",
      });
    } else {
      reasons.push({
        code: "YIELD_LOW",
        tone: "neutral",
        label: "Hrubý výnos pod cílovou hodnotou",
      });
    }
  }

  const compositeAvailable = emphasized?.score != null;
  const matchScore =
    maxPoints === 0
      ? null
      : Math.round(Math.min(100, Math.max(0, (points / maxPoints) * 100)));

  const confidence = compositeAvailable
    ? Math.min(0.95, (emphasized?.confidence ?? 0.5) * 0.7 + 0.3)
    : 0.4;

  const selected = [
    ...reasons.filter((r) => r.tone === "positive").slice(0, 3),
    ...reasons.filter((r) => r.tone === "warning").slice(0, 2),
    ...reasons.filter((r) => r.tone === "neutral").slice(0, 2),
  ].slice(0, 6);

  return {
    available: matchScore != null && compositeAvailable,
    score: compositeAvailable ? matchScore : null,
    confidence,
    emphasizedDimension: primaryDim,
    reasons:
      selected.length > 0
        ? selected
        : [
            {
              code: "NO_MATCH",
              tone: "neutral",
              label: "Nedostatek dat pro vyhodnocení shody",
            },
          ],
    profileComplete: isLocationMatchProfileComplete(prefs),
    dimensionScores: locationScore.dimensions.map((d) => ({
      dimension: d.dimension,
      score: d.score,
      confidence: d.confidence,
      availability: d.availability,
    })),
  };
}
