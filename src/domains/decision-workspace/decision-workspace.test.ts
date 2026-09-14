import { describe, expect, it } from "vitest";

import { suggestDecisionTasks } from "./tasks/checklist-defaults";
import {
  computeDecisionMatch,
  applyManualPropertyOrder,
} from "./matrix/decision-match";
import {
  prioritiesFromPassport,
  DEFAULT_DECISION_PRIORITIES,
} from "./matrix/priorities";
import { sanitizeNoteTags } from "./notes/tags";
import type { ComparisonPropertyColumn } from "@/domains/comparisons/types";
import type { PassportState } from "@/lib/financial-passport/types";
import { emptyPassportState } from "@/lib/financial-passport/types";

function col(
  id: string,
  cells: ComparisonPropertyColumn["cells"],
): ComparisonPropertyColumn {
  return {
    propertyId: id,
    slug: id,
    title: id,
    href: `/${id}`,
    imageUrl: null,
    isDemo: true,
    order: 0,
    cells,
    highlights: {},
    passportFinancing: null,
    expandDetails: {},
  };
}

describe("Decision Workspace", () => {
  it("sanitizes note tags to allowlist only", () => {
    expect(sanitizeNoteTags(["prohlidka", "hack", "svj"])).toEqual([
      "prohlidka",
      "svj",
    ]);
  });

  it("suggests technical inspection for high renovation risk", () => {
    const suggestions = suggestDecisionTasks({
      propertyType: "APARTMENT",
      condition: "NEEDS_RENOVATION",
      risk: "high",
      tags: ["Rekonstrukce"],
      hasRenovationEstimate: true,
    });
    expect(suggestions.some((s) => s.type === "TECHNICAL_INSPECTION")).toBe(
      true,
    );
    expect(suggestions.some((s) => s.type === "SVJ")).toBe(true);
    expect(suggestions.some((s) => s.type === "RENOVATION_QUOTE")).toBe(true);
  });

  it("prefills investment priorities from passport", () => {
    const state: PassportState = {
      ...emptyPassportState(),
      goal: "INVESTMENT",
      strategies: ["dlouhodoby-pronajem"],
      financingMode: "MORTGAGE",
    };
    const p = prioritiesFromPassport(state);
    expect(p.yield).toBe("HIGH");
    expect(p.cashFlow).toBe("HIGH");
    expect(p.financing).toBe("HIGH");
  });

  it("computes explainable decision match and respects manual order", () => {
    const properties = [
      col("a", {
        asking_price: { kind: "number", value: 5_000_000, unit: "czk" },
        cash_flow_monthly: { kind: "number", value: 1000, unit: "czk" },
        gross_yield_pct: { kind: "number", value: 3, unit: "pct" },
      }),
      col("b", {
        asking_price: { kind: "number", value: 8_000_000, unit: "czk" },
        cash_flow_monthly: { kind: "number", value: 5000, unit: "czk" },
        gross_yield_pct: { kind: "number", value: 7, unit: "pct" },
      }),
    ];
    const matches = computeDecisionMatch({
      properties,
      priorities: {
        ...DEFAULT_DECISION_PRIORITIES,
        cashFlow: "HIGH",
        yield: "HIGH",
        price: "LOW",
      },
    });
    expect(matches).toHaveLength(2);
    const best = [...matches].sort(
      (x, y) => (y.matchScore ?? 0) - (x.matchScore ?? 0),
    )[0]!;
    expect(best.propertyId).toBe("b");
    expect(best.breakdown.some((b) => b.label.includes("cash flow"))).toBe(
      true,
    );

    const manual = applyManualPropertyOrder(properties, ["a", "b"]);
    expect(manual.map((m) => m.propertyId)).toEqual(["a", "b"]);
    // Automation must not invent order when manual is set
    const locked = applyManualPropertyOrder(properties, ["a", "b"]);
    expect(locked[0]!.propertyId).toBe("a");
  });
});
