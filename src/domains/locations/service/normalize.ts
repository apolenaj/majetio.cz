import type { LocationType } from "@prisma/client";

import type { AddressInput } from "@/domains/locations/schemas/address-input";

/** Strip diacritics for fuzzy CZ matching. */
export function normalizeLocationName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeAddressInput(raw: AddressInput): AddressInput {
  const trim = (v: string | null | undefined) =>
    v == null ? v : v.trim().replace(/\s+/g, " ") || null;

  return {
    ...raw,
    countryCode: (raw.countryCode ?? "CZ").toUpperCase(),
    rawAddress: trim(raw.rawAddress),
    regionName: trim(raw.regionName),
    districtName: trim(raw.districtName),
    municipalityName: trim(raw.municipalityName),
    cityName: trim(raw.cityName),
    cityDistrictName: trim(raw.cityDistrictName),
    neighborhoodName: trim(raw.neighborhoodName),
    microLocationName: trim(raw.microLocationName),
    street: trim(raw.street),
    houseNumber: trim(raw.houseNumber),
    zip: trim(raw.zip)?.replace(/\s/g, ""),
    ruianCode: trim(raw.ruianCode),
    officialCode: trim(raw.officialCode),
    lauCode: trim(raw.lauCode),
    nutsCode: trim(raw.nutsCode),
  };
}

/**
 * Maximum geographic precision assignable from input alone.
 * e.g. cityName only → CITY/MUNICIPALITY, never MICRO_LOCATION.
 */
export function inferMaxAssignableType(input: AddressInput): LocationType {
  if (input.ruianCode || input.officialCode) return "MICRO_LOCATION";
  if (input.microLocationName) return "MICRO_LOCATION";
  if (input.neighborhoodName) return "NEIGHBORHOOD";
  if (input.cityDistrictName) return "CITY_DISTRICT";
  if (input.municipalityName) return "MUNICIPALITY";
  if (input.cityName) return "CITY";
  if (input.districtName) return "DISTRICT";
  if (input.regionName) return "REGION";
  return "COUNTRY";
}
