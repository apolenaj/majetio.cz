import { z } from "zod";

import {
  ES_ENERGY_CERTIFICATE,
  ES_HEATING_TYPE,
  ES_ORIENTATION,
} from "@/domains/properties/extensions/enums/es";

/**
 * Spain typed extension bag (marketCode === "ES").
 */
export const spainPropertyAttributesSchema = z
  .object({
    marketCode: z.literal("ES"),
    energyCertificate: z.enum(ES_ENERGY_CERTIFICATE).default("UNKNOWN"),
    orientation: z.enum(ES_ORIENTATION).default("UNKNOWN"),
    heatingType: z.enum(ES_HEATING_TYPE).default("UNKNOWN"),
    /** Catastro reference — structured identifier, not prose. */
    cadastralReference: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{14,20}$/, "Invalid Spanish cadastral reference")
      .optional(),
    communityFeesMonthlyEur: z.number().finite().nonnegative().optional(),
    ibiAnnualEur: z.number().finite().nonnegative().optional(),
    hasTerrace: z.boolean().optional(),
    hasElevator: z.boolean().optional(),
    floorNumber: z.number().int().min(-5).max(200).optional(),
  })
  .strict();

export type SpainPropertyAttributes = z.infer<
  typeof spainPropertyAttributesSchema
>;

export function parseSpainPropertyAttributes(
  raw: unknown,
): SpainPropertyAttributes {
  return spainPropertyAttributesSchema.parse({
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    marketCode: "ES",
  });
}
