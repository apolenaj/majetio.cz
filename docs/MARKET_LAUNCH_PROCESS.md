# MARKET_LAUNCH_PROCESS

Checklist for launching a new country market on Majetio (One Platform — Multiple Markets).

**Related:** [`INTERNATIONAL_TEST_PLAN.md`](./INTERNATIONAL_TEST_PLAN.md) · [`INTERNATIONAL_ARCHITECTURE.md`](./INTERNATIONAL_ARCHITECTURE.md) · [`SEO_PRIVACY_AND_CROSS_MARKET.md`](./SEO_PRIVACY_AND_CROSS_MARKET.md) · [`MARKET_CAPABILITIES.md`](./MARKET_CAPABILITIES.md)

## Principle

**New market = plugin + config**, not a Core fork. LIVE is gated by automated readiness checks (`assertMarketCanGoLive`).

```
PLANNED → RESEARCH → BETA → LIVE
                 ↑
     assertMarketCanGoLive / readiness checks
```

## Phase checklist

### 1. Plugin skeleton

- [ ] Folder `src/domains/markets/plugins/{code}/`
- [ ] Register in `plugins/index.ts`
- [ ] `MarketDefinition`: marketCode, countryCode, locales, currency, timezone, measurementSystem
- [ ] Capability Matrix entries (VALUATION, SEARCH, FINANCING, …)
- [ ] Bali-style regions only as `regions[]` under parent market (never new country code)

### 2. Data & taxonomy

- [ ] Property type aliases + layout conventions
- [ ] Typed extensions schema (if market-specific attrs)
- [ ] Import adapter stub (partner feed)
- [ ] `hasMinimumPublicData` only when real inventory exists — **no fake public listings**

### 3. Regulatory / tax / FX

- [ ] Regulatory pack version + ACTIVE rules via review flow (DRAFT → REVIEWED → ACTIVE)
- [ ] Tax provider config for market / taxRegion
- [ ] Transaction cost pack (not `planned` / `draft`)
- [ ] FX: local currency primary; display FX secondary + stale handling

### 4. Legal & privacy (required for LIVE)

- [ ] Current `PRIVACY_POLICY` in privacy registry
- [ ] Current `TERMS_OF_USE` for market
- [ ] Consent recipients named for market
- [ ] Localized legal copy APPROVED (human review) — no machine-only legal

### 5. Financing & valuation

- [ ] Financing provider registry entry (or explicit MANUAL / UNAVAILABLE)
- [ ] Valuation model READY **or** Capability = NOT_AVAILABLE + polite UI
- [ ] HypotekaJasne remains CZ-only

### 6. Commerce & entitlements

- [ ] Local PricingPlan prices (not FX-converted from CZK)
- [ ] Products with explicit `marketScope` (no accidental global unlock)
- [ ] Org onboarding: `marketCode`, `marketCoverage`, `serviceType`

### 7. SEO & i18n

- [ ] Locale catalogs + fallback EN → CS
- [ ] hreflang / canonical for host (majetio.cz vs .com)
- [ ] Programmatic SEO only with citable data sources
- [ ] Cache keys include market + locale + currency

### 8. Ops controls

- [ ] Kill switches tested (listings / valuations / lead routing / review_required)
- [ ] Admin `/admin/trhy` shows Capability Matrix + UI states
- [ ] Stale regulation scan → `review_required`

### 9. Automated readiness (QA barrier)

Run:

```ts
evaluateMarketLaunchReadiness("XX")
assertMarketCanGoLive("XX") // throws if blocked
```

Required public checks include:

| Check | Purpose |
| --- | --- |
| `property_data` | Minimum public inventory |
| `regulatory_pack` | Active rules |
| `privacy_legal_docs` | Current privacy (+ terms for LIVE) |
| `transaction_costs` | Non-draft pack |
| `seo_data_coverage` | Citable sources |
| `launch_flags` | enabled + BETA/LIVE intent |
| `currency_configured` | Default currency present |
| `terms_of_use` | Current terms (LIVE) |

**LIVE is forbidden** while any required check fails.

### 10. Test gate before LIVE

- [ ] Isolation tests (CZ ↛ AE)
- [ ] i18n fallback
- [ ] E2E Majetio.cz regression green
- [ ] International synthetic demos exist for QA but are **PRIVATE / isDemo**
- [ ] No public fake listings for the new market

## Rollout

1. `launchStatus = BETA`, `enabled = true`, limited traffic
2. Monitor kill switches + data quality
3. `assertMarketCanGoLive` → `launchStatus = LIVE`
4. Announce on majetio.com market selector only when publicly active

## Anti-patterns

- Deriving market from currency (EUR ≠ ES)
- Copy-pasting Core per country
- Shipping legal machine translation
- Setting LIVE without privacy/terms
- Publishing synthetic demos as public inventory
