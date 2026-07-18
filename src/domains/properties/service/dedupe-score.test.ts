import { describe, expect, it } from "vitest";
import {
  computeDedupeScore,
  orderedPropertyPairIds,
  DEDUPE_REVIEW_THRESHOLD,
} from "./dedupe-score";

describe("computeDedupeScore", () => {
  it("scores identical address + area + price highly", () => {
    const a = {
      id: "a",
      street: "Vinohradská",
      houseNumber: "12",
      publicCity: "Praha",
      usableArea: 62,
      askingPrice: 7_500_000,
      title: "Byt 2+kk Vinohrady",
    };
    const b = {
      id: "b",
      street: "Vinohradská",
      houseNumber: "12",
      publicCity: "Praha",
      usableArea: 63,
      askingPrice: 7_450_000,
      title: "Byt 2+kk Vinohrady centrum",
    };
    const result = computeDedupeScore(a, b);
    expect(result.breakdown.location).toBe(1);
    expect(result.similarityScore).toBeGreaterThanOrEqual(DEDUPE_REVIEW_THRESHOLD);
    expect(result.aboveReviewThreshold).toBe(true);
  });

  it("gives high location weight for close GPS", () => {
    const a = {
      id: "a",
      latitude: 50.0755,
      longitude: 14.4378,
      usableArea: 50,
    };
    const b = {
      id: "b",
      latitude: 50.07551,
      longitude: 14.43782,
      usableArea: 80,
    };
    const result = computeDedupeScore(a, b);
    expect(result.breakdown.location).toBeGreaterThanOrEqual(0.85);
  });

  it("orders pair ids stably", () => {
    expect(orderedPropertyPairIds("z", "a")).toEqual({
      propertyAId: "a",
      propertyBId: "z",
    });
  });
});
