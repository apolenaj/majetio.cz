/**
 * Fallback hierarchy for thin markets:
 * Neighborhood → City District → City → District
 * NEVER invent fake values — only inherit real parent metrics.
 */

import type { LocationType } from "@prisma/client";
import { locationTypeRank } from "@/domains/locations/types/hierarchy";
import type { FallbackResolution } from "@/domains/locations/ingestion/types";

/** Coarser levels to walk upward when sample insufficient. */
export const FALLBACK_HIERARCHY: LocationType[] = [
  "NEIGHBORHOOD",
  "CITY_DISTRICT",
  "CITY",
  "DISTRICT",
];

export type LocationNode = {
  id: string;
  type: LocationType;
  parentId: string | null;
  publicLabel?: string | null;
  name: string;
};

export type MetricAvailability = {
  locationId: string;
  sampleCount: number;
  display: boolean;
};

/**
 * Walk parent chain until a displayable metric with enough sample is found.
 * Returns null resolution data availability — caller must NOT invent values.
 */
export function resolveFallbackLocation(input: {
  requested: LocationNode;
  ancestors: LocationNode[];
  availabilityByLocationId: Map<string, MetricAvailability>;
  minSampleCount: number;
}): FallbackResolution | null {
  const chain = [input.requested, ...input.ancestors].sort(
    (a, b) => locationTypeRank(b.type) - locationTypeRank(a.type),
  );

  // Prefer requested first
  const ordered: LocationNode[] = [];
  const seen = new Set<string>();
  let cursor: LocationNode | undefined = input.requested;
  const byId = new Map(chain.map((n) => [n.id, n]));

  while (cursor && !seen.has(cursor.id)) {
    ordered.push(cursor);
    seen.add(cursor.id);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  // Also append any remaining ancestors sorted coarse-ward
  for (const a of input.ancestors) {
    if (!seen.has(a.id)) ordered.push(a);
  }

  for (const node of ordered) {
    const avail = input.availabilityByLocationId.get(node.id);
    if (!avail?.display) continue;
    if (avail.sampleCount < input.minSampleCount) continue;

    const usedFallback = node.id !== input.requested.id;
    return {
      resolvedLocationId: node.id,
      requestedLocationId: input.requested.id,
      usedFallback,
      fallbackChain: ordered.map((n) => n.id),
      uiMessage: usedFallback
        ? `Data vycházejí z širší oblasti (${node.publicLabel ?? node.name}).`
        : null,
    };
  }

  return null;
}
