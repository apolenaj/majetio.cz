# Domain: locations

Location & Market Intelligence — geographic hierarchy, boundaries, resolution.

## Structure

```
domains/locations/
  types/hierarchy.ts              LocationType ordering (CZ-aware)
  schemas/address-input.ts        Zod input + resolution result
  metrics/
    registry.ts                   LocationMetricRegistry (categories + keys)
    segment.ts                    Segment encode/decode (type, age, layout)
    statistics.ts                 Median, quartiles, DOM trimming
    confidence.ts                 Sample thresholds → display/confidence
    trends.ts                     MoM / QoQ / YoY, trailing 3/12m
    liquidity.ts                  Listings, DOM, price cuts, rent turnover
    location-metrics.test.ts
  service/
    normalize.ts                  Address normalization + max assignable type
    geospatial.ts                 GeoJSON / PostGIS abstraction
    location-repository.ts        Prisma repository
    location-resolution-service.ts  Core resolver
    property-location-assignment.ts Persist Property.locationId
    location-metric-aggregation-service.ts  Raw obs → segmented metrics
    location-metric-service.ts    Persist + history + trends read API
    location-resolution-service.test.ts
  ingestion/
    sources.ts · pipeline.ts · outlier-filter.ts · dedupe.ts
    anomalies.ts · fallback.ts · quality.ts · snapshot.ts · service.ts
  index.ts
```

## Usage

```typescript
import {
  LocationResolutionService,
  createPrismaLocationRepository,
  assignPropertyLocation,
  createLocationIngestionService,
} from "@/domains/locations";

const service = new LocationResolutionService({
  repository: createPrismaLocationRepository(),
});

const result = await service.resolveForProperty({
  countryCode: "CZ",
  cityName: "Praha",
});

await assignPropertyLocation({
  propertyId: "...",
  cityName: "Praha",
});

const ingestion = createLocationIngestionService();
await ingestion.ensureRegisteredSources();
await ingestion.runPipeline({
  dataSourceKey: "majetio_internal_aggregation",
  period: "2026-07",
  observations: [],
});
```

## Docs

- [LOCATION_DATA_MODEL.md](../../docs/LOCATION_DATA_MODEL.md)
- [LOCATION_INGESTION.md](../../docs/LOCATION_INGESTION.md)

Do not put financial calculations in React components.
