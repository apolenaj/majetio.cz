import { describe, expect, it } from "vitest";

import { deriveCanonicalScenarios, getFormula } from "@/domains/investment/engine";
import { hashCalculationInput } from "@/domains/investment/service/hash";
import { runInvestmentCalculationPure } from "@/domains/investment/service/run-calculation";

import { DEFAULT_CALCULATOR_INPUTS } from "./calculator-inputs";
import {
  buildAssumptionSetFromInputs,
  buildEphemeralSnapshot,
  resolveLoanAmount,
} from "./input-mapping";
import { buildRiskBaseCaseFromInputs } from "./risk-base-from-inputs";
import {
  UNAVAILABLE_LABEL,
  acquisitionBreakdownFromResult,
  buildScenarioComparisonView,
  formatSubstitutionLines,
  metricDisplayFromResult,
} from "./scenario-view-model";

describe("calculator input mapping", () => {
  it("derives loan from purchase − equity", () => {
    expect(
      resolveLoanAmount({
        ...DEFAULT_CALCULATOR_INPUTS,
        purchasePrice: 6_000_000,
        equity: 2_000_000,
        loanAmount: null,
      }),
    ).toBe(4_000_000);
  });

  it("builds assumption set without inventing zero rent", () => {
    const set = buildAssumptionSetFromInputs({
      ...DEFAULT_CALCULATOR_INPUTS,
      monthlyRent: null,
      annualOpex: null,
    });
    expect(set.monthlyRent).toBeNull();
    expect(set.annualOperatingCosts).toBeNull();
    expect(set.purchasePrice).not.toBeNull();
  });
});

describe("scenario view-model", () => {
  it("marks missing NOI as Neuvedeno and keeps formula explain text", () => {
    const inputs = {
      ...DEFAULT_CALCULATOR_INPUTS,
      monthlyRent: null,
      annualOpex: null,
      repairFundAnnual: null,
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

    const noi = metricDisplayFromResult(result, "noi");
    expect(noi.available).toBe(false);
    expect(noi.displayValue).toBe(UNAVAILABLE_LABEL);

    const net = getFormula("net_yield");
    expect(net?.formulaText).toMatch(/NOI/i);
    expect(formatSubstitutionLines(result, "net_yield").length).toBeGreaterThan(0);
  });

  it("orders conservative / realistický / optimistic columns", () => {
    const base = buildRiskBaseCaseFromInputs(DEFAULT_CALCULATOR_INPUTS);
    expect(base).not.toBeNull();
    const triplet = deriveCanonicalScenarios({ base: base! });
    const view = buildScenarioComparisonView(triplet.year1);
    expect(view.columns.map((c) => c.key)).toEqual([
      "conservative",
      "base",
      "optimistic",
    ]);
    expect(view.columns[0]!.label).toBe("Konzervativní");
    expect(view.columns[1]!.label).toBe("Realistický");
  });

  it("builds TAC breakdown only from included lines", () => {
    const snapshot = buildEphemeralSnapshot(DEFAULT_CALCULATOR_INPUTS);
    const assumptions = buildAssumptionSetFromInputs({
      ...DEFAULT_CALCULATOR_INPUTS,
      acquisitionCosts: 150_000,
      repairFundAnnual: 12_000,
    });
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
    const breakdown = acquisitionBreakdownFromResult(result);
    expect(breakdown.total).not.toBeNull();
    expect(breakdown.lines.some((l) => l.key === "purchasePrice")).toBe(true);
    expect(breakdown.lines.some((l) => l.key === "acquisitionCosts")).toBe(true);
  });
});
