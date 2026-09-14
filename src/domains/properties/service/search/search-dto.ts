/**
 * Public search result DTOs (Prompt 8 Part 1).
 * List cards only — no precise address, notes, or audit.
 */

import {
  toPublicPropertyListItemDto,
  type PropertyRecord,
  type PublicPropertyListItemDto,
  type ToPublicDtoOptions,
} from "../dto";

export type PropertySearchHitDto = PublicPropertyListItemDto;

/**
 * Legacy page shape — `items` is organic-only.
 * Prefer DiscoverySearchPageDto (`organicResults` + `sponsoredPlacements`).
 */
export type PropertySearchPageDto = {
  /** @deprecated Use organicResults — organic-only, never boost-ranked. */
  items: PropertySearchHitDto[];
  /** Organic results — sort/rank never uses ListingBoost. */
  organicResults: PropertySearchHitDto[];
  /** Paid slots — always labeled Sponzorováno; separate from organic. */
  sponsoredPlacements: Array<{
    placementId: string;
    sponsored: true;
    label: string;
    productKey: string;
    endsAt: string | null;
    property: PropertySearchHitDto;
  }>;
  pagination: {
    mode: "page" | "cursor";
    page?: number;
    pageSize: number;
    total?: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  sort: {
    field: string;
    direction: "asc" | "desc";
  };
  warnings: string[];
  /** Echo of applied (normalized) filters for UI chips — safe values only. */
  appliedFilters: Record<string, unknown>;
  integrity: {
    boostAffectsOrganicRanking: false;
    boostAffectsMajetioScore: false;
    boostAffectsValuation: false;
    boostAffectsRiskAnalysis: false;
    sponsoredLabelRequired: true;
  };
};

export function toSearchHitDto(
  record: PropertyRecord,
  opts?: ToPublicDtoOptions,
): PropertySearchHitDto {
  return toPublicPropertyListItemDto(record, opts);
}
