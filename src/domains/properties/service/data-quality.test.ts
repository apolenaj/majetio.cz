import { describe, expect, it } from "vitest";
import { detectDataQualityIssues } from "./data-quality";
import { computeCompletenessScore } from "./completeness";
import { applyOverridesToIncomingFields, resolveFieldValue } from "./field-overrides";

describe("detectDataQualityIssues", () => {
  it("flags critical non-positive price and area", () => {
    const issues = detectDataQualityIssues({ askingPrice: 0, usableArea: -5 });
    expect(issues.map((i) => i.ruleCode).sort()).toEqual([
      "AREA_NON_POSITIVE",
      "PRICE_NON_POSITIVE",
    ]);
    expect(issues.every((i) => i.severity === "CRITICAL")).toBe(true);
  });

  it("warns on extreme Kč/m² and area mismatch", () => {
    const issues = detectDataQualityIssues({
      askingPrice: 50_000_000,
      usableArea: 40,
      floorArea: 100,
    });
    expect(issues.some((i) => i.ruleCode === "EXTREME_PRICE_PER_SQM")).toBe(true);
    expect(issues.some((i) => i.ruleCode === "AREA_MISMATCH")).toBe(true);
  });
});

describe("computeCompletenessScore", () => {
  it("scores fuller listings higher", () => {
    const empty = computeCompletenessScore({});
    const full = computeCompletenessScore({
      askingPrice: 5_000_000,
      usableArea: 70,
      publicCity: "Brno",
      title: "Byt 3+1",
      description: "Prostorný byt v širším centru s výtahem a sklepem, po rekonstrukci.",
      propertyType: "APARTMENT",
      layout: "3+1",
      yearBuilt: 1980,
      hasMedia: true,
    });
    expect(empty.score).toBe(0);
    expect(full.score).toBe(100);
  });
});

describe("field overrides", () => {
  it("skips locked fields on import", () => {
    const result = applyOverridesToIncomingFields(
      [
        { fieldKey: "askingPrice", value: "100" },
        { fieldKey: "title", value: "New" },
      ],
      [{ fieldKey: "askingPrice", value: "90", locked: true }],
    );
    expect(result.skippedLocked).toHaveLength(1);
    expect(result.applied).toEqual([{ fieldKey: "title", value: "New" }]);
  });

  it("resolves locked override value first", () => {
    expect(
      resolveFieldValue({
        fieldKey: "askingPrice",
        storedValue: "100",
        overrides: [{ fieldKey: "askingPrice", value: "95", locked: true }],
      }),
    ).toBe("95");
  });
});
