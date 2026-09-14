/**
 * Condition assessment — maps listing-level Property.condition to per-area statuses.
 */

import {
  CONDITION_AREAS,
  type ConditionArea,
  type ConditionAreaAssessment,
  type ConditionAreaStatus,
  type ConditionAssessmentSource,
  type ConditionPropertyInput,
  type PropertyCondition,
  type RenovationConditionAssessment,
} from "./types";

export const CONDITION_MODEL_VERSION = "condition.v2026.07";

/** Severity weight for aggregate score (higher = worse). */
const STATUS_SEVERITY: Record<ConditionAreaStatus, number | null> = {
  good: 10,
  acceptable: 25,
  aging: 45,
  poor: 70,
  critical: 90,
  unknown: null,
};

/** Baseline per-area status templates keyed by listing condition. */
const BASELINE_BY_PROPERTY_CONDITION: Record<
  PropertyCondition,
  Record<ConditionArea, ConditionAreaStatus>
> = {
  NEW: {
    walls: "good",
    floors: "good",
    electrical: "good",
    plumbing: "good",
    bathroom: "good",
    kitchen: "good",
    windows: "good",
    heating: "good",
    structure: "good",
  },
  EXCELLENT: {
    walls: "good",
    floors: "good",
    electrical: "acceptable",
    plumbing: "good",
    bathroom: "good",
    kitchen: "good",
    windows: "good",
    heating: "acceptable",
    structure: "good",
  },
  GOOD: {
    walls: "acceptable",
    floors: "acceptable",
    electrical: "acceptable",
    plumbing: "acceptable",
    bathroom: "acceptable",
    kitchen: "acceptable",
    windows: "acceptable",
    heating: "acceptable",
    structure: "good",
  },
  AVERAGE: {
    walls: "aging",
    floors: "aging",
    electrical: "aging",
    plumbing: "acceptable",
    bathroom: "aging",
    kitchen: "aging",
    windows: "aging",
    heating: "aging",
    structure: "acceptable",
  },
  NEEDS_RENOVATION: {
    walls: "poor",
    floors: "poor",
    electrical: "poor",
    plumbing: "poor",
    bathroom: "poor",
    kitchen: "poor",
    windows: "aging",
    heating: "poor",
    structure: "unknown",
  },
  SHELL: {
    walls: "critical",
    floors: "critical",
    electrical: "critical",
    plumbing: "critical",
    bathroom: "critical",
    kitchen: "critical",
    windows: "critical",
    heating: "critical",
    structure: "unknown",
  },
  UNKNOWN: {
    walls: "unknown",
    floors: "unknown",
    electrical: "unknown",
    plumbing: "unknown",
    bathroom: "unknown",
    kitchen: "unknown",
    windows: "unknown",
    heating: "unknown",
    structure: "unknown",
  },
};

/** Confidence when derived purely from listing condition. */
const BASELINE_CONFIDENCE: Record<PropertyCondition, number> = {
  NEW: 75,
  EXCELLENT: 70,
  GOOD: 65,
  AVERAGE: 60,
  NEEDS_RENOVATION: 55,
  SHELL: 50,
  UNKNOWN: 20,
};

function confidenceForArea(
  area: ConditionArea,
  status: ConditionAreaStatus,
  propertyCondition: PropertyCondition,
  source: ConditionAssessmentSource,
): number | null {
  if (status === "unknown") {
    return source === "user_override" || source === "inspection" ? 85 : null;
  }
  let base = BASELINE_CONFIDENCE[propertyCondition];
  if (area === "structure") {
    base = Math.min(base, 40);
  }
  if (source === "inspection") {
    return Math.max(base, 90);
  }
  if (source === "user_override") {
    return 80;
  }
  return base;
}

function buildAreaAssessment(
  area: ConditionArea,
  status: ConditionAreaStatus,
  propertyCondition: PropertyCondition,
  source: ConditionAssessmentSource,
  notes: string | null = null,
): ConditionAreaAssessment {
  return {
    area,
    status,
    source,
    confidence: confidenceForArea(area, status, propertyCondition, source),
    notes,
  };
}

function computeSeverityScore(
  areas: Record<ConditionArea, ConditionAreaAssessment>,
): number | null {
  const weights = areas.structure.status === "unknown" ? 0.9 : 1;
  let sum = 0;
  let count = 0;

  for (const area of CONDITION_AREAS) {
    const severity = STATUS_SEVERITY[areas[area].status];
    if (severity === null) {
      continue;
    }
    const weight = area === "structure" ? weights : 1;
    sum += severity * weight;
    count += weight;
  }

  if (count === 0) {
    return null;
  }

  return Math.round(sum / count);
}

/**
 * Assess current property condition into per-area statuses.
 * Structure is never inferred as poor/critical from listing condition alone.
 */
export function assessCondition(
  input: ConditionPropertyInput,
): RenovationConditionAssessment {
  const propertyCondition = input.condition;
  const baseline = BASELINE_BY_PROPERTY_CONDITION[propertyCondition];
  const overrides = input.areaOverrides ?? {};
  const areas = {} as Record<ConditionArea, ConditionAreaAssessment>;

  for (const area of CONDITION_AREAS) {
    const override = overrides[area];
    if (override !== undefined) {
      areas[area] = buildAreaAssessment(
        area,
        override,
        propertyCondition,
        area === "structure" ? "inspection" : "user_override",
        "Uživatelský / inspekční override.",
      );
      continue;
    }

    const status = baseline[area];
    const source: ConditionAssessmentSource = "property_condition";
    let notes: string | null = null;

    if (area === "structure" && status === "unknown") {
      notes =
        "Struktura není z inzerátu odvozena — vyžaduje inspekci nebo explicitní vstup.";
    }

    areas[area] = buildAreaAssessment(
      area,
      status,
      propertyCondition,
      source,
      notes,
    );
  }

  const isPartial =
    propertyCondition === "UNKNOWN" ||
    Object.values(areas).some((a) => a.status === "unknown");

  return {
    propertyCondition,
    areas,
    severityScore: computeSeverityScore(areas),
    conditionModelVersion: CONDITION_MODEL_VERSION,
    assessedAt: new Date(),
    isPartial,
  };
}
