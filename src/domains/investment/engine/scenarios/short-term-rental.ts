/**
 * Short-term rental — seasonal ADR × occupancy → year-0 income, then holding projection.
 */

import { Money, Percentage } from "@/domains/finance";

import { calculateEquityRequired } from "../calculations/cash-flow";
import { projectHoldingPeriod } from "../calculations/projection";
import {
  buildEquityCashFlowSeries,
  calculateEquityMultiple,
  calculateIrr,
  calculatePaybackPeriod,
} from "../calculations/returns";
import type {
  ScenarioGrowthAssumptions,
  ScenarioLoanAssumptions,
  ShortTermRentalScenarioResult,
} from "./types";

export type SeasonalMonthInput = {
  /** 1–12 */
  month: number;
  /** Average daily rate (major currency units). */
  adr: Money;
  /** Occupancy ratio 0–1 for the month. */
  occupancy: Percentage;
  /** Days in month (default 30). */
  daysInMonth?: number;
};

export type ShortTermRentalScenarioInput = {
  holdYears: number;
  totalAcquisitionCost: Money;
  /** 12 seasonal months (or fewer — missing months = 0 income). */
  seasonality: SeasonalMonthInput[];
  /** Annual opex including platform fees (already annualized). */
  baseOpex: Money;
  initialPropertyValue?: Money;
  growth: ScenarioGrowthAssumptions;
  loan?: ScenarioLoanAssumptions | null;
};

export function calculateSeasonalGrossIncome(
  seasonality: SeasonalMonthInput[],
): { annualGross: Money; occupiedNights: number } {
  if (seasonality.length === 0) {
    throw new Error("seasonality requires at least one month");
  }
  const currency = seasonality[0]!.adr.currency;
  let total = Money.zero(currency);
  let nights = 0;

  for (const m of seasonality) {
    if (m.month < 1 || m.month > 12) {
      throw new Error(`invalid month ${m.month}`);
    }
    const days = m.daysInMonth ?? 30;
    const occ = m.occupancy.toRatio();
    if (occ.lt(0) || occ.gt(1)) {
      throw new Error("occupancy must be a ratio between 0 and 1");
    }
    const occupied = occ.mul(days);
    nights += occupied.toNumber();
    const monthIncome = Money.fromMajor(
      m.adr.major.mul(occupied),
      currency,
    );
    total = total.add(monthIncome);
  }

  return {
    annualGross: total.roundForDisplay(),
    occupiedNights: Math.round(nights * 10) / 10,
  };
}

export function calculateShortTermRentalScenario(
  input: ShortTermRentalScenarioInput,
): ShortTermRentalScenarioResult {
  const { annualGross, occupiedNights } = calculateSeasonalGrossIncome(
    input.seasonality,
  );
  const propertyValue =
    input.initialPropertyValue ?? input.totalAcquisitionCost;
  const equity = calculateEquityRequired({
    totalAcquisitionCost: input.totalAcquisitionCost,
    loanPrincipal: input.loan?.principal ?? null,
  }).value;

  const projection = projectHoldingPeriod({
    holdYears: input.holdYears,
    baseEgi: annualGross,
    baseOpex: input.baseOpex,
    initialPropertyValue: propertyValue,
    appreciationRate: input.growth.appreciationRate,
    rentGrowthRate: input.growth.rentGrowthRate,
    expenseInflationRate: input.growth.expenseInflationRate,
    loan: input.loan ?? null,
    sellingCostRate: input.growth.sellingCostRate ?? Percentage.fromPercentPoints(3),
  });

  const series = buildEquityCashFlowSeries(
    equity,
    projection.annualEquityCashFlowsWithExit,
  );

  return {
    kind: "short_term_rental",
    equityRequired: equity,
    year0GrossIncome: annualGross,
    year0OccupancyWeightedNights: occupiedNights,
    projection,
    returns: {
      irr: calculateIrr(series),
      equityMultiple: calculateEquityMultiple(series),
      payback: calculatePaybackPeriod(series),
    },
  };
}
