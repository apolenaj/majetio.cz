# CURRENCY_AND_I18N

**Prompt 17.2** — Currency Architecture, FX Handling & i18n.

Navazuje na `docs/INTERNATIONAL_ARCHITECTURE.md` (17.1 Market Registry).

## 1. Market ≠ Language

| Koncept | Příklad |
| --- | --- |
| Market | `AE` (UAE) — currency AED, timezone Asia/Dubai |
| Language / locale | `en-AE` **nebo** `ar-AE` (RTL) na stejném trhu |

Resolver: `resolveLocaleForMarket({ marketDefaultLocale, marketSupportedLocales, userPreferredLocale })`.

Jazyky připravené: `cs`, `en`, `sk`, `es`, `it`, `hr`, `ar`.

## 2. SEO-safe routing

- Default language trhu (CZ → `cs`) = **bez prefixu**: `/nemovitosti`
- Ostatní jazyky: `/{lang}/…` (`en`, `sk`, `es`, `it`, `hr`, `ar`)
- Market **není** v path (budoucí subdomain `ae.majetio.com`) — méně duplicate SEO
- `buildSeoLocaleRoutes` / `stripLocalePrefix` pro hreflang + middleware later

## 3. Currency Architecture

Podporované ISO 4217 (`CURRENCY_CODES`): **CZK, EUR, AED, SAR, IDR, USD** (+ GBP, CHF).

Pravidla Financial Engine:

1. Každý kalkulační scénář má právě jednu **`baseCurrency`**
2. `assertSameCurrency` / `assertCalculationBaseCurrency` — **žádný mix bez FX**
3. `Money` zůstává currency-tagged; aritmetika jen ve stejné měně

## 4. ExchangeRateSnapshot

```ts
{
  baseCurrency, quoteCurrency, rate, // quote per 1 base
  source, observedAt,               // UTC ISO
  providerRef?
}
```

- Persist: Prisma `ExchangeRateSnapshot`
- Kalkulace **fixují** snapshot ze vzniku — změna live kurzu historii nepřepočítá
- Legacy scenario JSON (`fromCurrency`/`toCurrency`/`asOf`) se normalizuje

API: `convertMoneyWithSnapshot`, `convertMajorToBaseWithSnapshot`.

## 5. Dual Currency UX

`buildDualCurrencyDisplay`:

- Primární: tržní/scénářová měna (např. AED 1 500 000)
- Sekundární: orientační konverze (CZK) + `observedAt` + kurz + disclaimer  
  (`fx.orientational_only` — „Not an FX offer“)

## 6. Translation keys & status

Namespace: `ui` · `marketing` · `product` · `legal` · `regulatory` · `email` · `errors`

Status: **DRAFT → TRANSLATED → REVIEWED → APPROVED**

- `legal` / `regulatory`: veřejně jen **APPROVED** (+ human review); čistý machine translate nestačí
- Klíče: `translationKey("legal", "terms", "title")` → `legal.terms.title`
- Žádné hardcoded copy na nových international surfaces

## 7. Locale-aware formatters

| Helper | Účel |
| --- | --- |
| `formatMoneyMajor` / `formatMoneyMinor` | Ceny dle locale + currency |
| `formatNumber` | Čísla |
| `formatDateUtc` / `formatInstantForTimezone` | UTC storage → market/user TZ display |
| `toE164` / `formatPhoneE164` | Telefony |
| `formatArea` / `formatAddressLines` | Jednotky + adresní pořadí |

Legacy `src/lib/format.ts` (`formatCzk`, …) zůstává pro CZ UI; nové surfaces mají používat `@/domains/i18n`.

## Doménová mapa

```
src/domains/finance/primitives/currency.ts   # + AED SAR IDR
src/domains/finance/fx/                      # snapshot, convert, dual UX
src/domains/i18n/locales.ts                  # Market≠Language, SEO routes
src/domains/i18n/translation.ts              # keys + statuses
src/domains/i18n/format.ts                   # Intl formatters
prisma/.../exchange_rate_snapshot            # persistence
```

## Mimo rozsah 17.2

- Plný next-intl middleware / message catalogs UI
- Live FX provider cron (engine + store interface: see `docs/CURRENCY_AND_FX.md`)

## Související

- `docs/CURRENCY_AND_FX.md` — stale/unavailable FX, dual UI, capital-normalized search
- `docs/INTERNATIONAL_FINANCING.md` — HypotekaJasne CZ-only
- `docs/MARKET_TRANSACTION_COSTS.md`
- `docs/INTERNATIONAL_ARCHITECTURE.md`
- `src/domains/markets/` (defaultCurrency / supportedLocales)
