import { z } from "zod";

/**
 * HypotekaJasne wire / partner payload (illustrative).
 * Majetio normalizes into CanonicalMortgageOffer — do not leak this to UI.
 */

export const externalMortgageOfferSchema = z.object({
  externalId: z.string().min(1),
  bank: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
  }),
  product: z.object({
    name: z.string().min(1),
    slug: z.string().optional(),
  }),
  rates: z.object({
    interestFromPct: z.number(),
    aprFromPct: z.number().nullable().optional(),
    fixationYears: z.number().int().nullable().optional(),
  }),
  ltv: z
    .object({
      minPct: z.number().nullable().optional(),
      maxPct: z.number().nullable().optional(),
    })
    .optional(),
  fees: z
    .object({
      arrangementCzk: z.number().int().nullable().optional(),
      valuationCzk: z.number().int().nullable().optional(),
      monthlyCzk: z.number().int().nullable().optional(),
    })
    .optional(),
  isSponsored: z.boolean().optional(),
  termsUrl: z.string().url().optional(),
  fetchedAt: z.coerce.date().optional(),
});

export type ExternalMortgageOffer = z.infer<typeof externalMortgageOfferSchema>;

export const externalMortgageOffersResponseSchema = z.object({
  offers: z.array(externalMortgageOfferSchema),
  fetchedAt: z.coerce.date(),
  sourceStatus: z.enum(["ok", "degraded", "unavailable"]),
});

export type ExternalMortgageOffersResponse = z.infer<
  typeof externalMortgageOffersResponseSchema
>;
