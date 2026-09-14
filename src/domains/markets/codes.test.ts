import { describe, expect, it } from "vitest";

import {
  MARKET_CODES,
  HOME_MARKET_CODE,
  toMarketCode,
  tryMarketCode,
  toCountryCode,
  toLocaleCode,
  marketCodeFromCurrency,
  resolveExplicitMarketCode,
  MARKET_DEFAULT_CURRENCY,
  marketRegistry,
  isMarketPubliclyActive,
} from "@/domains/markets";

describe("MarketCode branded types (Rule 185)", () => {
  it("accepts registered market codes and rejects unknown", () => {
    expect(toMarketCode("cz")).toBe("CZ");
    expect(tryMarketCode("AE")).toBe("AE");
    expect(tryMarketCode("XX")).toBeNull();
    expect(() => toMarketCode("XX")).toThrow(/Unknown MarketCode/);
    expect(MARKET_CODES).toEqual([
      "CZ",
      "SK",
      "ES",
      "IT",
      "HR",
      "AE",
      "SA",
      "ID",
    ]);
    expect(HOME_MARKET_CODE).toBe("CZ");
  });

  it("validates ISO 3166 country and BCP 47 locale", () => {
    expect(toCountryCode("ae")).toBe("AE");
    expect(() => toCountryCode("UAE")).toThrow(/ISO 3166/);
    expect(toLocaleCode("cs-CZ")).toBe("cs-CZ");
    expect(toLocaleCode("en")).toBe("en");
    expect(() => toLocaleCode("!!!")).toThrow(/BCP 47/);
  });

  it("never derives market from currency alone", () => {
    expect(() => marketCodeFromCurrency("EUR")).toThrow(/Never derive/);
    expect(() => marketCodeFromCurrency("CZK")).toThrow(/Never derive/);
    // EUR is shared — currency must not pick a market
    expect(MARKET_DEFAULT_CURRENCY.SK).toBe("EUR");
    expect(MARKET_DEFAULT_CURRENCY.ES).toBe("EUR");
    expect(MARKET_DEFAULT_CURRENCY.IT).toBe("EUR");
    expect(MARKET_DEFAULT_CURRENCY.HR).toBe("EUR");
  });

  it("resolves market only from explicit fields", () => {
    expect(resolveExplicitMarketCode({ marketCode: "AE" })).toBe("AE");
    expect(resolveExplicitMarketCode({ marketCountry: "cz" })).toBe("CZ");
    expect(resolveExplicitMarketCode({})).toBe("CZ");
  });
});

describe("Market Registry seed", () => {
  it("has CZ active and other markets as inactive stubs", () => {
    const cz = marketRegistry.getHomeMarket();
    expect(cz.marketCode).toBe("CZ");
    expect(cz.launchStatus).toBe("LIVE");
    expect(cz.enabled).toBe(true);
    expect(isMarketPubliclyActive(cz)).toBe(true);

    const codes = marketRegistry.listAll().map((m) => m.marketCode);
    expect(codes).toEqual([...MARKET_CODES]);

    for (const code of MARKET_CODES.filter((c) => c !== "CZ")) {
      const m = marketRegistry.require(code);
      expect(isMarketPubliclyActive(m)).toBe(false);
    }
  });
});
