import { beforeEach, describe, expect, it, vi } from "vitest";

const entitlementFindMany = vi.fn();
const entitlementUpdateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    entitlement: {
      findMany: (...a: unknown[]) => entitlementFindMany(...a),
      updateMany: (...a: unknown[]) => entitlementUpdateMany(...a),
    },
  },
}));

const getUsageQuantity = vi.fn();
const recordUsage = vi.fn();

vi.mock("./usage", () => ({
  getUsageQuantity: (...a: unknown[]) => getUsageQuantity(...a),
  recordUsage: (...a: unknown[]) => recordUsage(...a),
  usageDayKey: () => "2026-07-21",
}));

import { assertFeatureAccess } from "./service";

describe("assertFeatureAccess — EntitlementService gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entitlementUpdateMany.mockResolvedValue({ count: 0 });
    getUsageQuantity.mockResolvedValue(0);
    recordUsage.mockResolvedValue(undefined);
  });

  it("allows BASIC_SCORE on free tier without paid entitlement", async () => {
    entitlementFindMany.mockResolvedValue([]);
    const result = await assertFeatureAccess({
      userId: "u1",
      feature: "BASIC_SCORE",
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.source).toBe("free");
  });

  it("blocks FULL_SCENARIOS without pass/deep/pro (paywall)", async () => {
    entitlementFindMany.mockResolvedValue([]);
    const result = await assertFeatureAccess({
      userId: "u1",
      feature: "FULL_SCENARIOS",
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.code).toBe("paywall");
    }
  });

  it("allows FULL_SCENARIOS with active Buyer Pass", async () => {
    entitlementFindMany.mockResolvedValue([
      {
        id: "ent_pass",
        userId: "u1",
        kind: "BUYER_PASS",
        status: "ACTIVE",
        featureKeys: [
          "DEEP_ANALYSIS",
          "FULL_SCENARIOS",
          "BASIC_SCORE",
          "BASIC_RISKS",
        ],
        expiresAt: new Date("2099-01-01"),
        gracePeriodEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        propertyId: null,
        contentVersionKey: null,
        refreshAfter: null,
      },
    ]);
    const result = await assertFeatureAccess({
      userId: "u1",
      feature: "FULL_SCENARIOS",
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.source).toBe("buyer_pass");
      expect(result.entitlementId).toBe("ent_pass");
    }
  });

  it("allows DEEP_ANALYSIS only for matching property", async () => {
    entitlementFindMany.mockResolvedValue([
      {
        id: "ent_deep",
        userId: "u1",
        kind: "DEEP_ANALYSIS",
        status: "ACTIVE",
        featureKeys: ["DEEP_ANALYSIS", "FULL_SCENARIOS"],
        expiresAt: new Date("2099-01-01"),
        gracePeriodEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        propertyId: "prop_A",
        contentVersionKey: "v1",
        refreshAfter: new Date("2099-01-01"),
      },
    ]);

    const ok = await assertFeatureAccess({
      userId: "u1",
      feature: "DEEP_ANALYSIS",
      propertyId: "prop_A",
    });
    expect(ok.allowed).toBe(true);

    const wrong = await assertFeatureAccess({
      userId: "u1",
      feature: "DEEP_ANALYSIS",
      propertyId: "prop_B",
    });
    // No matching deep for prop_B and no pass → paywall or wrong_property
    expect(wrong.allowed).toBe(false);
  });

  it("enforces Buyer Pass deep analysis quota", async () => {
    entitlementFindMany.mockResolvedValue([
      {
        id: "ent_pass",
        userId: "u1",
        kind: "BUYER_PASS",
        status: "ACTIVE",
        featureKeys: ["DEEP_ANALYSIS", "FULL_SCENARIOS"],
        expiresAt: new Date("2099-01-01"),
        gracePeriodEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        propertyId: null,
        contentVersionKey: null,
        refreshAfter: null,
      },
    ]);
    getUsageQuantity.mockResolvedValue(2); // deepAnalysesIncluded = 2

    const result = await assertFeatureAccess({
      userId: "u1",
      feature: "DEEP_ANALYSIS",
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.code).toBe("quota_exceeded");
  });
});
