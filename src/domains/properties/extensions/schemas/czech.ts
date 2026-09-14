import { z } from "zod";

import {
  CZ_BALCONY_KIND,
  CZ_PENB_CLASS,
} from "@/domains/properties/extensions/enums/cz";

/**
 * Czech typed extension bag (marketCode === "CZ").
 * Keeps PENB / balcony out of the global Property column set.
 */
export const czechPropertyAttributesSchema = z
  .object({
    marketCode: z.literal("CZ"),
    penbClass: z.enum(CZ_PENB_CLASS).default("UNKNOWN"),
    balconyKind: z.enum(CZ_BALCONY_KIND).default("UNKNOWN"),
    /** SVJ / HOA monthly fee in CZK major units when known. */
    svjMonthlyFeeCzk: z.number().finite().nonnegative().optional(),
    cellar: z.boolean().optional(),
    parkingSpot: z.boolean().optional(),
  })
  .strict();

export type CzechPropertyAttributes = z.infer<
  typeof czechPropertyAttributesSchema
>;

export function parseCzechPropertyAttributes(
  raw: unknown,
): CzechPropertyAttributes {
  return czechPropertyAttributesSchema.parse({
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    marketCode: "CZ",
  });
}
