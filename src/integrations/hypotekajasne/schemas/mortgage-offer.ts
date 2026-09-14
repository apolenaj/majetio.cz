import { z } from "zod";

/** Lifecycle of a normalized mortgage offer row in Majetio. */
export const MORTGAGE_OFFER_STATUSES = [
  "active",
  "review_required",
  "inactive",
  "stale",
] as const;

export type MortgageOfferStatus = (typeof MORTGAGE_OFFER_STATUSES)[number];

/** Data provenance tier — never conflate live with cached/verified. */
export const MORTGAGE_DATA_TIERS = ["live", "cached", "verified"] as const;

export type MortgageDataTier = (typeof MORTGAGE_DATA_TIERS)[number];

export const mortgageOfferFeesSchema = z.object({
  arrangementFeeCzk: z.number().int().nonnegative().nullable().optional(),
  valuationFeeCzk: z.number().int().nonnegative().nullable().optional(),
  monthlyFeeCzk: z.number().int().nonnegative().nullable().optional(),
});

export type MortgageOfferFees = z.infer<typeof mortgageOfferFeesSchema>;

/**
 * Canonical Majetio mortgage offer — decoupled from HypotekaJasne wire format.
 * Used by Decision Cockpit / financing UI; not a second financial engine.
 */
export const canonicalMortgageOfferSchema = z.object({
  id: z.string().min(1),
  bankName: z.string().min(1),
  productName: z.string().min(1),
  /** Nominal rate from, percent points (e.g. 5.19). */
  interestRateFrom: z.number().min(0).max(30),
  /** APR / RPSN from, percent points — disclosure only for payment math in Majetio. */
  aprFrom: z.number().min(0).max(30).nullable(),
  fixationYears: z.number().int().min(0).max(30).nullable(),
  ltvMaxPct: z.number().min(0).max(100).nullable(),
  ltvMinPct: z.number().min(0).max(100).nullable(),
  fees: mortgageOfferFeesSchema.optional(),
  source: z.string().min(1),
  status: z.enum(MORTGAGE_OFFER_STATUSES),
  dataTier: z.enum(MORTGAGE_DATA_TIERS),
  retrievedAt: z.coerce.date(),
  verifiedAt: z.coerce.date().nullable(),
  externalId: z.string().nullable().optional(),
  productSlug: z.string().nullable().optional(),
  /** Partner-paid placement — must be labelled in UI, never auto-ranked as "best". */
  isSponsored: z.boolean().optional(),
  /** Public product terms URL — no PII query params. */
  termsUrl: z.string().url().nullable().optional(),
  schemaVersion: z.string().min(1),
});

export type CanonicalMortgageOffer = z.infer<typeof canonicalMortgageOfferSchema>;

export const mortgageFreshnessSchema = z.object({
  dataTier: z.enum(MORTGAGE_DATA_TIERS),
  retrievedAt: z.coerce.date(),
  verifiedAt: z.coerce.date().nullable(),
  label: z.string(),
  isStale: z.boolean(),
});

export type MortgageFreshness = z.infer<typeof mortgageFreshnessSchema>;
