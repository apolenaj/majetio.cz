/**
 * UI input model for investment yield calculator (major Kč / percent points).
 */

import { MAJETIO_BASELINE } from "./assumption-baseline";
import type { InvestmentStrategy } from "./strategy";

export type CalculatorMode = "basic" | "advanced";

export type InvestmentCalculatorInputs = {
  mode: CalculatorMode;
  strategy: InvestmentStrategy;
  purchasePrice: number | null;
  equity: number | null;
  loanAmount: number | null;
  interestRatePp: number | null;
  termYears: number | null;
  monthlyRent: number | null;
  vacancyPp: number | null;
  annualOpex: number | null;
  acquisitionCosts: number | null;
  renovation: number | null;
  initialFurnishing: number | null;
  fees: number | null;
  repairFundAnnual: number | null;
  appreciationPp: number | null;
  rentGrowthPp: number | null;
  expenseInflationPp: number | null;
  sellingCostPp: number | null;
  holdYears: number | null;
};

export const DEFAULT_CALCULATOR_INPUTS: InvestmentCalculatorInputs = {
  mode: "basic",
  strategy: "long_term_rental",
  purchasePrice: MAJETIO_BASELINE.purchasePrice,
  equity: MAJETIO_BASELINE.equity,
  loanAmount: MAJETIO_BASELINE.loanAmount,
  interestRatePp: MAJETIO_BASELINE.interestRatePp,
  termYears: MAJETIO_BASELINE.termYears,
  monthlyRent: MAJETIO_BASELINE.monthlyRent,
  vacancyPp: MAJETIO_BASELINE.vacancyPp,
  annualOpex: MAJETIO_BASELINE.annualOpex,
  acquisitionCosts: MAJETIO_BASELINE.acquisitionCosts,
  renovation: MAJETIO_BASELINE.renovation,
  initialFurnishing: MAJETIO_BASELINE.initialFurnishing,
  fees: MAJETIO_BASELINE.fees,
  repairFundAnnual: MAJETIO_BASELINE.repairFundAnnual,
  appreciationPp: MAJETIO_BASELINE.appreciationPp,
  rentGrowthPp: MAJETIO_BASELINE.rentGrowthPp,
  expenseInflationPp: MAJETIO_BASELINE.expenseInflationPp,
  sellingCostPp: MAJETIO_BASELINE.sellingCostPp,
  holdYears: MAJETIO_BASELINE.holdYears,
};

export type InvestmentCalculatorField = keyof InvestmentCalculatorInputs;
