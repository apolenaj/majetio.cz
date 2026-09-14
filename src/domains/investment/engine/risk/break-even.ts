/**
 * Break-even occupancy, interest rate, and purchase price (pure).
 */

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import { bindFormula, type FormulaBound } from "../calculations/helpers";
import {
  evaluateYear1Metrics,
  type RiskBaseCase,
} from "./base-case";

export type BreakEvenOccupancyResult = FormulaBound<Percentage | null> & {
  reason: string | null;
};

/**
 * BE occupancy such that PGI × occ − opex − ADS ≈ 0
 * ⇒ occ = (opex + ADS) / PGI
 */
export function calculateBreakEvenOccupancy(
  base: RiskBaseCase,
): BreakEvenOccupancyResult {
  const pgi = base.potentialGrossIncome;
  if (pgi == null || pgi.isZero()) {
    return {
      ...bindFormula("break_even_occupancy", null),
      reason: "Chybí PGI (potentialGrossIncome) pro break-even obsazenost",
    };
  }
  const metrics = evaluateYear1Metrics(base);
  const need = base.annualOpex.add(metrics.annualDebtService);
  const occ = need.major.div(pgi.major);
  if (occ.lt(0)) {
    return {
      ...bindFormula("break_even_occupancy", Percentage.fromRatio(0)),
      reason: null,
    };
  }
  if (occ.gt(1)) {
    return {
      ...bindFormula("break_even_occupancy", Percentage.fromRatio(occ)),
      reason:
        "Break-even obsazenost > 100 % — při plné obsazenosti CF stále nestačí",
    };
  }
  return {
    ...bindFormula("break_even_occupancy", Percentage.fromRatio(occ)),
    reason: null,
  };
}

export type BreakEvenInterestResult = FormulaBound<Percentage | null> & {
  reason: string | null;
};

/**
 * Binary search nominal rate where annual CF ≈ 0 (NOI fixed).
 */
export function calculateBreakEvenInterestRate(
  base: RiskBaseCase,
): BreakEvenInterestResult {
  if (
    base.loanPrincipal == null ||
    base.loanPrincipal.isZero() ||
    base.termYears == null
  ) {
    return {
      ...bindFormula("break_even_interest_rate", null),
      reason: "Break-even sazba vyžaduje úvěr (jistina + splatnost)",
    };
  }

  const atZero = evaluateYear1Metrics({
    ...base,
    nominalInterestRate: nominalInterestRateFromPercentPoints(0),
  });
  if (atZero.annualCashFlow.isNegative()) {
    return {
      ...bindFormula("break_even_interest_rate", null),
      reason: "I při 0% sazbě je CF záporné — break-even sazba neexistuje",
    };
  }

  let lo = 0;
  let hi = 40;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const m = evaluateYear1Metrics({
      ...base,
      nominalInterestRate: nominalInterestRateFromPercentPoints(mid),
    });
    if (m.annualCashFlow.isNegative()) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const atHi = evaluateYear1Metrics({
    ...base,
    nominalInterestRate: nominalInterestRateFromPercentPoints(hi),
  });
  if (!atHi.annualCashFlow.isNegative() && atHi.annualCashFlow.isPositive()) {
    return {
      ...bindFormula(
        "break_even_interest_rate",
        Percentage.fromPercentPoints(hi),
      ),
      reason: "CF zůstává nezáporné v horním limitu hledání (40 %)",
    };
  }

  return {
    ...bindFormula(
      "break_even_interest_rate",
      Percentage.fromPercentPoints(lo),
    ),
    reason: null,
  };
}

export type BreakEvenPurchasePriceResult = FormulaBound<Money | null> & {
  reason: string | null;
};

/**
 * Max TAC for target net yield: TAC = NOI / targetNetYield (ratio).
 */
export function calculateBreakEvenPurchasePrice(input: {
  base: RiskBaseCase;
  targetNetYield: Percentage;
}): BreakEvenPurchasePriceResult {
  if (
    input.targetNetYield.isZero() ||
    input.targetNetYield.toRatio().lte(0)
  ) {
    return {
      ...bindFormula("break_even_purchase_price", null),
      reason: "Cílový výnos musí být > 0",
    };
  }
  const metrics = evaluateYear1Metrics(input.base);
  if (!metrics.noi.isPositive()) {
    return {
      ...bindFormula("break_even_purchase_price", null),
      reason: "NOI musí být kladné pro break-even cenu",
    };
  }
  const price = Money.fromMajor(
    metrics.noi.major.div(input.targetNetYield.toRatio()),
    input.base.totalAcquisitionCost.currency,
  ).roundForDisplay();

  return {
    ...bindFormula("break_even_purchase_price", price),
    reason: null,
  };
}
