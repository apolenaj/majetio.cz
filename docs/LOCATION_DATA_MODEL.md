# Location Data Model — Majetio.cz

Geographic foundation for **Location & Market Intelligence Engine**. Extends the existing Prisma `Location` model (no duplicate entity).

## Hierarchy (CZ-aware)

```
Country → Region (kraj) → District (okres) → Municipality (obec)
  → City (město, optional) → City_District (městská část)
  → Neighborhood (čtvrť) → Micro_location
```

Not every level exists everywhere. Rural obec may skip `CITY`, `CITY_DISTRICT`, `NEIGHBORHOOD`, and `MICRO_LOCATION`.

## Location entity

| Field | Purpose |
|-------|---------|
| `type` | `LocationType` enum |
| `parentId` | Self-referential hierarchy |
| `countryCode` | ISO 3166-1 alpha-2 (`CZ`) |
| `name`, `slug`, `publicLabel` | Canonical + display |
| `officialCode` | Primary admin code |
| `ruianCode` | RÚIAN (obec, cast, …) |
| `lauCode` | LAU (CZ0100, …) |
| `nutsCode` | NUTS (CZ010, …) |
| `latitude`, `longitude` | Representative point |
| `centroidLat`, `centroidLon` | Polygon centroid |
| `boundary` | GeoJSON Polygon/MultiPolygon (JSONB) |
| `boundaryFormat` | `GEOJSON` now, `POSTGIS` when extension enabled |
| `population`, `areaSqKm` | Market intelligence aggregates |

Legacy denormalized fields (`region`, `district`, `city`, `publicName`, `country`) remain for backward compatibility.

## Property linkage

| Field | Purpose |
|-------|---------|
| `locationId` | Most precise **allowed** canonical location |
| `locationResolutionConfidence` | `EXACT` … `UNKNOWN` |
| `locationResolutionMeta` | Resolver audit (warnings, hierarchy ids) |

Rule: **never inflate** — input „Praha“ alone → `CITY` at most, never `NEIGHBORHOOD` / `MICRO_LOCATION`.

## Geospatial strategy

1. **Now:** GeoJSON in `boundary` JSONB + pure TS point-in-polygon (`geospatial.ts`)
2. **Later:** `CREATE EXTENSION postgis`; add `boundaryGeom geometry(MultiPolygon, 4326)` (see migration comment)

## Services

- `LocationResolutionService` — normalize address, match hierarchy, confidence
- `assignPropertyLocation()` — resolve + persist on `Property`
- `createPrismaLocationRepository()` — Prisma data access
- `LocationMetricRegistry` — canonical metric keys by category (`src/domains/locations/metrics/registry.ts`)
- `LocationMetricAggregationService` — raw observations → segmented aggregates (never mix asking/transaction or cross-segment averages)
- `LocationMetricService` — persist metrics, append history, read trends

## LocationMetric model

Each row is one **metric × location × period × segment × priceKind** snapshot.

| Field | Purpose |
|-------|---------|
| `metricKey` | Registry key, e.g. `property_market.median_asking_price_sqm` |
| `category` | `PROPERTY_MARKET`, `RENTAL_MARKET`, `INVESTMENT`, `INFRASTRUCTURE`, `DEVELOPMENT` |
| `priceKind` | `ASKING`, `TRANSACTION`, or `NONE` — asking and transaction prices are never merged |
| `segmentKey` / `segment` | Property type, new/secondary, layout — no blended averages |
| `value` | Primary statistic (median for price metrics) |
| `meanValue`, `lowerQuartile`, `upperQuartile` | Supplementary price distribution |
| `sampleCount` | Observation count; drives confidence and display suppression |
| `confidence` | 0–1; below threshold → hide in UI |
| `methodologyVersion` | e.g. `location-metrics.v2026.07` |
| `calculatedAt`, `validFrom`, `validTo` | Temporal validity |

## LocationMetricHistory

Append-only time series feeding trend charts. Same dimensional keys as `LocationMetric` without replacing prior points.

Trends (MoM, QoQ, YoY, trailing 3/12m) are computed segment-wise in `metrics/trends.ts` — composition changes invalidate cross-segment comparison.

## Liquidity proxies

- Active listings count (supply)
- Median days on market with percentile trimming (5th–95th) — no blind averaging of DOM outliers
- Price reduction rate (demand pressure)
- Rent listings turnover

## References

- `docs/DATABASE_DESIGN.md` — Property location split (public vs internal)
- `docs/SYSTEM_ARCHITECTURE.md` — `locations` domain module
