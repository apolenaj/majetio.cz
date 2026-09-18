/**
 * Czech + Slovak regions for discovery map / pill filters.
 * Slugs are stable URL keys (`?kraje=praha,bratislavsky`).
 * Paths come from Simplemaps geographic SVGs (see region-geo-paths.ts).
 */

import {
  GEO_REGION_PATHS,
  type GeoRegionPath,
} from "@/domains/properties/search/region-geo-paths";

export type SearchRegionCountry = "CZ" | "SK";

export type SearchRegion = {
  id: string;
  /** Compact on-map label */
  short: string;
  /** Full name for pills / chips / a11y */
  label: string;
  /** Shorter label rendered inside the SVG */
  mapLabel: string;
  country: SearchRegionCountry;
  path: string;
  labelX: number;
  labelY: number;
};

export const SEARCH_REGIONS: readonly SearchRegion[] = GEO_REGION_PATHS.map(
  (r: GeoRegionPath) => ({
    id: r.id,
    short: r.short,
    label: r.label,
    mapLabel: r.mapLabel,
    country: r.country,
    path: r.path,
    // Praha sits inside Středočeský — nudge label so both stay readable
    labelX: r.id === "praha" ? r.labelX : r.labelX,
    labelY: r.id === "praha" ? r.labelY - 12 : r.labelY,
  }),
);

export const SEARCH_REGION_IDS = SEARCH_REGIONS.map((r) => r.id);

const BY_ID = new Map(SEARCH_REGIONS.map((r) => [r.id, r]));

export function getSearchRegion(id: string): SearchRegion | undefined {
  return BY_ID.get(id);
}

export function normalizeRegionSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/** Match listing region / city labels against selected kraje. */
export function listingMatchesRegions(
  listing: {
    location?: {
      region?: string | null;
      city?: string | null;
      label?: string | null;
      district?: string | null;
    } | null;
  },
  kraje: string[],
): boolean {
  if (!kraje.length) return true;
  const blob = normalizeRegionSlug(
    [
      listing.location?.region,
      listing.location?.city,
      listing.location?.district,
      listing.location?.label,
    ]
      .filter(Boolean)
      .join(" "),
  );
  if (!blob) return false;

  return kraje.some((id) => {
    const region = BY_ID.get(id);
    if (!region) return false;
    const labelNorm = normalizeRegionSlug(region.label);
    if (blob.includes(normalizeRegionSlug(id))) return true;
    if (labelNorm && blob.includes(labelNorm.replace(/kraj/g, ""))) return true;
    if (id === "praha" && (blob.includes("praha") || blob.includes("prague"))) {
      return true;
    }
    if (id === "vysocina" && blob.includes("vysocin")) return true;
    if (id === "bratislavsky" && blob.includes("bratislav")) return true;
    return false;
  });
}

export {
  CZ_MAP_VIEWBOX,
  SK_MAP_VIEWBOX,
  SK_MAP_OFFSET_X,
} from "@/domains/properties/search/region-geo-paths";
