/**
 * Concept B — Renovation scope (rozsah rekonstrukce).
 * What will be done — rooms, systems, finish level. Never prices or ARV.
 */

/** Work categories aligned with Czech renovation catalogues. */
export const RENOVATION_CATEGORIES = [
  "demolition",
  "walls",
  "floors",
  "ceilings",
  "painting",
  "electrical",
  "plumbing",
  "heating",
  "HVAC",
  "bathroom",
  "kitchen",
  "windows",
  "doors",
  "lighting",
  "built_in_furniture",
  "exterior",
  "balcony",
  "terrace",
  "roof",
  "insulation",
  "facade",
  "common_areas",
  "landscaping",
  "structural",
  "other",
] as const;

export type RenovationCategory = (typeof RENOVATION_CATEGORIES)[number];

export const RENOVATION_UNITS = [
  "m2",
  "bm",
  "ks",
  "mistnost",
  "celek",
  "hodina",
] as const;

export type RenovationUnit = (typeof RENOVATION_UNITS)[number];

export const QUALITY_LEVELS = ["economy", "standard", "premium"] as const;

export type QualityLevel = (typeof QUALITY_LEVELS)[number];

/** Renovation intensity / finish standard. */
export const RENOVATION_STANDARDS = [
  "cosmetic",
  "light",
  "medium",
  "full",
  "premium",
  "custom",
] as const;

export type RenovationStandard = (typeof RENOVATION_STANDARDS)[number];

export const SCOPE_ORIGINS = [
  "automatic",
  "user_defined",
  "analyst_adjusted",
  "professional",
] as const;

export type ScopeOrigin = (typeof SCOPE_ORIGINS)[number];

export const RENOVATION_ITEM_SOURCES = [
  "standard_catalogue",
  "automatic_inference",
  "user_defined",
  "analyst",
  "professional",
] as const;

export type RenovationItemSource = (typeof RENOVATION_ITEM_SOURCES)[number];

/** Single line-item in a renovation scope (costs filled in Prompt 3). */
export type RenovationItem = {
  id: string;
  category: RenovationCategory;
  /** Human-readable scope description (e.g. "Kompletní rekonstrukce koupelny"). */
  scope: string;
  quantity: number | null;
  unit: RenovationUnit | null;
  qualityLevel: QualityLevel;
  /** CZK major units — null until cost engine runs. */
  costLow: number | null;
  costBase: number | null;
  costHigh: number | null;
  confidence: number | null;
  source: RenovationItemSource;
};

/** Immutable snapshot of automatic inference — preserved when user edits. */
export type RenovationScopeSnapshot = {
  version: string;
  standard: RenovationStandard;
  items: RenovationItem[];
  confidence: number | null;
  capturedAt: Date;
};

/**
 * Full renovation scope definition for a property / scenario.
 * Concept B only — totals live in costs/ (C).
 */
export type RenovationScope = {
  version: string;
  standard: RenovationStandard;
  items: RenovationItem[];
  origin: ScopeOrigin;
  /** Frozen automatic result before user overrides (null when origin is automatic). */
  automaticSnapshot: RenovationScopeSnapshot | null;
  inferredFromCondition: boolean;
  confidence: number | null;
  notes: string | null;
};

export type ScopePropertyInput = {
  propertyId?: string;
  usableArea?: number | null;
  floorArea?: number | null;
  roomsCount?: number | null;
  bathroomsCount?: number | null;
};

export type ScopeResolveInput = ScopePropertyInput & {
  scopeVersion?: string;
  conditionAssessment: import("../condition/types").RenovationConditionAssessment;
  /** Force a standard instead of inferring from condition severity. */
  standardOverride?: RenovationStandard;
};

export type ScopeUserOverrideInput = {
  automaticScope: RenovationScope;
  /** Partial or full replacement items — merged by id / category. */
  items: RenovationItem[];
  standard?: RenovationStandard;
  notes?: string | null;
};

export type ScopeService = {
  resolve(input: ScopeResolveInput): Promise<RenovationScope>;
  applyUserOverrides(input: ScopeUserOverrideInput): RenovationScope;
};
