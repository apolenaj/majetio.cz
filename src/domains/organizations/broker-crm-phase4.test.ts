import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertOrganizationAccess,
  buildPropertyTenantWhere,
} from "@/domains/organizations/tenant";
import {
  resolveVerificationBadge,
  VERIFICATION_BADGE_COPY_CS,
} from "@/domains/organizations/broker-onboarding";
import {
  computeSlaDueAt,
  evaluateSlaBreach,
  QBL_FIRST_RESPONSE_SLA_HOURS,
} from "@/domains/crm/qualified-buyer-inbox";
import { toPublicLeadDto } from "@/domains/crm/lead-value";

describe("Verification badge (162/163)", () => {
  it("never shows badge for UNVERIFIED", () => {
    expect(resolveVerificationBadge("UNVERIFIED")).toBeNull();
    expect(VERIFICATION_BADGE_COPY_CS.UNVERIFIED).toBeNull();
  });

  it("shows identity/org labels only when verified", () => {
    expect(resolveVerificationBadge("IDENTITY_VERIFIED")?.labelCs).toMatch(
      /identit/i,
    );
    expect(resolveVerificationBadge("ORGANIZATION_VERIFIED")?.labelCs).toMatch(
      /organizac/i,
    );
  });
});

describe("SLA response time — no public ranking (138/139)", () => {
  it("computes 24h SLA window", () => {
    const start = new Date("2026-07-21T10:00:00Z");
    const due = computeSlaDueAt(start);
    expect(due.getTime() - start.getTime()).toBe(
      QBL_FIRST_RESPONSE_SLA_HOURS * 3_600_000,
    );
  });

  it("flags breach after due without first response", () => {
    const slaDueAt = new Date("2026-07-21T10:00:00Z");
    const breached = evaluateSlaBreach({
      slaDueAt,
      firstResponseAt: null,
      now: new Date("2026-07-21T12:00:00Z"),
    });
    expect(breached.breached).toBe(true);
  });

  it("inbox API hardcodes publicRankingEnabled false", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/crm/qualified-buyer-inbox.ts"),
      "utf8",
    );
    expect(file).toMatch(/publicRankingEnabled:\s*false/);
    expect(file).not.toMatch(/brokerScore|leaderboard/i);
  });
});

describe("CRM expected value ≠ realized revenue (185)", () => {
  it("strips expected value from public DTO", () => {
    const publicDto = toPublicLeadDto({
      id: "l1",
      expectedValueMinor: 500_000_00,
      expectedValueCurrency: "CZK",
      expectedValueNote: "internal",
      status: "NEW",
    });
    expect(publicDto).not.toHaveProperty("expectedValueMinor");
    expect(publicDto).toHaveProperty("status", "NEW");
  });

  it("lead-value module never writes RevenueEvent", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/crm/lead-value.ts"),
      "utf8",
    );
    expect(file).not.toMatch(/RevenueEvent|SuccessFeeRecord/);
    expect(file).toMatch(/isRealizedRevenue:\s*false/);
  });
});

describe("Tenant boundaries / IDOR contracts (174/175)", () => {
  it("assertOrganizationAccess rejects foreign org without membership (source)", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/organizations/tenant.ts"),
      "utf8",
    );
    expect(file).toMatch(/Nemáte přístup k této organizaci/);
    expect(file).toMatch(/requireBilling/);
    expect(file).toMatch(/OWNER/);
  });

  it("AGENT property scope is listedByUserId + organizationId", () => {
    const where = buildPropertyTenantWhere({
      actorUserId: "agent-1",
      organizationId: "org-a",
      memberRole: "AGENT",
    });
    expect(where).toEqual({
      organizationId: "org-a",
      listedByUserId: "agent-1",
    });
  });

  it("OWNER sees all org listings", () => {
    expect(
      buildPropertyTenantWhere({
        actorUserId: "owner-1",
        organizationId: "org-a",
        memberRole: "OWNER",
      }),
    ).toEqual({ organizationId: "org-a" });
  });

  it("QBL accept requires assignee or OWNER/ADMIN (not every AGENT)", () => {
    const file = readFileSync(
      join(
        process.cwd(),
        "src/domains/crm/qualified-buyer-lead-service.ts",
      ),
      "utf8",
    );
    expect(file).toMatch(/role:\s*\{\s*in:\s*\["OWNER",\s*"ADMIN"\]/);
    expect(file).not.toMatch(
      /role:\s*\{\s*in:\s*\["OWNER",\s*"ADMIN",\s*"AGENT"\]/,
    );
  });

  it("changeOrganizationPlan enforces requireBilling when actor present", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/organizations/service.ts"),
      "utf8",
    );
    expect(file).toMatch(/requireBilling:\s*true/);
    expect(file).toMatch(/assertOrganizationAccess/);
  });

  it("QBL agent view requires assignee or OWNER/ADMIN", () => {
    const file = readFileSync(
      join(
        process.cwd(),
        "src/domains/crm/qualified-buyer-lead-service.ts",
      ),
      "utf8",
    );
    expect(file).toMatch(/OWNER.*ADMIN|ADMIN.*OWNER/);
    expect(file).toMatch(/isAssignedAgent|agentUserId === input\.agentUserId/);
  });

  it("broker server actions bind session user, not client userId", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/domains/organizations/server/actions.ts"),
      "utf8",
    );
    expect(actions).toMatch(/auth\(\)/);
    expect(actions).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
  });

  it("analytics payload never includes anonymous PII fields", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/listing-analytics/service.ts"),
      "utf8",
    );
    expect(file).toMatch(/containsPii:\s*false/);
    expect(file).not.toMatch(/ipAddress|userAgent|cookie|email|phone/);
  });
});

describe("assertOrganizationAccess typing smoke", () => {
  it("exports async function", () => {
    expect(typeof assertOrganizationAccess).toBe("function");
  });
});
