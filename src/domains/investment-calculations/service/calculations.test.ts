import { describe, expect, it } from "vitest";

import {
  calculateGrossYield,
  calculateMonthlyCashFlow,
} from "./calculations";

describe("calculateGrossYield", () => {
  it("returns annual rent divided by price", () => {
    expect(
      calculateGrossYield({ propertyPriceCzk: 5_000_000, annualRentCzk: 300_000 }),
    ).toBeCloseTo(0.06);
  });

  it("returns 0 when price is invalid via schema", () => {
    expect(() =>
      calculateGrossYield({ propertyPriceCzk: 0, annualRentCzk: 100 }),
    ).toThrow();
  });
});

describe("calculateMonthlyCashFlow", () => {
  it("subtracts costs and mortgage from rent", () => {
    expect(
      calculateMonthlyCashFlow({
        monthlyRentCzk: 25_000,
        monthlyCostsCzk: 4_000,
        monthlyMortgageCzk: 15_000,
      }),
    ).toBe(6_000);
  });
});
