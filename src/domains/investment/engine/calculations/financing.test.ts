import { describe, expect, it } from "vitest";

import { Money } from "@/domains/finance";
import {
  aprFromPercentPoints,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import {
  calculateAnnuityPayment,
  calculateDscr,
} from "./financing";
import { requireFormula } from "../formulas/registry";

describe("annuity mortgage calculator", () => {
  it("computes a standard CZK annuity from nominal rate (not APR)", () => {
    const principal = Money.fromMajor(4_000_000, "CZK");
    const nominal = nominalInterestRateFromPercentPoints(5.25);
    const apr = aprFromPercentPoints(5.49);

    const result = calculateAnnuityPayment({
      principal,
      nominalInterestRate: nominal,
      termYears: 30,
      apr,
    });

    expect(result.zeroInterest).toBe(false);
    expect(result.termMonths).toBe(360);
    expect(result.apr?.kind).toBe("apr");
    expect(result.nominalInterestRate.kind).toBe("nominal_interest");
    // APR must not equal payment path — payment bound to annuity formula
    expect(result.monthlyPayment.formulaKey).toBe("annuity_payment");
    expect(requireFormula("annuity_payment").formulaText).toMatch(/nominální/i);

    // Sanity: payment roughly in 20–25k Kč band for 4M @ 5.25% / 30y
    const monthly = result.monthlyPayment.value.toMajorNumber();
    expect(monthly).toBeGreaterThan(20_000);
    expect(monthly).toBeLessThan(25_000);

    expect(
      result.annualDebtService.value.equals(
        result.monthlyDebtService.value.mul(12).roundForDisplay(),
      ),
    ).toBe(true);
  });

  it("handles zero nominal interest as principal / n", () => {
    const principal = Money.fromMajor(3_600_000, "CZK");
    const result = calculateAnnuityPayment({
      principal,
      nominalInterestRate: nominalInterestRateFromPercentPoints(0),
      termYears: 30,
    });

    expect(result.zeroInterest).toBe(true);
    expect(result.monthlyPayment.value.toMajorString()).toBe("10000");
    expect(result.annualDebtService.value.toMajorString()).toBe("120000");
  });

  it("computes DSCR from NOI and annual debt service", () => {
    const noi = Money.fromMajor(240_000, "CZK");
    const ads = Money.fromMajor(120_000, "CZK");
    const dscr = calculateDscr({ noi, annualDebtService: ads });
    expect(dscr.formulaKey).toBe("dscr");
    expect(dscr.value).toBe(2);
    expect(dscr.undefinedReason).toBeNull();
  });

  it("returns undefined DSCR when debt service is zero", () => {
    const dscr = calculateDscr({
      noi: Money.fromMajor(100_000, "CZK"),
      annualDebtService: Money.zero("CZK"),
    });
    expect(dscr.value).toBeNull();
    expect(dscr.undefinedReason).toMatch(/není definován/i);
  });

  it("supports negative nominal interest rates (Part 2/C)", () => {
    const result = calculateAnnuityPayment({
      principal: Money.fromMajor(2_000_000, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(-0.5),
      termYears: 25,
    });
    expect(result.zeroInterest).toBe(false);
    expect(result.monthlyPayment.value.toMajorNumber()).toBeGreaterThan(0);
  });
});
