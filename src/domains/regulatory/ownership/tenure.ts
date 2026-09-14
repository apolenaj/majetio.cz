/**
 * Canonical tenure / ownership framework (Prompt 17.4).
 * Separates legal tenure (freehold/leasehold) from CZ-specific OwnershipType
 * (PERSONAL / COOPERATIVE / …) which describes the Czech title form.
 */

export const CANONICAL_TENURE_TYPES = [
  "FREEHOLD",
  "LEASEHOLD",
  "USUFRUCT",
  "COOPERATIVE_RIGHT",
  "COMPANY_OWNED",
  "OTHER",
  "UNKNOWN",
] as const;

export type CanonicalTenureType = (typeof CANONICAL_TENURE_TYPES)[number];

/** CZ Prisma OwnershipType → approximate tenure (lossy). */
export function tenureFromCzOwnershipType(
  ownershipType: string | null | undefined,
): CanonicalTenureType {
  switch ((ownershipType ?? "UNKNOWN").toUpperCase()) {
    case "PERSONAL":
      return "FREEHOLD";
    case "COOPERATIVE":
      return "COOPERATIVE_RIGHT";
    case "COMPANY":
      return "COMPANY_OWNED";
    case "MUNICIPAL":
      return "OTHER";
    case "OTHER":
      return "OTHER";
    default:
      return "UNKNOWN";
  }
}

export function isCanonicalTenureType(
  value: string,
): value is CanonicalTenureType {
  return (CANONICAL_TENURE_TYPES as readonly string[]).includes(value);
}

export type TenureAlias = {
  marketCode: string;
  alias: string;
  tenure: CanonicalTenureType;
  labelLocal: string;
  labelEn: string;
};

export const TENURE_ALIASES: readonly TenureAlias[] = [
  {
    marketCode: "CZ",
    alias: "osobni",
    tenure: "FREEHOLD",
    labelLocal: "Osobní vlastnictví",
    labelEn: "Personal freehold-equivalent",
  },
  {
    marketCode: "CZ",
    alias: "druzstevni",
    tenure: "COOPERATIVE_RIGHT",
    labelLocal: "Družstevní",
    labelEn: "Cooperative right",
  },
  {
    marketCode: "AE",
    alias: "freehold",
    tenure: "FREEHOLD",
    labelLocal: "Freehold",
    labelEn: "Freehold",
  },
  {
    marketCode: "AE",
    alias: "leasehold",
    tenure: "LEASEHOLD",
    labelLocal: "Leasehold",
    labelEn: "Leasehold",
  },
] as const;

export function resolveTenureFromAlias(input: {
  marketCode: string;
  raw: string;
}): CanonicalTenureType | null {
  const upper = input.raw.trim().toUpperCase();
  if (isCanonicalTenureType(upper)) return upper;
  const needle = input.raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const hit = TENURE_ALIASES.find(
    (a) =>
      (a.marketCode === input.marketCode.toUpperCase() ||
        a.marketCode === "*") &&
      a.alias === needle,
  );
  return hit?.tenure ?? null;
}
