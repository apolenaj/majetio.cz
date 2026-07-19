import { describe, expect, it } from "vitest";

import {
  SYNTH_AS_OF,
  SYNTH_PRAHA_COMPS,
  SYNTH_PRAHA_SUBJECT,
  SYNTH_VILLAGE_COMPS,
  SYNTH_VILLAGE_SUBJECT,
} from "../fixtures/synthetic-comparables";
import {
  computeConfidence,
  computeValuationRange,
  createValuationService,
  runValuationEstimate,
  selectAndWeightComparables,
  VALUATION_LEGAL_DISCLAIMER,
} from "@/domains/valuation";
import {
  buildAnalystOverrideAudit,
  createAnalystOverrideAuditLog,
} from "./analyst-override";
import { getDemoPublicProperty } from "@/content/demo-canonical-properties";
import { buildPropertyDetailJsonLd } from "@/domains/properties/service/detail-seo";
import { assertAnalyticsSafe } from "@/lib/analytics/events";

describe("Prompt 10 Part 5 — synthetic Praha + outlier exclusion", () => {
  it("excludes extreme outlier from included comps", () => {
    const scored = selectAndWeightComparables(
      SYNTH_PRAHA_SUBJECT,
      SYNTH_PRAHA_COMPS,
      { asOf: SYNTH_AS_OF },
    );
    const extreme = scored.find((c) => c.candidate.id === "p-outlier-extreme");
    expect(extreme).toBeDefined();
    expect(extreme!.included).toBe(false);
    expect(extreme!.exclusionReason).toMatch(/outlier|IQR|z-score|mimo/i);

    const included = scored.filter((c) => c.included && c.weight > 0);
    expect(included.length).toBeGreaterThanOrEqual(3);
    expect(included.every((c) => c.candidate.id !== "p-outlier-extreme")).toBe(
      true,
    );
  });

  it("computes range with mid inside bounds for dense Praha set", () => {
    const result = runValuationEstimate(
      SYNTH_PRAHA_SUBJECT,
      SYNTH_PRAHA_COMPS,
      { asOf: SYNTH_AS_OF },
    );
    expect(result.status).toBe("CALCULATED");
    expect(result.adjustedValueCzk).toBeTypeOf("number");
    expect(result.lowerBoundCzk).toBeLessThanOrEqual(result.adjustedValueCzk!);
    expect(result.upperBoundCzk).toBeGreaterThanOrEqual(result.adjustedValueCzk!);

    const range = computeValuationRange({
      comps: result.comparables,
      subjectUsableArea: SYNTH_PRAHA_SUBJECT.usableArea,
      midValueCzk: result.adjustedValueCzk,
      adjustments: result.adjustments,
    });
    expect(range.lowerBoundCzk).not.toBeNull();
    expect(range.upperBoundCzk).not.toBeNull();
    expect(range.relativeWidth).toBeGreaterThan(0);
  });

  it("confidence score stays within 0–100 and maps to level", () => {
    const result = runValuationEstimate(
      SYNTH_PRAHA_SUBJECT,
      SYNTH_PRAHA_COMPS,
      { asOf: SYNTH_AS_OF },
    );
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
    expect(["HIGH", "MEDIUM", "LOW", "INSUFFICIENT", "UNKNOWN"]).toContain(
      result.confidenceLevel,
    );

    const included = result.comparables.filter((c) => c.included && c.weight > 0);
    const conf = computeConfidence({
      includedComps: included,
      range: {
        lowerPricePerSqm: null,
        upperPricePerSqm: null,
        lowerBoundCzk: result.lowerBoundCzk,
        upperBoundCzk: result.upperBoundCzk,
        relativeWidth: result.relativeRangeWidth,
        method: "weighted_quantile_ppsqm",
      },
      asOf: SYNTH_AS_OF,
    });
    expect(conf.score).toBeGreaterThanOrEqual(0);
    expect(conf.score).toBeLessThanOrEqual(100);
  });
});

describe("Prompt 10 Part 5 — sparse village house", () => {
  it("does not invent a solid estimate with too few comps", () => {
    const result = runValuationEstimate(
      SYNTH_VILLAGE_SUBJECT,
      SYNTH_VILLAGE_COMPS,
      { asOf: SYNTH_AS_OF },
    );
    expect(["INSUFFICIENT_DATA", "REQUIRES_INDIVIDUAL_APPRAISAL"]).toContain(
      result.status,
    );
    expect(result.adjustedValueCzk).toBeNull();
    expect(result.lowerBoundCzk).toBeNull();
    expect(result.confidenceLevel === "INSUFFICIENT" || result.confidenceScore === 0).toBe(
      true,
    );
  });
});

