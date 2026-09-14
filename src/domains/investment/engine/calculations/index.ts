export {
  bindFormula,
  moneyOverMoney,
  annualFromMonthly,
  monthlyFromAnnual,
  type FormulaBound,
} from "./helpers";

export {
  calculateAnnuityPayment,
  calculateDscr,
  annualDebtServiceFromMonthly,
  type AnnuityPaymentInput,
  type AnnuityPaymentResult,
  type DscrInput,
  type DscrResult,
} from "./financing";

export {
  calculateGrossIncome,
  type GrossIncomeInput,
  type GrossIncomeResult,
} from "./income";

export {
  calculateAnnualOperatingExpenses,
  type OperatingExpenseLines,
  type OperatingExpensesResult,
} from "./opex";

export {
  calculateNoi,
  calculateYields,
  calculateCapRate,
  type NoiInput,
  type NoiResult,
  type YieldInput,
  type YieldResult,
  type CapRateInput,
} from "./metrics";

export {
  calculateCashFlows,
  calculateEquityRequired,
  calculateLtv,
  calculateCashOnCash,
  type CashFlowInput,
  type CashFlowResult,
  type EquityRequiredInput,
  type LtvInput,
  type CashOnCashInput,
} from "./cash-flow";

export {
  buildAmortizationSchedule,
  outstandingLoanBalance,
  growMoneyAnnual,
  type AmortizationRow,
  type AmortizationScheduleInput,
  type AmortizationScheduleResult,
} from "./amortization";

export {
  calculateNetSaleProceeds,
  projectSalePrice,
  type NetSaleProceedsInput,
  type NetSaleProceedsResult,
} from "./exit";

export {
  projectHoldingPeriod,
  type HoldingProjectionInput,
  type HoldingYearRow,
  type HoldingProjectionResult,
} from "./projection";

export {
  calculateIrr,
  calculateEquityMultiple,
  calculatePaybackPeriod,
  buildEquityCashFlowSeries,
  countCashFlowSignChanges,
  type EquityCashFlowSeries,
  type IrrResult,
  type EquityMultipleResult,
  type PaybackResult,
} from "./returns";

export {
  calculateNpv,
  type NpvInput,
  type NpvResult,
} from "./npv";
