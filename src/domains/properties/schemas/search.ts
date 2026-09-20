import { z } from "zod";

/** Allowed property types — never accept arbitrary client strings into Prisma enums unchecked. */
export const SEARCH_PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "TOWNHOUSE",
  "LAND",
  "COMMERCIAL",
  "OTHER",
] as const;

export const SEARCH_CONDITIONS = [
  "NEW",
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "NEEDS_RENOVATION",
  "SHELL",
  "UNKNOWN",
] as const;

export const SEARCH_OWNERSHIP_TYPES = [
  "PERSONAL",
  "COOPERATIVE",
  "MUNICIPAL",
  "COMPANY",
  "OTHER",
  "UNKNOWN",
] as const;

export const SEARCH_TRANSACTION_TYPES = ["SALE", "RENT"] as const;

export const SEARCH_ENERGY_RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;

export const SEARCH_CONSTRUCTION_TYPES = [
  "BRICK",
  "PANEL",
  "WOOD",
  "STEEL",
  "MIXED",
  "OTHER",
] as const;

export const SEARCH_OWNER_KINDS = ["AGENT", "AGENCY", "DEVELOPER", "PARTNER"] as const;

export const SEARCH_AMENITIES = [
  "balcony",
  "loggia",
  "terrace",
  "garden",
  "cellar",
  "garage",
  "parking",
  "elevator",
  "barrierFree",
  "bez_balcony",
  "bez_loggia",
  "bez_terrace",
  "bez_garden",
  "bez_cellar",
  "bez_garage",
  "bez_parking",
  "bez_elevator",
  "bez_barrierFree",
] as const;

/** Named sort presets — mapped server-side; never interpolated into SQL. */
export const SEARCH_SORT_PRESETS = [
  "recommended",
  "newest",
  "price_asc",
  "price_desc",
  "price_per_sqm",
  "price_per_sqm_asc",
  "area_desc",
  "rent_desc",
  "gross_yield_desc",
  "net_yield_desc",
  "cashflow_desc",
  "cash_on_cash_desc",
  "payback_asc",
  "tenant_demand_desc",
  "occupancy_desc",
  "renovation_asc",
  "discount_desc",
  "majetio_score_desc",
] as const;

export type SearchSortPreset = (typeof SEARCH_SORT_PRESETS)[number];

const nonNegInt = z.coerce.number().int().nonnegative().max(1_000_000_000);
const nonNegFloat = z.coerce.number().nonnegative().max(1_000_000);

const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (v == null) return undefined;
    const arr = Array.isArray(v) ? v : v.split(",").map((s) => s.trim());
    return arr.filter(Boolean).slice(0, 20);
  });

export const propertySearchInputSchema = z.object({
  /** Free-text location / title hint (bounded). */
  query: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  city: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),

  priceMin: nonNegInt.optional(),
  priceMax: nonNegInt.optional(),

  propertyType: stringList,
  layout: stringList,
  /** Alias for layout (CZ disposition labels). */
  disposition: stringList,

  usableAreaMin: nonNegFloat.optional(),
  usableAreaMax: nonNegFloat.optional(),
  landAreaMin: nonNegFloat.optional(),
  landAreaMax: nonNegFloat.optional(),
  floorAreaMin: nonNegFloat.optional(),
  floorAreaMax: nonNegFloat.optional(),
  pricePerSqmMin: nonNegFloat.optional(),
  pricePerSqmMax: nonNegFloat.optional(),

  condition: stringList,
  ownershipType: stringList,
  energyRating: stringList,
  constructionType: stringList,
  listingOwnerKind: stringList,
  amenities: stringList,
  transactionType: z.enum(SEARCH_TRANSACTION_TYPES).optional(),
  floorMin: z.coerce.number().int().min(-5).max(200).optional(),
  floorMax: z.coerce.number().int().min(-5).max(200).optional(),
  yearBuiltMin: z.coerce.number().int().min(1800).max(2100).optional(),
  yearBuiltMax: z.coerce.number().int().min(1800).max(2100).optional(),
  yearRenovatedMin: z.coerce.number().int().min(1800).max(2100).optional(),
  yearRenovatedMax: z.coerce.number().int().min(1800).max(2100).optional(),
  groundFloor: z.boolean().optional(),
  topFloor: z.boolean().optional(),
  isOffPlan: z.boolean().optional(),
  immediateMoveIn: z.boolean().optional(),
  onlyNew: z.boolean().optional(),
  onlyDiscounted: z.boolean().optional(),
  excludeReserved: z.boolean().optional(),
  requirePrice: z.boolean().optional(),
  privateSeller: z.boolean().optional(),

  grossYieldMin: nonNegFloat.optional(),
  grossYieldMax: nonNegFloat.optional(),
  netYieldMin: nonNegFloat.optional(),
  netYieldMax: nonNegFloat.optional(),
  cashflowMin: z.coerce.number().min(-1_000_000_000).max(1_000_000_000).optional(),
  cashflowMax: z.coerce.number().min(-1_000_000_000).max(1_000_000_000).optional(),
  cashOnCashMin: nonNegFloat.optional(),
  cashOnCashMax: nonNegFloat.optional(),
  paybackYearsMin: nonNegFloat.optional(),
  paybackYearsMax: nonNegFloat.optional(),
  rentEstimateMin: nonNegInt.optional(),
  rentEstimateMax: nonNegInt.optional(),
  rentPerSqmMin: nonNegFloat.optional(),
  rentPerSqmMax: nonNegFloat.optional(),
  renovationCostMin: nonNegInt.optional(),
  renovationCostMax: nonNegInt.optional(),
  renovationLevel: stringList,
  yieldAfterRenovationMin: nonNegFloat.optional(),
  allInCostMin: nonNegInt.optional(),
  allInCostMax: nonNegInt.optional(),
  discountMin: nonNegFloat.optional(),
  tenantDemandMin: z.coerce.number().min(0).max(100).optional(),
  tenantDemandMax: z.coerce.number().min(0).max(100).optional(),
  occupancyMin: z.coerce.number().min(0).max(100).optional(),
  occupancyMax: z.coerce.number().min(0).max(100).optional(),
  investmentRisk: stringList,
  majetioScoreMin: z.coerce.number().min(0).max(100).optional(),
  majetioScoreMax: z.coerce.number().min(0).max(100).optional(),
  dataConfidenceMin: z.coerce.number().min(0).max(100).optional(),
  onlyComputedInvestment: z.boolean().optional(),

  /**
   * Named sort preset. Prefer this over raw field names.
   * Raw field+direction still accepted but whitelisted server-side.
   */
  sort: z.enum(SEARCH_SORT_PRESETS).optional(),
  sortField: z.string().max(40).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),

  page: z.coerce.number().int().min(1).max(10_000).optional(),
  /** Oversized values are clamped (not rejected) to protect DB load. */
  pageSize: z.coerce
    .number()
    .int()
    .optional()
    .transform((v) => {
      if (v == null || !Number.isFinite(v)) return undefined;
      return Math.min(50, Math.max(1, Math.floor(v)));
    }),
  cursor: z.string().max(500).optional(),
  paginationMode: z.enum(["page", "cursor"]).optional(),

  /**
   * When priceMin > priceMax (or area):
   * - auto_swap (default): swap bounds and record a warning
   * - error: reject the request
   */
  rangeMode: z.enum(["auto_swap", "error"]).optional().default("auto_swap"),
});

export type PropertySearchInput = z.infer<typeof propertySearchInputSchema>;
