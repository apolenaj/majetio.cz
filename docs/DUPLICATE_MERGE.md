# Duplicate Merge

Non-destructive property merge. Permission: `property.merge` (sensitive step-up).

## Flow

```
PENDING candidate
    → Merge preview (dry-run)     # no writes
    → reason + CONFIRM_ACTION
    → executePropertyMerge        # transaction
    → MERGED + PropertyMergeEvent
    → optional revert foundation
```

## Rules

1. **Never hard-delete** the secondary property.
2. Secondary → `ARCHIVED` + `PRIVATE`; sources may re-point to canonical.
3. Preview required mentally/UI before execute (`AdminDryRunPreviewPanel`).
4. Field plan from trust tiers + locked overrides (`planNonDestructiveMerge`).
5. Full plan + secondary snapshot stored on `PropertyMergeEvent` for undo path.

## API

- `previewPropertyMerge` / `executePropertyMerge` / `revertPropertyMerge`
- Server actions: `adminPreviewMergeAction`, `adminExecuteMergeAction`
- UI: `/admin/nemovitosti/duplikaty`

## Tests

E2E simulation **268** in `admin-e2e-operations-267-272.test.ts` — preview → execute → ARCHIVED secondary.
