/**
 * Prompt 2/5 — Condition assessment & renovation scope inference.
 */

import { describe, expect, it } from "vitest";

import { assessCondition, CONDITION_AREAS } from "./condition";
import {
  applyUserScopeOverrides,
  inferScopeFromCondition,
  restoreAutomaticScope,
  STANDARD_BASELINE_CATEGORIES,
} from "./scope";

describe("RenovationConditionAssessment", () => {
  it("maps NEEDS_RENOVATION to poor areas with unknown structure", () => {
    const result = assessCondition({ condition: "NEEDS_RENOVATION" });

    expect(result.propertyCondition).toBe("NEEDS_RENOVATION");
    expect(result.areas.walls.status).toBe("poor");
    expect(result.areas.bathroom.status).toBe("poor");
    expect(result.areas.structure.status).toBe("unknown");
    expect(result.areas.structure.notes).toContain("Struktura");
    expect(result.severityScore).toBeGreaterThan(50);
  });

  it("maps NEW to good across all areas", () => {
    const result = assessCondition({ condition: "NEW" });

    for (const area of CONDITION_AREAS) {
      expect(result.areas[area].status).toBe("good");
    }
    expect(result.isPartial).toBe(false);
  });

  it("respects per-area inspection overrides including structure", () => {
    const result = assessCondition({
      condition: "NEEDS_RENOVATION",
      areaOverrides: { structure: "critical" },
    });

    expect(result.areas.structure.status).toBe("critical");
    expect(result.areas.structure.source).toBe("inspection");
  });

  it("marks UNKNOWN condition as partial", () => {
    const result = assessCondition({ condition: "UNKNOWN" });
    expect(result.isPartial).toBe(true);
    expect(result.severityScore).toBeNull();
  });
});

describe("RenovationScope inference", () => {
  it("infers medium standard for NEEDS_RENOVATION with baseline categories", () => {
    const condition = assessCondition({
      condition: "NEEDS_RENOVATION",
      usableArea: 65,
      bathroomsCount: 1,
    });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });

    expect(scope.standard).toBe("medium");
    expect(scope.origin).toBe("automatic");
    expect(scope.items.length).toBeGreaterThan(0);

    const categories = scope.items.map((i) => i.category);
    for (const expected of STANDARD_BASELINE_CATEGORIES.medium) {
      expect(categories).toContain(expected);
    }
    expect(categories).not.toContain("structural");
    expect(scope.notes).toContain("Statické zásahy nejsou zahrnuty");
  });

  it("does not include structural for SHELL without explicit structure data", () => {
    const condition = assessCondition({ condition: "SHELL" });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });

    expect(scope.standard).toBe("full");
    expect(scope.items.map((i) => i.category)).not.toContain("structural");
  });

  it("includes structural only when structure is explicitly poor/critical", () => {
    const condition = assessCondition({
      condition: "NEEDS_RENOVATION",
      areaOverrides: { structure: "critical" },
    });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });

    expect(scope.items.map((i) => i.category)).toContain("structural");
  });

  it("populates RenovationItem fields without cost amounts", () => {
    const condition = assessCondition({
      condition: "AVERAGE",
      usableArea: 72,
    });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
      bathroomsCount: 1,
    });

    const bathroom = scope.items.find((i) => i.category === "bathroom");
    expect(bathroom).toBeDefined();
    expect(bathroom!.quantity).toBe(1);
    expect(bathroom!.unit).toBe("mistnost");
    expect(bathroom!.qualityLevel).toBe("economy");
    expect(bathroom!.costBase).toBeNull();
    expect(bathroom!.source).toBe("automatic_inference");
  });
});

describe("User scope overrides", () => {
  it("creates user_defined scope and preserves automatic snapshot", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const automatic = inferScopeFromCondition({ conditionAssessment: condition });
    const originalItemCount = automatic.items.length;

    const userDefined = applyUserScopeOverrides({
      automaticScope: automatic,
      items: [
        {
          id: "scope-kitchen",
          category: "kitchen",
          scope: "Premium kuchyně na míru",
          quantity: 1,
          unit: "mistnost",
          qualityLevel: "premium",
          costLow: null,
          costBase: null,
          costHigh: null,
          confidence: null,
          source: "user_defined",
        },
        {
          id: "scope-roof",
          category: "roof",
          scope: "Oprava střechy",
          quantity: 1,
          unit: "celek",
          qualityLevel: "standard",
          costLow: null,
          costBase: null,
          costHigh: null,
          confidence: null,
          source: "user_defined",
        },
      ],
      standard: "premium",
    });

    expect(userDefined.origin).toBe("user_defined");
    expect(userDefined.automaticSnapshot).not.toBeNull();
    expect(userDefined.automaticSnapshot!.items).toHaveLength(originalItemCount);
    expect(userDefined.automaticSnapshot!.standard).toBe("medium");

    const kitchen = userDefined.items.find((i) => i.category === "kitchen");
    expect(kitchen!.scope).toBe("Premium kuchyně na míru");
    expect(kitchen!.qualityLevel).toBe("premium");
    expect(kitchen!.source).toBe("user_defined");

    expect(userDefined.items.some((i) => i.category === "roof")).toBe(true);
    expect(automatic.items).toHaveLength(originalItemCount);
    expect(automatic.origin).toBe("automatic");
  });

  it("restores automatic scope from snapshot", () => {
    const condition = assessCondition({ condition: "GOOD" });
    const automatic = inferScopeFromCondition({ conditionAssessment: condition });
    const userDefined = applyUserScopeOverrides({
      automaticScope: automatic,
      items: [],
      standard: "full",
    });

    const restored = restoreAutomaticScope(userDefined);
    expect(restored).not.toBeNull();
    expect(restored!.origin).toBe("automatic");
    expect(restored!.standard).toBe(automatic.standard);
    expect(restored!.items).toEqual(automatic.items);
  });
});
