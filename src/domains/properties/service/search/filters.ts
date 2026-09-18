/**
 * Search filter normalization + safe Prisma where builder (Prompt 8 Part 1).
 */

import {
  SEARCH_AMENITIES,
  SEARCH_CONDITIONS,
  SEARCH_CONSTRUCTION_TYPES,
  SEARCH_ENERGY_RATINGS,
  SEARCH_OWNER_KINDS,
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
  floorAreaMin?: number;
  floorAreaMax?: number;
  pricePerSqmMin?: number;
  pricePerSqmMax?: number;
  energyRating?: string[];
  constructionType?: string[];
  listingOwnerKind?: string[];
  amenities?: string[];
  floorMin?: number;
  floorMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  yearRenovatedMin?: number;
  yearRenovatedMax?: number;
  groundFloor?: boolean;
  topFloor?: boolean;
  isOffPlan?: boolean;
  immediateMoveIn?: boolean;
  onlyNew?: boolean;
  onlyDiscounted?: boolean;
  excludeReserved?: boolean;
  requirePrice?: boolean;
  privateSeller?: boolean;
  grossYieldMin?: number;
  grossYieldMax?: number;
  netYieldMin?: number;
  netYieldMax?: number;
  cashflowMin?: number;
  cashflowMax?: number;
  cashOnCashMin?: number;
  cashOnCashMax?: number;
  paybackYearsMin?: number;
  paybackYearsMax?: number;
  rentEstimateMin?: number;
  rentEstimateMax?: number;
  rentPerSqmMin?: number;
  rentPerSqmMax?: number;
  renovationCostMin?: number;
  renovationCostMax?: number;
  renovationLevel?: string[];
  yieldAfterRenovationMin?: number;
  allInCostMin?: number;
  allInCostMax?: number;
  discountMin?: number;
  tenantDemandMin?: number;
  tenantDemandMax?: number;
  occupancyMin?: number;
  occupancyMax?: number;
  investmentRisk?: string[];
  majetioScoreMin?: number;
  majetioScoreMax?: number;
  dataConfidenceMin?: number;
  onlyComputedInvestment?: boolean;
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

function pickExact(
  values: string[] | undefined,
  allowed: readonly string[],
): string[] | undefined {
  if (!values?.length) return undefined;
  const allowedSet = new Set(allowed);
  const picked = values.filter((v) => allowedSet.has(v)).slice(0, 20);
  return picked.length > 0 ? [...new Set(picked)] : undefined;
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
    energyRating: pickEnumList(input.energyRating, SEARCH_ENERGY_RATINGS),
    constructionType: pickEnumList(input.constructionType, SEARCH_CONSTRUCTION_TYPES),
    listingOwnerKind: pickEnumList(input.listingOwnerKind, SEARCH_OWNER_KINDS),
    amenities: pickExact(input.amenities, SEARCH_AMENITIES),
    floorAreaMin: input.floorAreaMin,
    floorAreaMax: input.floorAreaMax,
    pricePerSqmMin: input.pricePerSqmMin,
    pricePerSqmMax: input.pricePerSqmMax,
    floorMin: input.floorMin,
    floorMax: input.floorMax,
    yearBuiltMin: input.yearBuiltMin,
    yearBuiltMax: input.yearBuiltMax,
    yearRenovatedMin: input.yearRenovatedMin,
    yearRenovatedMax: input.yearRenovatedMax,
    groundFloor: input.groundFloor,
    topFloor: input.topFloor,
    isOffPlan: input.isOffPlan,
    immediateMoveIn: input.immediateMoveIn,
    onlyNew: input.onlyNew,
    onlyDiscounted: input.onlyDiscounted,
    excludeReserved: input.excludeReserved,
    requirePrice: input.requirePrice,
    privateSeller: input.privateSeller,
    grossYieldMin: input.grossYieldMin,
    grossYieldMax: input.grossYieldMax,
    netYieldMin: input.netYieldMin,
    netYieldMax: input.netYieldMax,
    cashflowMin: input.cashflowMin,
    cashflowMax: input.cashflowMax,
    cashOnCashMin: input.cashOnCashMin,
    cashOnCashMax: input.cashOnCashMax,
    paybackYearsMin: input.paybackYearsMin,
    paybackYearsMax: input.paybackYearsMax,
    rentEstimateMin: input.rentEstimateMin,
    rentEstimateMax: input.rentEstimateMax,
    rentPerSqmMin: input.rentPerSqmMin,
    rentPerSqmMax: input.rentPerSqmMax,
    renovationCostMin: input.renovationCostMin,
    renovationCostMax: input.renovationCostMax,
    renovationLevel: input.renovationLevel,
    yieldAfterRenovationMin: input.yieldAfterRenovationMin,
    allInCostMin: input.allInCostMin,
    allInCostMax: input.allInCostMax,
    discountMin: input.discountMin,
    tenantDemandMin: input.tenantDemandMin,
    tenantDemandMax: input.tenantDemandMax,
    occupancyMin: input.occupancyMin,
    occupancyMax: input.occupancyMax,
    investmentRisk: input.investmentRisk,
    majetioScoreMin: input.majetioScoreMin,
    majetioScoreMax: input.majetioScoreMax,
    dataConfidenceMin: input.dataConfidenceMin,
    onlyComputedInvestment: input.onlyComputedInvestment,
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

  appendStandardColumns(where, filters);
  appendInvestmentClauses(where, filters);

  return where;
}

function appendAnd(where: Record<string, unknown>, clause: Record<string, unknown>) {
  if (where.AND) {
    (where.AND as unknown[]).push(clause);
    return;
  }
  if (where.OR) {
    where.AND = [{ OR: where.OR }, clause];
    delete where.OR;
    return;
  }
  where.AND = [clause];
}

function range(min?: number, max?: number): Record<string, number> | undefined {
  if (min == null && max == null) return undefined;
  return {
    ...(min != null ? { gte: min } : {}),
    ...(max != null ? { lte: max } : {}),
  };
}

function appendStandardColumns(
  where: Record<string, unknown>,
  filters: NormalizedSearchFilters,
) {
  const floorArea = range(filters.floorAreaMin, filters.floorAreaMax);
  if (floorArea) where.floorArea = floorArea;
  const pricePerSqm = range(filters.pricePerSqmMin, filters.pricePerSqmMax);
  if (pricePerSqm) where.pricePerSqm = pricePerSqm;
  const floor = range(filters.floorMin, filters.floorMax);
  if (floor) where.floor = floor;
  const yearBuilt = range(filters.yearBuiltMin, filters.yearBuiltMax);
  if (yearBuilt) where.yearBuilt = yearBuilt;
  const yearRenovated = range(filters.yearRenovatedMin, filters.yearRenovatedMax);
  if (yearRenovated) where.yearRenovated = yearRenovated;

  if (filters.energyRating?.length) {
    where.energyRating =
      filters.energyRating.length === 1
        ? filters.energyRating[0]
        : { in: filters.energyRating };
  }
  if (filters.constructionType?.length) {
    where.constructionType =
      filters.constructionType.length === 1
        ? filters.constructionType[0]
        : { in: filters.constructionType };
  }
  if (filters.listingOwnerKind?.length) {
    where.listingOwnerKind =
      filters.listingOwnerKind.length === 1
        ? filters.listingOwnerKind[0]
        : { in: filters.listingOwnerKind };
  }
  if (filters.privateSeller) {
    appendAnd(where, {
      listingOwnerKind: null,
      organizationId: null,
    });
  }
  if (filters.isOffPlan) where.isOffPlan = true;
  if (filters.requirePrice) {
    const current =
      where.askingPrice && typeof where.askingPrice === "object"
        ? (where.askingPrice as Record<string, unknown>)
        : {};
    where.askingPrice = { ...current, not: null };
  }

  if (filters.amenities?.length) {
    const is: Record<string, boolean> = {};
    for (const amenity of filters.amenities) is[amenity] = true;
    where.features = { is };
  }
}

const SNAPSHOT_RANGES: Array<{
  field: string;
  min: keyof NormalizedSearchFilters;
  max: keyof NormalizedSearchFilters;
}> = [
  { field: "grossYieldPct", min: "grossYieldMin", max: "grossYieldMax" },
  { field: "netYieldPct", min: "netYieldMin", max: "netYieldMax" },
  { field: "monthlyCashflowCzk", min: "cashflowMin", max: "cashflowMax" },
  { field: "cashOnCashPct", min: "cashOnCashMin", max: "cashOnCashMax" },
  { field: "paybackYears", min: "paybackYearsMin", max: "paybackYearsMax" },
  { field: "estimatedRentMonthlyCzk", min: "rentEstimateMin", max: "rentEstimateMax" },
  { field: "rentPerSqm", min: "rentPerSqmMin", max: "rentPerSqmMax" },
  { field: "renovationCostMinCzk", min: "renovationCostMin", max: "renovationCostMax" },
  { field: "allInCostCzk", min: "allInCostMin", max: "allInCostMax" },
  { field: "tenantDemandScore", min: "tenantDemandMin", max: "tenantDemandMax" },
  { field: "estimatedOccupancyMinPct", min: "occupancyMin", max: "occupancyMax" },
  { field: "majetioScore", min: "majetioScoreMin", max: "majetioScoreMax" },
];

function appendInvestmentClauses(
  where: Record<string, unknown>,
  filters: NormalizedSearchFilters,
) {
  const only = filters.onlyComputedInvestment === true;
  for (const spec of SNAPSHOT_RANGES) {
    const bounds = range(
      filters[spec.min] as number | undefined,
      filters[spec.max] as number | undefined,
    );
    if (!bounds) continue;
    appendAnd(where, snapshotRangeClause(spec.field, bounds, only));
  }
  if (filters.discountMin != null) {
    appendAnd(
      where,
      snapshotRangeClause(
        "discountToEstimatedValuePct",
        { gte: filters.discountMin },
        only,
      ),
    );
  }
  if (filters.yieldAfterRenovationMin != null) {
    appendAnd(
      where,
      snapshotRangeClause(
        "yieldAfterRenovationPct",
        { gte: filters.yieldAfterRenovationMin },
        only,
      ),
    );
  }
  if (filters.dataConfidenceMin != null) {
    appendAnd(
      where,
      snapshotRangeClause(
        "dataConfidencePct",
        { gte: filters.dataConfidenceMin },
        only,
      ),
    );
  }
  if (filters.renovationLevel?.length) {
    appendAnd(where, {
      OR: only
        ? [
            {
              investmentSnapshot: {
                is: { renovationLevel: { in: filters.renovationLevel } },
              },
            },
          ]
        : [
            { investmentSnapshot: { is: null } },
            { investmentSnapshot: { is: { renovationLevel: null } } },
            {
              investmentSnapshot: {
                is: { renovationLevel: { in: filters.renovationLevel } },
              },
            },
          ],
    });
  }
  if (filters.investmentRisk?.length) {
    appendAnd(where, {
      OR: only
        ? [
            {
              investmentSnapshot: {
                is: { investmentRisk: { in: filters.investmentRisk } },
              },
            },
          ]
        : [
            { investmentSnapshot: { is: null } },
            { investmentSnapshot: { is: { investmentRisk: null } } },
            {
              investmentSnapshot: {
                is: { investmentRisk: { in: filters.investmentRisk } },
              },
            },
          ],
    });
  }
  if (only) {
    appendAnd(where, {
      investmentSnapshot: { is: { calculatedAt: { not: null } } },
    });
  }
}

/**
 * Explicit investment bounds must not drop listings whose metric was never calculated,
 * unless the caller asked for computed rows only.
 */
function snapshotRangeClause(
  field: string,
  bounds: Record<string, number>,
  onlyComputed: boolean,
): Record<string, unknown> {
  if (onlyComputed) {
    return {
      investmentSnapshot: {
        is: { [field]: bounds, calculatedAt: { not: null } },
      },
    };
  }
  return {
    OR: [
      { investmentSnapshot: { is: null } },
      { investmentSnapshot: { is: { [field]: null } } },
      { investmentSnapshot: { is: { [field]: bounds } } },
    ],
  };
}
