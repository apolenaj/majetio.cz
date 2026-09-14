/**
 * Transport & Amenities — Majetio Accessibility Profile.
 * Transparent POI proximity metrics. NOT Walk Score (no licensed third-party index).
 */

export type PoiCategory =
  | "PUBLIC_TRANSIT_STOP"
  | "METRO_STATION"
  | "TRAM_STOP"
  | "SCHOOL"
  | "KINDERGARTEN"
  | "GREEN_SPACE"
  | "GROCERY"
  | "HEALTHCARE"
  | "PHARMACY";

/** Official / open-data POI only — no commercial review counts. */
export type PoiRecord = {
  id: string;
  category: PoiCategory;
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  sourceDate: string;
};

export type ProximityMetric = {
  category: PoiCategory;
  labelCs: string;
  nearestDistanceMeters: number | null;
  countWithin500m: number;
  countWithin1000m: number;
  /** Data provenance for nearest POI. */
  source: string | null;
  sourceDate: string | null;
};

/**
 * Majetio Accessibility Index components — per-category, not a single opaque number.
 * Each sub-index is 0–100 or null when data missing.
 */
export type AccessibilitySubIndex = {
  key: string;
  labelCs: string;
  value: number | null;
  confidence: number;
  explanation: string;
};

export type AccessibilityProfile = {
  locationId: string;
  centroid: { latitude: number; longitude: number };
  proximity: ProximityMetric[];
  subIndices: AccessibilitySubIndex[];
  methodologyVersion: string;
  computedAt: string;
  sources: string[];
};

/** Which POI categories matter for which use case — not universal "more = better". */
export type AmenityRelevanceProfile = {
  id: string;
  labelCs: string;
  /** Category → weight 0–1 within this profile; 0 = ignored. */
  categoryWeights: Partial<Record<PoiCategory, number>>;
  /** Max contribution of any single category (prevents one POI type dominating). */
  maxCategoryShare: number;
};

export const POI_CATEGORY_LABELS: Record<PoiCategory, string> = {
  PUBLIC_TRANSIT_STOP: "Zastávka MHD",
  METRO_STATION: "Stanice metra",
  TRAM_STOP: "Zastávka tramvaje",
  SCHOOL: "Základní škola",
  KINDERGARTEN: "Mateřská škola",
  GREEN_SPACE: "Zeleň / park",
  GROCERY: "Potraviny",
  HEALTHCARE: "Zdravotní zařízení",
  PHARMACY: "Lékárna",
};
