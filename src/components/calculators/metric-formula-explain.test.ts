import { describe, expect, it } from "vitest";

import { getFormula } from "@/domains/investment/engine";

describe("metric formula registry for UI explainability", () => {
  it("exposes net_yield formula text for CalculatorShell tooltips", () => {
    const f = getFormula("net_yield");
    expect(f).toBeDefined();
    expect(f!.formulaText).toMatch(/NOI/);
    expect(f!.formulaText).toMatch(/pořizovací/i);
  });
});
