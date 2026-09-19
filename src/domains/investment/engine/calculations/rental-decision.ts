/**
 * Deterministický model dlouhodobého pronájmu pro rozhodování.
 * Není to znalecký posudek. Daň z příjmu do výpočtu nevstupuje.
 * Částky jsou v Kč. Zaokrouhlení na haléře je jen pro zobrazení.
 */

import Decimal from "decimal.js";

const MONEY = Decimal.ROUND_HALF_UP;

export type RentalDecisionInput = {
  purchasePrice: Decimal;
  acquisitionCosts: Decimal;
  renovation: Decimal;
  furnishing: Decimal;
  /** Skutečně čerpaný úvěr. Nula znamená koupi bez úvěru, ne chybějící údaj. */
  loanAmount: Decimal;
  /** Nominální roční sazba jako poměr, např. 0,05. U nulového úvěru se nepoužije. */
  annualInterestRate: Decimal;
  termYears: number;
  monthlyNetRent: Decimal;
  /** Podíl roku, po který je nájem placen, např. 0,95. */
  occupancy: Decimal;
  annualOwnerOpex: Decimal;
  annualCapexReserve: Decimal;
};

export type RentalDecisionResult = {
  totalInvestment: Decimal;
  equity: Decimal;
  /** null = bez úvěru */
  monthlyPayment: Decimal | null;
  effectiveAnnualRent: Decimal;
  noi: Decimal;
  cashFlowBeforeReserve: Decimal;
  disposableAnnualCashFlow: Decimal;
  disposableMonthlyCashFlow: Decimal;
  /** null, když je kupní cena nulová */
  grossYieldOnPurchase: Decimal | null;
  /** null, když je celková investice nulová */
  netOperatingYield: Decimal | null;
  /** null, když vlastní prostředky nejsou kladné */
  cashOnCash: Decimal | null;
  /** null = bez úvěru, nezobrazovat nekonečno */
  dscr: Decimal | null;
  /** null, když obsazenost není kladná */
  breakEvenMonthlyRent: Decimal | null;
};

function money(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, MONEY);
}

function ratio(value: Decimal): Decimal {
  return value.toDecimalPlaces(6, MONEY);
}

export function calculateRentalDecision(input: RentalDecisionInput): RentalDecisionResult {
  assertNonNegative(input.purchasePrice, "kupní cena");
  assertNonNegative(input.acquisitionCosts, "pořizovací náklady");
  assertNonNegative(input.renovation, "rekonstrukce");
  assertNonNegative(input.furnishing, "vybavení");
  assertNonNegative(input.loanAmount, "úvěr");
  assertNonNegative(input.monthlyNetRent, "nájemné");
  assertNonNegative(input.annualOwnerOpex, "provozní náklady");
  assertNonNegative(input.annualCapexReserve, "rezerva");
  if (input.occupancy.lt(0) || input.occupancy.gt(1)) {
    throw new Error("obsazenost musí být mezi 0 a 1");
  }
  if (!Number.isFinite(input.termYears) || input.termYears <= 0) {
    throw new Error("splatnost musí být kladná");
  }

  const totalInvestment = money(
    input.purchasePrice.plus(input.acquisitionCosts).plus(input.renovation).plus(input.furnishing),
  );
  const equity = money(totalInvestment.minus(input.loanAmount));
  const exactPayment = input.loanAmount.isZero()
    ? null
    : monthlyAnnuityPayment(input.loanAmount, input.annualInterestRate, input.termYears);
  const monthlyPayment = exactPayment ? money(exactPayment) : null;
  const annualDebt = exactPayment ? money(exactPayment.mul(12)) : new Decimal(0);
  const effectiveAnnualRent = money(input.monthlyNetRent.mul(12).mul(input.occupancy));
  const noi = money(effectiveAnnualRent.minus(input.annualOwnerOpex));
  const cashFlowBeforeReserve = money(noi.minus(annualDebt));
  const disposableAnnualCashFlow = money(cashFlowBeforeReserve.minus(input.annualCapexReserve));
  const disposableMonthlyCashFlow = money(disposableAnnualCashFlow.div(12));

  const grossYieldOnPurchase = input.purchasePrice.isZero()
    ? null
    : ratio(input.monthlyNetRent.mul(12).div(input.purchasePrice));
  const netOperatingYield = totalInvestment.isZero() ? null : ratio(noi.div(totalInvestment));
  const cashOnCash = equity.lte(0) ? null : ratio(disposableAnnualCashFlow.div(equity));
  const dscr = annualDebt.isZero() ? null : ratio(noi.div(annualDebt));

  let breakEvenMonthlyRent: Decimal | null = null;
  if (input.occupancy.gt(0)) {
    const requiredEffective = annualDebt.plus(input.annualCapexReserve).plus(input.annualOwnerOpex);
    breakEvenMonthlyRent = money(requiredEffective.div(input.occupancy).div(12));
  }

  return {
    totalInvestment,
    equity,
    monthlyPayment,
    effectiveAnnualRent,
    noi,
    cashFlowBeforeReserve,
    disposableAnnualCashFlow,
    disposableMonthlyCashFlow,
    grossYieldOnPurchase,
    netOperatingYield,
    cashOnCash,
    dscr,
    breakEvenMonthlyRent,
  };
}

export function monthlyAnnuityPayment(
  principal: Decimal,
  annualRate: Decimal,
  termYears: number,
): Decimal {
  const months = Math.round(termYears * 12);
  if (months <= 0) throw new Error("splatnost musí vyjít alespoň na jeden měsíc");
  if (principal.isZero()) return new Decimal(0);
  if (annualRate.isZero()) return principal.div(months);
  const monthlyRate = annualRate.div(12);
  const growth = monthlyRate.plus(1).pow(months);
  return principal.mul(monthlyRate).mul(growth).div(growth.minus(1));
}

function assertNonNegative(value: Decimal, label: string) {
  if (!value.isFinite() || value.isNegative()) {
    throw new Error(`${label} nesmí být záporná ani nečíselná`);
  }
}
