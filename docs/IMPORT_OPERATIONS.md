# Import Operations

Admin import jobs and retry. Permissions: `import.read` / `import.retry`.

## Surfaces

| Route | Purpose |
| --- | --- |
| `/admin/importy` | Job list |
| `/admin/importy/[id]` | Job detail / items |
| `/admin/zdroje` | Property sources / providers |

## Attention signals

Failed / partial jobs feed Operations Attention Queue (`import_failed`, `import_partial`) — severity CRITICAL/HIGH.

## Retry & repair

- Retry requires `import.retry` (DATA_ADMIN+).
- Bulk recalculation goes through job queue (`ops.repair.write`) — rate limited, async.

## Fixtures (tests)

`failedImport` in admin ops fixtures — processed/success/error counts + failed items for realistic attention signals.

## Related

`docs/IMPORT_PIPELINE.md` — pipeline stages and status presentation.
