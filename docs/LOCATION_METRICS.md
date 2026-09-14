# Location Metrics Catalog

Methodology version: `location-metrics.v2026.07`  
Registry: `src/domains/locations/metrics/registry.ts`

**Rules:** asking ≠ transaction (never merged). Segment never blended. Median is primary for prices. Missing → `null` / suppress — never fake `0`.

## Core metrics

| Metric key | Source | Aggregation | Min sample | Suppress below | Limits |
|------------|--------|-------------|------------|----------------|--------|
| `property_market.median_asking_price_sqm` | Listing feeds / internal | Median of Kč/m² asking, segment-scoped | 15 | 8 | Asking only; IQR outlier trim, high-end preserved |
| `property_market.mean_asking_price_sqm` | Same | Mean (supplementary) | 15 | 8 | Always shown beside median, never alone as headline |
| `property_market.median_transaction_price_sqm` | Transaction / notarial feeds | Median Kč/m² | 15 | 8 | Separate `priceKind=TRANSACTION` |
| `property_market.active_listings_count` | Listing snapshot | Count | 1 | 1 | Supply proxy |
| `property_market.median_days_on_market` | Listing lifecycle | Median DOM, 5–95% trim | 10 | 5 | Outlier days trimmed |
| `property_market.price_reduction_rate` | Listing price history | Rate / share | 15 | 8 | Share with reduction |
| `rental_market.median_asking_rent_sqm` | Rental listings | Median Kč/m²/měs. | 15 | 8 | Asking rents only |
| `rental_market.rent_listings_turnover` | Rental feed | Rate | 10 | 5 | Optional |
| `investment.gross_rental_yield` | Derived asking price + rent pairs | Median of pair yields | 15 | 8 | Gross only; not net |
| `infrastructure.transit_score` | POI proximity (Majetio) | Index 0–100 | n/a | n/a | Not Walk Score / licensed index |
| `development.units_under_construction` | Permit / developer feeds | Count | 1 | 1 | Pipeline pressure signal |

## Percentiles (property vs location)

| Field | Source | Aggregation | Min sample | Limits |
|-------|--------|-------------|------------|--------|
| Purchase price percentile | Segment distribution p25/p50/p75 | Piecewise linear rank | **30** | Confidence ≥ 0.55; else hide |
| Rent percentile | Same for rent band | Same | **30** | Requires property rent Kč/m² |

## Confidence

`resolveMetricConfidence(sampleCount, definition)` → display flag + 0–1 confidence. UI suppresses when `display=false`.

## Trends

MoM / QoQ / YoY / trailing computed **per segment** from `LocationMetricHistory` — never cross-segment.

## Demo confidence tiers

| City | Tier | Intent |
|------|------|--------|
| Praha | high | Full UI |
| Brno | medium-high | Full UI, no STR |
| Liberec | low | Thin-page / suppress QA |
