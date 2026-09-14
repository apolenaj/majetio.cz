/**
 * B2B Organizations — real-estate professionals on Majetio.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  OVER_LIMIT_CTA,
  agentFreePlan,
  agencyGrowthPlan,
  b2bPlansConfig,
  comparePlanTier,
  reconcileListingQuota,
  resolveB2bPlanLimits,
} from "@/domains/organizations";

describe("B2B plan config", () => {
  it("Agent Free caps at 5 active listings", () => {
    expect(agentFreePlan.limits.maxActiveListings).toBe(5);
    expect(b2bPlansConfig.agent_free.limits.maxActiveListings).toBe(5);
  });

  it("exposes Agent Pro, Agency Growth, Developer models", () => {
    expect(b2bPlansConfig.agent_pro.limits.maxActiveListings).toBeGreaterThan(5);
    expect(agencyGrowthPlan.limits.seats).toBeGreaterThan(1);
    expect(b2bPlansConfig.developer_standard.limits.projectsMax).toBe(20);
  });
});

describe("Listing verification ladder", () => {
  it("schema defines unverified → identity → organization", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/enum ListingVerificationStatus/);
    expect(schema).toMatch(/UNVERIFIED/);
    expect(schema).toMatch(/IDENTITY_VERIFIED/);
    expect(schema).toMatch(/ORGANIZATION_VERIFIED/);
  });

  it("Organization + OrganizationMember roles exist", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/enum OrganizationType/);
    expect(schema).toMatch(/REAL_ESTATE_AGENT/);
    expect(schema).toMatch(/AGENCY/);
    expect(schema).toMatch(/DEVELOPER/);
    expect(schema).toMatch(/PARTNER/);
    expect(schema).toMatch(/enum OrganizationMemberRole/);
    expect(schema).toMatch(/OWNER/);
    expect(schema).toMatch(/ADMIN/);
    expect(schema).toMatch(/AGENT/);
    expect(schema).toMatch(/model Organization /);
    expect(schema).toMatch(/model OrganizationMember /);
  });

  it("Property links to organization listing owner", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/organizationId/);
    expect(schema).toMatch(/listedByUserId/);
    expect(schema).toMatch(/listingOwnerKind/);
    expect(schema).toMatch(/listingQuotaState/);
    expect(schema).toMatch(/OVER_LIMIT/);
  });
});

describe("Quota reconcile — downgrade never deletes", () => {
  it("marks excess OVER_LIMIT and keeps newest within limit", () => {
    const now = Date.now();
    const listings = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      rankAt: new Date(now - i * 1000),
      listingQuotaState: "WITHIN_LIMIT" as const,
    }));

    const result = reconcileListingQuota({
      listings,
      listingsLimit: agentFreePlan.limits.maxActiveListings,
    });

    expect(result.keepWithinLimitIds).toHaveLength(5);
    expect(result.markOverLimitIds).toHaveLength(3);
    expect(result.keepWithinLimitIds).toEqual(["p0", "p1", "p2", "p3", "p4"]);
    expect(result.markOverLimitIds).toEqual(["p5", "p6", "p7"]);
    expect(result.actionRequired.code).toBe(OVER_LIMIT_CTA.code);
    expect(result.actionRequired.actions).toContain("upgrade_plan");
  });

  it("upgrade restores OVER_LIMIT into capacity", () => {
    const now = Date.now();
    const listings = [
      {
        id: "a",
        rankAt: new Date(now),
        listingQuotaState: "WITHIN_LIMIT" as const,
      },
      {
        id: "b",
        rankAt: new Date(now - 1000),
        listingQuotaState: "OVER_LIMIT" as const,
      },
      {
        id: "c",
        rankAt: new Date(now - 2000),
        listingQuotaState: "OVER_LIMIT" as const,
      },
    ];
    const result = reconcileListingQuota({
      listings,
      listingsLimit: 3,
    });
    expect(result.markOverLimitIds).toHaveLength(0);
    expect(result.restoreWithinLimitIds.sort()).toEqual(["b", "c"]);
  });
});

describe("Plan tier compare + limits from PricingPlan JSON", () => {
  it("detects upgrade and downgrade", () => {
    expect(comparePlanTier("agent_free", "agent_pro")).toBe("UPGRADE");
    expect(comparePlanTier("agent_pro", "agent_free")).toBe("DOWNGRADE");
    expect(comparePlanTier("agency_growth", "agency_growth")).toBe("SAME");
  });

  it("reads limits from PricingPlan.limits payload", () => {
    const limits = resolveB2bPlanLimits("agent_pro", {
      maxActiveListings: 40,
      seats: 1,
      audience: "b2b",
    });
    expect(limits.maxActiveListings).toBe(40);
  });
});

describe("OrganizationService surface", () => {
  it("exports plan change and publish gates", async () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/organizations/service.ts"),
      "utf8",
    );
    expect(file).toMatch(/changeOrganizationPlan/);
    expect(file).toMatch(/assertCanPublishListing/);
    expect(file).toMatch(/OVER_LIMIT/);
    expect(file).toMatch(/createOrganization/);
  });
});
