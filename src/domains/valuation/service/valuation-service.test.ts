import { describe, expect, it } from "vitest";

import { getDemoPublicProperty } from "@/content/demo-canonical-properties";
import {
  VALUATION_LEGAL_DISCLAIMER,
  createValuationService,
} from "@/domains/valuation";

describe("ValuationService DTOs", () => {
  const service = createValuationService();

  it("returns PublicValuationDto without analyst weights for public viewer", () => {
    const property = getDemoPublicProperty("demo-byt-3kk-vinohrady")!;
    const dto = service.estimateForProperty(property, { role: "PUBLIC" });

    expect(dto.kind).toBe("public");
    expect(dto.disclaimer).toBe(VALUATION_LEGAL_DISCLAIMER);
    expect(dto.askingPriceCzk).toBe(property.askingPrice);
    expect(dto.status).toBe("CALCULATED");
    expect(dto.estimateMidCzk).toBeTypeOf("number");
    expect(dto.lowerBoundCzk).toBeLessThanOrEqual(dto.estimateMidCzk!);
    expect(dto.upperBoundCzk).toBeGreaterThanOrEqual(dto.estimateMidCzk!);
    expect(dto.askingVsMidPct).not.toBeNull();
    expect(dto.comparables.length).toBeGreaterThanOrEqual(3);
    expect(dto.comparables.length).toBeLessThanOrEqual(10);
    expect(dto).not.toHaveProperty("analystComparables");
    expect(dto).not.toHaveProperty("confidenceScore");

    const anonymized = dto.comparables.filter((c) => c.anonymized);
    expect(anonymized.length).toBeGreaterThan(0);
    for (const a of anonymized) {
      expect(a.label).toMatch(/Srovnatelná nemovitost/);
      expect(a.id).toMatch(/^anon-/);
    }
  });

  it("returns AnalystValuationDto with weights for staff", () => {
    const property = getDemoPublicProperty("demo-byt-3kk-vinohrady")!;
    const dto = service.estimateForProperty(property, { role: "ANALYST" });

    expect(dto.kind).toBe("analyst");
    if (dto.kind !== "analyst") return;
    expect(dto.confidenceScore).toBeGreaterThan(0);
    expect(dto.analystComparables.length).toBeGreaterThan(0);
    expect(dto.analystComparables.some((c) => c.weight > 0)).toBe(true);
    expect(dto.inputSnapshot.propertySnapshot?.propertyId).toBe(property.id);
    expect(dto.adjustments.length).toBeGreaterThan(0);
    expect(dto.adjustments.some((a) => a.label.includes("zvyšuje") || a.label.includes("snižuje"))).toBe(
      true,
    );
  });

  it("does not invent a mid estimate for atypical house when blocked", () => {
    const property = getDemoPublicProperty("demo-dum-rekonstrukce")!;
    // House 160 m² is OK for edge cases — still may get INSUFFICIENT if few house comps
    const dto = service.estimateForProperty(property, { role: "PUBLIC" });
    if (dto.status === "CALCULATED") {
      expect(dto.estimateMidCzk).toBeTypeOf("number");
    } else {
      expect(dto.estimateMidCzk).toBeNull();
      expect(dto.lowerBoundCzk).toBeNull();
    }
  });
});
