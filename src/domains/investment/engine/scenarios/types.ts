/**
 * Shared scenario contracts for the investment engine.
 */

import type { Money, Percentage, NominalInterestRate } from "@/domains/finance";

import type { HoldingProjectionResult } from "../calculations/projection";
import type { IrrResult, EquityMultipleResult, PaybackResult } from "../calculations/returns";

export const SCENARIO_KINDS = [
  "long_term_rental",
  "cash_purchase",
  "short_term_rental",
  "flip",
  "renovation_rent",
] as const;

export type ScenarioKind = (typeof SCENARIO_KINDS)[number];

export type ScenarioGrowthAssumptions = {
  appreciationRate: Percentage;
  rentGrowthRate: Percentage;
  expenseInflationRate: Percentage;
  sellingCostRate?: Percentage | null;
};

export type ScenarioLoanAssumptions = {
  principal: Money;
  nominalInterestRate: NominalInterestRate;
  termYears: number;
};

export type ScenarioReturnsBundle = {
  irr: IrrResult;
  equityMultiple: EquityMultipleResult;
  payback: PaybackResult;
};

export type ScenarioBaseResult = {
  kind: ScenarioKind;
  equityRequired: Money;
  returns: ScenarioReturnsBundle;
};

export type LongTermRentalScenarioResult = ScenarioBaseResult & {
  kind: "long_term_rental";
  projection: HoldingProjectionResult;
};

export type CashPurchaseScenarioResult = ScenarioBaseResult & {
  kind: "cash_purchase";
  projection: HoldingProjectionResult;
};

export type ShortTermRentalScenarioResult = ScenarioBaseResult & {
  kind: "short_term_rental";
  /** Year-0 PGI from seasonal months. */
  year0GrossIncome: Money;
  year0OccupancyWeightedNights: number;
  projection: HoldingProjectionResult;
};

export type FlipScenarioResult = ScenarioBaseResult & {
  kind: "flip";
  holdMonths: number;
  totalFlipCost: Money;
  salePrice: Money;
  grossProfit: Money;
  costMargin: Percentage;
  netSaleProceeds: Money;
};

export type RenovationRentScenarioResult = ScenarioBaseResult & {
  kind: "renovation_rent";
  renovationMonths: number;
  rentLossDuringRenovation: Money;
  projection: HoldingProjectionResult;
};

export type AnyScenarioResult =
  | LongTermRentalScenarioResult
  | CashPurchaseScenarioResult
  | ShortTermRentalScenarioResult
  | FlipScenarioResult
  | RenovationRentScenarioResult;
