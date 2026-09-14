import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { AddressInput } from "@/domains/locations/schemas/address-input";
import {
  LocationResolutionService,
} from "@/domains/locations/service/location-resolution-service";
import { createPrismaLocationRepository } from "@/domains/locations/service/location-repository";

export type PropertyLocationInput = AddressInput & {
  propertyId: string;
  publicCity?: string | null;
  publicDistrict?: string | null;
  publicRegion?: string | null;
};

/**
 * Resolve and persist canonical location on Property — conservative assignment.
 */
export async function assignPropertyLocation(
  input: PropertyLocationInput,
): Promise<ReturnType<LocationResolutionService["resolveForProperty"]>> {
  const service = new LocationResolutionService({
    repository: createPrismaLocationRepository(),
  });

  const addressInput: AddressInput = {
    countryCode: input.countryCode ?? "CZ",
    regionName: input.regionName ?? input.publicRegion,
    districtName: input.districtName,
    cityName: input.cityName ?? input.publicCity,
    cityDistrictName: input.cityDistrictName ?? input.publicDistrict,
    municipalityName: input.municipalityName,
    neighborhoodName: input.neighborhoodName,
    microLocationName: input.microLocationName,
    street: input.street,
    houseNumber: input.houseNumber,
    zip: input.zip,
    latitude: input.latitude,
    longitude: input.longitude,
    ruianCode: input.ruianCode,
    officialCode: input.officialCode,
    lauCode: input.lauCode,
    nutsCode: input.nutsCode,
    rawAddress: input.rawAddress,
  };

  const result = await service.resolveForProperty(addressInput);

  const meta: Prisma.InputJsonValue = {
    resolverVersion: result.resolverVersion,
    warnings: result.warnings,
    hierarchyIds: result.hierarchy.map((h) => h.id),
    matchedAt: new Date().toISOString(),
  };

  await prisma.property.update({
    where: { id: input.propertyId },
    data: {
      locationId: result.canonicalLocationId,
      locationResolutionConfidence: result.confidence,
      locationResolutionMeta: meta,
    },
  });

  return result;
}