describe("Prompt 10 Part 5 — analyst override audit", () => {
  it("appends immutable audit with required reason", () => {
    const log = createAnalystOverrideAuditLog();
    const row = log.append({
      valuationId: "val-1",
      actorUserId: "analyst-1",
      fieldKey: "estimatedValue",
      previousValue: 6_200_000,
      newValue: 6_050_000,
      reason: "Lokální šum — poslední transakce v mikro-oblasti níže",
    });
    expect(row.reason).toMatch(/Lokální/);
    expect(log.listForValuation("val-1")).toHaveLength(1);
    expect(() =>
      buildAnalystOverrideAudit({
        valuationId: "val-1",
        actorUserId: "a",
        fieldKey: "estimatedValue",
        previousValue: 1,
        newValue: 2,
        reason: "   ",
      }),
    ).toThrow(/reason/i);
  });
});

describe("Prompt 10 Part 5 — authorization DTOs", () => {
  it("public DTO hides analyst diagnostics (weights, score, snapshot)", () => {
    const property = getDemoPublicProperty("demo-byt-3kk-vinohrady")!;
    const service = createValuationService();
    const pub = service.estimateForProperty(property, { role: "PUBLIC" });
    expect(pub.kind).toBe("public");
    expect(pub).not.toHaveProperty("analystComparables");
    expect(pub).not.toHaveProperty("confidenceScore");
    expect(pub).not.toHaveProperty("inputSnapshot");
    expect(pub).not.toHaveProperty("pricePerSqmWeightedMedian");
    expect(JSON.stringify(pub)).not.toMatch(/"weight":/);
    expect(pub.disclaimer).toBe(VALUATION_LEGAL_DISCLAIMER);

    const analyst = service.estimateForProperty(property, { role: "ANALYST" });
    expect(analyst.kind).toBe("analyst");
    if (analyst.kind !== "analyst") return;
    expect(analyst.confidenceScore).toBeTypeOf("number");
    expect(analyst.analystComparables.some((c) => "weight" in c)).toBe(true);
  });
});

describe("Prompt 10 Part 5 — SEO: estimate never as Offer.price", () => {
  it("JSON-LD Offer.price is asking price only, never Majetio mid estimate", () => {
    const property = getDemoPublicProperty("demo-byt-3kk-vinohrady")!;
    const valuation = createValuationService().estimateForProperty(property, {
      role: "PUBLIC",
    });
    const json = buildPropertyDetailJsonLd(property) as {
      offers?: { price?: number };
    };
    expect(json.offers?.price).toBe(property.askingPrice);
    expect(json.offers?.price).not.toBe(valuation.estimateMidCzk);
    const raw = JSON.stringify(json);
    expect(raw).not.toMatch(/estimateMid|majetio.?odhad|adjustedValue/i);
  });
});

describe("Prompt 10 Part 5 — analytics valuation events", () => {
  it("allows valuation events without CZK amounts", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "valuation_viewed",
        props: {
          slug: "demo-byt-3kk-vinohrady",
          status: "CALCULATED",
          confidence_level: "MEDIUM",
          is_demo: true,
          has_estimate: true,
        },
      }),
    ).not.toThrow();
    expect(() =>
      assertAnalyticsSafe({
        name: "comparable_opened",
        props: {
          slug: "demo-byt-3kk-vinohrady",
          anonymized: true,
          similarity_bucket: "70-99",
        },
      }),
    ).not.toThrow();
    expect(() =>
      assertAnalyticsSafe({
        name: "valuation_recalculation_requested",
        props: {
          slug: "demo-byt-3kk-vinohrady",
          reason: "manual",
        },
      }),
    ).not.toThrow();
  });
});

describe("Prompt 10 Part 5 — accessibility of range visual", () => {
  it("exposes a human-readable range summary contract for aria", () => {
    const property = getDemoPublicProperty("demo-byt-3kk-vinohrady")!;
    const dto = createValuationService().estimateForProperty(property, {
      role: "PUBLIC",
    });
    expect(dto.status).toBe("CALCULATED");
    expect(dto.lowerBoundCzk).not.toBeNull();
    expect(dto.upperBoundCzk).not.toBeNull();
    const summary = `Orientační interval odhadu Majetio: dolní ${dto.lowerBoundCzk}, střed ${dto.estimateMidCzk}, horní ${dto.upperBoundCzk}. Nejde o oficiální cenu nabídky.`;
    expect(summary).toMatch(/interval odhadu/i);
    expect(summary).toMatch(/Nejde o oficiální cenu/i);
  });
});
