/**
 * IRR, equity multiple, payback over equity cash-flow series (pure).
 * CF[0] is typically −equity; subsequent entries are annual inflows (incl. exit).
 */

import { Decimal } from "decimal.js";

import { type Money, Percentage, toDecimal } from "@/domains/finance";

import { bindFormula, type FormulaBound } from "./helpers";

export type EquityCashFlowSeries = {
  /** Indexed by period t = 0..N (years). */
  flows: Money[];
};

function majors(flows: Money[]): Decimal[] {
  if (flows.length === 0) throw new Error("cash flow series is empty");
  const currency = flows[0]!.currency;
  for (const f of flows) {
    if (f.currency !== currency) {
      throw new Error("cash flow currency mismatch");
    }
  }
  return flows.map((f) => f.major);
}

function npv(rate: Decimal, cashFlows: Decimal[]): Decimal {
  let total = new Decimal(0);
  for (let t = 0; t < cashFlows.length; t++) {
    const denom = rate.plus(1).pow(t);
    if (denom.isZero()) return new Decimal(NaN);
    total = total.plus(cashFlows[t]!.div(denom));
  }
  return total;
}

function npvDerivative(rate: Decimal, cashFlows: Decimal[]): Decimal {
  let total = new Decimal(0);
  for (let t = 1; t < cashFlows.length; t++) {
    const denom = rate.plus(1).pow(t + 1);
    total = total.minus(cashFlows[t]!.mul(t).div(denom));
  }
  return total;
}

/** Count sign changes between consecutive non-zero cash flows (Descartes). */
export function countCashFlowSignChanges(cashFlows: Decimal[]): number {
  let changes = 0;
  let lastSign: -1 | 1 | null = null;
  for (const c of cashFlows) {
    if (c.isZero()) continue;
    const sign: -1 | 1 = c.gt(0) ? 1 : -1;
    if (lastSign !== null && sign !== lastSign) changes += 1;
    lastSign = sign;
  }
  return changes;
}

function hasSignChange(cashFlows: Decimal[]): boolean {
  return countCashFlowSignChanges(cashFlows) >= 1;
}

export type IrrResult = FormulaBound<Percentage | null> & {
  converged: boolean;
  reason: string | null;
  iterations: number;
  /** True when CF has ≥2 sign changes → multiple real IRRs possible. */
  multipleRootsPossible: boolean;
  signChangeCount: number;
};

/**
 * Solve IRR with Newton–Raphson, bisection fallback.
 * Returns null when series cannot yield a real IRR.
 * Multiple sign changes → `multipleRootsPossible` (Part 2/C warning).
 */
