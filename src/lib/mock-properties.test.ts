import { describe, expect, it } from "vitest";

import { EMPTY_PROPERTY_URL_STATE } from "@/domains/properties/search/url-state";
import {
  catalogShots,
  filterProperties,
  findCatalogPropertyBySlug,
  findSimilarCatalogProperties,
  mockProperties,
  publicListingTags,
} from "@/lib/mock-properties";

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

  it("keeps illustrative photos and a technical condition separate from presentation", () => {
    for (const item of mockProperties) {
      expect(catalogShots(item).length).toBeGreaterThan(0);
      expect(item.technicky_stav).toBeTruthy();
      expect(item.detail_popis).not.toContain("ne za vilu");
      expect(item.detail_popis).not.toContain("dřevostavbu s verandou");
      expect(item.popis_upravy).not.toContain("Dron");
      expect(item.detail_popis).toContain("O nemovitosti");
      expect(item.obcanska_vybavenost.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps the Krnov demo gallery coherent and similar listings on the same deal type", () => {
    const house = mockProperties.find((item) => item.id === 5)!;
    expect(catalogShots(house)).toHaveLength(1);
    expect(house.galerie).toHaveLength(0);
    const similar = findSimilarCatalogProperties(house, 3);
    expect(similar.every((item) => item.typ_transakce === "prodej")).toBe(true);
    expect(similar.every((item) => item.typ_nemovitosti === "dum")).toBe(true);
    expect(publicListingTags(["Pod tržním odhadem", "Bez rekonstrukce"])).toEqual(["Bez rekonstrukce"]);
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
