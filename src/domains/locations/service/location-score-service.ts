/**
 * Location Score Service — assembles inputs and runs scoring pipeline.
 */

import type { MatchProfile } from "@/domains/properties/service/match-score";
import type { LocationPageProfile } from "@/domains/locations/types/location-page";
import {
  buildAccessibilityProfile,
  computeLocationMatchScore,
  computeLocationScore,
  matchProfileToLocationPreferences,
  type AccessibilityProfile,
  type EnvironmentalProfile,
  type LocationMatchScore,
  type LocationScoreInput,
  type LocationScoreResult,
  type PoiRecord,
} from "@/domains/locations/scoring";
import { inferPrimaryDimension } from "@/domains/locations/scoring/compute-location-score";

function parseMetricNumber(m: { value: number | null } | undefined): number | null {
  return m?.value ?? null;
}

export function buildLocationScoreInputFromProfile(input: {
  profile: LocationPageProfile;
  segmentKey?: string;
  pois?: PoiRecord[];
  environment?: EnvironmentalProfile | null;
  centroid?: { latitude: number; longitude: number };
}): LocationScoreInput {
  const segmentKey = input.segmentKey ?? input.profile.defaultSegmentKey;
  const summary = input.profile.summary;
  const supply = input.profile.supplyDemand;

  const getSummary = (key: string) => summary.find((m) => m.key === key);

  let accessibility: AccessibilityProfile | null = null;
  if (input.pois && input.pois.length > 0 && input.centroid) {
    accessibility = buildAccessibilityProfile({
      locationId: input.profile.location.id,
      centroid: input.centroid,
      pois: input.pois,
    });
  }

  return {
    locationId: input.profile.location.id,
    segmentKey,
    market: {
      medianAskingPriceSqm: parseMetricNumber(getSummary("property_market.median_asking_price_sqm")),
      medianTransactionPriceSqm: parseMetricNumber(
        getSummary("property_market.median_transaction_price_sqm"),
      ),
      medianAskingRentSqm: parseMetricNumber(getSummary("rental_market.median_asking_rent_sqm")),
      grossRentalYieldPct: parseMetricNumber(getSummary("investment.gross_rental_yield")),
      medianDaysOnMarket: parseMetricNumber(supply.medianDom),
      activeListingsCount: parseMetricNumber(supply.activeListings),
      priceReductionRate: parseMetricNumber(supply.priceReductionRate),
      sampleCounts: {
        ...(getSummary("property_market.median_transaction_price_sqm")?.sampleCount != null
          ? {
              transaction:
                getSummary("property_market.median_transaction_price_sqm")!.sampleCount!,
            }
          : {}),
      },
      confidences: {
        ...(getSummary("investment.gross_rental_yield")?.confidence != null
          ? { gross_rental_yield: getSummary("investment.gross_rental_yield")!.confidence! }
          : {}),
      },
    },
    accessibility,
    environment: input.environment ?? null,
  };
}

export class LocationScoreService {
  computeScore(
    scoreInput: LocationScoreInput,
    options?: { primaryDimension?: import("@/domains/locations/scoring/types").LocationScoreDimension | null },
  ): LocationScoreResult {
    return computeLocationScore(scoreInput, options);
  }

  computeMatchScore(input: {
    profile: LocationPageProfile;
    matchProfile?: MatchProfile | null;
    preferences?: import("@/domains/locations/scoring/types").LocationMatchPreferences;
    pois?: PoiRecord[];
    environment?: EnvironmentalProfile | null;
    centroid?: { latitude: number; longitude: number };
  }): LocationMatchScore {
    const scoreInput = buildLocationScoreInputFromProfile({
      profile: input.profile,
      pois: input.pois,
      environment: input.environment,
      centroid: input.centroid,
    });

    const preferences =
      input.preferences ??
      matchProfileToLocationPreferences(input.matchProfile);

    return computeLocationMatchScore({
      scoreInput,
      preferences,
      locationName: input.profile.location.name,
      locationSlug: input.profile.location.slug,
    });
  }

  computeFromPageProfile(
    profile: LocationPageProfile,
    matchProfile?: MatchProfile | null,
  ): {
    locationScore: LocationScoreResult;
    matchScore: LocationMatchScore;
  } {
    const scoreInput = buildLocationScoreInputFromProfile({ profile });
    const primary = inferPrimaryDimension({
      goal: matchProfile?.goal,
      strategies: matchProfile?.strategies,
    });

    const locationScore = computeLocationScore(scoreInput, { primaryDimension: primary });
    const matchScore = computeLocationMatchScore({
      scoreInput,
      preferences: matchProfileToLocationPreferences(matchProfile),
      locationName: profile.location.name,
      locationSlug: profile.location.slug,
    });

    return { locationScore, matchScore };
  }
}

export function createLocationScoreService(): LocationScoreService {
  return new LocationScoreService();
}
