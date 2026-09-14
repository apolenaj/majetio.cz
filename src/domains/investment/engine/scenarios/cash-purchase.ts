/**
 * Cash purchase scenario — same projection stack, no loan.
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
  CashPurchaseScenarioResult,
  ScenarioGrowthAssumptions,
} from "./types";

export type CashPurchaseScenarioInput = {
  holdYears: number;
  totalAcquisitionCost: Money;
  baseEgi: Money;
  baseOpex: Money;
  initialPropertyValue?: Money;
  growth: ScenarioGrowthAssumptions;
};

export function calculateCashPurchaseScenario(
  input: CashPurchaseScenarioInput,
): CashPurchaseScenarioResult {
  const propertyValue =
    input.initialPropertyValue ?? input.totalAcquisitionCost;
  const equity = calculateEquityRequired({
    totalAcquisitionCost: input.totalAcquisitionCost,
    loanPrincipal: null,
  }).value;

  const projection = projectHoldingPeriod({
    holdYears: input.holdYears,
    baseEgi: input.baseEgi,
    baseOpex: input.baseOpex,
    initialPropertyValue: propertyValue,
    appreciationRate: input.growth.appreciationRate,
    rentGrowthRate: input.growth.rentGrowthRate,
    expenseInflationRate: input.growth.expenseInflationRate,
    loan: null,
    sellingCostRate: input.growth.sellingCostRate ?? Percentage.fromPercentPoints(3),
  });

  const series = buildEquityCashFlowSeries(
    equity,
    projection.annualEquityCashFlowsWithExit,
  );

  return {
    kind: "cash_purchase",
    equityRequired: equity,
    projection,
    returns: {
      irr: calculateIrr(series),
      equityMultiple: calculateEquityMultiple(series),
      payback: calculatePaybackPeriod(series),
    },
  };
}
