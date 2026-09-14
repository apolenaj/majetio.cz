import { describe, expect, it } from "vitest";

import {
  resolveInternationalRiskModel,
  assertNoAggregateRiskScore,
  AggregateRiskScoreForbiddenError,
  listFactsByDimension,
  resolveDueDiligenceChecklist,
  isChecklistCurrent,
  assertDataSourceAllowedForMarket,
  DataSourceLicenseError,
} from "@/domains/risk";
import {
  listActiveRegulatoryRules,
  listDemoRegulatoryRules,
  listRegulatoryRules,
} from "@/domains/regulatory";
import {
  buildLeadShareConsentMetadata,
  isGenericPartnerLabel,
  resolveConsentRecipientForMarket,
  ConsentRecipientError,
  consentRecipientCheckboxLabel,
} from "@/domains/consent";
import {
  buildClearPropertyPathDeepLink,
  assertNoSharedDbWithClearPropertyPath,
  MAJETIO_CPP_INTEGRATION_POLICY,
} from "@/domains/integrations/clearpropertypath";

describe("International Risk Model — multi-dimensional facts, no score", () => {
  it("returns CZ facts without aggregate score", () => {
    const model = resolveInternationalRiskModel({ marketCode: "CZ" });
    expect(model).not.toBeNull();
    expect(model!.aggregateScore).toBeNull();
    expect(model!.isDemo).toBe(false);
    expect(model!.version).toBeTruthy();
    expect(model!.reviewedAt).toBeTruthy();
    expect(listFactsByDimension(model!, "LEGAL").length).toBeGreaterThan(0);
    expect(() =>
      assertNoAggregateRiskScore({ ...model, score: 4 }),
    ).toThrow(AggregateRiskScoreForbiddenError);
  });

  it("keeps AE pack demo-only by default", () => {
    expect(
      resolveInternationalRiskModel({ marketCode: "AE", allowDemo: false }),
    ).toBeNull();
    const demo = resolveInternationalRiskModel({
      marketCode: "AE",
      allowDemo: true,
    });
    expect(demo?.isDemo).toBe(true);
    expect(demo?.facts.some((f) => f.code.includes("foreign_ownership"))).toBe(
      true,
    );
  });
});

describe("Due diligence checklists — versioned + reviewedAt", () => {
  it("resolves CZ pack with review metadata", () => {
    const pack = resolveDueDiligenceChecklist({ marketCode: "CZ" });
    expect(pack?.version).toMatch(/cz-dd/);
    expect(pack?.reviewedAt).toBeTruthy();
    expect(isChecklistCurrent(pack!)).toBe(true);
    expect(pack?.items.some((i) => i.code === "cz.dd.title_extract")).toBe(
      true,
    );
  });

  it("AE checklist is demo and excluded without allowDemo", () => {
    expect(
      resolveDueDiligenceChecklist({ marketCode: "AE", allowDemo: false }),
    ).toBeNull();
    const demo = resolveDueDiligenceChecklist({
      marketCode: "AE",
      allowDemo: true,
    });
    expect(demo?.isDemo).toBe(true);
    expect(demo?.reviewedAt).toBeNull();
  });
});

describe("Regulatory rules — demo isolation", () => {
  it("excludes AE demo rules from production active list", () => {
    const prod = listActiveRegulatoryRules({
      marketCode: "AE",
      allowDemo: false,
    });
    expect(prod).toHaveLength(0);

    const demo = listActiveRegulatoryRules({
      marketCode: "AE",
      allowDemo: true,
    });
    expect(demo.length).toBeGreaterThan(0);
    expect(demo.every((r) => r.isDemo)).toBe(true);
  });

  it("does not expose hallucinated demo rules in production list", () => {
    const allProd = listRegulatoryRules(undefined, { includeDemo: false });
    expect(
      allProd.some((r) => r.code.includes("hallucinated") || r.code.includes("fantasy")),
    ).toBe(false);
    expect(
      listDemoRegulatoryRules().some((r) => r.code.includes("fantasy")),
    ).toBe(true);
  });
});

describe("Data source licensing by market", () => {
  it("allows CZ partner listings on CZ for display", () => {
    const src = assertDataSourceAllowedForMarket({
      sourceKey: "cz.listings.partner",
      marketCode: "CZ",
      usage: "display",
    });
    expect(src.marketCode).toBe("CZ");
  });

  it("rejects CZ source on AE market", () => {
    expect(() =>
      assertDataSourceAllowedForMarket({
        sourceKey: "cz.listings.partner",
        marketCode: "AE",
        usage: "display",
      }),
    ).toThrow(DataSourceLicenseError);
  });

  it("rejects AE research source for commercial use", () => {
    expect(() =>
      assertDataSourceAllowedForMarket({
        sourceKey: "ae.listings.research",
        marketCode: "AE",
        usage: "commercial",
      }),
    ).toThrow(DataSourceLicenseError);
  });
});

describe("Consent recipients — named subject only", () => {
  it("requires HypotekaJasne for CZ mortgage share metadata", () => {
    const meta = buildLeadShareConsentMetadata({
      recipientCode: "hypotekajasne",
      marketCode: "CZ",
      fieldKeys: ["email", "phone"],
    });
    expect(meta.recipientDisplayName).toBe("HypotekaJasne");
    expect(meta.genericPartnersForbidden).toBe(true);
    expect(isGenericPartnerLabel("our partners")).toBe(true);
    expect(isGenericPartnerLabel("HypotekaJasne")).toBe(false);
    expect(
      consentRecipientCheckboxLabel(
        resolveConsentRecipientForMarket({
          recipientCode: "hypotekajasne",
          marketCode: "CZ",
        }),
      ),
    ).toMatch(/HypotekaJasne/);
  });

  it("refuses HypotekaJasne recipient on AE market", () => {
    expect(() =>
      resolveConsentRecipientForMarket({
        recipientCode: "hypotekajasne",
        marketCode: "AE",
      }),
    ).toThrow(ConsentRecipientError);
  });
});

describe("ClearPropertyPath boundary", () => {
  it("forbids shared DB and builds deep links without FK", () => {
    expect(MAJETIO_CPP_INTEGRATION_POLICY.sharedDatabase).toBe(false);
    expect(() =>
      assertNoSharedDbWithClearPropertyPath({
        proposesSharedDbRelation: true,
      }),
    ).toThrow(/shared database/i);

    const url = buildClearPropertyPathDeepLink({
      correlationId: "corr_abc",
      marketCode: "CZ",
      listingPublicRef: "demo-byt-vinohrady",
      locale: "cs-CZ",
    });
    expect(url).toContain("clearpropertypath.com");
    expect(url).toContain("corr=corr_abc");
    expect(url).not.toMatch(/propertyId=/i);
  });
});
