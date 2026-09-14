# MARKET_REGISTRY

Canonical reference for Majetio multi-market configuration.

**Related:** `docs/INTERNATIONAL_ARCHITECTURE.md` · code: `src/domains/markets/`

## Principle

**One Core — Multiple Markets.**  
`MarketCode` is always **explicit** in application code and on persisted entities.  
**Never** infer market from currency alone (EUR ≠ one market).

## Identity types

| Type | Standard | Example |
| --- | --- | --- |
| `MarketCode` | Majetio branded enum | `CZ`, `AE` |
| `CountryCode` | ISO 3166-1 alpha-2 | `CZ`, `AE` |
| `LocaleCode` | BCP 47 | `cs-CZ`, `en-AE`, `ar-AE` |
| Currency | ISO 4217 | `CZK`, `EUR`, `AED` |

Code: `src/domains/markets/codes.ts`

- `toMarketCode` / `isMarketCode`
- `toCountryCode` / `toLocaleCode`
- `resolveExplicitMarketCode({ marketCode })` — explicit only
- `marketCodeFromCurrency()` — **always throws** (guardrail)

## Registry API

```ts
import { marketRegistry, toMarketCode, HOME_MARKET_CODE } from "@/domains/markets";

const cz = marketRegistry.getHomeMarket(); // LIVE, enabled
const ae = marketRegistry.get("AE");       // stub / RESEARCH
```

Public activity requires **all** of:

1. `enabled === true`
2. `launchStatus ∈ { BETA, LIVE }`
3. `hasMinimumPublicData === true`

## Seed markets

| MarketCode | Country | Currency | Locale(s) | Launch | Public |
| --- | --- | --- | --- | --- | --- |
| **CZ** | CZ | CZK | cs-CZ, en-GB | **LIVE** | **Yes** (Majetio.cz) |
| SK | SK | EUR | sk-SK, … | RESEARCH | No |
| ES | ES | EUR | es-ES, … | PLANNED | No |
| IT | IT | EUR | it-IT, … | PLANNED | No |
| HR | HR | EUR | hr-HR, … | PLANNED | No |
| AE | AE | AED | en-AE, ar-AE | RESEARCH | No |
| SA | SA | SAR | ar-SA, … | PLANNED | No |
| ID | ID | IDR | id-ID, en-ID | RESEARCH | No |

**Bali** = `regionCode: bali` under **ID** — not a MarketCode.

## Entity columns (multi-market)

Relevant tables carry explicit scope:

| Entity | `marketCode` | `countryCode` | `currency` |
| --- | --- | --- | --- |
| Property | ✓ (default `CZ`) | ✓ | ✓ |
| Lead | ✓ | ✓ | ✓ |
| Organization | ✓ | ✓ | ✓ |
| PricingPlan | ✓ | ✓ | ✓ (existing) |

Existing CZ rows are backfilled with `marketCode = 'CZ'` (no data loss).

## Plugins

```
src/domains/markets/plugins/
  cz/  sk/  es/  it/  hr/  ae/  sa/  id/
```

New market = new plugin folder + register in `plugins/index.ts`.  
Do **not** fork Core business logic.

## Anti-patterns

| Forbidden | Correct |
| --- | --- |
| `if (currency === "EUR") market = "ES"` | Pass `marketCode` from host / profile / entity |
| Forking `majetio-ae` app | MarketPlugin + capability flags |
| Showing RESEARCH markets as live | `isMarketPubliclyActive()` |
| Treating Bali as country market | Region under ID |
