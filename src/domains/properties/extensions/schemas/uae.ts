import { z } from "zod";

import {
  UAE_FURNISHING,
  UAE_PARKING_TYPE,
  UAE_PERMIT_KINDS,
  UAE_VIEW_TYPE,
} from "@/domains/properties/extensions/enums/ae";

/**
 * UAE / Dubai typed extension bag.
 * Persisted as Property.marketExtensions JSON when marketCode === "AE".
 * Hot filters (furnishing, viewType) should get expression indexes — see docs.
 */
export const uaePropertyAttributesSchema = z
  .object({
    marketCode: z.literal("AE"),
    furnishing: z.enum(UAE_FURNISHING).default("UNKNOWN"),
    viewType: z.enum(UAE_VIEW_TYPE).default("UNKNOWN"),
    parkingType: z.enum(UAE_PARKING_TYPE).default("UNKNOWN"),
    parkingSpaces: z.number().int().min(0).max(50).optional(),
    maidRoom: z.boolean().optional(),
    balcony: z.boolean().optional(),
    /** Service charge in AED per sq ft / year when known. */
    serviceChargeAedPerSqftYear: z.number().finite().nonnegative().optional(),
    permitKind: z.enum(UAE_PERMIT_KINDS).optional(),
    permitNumber: z.string().trim().min(1).max(64).optional(),
    reraNumber: z.string().trim().min(1).max(64).optional(),
    freeholdEligible: z.boolean().optional(),
    /** Community / project slug reference (not free-form location graph). */
    communitySlug: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export type UAEPropertyAttributes = z.infer<typeof uaePropertyAttributesSchema>;

export function parseUAEPropertyAttributes(
  raw: unknown,
): UAEPropertyAttributes {
  return uaePropertyAttributesSchema.parse({
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    marketCode: "AE",
  });
}
