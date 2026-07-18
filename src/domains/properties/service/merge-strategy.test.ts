import { describe, expect, it } from "vitest";
import {
  mapSourceTypeToTrust,
  planNonDestructiveMerge,
  shouldApplyIncomingField,
} from "./merge-strategy";

describe("merge strategy", () => {
  it("never destroys identity — keeps both ids in the plan", () => {
    const plan = planNonDestructiveMerge({
      propertyAId: "prop-a",
      propertyBId: "prop-b",
      preferredCanonicalId: "prop-a",
      fieldGroups: [
        [
          { fieldKey: "askingPrice", value: 1, trust: "portal" },
          { fieldKey: "askingPrice", value: 2, trust: "verified" },
        ],
      ],
    });
    expect(plan.canonicalPropertyId).toBe("prop-a");
    expect(plan.secondaryPropertyId).toBe("prop-b");
    expect(plan.resolutions[0]?.reason).toBe("verified_source");
    expect(plan.resolutions[0]?.chosen.value).toBe(2);
  });

  it("respects locked analyst overrides over verified sources", () => {
    const plan = planNonDestructiveMerge({
      propertyAId: "a",
      propertyBId: "b",
      fieldGroups: [[{ fieldKey: "usableArea", value: 50, trust: "verified" }]],
      overrides: [
        {
          fieldKey: "usableArea",
          value: 55,
          trust: "manual",
          lockedByOverride: true,
        },
      ],
    });
    expect(plan.resolutions[0]?.reason).toBe("override_locked");
    expect(plan.resolutions[0]?.chosen.value).toBe(55);
    expect(plan.lockedFieldKeys).toContain("usableArea");
  });

  it("maps licensed API to licensed trust", () => {
    expect(mapSourceTypeToTrust("LICENSED_API")).toBe("licensed");
    expect(mapSourceTypeToTrust("PUBLIC_PORTAL", { verified: true })).toBe("verified");
  });

  it("blocks incoming fields when override is locked", () => {
    expect(
      shouldApplyIncomingField({
        fieldKey: "askingPrice",
        overrides: [{ fieldKey: "askingPrice", locked: true }],
      }),
    ).toBe(false);
  });
});
