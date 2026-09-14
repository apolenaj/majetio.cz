# Location Intelligence — Ecosystem Integration

How Location Engine connects to Property Detail, Valuation, Investment, Search, Opportunity pages, and Market Alerts.

## Architecture

```
domains/locations/integration/
  property-segment-benchmark.ts   Property vs segment median
  valuation-context.ts          Valuation supplementary context
  investment-benchmark.ts         Suggested rent/yield/vacancy (never overwrite)
  search-market-filters.ts        URL filters + coverage gate
  market-opportunities/registry.ts  Data-driven rankings with methodology
  market-alerts/events.ts         Webhook event contract
  location-integration-service.ts Orchestrator
```

## 1. Property Detail — sekce Lokalita

**Service:** `resolveLocationIntelligenceForProperty()`

Compares property price/m² to **segment median** (same property type + layout + market age).

- Suppressed when sample below threshold (not 0)
- Link to `/lokality/[slug]`

**Component:** `PropertyLocationSection` — props `segmentBenchmark`, `locationPageHref`

## 2. Valuation Engine

**Contract:** `ValuationLocationContext` → `PublicValuationDto.locationMarketContext`

- Role: `market_context` only — **does NOT replace comparables**

## 3. Investment Engine

**Contract:** `InvestmentLocationBenchmark` — benchmark suggestions only, never overwrites user inputs.

## 4. Search filters

URL params (gated by ≥40 % coverage): `cenova-hladina`, `vynos-benchmark`, `cenovy-trend`

## 5. Market Opportunity pages

Route: `/lokality/prilezitosti/[slug]` — registry with explicit goal + methodology. Clickbait rankings forbidden.

## 6. Market Alerts

Events: `location.price_trend.changed`, `location.supply.spike`, etc. Webhook via `dispatchToWebhook()`.
