# Data Quality Center

DQ issue workflow for ops. Permissions: `dataQuality.read` / `dataQuality.resolve`.

## Categories

`MISSING` · `CONFLICT` · `ANOMALY` · `STALE` · `DUPLICATE`  
(see `src/domains/data-quality/admin/taxonomy.ts`)

## Workflow statuses

`OPEN` → `IN_REVIEW` → `RESOLVED` | `FALSE_POSITIVE`

- Resolve / false-positive require reason ≥ 8.
- Sets `resolvedAt` / `resolvedByUserId` / `resolutionReason`.
- Audit: `admin.dq.{status}`

## Surfaces

| Route | Role |
| --- | --- |
| `/admin/data-quality` | Queue + filters |
| Attention queue | `dq_critical` CRITICAL open items |

## Related

- Import pipeline: `docs/IMPORT_PIPELINE.md`, `docs/IMPORT_OPERATIONS.md`
- Broader DQ engine notes: `docs/DATA_QUALITY_PIPELINE.md`

## Tests

Flow **267**: OPEN → IN_REVIEW → RESOLVED with audit trail.
