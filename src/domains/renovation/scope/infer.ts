/**
 * Automatic scope inference from condition assessment (Concept B).
 * Does not assume structural works without explicit structure data.
 */

import type { RenovationConditionAssessment } from "../condition/types";
import {
  CATEGORY_SCOPE_LABELS,
  SCOPE_MODEL_VERSION,
  categoriesTriggeredByCondition,
  defaultQualityForStandard,
  inferStandardFromSeverity,
  resolveCategoriesForScope,
  standardLabel,
} from "./standards";
import type {
  RenovationCategory,
  RenovationItem,
  RenovationScope,
  RenovationStandard,
  ScopePropertyInput,
} from "./types";

function createItemId(category: RenovationCategory): string {
  return `scope-${category}`;
}

function estimateQuantity(
  category: RenovationCategory,
  property: ScopePropertyInput,
): { quantity: number | null; unit: RenovationItem["unit"] } {
  const area = property.usableArea ?? property.floorArea ?? null;
  const rooms = property.roomsCount ?? null;
  const bathrooms = property.bathroomsCount ?? 1;

  switch (category) {
    case "bathroom":
      return { quantity: bathrooms, unit: "mistnost" };
    case "kitchen":
      return { quantity: 1, unit: "mistnost" };
    case "painting":
    case "walls":
    case "floors":
    case "ceilings":
      return area !== null
        ? { quantity: Math.round(area), unit: "m2" }
        : { quantity: null, unit: "m2" };
    case "windows":
      return { quantity: null, unit: "ks" };
    case "electrical":
    case "plumbing":
    case "heating":
      return area !== null
        ? { quantity: Math.round(area), unit: "m2" }
        : { quantity: null, unit: "celek" };
    case "structural":
      return { quantity: 1, unit: "celek" };
    case "demolition":
      return rooms !== null
        ? { quantity: rooms, unit: "mistnost" }
        : { quantity: null, unit: "celek" };
    default:
      return { quantity: null, unit: "celek" };
  }
}

function buildItem(
  category: RenovationCategory,
  standard: RenovationStandard,
  property: ScopePropertyInput,
  confidence: number | null,
): RenovationItem {
  const { quantity, unit } = estimateQuantity(category, property);
  return {
    id: createItemId(category),
    category,
    scope: CATEGORY_SCOPE_LABELS[category],
    quantity,
    unit,
    qualityLevel: defaultQualityForStandard(standard),
    costLow: null,
    costBase: null,
    costHigh: null,
    confidence,
    source: "automatic_inference",
  };
}

function scopeConfidence(
  assessment: RenovationConditionAssessment,
  itemCount: number,
): number | null {
  if (itemCount === 0) {
    return null;
  }
  const areaConfidences = Object.values(assessment.areas)
    .map((a) => a.confidence)
    .filter((c): c is number => c !== null);
  if (areaConfidences.length === 0) {
    return 40;
  }
  const avg =
    areaConfidences.reduce((sum, c) => sum + c, 0) / areaConfidences.length;
  return Math.round(Math.min(avg, 85));
}

export type InferScopeInput = ScopePropertyInput & {
  conditionAssessment: RenovationConditionAssessment;
  standardOverride?: RenovationStandard;
};

/**
 * Infer renovation scope from condition assessment.
 * `needs_renovation` / high severity expands scope but never adds structural
 * unless structure area is explicitly poor/critical.
 */
export function inferScopeFromCondition(input: InferScopeInput): RenovationScope {
  const { conditionAssessment } = input;
  const standard =
    input.standardOverride ??
    inferStandardFromSeverity(
      conditionAssessment.severityScore,
      conditionAssessment.propertyCondition,
    );

  const categories = resolveCategoriesForScope(
    standard,
    conditionAssessment.areas,
  );
  const confidence = scopeConfidence(conditionAssessment, categories.length);

  const items = categories.map((category) =>
    buildItem(category, standard, input, confidence),
  );

  const triggered = categoriesTriggeredByCondition(
    conditionAssessment.areas,
    standard,
  );
  const structuralIncluded = categories.includes("structural");

  const notesParts = [
    `Standard: ${standardLabel(standard)} (${standard}).`,
    `Odvozeno ze stavu nemovitosti (${conditionAssessment.propertyCondition ?? "neznámý"}).`,
  ];
  if (triggered.length > 0) {
    notesParts.push(
      `Rozšířeno o ${triggered.length} kategorií dle horšího stavu oblastí.`,
    );
  }
  if (!structuralIncluded) {
    notesParts.push(
      "Statické zásahy nejsou zahrnuty — chybí explicitní data o stavu konstrukce.",
    );
  }

  return {
    version: SCOPE_MODEL_VERSION,
    standard,
    items,
    origin: "automatic",
    automaticSnapshot: null,
    inferredFromCondition: true,
    confidence,
    notes: notesParts.join(" "),
  };
}
