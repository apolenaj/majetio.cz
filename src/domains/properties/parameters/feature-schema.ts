/**
 * Centrální schema strukturovaných parametrů vybavení.
 * Ano / Ne / Nevyplněno — nikdy null → false.
 */

export type FeaturePresence = "yes" | "no" | "unset";

export type FeatureKey =
  | "balcony"
  | "loggia"
  | "terrace"
  | "garden"
  | "cellar"
  | "garage"
  | "parking"
  | "elevator"
  | "barrierFree"
  | "pool"
  | "furnished";

export type UtilityStatus =
  | "connected"
  | "at_boundary"
  | "in_reach"
  | "none"
  | "unknown";

export type FeatureParamDef = {
  key: FeatureKey;
  labelCs: string;
  /** Sekce na veřejném detailu. */
  group:
    | "outdoor"
    | "storage_parking"
    | "technical"
    | "comfort";
  /** Typy nemovitostí, kde parametr dává smysl. Prázdné = všechny. */
  propertyTypes: string[] | "all";
  requiredOnPublish: boolean;
  allowsArea: boolean;
  allowsCount: boolean;
  allowsNote: boolean;
};

export const FEATURE_PARAM_DEFS: readonly FeatureParamDef[] = [
  {
    key: "balcony",
    labelCs: "Balkon",
    group: "outdoor",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE"],
    requiredOnPublish: true,
    allowsArea: true,
    allowsCount: true,
    allowsNote: true,
  },
  {
    key: "loggia",
    labelCs: "Lodžie",
    group: "outdoor",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE"],
    requiredOnPublish: true,
    allowsArea: true,
    allowsCount: true,
    allowsNote: true,
  },
  {
    key: "terrace",
    labelCs: "Terasa",
    group: "outdoor",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE"],
    requiredOnPublish: true,
    allowsArea: true,
    allowsCount: true,
    allowsNote: true,
  },
  {
    key: "garden",
    labelCs: "Zahrada",
    group: "outdoor",
    propertyTypes: ["HOUSE", "VILLA", "TOWNHOUSE", "LAND"],
    requiredOnPublish: true,
    allowsArea: true,
    allowsCount: false,
    allowsNote: true,
  },
  {
    key: "cellar",
    labelCs: "Sklep",
    group: "storage_parking",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE"],
    requiredOnPublish: true,
    allowsArea: true,
    allowsCount: false,
    allowsNote: true,
  },
  {
    key: "parking",
    labelCs: "Vyhrazené parkování",
    group: "storage_parking",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE", "COMMERCIAL"],
    requiredOnPublish: true,
    allowsArea: false,
    allowsCount: true,
    allowsNote: true,
  },
  {
    key: "garage",
    labelCs: "Garáž",
    group: "storage_parking",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE"],
    requiredOnPublish: true,
    allowsArea: true,
    allowsCount: true,
    allowsNote: true,
  },
  {
    key: "elevator",
    labelCs: "Výtah",
    group: "technical",
    propertyTypes: ["APARTMENT"],
    requiredOnPublish: true,
    allowsArea: false,
    allowsCount: false,
    allowsNote: true,
  },
  {
    key: "barrierFree",
    labelCs: "Bezbariérový přístup",
    group: "technical",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE", "COMMERCIAL"],
    requiredOnPublish: true,
    allowsArea: false,
    allowsCount: false,
    allowsNote: true,
  },
  {
    key: "pool",
    labelCs: "Bazén",
    group: "outdoor",
    propertyTypes: ["HOUSE", "VILLA"],
    requiredOnPublish: false,
    allowsArea: true,
    allowsCount: false,
    allowsNote: true,
  },
  {
    key: "furnished",
    labelCs: "Vybaveno",
    group: "comfort",
    propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE"],
    requiredOnPublish: false,
    allowsArea: false,
    allowsCount: false,
    allowsNote: true,
  },
] as const;

export type FeatureDetail = {
  areaSqm?: number | null;
  areaUnknown?: boolean;
  count?: number | null;
  note?: string | null;
  cellarType?: "room" | "cage" | "other" | null;
  parkingType?: "owned" | "reserved" | "rented" | "shared" | null;
  includedInPrice?: boolean | null;
  separatePriceCzk?: number | null;
  garageKind?: "separate" | "in_building" | "collective" | null;
  gardenUse?: "private" | "shared" | "exclusive" | null;
  barrierBuilding?: FeaturePresence | null;
  barrierUnit?: FeaturePresence | null;
};

export type FeatureDetailsMap = Partial<Record<FeatureKey, FeatureDetail>>;

export type FeatureAnswers = Partial<Record<FeatureKey, FeaturePresence>>;

export function isFeatureApplicable(
  key: FeatureKey,
  propertyType: string,
): boolean {
  const def = FEATURE_PARAM_DEFS.find((item) => item.key === key);
  if (!def) return false;
  if (def.propertyTypes === "all") return true;
  return def.propertyTypes.includes(propertyType);
}

export function requiredFeatureKeys(propertyType: string): FeatureKey[] {
  return FEATURE_PARAM_DEFS.filter(
    (def) =>
      def.requiredOnPublish && isFeatureApplicable(def.key, propertyType),
  ).map((def) => def.key);
}

export function applicableFeatureDefs(propertyType: string): FeatureParamDef[] {
  return FEATURE_PARAM_DEFS.filter((def) =>
    isFeatureApplicable(def.key, propertyType),
  );
}

/** DB boolean? → presence. Nikdy false z null. */
export function presenceFromDb(value: boolean | null | undefined): FeaturePresence {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unset";
}

export function presenceToDb(value: FeaturePresence): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

export const UTILITY_STATUS_LABELS: Record<UtilityStatus, string> = {
  connected: "Připojeno",
  at_boundary: "Na hranici pozemku",
  in_reach: "V dosahu (není připojení)",
  none: "Není",
  unknown: "Nezjištěno",
};

export const LAND_UTILITY_KEYS = [
  "electricity",
  "water",
  "sewage",
  "gas",
  "access",
] as const;

export type LandUtilityKey = (typeof LAND_UTILITY_KEYS)[number];

export const LAND_UTILITY_LABELS: Record<LandUtilityKey, string> = {
  electricity: "Elektřina",
  water: "Voda",
  sewage: "Kanalizace",
  gas: "Plyn",
  access: "Přístup",
};
