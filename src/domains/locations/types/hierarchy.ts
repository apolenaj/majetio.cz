/**
 * Canonical geographic hierarchy — shared graph types (Prompt 17.3).
 * Not every level exists for every place (e.g. village has no city_district).
 * Market-facing labels (kraj vs emirate) live in LocationTypeRegistry.
 */

import type { LocationType } from "@prisma/client";

/** Ordered from coarse to fine. */
export const LOCATION_TYPE_ORDER: readonly LocationType[] = [
  "COUNTRY",
  "REGION",
  "DISTRICT",
  "MUNICIPALITY",
  "CITY",
  "CITY_DISTRICT",
  "NEIGHBORHOOD",
  "MICRO_LOCATION",
] as const;

const TYPE_RANK = new Map<LocationType, number>(
  LOCATION_TYPE_ORDER.map((t, i) => [t, i]),
);

export function locationTypeRank(type: LocationType): number {
  return TYPE_RANK.get(type) ?? 0;
}

export function isFinerType(a: LocationType, b: LocationType): boolean {
  return locationTypeRank(a) > locationTypeRank(b);
}

export function isCoarserOrEqual(a: LocationType, b: LocationType): boolean {
  return locationTypeRank(a) <= locationTypeRank(b);
}

/** Czech admin labels for UI / docs. */
export const LOCATION_TYPE_LABELS_CS: Record<LocationType, string> = {
  COUNTRY: "Stát",
  REGION: "Kraj",
  DISTRICT: "Okres",
  MUNICIPALITY: "Obec",
  CITY: "Město",
  CITY_DISTRICT: "Městská část",
  NEIGHBORHOOD: "Čtvrť",
  MICRO_LOCATION: "Mikro-lokalita",
};

/**
 * Levels commonly skipped in CZ rural areas.
 */
export const OPTIONAL_CZ_LEVELS: readonly LocationType[] = [
  "CITY",
  "CITY_DISTRICT",
  "NEIGHBORHOOD",
  "MICRO_LOCATION",
];
