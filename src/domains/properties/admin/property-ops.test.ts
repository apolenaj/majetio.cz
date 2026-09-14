import { describe, expect, it } from "vitest";

import { validatePropertyForPublish } from "./publish-validation";
import {
  buildUserFacingModerationMessage,
  requiresModerationReason,
  statusAfterModerationDecision,
} from "./moderation-copy";
import {
  isOverrideActive,
  resolveCanonicalFieldValue,
} from "./override-resolve";
import { planNonDestructiveMerge } from "@/domains/properties/service/merge-strategy";

describe("publish validation", () => {
  it("blocks missing price and title", () => {
    const result = validatePropertyForPublish({
      title: "",
      propertyType: "APARTMENT",
      marketCode: "CZ",
      publicCity: "Praha",
      askingPrice: null,
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "REQUIRED_TITLE")).toBe(true);
    expect(result.issues.some((i) => i.code === "INVALID_PRICE")).toBe(true);
  });

  it("passes a minimal valid listing", () => {
    const result = validatePropertyForPublish({
      title: "Byt 2+kk",
      propertyType: "APARTMENT",
      marketCode: "CZ",
      publicCity: "Brno",
      askingPrice: 4_500_000,
      usableArea: 55,
      openCriticalDqCount: 0,
    });
    expect(result.ok).toBe(true);
  });
});

describe("moderation copy", () => {
  it("maps decisions to statuses", () => {
    expect(statusAfterModerationDecision("APPROVE")).toBe("ACTIVE");
    expect(statusAfterModerationDecision("REJECT")).toBe("REJECTED");
    expect(statusAfterModerationDecision("REQUEST_CHANGES")).toBe("DRAFT");
    expect(statusAfterModerationDecision("SUSPEND")).toBe("SUSPENDED");
  });

  it("requires reason for reject/suspend/changes", () => {
    expect(requiresModerationReason("REJECT")).toBe(true);
    expect(requiresModerationReason("APPROVE")).toBe(false);
  });

  it("builds safe user-facing reject message", () => {
    const msg = buildUserFacingModerationMessage({
      decision: "REJECT",
      reason: "Chybí cena a lokalita",
    });
    expect(msg).toContain("neschválili");
    expect(msg).toContain("Chybí cena");
  });
});

describe("override expiry", () => {
  it("ignores expired overrides", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    expect(isOverrideActive({ expiresAt: past }, new Date("2024-01-01"))).toBe(
      false,
    );
    const resolved = resolveCanonicalFieldValue({
      fieldKey: "title",
      storedValue: "Stored",
      overrides: [
        {
          fieldKey: "title",
          value: "Override",
          locked: true,
          reason: "test",
          expiresAt: past,
        },
      ],
      now: new Date("2024-01-01"),
    });
    expect(resolved.fromOverride).toBe(false);
    expect(resolved.value).toBe("Stored");
  });
});

describe("merge plan never destructive", () => {
  it("keeps both property ids", () => {
    const plan = planNonDestructiveMerge({
      propertyAId: "a",
      propertyBId: "b",
      preferredCanonicalId: "a",
      fieldGroups: [
        [
          { fieldKey: "title", value: "A", trust: "portal" },
          { fieldKey: "title", value: "B", trust: "licensed" },
        ],
      ],
    });
    expect(plan.canonicalPropertyId).toBe("a");
    expect(plan.secondaryPropertyId).toBe("b");
    expect(plan.resolutions[0]?.chosen.value).toBe("B");
  });
});
