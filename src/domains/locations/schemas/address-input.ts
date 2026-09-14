import { z } from "zod";

import { LocationResolutionConfidence, LocationType } from "@prisma/client";

export const addressInputSchema = z.object({
  countryCode: z.string().length(2).default("CZ"),
  /** Free-text line — never used alone for micro-location assignment. */
  rawAddress: z.string().max(512).optional().nullable(),
  regionName: z.string().max(128).optional().nullable(),
  districtName: z.string().max(128).optional().nullable(),
  municipalityName: z.string().max(128).optional().nullable(),
  cityName: z.string().max(128).optional().nullable(),
  cityDistrictName: z.string().max(128).optional().nullable(),
  neighborhoodName: z.string().max(128).optional().nullable(),
  microLocationName: z.string().max(128).optional().nullable(),
  street: z.string().max(256).optional().nullable(),
  houseNumber: z.string().max(32).optional().nullable(),
  zip: z.string().max(16).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  /** RÚIAN address point / building code when available. */
  ruianCode: z.string().max(32).optional().nullable(),
  officialCode: z.string().max(32).optional().nullable(),
  lauCode: z.string().max(32).optional().nullable(),
  nutsCode: z.string().max(16).optional().nullable(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

export const locationResolutionResultSchema = z.object({
  canonicalLocationId: z.string().nullable(),
  confidence: z.nativeEnum(LocationResolutionConfidence),
  matchedType: z.nativeEnum(LocationType).nullable(),
  hierarchy: z.array(
    z.object({
      id: z.string(),
      type: z.nativeEnum(LocationType),
      name: z.string(),
      slug: z.string(),
      publicLabel: z.string().nullable(),
    }),
  ),
  warnings: z.array(z.string()),
  resolverVersion: z.string(),
});

export type LocationResolutionResult = z.infer<typeof locationResolutionResultSchema>;
