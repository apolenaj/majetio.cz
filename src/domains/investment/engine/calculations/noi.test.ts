import { describe, expect, it } from "vitest";

import { Money, Percentage } from "@/domains/finance";

import { calculateGrossIncome } from "./income";
import { calculateAnnualOperatingExpenses } from "./opex";
import { calculateNoi, calculateYields } from "./metrics";
import { requireFormula } from "../formulas/registry";

describe("NOI pipeline", () => {
  it("builds PGI → vacancy → EGI → opex → NOI and binds formula keys", () => {
    const income = calculateGrossIncome({
      monthlyRent: Money.fromMajor(30_000, "CZK"),
      vacancyRate: Percentage.fromPercentPoints(5),
    });

    expect(income.potentialGrossIncome.value.toMajorString()).toBe("360000");
    expect(income.vacancyLoss.value.toMajorString()).toBe("18000");
    expect(income.effectiveGrossIncome.value.toMajorString()).toBe("342000");
    expect(income.potentialGrossIncome.formulaKey).toBe(
      "potential_gross_income",
    );
    expect(income.effectiveGrossIncome.formulaKey).toBe(
      "effective_gross_income",
    );

    const opex = calculateAnnualOperatingExpenses(
      {
        propertyManagement: Money.fromMajor(24_000, "CZK"),
        maintenance: Money.fromMajor(12_000, "CZK"),
        insurance: Money.fromMajor(6_000, "CZK"),
        propertyTax: Money.fromMajor(4_000, "CZK"),
        svjOwnerCost: Money.fromMajor(18_000, "CZK"),
        svjAdvances: Money.fromMajor(36_000, "CZK"),
        platformFees: null,
      },
      Money.zero("CZK"),
    );

    // Advances excluded from NOI opex
    expect(opex.annualOpex.value.toMajorString()).toBe("64000");
    expect(opex.svjAdvancesExcluded?.toMajorString()).toBe("36000");
    expect(opex.annualOpex.formulaKey).toBe("operating_expenses");

    const noi = calculateNoi({
      effectiveGrossIncome: income.effectiveGrossIncome.value,
      annualOperatingExpenses: opex.annualOpex.value,
    });

    expect(noi.formulaKey).toBe("noi");
    expect(noi.value.toMajorString()).toBe("278000");
    expect(requireFormula("noi").formulaText).toMatch(/EGI/);

    const tac = Money.fromMajor(6_000_000, "CZK");
    const yields = calculateYields({
      effectiveGrossIncome: income.effectiveGrossIncome.value,
      noi: noi.value,
      totalAcquisitionCost: tac,
    });

    expect(yields.netYield.formulaKey).toBe("net_yield");
    expect(requireFormula("net_yield").formulaText).toMatch(
      /Celkové pořizovací náklady/,
    );
    // 278000 / 6000000 ≈ 0.046333...
    expect(yields.netYield.value.toRatio().toNumber()).toBeCloseTo(
      278_000 / 6_000_000,
      6,
    );
  });
});
