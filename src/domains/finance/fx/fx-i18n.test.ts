/**
 * Prompt 17.2 — Currency, FX, i18n unit contracts.
 */

import { describe, expect, it } from "vitest";

import { Money } from "@/domains/finance";
import {
  CURRENCY_CODES,
  MAJETIO_MARKET_CURRENCIES,
  assertSameCurrency,
} from "@/domains/finance/primitives/currency";
import {
  assertCalculationBaseCurrency,
  buildDualCurrencyDisplay,
  convertMajorToBaseWithSnapshot,
  convertMoneyWithSnapshot,
  dualCurrencyDisclaimerEn,
  identityExchangeRateSnapshot,
  invertSnapshot,
} from "@/domains/finance/fx";
import {
  buildSeoLocaleRoutes,
  formatMoneyMajor,
  formatPhoneE164,
  isTranslationPublicallyShippable,
  languageFromLocale,
  resolveLocaleForMarket,
  stripLocalePrefix,
  toE164,
  translationKey,
} from "@/domains/i18n";
import { marketRegistry } from "@/domains/markets";

describe("Currency architecture (17.2)", () => {
  it("supports Majetio market currencies including AED SAR IDR", () => {
    for (const c of MAJETIO_MARKET_CURRENCIES) {
      expect(CURRENCY_CODES).toContain(c);
    }
    expect(Money.fromMajor(100, "AED").currency).toBe("AED");
    expect(Money.fromMajor(100, "IDR").currency).toBe("IDR");
  });

  it("forbids mixing currencies without conversion", () => {
    expect(() => assertSameCurrency("CZK", "EUR")).toThrow(/mix forbidden/i);
    expect(() =>
      assertCalculationBaseCurrency({
        baseCurrency: "EUR",
        amounts: [Money.fromMajor(1, "CZK")],
      }),
    ).toThrow(/mix forbidden/i);
  });

  it("converts with frozen snapshot and does not need live FX", () => {
    const snapshot = {
      baseCurrency: "AED" as const,
      quoteCurrency: "CZK" as const,
      rate: "6.25",
      source: "manual",
      observedAt: "2026-07-01T12:00:00.000Z",
    };
    const aed = Money.fromMajor(1_500_000, "AED");
    const czk = convertMoneyWithSnapshot({ amount: aed, snapshot });
    expect(czk.currency).toBe("CZK");
    expect(czk.toMajorNumber()).toBe(9_375_000);

    const legacy = convertMajorToBaseWithSnapshot({
      amountMajor: 100,
      fromCurrency: "EUR",
      baseCurrency: "CZK",
      snapshot: {
        fromCurrency: "EUR",
        toCurrency: "CZK",
        rate: "25",
        source: "cnb",
        asOf: "2026-06-01T00:00:00.000Z",
      },
    });
    expect(legacy.amountMajorInBase).toBe(2500);
  });

  it("builds dual currency UX with disclaimer", () => {
    const dual = buildDualCurrencyDisplay({
      primary: Money.fromMajor(1_500_000, "AED"),
      secondaryCurrency: "CZK",
      snapshot: {
        baseCurrency: "AED",
        quoteCurrency: "CZK",
        rate: "6",
        source: "manual",
        observedAt: "2026-07-15T08:00:00.000Z",
      },
    });
    expect(dual.secondary?.amountMajor).toBe(9_000_000);
    expect(dual.secondary?.disclaimerKey).toBe("fx.orientational_only");
    expect(dualCurrencyDisclaimerEn(dual.secondary!.snapshot)).toMatch(/2026-07-15/);
    expect(invertSnapshot(identityExchangeRateSnapshot("USD")).rate).toBe("1");
  });
});

describe("i18n Market ≠ Language (17.2)", () => {
  it("resolves AE market with en or ar preference", () => {
    const ae = marketRegistry.get("AE")!;
    const en = resolveLocaleForMarket({
      marketDefaultLocale: ae.defaultLocale,
      marketSupportedLocales: ae.supportedLocales,
      userPreferredLocale: "en",
    });
    expect(en.locale).toMatch(/^en/);
    const ar = resolveLocaleForMarket({
      marketDefaultLocale: ae.defaultLocale,
      marketSupportedLocales: ae.supportedLocales,
      userPreferredLocale: "ar-AE",
    });
    expect(ar.dir).toBe("rtl");
    expect(languageFromLocale("cs")).toBe("cs");
  });

  it("builds SEO locale routes with unprefixed default", () => {
    const routes = buildSeoLocaleRoutes({
      pathname: "/nemovitosti",
      locales: ["cs-CZ", "en-GB"],
    });
    expect(routes.find((r) => r.locale === "cs-CZ")?.localizedPath).toBe(
      "/nemovitosti",
    );
    expect(routes.find((r) => r.locale === "en-GB")?.localizedPath).toBe(
      "/en/nemovitosti",
    );
    expect(stripLocalePrefix("/en/cenik").pathname).toBe("/cenik");
  });

  it("gates legal translations until APPROVED", () => {
    expect(
      isTranslationPublicallyShippable({
        namespace: "legal",
        status: "TRANSLATED",
        requiresHumanReview: true,
        machineTranslated: true,
      }),
    ).toBe(false);
    expect(
      isTranslationPublicallyShippable({
        namespace: "legal",
        status: "APPROVED",
        requiresHumanReview: true,
        machineTranslated: true,
      }),
    ).toBe(true);
    expect(translationKey("ui", "nav", "pricing")).toBe("ui.nav.pricing");
  });

  it("formats money/phone locale-aware", () => {
    expect(formatMoneyMajor(1500, "EUR", "en-GB")).toMatch(/1/);
    expect(toE164("777123456", "420")).toBe("+420777123456");
    expect(formatPhoneE164("+420777123456")).toMatch(/^\+420/);
  });
});
