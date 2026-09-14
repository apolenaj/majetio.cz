/**
 * LocationIntelligenceService — facade for property ↔ location integrations.
 * Personalized Finanční pas matches are computed per-request (not shared-cached).
 */

import type { PrismaClient } from "@prisma/client";
import type { MatchProfile } from "@/domains/properties/service/match-score";

import type {
  LocationMarketSummaryDto,
  PublicLocationDto,
} from "@/domains/locations/dto";
import { assertNotSharedPersonalizedCache } from "@/domains/locations/cache/location-cache";
import { resolveLocationIntelligenceForProperty } from "@/domains/locations/integration/location-integration-service";
import type {
  InvestmentLocationBenchmark,
  PropertySegmentBenchmark,
  ValuationLocationContext,
} from "@/domains/locations/integration/types";
import {
  createLocationScoreService,
  type LocationScoreService,
} from "@/domains/locations/service/location-score-service";
import { createLocationMarketService } from "@/domains/locations/service/location-market-service";
import { createLocationService } from "@/domains/locations/service/location-service";
import type { LocationMatchScore } from "@/domains/locations/scoring/types";
import { prisma } from "@/lib/db";

export type PropertyLocationIntelligence = {
  location: PublicLocationDto | null;
  marketSummary: LocationMarketSummaryDto | null;
  segmentBenchmark: PropertySegmentBenchmark;
  valuationContext: ValuationLocationContext | null;
  investmentBenchmark: InvestmentLocationBenchmark | null;
  locationPageHref: string | null;
  /** Per-user — never from shared cache. */
  matchScore: LocationMatchScore | null;
};

export class LocationIntelligenceService {
  private readonly locations: ReturnType<typeof createLocationService>;
  private readonly markets: ReturnType<typeof createLocationMarketService>;
  private readonly scores: LocationScoreService;

  constructor(private readonly db: PrismaClient = prisma) {
    this.locations = createLocationService(db);
    this.markets = createLocationMarketService(db);
    this.scores = createLocationScoreService();
  }

  /**
   * Property detail intelligence — reads precomputed metrics only.
   * @param matchProfile — when set, LocationMatchScore is computed (uncached).
   */
  async forProperty(input: {
    propertyType: string;
    condition?: string | null;
    layout?: string | null;
    pricePerSqm?: number | null;
    askingPrice?: number | null;
    usableArea?: number | null;
    locationCity?: string | null;
    locationDistrict?: string | null;
    locationSlug?: string | null;
    period?: string;
    matchProfile?: MatchProfile | null;
  }): Promise<PropertyLocationIntelligence> {
    const intel = await resolveLocationIntelligenceForProperty(input);
    const slug = intel.locationPageHref?.replace("/lokality/", "") ?? input.locationSlug;
    const location = slug ? await this.locations.getPublicBySlug(slug) : null;

    const marketSummary =
      slug != null
        ? await this.markets.getPublicMarketSummary({
            locationSlug: slug,
            period: input.period ?? "2026-07",
            segmentKey: intel.segmentBenchmark.segmentKey || undefined,
          })
        : null;

    let matchScore: LocationMatchScore | null = null;
    if (input.matchProfile && slug) {
      // Explicit: personalized matches must not use shared cache
      assertNotSharedPersonalizedCache("location-match");
      const profile = await import("@/domains/locations/service/location-page-service").then(
        (m) => m.loadLocationPageProfile(slug),
      );
      if (profile) {
        matchScore = this.scores.computeMatchScore({
          profile,
          matchProfile: input.matchProfile,
        });
      }
    }

    return {
      location,
      marketSummary,
      segmentBenchmark: intel.segmentBenchmark,
      valuationContext: intel.valuationContext,
      investmentBenchmark: intel.investmentBenchmark,
      locationPageHref: intel.locationPageHref,
      matchScore,
    };
  }
}

export function createLocationIntelligenceService(
  db: PrismaClient = prisma,
): LocationIntelligenceService {
  return new LocationIntelligenceService(db);
}
