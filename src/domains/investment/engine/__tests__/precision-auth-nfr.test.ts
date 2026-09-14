/**
 * Part 2/D — Precision, serialization round-trip, auth role access.
 */

import { describe, expect, it } from "vitest";

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import {
  buildAmortizationSchedule,
  calculateAnnuityPayment,
  calculateGrossIncome,
  calculateNoi,
  moneyFromDto,
  moneyToDto,
  percentageFromDto,
  percentageToDto,
} from "../index";
import {
  canReadScenario,
  canWriteScenario,
  type ScenarioAccessUser,
} from "../../scenarios/access";
import {
  hashCalculationInput,
  runInvestmentCalculationPure,
  buildPropertyInvestmentSnapshot,
  orchestratedCalculationResultSchema,
} from "../../service";

describe("Precision — large and small amounts", () => {
  it("handles ~1 mld. CZK principal without overflow", () => {
    const principal = Money.fromMajor(1_000_000_000, "CZK");
    const ann = calculateAnnuityPayment({
      principal,
      nominalInterestRate: nominalInterestRateFromPercentPoints(5),
      termYears: 30,
    });
    expect(ann.monthlyPayment.value.toMajorNumber()).toBeGreaterThan(1_000_000);
    expect(Number.isFinite(ann.monthlyPayment.value.toMajorNumber())).toBe(true);

    const schedule = buildAmortizationSchedule({
      principal,
      nominalInterestRate: nominalInterestRateFromPercentPoints(5),
      termYears: 30,
    });
    expect(schedule.endingBalance.toMajorNumber()).toBeLessThan(100);
    expect(schedule.endingBalance.toMajorNumber()).toBeGreaterThanOrEqual(-0.01);
  });

  it("handles small (haléř-scale) amounts without inventing zeros incorrectly", () => {
    const rent = Money.fromMajor("0.50", "CZK");
    const income = calculateGrossIncome({
      monthlyRent: rent,
      vacancyRate: Percentage.fromPercentPoints(0),
    });
    // 0.50 × 12 = 6.00
    expect(income.potentialGrossIncome.value.toMajorString()).toBe("6");
    const noi = calculateNoi({
      effectiveGrossIncome: income.effectiveGrossIncome.value,
      annualOperatingExpenses: Money.fromMajor("1.25", "CZK"),
    });
    expect(noi.value.toMajorString()).toBe("4.75");
  });

  it("minor-unit DTO survives JSON serialize → parse → Money", () => {
    const amounts = [
      Money.fromMajor(1_000_000_000, "CZK"),
      Money.fromMajor("0.01", "CZK"),
      Money.fromMajor("1234567.89", "CZK"),
      Money.fromMajor(-8_310.72, "CZK"),
    ];
    for (const m of amounts) {
      const dto = moneyToDto(m);
      const wire = JSON.parse(JSON.stringify(dto)) as typeof dto;
      const back = moneyFromDto(wire);
      expect(back.toMinorInteger().toString()).toBe(m.toMinorInteger().toString());
      expect(back.currency).toBe(m.currency);
    }
  });

  it("percentage ratio DTO survives JSON round-trip", () => {
    const ratios = [0.057, 0.045, -0.004617, 1, 0];
    for (const r of ratios) {
      const p = Percentage.fromRatio(r);
      const dto = percentageToDto(p);
      const wire = JSON.parse(JSON.stringify(dto)) as typeof dto;
      const back = percentageFromDto(wire);
      expect(back.toRatio().toNumber()).toBeCloseTo(r, 12);
    }
  });

  it("orchestrated result envelope parses after JSON round-trip", () => {
    const snapshot = buildPropertyInvestmentSnapshot({
      id: "ser-1",
      askingPrice: 6_000_000,
      currency: "CZK",
    });
    const assumptionSet = {
      monthlyRent: moneyToDto(Money.fromMajor(30_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(72_000, "CZK")),
      vacancyRate: percentageToDto(Percentage.fromPercentPoints(5)),
      loanAmount: moneyToDto(Money.fromMajor(4_200_000, "CZK")),
      nominalInterestRate: percentageToDto(Percentage.fromPercentPoints(5.25)),
      termYears: 30,
    };
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet,
      scenarioType: "BASE_METRICS",
    });
    const result = runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      assumptionSet,
      inputHash: hash,
    });
    const wire = JSON.parse(JSON.stringify(result));
    const parsed = orchestratedCalculationResultSchema.parse(wire);
    expect(parsed.availableMetrics.length).toBeGreaterThan(0);
    const noi = parsed.availableMetrics.find((m) => m.formulaKey === "noi");
    expect(noi?.kind).toBe("money");
    if (noi?.kind === "money" && noi.value) {
      expect(noi.value.amountMinor).toMatch(/^\d+$/);
    }
  });
});

describe("Auth roles — scenario access matrix", () => {
  const owner: ScenarioAccessUser = { id: "user-owner", role: "USER" };
  const other: ScenarioAccessUser = { id: "user-other", role: "USER" };
  const analyst: ScenarioAccessUser = { id: "staff-1", role: "ANALYST" };
  const admin: ScenarioAccessUser = { id: "admin-1", role: "ADMIN" };

  it("owner can read/write own USER scenario; public viewer cannot", () => {
    const scenario = {
      ownerUserId: owner.id,
      profile: "USER" as const,
      isPublicShareEnabled: true, // ignored for USER in Part 2/B
    };
    expect(canReadScenario(scenario, owner)).toBe(true);
    expect(canWriteScenario(scenario, owner)).toBe(true);
    expect(canReadScenario(scenario, other)).toBe(false);
    expect(canWriteScenario(scenario, other)).toBe(false);
    expect(canReadScenario(scenario, null)).toBe(false);
  });

  it("analyst/admin (staff) can read USER scenarios; only staff writes ANALYST", () => {
    const userScenario = {
      ownerUserId: owner.id,
      profile: "USER" as const,
      isPublicShareEnabled: false,
    };
    expect(canReadScenario(userScenario, analyst)).toBe(true);
    expect(canReadScenario(userScenario, admin)).toBe(true);

    const analystScenario = {
      ownerUserId: null,
      profile: "ANALYST" as const,
      isPublicShareEnabled: false,
    };
    expect(canReadScenario(analystScenario, other)).toBe(false);
    expect(canReadScenario(analystScenario, analyst)).toBe(true);
    expect(canWriteScenario(analystScenario, analyst)).toBe(true);
    expect(canWriteScenario(analystScenario, owner)).toBe(false);
  });

  it("SYSTEM_NEUTRAL is readable by public viewer; not writable", () => {
    const system = {
      ownerUserId: null,
      profile: "SYSTEM_NEUTRAL" as const,
      isPublicShareEnabled: true,
    };
    expect(canReadScenario(system, null)).toBe(true);
    expect(canReadScenario(system, other)).toBe(true);
    expect(canWriteScenario(system, admin)).toBe(false);
  });
});
