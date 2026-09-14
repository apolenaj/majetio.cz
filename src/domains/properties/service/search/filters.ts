/**
 * Search filter normalization + safe Prisma where builder (Prompt 8 Part 1).
 */

import {
  SEARCH_CONDITIONS,
  SEARCH_OWNERSHIP_TYPES,
  SEARCH_PROPERTY_TYPES,
  type PropertySearchInput,
} from "../../schemas/search";

export type NormalizedSearchFilters = {
  query?: string;
  city?: string;
  district?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string[];
  layout?: string[];
  usableAreaMin?: number;
  usableAreaMax?: number;
  landAreaMin?: number;
  landAreaMax?: number;
  condition?: string[];
  ownershipType?: string[];
  transactionType?: "SALE" | "RENT";
  /** Always enforced for public discovery — prevents broad PRIVATE scans. */
  status: "ACTIVE";
  visibility: "PUBLIC";
};

export type FilterNormalizeResult =
  | {
      ok: true;
      filters: NormalizedSearchFilters;
      warnings: string[];
    }
  | {
      ok: false;
      errors: string[];
      warnings: string[];
    };

function sanitizeText(value: string | undefined, max = 80): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned || undefined;
}

function pickEnumList(
  values: string[] | undefined,
  allowed: readonly string[],
): string[] | undefined {
  if (!values?.length) return undefined;
  const allowedSet = new Set(allowed);
  const picked = values
    .map((v) => v.trim().toUpperCase())
    .filter((v) => allowedSet.has(v))
    .slice(0, 20);
  return picked.length > 0 ? [...new Set(picked)] : undefined;
}

/** Layout labels — alphanumeric + plus/kk only (blocks injection-like input). */
function sanitizeLayouts(values: string[] | undefined): string[] | undefined {
  if (!values?.length) return undefined;
  const cleaned = values
    .map((v) => v.trim().toLowerCase().replace(/\s+/g, ""))
    .filter((v) => /^[0-9]{1,2}\+[0-9kk]{1,3}$/i.test(v) || /^[0-9]{1,2}\+kk$/i.test(v) || v.length <= 12)
    .filter((v) => /^[a-z0-9+]+$/i.test(v))
    .slice(0, 20);
  return cleaned.length > 0 ? [...new Set(cleaned)] : undefined;
}

function normalizeRange(
  min: number | undefined,
  max: number | undefined,
  label: string,
  mode: "auto_swap" | "error",
  warnings: string[],
  errors: string[],
): { min?: number; max?: number } {
  if (min == null && max == null) return {};
  if (min != null && max != null && min > max) {
    if (mode === "error") {
      errors.push(`${label}: minimum (${min}) je větší než maximum (${max}).`);
      return {};
    }
    warnings.push(`${label}: hranice byly prohozeny (min > max).`);
    return { min: max, max: min };
  }
  return { min, max };
}

/**
 * Validate enums, sanitize strings, fix inverted ranges.
 * Does NOT build SQL — only structured filter objects for Prisma.
 */
export function normalizeSearchFilters(
  input: PropertySearchInput,
): FilterNormalizeResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rangeMode = input.rangeMode ?? "auto_swap";

  const price = normalizeRange(
    input.priceMin,
    input.priceMax,
    "Cena",
    rangeMode,
    warnings,
    errors,
  );
  const usable = normalizeRange(
    input.usableAreaMin,
    input.usableAreaMax,
    "Užitná plocha",
    rangeMode,
    warnings,
    errors,
  );
  const land = normalizeRange(
    input.landAreaMin,
    input.landAreaMax,
    "Pozemek",
    rangeMode,
    warnings,
    errors,
  );

  const layouts = sanitizeLayouts([
    ...(input.layout ?? []),
    ...(input.disposition ?? []),
  ]);

  const filters: NormalizedSearchFilters = {
    query: sanitizeText(input.query, 100),
    city: sanitizeText(input.city),
    district: sanitizeText(input.district),
    region: sanitizeText(input.region),
    priceMin: price.min,
    priceMax: price.max,
    propertyType: pickEnumList(input.propertyType, SEARCH_PROPERTY_TYPES),
    layout: layouts,
    usableAreaMin: usable.min,
    usableAreaMax: usable.max,
    landAreaMin: land.min,
    landAreaMax: land.max,
    condition: pickEnumList(input.condition, SEARCH_CONDITIONS),
    ownershipType: pickEnumList(input.ownershipType, SEARCH_OWNERSHIP_TYPES),
    transactionType: input.transactionType,
    status: "ACTIVE",
    visibility: "PUBLIC",
  };

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }
  return { ok: true, filters, warnings };
}

