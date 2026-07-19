import { z } from "zod";

/** Allowed property types — never accept arbitrary client strings into Prisma enums unchecked. */
export const SEARCH_PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
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

/** Named sort presets — mapped server-side; never interpolated into SQL. */
export const SEARCH_SORT_PRESETS = [
  "newest",
  "price_asc",
  "price_desc",
  "price_per_sqm",
  "price_per_sqm_asc",
  "area_desc",
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

  condition: stringList,
  ownershipType: stringList,
  transactionType: z.enum(SEARCH_TRANSACTION_TYPES).optional(),

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
