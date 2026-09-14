/**
 * Multi-year holding projection with rent growth, opex inflation, appreciation (pure).
 */

import {
  Money,
  type Percentage,
  type NominalInterestRate,
} from "@/domains/finance";

import {
  buildAmortizationSchedule,
  growMoneyAnnual,
  outstandingLoanBalance,
} from "./amortization";
import { calculateNetSaleProceeds, projectSalePrice } from "./exit";
import { bindFormula, type FormulaBound } from "./helpers";

export type HoldingProjectionInput = {
  holdYears: number;
  /** Year-0 effective gross income (annual). */
  baseEgi: Money;
  /** Year-0 annual operating expenses. */
  baseOpex: Money;
  /** Starting property value (often TAC or purchase). */
  initialPropertyValue: Money;
  appreciationRate: Percentage;
  rentGrowthRate: Percentage;
  expenseInflationRate: Percentage;
  /** Levered projection — omit for cash purchase. */
  loan?: {
    principal: Money;
    nominalInterestRate: NominalInterestRate;
    termYears: number;
  } | null;
  sellingCostRate?: Percentage | null;
  sellingCostsAbsolute?: Money | null;
};

export type HoldingYearRow = {
  year: number;
  egi: Money;
  opex: Money;
  noi: Money;
  debtService: Money;
  cashFlowBeforeExit: Money;
  propertyValue: Money;
  loanBalanceEndOfYear: Money;
};

export type HoldingProjectionResult = {
  projection: FormulaBound<HoldingYearRow[]>;
  /** Annual levered CF before adding exit proceeds. */
  annualCashFlowsBeforeExit: Money[];
  exit: {
    salePrice: Money;
    sellingCosts: Money;
    loanBalance: Money;
    netSaleProceeds: Money;
  };
  /** Annual equity CF with exit proceeds added to the final year. */
  annualEquityCashFlowsWithExit: Money[];
};

function assertHoldYears(years: number): void {
  if (!Number.isInteger(years) || years < 1 || years > 30) {
    throw new Error("holdYears must be an integer between 1 and 30");
  }
}

/**
 * Generate annual operating CF for years 1..N and exit metrics at year N.
 */
export function projectHoldingPeriod(
  input: HoldingProjectionInput,
): HoldingProjectionResult {
  assertHoldYears(input.holdYears);
  const currency = input.baseEgi.currency;

  const amort = input.loan
    ? buildAmortizationSchedule({
        principal: input.loan.principal,
        nominalInterestRate: input.loan.nominalInterestRate,
        termYears: input.loan.termYears,
        maxMonths: input.holdYears * 12,
      })
    : null;

  const rows: HoldingYearRow[] = [];
  const annualBeforeExit: Money[] = [];

  for (let year = 1; year <= input.holdYears; year++) {
    const egi = growMoneyAnnual(input.baseEgi, input.rentGrowthRate, year - 1);
    const opex = growMoneyAnnual(
      input.baseOpex,
      input.expenseInflationRate,
      year - 1,
    );
    const noi = egi.sub(opex).roundForDisplay();
    const propertyValue = growMoneyAnnual(
      input.initialPropertyValue,
      input.appreciationRate,
      year,
    );

    let debtService = Money.zero(currency);
    let loanBalanceEnd = Money.zero(currency);

    if (input.loan && amort) {
      const startMonth = (year - 1) * 12;
      const endMonth = year * 12;
      const yearPayments = amort.schedule.value.filter(
        (r) => r.month > startMonth && r.month <= endMonth,
      );
      debtService = yearPayments.reduce(
        (acc, r) => acc.add(r.payment),
        Money.zero(currency),
      );
      loanBalanceEnd = outstandingLoanBalance({
        principal: input.loan.principal,
        nominalInterestRate: input.loan.nominalInterestRate,
        termYears: input.loan.termYears,
        afterMonths: endMonth,
      });
    }

    const cashFlowBeforeExit = noi.sub(debtService).roundForDisplay();
    rows.push({
      year,
      egi,
      opex,
      noi,
      debtService: debtService.roundForDisplay(),
      cashFlowBeforeExit,
      propertyValue,
      loanBalanceEndOfYear: loanBalanceEnd,
    });
    annualBeforeExit.push(cashFlowBeforeExit);
  }

  const salePrice = projectSalePrice({
    initialPropertyValue: input.initialPropertyValue,
    appreciationRate: input.appreciationRate,
    holdYears: input.holdYears,
  });
  const loanBalance = input.loan
    ? outstandingLoanBalance({
        principal: input.loan.principal,
        nominalInterestRate: input.loan.nominalInterestRate,
        termYears: input.loan.termYears,
        afterMonths: input.holdYears * 12,
      })
    : Money.zero(currency);

  const exit = calculateNetSaleProceeds({
    salePrice,
    sellingCosts: input.sellingCostsAbsolute,
    sellingCostRate: input.sellingCostRate,
    outstandingLoanBalance: loanBalance,
  });

  const withExit = annualBeforeExit.map((cf, i) =>
    i === annualBeforeExit.length - 1
      ? cf.add(exit.netSaleProceeds.value).roundForDisplay()
      : cf,
  );

  return {
    projection: bindFormula("holding_projection", rows),
    annualCashFlowsBeforeExit: annualBeforeExit,
    exit: {
      salePrice: exit.salePrice,
      sellingCosts: exit.sellingCosts,
      loanBalance: exit.outstandingLoanBalance,
      netSaleProceeds: exit.netSaleProceeds.value,
    },
    annualEquityCashFlowsWithExit: withExit,
  };
}
