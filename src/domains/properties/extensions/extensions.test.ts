import { describe, expect, it } from "vitest";

import {
  parseMarketExtensions,
  MarketExtensionError,
  createLocalizedPropertyText,
  LocalizedTextError,
  pickDisplayText,
} from "@/domains/properties/extensions";
import {
  resolveCanonicalPropertyType,
  parseLayoutToCanonical,
  formatLayoutForMarket,
  toCanonicalSqm,
  fromCanonicalSqm,
  sqmToSqft,
  sqftToSqm,
  AreaConversionError,
  roundTripCanonicalSqm,
} from "@/domains/properties/taxonomy-index";
import { runAdapter } from "@/domains/property-sources/service/adapter";
import {
  AeBayutStylePropertySourceAdapter,
  EsIdealistaStylePropertySourceAdapter,
  resolvePropertyImportAdapter,
} from "@/domains/property-sources/adapters";

describe("Typed market extensions", () => {
  it("accepts UAE attributes on AE market", () => {
    const attrs = parseMarketExtensions("AE", {
      marketCode: "AE",
      furnishing: "FURNISHED",
      viewType: "SEA",
      parkingSpaces: 1,
    });
    expect(attrs?.marketCode).toBe("AE");
    expect(attrs && "furnishing" in attrs && attrs.furnishing).toBe("FURNISHED");
  });

  it("rejects UAE fields on CZ property", () => {
    expect(() =>
      parseMarketExtensions("CZ", {
        marketCode: "CZ",
        furnishing: "FURNISHED",
      }),
    ).toThrow(MarketExtensionError);

    try {
      parseMarketExtensions("CZ", { furnishing: "FURNISHED" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(MarketExtensionError);
      expect((e as MarketExtensionError).code).toBe("MARKET_MISMATCH");
    }
  });

  it("rejects Spain cadastral on AE property", () => {
    expect(() =>
      parseMarketExtensions("AE", {
        marketCode: "AE",
        cadastralReference: "12345678901234AB",
      }),
    ).toThrow(/not valid for market AE|MARKET_MISMATCH|Unrecognized|cadastral/i);
  });

  it("rejects marketCode mismatch inside bag", () => {
    expect(() =>
      parseMarketExtensions("CZ", {
        marketCode: "AE",
        furnishing: "FURNISHED",
      }),
    ).toThrow(MarketExtensionError);
  });

  it("parses Spain and Czech bags with enums only", () => {
    const es = parseMarketExtensions("ES", {
      marketCode: "ES",
      energyCertificate: "B",
      orientation: "SOUTH",
      hasElevator: true,
    });
    expect(es?.marketCode).toBe("ES");

    const cz = parseMarketExtensions("CZ", {
      marketCode: "CZ",
      penbClass: "C",
      balconyKind: "LOGGIA",
      svjMonthlyFeeCzk: 3500,
    });
    expect(cz?.marketCode).toBe("CZ");
  });

  it("rejects free-text enum values", () => {
    expect(() =>
      parseMarketExtensions("AE", {
        marketCode: "AE",
        furnishing: "nicely furnished",
      }),
    ).toThrow(MarketExtensionError);
  });
});

describe("Canonical taxonomy mapping", () => {
  it("unifies Czech 3+kk and Dubai 2-bedroom into bedrooms=2", () => {
    const cz = parseLayoutToCanonical("3+kk");
    expect(cz?.bedrooms).toBe(2);

    const aeType = resolveCanonicalPropertyType({
      marketCode: "AE",
      raw: "2 bedroom",
    });
    // type alias may be null for layout strings — bedrooms via layout
    const aeLayout = parseLayoutToCanonical("2 bedroom");
    expect(aeLayout?.bedrooms).toBe(2);

    expect(
      formatLayoutForMarket({
        layout: cz!,
        notationSystem: "CZ_DISPOSITION",
        locale: "cs-CZ",
      }).label,
    ).toBe("3+kk");
    expect(
      formatLayoutForMarket({
        layout: { ...cz!, bathrooms: 2 },
        notationSystem: "BEDROOM_COUNT",
        locale: "en-AE",
        bathrooms: 2,
      }).label,
    ).toMatch(/2 bedrooms/);

    expect(
      resolveCanonicalPropertyType({ marketCode: "AE", raw: "villa" }),
    ).toBe("VILLA");
    expect(
      resolveCanonicalPropertyType({ marketCode: "CZ", raw: "byt" }),
    ).toBe("APARTMENT");
    expect(aeType).toBeNull();
  });
});

describe("sqm ↔ sqft safety", () => {
  it("converts with international factor", () => {
    expect(sqmToSqft(1)).toBeCloseTo(10.76391041671, 8);
    expect(sqftToSqm(10.76391041671)).toBeCloseTo(1, 8);
    const sqm = toCanonicalSqm(1500, "sqft");
    expect(fromCanonicalSqm(sqm, "sqft")).toBeCloseTo(1500, 5);
    expect(roundTripCanonicalSqm(100, "sqm")).toBeCloseTo(100, 3);
  });

  it("rejects negative and non-finite areas", () => {
    expect(() => toCanonicalSqm(-1, "sqm")).toThrow(AreaConversionError);
    expect(() => sqftToSqm(Number.NaN)).toThrow(AreaConversionError);
  });
});

describe("Localized text + machine_generated", () => {
  it("requires machineGenerated for MACHINE_GENERATED source", () => {
    expect(() =>
      createLocalizedPropertyText({
        field: "title",
        originalLocale: "es-ES",
        originalText: "Piso luminoso",
        translatedLocale: "en-GB",
        translatedText: "Bright flat",
        translationSource: "MACHINE_GENERATED",
        machineGenerated: false,
      }),
    ).toThrow(LocalizedTextError);

    const ok = createLocalizedPropertyText({
      field: "title",
      originalLocale: "es-ES",
      originalText: "Piso luminoso",
      translatedLocale: "en-GB",
      translatedText: "Bright flat",
      translationSource: "MACHINE_GENERATED",
    });
    expect(ok.machineGenerated).toBe(true);
  });

  it("prefers human translation over machine", () => {
    const texts = [
      createLocalizedPropertyText({
        field: "title",
        originalLocale: "ar-AE",
        originalText: "شقة",
        translatedLocale: "en-AE",
        translatedText: "Apartment (MT)",
        translationSource: "MACHINE_GENERATED",
      }),
      createLocalizedPropertyText({
        field: "title",
        originalLocale: "ar-AE",
        originalText: "شقة",
        translatedLocale: "en-AE",
        translatedText: "Apartment",
        translationSource: "HUMAN",
        machineGenerated: false,
      }),
    ];
    const picked = pickDisplayText(texts, "title", "en-AE");
    expect(picked?.text).toBe("Apartment");
    expect(picked?.machineGenerated).toBe(false);
  });
});

describe("Import adapters → canonical", () => {
  it("maps Bayut-style AE payload with typed extensions", () => {
    const adapter = new AeBayutStylePropertySourceAdapter();
    const listing = runAdapter(adapter, {
      id: "ae-1",
      title: "Marina view apt",
      titleAr: "شقة",
      price: 2_000_000,
      currency: "AED",
      size: 1200,
      sizeUnit: "sqft",
      bedrooms: 2,
      bathrooms: 2,
      propertyType: "apartment",
      furnishing: "furnished",
      view: "sea view",
      photos: ["https://example.com/a.jpg"],
    });
    expect(listing.marketCode).toBe("AE");
    expect(listing.propertyType).toBe("APARTMENT");
    expect(listing.usableAreaM2).toBeCloseTo(toCanonicalSqm(1200, "sqft"), 4);
    expect(listing.marketExtensions?.furnishing).toBe("FURNISHED");
    expect(listing.localizedTexts?.some((t) => t.originalLocale === "ar-AE")).toBe(
      true,
    );
  });

  it("maps Idealista-style ES payload", () => {
    const adapter = new EsIdealistaStylePropertySourceAdapter();
    const listing = runAdapter(adapter, {
      id: "es-1",
      title: "Piso en Valencia",
      price: 350000,
      currency: "EUR",
      size: 95,
      rooms: 3,
      bathrooms: 2,
      propertyType: "piso",
      energyCertification: "C",
      orientation: "south",
      hasLift: true,
    });
    expect(listing.marketCode).toBe("ES");
    expect(listing.propertyType).toBe("APARTMENT");
    expect(listing.usableAreaM2).toBe(95);
    expect(listing.marketExtensions?.energyCertificate).toBe("C");
  });

  it("resolves adapter by provider / market", () => {
    expect(resolvePropertyImportAdapter({ provider: "bayut" }).id).toBe(
      "ae-bayut-style",
    );
    expect(resolvePropertyImportAdapter({ provider: "idealista" }).id).toBe(
      "es-idealista-style",
    );
    expect(
      resolvePropertyImportAdapter({ provider: "partner", marketCode: "AE" }).id,
    ).toBe("ae-bayut-style");
  });
});
