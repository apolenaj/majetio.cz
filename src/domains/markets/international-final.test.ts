/**
 * Prompt 17 final — isolation, i18n fallback, public DTO, LIVE barrier, demos.
 */

import { describe, expect, it } from "vitest";

import {
  assertMarketCanGoLive,
  canMarketGoLive,
  MarketLaunchBlockedError,
  evaluateMarketLaunchReadiness,
  getMarketCapability,
  resolveEffectiveCapability,
  marketRegistry,
} from "@/domains/markets";
import { resolveTaxProviderConfig, vatRateBpForPlan } from "@/domains/tax";
import { resolveFinancingProvider } from "@/domains/financing/providers/registry";
import {
  entitlementCoversMarket,
  assertEntitlementMarketScope,
  EntitlementMarketScopeError,
} from "@/domains/entitlements/market-scope";
import {
  resolveMessage,
  translateMessage,
  loadMessageCatalog,
} from "@/domains/i18n/messages";
import { getDemoPublicProperty, listDemoPublicProperties } from "@/content/demo-canonical-properties";
import {
  getInternationalDemoProperty,
  isPublicListingEligibleDemo,
  INTERNATIONAL_DEMO_PROPERTY_RECORDS,
} from "@/content/international-demo-properties";
import { toPublicPropertyDto } from "@/domains/properties/service/dto";

describe("Market isolation (CZ must not affect UAE)", () => {
  it("CZ VAT stays 21% while AE uses its own provider", () => {
    expect(vatRateBpForPlan({ marketCode: "CZ" })).toBe(2100);
    const ae = resolveTaxProviderConfig({ marketCode: "AE" });
    expect(ae?.marketCode).toBe("AE");
    expect(ae?.standardRateBp).not.toBe(2100);
    expect(vatRateBpForPlan({ marketCode: "CZ" })).toBe(2100);
  });

  it("HypotekaJasne is not the AE financing provider", () => {
    const cz = resolveFinancingProvider("CZ");
    const ae = resolveFinancingProvider("AE");
    expect(cz.provider?.code).toBe("hypotekajasne");
    expect(ae.provider?.code).not.toBe("hypotekajasne");
  });

  it("CZ valuation FULL does not unlock ES/AE valuation", () => {
    expect(getMarketCapability("CZ", "VALUATION")).toBe("FULL");
    expect(getMarketCapability("ES", "VALUATION")).toBe("NOT_AVAILABLE");
    expect(
      resolveEffectiveCapability({ marketCode: "ES", capability: "VALUATION" })
        .uiState,
    ).toBe("UNAVAILABLE");
    expect(
      resolveEffectiveCapability({ marketCode: "AE", capability: "VALUATION" })
        .uiState,
    ).not.toBe("FULL");
  });

  it("Buyer Pass CZ marketScope does not cover AE", () => {
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
  });
});

describe("i18n translation fallback", () => {
  it("falls back to EN then CS for missing keys without throwing", async () => {
    const es = await loadMessageCatalog("es-ES");
    const resolved = resolveMessage(es, "nav.language", [
      { "nav.language": "Language" },
      { "nav.language": "Jazyk" },
    ]);
    expect(resolved).toBe("Idioma");

    const missing = resolveMessage(
      {},
      "only.in.en",
      [{ "only.in.en": "From EN" }, { "only.in.en": "Z CS" }],
    );
    expect(missing).toBe("From EN");

    const unknown = resolveMessage({}, "totally.missing.key", []);
    expect(unknown).toBe("totally.missing.key");

    const viaHelper = await translateMessage("es-ES", "nav.market");
    expect(viaHelper.length).toBeGreaterThan(0);
  });
});

describe("Public DTO market + currency + labels (CZ backward compatible)", () => {
  it("CZ demo includes market, currency, labels without dropping legacy fields", () => {
    const dto = getDemoPublicProperty("demo-byt-3kk-vinohrady");
    expect(dto).toBeTruthy();
    expect(dto!.marketCode).toBe("CZ");
    expect(dto!.market).toBe("CZ");
    expect(dto!.currency).toBe("CZK");
    expect(dto!.labels.currency).toBe("CZK");
    expect(dto!.labels.propertyType.length).toBeGreaterThan(0);
    expect(dto!.labels.marketLocal.length).toBeGreaterThan(0);
    expect(dto!.slug).toBe("demo-byt-3kk-vinohrady");
    expect(dto!.askingPrice).toBeTypeOf("number");
  });

  it("international demos carry local currency and market labels", () => {
    const ae = getInternationalDemoProperty("demo-ae-apartment-dubai");
    expect(ae?.market).toBe("AE");
    expect(ae?.currency).toBe("AED");
    expect(ae?.labels.demoBadge).toBe("Demo");
    expect(ae?.isDemo).toBe(true);

    const es = getInternationalDemoProperty("demo-es-apartment-barcelona");
    expect(es?.market).toBe("ES");
    expect(es?.currency).toBe("EUR");

    const hr = getInternationalDemoProperty("demo-hr-holiday-split");
    expect(hr?.market).toBe("HR");
    expect(hr?.currency).toBe("EUR");
  });
});

describe("Synthetic international demos are not public listings", () => {
  it("marks ES/AE/HR demos as PRIVATE isDemo and excludes from public list", () => {
    expect(INTERNATIONAL_DEMO_PROPERTY_RECORDS).toHaveLength(3);
    for (const r of INTERNATIONAL_DEMO_PROPERTY_RECORDS) {
      expect(r.isDemo).toBe(true);
      expect(r.visibility).toBe("PRIVATE");
      expect(isPublicListingEligibleDemo(r)).toBe(false);
    }

    const publicSlugs = new Set(listDemoPublicProperties().map((p) => p.slug));
    expect(publicSlugs.has("demo-es-apartment-barcelona")).toBe(false);
    expect(publicSlugs.has("demo-ae-apartment-dubai")).toBe(false);
    expect(publicSlugs.has("demo-hr-holiday-split")).toBe(false);

    const staffDto = toPublicPropertyDto(
      INTERNATIONAL_DEMO_PROPERTY_RECORDS[0]!,
      { viewerRole: "STAFF" },
    );
    expect(staffDto.labels.demoBadge).toBe("Demo");
  });
});

describe("LIVE readiness QA barrier", () => {
  it("allows CZ LIVE when currency, privacy and terms are ready", () => {
    const readiness = evaluateMarketLaunchReadiness("CZ");
    expect(readiness.checks.find((c) => c.key === "currency_configured")?.passed).toBe(
      true,
    );
    expect(readiness.checks.find((c) => c.key === "privacy_legal_docs")?.passed).toBe(
      true,
    );
    expect(readiness.checks.find((c) => c.key === "terms_of_use")?.passed).toBe(
      true,
    );
    expect(() => assertMarketCanGoLive("CZ")).not.toThrow();
    expect(canMarketGoLive("CZ")).toBe(true);
    expect(marketRegistry.get("CZ")?.launchStatus).toBe("LIVE");
  });

  it("blocks AE and ES from LIVE without legal/data readiness", () => {
    expect(canMarketGoLive("AE")).toBe(false);
    expect(canMarketGoLive("ES")).toBe(false);
    expect(() => assertMarketCanGoLive("AE")).toThrow(MarketLaunchBlockedError);
    expect(() => assertMarketCanGoLive("ES")).toThrow(MarketLaunchBlockedError);
  });
});