/**
 * Build Prisma `where` from normalized filters.
 * Uses only parameterized Prisma operators — never string-concatenated SQL.
 */
export function buildSearchWhere(
  filters: NormalizedSearchFilters,
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: filters.status,
    visibility: filters.visibility,
    /** Over-quota / banned listings stay out of organic discovery. */
    listingQuotaState: "WITHIN_LIMIT",
    listingModerationStatus: "CLEAR",
  };

  if (filters.transactionType) {
    where.transactionType = filters.transactionType;
  }

  if (filters.propertyType?.length) {
    where.propertyType =
      filters.propertyType.length === 1
        ? filters.propertyType[0]
        : { in: filters.propertyType };
  }

  if (filters.condition?.length) {
    where.condition =
      filters.condition.length === 1
        ? filters.condition[0]
        : { in: filters.condition };
  }

  if (filters.ownershipType?.length) {
    where.ownershipType =
      filters.ownershipType.length === 1
        ? filters.ownershipType[0]
        : { in: filters.ownershipType };
  }

  if (filters.city) where.publicCity = filters.city;
  if (filters.district) where.publicDistrict = filters.district;
  if (filters.region) where.publicRegion = filters.region;

  if (filters.priceMin != null || filters.priceMax != null) {
    where.askingPrice = {
      ...(filters.priceMin != null ? { gte: filters.priceMin } : {}),
      ...(filters.priceMax != null ? { lte: filters.priceMax } : {}),
    };
  }

  if (filters.usableAreaMin != null || filters.usableAreaMax != null) {
    where.usableArea = {
      ...(filters.usableAreaMin != null ? { gte: filters.usableAreaMin } : {}),
      ...(filters.usableAreaMax != null ? { lte: filters.usableAreaMax } : {}),
    };
  }

  if (filters.landAreaMin != null || filters.landAreaMax != null) {
    where.landArea = {
      ...(filters.landAreaMin != null ? { gte: filters.landAreaMin } : {}),
      ...(filters.landAreaMax != null ? { lte: filters.landAreaMax } : {}),
    };
  }

  if (filters.layout?.length) {
    const layoutClause = {
      OR: filters.layout.flatMap((layout) => [
        { layout: { equals: layout, mode: "insensitive" as const } },
        { disposition: { equals: layout, mode: "insensitive" as const } },
      ]),
    };
    if (where.OR || where.AND) {
      const existing = where.AND
        ? (where.AND as unknown[])
        : where.OR
          ? [{ OR: where.OR }]
          : [];
      where.AND = [...existing, layoutClause];
      delete where.OR;
    } else {
      Object.assign(where, layoutClause);
    }
  }

  if (filters.query) {
    const q = filters.query;
    const textClause = {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { publicCity: { contains: q, mode: "insensitive" as const } },
        { publicDistrict: { contains: q, mode: "insensitive" as const } },
        { publicLabel: { contains: q, mode: "insensitive" as const } },
        { publicRegion: { contains: q, mode: "insensitive" as const } },
      ],
    };
    if (where.AND) {
      (where.AND as unknown[]).push(textClause);
    } else if (where.OR) {
      where.AND = [{ OR: where.OR }, textClause];
      delete where.OR;
    } else {
      Object.assign(where, textClause);
    }
  }

  return where;
}
