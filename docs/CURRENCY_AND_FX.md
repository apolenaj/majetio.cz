# CURRENCY_AND_FX

Multi-currency money, FX snapshots, stale/unavailable policy, dual display.

**Related:** [`CURRENCY_AND_I18N.md`](./CURRENCY_AND_I18N.md) · [`MARKET_TRANSACTION_COSTS.md`](./MARKET_TRANSACTION_COSTS.md) · [`INTERNATIONAL_FINANCING.md`](./INTERNATIONAL_FINANCING.md)

## Rules (128–133)

1. Every `Money` value is currency-tagged — never mix without an explicit snapshot.
2. Historical calculations **pin** `ExchangeRateSnapshot` — live FX must not rewrite history.
3. Missing rate → **`FxUnavailableError`** (fail closed).
4. Stale rate → optional fallback with status `STALE` (`ALLOW_STALE`) or hard fail (`REQUIRE_FRESH`).
5. Product **list prices** are never FX-derived from another market (see commerce docs).

## Snapshot shape

```ts
{
  baseCurrency, quoteCurrency, rate, // quote per 1 base
  source, observedAt,               // UTC ISO
  providerRef?
}
```

Persist: Prisma `ExchangeRateSnapshot`.

## FX engine

`src/domains/finance/fx/engine.ts`

| Mode | Behaviour |
| --- | --- |
| `ALLOW_STALE` | Prefer fresh ≤ `maxAgeMs` (default 48h); else return STALE snapshot |
| `REQUIRE_FRESH` | Stale → `FxUnavailableError` |
| `PINNED` | Use exact snapshot (historical reproducibility) |

```ts
resolveExchangeRate({ baseCurrency: "AED", quoteCurrency: "CZK", store, mode: "ALLOW_STALE" })
convertMoneyWithFxEngine({ amount, targetCurrency: "CZK", store })
```

`InMemoryFxRateStore` for tests; production adapters can wrap Prisma.

## Dual currency UX

- Domain: `buildDualCurrencyDisplay`
- UI: `DualCurrencyPrice` — local primary + orientational secondary + disclaimer  
  (`fx.orientational_only` — not an FX offer)

## Capital-normalized search

`normalizeListingsByHomeCapital` converts equity into the buyer’s home currency via frozen FX so AED vs CZK listings can be sorted without mixing raw prices.

## Out of scope here

- Live ECB/CNB cron ingest (store interface ready)
- Using FX to invent PricingPlan list prices (**forbidden**)
