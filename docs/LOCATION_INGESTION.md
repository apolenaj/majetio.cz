# Location Intelligence — Data Ingestion

## Pipeline

```
source → fetch → validate → normalize → aggregate → quality check → store → publish
```

Implemented in `src/domains/locations/ingestion/`.

## Models

| Model | Purpose |
|-------|---------|
| `LocationDataSource` | Registered feeds (official_public, licensed, partner, internal_derived, user_generated) |
| `LocationIngestionJob` | Pipeline run status + stage log |
| `LocationMetric` | + `confidence`, `sampleCount`, `sourceQuality`, `freshness` (STALE), `reviewRequired`, `fallbackFromLocationId`, `methodologyVersion` |
| `LocationMarketSnapshot` | Period snapshot of selected metrics + methodology versions |
| `DataQualityIssue` | Extended with optional `locationId` — **no parallel issue system** |

## Rules

1. Every derived metric stamps `methodologyVersion` (`location-ingestion.v2026.07`).
2. Outliers: soft IQR trim, **high-end segment preserved** between soft/hard fences.
3. Dedup by canonical key before aggregate.
4. Anomalies (price spike ≥80 %, sample collapse) → `reviewRequired` + DataQualityIssue.
5. Fallback hierarchy Neighborhood → City District → City → District — inherit real parent data only; UI message: „Data vycházejí z širší oblasti“. **Never invent values.**
6. Stale metrics via update-frequency TTL → `freshness: STALE`.

## Usage

```typescript
import { createLocationIngestionService } from "@/domains/locations";

const service = createLocationIngestionService();
await service.ensureRegisteredSources();
await service.runPipeline({
  dataSourceKey: "majetio_internal_aggregation",
  period: "2026-07",
  observations: [...],
});
```

## Service layer & CRON

See [LOCATION_SERVICES.md](./LOCATION_SERVICES.md) for public/internal DTOs, caching, idempotent CRON jobs (`location:aggregate`, `location:refresh`, `location:anomaly-check`), and performance indexes.
