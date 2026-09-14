/**
 * Map calculator UI inputs → engine assumption set + synthetic property snapshot.
 */

import { Money, Percentage } from "@/domains/finance";

import { moneyToDto, percentageToDto } from "../engine";
import type { AssumptionSet } from "../service/assumptions";
import type { PropertyInvestmentSnapshot } from "../service/property-snapshot";
import type { InvestmentCalculatorInputs } from "./calculator-inputs";

function majorOrNull(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  return moneyToDto(Money.fromMajor(value, "CZK").roundForDisplay());
}

function ppOrNull(points: number | null | undefined) {
  if (points == null || !Number.isFinite(points)) return null;
  return percentageToDto(Percentage.fromPercentPoints(points));
}

export function resolveLoanAmount(inputs: InvestmentCalculatorInputs): number | null {
  if (inputs.loanAmount != null && Number.isFinite(inputs.loanAmount)) {
    return inputs.loanAmount;
  }
  if (
    inputs.purchasePrice != null &&
    inputs.equity != null &&
    Number.isFinite(inputs.purchasePrice) &&
    Number.isFinite(inputs.equity)
  ) {
    return Math.max(0, inputs.purchasePrice - inputs.equity);
  }
  return null;
}

export function buildAssumptionSetFromInputs(
  inputs: InvestmentCalculatorInputs,
): AssumptionSet {
  const loan = resolveLoanAmount(inputs);
  const set: AssumptionSet = {
    purchasePrice: majorOrNull(inputs.purchasePrice),
    monthlyRent: majorOrNull(inputs.monthlyRent),
    annualOperatingCosts: majorOrNull(inputs.annualOpex),
    vacancyRate: ppOrNull(inputs.vacancyPp),
    loanAmount: majorOrNull(loan),
    nominalInterestRate: ppOrNull(inputs.interestRatePp),
    termYears: inputs.termYears,
    holdYears: inputs.holdYears ?? 10,
    // Advanced lines always map when present (UI mode only hides controls).
    acquisitionCosts: majorOrNull(inputs.acquisitionCosts),
    renovation: majorOrNull(inputs.renovation),
    initialFurnishing: majorOrNull(inputs.initialFurnishing),
    fees: majorOrNull(inputs.fees),
    repairFundAnnual: majorOrNull(inputs.repairFundAnnual),
    appreciationRate: ppOrNull(inputs.appreciationPp),
    rentGrowthRate: ppOrNull(inputs.rentGrowthPp),
  };

  return set;
}

export function buildEphemeralSnapshot(
  inputs: InvestmentCalculatorInputs,
  asOf: Date = new Date(),
): PropertyInvestmentSnapshot {
  const price = majorOrNull(inputs.purchasePrice);
  return {
    propertyId: "calculator-ephemeral",
    slug: null,
    title: "Kalkulačka investičního výnosu",
    propertyType: null,
    city: null,
    currency: "CZK",
    usableAreaSqm: null,
    askingPrice: price,
    purchasePriceHint: price,
    capturedAt: asOf.toISOString(),
  };
}
