export type { PropertyInvestmentInput, ScenarioId, CalculationIssue } from "./types";
export { DEMO_INVESTMENT, DEMO_INTEREST_RATE, investmentFromPrefill } from "./types";
export {
  monthlyOperatingCosts,
  annualOperatingCosts,
  resolvedLoan,
  safeDivide,
  totalAcquisitionCost,
  initialCashInvested,
} from "./common";
export { calculateMortgage, remainingBalanceAfterYears } from "./mortgage";
export { buildIncomeStatement } from "./income";
export type { IncomeStatement } from "./income";
export { calculateCashFlow, calculateYields } from "./cashflow";
export { calculatePayback } from "./payback";
export {
  calculateMaxOfferByYield,
  calculateMaxOfferByCashFlow,
  offerGap,
} from "./max-offer";
export { estimateRenovation, defaultRenovationSelection } from "./renovation";
export { RENOVATION_COST_RANGES, RENOVATION_RANGES_NOTE } from "./renovation-cost-ranges";
export type { RenovationItemId } from "./renovation-cost-ranges";
export { applyScenario, SCENARIO_DELTAS } from "./scenarios";
