# Model Governance

Valuation model lifecycle, shadow mode, safe rollback. Spec **166–177**, **233–239**.

## Lifecycle

```
DRAFT → REVIEW_REQUESTED → APPROVED → ACTIVE
                              ↑___________|
                         (rollback demotes ACTIVE → APPROVED)
```

- `TESTING` is a legacy alias of `REVIEW_REQUESTED`.
- Cannot jump `DRAFT` → `ACTIVE`.
- Cannot activate while `shadowMode` is on.

## Permissions

| Action | Key |
| --- | --- |
| Read / write draft | `analytics.models.read` / `.write` |
| Approve / activate | `analytics.models.approve` (sensitive) |

DATA_ADMIN may write models but **cannot** approve. OPERATIONS_ADMIN / ADMIN / SUPER_ADMIN may approve.

## Shadow mode

Background `MODEL_SHADOW_EVAL` job — evaluates without publishing. Forbidden on currently ACTIVE published model.

## Rollback

Requires `previousActiveModelId` on the ACTIVE model:

1. Demote current ACTIVE → APPROVED (+ `rolledBackAt`)
2. Restore previous → ACTIVE
3. `ModelGovernanceEvent` rows for both sides
4. Audit `admin.valuation.model.rollback`

Reason min. 12 characters.

## API / UI

- Domain: `src/domains/valuation/admin/control-center.ts`
- Pure helpers: `src/domains/valuation/admin/metrics.ts`
- `POST /api/admin/models/[id]/governance` — `transition` | `shadow` | `rollback` | `compare`
- Admin: `/admin/analyzy` (+ valuation subpages)
