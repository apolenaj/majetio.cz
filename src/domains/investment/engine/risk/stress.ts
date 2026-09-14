/**
 * Named stress shocks on a risk base case (pure).
 */

import { bindFormula } from "../calculations/helpers";
import {
  evaluateYear1Metrics,
  shiftNominalRateByPercentagePoints,
  type RiskBaseCase,
  type Year1OperatingMetrics,
} from "./base-case";

export const STRESS_SHOCK_IDS = [
  "interest_plus_2pp",
  "rent_minus_10pct",
  "opex_plus_15pct",
  "combined_shock",
] as const;

export type StressShockId = (typeof STRESS_SHOCK_IDS)[number];

export type StressShockResult = {
  id: StressShockId;
  label: string;
  metrics: Year1OperatingMetrics;
};

export type StressTestSuiteResult = {
  formulaKey: "stress_test";
  formulaVersion: string;
  base: Year1OperatingMetrics;
  shocks: StressShockResult[];
};

function applyStress(base: RiskBaseCase, id: StressShockId): RiskBaseCase {
  switch (id) {
    case "interest_plus_2pp":
      if (base.nominalInterestRate == null) return base;
      return {
        ...base,
        nominalInterestRate: shiftNominalRateByPercentagePoints(
          base.nominalInterestRate,
          2,
        ),
      };
    case "rent_minus_10pct":
      return {
        ...base,
        annualEgi: base.annualEgi.mul(0.9).roundForDisplay(),
        potentialGrossIncome:
          base.potentialGrossIncome != null
            ? base.potentialGrossIncome.mul(0.9).roundForDisplay()
            : null,
      };
    case "opex_plus_15pct":
      return {
        ...base,
        annualOpex: base.annualOpex.mul(1.15).roundForDisplay(),
      };
    case "combined_shock":
      return applyStress(
        applyStress(applyStress(base, "interest_plus_2pp"), "rent_minus_10pct"),
        "opex_plus_15pct",
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

const LABELS: Record<StressShockId, string> = {
  interest_plus_2pp: "Úrokový šok +2 p.b.",
  rent_minus_10pct: "Propad nájmu −10 %",
  opex_plus_15pct: "Nárůst provozních nákladů +15 %",
  combined_shock: "Kombinovaný šok (úrok + nájem + opex)",
};

export function runStressTests(base: RiskBaseCase): StressTestSuiteResult {
  const bound = bindFormula("stress_test", null);
  return {
    formulaKey: "stress_test",
    formulaVersion: bound.formulaVersion,
    base: evaluateYear1Metrics(base),
    shocks: STRESS_SHOCK_IDS.map((id) => ({
      id,
      label: LABELS[id],
      metrics: evaluateYear1Metrics(applyStress(base, id)),
    })),
  };
}
