import { describe, expect, it } from "vitest";

import {
  RESIDENTIAL_APARTMENT_V1,
  VALUATION_CONFIDENCE_LEVELS,
  VALUATION_STATUSES,
  VALUATION_TYPES,
  type ValuationInputSnapshot,
} from "./types";

describe("valuation domain types (Prompt 10 Part 1)", () => {
  it("exposes all valuation type enum values", () => {
    expect(VALUATION_TYPES).toEqual([
      "AUTOMATED_ESTIMATE",
      "ANALYST_ADJUSTED",
      "PROFESSIONAL_REVIEW",
      "USER_SCENARIO",
    ]);
  });

  it("exposes lifecycle statuses including outdated", () => {
    expect(VALUATION_STATUSES).toContain("DRAFT");
    expect(VALUATION_STATUSES).toContain("CALCULATED");
    expect(VALUATION_STATUSES).toContain("APPROVED");
    expect(VALUATION_STATUSES).toContain("OUTDATED");
  });

  it("exposes confidence levels", () => {
    expect(VALUATION_CONFIDENCE_LEVELS).toEqual([
      "LOW",
      "MEDIUM",
      "HIGH",
      "UNKNOWN",
    ]);
  });

  it("defines residential_apartment_v1 registry seed", () => {
    expect(RESIDENTIAL_APARTMENT_V1.code).toBe("residential_apartment_v1");
    expect(RESIDENTIAL_APARTMENT_V1.supportedPropertyTypes).toContain("APARTMENT");
  });

  it("allows typed input snapshot without inventing values", () => {
    const snapshot: ValuationInputSnapshot = {
      modelCode: RESIDENTIAL_APARTMENT_V1.code,
      modelVersion: RESIDENTIAL_APARTMENT_V1.algorithmVersion,
      propertySnapshot: { propertyId: "prop_1", usableArea: null },
      capturedAt: "2026-07-19T00:00:00.000Z",
    };
    expect(snapshot.propertySnapshot?.usableArea).toBeNull();
  });
});
