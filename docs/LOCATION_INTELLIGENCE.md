# Location Intelligence — Overview

Majetio **Location & Market Intelligence Engine** provides geographic hierarchy, market metrics, scoring, property comparison, maps, and SEO-safe location pages.

## Status

**Module complete (Prompt 14).** Do not continue into Prompt 15 in this track — Prompt 15 follows separately.

## Architecture (layers)

```
Public pages (/lokality/…)
  → LocationService / LocationMarketService / LocationIntelligenceService
    → Precomputed LocationMetric + LocationMarketSnapshot (never live property rollups)
      ← Background jobs (aggregation, refresh, anomaly)
        ← Ingestion pipeline (source → validate → aggregate → quality → store)
```

## Synthetic demos (not production)

| Slug | Tier | Notes |
|------|------|--------|
| `praha` | high | Full metrics, distributions |
| `brno` | medium-high | Full metrics, no STR data |
| `praha-vinohrady` | high | Nested URL `/lokality/praha/vinohrady` |
| `liberec` | low | Thin samples — exercises noindex / suppress |

All demos set `isDemo: true` and are **noindex**. Never present them as live market feeds.

## Key packages

| Path | Role |
|------|------|
| `src/domains/locations/` | Domain services, metrics, scoring, SEO, maps, watch |
| `src/components/locations/` | UI |
| `src/app/(public)/lokality/` | Routes |
| `docs/LOCATION_*.md` | Documentation set |

## Related docs

- [LOCATION_DATA_MODEL.md](./LOCATION_DATA_MODEL.md)
- [LOCATION_HIERARCHY.md](./LOCATION_HIERARCHY.md)
- [LOCATION_METRICS.md](./LOCATION_METRICS.md)
- [LOCATION_INGESTION.md](./LOCATION_INGESTION.md)
- [LOCATION_SCORING.md](./LOCATION_SCORING.md)
- [LOCATION_SERVICES.md](./LOCATION_SERVICES.md)
- [LOCATION_FRONTEND.md](./LOCATION_FRONTEND.md)
- [LOCATION_INTEGRATION.md](./LOCATION_INTEGRATION.md)
- [LOCATION_ANTI_PATTERNS.md](./LOCATION_ANTI_PATTERNS.md)
- [LOCATION_INTELLIGENCE_FINAL_REPORT.md](./LOCATION_INTELLIGENCE_FINAL_REPORT.md)
