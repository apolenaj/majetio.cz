# Property vs location — percentiles, risks, watch

## Percentiles (property detail)

- `purchasePricePercentile` / `rentPercentile` on `PropertySegmentBenchmark`
- Shown only when `sampleCount ≥ 30` and `confidence ≥ 0.55` (`MIN_PERCENTILE_SAMPLE`)
- Otherwise fields are `null` and UI hides them
- Distribution bands: `LocationPageProfile.segmentDistributions`

## Market opportunity insight

`buildMarketOpportunityInsight` — Czech sentence from valid percentiles only (e.g. upper/lower quartile). No filler copy.

## Location → Risk Engine

`buildLocationRiskFacts` emits:

- `low_liquidity`, `declining_rent_trend`, `declining_price_trend`
- `high_supply_growth`, `low_sample_confidence`
- `high_price_volatility`, `development_pipeline_pressure`
- `str_regulatory_restriction`

Mapped into `PropertyRisksSection` + re-exported from `investment/engine/risk` via `locationFactsForRiskEngine` (annotation only — does not change cash-flow math).

## Market context

`buildLocationMarketContextBlock` — development units, price volatility (CV of series), seasonality **only if tagged on profile** (never stereotyped).

## STR + regulatory foundation

`buildStrRegulatoryContext` — tourism demand / occupancy and STR regulation level when `shortTermRentalContext` / `regulatoryContext` exist on the profile.

## Watched locations (dashboard)

- Prisma `WatchedLocation` + alert types `LOCATION_WATCH_CREATED`, `LOCATION_METRIC_CHANGE`
- Actions: `watchLocationAction` / `unwatchLocationAction`
- UI: `WatchLocationButton` on property location section
- Dashboard card „Sledované lokality“ reuses notification / alert event path
