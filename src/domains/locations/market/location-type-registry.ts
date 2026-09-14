/**
 * Per-market LocationTypeRegistry (Prompt 17.3).
 * Generic graph stays Location(type, parentId); markets label levels differently.
 */

import type { LocationType } from "@prisma/client";
import { LOCATION_TYPE_ORDER } from "@/domains/locations/types/hierarchy";

export type LocationTypeRegistryEntry = {
  /** Canonical graph type stored on Location.type */
  type: LocationType;
  /** Market-facing role key (emirate, community, kraj, …). */
  roleKey: string;
  labelEn: string;
  labelLocal: string;
  /** Whether this level is commonly used in the market. */
  commonlyUsed: boolean;
};

export type MarketLocationTypeRegistry = {
  marketCode: string;
  /** Ordered coarse → fine for this market. */
  levels: readonly LocationTypeRegistryEntry[];
};

export const CZ_LOCATION_TYPE_REGISTRY: MarketLocationTypeRegistry = {
  marketCode: "CZ",
  levels: [
    { type: "COUNTRY", roleKey: "country", labelEn: "Country", labelLocal: "Stát", commonlyUsed: true },
    { type: "REGION", roleKey: "kraj", labelEn: "Region", labelLocal: "Kraj", commonlyUsed: true },
    { type: "DISTRICT", roleKey: "okres", labelEn: "District", labelLocal: "Okres", commonlyUsed: true },
    { type: "MUNICIPALITY", roleKey: "obec", labelEn: "Municipality", labelLocal: "Obec", commonlyUsed: true },
    { type: "CITY", roleKey: "mesto", labelEn: "City", labelLocal: "Město", commonlyUsed: true },
    { type: "CITY_DISTRICT", roleKey: "mestska_cast", labelEn: "City district", labelLocal: "Městská část", commonlyUsed: true },
    { type: "NEIGHBORHOOD", roleKey: "ctvrt", labelEn: "Neighborhood", labelLocal: "Čtvrť", commonlyUsed: true },
    { type: "MICRO_LOCATION", roleKey: "mikro", labelEn: "Micro-location", labelLocal: "Mikro-lokalita", commonlyUsed: false },
  ],
};

/** Dubai / UAE — map emirate/community/building onto canonical types. */
export const AE_LOCATION_TYPE_REGISTRY: MarketLocationTypeRegistry = {
  marketCode: "AE",
  levels: [
    { type: "COUNTRY", roleKey: "country", labelEn: "Country", labelLocal: "Country", commonlyUsed: true },
    { type: "REGION", roleKey: "emirate", labelEn: "Emirate", labelLocal: "Emirate", commonlyUsed: true },
    { type: "CITY", roleKey: "city", labelEn: "City", labelLocal: "City", commonlyUsed: true },
    { type: "NEIGHBORHOOD", roleKey: "community", labelEn: "Community", labelLocal: "Community", commonlyUsed: true },
    { type: "MICRO_LOCATION", roleKey: "building", labelEn: "Building", labelLocal: "Building", commonlyUsed: true },
    { type: "DISTRICT", roleKey: "district", labelEn: "District", labelLocal: "District", commonlyUsed: false },
    { type: "MUNICIPALITY", roleKey: "municipality", labelEn: "Municipality", labelLocal: "Municipality", commonlyUsed: false },
    { type: "CITY_DISTRICT", roleKey: "sub_community", labelEn: "Sub-community", labelLocal: "Sub-community", commonlyUsed: false },
  ],
};

export const LOCATION_TYPE_REGISTRIES: Record<string, MarketLocationTypeRegistry> =
  {
    CZ: CZ_LOCATION_TYPE_REGISTRY,
    SK: {
      ...CZ_LOCATION_TYPE_REGISTRY,
      marketCode: "SK",
      levels: CZ_LOCATION_TYPE_REGISTRY.levels.map((l) =>
        l.roleKey === "kraj"
          ? { ...l, labelLocal: "Kraj", labelEn: "Region" }
          : l,
      ),
    },
    AE: AE_LOCATION_TYPE_REGISTRY,
  };

export function getLocationTypeRegistry(
  marketCode: string,
): MarketLocationTypeRegistry {
  return (
    LOCATION_TYPE_REGISTRIES[marketCode.toUpperCase()] ?? {
      marketCode: marketCode.toUpperCase(),
      levels: LOCATION_TYPE_ORDER.map((type) => ({
        type,
        roleKey: type.toLowerCase(),
        labelEn: type,
        labelLocal: type,
        commonlyUsed: true,
      })),
    }
  );
}

export function labelForLocationType(
  marketCode: string,
  type: LocationType,
  lang: "en" | "local" = "local",
): string {
  const entry = getLocationTypeRegistry(marketCode).levels.find(
    (l) => l.type === type,
  );
  if (!entry) return type;
  return lang === "en" ? entry.labelEn : entry.labelLocal;
}

export function commonlyUsedLocationTypes(
  marketCode: string,
): LocationType[] {
  return getLocationTypeRegistry(marketCode)
    .levels.filter((l) => l.commonlyUsed)
    .map((l) => l.type);
}
