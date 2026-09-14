/**
 * Build RiskBaseCase from calculator inputs for canonical scenario derivation.
 */

import {
  Money,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import type { RiskBaseCase } from "../engine";
import type { InvestmentCalculatorInputs } from "./calculator-inputs";
import { resolveLoanAmount } from "./input-mapping";

export function buildRiskBaseCaseFromInputs(
  inputs: InvestmentCalculatorInputs,
): RiskBaseCase | null {
  if (inputs.purchasePrice == null || !Number.isFinite(inputs.purchasePrice)) {
    return null;
  }
  if (inputs.monthlyRent == null || !Number.isFinite(inputs.monthlyRent)) {
    return null;
  }
  if (inputs.annualOpex == null || !Number.isFinite(inputs.annualOpex)) {
    return null;
  }

  const currency = "CZK" as const;
  let tac = Money.fromMajor(inputs.purchasePrice, currency);
  for (const line of [
    inputs.acquisitionCosts,
    inputs.renovation,
    inputs.initialFurnishing,
    inputs.fees,
  ]) {
    if (line != null && Number.isFinite(line)) {
      tac = tac.add(Money.fromMajor(line, currency));
    }
  }
  tac = tac.roundForDisplay();

  const pgi = Money.fromMajor(inputs.monthlyRent, currency)
    .mul(12)
    .roundForDisplay();
  const vacancy =
    inputs.vacancyPp != null && Number.isFinite(inputs.vacancyPp)
      ? inputs.vacancyPp / 100
      : 0;
  const egi = pgi.mul(1 - vacancy).roundForDisplay();
  const opex = Money.fromMajor(inputs.annualOpex, currency).roundForDisplay();

  const loan = resolveLoanAmount(inputs);
  const loanPrincipal =
    loan != null && loan > 0 ? Money.fromMajor(loan, currency) : null;

  return {
    totalAcquisitionCost: tac,
    annualEgi: egi,
    potentialGrossIncome: pgi,
    annualOpex: opex,
    loanPrincipal,
    nominalInterestRate:
      inputs.interestRatePp != null && loanPrincipal != null
        ? nominalInterestRateFromPercentPoints(inputs.interestRatePp)
        : null,
    termYears:
      loanPrincipal != null ? (inputs.termYears ?? 30) : null,
  };
}
