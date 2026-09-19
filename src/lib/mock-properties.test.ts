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
      expect(item.detail_popis).toContain("O nemovitosti");
      expect(item.detail_popis).toContain("Technický stav");
      expect(item.galerie.length).toBeGreaterThanOrEqual(3);
      expect(item.obcanska_vybavenost.length).toBeGreaterThanOrEqual(4);
      expect(item.lokalita_gps.lat).toBeGreaterThan(48);
      expect(item.lokalita_gps.lng).toBeGreaterThan(12);
    }
  });

  it("gives the Krnov house Czech copy, coordinates and amenities", () => {
    const house = mockProperties.find((item) => item.id === 5);
    expect(house?.lokalita_gps).toEqual({ lat: 50.0905, lng: 17.7038 });
    expect(house?.obcanska_vybavenost.some((item) => item.nazev === "MŠ Smetanova")).toBe(true);
    expect(house?.detail_popis).toContain("4+1");
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
