import { describe, expect, it } from "vitest";

import {
  buildModelDecision,
  matchCatalogComparables,
  priceGapPercent,
  pricePerSquareMetre,
  projectValue,
  renovationBands,
} from "@/lib/catalog-decision";
import { findCatalogPropertyBySlug, mockProperties } from "@/lib/mock-properties";

describe("catalog decision", () => {
  const flat = findCatalogPropertyBySlug("ukazka-1");

  it("počítá cenu za metr z nabídky a mezeru proti modelové hladině", () => {
    expect(flat).toBeDefined();
    if (!flat) return;
    const perM2 = pricePerSquareMetre(flat.cena, flat.plocha_m2);
    expect(perM2).toBeCloseTo(6_500_000 / 54, 4);
    expect(priceGapPercent(perM2 ?? 0, 129_500)).toBeCloseTo(-7.05, 1);
  });

  it("nebere 4+kk ve Vinohradech jako srovnatelný byt", () => {
    expect(flat).toBeDefined();
    if (!flat) return;
    const match = matchCatalogComparables(flat, 6);
    expect(match.items.map((item) => item.property.id)).not.toContain(7);
    expect(match.items.every((item) => item.property.dispozice === "2+kk")).toBe(true);
    expect(match.items.every((item) => item.property.plocha_m2 <= 54 * 1.25)).toBe(true);
  });

  it("modelový balík drží jeden zdroj a neslibuje trh", () => {
    expect(flat).toBeDefined();
    if (!flat) return;
    const model = buildModelDecision(flat);
    expect(model?.label).toBe("Modelová data");
    expect(model?.monthlyRent).toBe(24_500);
    expect(model?.loan).toBe(5_200_000);
    expect(model?.monthlyPayment).toBeGreaterThan(20_000);
    expect(model?.grossYieldPct).toBeCloseTo((24_500 * 12) / 6_500_000 * 100, 2);
    expect(model?.disclaimer).toMatch(/ne odhad trhu/);
    expect(buildModelDecision(mockProperties.find((item) => item.id === 2)!)).toBeNull();
  });

  it("pásma rekonstrukce rostou s plochou a scénář není jistota", () => {
    const bands = renovationBands(54);
    const light = bands.find((band) => band.id === "lehka");
    expect(light?.low).toBe(54 * 2_800);
    expect(light?.high).toBe(54 * 5_500);
    const series = projectValue(6_500_000, 0.03, 2);
    expect(series[0]?.value).toBe(6_500_000);
    expect(series[2]?.value).toBe(Math.round(6_500_000 * 1.03 ** 2));
  });
});
