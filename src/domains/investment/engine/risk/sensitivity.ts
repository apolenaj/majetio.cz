/**
 * 1-way and 2-way sensitivity grids (pure).
 */

import { bindFormula } from "../calculations/helpers";
import {
  evaluateYear1Metrics,
  shiftNominalRateByPercentagePoints,
  type RiskBaseCase,
  type Year1OperatingMetrics,
} from "./base-case";

export type SensitivityFactor = "interest_rate_pp" | "egi" | "opex";

export type SensitivityMetricKey =
  | "annualCashFlow"
  | "monthlyCashFlow"
  | "noi"
  | "dscr";

export type OneWaySensitivityStep = {
  /** Shock label, e.g. interest Δ in pp or relative factor. */
  shock: number;
  metrics: Year1OperatingMetrics;
};

export type OneWaySensitivityResult = {
  formulaKey: "sensitivity_1way";
  formulaVersion: string;
  factor: SensitivityFactor;
  metricFocus: SensitivityMetricKey;
  steps: OneWaySensitivityStep[];
};

function applyFactorShock(
  base: RiskBaseCase,
  factor: SensitivityFactor,
  shock: number,
): RiskBaseCase {
  if (factor === "interest_rate_pp") {
    if (base.nominalInterestRate == null) {
      throw new Error("interest sensitivity requires nominalInterestRate");
    }
    return {
      ...base,
      nominalInterestRate: shiftNominalRateByPercentagePoints(
        base.nominalInterestRate,
        shock,
      ),
    };
  }
  if (factor === "egi") {
    const factorMul = 1 + shock;
    if (factorMul <= 0) {
      throw new Error("egi shock would make income non-positive");
    }
    return {
      ...base,
      annualEgi: base.annualEgi.mul(factorMul).roundForDisplay(),
      potentialGrossIncome:
        base.potentialGrossIncome != null
          ? base.potentialGrossIncome.mul(factorMul).roundForDisplay()
          : null,
    };
  }
  const factorMul = 1 + shock;
  if (factorMul < 0) throw new Error("opex shock invalid");
  return {
    ...base,
    annualOpex: base.annualOpex.mul(factorMul).roundForDisplay(),
  };
}

/**
 * 1-way sensitivity: vary one factor across `shocks`.
 * - interest_rate_pp: absolute pp deltas (e.g. [-1,0,1,2])
 * - egi / opex: relative deltas (e.g. [-0.1,0,0.1])
 */
export function runOneWaySensitivity(input: {
  base: RiskBaseCase;
  factor: SensitivityFactor;
  shocks: number[];
  metricFocus?: SensitivityMetricKey;
}): OneWaySensitivityResult {
  const bound = bindFormula("sensitivity_1way", null);
  const steps = input.shocks.map((shock) => ({
    shock,
    metrics: evaluateYear1Metrics(
      applyFactorShock(input.base, input.factor, shock),
    ),
  }));
  return {
    formulaKey: "sensitivity_1way",
    formulaVersion: bound.formulaVersion,
    factor: input.factor,
    metricFocus: input.metricFocus ?? "annualCashFlow",
    steps,
  };
}

export type TwoWaySensitivityCell = {
  shockA: number;
  shockB: number;
  annualCashFlowMajor: number;
  noiMajor: number;
  dscr: number | null;
};

export type TwoWaySensitivityResult = {
  formulaKey: "sensitivity_2way";
  formulaVersion: string;
  factorA: SensitivityFactor;
  factorB: SensitivityFactor;
  shocksA: number[];
  shocksB: number[];
  grid: TwoWaySensitivityCell[];
};

/**
 * 2-way sensitivity grid (e.g. interest_rate_pp × egi).
 */
export function runTwoWaySensitivity(input: {
  base: RiskBaseCase;
  factorA: SensitivityFactor;
  factorB: SensitivityFactor;
  shocksA: number[];
  shocksB: number[];
}): TwoWaySensitivityResult {
  if (input.factorA === input.factorB) {
    throw new Error("2-way sensitivity requires two distinct factors");
  }
  const bound = bindFormula("sensitivity_2way", null);
  const grid: TwoWaySensitivityCell[] = [];

  for (const shockA of input.shocksA) {
    for (const shockB of input.shocksB) {
      const shocked = applyFactorShock(
        applyFactorShock(input.base, input.factorA, shockA),
        input.factorB,
        shockB,
      );
      const m = evaluateYear1Metrics(shocked);
      grid.push({
        shockA,
        shockB,
        annualCashFlowMajor: m.annualCashFlow.toMajorNumber(),
        noiMajor: m.noi.toMajorNumber(),
        dscr: m.dscr,
      });
    }
  }

  return {
    formulaKey: "sensitivity_2way",
    formulaVersion: bound.formulaVersion,
    factorA: input.factorA,
    factorB: input.factorB,
    shocksA: input.shocksA,
    shocksB: input.shocksB,
    grid,
  };
}
