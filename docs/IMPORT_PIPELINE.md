# Import Pipeline

Property data enters Majetio through adapters → a pure ingest pipeline → idempotent `ImportJob` / `ImportJobItem` persistence.

## Stages

1. **Ingest** — adapter parses vendor payload  
2. **Validate** — required fields / shape  
3. **Sanitize** — strip unsafe / PII-heavy text  
4. **Normalize** — units, currency, canonical key / slug  
5. **Detect duplicates** — similarity scoring (`dedupe-score`)  
6. **Canonical update plan** — create/update with field overrides respected  

Implementation: `src/domains/property-sources/service/pipeline.ts`.

## Job statuses (ops labels)

| Ops UI | DB enum (compat) |
|--------|------------------|
| `QUEUED` | `QUEUED` or legacy `PENDING` |
| `RUNNING` | `RUNNING` |
| `SUCCEEDED` | `SUCCEEDED` |
| `COMPLETED_WITH_WARNINGS` | `COMPLETED_WITH_WARNINGS` or legacy `PARTIAL` |
| `FAILED` | `FAILED` |
| `CANCELLED` | `CANCELLED` |

Finalize helper: `finalizeOpsImportJobStatus` / `finalizeImportJobStatus`.

## Idempotency (no duplicate Properties)

- **Job key:** `job:{provider}:{runKey}` via `buildJobIdempotencyKey`  
- **Item key:** `provider:ext:{externalId}` or `provider:hash:{sha256}` via `buildItemIdempotencyKey`  
- Same payload / external id → same item key → workers **skip** already-`SUCCEEDED` items (`markIdempotentSkip`)  
- `PropertySource @@unique([provider, externalPropertyId])` prevents duplicate source rows  

### Retry failed job (admin)

`retryFailedImportJob` **resets FAILED items in place** to `PENDING` and re-queues the same job as `QUEUED`.

- Does **not** mint new item idempotency keys  
- `SUCCEEDED` items stay `SUCCEEDED`  
- Audit: `admin.import.retry`  

Admin UI: `/admin/importy`, drilldown `/admin/importy/[id]`.

## Source governance gate

Before applying a feed, workers should call `mayImportFromSource`:

- Provider `DataSourceProviderConfig.importEnabled === false` → skip  
- `healthStatus === DISABLED` or expired `licenseExpiresAt` → skip  
- Per-row `PropertySource.importEnabled` / `healthStatus` overrides  

See also: `docs/DATA_QUALITY_PIPELINE.md`, Source Management at `/admin/zdroje`.
