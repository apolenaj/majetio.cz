/**
 * Shared year-1 operating snapshot for sensitivity / stress / break-even (pure).
 */

import {
  Money,
  Percentage,
  type NominalInterestRate,
  nominalInterestRateFromRatio,
} from "@/domains/finance";

import {
  calculateAnnuityPayment,
  calculateDscr,
} from "../calculations/financing";
import {
  calculateEquityRequired,
  calculateLtv,
} from "../calculations/cash-flow";

export type RiskBaseCase = {
  totalAcquisitionCost: Money;
  /** Stabilized annual EGI (after vacancy) at base occupancy. */
  annualEgi: Money;
  /** Potential gross income at 100% occupancy (for BE occupancy). */
  potentialGrossIncome?: Money | null;
  annualOpex: Money;
  loanPrincipal?: Money | null;
  nominalInterestRate?: NominalInterestRate | null;
  termYears?: number | null;
};

export type Year1OperatingMetrics = {
  noi: Money;
  annualDebtService: Money;
  monthlyDebtService: Money;
  annualCashFlow: Money;
  monthlyCashFlow: Money;
  dscr: number | null;
  equityRequired: Money;
  ltv: Percentage | null;
};

export function evaluateYear1Metrics(base: RiskBaseCase): Year1OperatingMetrics {
  const currency = base.totalAcquisitionCost.currency;
  const noi = base.annualEgi.sub(base.annualOpex).roundForDisplay();

  let monthlyDebtService = Money.zero(currency);
  let annualDebtService = Money.zero(currency);

  if (
    base.loanPrincipal != null &&
    !base.loanPrincipal.isZero() &&
    base.nominalInterestRate != null &&
    base.termYears != null &&
    base.termYears > 0
  ) {
    const annuity = calculateAnnuityPayment({
      principal: base.loanPrincipal,
      nominalInterestRate: base.nominalInterestRate,
      termYears: base.termYears,
    });
    monthlyDebtService = annuity.monthlyDebtService.value;
    annualDebtService = annuity.annualDebtService.value;
  }

  const annualCashFlow = noi.sub(annualDebtService).roundForDisplay();
  const monthlyCashFlow = Money.fromMajor(
    annualCashFlow.major.div(12),
    currency,
  ).roundForDisplay();

  const dscr = calculateDscr({
    noi,
    annualDebtService,
  }).value;

  const equityRequired = calculateEquityRequired({
    totalAcquisitionCost: base.totalAcquisitionCost,
    loanPrincipal: base.loanPrincipal ?? null,
  }).value;

  const ltv =
    base.loanPrincipal != null && !base.totalAcquisitionCost.isZero()
      ? calculateLtv({
          loanPrincipal: base.loanPrincipal,
          propertyValue: base.totalAcquisitionCost,
        }).value
      : null;

  return {
    noi,
    annualDebtService,
    monthlyDebtService,
    annualCashFlow,
    monthlyCashFlow,
    dscr,
    equityRequired,
    ltv,
  };
}

export function shiftNominalRateByPercentagePoints(
  rate: NominalInterestRate,
  deltaPp: number,
): NominalInterestRate {
  const next = rate
    .toRatio()
    .plus(Percentage.fromPercentPoints(deltaPp).toRatio());
  if (next.lt(0)) {
    return nominalInterestRateFromRatio(0);
  }
  return nominalInterestRateFromRatio(next);
}
