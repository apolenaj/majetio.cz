import { describe, expect, it } from "vitest";

import { Money } from "@/domains/finance";
import { nominalInterestRateFromPercentPoints } from "@/domains/finance";

import {
  calculateAnnuityPayment,
  countCashFlowSignChanges,
  calculateIrr,
  validateDomainInputs,
  classifyLoanAmount,
  moneyToDto,
} from "@/domains/investment/engine";
import {
  hashCalculationInput,
  runInvestmentCalculationPure,
  buildPropertyInvestmentSnapshot,
} from "@/domains/investment/service";

describe("validateDomainInputs", () => {
  it("rejects non-positive purchase price", () => {
    const r = validateDomainInputs({
      purchasePriceMajor: 0,
      termYears: 30,
      vacancyRatio: 0.05,
      annualOpexMajor: 50_000,
      interestRateRatio: 0.05,
      appreciationRatio: null,
      rentGrowthRatio: null,
      loanAmountMajor: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues[0]?.category).toBe("invalid_input");
    }
  });

  it("allows negative growth and warns on full vacancy", () => {
    const r = validateDomainInputs({
      purchasePriceMajor: 5_000_000,
      termYears: 30,
      vacancyRatio: 1,
      annualOpexMajor: 50_000,
      interestRateRatio: -0.01,
      appreciationRatio: -0.02,
      rentGrowthRatio: null,
      loanAmountMajor: 0,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some((w) => w.code === "full_vacancy_stress")).toBe(true);
      expect(r.warnings.some((w) => w.code === "negative_interest_rate")).toBe(
        true,
      );
    }
  });
});

describe("classifyLoanAmount", () => {
  it("distinguishes null, zero, and financed", () => {
    expect(classifyLoanAmount(null)).toBe("missing");
    expect(classifyLoanAmount(undefined)).toBe("missing");
    expect(classifyLoanAmount(0)).toBe("cash");
    expect(classifyLoanAmount(3_000_000)).toBe("financed");
  });
});

describe("negative nominal rate annuity", () => {
  it("computes without throwing for small negative rates", () => {
    const result = calculateAnnuityPayment({
      principal: Money.fromMajor(1_000_000, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(-1),
      termYears: 20,
    });
    expect(result.monthlyPayment.value.toMajorNumber()).toBeGreaterThan(0);
    expect(result.monthlyPayment.value.toMajorNumber()).toBeLessThan(50_000);
  });
});

describe("IRR sign changes", () => {
  it("detects multiple sign changes", () => {
    const flows = [
      Money.fromMajor(-100, "CZK"),
      Money.fromMajor(230, "CZK"),
      Money.fromMajor(-132, "CZK"),
    ];
    expect(countCashFlowSignChanges(flows.map((m) => m.major))).toBe(2);
    const irr = calculateIrr({ flows });
    expect(irr.multipleRootsPossible).toBe(true);
  });

  it("flags undefined IRR without sign change", () => {
    const irr = calculateIrr({
      flows: [Money.fromMajor(10, "CZK"), Money.fromMajor(20, "CZK")],
    });
    expect(irr.value).toBeNull();
    expect(irr.converged).toBe(false);
  });
});

describe("runInvestmentCalculationPure — Part 2/C edge cases", () => {
  const baseSnapshot = () =>
    buildPropertyInvestmentSnapshot({
      id: "edge-1",
      askingPrice: 5_000_000,
      currency: "CZK",
    });

  function run(assumptionSet: Record<string, unknown>, intent?: "own_use") {
    const snapshot = baseSnapshot();
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptionSet as never,
      scenarioType: "BASE_METRICS",
    });
    return runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      assumptionSet: assumptionSet as never,
      inputHash: hash,
      intent,
    });
  }

  it("marks DSCR not_applicable for cash purchase (loanAmount = 0)", () => {
    const result = run({
      monthlyRent: moneyToDto(Money.fromMajor(25_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(60_000, "CZK")),
      loanAmount: moneyToDto(Money.zero("CZK")),
      vacancyRate: { ratio: "0.05" },
    });

    const dscr =
      result.unavailableMetrics.find((m) => m.formulaKey === "dscr") ??
      result.availableMetrics.find((m) => m.formulaKey === "dscr");
    expect(dscr?.status).toBe("not_applicable");
    expect(dscr?.value).toBeNull();
  });

  it("marks yields not_applicable for own_use intent", () => {
    const result = run(
      {
        annualOperatingCosts: moneyToDto(Money.fromMajor(72_000, "CZK")),
        loanAmount: moneyToDto(Money.fromMajor(3_000_000, "CZK")),
        nominalInterestRate: { ratio: "0.05" },
        termYears: 25,
      },
      "own_use",
    );

    const netYield = result.unavailableMetrics.find(
      (m) => m.formulaKey === "net_yield",
    );
    expect(netYield?.status).toBe("not_applicable");
    expect(netYield?.statusReason).toMatch(/Vlastní bydlení/i);
  });

  it("warns on LTV > 100 % without failing", () => {
    const result = run({
      monthlyRent: moneyToDto(Money.fromMajor(20_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(50_000, "CZK")),
      loanAmount: moneyToDto(Money.fromMajor(6_000_000, "CZK")),
      nominalInterestRate: { ratio: "0.06" },
      termYears: 30,
      vacancyRate: { ratio: "0.05" },
    });

    expect(result.status).not.toBe("FAILED");
    expect(result.resultWarnings.some((w) => w.code === "ltv_over_100")).toBe(
      true,
    );
  });

  it("accepts 100 % vacancy as valid stress test", () => {
    const result = run({
      monthlyRent: moneyToDto(Money.fromMajor(25_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(60_000, "CZK")),
      vacancyRate: { ratio: "1" },
      loanAmount: moneyToDto(Money.fromMajor(3_000_000, "CZK")),
      nominalInterestRate: { ratio: "0.05" },
      termYears: 30,
    });

    expect(result.status).not.toBe("FAILED");
    expect(
      result.resultWarnings.some((w) => w.code === "full_vacancy_stress"),
    ).toBe(true);
  });

  it("does not fail on negative cash flow", () => {
    const result = run({
      monthlyRent: moneyToDto(Money.fromMajor(12_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(90_000, "CZK")),
      vacancyRate: { ratio: "0.1" },
      loanAmount: moneyToDto(Money.fromMajor(4_500_000, "CZK")),
      nominalInterestRate: { ratio: "0.065" },
      termYears: 30,
    });

    expect(result.status).not.toBe("FAILED");
    const cf = result.availableMetrics.find(
      (m) => m.formulaKey === "annual_cash_flow_leveraged",
    );
    expect(cf?.kind).toBe("money");
    if (cf?.kind === "money" && cf.value) {
      expect(Number(cf.value.amountMinor)).toBeLessThan(0);
    }
    expect(
      result.resultWarnings.some((w) => w.code === "negative_cash_flow"),
    ).toBe(true);
  });
});
