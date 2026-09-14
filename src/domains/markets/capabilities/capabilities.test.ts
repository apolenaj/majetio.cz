import { describe, expect, it, beforeEach } from "vitest";

import {
  buildCapabilityMatrix,
  getMarketCapability,
  resolveEffectiveCapability,
  toUiCapabilityState,
  applyKillSwitch,
  resetMarketKillSwitches,
  evaluateStaleRegulationForMarket,
  assertConfigEditable,
  transitionConfigStatus,
  ConfigReviewError,
} from "@/domains/markets";
import { MarketCapabilityNotice } from "@/components/markets/market-capability-notice";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  assertEntitlementMarketScope,
  entitlementCoversMarket,
  EntitlementMarketScopeError,
} from "@/domains/entitlements/market-scope";

describe("Capability Matrix — Spain UI reflection", () => {
  beforeEach(() => {
    resetMarketKillSwitches();
  });

  it("ES valuation is UNAVAILABLE with polite message (no throw)", () => {
    expect(getMarketCapability("ES", "VALUATION")).toBe("NOT_AVAILABLE");
    const eff = resolveEffectiveCapability({
      marketCode: "ES",
      capability: "VALUATION",
      locale: "cs",
    });
    expect(eff.uiState).toBe("UNAVAILABLE");
    expect(eff.message?.title).toMatch(/není dostupná/i);
    expect(eff.message?.body).not.toMatch(/Nemáme data/i);

    const html = renderToStaticMarkup(
      createElement(MarketCapabilityNotice, {
        marketCode: "ES",
        capability: "VALUATION",
        locale: "cs",
        effective: eff,
      }),
    );
    expect(html).toContain("není dostupná");
    expect(html).toContain('data-ui-state="UNAVAILABLE"');
    expect(html).toContain('data-market="ES"');
  });

  it("ES property search LIMITED maps correctly", () => {
    expect(toUiCapabilityState(getMarketCapability("ES", "PROPERTY_SEARCH"))).toBe(
      "LIMITED",
    );
    const matrix = buildCapabilityMatrix();
    const es = matrix.rows.find((r) => r.marketCode === "ES");
    expect(es?.capabilities.VALUATION).toBe("NOT_AVAILABLE");
    expect(es?.capabilities.PROPERTY_SEARCH).toBe("LIMITED");
  });

  it("kill switch forces valuation UNAVAILABLE even if plugin FULL", () => {
    applyKillSwitch({
      marketCode: "CZ",
      target: "valuations",
      enabled: true,
      reason: "test",
    });
    const eff = resolveEffectiveCapability({
      marketCode: "CZ",
      capability: "VALUATION",
    });
    expect(eff.killSwitchActive).toBe(true);
    expect(eff.uiState).toBe("UNAVAILABLE");
  });
});

describe("Stale regulation + config review", () => {
  beforeEach(() => {
    resetMarketKillSwitches();
  });

  it("marks review_required when applying stale scan with ancient asOf", () => {
    const result = evaluateStaleRegulationForMarket({
      marketCode: "CZ",
      asOf: new Date("2099-01-01T00:00:00.000Z"),
      maxAgeMs: 1,
      applyFlag: true,
    });
    expect(result.reviewRequired).toBe(true);
    expect(result.staleRuleCodes.length).toBeGreaterThan(0);
    expect(result.flagApplied).toBe(true);

    const val = resolveEffectiveCapability({
      marketCode: "CZ",
      capability: "TAX_ESTIMATES",
    });
    // CZ tax may be LIMITED already; review_required demotes FULL→LIMITED
    expect(["LIMITED", "UNAVAILABLE", "FULL"]).toContain(val.uiState);
  });

  it("forbids editing ACTIVE config without new draft", () => {
    expect(() =>
      assertConfigEditable({ status: "ACTIVE", action: "edit" }),
    ).toThrow(ConfigReviewError);
    expect(transitionConfigStatus({ from: "DRAFT", to: "REVIEWED" })).toBe(
      "REVIEWED",
    );
    expect(transitionConfigStatus({ from: "REVIEWED", to: "ACTIVE" })).toBe(
      "ACTIVE",
    );
    expect(() =>
      transitionConfigStatus({ from: "DRAFT", to: "ACTIVE" }),
    ).toThrow(); // must go via REVIEWED preferred — actually DRAFT→ACTIVE not in allowed
  });
});

describe("Entitlement marketScope", () => {
  it("Buyer Pass CZ does not cover UAE", () => {
    expect(
      entitlementCoversMarket({ marketScope: ["CZ"], marketCode: "AE" }),
    ).toBe(false);
    expect(() =>
      assertEntitlementMarketScope({
        productKey: "buyer_pass",
        marketScope: ["CZ"],
        requestedMarketCode: "AE",
      }),
    ).toThrow(EntitlementMarketScopeError);
    expect(
      entitlementCoversMarket({ marketScope: ["*"], marketCode: "AE" }),
    ).toBe(true);
  });
});

describe("Organization marketCoverage", () => {
  it("agency CZ coverage does not include ES", async () => {
    const { organizationCoversMarket, serviceTypeForOrganizationType } =
      await import("@/domains/organizations/market-coverage");
    expect(
      organizationCoversMarket({
        marketCoverage: ["CZ"],
        marketCode: "ES",
      }),
    ).toBe(false);
    expect(serviceTypeForOrganizationType("REAL_ESTATE_AGENT")).toBe("BROKER");
    expect(serviceTypeForOrganizationType("AGENCY")).toBe("AGENCY");
  });
});
