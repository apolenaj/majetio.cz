import { describe, expect, it } from "vitest";

import { DEFAULT_CALCULATOR_INPUTS } from "./calculator-inputs";
import {
  isFieldModified,
  listModifiedFields,
  MAJETIO_BASELINE,
  resetInputsToBaseline,
} from "./assumption-baseline";
import { buildCashFlowBreakdownView } from "./chart-view-models";
import { buildStrategyMetricDisplays } from "./strategy-metrics";
import {
  buildAssumptionSetFromInputs,
  buildEphemeralSnapshot,
} from "./input-mapping";
import { hashCalculationInput } from "../service/hash";
import { runInvestmentCalculationPure } from "../service/run-calculation";
import { buildProjectionChartView } from "./chart-view-models";

describe("assumption overrides", () => {
  it("detects modified rent vs Majetio baseline", () => {
    const current = {
      ...DEFAULT_CALCULATOR_INPUTS,
      monthlyRent: 26_000,
    };
    expect(isFieldModified("monthlyRent", current)).toBe(true);
    expect(listModifiedFields(current)).toContain("monthlyRent");
    const reset = resetInputsToBaseline(current);
    expect(reset.monthlyRent).toBe(MAJETIO_BASELINE.monthlyRent);
  });
});

describe("strategy metrics & CF callout", () => {
  it("prioritizes long-term metrics and explains negative CF", () => {
    const inputs = {
      ...DEFAULT_CALCULATOR_INPUTS,
      strategy: "long_term_rental" as const,
      monthlyRent: 12_000,
      annualOpex: 100_000,
      equity: 1_000_000,
    };
    const snapshot = buildEphemeralSnapshot(inputs);
    const assumptions = buildAssumptionSetFromInputs(inputs);
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });
    const result = runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      inputHash: hash,
    });
    const projection = buildProjectionChartView(inputs);
    const metrics = buildStrategyMetricDisplays({
      strategy: "long_term_rental",
      result,
      inputs,
      projection,
    });
    expect(metrics.map((m) => m.label).join("|")).toMatch(/Čistý výnos/);
    expect(metrics.length).toBeLessThanOrEqual(5);

    const cf = buildCashFlowBreakdownView(result, inputs);
    if (cf.cashFlowMonthly != null && cf.cashFlowMonthly < 0) {
      expect(cf.callout.tone).toBe("negative");
      expect(cf.callout.detail).toMatch(/doplácet/i);
    }
  });

  it("uses owner-occupier metric set", () => {
    const inputs = {
      ...DEFAULT_CALCULATOR_INPUTS,
      strategy: "owner_occupier" as const,
    };
    const snapshot = buildEphemeralSnapshot(inputs);
    const assumptions = buildAssumptionSetFromInputs(inputs);
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });
    const result = runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      inputHash: hash,
    });
    const metrics = buildStrategyMetricDisplays({
      strategy: "owner_occupier",
      result,
      inputs,
      projection: null,
    });
    expect(metrics.some((m) => /náklad/i.test(m.label))).toBe(true);
  });
});
