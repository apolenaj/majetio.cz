/**
 * Concept A — Current condition (současný stav).
 * Describes the property *before* renovation. Never includes cost or ARV.
 */

/** Assessed physical areas — aligned with renovation scope categories. */
export const CONDITION_AREAS = [
  "walls",
  "floors",
  "electrical",
  "plumbing",
  "bathroom",
  "kitchen",
  "windows",
  "heating",
  "structure",
] as const;

export type ConditionArea = (typeof CONDITION_AREAS)[number];

/** Per-area qualitative status. */
export const CONDITION_STATUSES = [
  "good",
  "acceptable",
  "aging",
  "poor",
  "critical",
  "unknown",
] as const;

export type ConditionAreaStatus = (typeof CONDITION_STATUSES)[number];

/** How a per-area status was determined. */
export const CONDITION_ASSESSMENT_SOURCES = [
  "property_condition",
  "user_override",
  "inspection",
  "inferred",
] as const;

export type ConditionAssessmentSource =
  (typeof CONDITION_ASSESSMENT_SOURCES)[number];

/** Prisma-aligned property condition (listing-level). */
export const PROPERTY_CONDITIONS = [
  "NEW",
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "NEEDS_RENOVATION",
  "SHELL",
  "UNKNOWN",
] as const;

export type PropertyCondition = (typeof PROPERTY_CONDITIONS)[number];

export type ConditionAreaAssessment = {
  area: ConditionArea;
  status: ConditionAreaStatus;
  source: ConditionAssessmentSource;
  /** 0–100; null when status is unknown and no basis exists. */
  confidence: number | null;
  notes: string | null;
};

/**
 * Detailed condition assessment derived from `Property.condition` and optional
 * inspection overrides. Does not include renovation scope or costs.
 */
export type RenovationConditionAssessment = {
  propertyCondition: PropertyCondition | null;
  areas: Record<ConditionArea, ConditionAreaAssessment>;
  /**
   * Aggregate severity 0–100 (higher = worse). Null when inputs are insufficient.
   */
  severityScore: number | null;
  conditionModelVersion: string;
  assessedAt: Date;
  /** True when listing condition is UNKNOWN or large parts rely on defaults. */
  isPartial: boolean;
};

/** Minimal property snapshot for condition inference. */
export type ConditionPropertyInput = {
  propertyId?: string;
  condition: PropertyCondition;
  usableArea?: number | null;
  floorArea?: number | null;
  roomsCount?: number | null;
  bathroomsCount?: number | null;
  yearBuilt?: number | null;
  yearRenovated?: number | null;
  /** Per-area overrides from inspection or analyst — never inferred for structure. */
  areaOverrides?: Partial<Record<ConditionArea, ConditionAreaStatus>>;
};

export type ConditionService = {
  assess(input: ConditionPropertyInput): Promise<RenovationConditionAssessment>;
};
