# Location Hierarchy

## Levels (CZ-aware)

```
COUNTRY → REGION → DISTRICT → MUNICIPALITY
  → CITY (optional) → CITY_DISTRICT → NEIGHBORHOOD → MICRO_LOCATION
```

Not every level exists everywhere. Rural municipalities may skip CITY / CITY_DISTRICT / NEIGHBORHOOD / MICRO_LOCATION.

## Rules

1. **Never inflate** — address input „Praha“ alone → at most `CITY`, never invent a neighborhood.
2. **Parent chain** — `Location.parentId` self-relation; resolution walks upward for fallbacks.
3. **Canonical URLs** — nested paths `/lokality/praha/vinohrady`; flat aliases 308 → canonical.
4. **Fallback for thin metrics** — Neighborhood → City District → City → District; inherit **real** parent aggregates only; UI: „Data vycházejí z širší oblasti.“

## Resolution

- `LocationResolutionService` — normalize address, match hierarchy, confidence (`EXACT` … `UNKNOWN`)
- `assignPropertyLocation()` — persist `property.locationId` without over-precision

## Types

Enum `LocationType` in Prisma. Rank helpers: `locationTypeRank`, `isFinerType` in `types/hierarchy.ts`.

## Demos

| Location | Type | Path |
|----------|------|------|
| Praha | CITY | `/lokality/praha` |
| Vinohrady | NEIGHBORHOOD | `/lokality/praha/vinohrady` |
| Brno | CITY | `/lokality/brno` |
| Liberec | CITY | `/lokality/liberec` (thin / low confidence) |
