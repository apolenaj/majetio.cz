import { describe, expect, it } from "vitest";

import { getMarketPlugin } from "@/domains/markets";
import {
  assertNoCertainPurchaseClaim,
  containsForbiddenCertainPurchaseClaim,
  getForeignOwnershipOrientationalView,
  listActiveRegulatoryRules,
  estimateTransactionCosts,
  tenureFromCzOwnershipType,
  resolveTenureFromAlias,
} from "@/domains/regulatory";
import {
  createDemoOffPlanPaymentPlan,
  expandPaymentPlanSchedule,
  assertPaymentPlanBpsNearComplete,
} from "@/domains/properties/payment-plan/types";
import { buildFinancialEnginePaymentBundle } from "@/domains/properties/payment-plan/to-investment-input";
import { computeTotalAcquisitionCost } from "@/domains/investment/engine/acquisition-cost";
import {
  resolveFinancingProvider,
  resolveFinancingLeadRouting,
} from "@/domains/financing/providers/registry";
import { resolveMortgageLeadRouting } from "@/domains/leads/service/routing";
import {
  resolveValuationModelForMarket,
  assertValuationModelMarketMatch,
  AUTOMATED_VALUATION_DISABLED_MESSAGE_EN,
} from "@/domains/valuation/market/model-registry";
import { estimateMarketTax } from "@/domains/tax/market/plugins";
import { resolveRenovationCostCatalog } from "@/domains/renovation/costs/catalog/market-registry";

describe("Tenure + RegulatoryRule (Prompt 17.4)", () => {
  it("maps CZ ownership and AE aliases", () => {
    expect(tenureFromCzOwnershipType("COOPERATIVE")).toBe("COOPERATIVE_RIGHT");
    expect(resolveTenureFromAlias({ marketCode: "AE", raw: "freehold" })).toBe(
      "FREEHOLD",
    );
  });

  it("lists active CZ foreign-ownership + LTV rules", () => {
    const rules = listActiveRegulatoryRules({ marketCode: "CZ" });
    expect(rules.some((r) => r.kind === "FOREIGN_OWNERSHIP")).toBe(true);
    expect(rules.some((r) => r.kind === "LTV_LIMIT")).toBe(true);
    const view = getForeignOwnershipOrientationalView({ marketCode: "AE" });
    expect(view.certainPurchaseAllowed).toBe(false);
    expect(view.disclaimer.length).toBeGreaterThan(20);
  });

  it("blocks certain-purchase claims", () => {
    expect(containsForbiddenCertainPurchaseClaim("you can definitely buy")).toBe(
      true,
    );
    expect(() =>
      assertNoCertainPurchaseClaim("Guaranteed to purchase this villa"),
    ).toThrow(/Forbidden/);
    expect(() =>
      assertNoCertainPurchaseClaim("Estimates only — verify with counsel."),
    ).not.toThrow();
  });
});

describe("Transaction costs + payment plan → financial engine", () => {
  it("estimates CZ buyer costs by profile (no universal %)", () => {
    const est = estimateTransactionCosts({
      marketCode: "CZ",
      purchasePriceMinor: 10_000_000_00,
      propertyType: "APARTMENT",
      buyer: { residency: "RESIDENT", entity: "NATURAL_PERSON" },
    });
    expect(est).not.toBeNull();
    expect(est!.buyerLines.length).toBeGreaterThan(0);
    expect(est!.currency).toBe("CZK");
    expect(est!.buyerTotalMinor).toBeGreaterThan(0);
  });

  it("estimates AE DLD-style fees for non-resident", () => {
    const est = estimateTransactionCosts({
      marketCode: "AE",
      purchasePriceMinor: 2_000_000_00,
      propertyType: "APARTMENT",
      buyer: { residency: "NON_RESIDENT", entity: "NATURAL_PERSON" },
    });
    expect(est!.buyerLines.some((l) => l.kind === "DLD_FEE")).toBe(true);
  });

  it("expands off-plan plan and feeds acquisition fees", () => {
    const plan = createDemoOffPlanPaymentPlan({
      totalPriceMinor: 1_000_000_00,
      currency: "AED",
    });
    expect(assertPaymentPlanBpsNearComplete(plan)).toBe(true);
    const events = expandPaymentPlanSchedule(plan);
    expect(events).toHaveLength(3);
    expect(events.reduce((s, e) => s + e.amountMinor, 0)).toBe(1_000_000_00);

    const tx = estimateTransactionCosts({
      marketCode: "AE",
      purchasePriceMinor: 1_000_000_00,
      propertyType: "APARTMENT",
      buyer: { residency: "NON_RESIDENT", entity: "NATURAL_PERSON" },
    })!;

    const bundle = buildFinancialEnginePaymentBundle({
      baseCurrency: "AED",
      purchasePriceMinor: 1_000_000_00,
      purchaseCurrency: "AED",
      paymentPlan: plan,
      transactionCosts: tx,
    });
    expect(bundle.paymentSchedule).toHaveLength(3);
    expect(bundle.warnings).toEqual([]);
    const total = computeTotalAcquisitionCost(bundle.acquisition);
    expect(total.fees).not.toBeNull();
    expect(total.total.isPositive()).toBe(true);
  });
});

