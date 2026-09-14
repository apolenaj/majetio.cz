# Location Intelligence — Service Layer & Performance

## Services

| Service | Role |
|---------|------|
| `LocationService` | Public location lookups (slug/id) → `PublicLocationDto` |
| `LocationMetricService` | Persist + `getPublicMetrics` / `getInternalMetrics` |
| `LocationMarketService` | Precomputed market summaries → `LocationMarketSummaryDto` |
| `LocationComparisonService` | Side-by-side comparison → `LocationComparisonDto` |
| `LocationIntelligenceService` | Property ↔ location facade (benchmarks + optional match) |

API requests **read** `LocationMetric` / `LocationMarketSnapshot` only. They must **not** aggregate millions of properties live.

## Public vs Internal

- **Public API** — published, non-review, safe aggregates. DTOs: `PublicLocationDto`, `LocationMarketSummaryDto`, `LocationComparisonDto`, `PublicMetricPointDto`.
- **Internal API** — source quality, unpublished drafts, diagnostics. DTO: `InternalLocationMetricDto`.

Public DTOs must never include:

- raw provider payloads
- exact private addresses / street-level coordinates (centroid rounded to ~100 m)

## Caching

Keys: `location + segment + period + methodology` via `buildMarketSummaryCacheKey` / `buildComparisonCacheKey`.

**Do not** put personalized Finanční pas / LocationMatchScore into shared cache (`assertNotSharedPersonalizedCache`).

## Background jobs (idempotent)

| Job | npm script | Idempotency |
|-----|------------|-------------|
| Metric aggregation | `npm run location:aggregate -- --period=2026-Q1` | same period + methodology → `SKIPPED_IDEMPOTENT` |
| Data refresh (STALE flags) | `npm run location:refresh -- --period=2026-Q1` | same |
| Anomaly check | `npm run location:anomaly-check -- --period=2026-Q1` | same |

Use `--force` to re-run. Keys: `buildLocationJobIdempotencyKey`.

Aggregation with empty observations is a structural no-op until producers feed observations into the ingestion pipeline.

## Indexes

Migration `20260720210000_location_performance_indexes`:

- `LocationMetric(locationId, metricKey, period)`, `calculatedAt`, `segmentKey+period`, `publishedAt`
- `Location(centroidLat, centroidLon)` — approximate geo; PostGIS GIST later
- `LocationMarketSnapshot(locationId, segmentKey, period)`

## Observability

`emitLocationTelemetry` logs job failures and query errors without PII or raw payloads. Register sinks via `registerLocationTelemetrySink`.
