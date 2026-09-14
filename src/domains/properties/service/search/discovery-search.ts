/**
 * Discovery search facade — organic PropertySearch + sponsored placements.
 * Organic ranking is computed first and never rewritten by Boost.
 */

import { createPropertySearchService } from "@/domains/properties/service/search/property-search-service";
import type { PropertySearchRepository } from "@/domains/properties/service/search/property-search-service";
import type { PropertySearchPageDto } from "@/domains/properties/service/search/search-dto";
import {
  composeDiscoverySearchPage,
  fetchSponsoredPlacements,
  type DiscoverySearchPageDto,
} from "@/domains/listing-promotions/sponsored-search";

export async function searchDiscovery(input: {
  raw: unknown;
  repository: PropertySearchRepository;
  includeSponsored?: boolean;
  sponsoredLimit?: number;
}): Promise<
  | { ok: true; page: DiscoverySearchPageDto & { items: PropertySearchPageDto["items"] } }
  | { ok: false; errors: string[]; warnings: string[] }
> {
  const organicService = createPropertySearchService({
    repository: input.repository,
  });
  const organic = await organicService.search(input.raw);
  if (!organic.ok) return organic;

  const filters = organic.page.appliedFilters;
  const sponsored =
    input.includeSponsored === false
      ? []
      : await fetchSponsoredPlacements({
          limit: input.sponsoredLimit,
          filters: {
            city: typeof filters.city === "string" ? filters.city : undefined,
            district:
              typeof filters.district === "string" ? filters.district : undefined,
            region: typeof filters.region === "string" ? filters.region : undefined,
            propertyType: Array.isArray(filters.propertyType)
              ? (filters.propertyType as string[])
              : undefined,
            transactionType:
              filters.transactionType === "SALE" || filters.transactionType === "RENT"
                ? filters.transactionType
                : undefined,
            priceMin:
              typeof filters.priceMin === "number" ? filters.priceMin : undefined,
            priceMax:
              typeof filters.priceMax === "number" ? filters.priceMax : undefined,
          },
        });

  const composed = composeDiscoverySearchPage({
    organicItems: organic.page.organicResults,
    sponsoredPlacements: sponsored,
    pagination: organic.page.pagination,
    sort: organic.page.sort,
    warnings: organic.page.warnings,
    appliedFilters: organic.page.appliedFilters,
  });

  return {
    ok: true,
    page: {
      ...composed,
      /** Backward-compatible alias = organic only. */
      items: composed.organicResults,
    },
  };
}
