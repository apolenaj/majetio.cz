/**
 * Czech + Slovak regions for discovery map / pill filters.
 * Slugs are stable URL keys (`?kraje=praha,bratislavsky`).
 */

export type SearchRegionCountry = "CZ" | "SK";

export type SearchRegion = {
  id: string;
  /** Short badge label */
  short: string;
  /** Full name shown in chips / a11y */
  label: string;
  country: SearchRegionCountry;
  /** Approximate SVG path in viewBox 0 0 720 340 */
  path: string;
};

/** Stylized schematic map — not cadastral geometry; enough for interactive selection UX. */
export const SEARCH_REGIONS: readonly SearchRegion[] = [
  // ——— Czechia (west → east) ———
  {
    id: "karlovarsky",
    short: "KVK",
    label: "Karlovarský kraj",
    country: "CZ",
    path: "M28,118 L78,102 L98,128 L88,168 L48,178 L22,148 Z",
  },
  {
    id: "ustecky",
    short: "ULK",
    label: "Ústecký kraj",
    country: "CZ",
    path: "M78,102 L138,78 L168,98 L158,138 L118,148 L98,128 Z",
  },
  {
    id: "liberecky",
    short: "LBK",
    label: "Liberecký kraj",
    country: "CZ",
    path: "M168,98 L218,72 L248,98 L228,138 L178,142 L158,118 Z",
  },
  {
    id: "kralovehradecky",
    short: "HKK",
    label: "Královéhradecký kraj",
    country: "CZ",
    path: "M248,98 L308,78 L338,108 L318,148 L268,152 L228,128 Z",
  },
  {
    id: "pardubicky",
    short: "PAK",
    label: "Pardubický kraj",
    country: "CZ",
    path: "M268,152 L318,148 L348,178 L328,218 L278,222 L248,188 Z",
  },
  {
    id: "plzensky",
    short: "PLK",
    label: "Plzeňský kraj",
    country: "CZ",
    path: "M48,178 L88,168 L118,198 L108,248 L68,268 L32,228 Z",
  },
  {
    id: "stredocesky",
    short: "STC",
    label: "Středočeský kraj",
    country: "CZ",
    path: "M118,148 L178,142 L218,168 L208,218 L158,238 L118,198 Z",
  },
  {
    id: "praha",
    short: "PHA",
    label: "Hlavní město Praha",
    country: "CZ",
    path: "M158,178 L182,168 L198,188 L178,208 L152,198 Z",
  },
  {
    id: "jihocesky",
    short: "JHC",
    label: "Jihočeský kraj",
    country: "CZ",
    path: "M108,248 L158,238 L188,268 L168,318 L118,328 L78,288 Z",
  },
  {
    id: "vysocina",
    short: "VYS",
    label: "Kraj Vysočina",
    country: "CZ",
    path: "M208,218 L248,188 L278,222 L268,268 L228,288 L188,268 Z",
  },
  {
    id: "jihomoravsky",
    short: "JHM",
    label: "Jihomoravský kraj",
    country: "CZ",
    path: "M268,268 L318,248 L358,278 L348,318 L298,328 L248,308 Z",
  },
  {
    id: "olomoucky",
    short: "OLK",
    label: "Olomoucký kraj",
    country: "CZ",
    path: "M318,148 L368,128 L398,168 L378,218 L328,218 L318,178 Z",
  },
  {
    id: "zlinsky",
    short: "ZLK",
    label: "Zlínský kraj",
    country: "CZ",
    path: "M328,218 L378,218 L398,248 L378,288 L338,298 L318,248 Z",
  },
  {
    id: "moravskoslezsky",
    short: "MSK",
    label: "Moravskoslezský kraj",
    country: "CZ",
    path: "M368,128 L428,108 L458,148 L448,198 L398,208 L378,168 Z",
  },
  // ——— Slovakia ———
  {
    id: "bratislavsky",
    short: "BA",
    label: "Bratislavský kraj",
    country: "SK",
    path: "M398,268 L438,258 L458,288 L438,318 L398,308 Z",
  },
  {
    id: "trnavsky",
    short: "TT",
    label: "Trnavský kraj",
    country: "SK",
    path: "M438,258 L488,248 L508,278 L488,318 L448,318 L438,288 Z",
  },
  {
    id: "nitriansky",
    short: "NR",
    label: "Nitriansky kraj",
    country: "SK",
    path: "M488,278 L538,268 L558,308 L528,338 L488,328 Z",
  },
  {
    id: "trenciansky",
    short: "TN",
    label: "Trenčiansky kraj",
    country: "SK",
    path: "M458,208 L508,188 L528,228 L508,268 L468,258 L448,228 Z",
  },
  {
    id: "zilinsky",
    short: "ZA",
    label: "Žilinský kraj",
    country: "SK",
    path: "M508,148 L568,128 L598,168 L578,208 L528,218 L508,178 Z",
  },
  {
    id: "banskobystricky",
    short: "BB",
    label: "Banskobystrický kraj",
    country: "SK",
    path: "M528,218 L578,208 L608,248 L588,298 L538,308 L518,258 Z",
  },
  {
    id: "presovsky",
    short: "PO",
    label: "Prešovský kraj",
    country: "SK",
    path: "M598,128 L668,108 L698,158 L678,208 L618,218 L578,168 Z",
  },
  {
    id: "kosicky",
    short: "KE",
    label: "Košický kraj",
    country: "SK",
    path: "M618,218 L678,208 L698,248 L678,298 L628,308 L598,258 Z",
  },
] as const;

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
    const shortNorm = normalizeRegionSlug(region.short);
    if (blob.includes(normalizeRegionSlug(id))) return true;
    if (labelNorm && blob.includes(labelNorm.replace(/kraj/g, ""))) return true;
    if (shortNorm.length >= 2 && blob.includes(shortNorm)) return true;
    // Common aliases
    if (id === "praha" && (blob.includes("praha") || blob.includes("prague"))) {
      return true;
    }
    if (id === "vysocina" && blob.includes("vysocin")) return true;
    if (id === "bratislavsky" && blob.includes("bratislav")) return true;
    return false;
  });
}