export function calculateIrr(
  series: EquityCashFlowSeries,
  options?: { maxIterations?: number; tolerance?: number },
): IrrResult {
  const cashFlows = majors(series.flows);
  const maxIterations = options?.maxIterations ?? 100;
  const tolerance = toDecimal(options?.tolerance ?? 1e-9);
  const signChangeCount = countCashFlowSignChanges(cashFlows);
  const multipleRootsPossible = signChangeCount >= 2;

  if (!hasSignChange(cashFlows)) {
    return {
      ...bindFormula("irr", null),
      converged: false,
      reason: "Cash flow řada nemá změnu znaménka — IRR neexistuje",
      iterations: 0,
      multipleRootsPossible: false,
      signChangeCount,
    };
  }

  // Newton–Raphson
  let rate = toDecimal(0.1);
  let iterations = 0;
  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;
    const f = npv(rate, cashFlows);
    const fPrime = npvDerivative(rate, cashFlows);
    if (!f.isFinite() || !fPrime.isFinite() || fPrime.abs().lt(1e-14)) break;
    const next = rate.minus(f.div(fPrime));
    if (next.lte(-0.999999)) break;
    if (next.minus(rate).abs().lt(tolerance) && f.abs().lt(tolerance.mul(1000))) {
      return {
        ...bindFormula("irr", Percentage.fromRatio(next)),
        converged: true,
        reason: multipleRootsPossible
          ? "Více změn znamének v CF — vrácen jeden kořen; interpretujte opatrně"
          : null,
        iterations,
        multipleRootsPossible,
        signChangeCount,
      };
    }
    rate = next;
  }

  // Bisection on (-0.99, 10)
  let lo = toDecimal(-0.99);
  let hi = toDecimal(10);
  if (npv(lo, cashFlows).mul(npv(hi, cashFlows)).gt(0)) {
    return {
      ...bindFormula("irr", null),
      converged: false,
      reason: "IRR nekonvergoval (Newton i bisekce — stejné znaménko NPV na krajích)",
      iterations,
      multipleRootsPossible,
      signChangeCount,
    };
  }

  for (let i = 0; i < maxIterations; i++) {
    iterations += 1;
    const mid = lo.plus(hi).div(2);
    const fmid = npv(mid, cashFlows);
    if (fmid.abs().lt(tolerance) || hi.minus(lo).lt(tolerance)) {
      return {
        ...bindFormula("irr", Percentage.fromRatio(mid)),
        converged: true,
        reason: multipleRootsPossible
          ? "Více změn znamének v CF — vrácen jeden kořen; interpretujte opatrně"
          : null,
        iterations,
        multipleRootsPossible,
        signChangeCount,
      };
    }
    if (npv(lo, cashFlows).mul(fmid).lt(0)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return {
    ...bindFormula("irr", null),
    converged: false,
    reason: "IRR nekonvergoval v limitu iterací",
    iterations,
    multipleRootsPossible,
    signChangeCount,
  };
}

export type EquityMultipleResult = FormulaBound<number | null> & {
  reason: string | null;
};

/**
 * Equity Multiple = sum(positive inflows after t=0, or all CF_t for t>0) / |CF_0|
 * Using total distributions = sum of CF_t for t >= 1 (may include exit).
 */
export function calculateEquityMultiple(
  series: EquityCashFlowSeries,
): EquityMultipleResult {
  const cashFlows = majors(series.flows);
  const initial = cashFlows[0]!;
  if (initial.isZero()) {
    return {
      ...bindFormula("equity_multiple", null),
      reason: "Počáteční equity CF je 0",
    };
  }
  let distributions = new Decimal(0);
  for (let t = 1; t < cashFlows.length; t++) {
    distributions = distributions.plus(cashFlows[t]!);
  }
  const multiple = distributions.div(initial.abs()).toDecimalPlaces(6).toNumber();
  return {
    ...bindFormula("equity_multiple", multiple),
    reason: null,
  };
}

export type PaybackResult = FormulaBound<number | null> & {
  reason: string | null;
};

/**
 * Undiscounted payback in years (fractional via linear interpolation).
 * Returns null if cumulative never recovers.
 */
export function calculatePaybackPeriod(
  series: EquityCashFlowSeries,
): PaybackResult {
  const cashFlows = majors(series.flows);
  let cumulative = new Decimal(0);
  for (let t = 0; t < cashFlows.length; t++) {
    const prev = cumulative;
    cumulative = cumulative.plus(cashFlows[t]!);
    if (cumulative.gte(0) && t > 0) {
      // crossed in this period
      if (prev.gte(0)) {
        return {
          ...bindFormula("payback_period", t === 0 ? 0 : t - 1),
          reason: null,
        };
      }
      const need = prev.abs();
      const step = cashFlows[t]!;
      if (step.isZero()) {
        return {
          ...bindFormula("payback_period", t),
          reason: null,
        };
      }
      const frac = need.div(step).toNumber();
      const years = t - 1 + frac;
      return {
        ...bindFormula("payback_period", Math.round(years * 1000) / 1000),
        reason: null,
      };
    }
    if (cumulative.gte(0) && t === 0) {
      return {
        ...bindFormula("payback_period", 0),
        reason: null,
      };
    }
  }
  return {
    ...bindFormula("payback_period", null),
    reason: "Kumulativní CF se ve horizontu nevrátí do kladu",
  };
}

/** Build series: [-equity, ...annualWithExit] */
export function buildEquityCashFlowSeries(
  equityOutlay: Money,
  annualWithExit: Money[],
): EquityCashFlowSeries {
  return {
    flows: [equityOutlay.neg().roundForDisplay(), ...annualWithExit],
  };
}
