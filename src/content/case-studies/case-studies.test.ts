import { describe, expect, it } from "vitest";

import {
  computeCaseStudy,
  purchasePriceAtTargetGrossYield,
} from "./index";
import { rentalApartmentStudy as rentalDef } from "./rental-apartment";

describe("case study compute", () => {
  it("matches an independent base-case arithmetic check for the rental flat", () => {
    const computed = computeCaseStudy(rentalDef);
    const base = computed.base;

    const annualRent = 18_500 * 12;
    const vacancyLoss = annualRent * 0.04;
    const egi = annualRent - vacancyLoss;
    const opex =
      22_200 + 18_000 + 4_800 + 2_400 + 36_000;
    const noi = egi - opex;
    const tac = 4_250_000 + 170_000 + 180_000 + 80_000;
    const gross = (egi / tac) * 100;
    const operating = (noi / tac) * 100;

    expect(computed.totalAcquisitionCostCzk).toBe(tac);
    expect(base.annualEgiCzk).toBeCloseTo(egi, 0);
    expect(base.annualNoiCzk).toBeCloseTo(noi, 0);
    expect(base.grossYieldPct).toBeCloseTo(gross, 1);
    expect(base.operatingYieldPct).toBeCloseTo(operating, 1);
    expect(base.monthlyCashFlowCzk).toBeLessThan(base.annualNoiCzk / 12);
  });

  it("explains target-yield price without inventing market value", () => {
    const computed = computeCaseStudy(rentalDef);
    expect(computed.definition.omitMarketValue).toBe(true);
    expect(computed.priceAtTargetGrossYieldCzk).not.toBeNull();
    const expected = purchasePriceAtTargetGrossYield({
      annualEgiCzk: computed.base.annualEgiCzk,
      targetGrossYieldPct: 5,
    });
    expect(computed.priceAtTargetGrossYieldCzk).toBe(expected);
  });

  it("does not double-count opex lines", () => {
    const computed = computeCaseStudy(rentalDef);
    const opexSum =
      rentalDef.opexAnnual.propertyManagementCzk +
      rentalDef.opexAnnual.maintenanceCzk +
      rentalDef.opexAnnual.insuranceCzk +
      rentalDef.opexAnnual.propertyTaxCzk +
      rentalDef.opexAnnual.svjOwnerCostCzk;
    const impliedOpex =
      computed.base.annualEgiCzk - computed.base.annualNoiCzk;
    expect(impliedOpex).toBeCloseTo(opexSum, 0);
  });
});
