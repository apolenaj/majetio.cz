/**
 * Prompt 5/5 — Flip Engine & Maximum Offer Price.
 */

import { describe, expect, it } from "vitest";

import {
  SYNTH_PRAHA_COMPS,
  SYNTH_PRAHA_SUBJECT,
} from "@/domains/valuation/fixtures/synthetic-comparables";

import { analyzeFlipAndMaxOffer } from "./engine";
import { calculateRenovationFlip, breakEvenSalePrice } from "./flip";
import { calculateMaximumOffer, compareAskingToMaxOffer } from "./offer";

describe("Renovation Flip Engine", () => {
  it("computes banded flip metrics including IRR and break-even", () => {
    const flip = calculateRenovationFlip({
      purchasePriceCzk: 5_500_000,
      acquisitionCostsCzk: 70_000,
      feesCzk: 22_000,
      renovationCost: {
        lowCzk: 800_000,
        baseCzk: 1_000_000,
        highCzk: 1_300_000,
      },
      holdingCosts: {
        lowCzk: 80_000,
        baseCzk: 120_000,
        highCzk: 180_000,
      },
      resaleValue: {
        lowCzk: 7_000_000,
        baseCzk: 7_500_000,
        highCzk: 8_000_000,
      },
      holdMonths: 6,
      sellingCostRatePct: 3,
      loanPrincipalCzk: 3_500_000,
    });

    expect(flip.metrics.grossProfit.baseCzk).toBeGreaterThan(0);
    expect(flip.metrics.grossProfit.lowCzk).toBeLessThanOrEqual(
      flip.metrics.grossProfit.baseCzk,
    );
    expect(flip.metrics.marginOnTotalCostPct.baseCzk).toBeGreaterThan(0);
    expect(flip.metrics.irrPct?.baseCzk).not.toBeNull();
    expect(flip.metrics.breakEvenSalePriceCzk).toBeGreaterThan(
      flip.metrics.totalProjectCost.baseCzk,
    );
  });

  it("break-even sale price covers total cost + selling costs", () => {
    const total = 6_500_000;
    const be = breakEvenSalePrice(total, 3);
    expect(be).toBeGreaterThan(total);
    expect(be).toBe(Math.round(total / 0.97));
  });
});

describe("Maximum Offer Price Engine", () => {
  const costContext = {
    renovationCost: {
      lowCzk: 900_000,
      baseCzk: 1_100_000,
      highCzk: 1_400_000,
    },
    holdingCosts: {
      lowCzk: 100_000,
      baseCzk: 140_000,
      highCzk: 200_000,
    },
    resaleValue: {
      lowCzk: 7_000_000,
      baseCzk: 7_500_000,
      highCzk: 8_000_000,
    },
    acquisitionCostRatePct: 1.28,
    feesRatePct: 0.4,
    sellingCostRatePct: 3,
  };

  it("returns conservative/base/optimistic max offer bands for flip", () => {
    const result = calculateMaximumOffer({
      target: { strategy: "flip", targetProfitCzk: 500_000 },
      costs: costContext,
      askingPriceCzk: 6_200_000,
    });

    expect(result.maximumOffer.conservative).toBeLessThanOrEqual(
      result.maximumOffer.base,
    );
    expect(result.maximumOffer.base).toBeLessThanOrEqual(
      result.maximumOffer.optimistic,
    );
    expect(result.maximumOffer.conservative).toBeGreaterThan(0);
    expect(result.comparison).not.toBeNull();
  });

  it("computes negotiation anchor and margin of safety", () => {
    const max = {
      conservative: 5_000_000,
      base: 5_400_000,
      optimistic: 5_800_000,
    };

    const over = compareAskingToMaxOffer(5_800_000, max);
    expect(over.withinLimit).toBe(false);
    expect(over.negotiationAnchor.discountRequiredCzk).toBe(800_000);
    expect(over.marginOfSafety.amountCzk).toBeLessThan(0);

    const under = compareAskingToMaxOffer(4_800_000, max);
    expect(under.withinLimit).toBe(true);
    expect(under.marginOfSafety.amountCzk).toBe(200_000);
  });

  it("supports rental target net yield max offer", () => {
    const result = calculateMaximumOffer({
      target: {
        strategy: "rental",
        targetNetYieldPct: 5,
      },
      costs: {
        ...costContext,
        annualEgiCzk: 360_000,
        annualOpexCzk: 72_000,
        loanLtvPct: 70,
      },
      askingPriceCzk: 6_000_000,
    });

    expect(result.strategy).toBe("rental");
    expect(result.maximumOffer.base).toBeGreaterThan(0);
  });
});

describe("Full flip + max offer orchestration", () => {
  it("runs renovation analysis with flip and max offer", () => {
    const result = analyzeFlipAndMaxOffer({
      subject: { ...SYNTH_PRAHA_SUBJECT, condition: "NEEDS_RENOVATION" },
      comparables: SYNTH_PRAHA_COMPS,
      condition: "NEEDS_RENOVATION",
      purchasePriceCzk: 5_500_000,
      askingPriceCzk: 5_900_000,
      usableArea: 72,
      bathroomsCount: 1,
      location: { publicCity: "Praha" },
      monthlyRentCzk: 22_000,
      loanPrincipalCzk: 3_500_000,
      maxOfferTarget: {
        strategy: "flip",
        targetProfitCzk: 400_000,
      },
    });

    expect(result.analysis.status).toBe("calculated");
    expect(result.flip.metrics.grossProfit.baseCzk).toBeDefined();
    expect(result.maxOffer.maximumOffer.conservative).toBeGreaterThan(0);
    expect(result.maxOffer.comparison?.askingPriceCzk).toBe(5_900_000);
  });
});
