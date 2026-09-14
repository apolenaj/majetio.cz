/**
 * Canonical Property Taxonomy (Prompt 17.3).
 * Core types are stable; markets map local aliases onto these codes.
 */

export const CANONICAL_PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "TOWNHOUSE",
  "LAND",
  "COMMERCIAL",
  "STUDIO",
  "OTHER",
] as const;

export type CanonicalPropertyType = (typeof CANONICAL_PROPERTY_TYPES)[number];

/**
 * Prisma-backed subset today (extended via migration for VILLA/TOWNHOUSE/STUDIO).
 * Analytics may roll STUDIO → APARTMENT and VILLA → HOUSE where engines lack granularity.
 */
export const PRISMA_PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "TOWNHOUSE",
  "LAND",
  "COMMERCIAL",
  "OTHER",
] as const;

export type PrismaPropertyType = (typeof PRISMA_PROPERTY_TYPES)[number];

export type PropertyTypeAlias = {
  marketCode: string;
  /** Local slug / label (normalized lowercase). */
  alias: string;
  canonical: CanonicalPropertyType;
  locale?: string;
  labelLocal: string;
  labelEn: string;
};

/** Roll-up for engines that only understand the legacy 5-type set. */
export function toAnalyticsPropertyType(
  type: CanonicalPropertyType,
): "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL" | "OTHER" {
  switch (type) {
    case "STUDIO":
      return "APARTMENT";
    case "VILLA":
    case "TOWNHOUSE":
      return "HOUSE";
    case "APARTMENT":
    case "HOUSE":
    case "LAND":
    case "COMMERCIAL":
    case "OTHER":
      return type;
    default:
      return "OTHER";
  }
}

export function isCanonicalPropertyType(
  value: string,
): value is CanonicalPropertyType {
  return (CANONICAL_PROPERTY_TYPES as readonly string[]).includes(value);
}

/**
 * Global + per-market aliases. Matching is case-insensitive on normalized alias.
 */
export const PROPERTY_TYPE_ALIASES: readonly PropertyTypeAlias[] = [
  // CZ
  { marketCode: "CZ", alias: "byt", canonical: "APARTMENT", labelLocal: "Byt", labelEn: "Apartment", locale: "cs-CZ" },
  { marketCode: "CZ", alias: "apartment", canonical: "APARTMENT", labelLocal: "Byt", labelEn: "Apartment" },
  { marketCode: "CZ", alias: "rodinny dum", canonical: "HOUSE", labelLocal: "Rodinný dům", labelEn: "Family house", locale: "cs-CZ" },
  { marketCode: "CZ", alias: "rodinný dům", canonical: "HOUSE", labelLocal: "Rodinný dům", labelEn: "Family house", locale: "cs-CZ" },
  { marketCode: "CZ", alias: "dum", canonical: "HOUSE", labelLocal: "Dům", labelEn: "House", locale: "cs-CZ" },
  { marketCode: "CZ", alias: "vila", canonical: "VILLA", labelLocal: "Vila", labelEn: "Villa", locale: "cs-CZ" },
  { marketCode: "CZ", alias: "pozemek", canonical: "LAND", labelLocal: "Pozemek", labelEn: "Land", locale: "cs-CZ" },
  { marketCode: "CZ", alias: "komercni", canonical: "COMMERCIAL", labelLocal: "Komerční", labelEn: "Commercial", locale: "cs-CZ" },
  // AE / Dubai
  { marketCode: "AE", alias: "villa", canonical: "VILLA", labelLocal: "Villa", labelEn: "Villa", locale: "en-AE" },
  { marketCode: "AE", alias: "townhouse", canonical: "TOWNHOUSE", labelLocal: "Townhouse", labelEn: "Townhouse" },
  { marketCode: "AE", alias: "apartment", canonical: "APARTMENT", labelLocal: "Apartment", labelEn: "Apartment" },
  { marketCode: "AE", alias: "flat", canonical: "APARTMENT", labelLocal: "Apartment", labelEn: "Apartment" },
  { marketCode: "AE", alias: "studio", canonical: "STUDIO", labelLocal: "Studio", labelEn: "Studio" },
  { marketCode: "AE", alias: "penthouse", canonical: "APARTMENT", labelLocal: "Penthouse", labelEn: "Penthouse" },
  // SK
  { marketCode: "SK", alias: "byt", canonical: "APARTMENT", labelLocal: "Byt", labelEn: "Apartment", locale: "sk-SK" },
  { marketCode: "SK", alias: "dom", canonical: "HOUSE", labelLocal: "Dom", labelEn: "House", locale: "sk-SK" },
  // ES
  { marketCode: "ES", alias: "piso", canonical: "APARTMENT", labelLocal: "Piso", labelEn: "Apartment", locale: "es-ES" },
  { marketCode: "ES", alias: "chalet", canonical: "HOUSE", labelLocal: "Chalet", labelEn: "House", locale: "es-ES" },
  { marketCode: "ES", alias: "villa", canonical: "VILLA", labelLocal: "Villa", labelEn: "Villa", locale: "es-ES" },
  // Generic EN fallbacks (marketCode *)
  { marketCode: "*", alias: "apartment", canonical: "APARTMENT", labelLocal: "Apartment", labelEn: "Apartment" },
  { marketCode: "*", alias: "house", canonical: "HOUSE", labelLocal: "House", labelEn: "House" },
  { marketCode: "*", alias: "villa", canonical: "VILLA", labelLocal: "Villa", labelEn: "Villa" },
  { marketCode: "*", alias: "land", canonical: "LAND", labelLocal: "Land", labelEn: "Land" },
  { marketCode: "*", alias: "commercial", canonical: "COMMERCIAL", labelLocal: "Commercial", labelEn: "Commercial" },
] as const;

function normalizeAlias(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function resolveCanonicalPropertyType(input: {
  marketCode: string;
  raw: string;
}): CanonicalPropertyType | null {
  const upper = input.raw.trim().toUpperCase();
  if (isCanonicalPropertyType(upper)) return upper;
  // STUDIO may not be in Prisma yet — still canonical in taxonomy
  if (upper === "STUDIO") return "STUDIO";

  const needle = normalizeAlias(input.raw);
  const marketHit = PROPERTY_TYPE_ALIASES.find(
    (a) =>
      a.marketCode === input.marketCode.toUpperCase() &&
      normalizeAlias(a.alias) === needle,
  );
  if (marketHit) return marketHit.canonical;

  const globalHit = PROPERTY_TYPE_ALIASES.find(
    (a) => a.marketCode === "*" && normalizeAlias(a.alias) === needle,
  );
  return globalHit?.canonical ?? null;
}

export function listAliasesForMarket(
  marketCode: string,
): PropertyTypeAlias[] {
  return PROPERTY_TYPE_ALIASES.filter(
    (a) =>
      a.marketCode === marketCode.toUpperCase() || a.marketCode === "*",
  );
}

/** Persistable Prisma enum value (STUDIO → APARTMENT until enum exists). */
export function toPrismaPropertyType(
  type: CanonicalPropertyType,
): PrismaPropertyType {
  if (type === "STUDIO") return "APARTMENT";
  if ((PRISMA_PROPERTY_TYPES as readonly string[]).includes(type)) {
    return type as PrismaPropertyType;
  }
  return "OTHER";
}
