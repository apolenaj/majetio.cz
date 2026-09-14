# Database Performance — Majetio.cz

**Owner:** Data / SRE  
**Last verified:** 2026-07-22 (Phase 5)  
**Schema:** `prisma/schema.prisma` (~450 `@@index` / `@@unique` declarations)  
**Related:** `docs/SCALABILITY_RISKS.md` · `docs/PRODUCTION_RUNBOOK.md` · Phase 3 retention notes

---

## 1. Engine & access

| Item | Reality |
| --- | --- |
| DBMS | PostgreSQL |
| ORM | Prisma Client |
| Prod Prisma logs | `error` only |
| Connection pooling | Provider-dependent (Neon pooler / PgBouncer) — **not configured in app code** |

---

## 2. Hot paths (application)

| Path | Tables (typical) | Notes |
| --- | --- | --- |
| Search / discovery | `Property`, sources, media | Filter + sort; keep pagination |
| Property detail | `Property` + relations | Avoid over-include |
| Checkout | `Order`, `Payment`, `Promotion*` | Transaction + atomic promo claim |
| Webhooks | `PaymentWebhookEvent`, `Payment`, `Order`, entitlements | Unique `(provider, eventId)` + `processedAt` claim |
| Auth | `User`, `Session`, `VerificationToken` | Expired rows need cleanup job |
| Admin DQ / merge | DQ issues, duplicate candidates, merge events | Claim `PENDING` → `MERGED` |
| Jobs | `SystemJob`, `SystemJobDeadLetter` | Indexes on status/scheduledAt |
| Analytics metrics | Listing metrics / admin aggregates | Can grow fast |

---

## 3. Index posture

- Schema defines many `@@index` / `@@unique` — good baseline.  
- **No** automated `EXPLAIN` suite in CI.  
- Before launch: review slow-query log on staging with realistic data volume.

### Critical uniqueness (concurrency)

| Constraint / pattern | Why |
| --- | --- |
| `PaymentWebhookEvent (provider, eventId)` | Idempotent webhooks |
| `Order.idempotencyKey` | Checkout double-submit |
| `Favourite (userId, propertyId)` | Toggle races |
| Promo `redemptionCount` conditional update | Cap enforcement |

---

## 4. Retention & bloat

| Artefact | Cleanup |
| --- | --- |
| Expired `Session` / `VerificationToken` | `npm run db:cleanup-retention` |
| Processed webhook events | Default 90d (env override) |
| Finished `SystemJob` | Default 30d |
| Requeued DLQ | Default 90d |
| Listing boosts | `npm run boosts:expire` |

**Gap:** cleanup **not** scheduled in GitHub Actions (only revenue reconcile is). Without cron, tables grow unbounded.

---

## 5. Backup & restore impact on perf

- Restore to **new** instance; cutover `DATABASE_URL` (`docs/DISASTER_RECOVERY.md`).  
- After restore, rebuild stats / vacuum per provider guidance (ops, not in app).

---

## 6. Audit status

| Check | Status |
| --- | --- |
| Indexes present in schema | PASS |
| Retention script exists | PASS |
| Retention scheduled | **FAIL** |
| Prod slow-query baseline | **NOT EXECUTED** |
| Connection pool tuned | **N/A** / provider-specific |
