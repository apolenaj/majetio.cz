import { buildIncomeStatement } from "./income";
import type { IncomeStatement } from "./income";
import type { PropertyInvestmentInput } from "./types";

export function calculateCashFlow(input: PropertyInvestmentInput): IncomeStatement {
  return buildIncomeStatement(input);
}

export function calculateYields(input: PropertyInvestmentInput): IncomeStatement {
  return buildIncomeStatement(input);
}
