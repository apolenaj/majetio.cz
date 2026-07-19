/**
 * Cached valuation load for property detail (Prompt 10 Part 5).
 * Dedupes estimateForProperty within a request (metadata + page) — no N+1 recompute.
 */

import { cache } from "react";

import { valuationService, type ValuationDto } from "@/domains/valuation";
import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import {
  loadPropertyDetailBySlug,
  resolvePropertyViewer,
} from "@/domains/properties/service/detail-loader";

export const loadPropertyValuationBySlug = cache(
  async (slug: string): Promise<ValuationDto | null> => {
    const property = await loadPropertyDetailBySlug(slug);
    if (!property) return null;
    const viewer = await resolvePropertyViewer();
    return valuationService.estimateForProperty(property, viewer);
  },
);

/** When the page already has the DTO, still cache by id+role to avoid double engine runs. */
export const estimateValuationCached = cache(
  async (
    propertyId: string,
    property: PublicPropertyDto,
    viewerRole: string,
  ): Promise<ValuationDto> => {
    void propertyId;
    return valuationService.estimateForProperty(property, { role: viewerRole });
  },
);
