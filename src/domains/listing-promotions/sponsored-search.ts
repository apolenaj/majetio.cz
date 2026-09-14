/**
 * Sponsored placement fetch — SEPARATE from organic search ranking.
 *
 * FIREWALL:
 * - Must not mutate organic ORDER BY / match score
 * - Every placement carries sponsored: true + label "Sponzorováno"
 */

import {
  SPONSORED_LABEL_CS,
  SPONSORED_PLACEMENTS_PER_PAGE,
} from "@/config/listing-promotions";
import { prisma } from "@/lib/db";
import type { PropertySearchHitDto } from "@/domains/properties/service/search/search-dto";
import { toSearchHitDto } from "@/domains/properties/service/search/search-dto";
import type { PropertyRecord } from "@/domains/properties/service/dto";
import { assertBoostEligibility } from "./eligibility";

export type SponsoredPlacementDto = {
  placementId: string;
  /** Always true — paid display disclosure. */
  sponsored: true;
  /** Always "Sponzorováno" (or snapshot label). */
  label: string;
  productKey: string;
  endsAt: string | null;
  property: PropertySearchHitDto;
};

export type DiscoverySearchPageDto = {
  /**
   * Organic results only — sort/rank never uses ListingBoost.
   * May optionally exclude IDs already shown in sponsoredPlacements (UX dedupe).
   */
  organicResults: PropertySearchHitDto[];
  /**
   * Paid slots — rendered separately, always labeled Sponzorováno.
   * Ordering uses placementWeight among ads only (never organic score).
   */
  sponsoredPlacements: SponsoredPlacementDto[];
  pagination: {
    mode: "page" | "cursor";
    page?: number;
    pageSize: number;
    total?: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  sort: { field: string; direction: "asc" | "desc" };
  warnings: string[];
  appliedFilters: Record<string, unknown>;
  /**
   * Explicit contract echo for clients / audits.
   */
  integrity: {
    boostAffectsOrganicRanking: false;
    boostAffectsMajetioScore: false;
    boostAffectsValuation: false;
    boostAffectsRiskAnalysis: false;
    boostAffectsRecommendations: false;
    sponsoredLabelRequired: true;
  };
};

export type SponsoredPlacementFilters = {
  city?: string;
  district?: string;
  region?: string;
  propertyType?: string[];
  transactionType?: "SALE" | "RENT";
  priceMin?: number;
  priceMax?: number;
};

/**
 * Load active boosts whose properties still pass eligibility + optional geo filters.
 * Sort: placementWeight desc, endsAt asc — NEVER majetio score.
 */
export async function fetchSponsoredPlacements(input: {
  filters?: SponsoredPlacementFilters;
  limit?: number;
  excludePropertyIds?: string[];
  now?: Date;
}): Promise<SponsoredPlacementDto[]> {
  const now = input.now ?? new Date();
  // 181 — expire before serving ads so stale boosts never appear
  const { expireListingBoosts } = await import("./service");
  await expireListingBoosts(now);

  if (!(await import("@/config/feature-flags")).isFeatureEnabled("LISTING_BOOST_ENABLED")) {
    return [];
  }

  const limit = Math.min(
    Math.max(1, input.limit ?? SPONSORED_PLACEMENTS_PER_PAGE),
    10,
  );

  const propertyWhere: Record<string, unknown> = {
    status: "ACTIVE",
    visibility: "PUBLIC",
    listingModerationStatus: "CLEAR",
    listingQuotaState: "WITHIN_LIMIT",
    listingVerificationStatus: { not: "UNVERIFIED" },
    isDemo: false,
  };

  if (input.filters?.city) propertyWhere.publicCity = input.filters.city;
  if (input.filters?.district) propertyWhere.publicDistrict = input.filters.district;
  if (input.filters?.region) propertyWhere.publicRegion = input.filters.region;
  if (input.filters?.transactionType) {
    propertyWhere.transactionType = input.filters.transactionType;
  }
  if (input.filters?.propertyType?.length) {
    propertyWhere.propertyType = { in: input.filters.propertyType };
  }
  if (input.filters?.priceMin != null || input.filters?.priceMax != null) {
    propertyWhere.askingPrice = {
      ...(input.filters.priceMin != null ? { gte: input.filters.priceMin } : {}),
      ...(input.filters.priceMax != null ? { lte: input.filters.priceMax } : {}),
    };
  }
  if (input.excludePropertyIds?.length) {
    propertyWhere.id = { notIn: input.excludePropertyIds };
  }

  const boosts = await prisma.listingBoost.findMany({
    where: {
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      property: propertyWhere,
    },
    orderBy: [{ placementWeight: "desc" }, { endsAt: "asc" }, { createdAt: "asc" }],
    take: limit * 2,
    include: {
      property: true,
    },
  });

  const placements: SponsoredPlacementDto[] = [];
  for (const boost of boosts) {
    const elig = assertBoostEligibility(boost.property);
    if (!elig.ok) continue;

    placements.push({
      placementId: boost.id,
      sponsored: true,
      label: boost.sponsoredLabel || SPONSORED_LABEL_CS,
      productKey: boost.productKey,
      endsAt: boost.endsAt ? boost.endsAt.toISOString() : null,
      property: toSearchHitDto(boost.property as unknown as PropertyRecord),
    });
    if (placements.length >= limit) break;
  }

  return placements;
}

/**
 * Compose discovery page: organic + sponsored (strictly separated).
 * Organic array is never re-sorted by boost.
 */
export function composeDiscoverySearchPage(input: {
  organicItems: PropertySearchHitDto[];
  sponsoredPlacements: SponsoredPlacementDto[];
  pagination: DiscoverySearchPageDto["pagination"];
  sort: DiscoverySearchPageDto["sort"];
  warnings: string[];
  appliedFilters: Record<string, unknown>;
  /** Default true — hide organic cards that already appear as sponsored on this page. */
  dedupeOrganicAgainstSponsored?: boolean;
}): DiscoverySearchPageDto {
  const sponsoredIds = new Set(
    input.sponsoredPlacements.map((p) => p.property.id),
  );
  const dedupe = input.dedupeOrganicAgainstSponsored !== false;
  const organicResults = dedupe
    ? input.organicItems.filter((item) => !sponsoredIds.has(item.id))
    : input.organicItems;

  // Integrity: never mutate sponsored into organic order
  return {
    organicResults,
    sponsoredPlacements: input.sponsoredPlacements.map((p) => ({
      ...p,
      sponsored: true as const,
      label: p.label || SPONSORED_LABEL_CS,
    })),
    pagination: input.pagination,
    sort: input.sort,
    warnings: input.warnings,
    appliedFilters: input.appliedFilters,
    integrity: {
      boostAffectsOrganicRanking: false,
      boostAffectsMajetioScore: false,
      boostAffectsValuation: false,
      boostAffectsRiskAnalysis: false,
      boostAffectsRecommendations: false,
      sponsoredLabelRequired: true,
    },
  };
}
