import { describe, expect, it } from "vitest";

import { EMPTY_PROPERTY_URL_STATE } from "@/domains/properties/search/url-state";
import { filterProperties, findCatalogPropertyBySlug, mockProperties } from "@/lib/mock-properties";

describe("filterProperties", () => {
  it("returns the whole catalog without filters", () => {
    expect(filterProperties(mockProperties, EMPTY_PROPERTY_URL_STATE)).toHaveLength(20);
  });

  it("keeps only listings whose stitky contain the selected label", () => {
    const hits = filterProperties(mockProperties, {
      ...EMPTY_PROPERTY_URL_STATE,
      stitky: ["Vysoký výnos"],
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((item) => item.stitky.includes("Vysoký výnos"))).toBe(true);
    expect(hits.some((item) => item.id === 1)).toBe(true);
    expect(hits.some((item) => item.id === 2)).toBe(false);
  });

  it("gives classic listings one photo and premium a before/after pair", () => {
    for (const item of mockProperties) {
      if (item.stav_inzeratu === "klasicky") {
        expect(item.obrazky.hlavni).toBeTruthy();
        expect(item.obrazky.pred_rekonstrukci).toBeUndefined();
      } else {
        expect(item.obrazky.pred_rekonstrukci).toBeTruthy();
        expect(item.obrazky.po_rekonstrukci).toBeTruthy();
        expect(item.obrazky.pocet_wow_fotek).toBeGreaterThanOrEqual(3);
      }
      expect(item.detail_popis.length).toBeGreaterThan(80);
      expect(item.galerie.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolves catalog detail slugs without touching real listing slugs", () => {
    expect(findCatalogPropertyBySlug("ukazka-2")?.lokalita).toContain("Ostrava");
    expect(findCatalogPropertyBySlug("byt-vinohrady")).toBeUndefined();
  });

  it("filters type, layout and locality together", () => {
    const hits = filterProperties(mockProperties, {
      ...EMPTY_PROPERTY_URL_STATE,
      lokalita: "Praha",
      typ: ["byt"],
      dispozice: ["2+kk"],
    });
    expect(hits.map((item) => item.id)).toEqual([1]);
  });
});
