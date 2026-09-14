/**
 * Renovation & rent — rent gap during works, then holding projection with post-reno EGI.
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
  RenovationRentScenarioResult,
  ScenarioGrowthAssumptions,
  ScenarioLoanAssumptions,
} from "./types";

export type RenovationRentScenarioInput = {
  holdYears: number;
  totalAcquisitionCost: Money;
  /** EGI after renovation (stabilized). */
  stabilizedEgi: Money;
  /** Annual opex after renovation. */
  baseOpex: Money;
  renovationMonths: number;
  /**
   * Monthly rent that would have been earned during renovation (forgone).
   * Rent loss = monthlyForgoneRent × renovationMonths.
   */
  monthlyForgoneRent: Money;
  /** Capex already included in TAC or added here for equity. */
  renovationCapexExtra?: Money | null;
  initialPropertyValue?: Money;
  growth: ScenarioGrowthAssumptions;
  loan?: ScenarioLoanAssumptions | null;
};

export function calculateRenovationRentScenario(
  input: RenovationRentScenarioInput,
): RenovationRentScenarioResult {
  if (
    !Number.isInteger(input.renovationMonths) ||
    input.renovationMonths < 0
  ) {
    throw new Error("renovationMonths must be a non-negative integer");
  }

  const rentLoss = input.monthlyForgoneRent
    .mul(input.renovationMonths)
    .roundForDisplay();

  const propertyValue =
    input.initialPropertyValue ?? input.totalAcquisitionCost;
  const extra = input.renovationCapexExtra ?? Money.zero(input.totalAcquisitionCost.currency);
  const tac = input.totalAcquisitionCost.add(extra).roundForDisplay();

  const equity = calculateEquityRequired({
    totalAcquisitionCost: tac,
    loanPrincipal: input.loan?.principal ?? null,
  }).value;

  const projection = projectHoldingPeriod({
    holdYears: input.holdYears,
    baseEgi: input.stabilizedEgi,
    baseOpex: input.baseOpex,
    initialPropertyValue: propertyValue,
    appreciationRate: input.growth.appreciationRate,
    rentGrowthRate: input.growth.rentGrowthRate,
    expenseInflationRate: input.growth.expenseInflationRate,
    loan: input.loan ?? null,
    sellingCostRate: input.growth.sellingCostRate ?? Percentage.fromPercentPoints(3),
  });

  // Year-1 CF reduced by rent loss (one-time) when renovation spans into year 1
  const adjusted = projection.annualEquityCashFlowsWithExit.map((cf, i) => {
    if (i === 0 && input.renovationMonths > 0) {
      return cf.sub(rentLoss).roundForDisplay();
    }
    return cf;
  });

  const series = buildEquityCashFlowSeries(equity, adjusted);

  return {
    kind: "renovation_rent",
    equityRequired: equity,
    renovationMonths: input.renovationMonths,
    rentLossDuringRenovation: rentLoss,
    projection: {
      ...projection,
      annualEquityCashFlowsWithExit: adjusted,
    },
    returns: {
      irr: calculateIrr(series),
      equityMultiple: calculateEquityMultiple(series),
      payback: calculatePaybackPeriod(series),
    },
  };
}
