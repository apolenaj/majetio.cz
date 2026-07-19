/**
 * Map Finanční pas / PassportState → MatchProfile for recommendation scoring.
 */

import type { PassportState } from "@/lib/financial-passport/types";
import type { MatchProfile } from "./match-score";

export function passportToMatchProfile(
  state: PassportState | null | undefined,
): MatchProfile | null {
  if (!state) return null;
  return {
    maxPriceCzk: state.maxPriceCzk,
    preferredCity: state.preferredCity?.trim() || null,
    regions: state.regions ?? [],
    propertyTypes: (state.propertyTypes ?? []).map(String),
    dispositions: state.dispositions ?? [],
    minAreaSqm: state.minAreaSqm,
    maxAreaSqm: state.maxAreaSqm,
    strategies: state.strategies ?? [],
    riskTolerance: state.riskTolerance,
    goal: state.goal,
    targetGrossYieldPct: state.targetGrossYieldPct,
  };
}

export function listingToMatchInput(listing: {
  id: string;
  askingPrice?: number | null;
  location?: {
    city?: string | null;
    district?: string | null;
    region?: string | null;
  };
  propertyType?: string | null;
  layout?: string | null;
  usableArea?: number | null;
  condition?: string | null;
  strategySlugs?: string[];
  tags?: string[];
  grossYieldPct?: number | null;
  risk?: string | null;
  dataQuality?: string | null;
}) {
  return {
    id: listing.id,
    askingPrice: listing.askingPrice,
    locationCity: listing.location?.city,
    locationDistrict: listing.location?.district,
    locationRegion: listing.location?.region,
    propertyType: listing.propertyType,
    layout: listing.layout,
    usableArea: listing.usableArea,
    condition: listing.condition,
    strategySlugs: listing.strategySlugs,
    tags: listing.tags,
    grossYieldPct: listing.grossYieldPct,
    risk: listing.risk,
    dataQuality: listing.dataQuality,
  };
}
