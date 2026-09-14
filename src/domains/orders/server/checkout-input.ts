/**
 * Checkout input validation — rejects client price fields (checklist 171/172)
 * and enforces purchase Terms without marketing bundling (211 / 212).
 */

import { z } from "zod";

/**
 * Client must never send amount — charge comes from PricingPlan only.
 * `.strict()` rejects unknown keys; `z.never()` rejects known price aliases
 * and marketing opt-in fields (must not be bundled with purchase).
 */
export const checkoutOrderInputSchema = z
  .object({
    productKey: z.string().min(1).max(64),
    analysisId: z.string().min(1).max(64).nullable().optional(),
    propertyId: z.string().min(1).max(64).nullable().optional(),
    organizationId: z.string().min(1).max(64).nullable().optional(),
    promoCode: z.string().max(64).nullable().optional(),
    billing: z.object({
      name: z.string().min(2).max(200),
      email: z.string().email().max(200),
      company: z.string().max(200).optional(),
      street: z.string().max(200).optional(),
      city: z.string().max(120).optional(),
      zip: z.string().max(32).optional(),
      country: z.string().max(2).optional(),
      vatId: z.string().max(32).optional(),
    }),
    idempotencyKey: z.string().max(64).optional(),
    /** Required — versioned Terms acceptance at purchase (211). */
    acceptPurchaseTerms: z.literal(true),
    amountGrossMinor: z.never().optional(),
    priceCzk: z.never().optional(),
    amountCzk: z.never().optional(),
    /** Marketing must stay out of checkout (212). */
    acceptMarketing: z.never().optional(),
    marketingOptIn: z.never().optional(),
    marketingConsent: z.never().optional(),
  })
  .strict();

export type CheckoutOrderInput = z.infer<typeof checkoutOrderInputSchema>;

export function parseCheckoutOrderInput(input: unknown) {
  return checkoutOrderInputSchema.safeParse(input);
}
