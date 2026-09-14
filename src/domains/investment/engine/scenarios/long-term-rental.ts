/**
 * Long-term rental scenario — full leveraged holding model.
 */

import { type Money, Percentage } from "@/domains/finance";

import { calculateEquityRequired } from "../calculations/cash-flow";
import { projectHoldingPeriod } from "../calculations/projection";
import {
  buildEquityCashFlowSeries,
  calculateEquityMultiple,
  calculateIrr,
  calculatePaybackPeriod,
} from "../calculations/returns";
import type {
  LongTermRentalScenarioResult,
  ScenarioGrowthAssumptions,
  ScenarioLoanAssumptions,
} from "./types";

export type LongTermRentalScenarioInput = {
  holdYears: number;
  totalAcquisitionCost: Money;
  baseEgi: Money;
  baseOpex: Money;
  initialPropertyValue?: Money;
  growth: ScenarioGrowthAssumptions;
  loan: ScenarioLoanAssumptions;
};

export function calculateLongTermRentalScenario(
  input: LongTermRentalScenarioInput,
): LongTermRentalScenarioResult {
  const propertyValue =
    input.initialPropertyValue ?? input.totalAcquisitionCost;
  const equity = calculateEquityRequired({
    totalAcquisitionCost: input.totalAcquisitionCost,
    loanPrincipal: input.loan.principal,
  }).value;

  const projection = projectHoldingPeriod({
    holdYears: input.holdYears,
    baseEgi: input.baseEgi,
    baseOpex: input.baseOpex,
    initialPropertyValue: propertyValue,
    appreciationRate: input.growth.appreciationRate,
    rentGrowthRate: input.growth.rentGrowthRate,
    expenseInflationRate: input.growth.expenseInflationRate,
    loan: input.loan,
    sellingCostRate: input.growth.sellingCostRate ?? Percentage.fromPercentPoints(3),
  });

  const series = buildEquityCashFlowSeries(
    equity,
    projection.annualEquityCashFlowsWithExit,
  );

  return {
    kind: "long_term_rental",
    equityRequired: equity,
    projection,
    returns: {
      irr: calculateIrr(series),
      equityMultiple: calculateEquityMultiple(series),
      payback: calculatePaybackPeriod(series),
    },
  };
}
