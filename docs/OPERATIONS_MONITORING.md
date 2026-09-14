# Operations Monitoring

System health, jobs/DLQ, repair enqueue. Spec **139–150**, **166–177**, **233–239**.

**Canonical ops docs (Phase 5):** `docs/OBSERVABILITY.md` · `docs/PRODUCTION_RUNBOOK.md` · `docs/LAUNCH_MONITORING_PLAN.md`

## Health

| Endpoint | Auth | Role |
| --- | --- | --- |
| `GET /api/health` | Public | **Liveness** — process up; safe integration snapshot only |
| `GET /api/ready` | Public | **Readiness** — Postgres `SELECT 1`; 503 when DB down |
| `GET /api/admin/health` | `ops.health.read` | Deep probes: DB, queue, payments, search, providers |

Statuses (admin): `UP` | `DEGRADED` | `DOWN` | `UNKNOWN`. Overall = worst component.

UI: `/admin/monitoring`

Alert thresholds + synthetics: `src/domains/operations/monitoring/alert-rules.ts` · `docs/DISASTER_RECOVERY.md`

Correlation: every response includes `x-request-id` (middleware). Pass into `SystemJob.correlationId` / logger fields. Client error UI shows digest + last request id (`RequestIdCapture`).

Support taxonomy + HTTP p95 / error-rate baselines: `src/domains/operations/support/support-taxonomy.ts` · `docs/PHASE4_CODE_HEALTH_AUDIT.md`

## Jobs & DLQ

Prisma `SystemJob` + `SystemJobDeadLetter`

```
QUEUED → RUNNING → SUCCEEDED
                 → RETRYING → FAILED → DEAD_LETTER
```

| Endpoint | Permission |
| --- | --- |
| `GET /api/admin/jobs` | `ops.jobs.read` |
| `GET /api/admin/jobs?dlq=1` | `ops.jobs.read` |
| `POST /api/admin/jobs/tick` | `ops.jobs.write` |
| `POST /api/admin/jobs/dlq/[id]/requeue` | `ops.jobs.write` |

Rate limit: starts per minute per `rateLimitKey`. Max 100 property IDs per job payload.

## Repair

`POST /api/admin/repair/recalculate` (`ops.repair.write`) → **202 Accepted**, enqueues `PROPERTY_RECALC` / `PROPERTY_EVALUATION`. Does not block on batch work.

## Internal metrics (dashboard)

From real tables only:

- Dataset completeness (avg latest scores)
- Job error rate 24h
- Queue age (oldest QUEUED/RETRYING)

Missing samples → empty state.
