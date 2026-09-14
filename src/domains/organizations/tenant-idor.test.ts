import { beforeEach, describe, expect, it, vi } from "vitest";

const orgFindUnique = vi.fn();
const memberFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    organization: {
      findUnique: (...a: unknown[]) => orgFindUnique(...a),
    },
    organizationMember: {
      findFirst: (...a: unknown[]) => memberFindFirst(...a),
    },
  },
}));

import { assertOrganizationAccess } from "./tenant";

describe("Organization IDOR / billing boundaries (174/175) — runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgFindUnique.mockResolvedValue({ id: "org_a" });
  });

  it("rejects foreign user without membership", async () => {
    memberFindFirst.mockResolvedValue(null);
    const result = await assertOrganizationAccess({
      actor: { userId: "user_foreign", role: "USER" },
      organizationId: "org_a",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("forbidden");
      expect(result.error).toMatch(/přístup/i);
    }
  });

  it("allows AGENT membership for read but blocks billing", async () => {
    memberFindFirst.mockResolvedValue({ role: "AGENT" });
    const read = await assertOrganizationAccess({
      actor: { userId: "agent_1", role: "USER" },
      organizationId: "org_a",
    });
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.canViewBilling).toBe(false);
      expect(read.memberRole).toBe("AGENT");
    }

    const billing = await assertOrganizationAccess({
      actor: { userId: "agent_1", role: "USER" },
      organizationId: "org_a",
      requireBilling: true,
    });
    expect(billing.ok).toBe(false);
    if (!billing.ok) {
      expect(billing.error).toMatch(/Billing|OWNER/i);
    }
  });

  it("allows OWNER billing mutations", async () => {
    memberFindFirst.mockResolvedValue({ role: "OWNER" });
    const billing = await assertOrganizationAccess({
      actor: { userId: "owner_1", role: "USER" },
      organizationId: "org_a",
      requireBilling: true,
    });
    expect(billing.ok).toBe(true);
    if (billing.ok) {
      expect(billing.canViewBilling).toBe(true);
    }
  });

  it("platform ADMIN bypasses membership for tenant access", async () => {
    const result = await assertOrganizationAccess({
      actor: { userId: "admin_1", role: "ADMIN" },
      organizationId: "org_a",
      requireBilling: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.memberRole).toBe("PLATFORM_ADMIN");
      expect(result.canViewBilling).toBe(true);
    }
    expect(memberFindFirst).not.toHaveBeenCalled();
  });
});
