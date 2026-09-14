/**
 * Server helper: map active sponsored placements → PropertyCardData.
 * Failures return [] so organic SERP never breaks.
 */

import type { PropertyCardData } from "@/components/property/property-card";
import { mapPublicDtoToPropertyCard } from "@/domains/properties/service/card-mapper";
import { fetchSponsoredPlacements } from "./sponsored-search";

export async function loadSponsoredPropertyCards(input?: {
  city?: string;
  propertyType?: string[];
  priceMin?: number;
  priceMax?: number;
  limit?: number;
}): Promise<PropertyCardData[]> {
  try {
    const placements = await fetchSponsoredPlacements({
      filters: {
        city: input?.city,
        propertyType: input?.propertyType,
        priceMin: input?.priceMin,
        priceMax: input?.priceMax,
      },
      limit: input?.limit ?? 4,
    });
    return placements.map((p) => ({
      ...mapPublicDtoToPropertyCard(p.property),
      sponsored: true,
    }));
  } catch {
    return [];
  }
}
