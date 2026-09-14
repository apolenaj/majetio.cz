import { describe, expect, it } from "vitest";

import { comparisonConfig } from "@/config/comparison";
import { applyHighlights } from "./service/highlights";
import { computePassportFinancing } from "./service/passport-financing";
import { buildComparisonWarnings } from "./service/warnings";
import { buildComparisonViewModel } from "./service/build-view-model";
import { COMPARISON_UNAVAILABLE } from "./types";
import type { ComparisonPropertyColumn } from "./types";

describe("Comparison Engine", () => {
  it("centralizes max 4 properties in config", () => {
    expect(comparisonConfig.maxProperties).toBe(4);
  });

  it("highlights lower price as best and higher yield as best", () => {
    const cols: ComparisonPropertyColumn[] = [
      {
        propertyId: "a",
        slug: "a",
        title: "A",
        href: "/a",
        imageUrl: null,
        isDemo: true,
        order: 0,
        cells: {
          asking_price: { kind: "number", value: 5_000_000, unit: "czk" },
          gross_yield_pct: { kind: "number", value: 3, unit: "pct" },
        },
        highlights: {},
        expandDetails: {},
        passportFinancing: null,
      },
      {
        propertyId: "b",
        slug: "b",
        title: "B",
        href: "/b",
        imageUrl: null,
        isDemo: true,
        order: 1,
        cells: {
          asking_price: { kind: "number", value: 7_000_000, unit: "czk" },
          gross_yield_pct: { kind: "number", value: 6, unit: "pct" },
        },
        highlights: {},
        expandDetails: {},
        passportFinancing: null,
      },
    ];

    const next = applyHighlights(cols, ["asking_price", "gross_yield_pct"]);
    expect(next[0]!.highlights.asking_price).toBe("best");
    expect(next[1]!.highlights.asking_price).toBe("worst");
    expect(next[1]!.highlights.gross_yield_pct).toBe("best");
    expect(next[0]!.highlights.gross_yield_pct).toBe("worst");
  });

  it("never treats missing as zero for passport financing", () => {
    const missing = computePassportFinancing({
      askingPriceCzk: null,
      availableEquityCzk: 1_000_000,
      equityPercent: null,
    });
    expect(missing.ltvPct).toBeNull();
    expect(missing.monthlyPaymentCzk).toBeNull();
  });

  it("computes LTV from passport equity", () => {
    const result = computePassportFinancing({
      askingPriceCzk: 10_000_000,
      availableEquityCzk: 2_000_000,
      equityPercent: null,
    });
    expect(result.usedPassport).toBe(true);
    expect(result.ltvPct).toBe(80);
    expect(result.loanPrincipalCzk).toBe(8_000_000);
    expect(result.monthlyPaymentCzk).not.toBeNull();
    expect(result.monthlyPaymentCzk).toBeGreaterThan(0);
  });

  it("warns on apartment vs house comparison", () => {
    const warnings = buildComparisonWarnings([
      {
        propertyId: "1",
        title: "Byt",
        propertyType: "APARTMENT",
        strategyTags: ["Pronájem"],
        valuationConfidence: "high",
      },
      {
        propertyId: "2",
        title: "Dům",
        propertyType: "HOUSE",
        strategyTags: ["Pronájem"],
        valuationConfidence: "low",
      },
    ]);
    expect(warnings.some((w) => w.id === "apple-orange-type")).toBe(true);
    expect(warnings.some((w) => w.id === "valuation-confidence-spread")).toBe(
      true,
    );
  });

  it("builds view model with unavailable label and demo metrics", () => {
    const view = buildComparisonViewModel({
      mode: "investment",
      properties: [
        { propertyId: "demo-apt-vinohrady", slug: "demo-byt-3kk-vinohrady", order: 0 },
        { propertyId: "demo-apt-brno", slug: "demo-byt-2kk-brno", order: 1 },
      ],
    });
    expect(view.unavailableLabel).toBe(COMPARISON_UNAVAILABLE);
    expect(view.properties.length).toBe(2);
    expect(view.summary.length).toBeGreaterThan(0);
    expect(view.orderedMetricKeys[0]).toBeDefined();
    // Missing match score → unavailable, not 0
    const match = view.properties[0]!.cells.match_score;
    expect(match?.kind).toBe("missing");
  });
});
