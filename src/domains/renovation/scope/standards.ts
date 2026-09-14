/**
 * Renovation standards — category sets per intensity level.
 * Maps finish standards to work categories (Concept B only).
 */

import type {
  ConditionArea,
  ConditionAreaStatus,
} from "../condition/types";
import type { RenovationCategory, RenovationStandard } from "./types";

export const SCOPE_MODEL_VERSION = "scope.v2026.07";

/** Which condition areas drive inclusion for each renovation category. */
export const CATEGORY_CONDITION_AREAS: Partial<
  Record<RenovationCategory, ConditionArea[]>
> = {
  walls: ["walls"],
  floors: ["floors"],
  ceilings: ["walls"],
  painting: ["walls"],
  electrical: ["electrical"],
  plumbing: ["plumbing"],
  heating: ["heating"],
  HVAC: ["heating"],
  bathroom: ["bathroom", "plumbing"],
  kitchen: ["kitchen", "plumbing"],
  windows: ["windows"],
  doors: ["walls"],
  lighting: ["electrical"],
  built_in_furniture: ["kitchen"],
  structural: ["structure"],
};

/** Categories included at each standard regardless of condition (baseline envelope). */
export const STANDARD_BASELINE_CATEGORIES: Record<
  RenovationStandard,
  RenovationCategory[]
> = {
  cosmetic: ["painting"],
  light: ["painting", "floors", "lighting"],
  medium: [
    "painting",
    "floors",
    "electrical",
    "plumbing",
    "bathroom",
    "kitchen",
    "windows",
    "lighting",
  ],
  full: [
    "demolition",
    "walls",
    "floors",
    "ceilings",
    "painting",
    "electrical",
    "plumbing",
    "heating",
    "bathroom",
    "kitchen",
    "windows",
    "doors",
    "lighting",
  ],
  premium: [
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
    "insulation",
    "facade",
  ],
  custom: [],
};

/** Statuses that trigger category inclusion beyond the standard baseline. */
export const TRIGGER_STATUSES: ConditionAreaStatus[] = [
  "aging",
  "poor",
  "critical",
];

const STANDARD_LABELS: Record<RenovationStandard, string> = {
  cosmetic: "Kosmetická",
  light: "Lehká",
  medium: "Střední",
  full: "Kompletní",
  premium: "Premium",
  custom: "Vlastní",
};

export function standardLabel(standard: RenovationStandard): string {
  return STANDARD_LABELS[standard];
}

/** Default human-readable scope text per category. */
export const CATEGORY_SCOPE_LABELS: Record<RenovationCategory, string> = {
  demolition: "Demontáže a odstranění starých prvků",
  walls: "Úpravy stěn (omitky, sádrokarton)",
  floors: "Rekonstrukce podlah",
  ceilings: "Úpravy stropů",
  painting: "Malířské a natěračské práce",
  electrical: "Elektroinstalace",
  plumbing: "Rozvody vody a odpadů",
  heating: "Vytápění a rozvody TZB",
  HVAC: "Větrání a klimatizace",
  bathroom: "Rekonstrukce koupelny",
  kitchen: "Rekonstrukce kuchyně",
  windows: "Výměna / oprava oken",
  doors: "Výměna dveří",
  lighting: "Osvětlení",
  built_in_furniture: "Vestavěný nábytek",
  exterior: "Exteriér nemovitosti",
  balcony: "Balkon",
  terrace: "Terasa",
  roof: "Střecha",
  insulation: "Zateplení",
  facade: "Fasáda",
  common_areas: "Společné prostory",
  landscaping: "Exteriérová úprava pozemku",
  structural: "Statické / konstrukční zásahy",
  other: "Ostatní práce",
};

/** Infer default renovation standard from aggregate condition severity. */
export function inferStandardFromSeverity(
  severityScore: number | null,
  propertyCondition: string | null,
): RenovationStandard {
  if (propertyCondition === "NEW" || propertyCondition === "EXCELLENT") {
    return "cosmetic";
  }
  if (propertyCondition === "GOOD") {
    return "light";
  }
  if (propertyCondition === "AVERAGE") {
    return "light";
  }
  if (propertyCondition === "NEEDS_RENOVATION") {
    return "medium";
  }
  if (propertyCondition === "SHELL") {
    return "full";
  }
  if (severityScore === null) {
    return "medium";
  }
  if (severityScore < 30) {
    return "cosmetic";
  }
  if (severityScore < 50) {
    return "light";
  }
  if (severityScore < 70) {
    return "medium";
  }
  if (severityScore < 85) {
    return "full";
  }
  return "premium";
}

/** Categories activated by condition beyond standard baseline. */
export function categoriesTriggeredByCondition(
  areas: Record<ConditionArea, { status: ConditionAreaStatus }>,
  standard: RenovationStandard,
): RenovationCategory[] {
  const baseline = new Set(STANDARD_BASELINE_CATEGORIES[standard]);
  const triggered: RenovationCategory[] = [];

  for (const [category, mappedAreas] of Object.entries(
    CATEGORY_CONDITION_AREAS,
  ) as [RenovationCategory, ConditionArea[]][]) {
    if (baseline.has(category)) {
      continue;
    }
    if (category === "structural") {
      continue;
    }
    const needsWork = mappedAreas.some((area) =>
      TRIGGER_STATUSES.includes(areas[area].status),
    );
    if (needsWork) {
      triggered.push(category);
    }
  }

  return triggered;
}

/** Resolve final category set for a standard + condition. */
export function resolveCategoriesForScope(
  standard: RenovationStandard,
  areas: Record<ConditionArea, { status: ConditionAreaStatus }>,
): RenovationCategory[] {
  if (standard === "custom") {
    return [];
  }

  const baseline = STANDARD_BASELINE_CATEGORIES[standard];
  const triggered = categoriesTriggeredByCondition(areas, standard);

  const structuralStatus = areas.structure.status;
  const includeStructural =
    structuralStatus === "poor" || structuralStatus === "critical";

  const set = new Set<RenovationCategory>([...baseline, ...triggered]);
  if (includeStructural) {
    set.add("structural");
  }

  return [...set];
}

export function defaultQualityForStandard(
  standard: RenovationStandard,
): "economy" | "standard" | "premium" {
  if (standard === "premium") {
    return "premium";
  }
  if (standard === "cosmetic" || standard === "light") {
    return "economy";
  }
  return "standard";
}