describe("FinancingProviderRegistry", () => {
  it("keeps HypotekaJasne on CZ only", () => {
    expect(resolveFinancingProvider("CZ").provider?.code).toBe("hypotekajasne");
    expect(resolveFinancingProvider("CZ").status).toBe("READY");
    const ae = resolveFinancingProvider("AE");
    expect(ae.status).toBe("PARTNER_PENDING");
    expect(ae.provider?.code).not.toBe("hypotekajasne");
    expect(ae.inheritsCzMortgageRules).toBe(false);
  });

  it("does not route non-CZ mortgage leads to HypotekaJasne", () => {
    const ae = resolveMortgageLeadRouting({ marketCountry: "AE" });
    expect(ae.partner).not.toBe("hypotekajasne");
    expect(ae.handoffAllowed).toBe(false);
    const cz = resolveFinancingLeadRouting({ marketCode: "CZ" });
    expect(cz.partner).toBe("hypotekajasne");
    expect(cz.handoffAllowed).toBe(true);
  });
});

describe("ValuationModelRegistry per market", () => {
  it("enables CZ apartment and disables AE / cross-market misuse", () => {
    const cz = resolveValuationModelForMarket({
      marketCode: "CZ",
      propertyType: "APARTMENT",
    });
    expect(cz.status).toBe("READY");
    if (cz.status === "READY") {
      expect(cz.registryCode).toBe("residential_apartment_v1");
    }

    const aeVilla = resolveValuationModelForMarket({
      marketCode: "AE",
      propertyType: "VILLA",
    });
    expect(aeVilla.status).toBe("DISABLED");
    if (aeVilla.status === "DISABLED") {
      expect(aeVilla.message).toBe(AUTOMATED_VALUATION_DISABLED_MESSAGE_EN);
    }

    expect(() =>
      assertValuationModelMarketMatch({
        modelMarketCode: "CZ",
        propertyMarketCode: "AE",
      }),
    ).toThrow(/does not match/);
  });
});

describe("Tax + renovation market plugins", () => {
  it("estimates limited CZ tax and refuses AE", () => {
    const cz = estimateMarketTax({
      marketCode: "CZ",
      baseCurrency: "CZK",
      annualNoiMajor: 120_000,
      annualCashFlowMajor: 100_000,
      purchasePriceMajor: 5_000_000,
    });
    expect(cz.status).toBe("estimated");
    expect(cz.afterTaxCashFlowMajor).toBeLessThan(100_000);

    const ae = estimateMarketTax({
      marketCode: "AE",
      baseCurrency: "AED",
      annualNoiMajor: 100_000,
      annualCashFlowMajor: 80_000,
      purchasePriceMajor: 2_000_000,
    });
    expect(ae.status).toBe("not_available");
  });

  it("exposes renovation catalog only for CZ", () => {
    expect(resolveRenovationCostCatalog("CZ").status).toBe("READY");
    expect(resolveRenovationCostCatalog("AE").status).toBe("UNAVAILABLE");
  });
});

describe("MarketPlugin 17.4 hooks", () => {
  it("wires pack ids and regulatory metadata", () => {
    const cz = getMarketPlugin("CZ")!;
    expect(cz.transactionCosts.packId).toBe("cz-tx-costs.v2026.07");
    expect(cz.financing.primaryProviderCode).toBe("hypotekajasne");
    expect(cz.regulatory.renovationCatalogAvailable).toBe(true);
    expect(cz.regulatory.valuationModelCodes).toContain("CZ_APARTMENT_V1");
    const ae = getMarketPlugin("AE")!;
    expect(ae.regulatory.renovationCatalogAvailable).toBe(false);
    expect(ae.taxation.taxPluginId).toBeNull();
  });
});
