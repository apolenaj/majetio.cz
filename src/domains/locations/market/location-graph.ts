/**
 * Generic Location Graph helpers (Prompt 17.3).
 *
 * Persistence model is already `Location { type, parentId, countryCode, … }`.
 * Markets label levels via LocationTypeRegistry — same graph, different roles
 * (CZ kraj/okres/obec vs AE emirate/community/building).
 */

import type { LocationType } from "@prisma/client";

import {
  getLocationTypeRegistry,
  labelForLocationType,
  commonlyUsedLocationTypes,
  type MarketLocationTypeRegistry,
  type LocationTypeRegistryEntry,
} from "@/domains/locations/market/location-type-registry";
import {
  LOCATION_TYPE_ORDER,
  locationTypeRank,
  isFinerType,
} from "@/domains/locations/types/hierarchy";

export type LocationGraphNode = {
  id: string;
  type: LocationType;
  parentId: string | null;
  countryCode: string;
  name: string;
  slug: string;
};

/**
 * Walk parent chain coarse←fine until root (null parent).
 */
export function buildLocationPath(
  node: LocationGraphNode,
  byId: Map<string, LocationGraphNode>,
): LocationGraphNode[] {
  const path: LocationGraphNode[] = [];
  let current: LocationGraphNode | undefined = node;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.push(current);
    current = current.parentId
      ? byId.get(current.parentId)
      : undefined;
  }
  return path.reverse();
}

/**
 * Assert parent is coarser than child when both have known types.
 */
export function assertValidParentChild(input: {
  parentType: LocationType;
  childType: LocationType;
}): boolean {
  return isFinerType(input.childType, input.parentType);
}

export {
  getLocationTypeRegistry,
  labelForLocationType,
  commonlyUsedLocationTypes,
  LOCATION_TYPE_ORDER,
  locationTypeRank,
  type MarketLocationTypeRegistry,
  type LocationTypeRegistryEntry,
};
