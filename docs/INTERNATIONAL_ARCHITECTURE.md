# INTERNATIONAL_ARCHITECTURE

Majetio multi-market foundation — **One Platform, Multiple Markets** (no per-country app forks).

Also see: [`MARKET_REGISTRY.md`](./MARKET_REGISTRY.md) · [`MARKET_CAPABILITIES.md`](./MARKET_CAPABILITIES.md) · [`INTERNATIONAL_TEST_PLAN.md`](./INTERNATIONAL_TEST_PLAN.md) · [`MARKET_LAUNCH_PROCESS.md`](./MARKET_LAUNCH_PROCESS.md) · [`INTERNATIONAL_FINAL_REPORT.md`](./INTERNATIONAL_FINAL_REPORT.md)

## Core vs Market Plugins

```
┌─────────────────────────────────────────────────────────────────┐
│                     Majetio Core (shared)                       │
│  Next.js UI · Auth · Properties · Finance · Investment Engine   │
│  Entitlements · Commerce · Comparisons · Leads · Admin          │
│  (NO country-specific business forks)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ resolves via MarketRegistry
                             │ (explicit MarketCode — never from currency)
┌────────────────────────────▼────────────────────────────────────┐
│                      Market Registry                              │
│         MarketCode · CountryCode (ISO 3166) · Locale (BCP 47)   │
│              currency · launchStatus · capabilities               │
└───┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┘
    │      │      │      │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
   ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐
   │CZ│  │SK│  │ES│  │IT│  │HR│  │AE│  │SA│  │ID│
   │★ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
   └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘
    ▲
    └── LIVE / public (Majetio.cz). Others = stubs (inactive).
        ID may include region "bali" (not a separate market).
```

Each box under the registry is a **MarketPlugin** folder:

`src/domains/markets/plugins/{cz,sk,es,it,hr,ae,sa,id}/`

Plugin supplies: property taxonomy/UI, transaction costs, financing provider, taxation, regulatory pack refs, feature flags — **without** rewriting Core.

## Hosts

| Host | Role |
| --- | --- |
| majetio.cz | CZ home market (authoritative Czech content) |
| majetio.com | International shell / future multi-market hub |

## Princip

**One Platform — Multiple Markets.**  
Nesmí vzniknout forky aplikací per země. Sdílený **Majetio Core** + **MarketPlugin** konfigurace.

```
Core ← MarketRegistry ← MarketPlugin (per market folder)
```

Nový trh = nový folder + zápis do `plugins/index.ts`. **Bez** změn Core business logiky.

## MarketRegistry

API: `marketRegistry` (`src/domains/markets/registry/market-registry.ts`).  
Types: `toMarketCode`, `toCountryCode`, `toLocaleCode` (`src/domains/markets/codes.ts`).

| Pole | Účel |
| --- | --- |
| `marketCode` | Primární klíč (CZ, SK, …) — branded `MarketCode` |
| `countryCode` | ISO 3166-1 alpha-2 |
| `defaultLocale` / `supportedLocales` | BCP 47 |
| `defaultCurrency` | ISO 4217 (informativní — **není** klíč trhu) |
| `timezone` | IANA |
| `measurementSystem` | METRIC / IMPERIAL |
| `enabled` | Soft kill-switch |
| `launchStatus` | PLANNED · RESEARCH · BETA · LIVE · PAUSED |
| `regulatoryConfigVersion` | Verze regulačního packu |
| `hasMinimumPublicData` | Dostatek dat pro veřejné UI |
| `regions[]` | Podřazené regiony (Bali pod ID) |

### Veřejná aktivita

UI **nesmí** ukazovat trh jako aktivní, pokud není současně:

1. `enabled === true`  
2. `launchStatus ∈ { BETA, LIVE }`  
3. `hasMinimumPublicData === true`

### Pravidlo: Market ≠ Currency

`marketCodeFromCurrency()` **vždy selže**. SK/ES/IT/HR sdílejí EUR — market musí přijít explicitně (host, `UserMarketProfile`, `entity.marketCode`).

## Seed trhy

| Code | Status | Poznámka |
| --- | --- | --- |
| CZ | LIVE | Home market Majetio.cz — aktivní |
| SK | RESEARCH | stub, enabled=false |
| ES | PLANNED | stub |
| IT | PLANNED | stub |
| HR | PLANNED | stub |
| AE | RESEARCH | stub |
| SA | PLANNED | stub |
| ID | RESEARCH | region **bali** (ne samostatný stát) |

## MarketPlugin

Interface: `src/domains/markets/plugins/types.ts`

- `property` — typy, area unit, layoutNotation, detail/search extras  
- `transactionCosts` — verzované cost packs  
- `financing` — provider registry (HypotekaJasne = CZ only)  
- `taxation` / `regulatory` — tax + valuation model hooks  
- `capabilities` — Capability Matrix  
- `featureFlagDefaults` — `MARKET_{CODE}_{FEATURE}_ENABLED`

## DB multi-market columns

Property, Lead, Organization, PricingPlan (a další) nesou `marketCode` (+ `countryCode` / `currency` kde dává smysl).  
Existující CZ data = backfill `marketCode = 'CZ'` bez ztráty.

## Navazující dokumenty

- `docs/MARKET_REGISTRY.md` — registry API & anti-patterns  
- `docs/CURRENCY_AND_I18N.md` (17.2)  
- `docs/CURRENCY_AND_FX.md` (FX engine, stale/unavailable, dual display)  
- `docs/MARKET_TRANSACTION_COSTS.md`  
- `docs/INTERNATIONAL_FINANCING.md` (HypotekaJasne CZ-only, valuation isolation)  
- `docs/LOCALIZATION_ARCHITECTURE.md` (i18n / market selectors / RTL)  
- `docs/INTERNATIONAL_SEO.md` (hreflang, canonical, duplicate content)  
- `docs/PROPERTY_TAXONOMY.md` (17.3)  
- `docs/INTERNATIONAL_PROPERTY_MODEL.md` (typed extensions, import adapters)  
- `docs/REGULATORY_AND_FINANCING.md` (17.4)  
- `docs/REGULATORY_CONFIGURATION.md` (risk facts, DD checklists, consent recipients)  
- `docs/CLEARPROPERTYPATH_INTEGRATION_BOUNDARY.md`  
- `docs/MARKET_CAPABILITIES.md` (capability matrix, kill switches, marketScope)  
- `docs/SEO_PRIVACY_AND_CROSS_MARKET.md` (17.5)
