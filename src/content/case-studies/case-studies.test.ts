import { describe, expect, it } from "vitest";

import {
  computeCaseStudy,
  purchasePriceAtTargetYieldOnTac,
} from "./index";
import { houseRenovationStudy } from "./house-renovation";
import { rentalApartmentStudy as rentalDef } from "./rental-apartment";
import { smallBuildingStudy } from "./small-building";

describe("case study compute — P0 methodology", () => {
  it("separates the three yield metrics for the rental flat", () => {
    const computed = computeCaseStudy(rentalDef);
    const base = computed.base;

    const annualRent = 18_500 * 12; // 222_000
    const vacancyLoss = annualRent * 0.04;
    const egi = annualRent - vacancyLoss; // 213_120
    const opex = 22_200 + 18_000 + 4_800 + 2_400 + 36_000; // 83_400
    const noi = egi - opex; // 129_720
    const tac = 4_250_000 + 170_000 + 180_000 + 80_000;

    expect(egi).toBe(213_120);
    expect(opex).toBe(83_400);
    expect(base.annualEgiCzk).toBeCloseTo(egi, 0);
    expect(base.opexTotalCzk).toBeCloseTo(opex, 0);
    expect(base.annualNoiCzk).toBeCloseTo(noi, 0);

    expect(base.grossRentalYieldOnPurchasePct).toBeCloseTo(
      (annualRent / 4_250_000) * 100,
      2,
    );
    expect(base.yieldAfterVacancyOnTacPct).toBeCloseTo((egi / tac) * 100, 2);
    expect(base.operatingYieldOnTacPct).toBeCloseTo((noi / tac) * 100, 2);
  });

  it("solves target purchase price as EGI/target − other acquisition costs", () => {
    const flat = purchasePriceAtTargetYieldOnTac({
      annualEgiCzk: 213_120,
      targetYieldAfterVacancyOnTacPct: 5,
      closingCostsCzk: 170_000,
      renovationCostCzk: 180_000,
      reserveCzk: 80_000,
    });
    expect(flat).toBeCloseTo(3_832_400, 0);

    const house = purchasePriceAtTargetYieldOnTac({
      annualEgiCzk: 319_200,
      targetYieldAfterVacancyOnTacPct: 4.5,
      closingCostsCzk: 220_000,
      renovationCostCzk: 1_650_000,
      reserveCzk: 330_000,
    });
    expect(house).toBeCloseTo(4_893_333.333, 0);

    const building = purchasePriceAtTargetYieldOnTac({
      annualEgiCzk: 767_040,
      targetYieldAfterVacancyOnTacPct: 5.5,
      closingCostsCzk: 420_000,
      renovationCostCzk: 650_000,
      reserveCzk: 250_000,
    });
    expect(building).toBeCloseTo(12_626_181.818, 0);
  });

  it("wires target price into each published study", () => {
    const flat = computeCaseStudy(rentalDef);
    expect(flat.priceAtTargetYieldOnTacCzk).toBeCloseTo(3_832_400, 0);

    const house = computeCaseStudy(houseRenovationStudy);
    expect(house.base.annualEgiCzk).toBeCloseTo(319_200, 0);
    expect(house.priceAtTargetYieldOnTacCzk).toBeCloseTo(4_893_333, 0);

    const building = computeCaseStudy(smallBuildingStudy);
    expect(building.base.annualEgiCzk).toBeCloseTo(767_040, 0);
    expect(building.priceAtTargetYieldOnTacCzk).toBeCloseTo(12_626_182, 0);
  });

  it("documents monthly top-up for the rental flat without inventing positive CF", () => {
    const flat = computeCaseStudy(rentalDef);
    expect(flat.decision.coversOpsAndDebt).toBe(false);
    expect(flat.decision.monthlyTopUpCzk).toBeCloseTo(7_659, 0);
    // Prefer unrounded annual CF magnitude over 12 × rounded monthly display.
    expect(flat.decision.annualTopUpCzk).toBeCloseTo(
      -flat.base.annualCashFlowCzk,
      0,
    );
    expect(flat.decision.annualTopUpCzk).toBeGreaterThan(90_000);
  });

  it("verifies 10% management fee on contractual rent where declared", () => {
    const flat = computeCaseStudy(rentalDef);
    expect(flat.managementFeeCheck.matchesDeclared).toBe(true);
    const building = computeCaseStudy(smallBuildingStudy);
    expect(building.managementFeeCheck.matchesDeclared).toBe(true);
  });

  it("does not double-count reserve inside annual opex", () => {
    const flat = computeCaseStudy(rentalDef);
    expect(flat.base.opexTotalCzk).toBeCloseTo(83_400, 0);
    expect(flat.definition.reserveCzk).toBe(80_000);
    expect(flat.totalAcquisitionCostCzk).toBe(
      flat.definition.purchasePriceCzk + flat.otherAcquisitionCostsCzk,
    );
  });
});
