/**
 * Shared public-calculator input.
 * One income / opex / NOI model feeds cash flow, yield, payback and max offer.
 * Amounts are major CZK. Rates are percent points (5.09 = 5.09 %).
 */
export type PropertyInvestmentInput = {
  purchasePrice: number;
  ownCapital: number;
  /** Null → derived as max(0, purchasePrice − ownCapital). */
  loanAmount: number | null;
  annualInterestRate: number;
  loanYears: number;

  monthlyRent: number;
  otherMonthlyIncome: number;
  /** 0–100 */
  vacancyRate: number;

  /** Basic-mode lump sum (monthly). Ignored when useItemizedOpex is true. */
  monthlyOperatingLump: number;
  useItemizedOpex: boolean;

  monthlyHOA: number;
  maintenanceMonthly: number;
  insuranceMonthly: number;
  managementMonthly: number;
  otherOperatingMonthly: number;

  annualPropertyTax: number;
  annualOtherCosts: number;

  renovationCost: number;
  acquisitionCosts: number;
  initialReserve: number;

  /** Annual percent. */
  appreciationRate: number;
  rentGrowthRate: number;
  expenseGrowthRate: number;

  holdingPeriodYears: number;
  /** Sale cost as % of future property value. */
  saleCostRate: number;
};

export type ScenarioId = "adverse" | "base" | "favorable";

export type CalculationIssue = {
  code: string;
  message: string;
};

export const DEMO_INTEREST_RATE = 4.99;

export const DEMO_INVESTMENT: PropertyInvestmentInput = {
  purchasePrice: 5_900_000,
  ownCapital: 1_500_000,
  loanAmount: 4_400_000,
  annualInterestRate: DEMO_INTEREST_RATE,
  loanYears: 30,
  monthlyRent: 24_000,
  otherMonthlyIncome: 0,
  vacancyRate: 5,
  monthlyOperatingLump: 4_500,
  useItemizedOpex: false,
  monthlyHOA: 2_200,
  maintenanceMonthly: 800,
  insuranceMonthly: 350,
  managementMonthly: 1_200,
  otherOperatingMonthly: 0,
  annualPropertyTax: 2_400,
  annualOtherCosts: 0,
  renovationCost: 350_000,
  acquisitionCosts: 0,
  initialReserve: 0,
  appreciationRate: 2,
  rentGrowthRate: 2,
  expenseGrowthRate: 2,
  holdingPeriodYears: 10,
  saleCostRate: 3,
};

/** Prefill hook for a future “Spočítat tuto nemovitost” handoff. */
export function investmentFromPrefill(
  partial: Partial<PropertyInvestmentInput>,
): PropertyInvestmentInput {
  return { ...DEMO_INVESTMENT, ...partial };
}
