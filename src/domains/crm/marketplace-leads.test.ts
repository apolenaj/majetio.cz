/**
 * Marketplace leads — Inquiry vs QualifiedBuyerLead, privacy, non-discrimination.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FORBIDDEN_QUALIFICATION_ATTRIBUTES,
  QUALIFICATION_RULE_VERSION,
  canAgentViewFullFinancialProfile,
  evaluateBuyerQualification,
  sanitizeAgentFacingPayload,
  stripForbiddenQualificationAttrs,
  buildAnonymizedQualifiedProfile,
} from "@/domains/crm";
import {
  QUALIFIED_BUYER_BADGE_LABEL_CS,
  QUALIFIED_BUYER_DISCLAIMER_CS,
} from "@/components/crm/qualified-buyer-badge";

describe("Inquiry vs QualifiedBuyerLead separation", () => {
  it("schema models are distinct", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model Inquiry \{/);
    expect(schema).toMatch(/model QualifiedBuyerLead \{/);
    expect(schema).toMatch(
      /MUST NOT carry budget \/ financing \/ FinancialProfile/,
    );
  });
});

describe("qualification rules — non-discriminatory allow-list", () => {
  it("qualifies when contact + budget + financing are known", () => {
    const result = evaluateBuyerQualification({
      contactVerification: "EMAIL_VERIFIED",
      budgetBandMinCzk: 4_000_000,
      budgetBandMaxCzk: 5_000_000,
      financingStance: "MORTGAGE_EXPLORING",
      timelineBand: "3_6m",
    });
    expect(result.qualified).toBe(true);
    expect(result.ruleVersion).toBe(QUALIFICATION_RULE_VERSION);
    expect(result.checks.every((c) => c.passed)).toBe(true);
    expect(result.disclaimerCs).toMatch(/není to garance nákupu/i);
  });

  it("rejects missing budget or unverified contact", () => {
    expect(
      evaluateBuyerQualification({
        contactVerification: "UNVERIFIED",
        budgetBandMaxCzk: 5_000_000,
        financingStance: "CASH",
      }).qualified,
    ).toBe(false);
    expect(
      evaluateBuyerQualification({
        contactVerification: "PHONE_VERIFIED",
        financingStance: "CASH",
      }).qualified,
    ).toBe(false);
    expect(
      evaluateBuyerQualification({
        contactVerification: "EMAIL_AND_PHONE_VERIFIED",
        budgetBandMaxCzk: 3_000_000,
        financingStance: "UNKNOWN",
      }).qualified,
    ).toBe(false);
  });

  it("strips forbidden discriminatory attributes", () => {
    expect(FORBIDDEN_QUALIFICATION_ATTRIBUTES).toContain("age");
    expect(FORBIDDEN_QUALIFICATION_ATTRIBUTES).toContain("gender");
    expect(FORBIDDEN_QUALIFICATION_ATTRIBUTES).toContain("nationality");
    const cleaned = stripForbiddenQualificationAttrs({
      budgetBandMaxCzk: 1,
      age: 42,
      gender: "x",
      financingStance: "CASH",
    });
    expect(cleaned).not.toHaveProperty("age");
    expect(cleaned).not.toHaveProperty("gender");
    expect(cleaned.budgetBandMaxCzk).toBe(1);
  });
});

describe("agent privacy — anonymized before accept", () => {
  it("anonymized profile hides contact and full FP", () => {
    const q = evaluateBuyerQualification({
      contactVerification: "EMAIL_VERIFIED",
      budgetBandMinCzk: 2_000_000,
      budgetBandMaxCzk: 2_500_000,
      financingStance: "CASH",
      timelineBand: "0_3m",
    });
    const profile = buildAnonymizedQualifiedProfile({
      leadId: "lead_1",
      status: "PENDING_AGENT_REVIEW",
      budgetBandMinCzk: 2_000_000,
      budgetBandMaxCzk: 2_500_000,
      timelineBand: "0_3m",
      financingStance: "CASH",
      contactVerified: true,
      qualificationChecks: q.checks,
      disclaimerCs: q.disclaimerCs,
    });
    expect(profile.kind).toBe("anonymized_qualified_profile");
    expect(profile.badgeLabelCs).toBe("Kvalifikovaný zájemce");
    expect(profile.privacy.fullFinancialProfileVisible).toBe(false);
    expect(profile.privacy.contactDetailsVisible).toBe(false);
    expect(profile.budgetBandLabelCs).toMatch(/Kč/);
    expect(JSON.stringify(profile)).not.toMatch(/monthlyIncome/);
  });

  it("full FP requires ACCEPTED + consent", () => {
    expect(
      canAgentViewFullFinancialProfile({
        leadStatus: "PENDING_AGENT_REVIEW",
        profileShareConsentGranted: true,
      }),
    ).toBe(false);
    expect(
      canAgentViewFullFinancialProfile({
        leadStatus: "ACCEPTED",
        profileShareConsentGranted: false,
      }),
    ).toBe(false);
    expect(
      canAgentViewFullFinancialProfile({
        leadStatus: "ACCEPTED",
        profileShareConsentGranted: true,
      }),
    ).toBe(true);
  });

  it("sanitizeAgentFacingPayload strips income and contact", () => {
    const safe = sanitizeAgentFacingPayload({
      timelineBand: "3_6m",
      monthlyIncomeCzk: 80_000,
      email: "x@y.cz",
      age: 30,
    });
    expect(safe).toEqual({ timelineBand: "3_6m" });
  });
});

describe("badge copy", () => {
  it("uses clear label and no-purchase-guarantee disclaimer", () => {
    expect(QUALIFIED_BUYER_BADGE_LABEL_CS).toBe("Kvalifikovaný zájemce");
    expect(QUALIFIED_BUYER_DISCLAIMER_CS).toMatch(/Nejde o garanci nákupu/);
  });
});
