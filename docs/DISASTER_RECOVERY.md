# Disaster Recovery — Majetio.cz

**Owner:** SRE / Release Manager  
**Last verified against code:** 2026-07-22 (Phase 5)  
**Related:** `docs/PRODUCTION_RUNBOOK.md` · `docs/RELEASE_PROCESS.md` · `docs/RELIABILITY_TEST_MATRIX.md` · `docs/OPERATIONS_MONITORING.md` · `docs/INCIDENT_MANAGEMENT.md` (if present)  
**Alert catalogue:** `src/domains/operations/monitoring/alert-rules.ts`

---

## 1. Objectives (RTO / RPO targets)

| Scenario | RPO (data loss) | RTO (restore service) | Primary owner |
| --- | --- | --- | --- |
| Postgres total loss | ≤ 24h (managed backup cadence) | ≤ 4h | SRE |
| Corrupt property import | 0 for ledger; listings re-importable | ≤ 2h (quarantine + rollback) | Data |
| Payment provider outage | 0 (orders stay `AWAITING_PAYMENT`) | Degrade checkout; no mock in prod | Commerce |
| HypotekaJasne outage | 0 (leads queued / retry scripts) | Fail-soft UI | Financing |
| App / region outage | N/A | ≤ 1h (redeploy) | SRE |
| Email provider | N/A today | **ABSENT** — no live sender; DR N/A until wired | Ops |

Targets assume **managed Postgres backups** + object storage for uploads. Vendor SLAs are not contracted in-repo.

---

## 2. Scenario A — Database loss

### Symptoms
- `GET /api/ready` → **503** `not_ready`
- Admin health `DATABASE=DOWN`
- Data routes 500

### Immediate actions
1. Page oncall — alert `health.database_down` (dedupe 10m).
2. Do **not** run `prisma migrate reset` or destructive SQL on production.
3. Confirm provider status; pick restore point.
4. Restore latest verified backup to a **new** instance; validate:
   - `npx prisma migrate status`
   - `GET /api/ready` → 200
   - Smoke: login, `/cenik`, one property detail, `/admin/monitoring`
5. Point `DATABASE_URL` at restored instance; redeploy.
6. `npm run revenue:reconcile` (dry-run) before `--repair`.
7. `npm run db:cleanup-retention -- --dry-run` optional after restore.

### Data classes

| Class | Restore note |
| --- | --- |
| Users / sessions / consents | DB backup |
| Orders / payments / entitlements / `RevenueEvent` | DB + reconcile vs PSP (when live) |
| Property inventory | DB + re-import jobs if needed |
| Uploads (KYC keys) | Object storage — verify keys still resolve |
| Webhook event log | DB; retention job may have pruned old rows |

---

## 3. Scenario B — Corrupt data import

### Symptoms
- Spike in DQ `CRITICAL` / duplicate candidates
- Wrong prices on discovery
- `SystemJob` → `FAILED` / `DEAD_LETTER`
- Alert `import.job_dlq`

### Immediate actions
1. Stop further import ticks (`ops.jobs.write` / disable cron).
2. Open incident with `correlationId` from `SystemJob`.
3. Quarantine: non-public listings / moderation.
4. Prefer compensating fixes over DELETE cascades.
5. Requeue DLQ only after root-cause fix (`POST /api/admin/jobs/dlq/[id]/requeue`).
6. Never ad-hoc `DELETE FROM Property` without backup snapshot.

---

## 4. Scenario C — Provider outages

### Payments (PSP)
| Step | Action |
| --- | --- |
| Detect | `payments.failed_burst` / webhook silence |
| Mitigate | Honest outage copy; **do not** grant entitlements on client redirect; optional `kill.payments` |
| Recover | Webhooks catch up; reconcile |
| Forbidden | Switching to mock PSP on live production |

**Code reality:** only `none` | `mock` providers exist. Live PSP outage playbook applies **after** a real provider is wired.

### HypotekaJasne
| Step | Action |
| --- | --- |
| Detect | Lead submit failures; external probe DEGRADED |
| Mitigate | Retry script `hj:retry-submissions`; UI fail-soft |
| Forbidden | Enabling mock adapter as “production” |

Default factory uses **dev adapter** until `HYPOTEKAJASNE_ENABLED` + live credentials.

### Email / transactional
| Step | Action |
| --- | --- |
| Reality | Production send path is effectively a **no-op** (Phase 1) |
| Mitigate | Do not promise delivery; fix provider before launch |
| Recover | Wire real provider; then retry jobs with maxAttempts caps |

### Object storage
| Step | Action |
| --- | --- |
| Detect | KYC upload/register failures |
| Mitigate | Block new uploads |
| Recover | Provider restore / re-upload |

---

## 5. Maintenance mode (chaos / planned)

| Control | Mechanism |
| --- | --- |
| Env | `MAINTENANCE_MODE=true` |
| Behaviour | Middleware returns 503 HTML for public traffic |
| Bypass | `/api/ready`, `/api/health`, `/admin`, `/prihlaseni`, `/api/auth`, static |
| Payments | `create-order` also refuses when maintenance or `kill.payments` engaged |

---

## 6. Alerting & synthetics

### Rules (code = SoT)
`ALERT_RULES` in `src/domains/operations/monitoring/alert-rules.ts`:

- Payment failure burst / webhook forgery
- Import DLQ
- Auth lockout burst / login outage
- DB / overall health DOWN
- Revenue reconcile workflow failure

**Dedup:** `shouldEmitAlert(fingerprint, dedupeWindowMin)`.

### Synthetic monitors (`SYNTHETIC_CHECKS`)
Configure in uptime vendor:

1. `/api/health` every 1m  
2. `/api/ready` every 1m (page on 2 consecutive failures)  
3. `/`, `/prihlaseni`, `/cenik` every 5m  

### Error tracker
- Adapter: `src/lib/observability/error-tracker.ts`
- Prod: **noop** until `ERROR_TRACKER_WEBHOOK_URL=https://…`
- No Sentry SDK in dependencies

---

## 7. Correlation

| Layer | Mechanism |
| --- | --- |
| HTTP | Middleware `x-request-id` |
| Client errors | Digest + last request id (`RequestIdCapture`, error UI) |
| Logs | `logger.withCorrelation` |
| Jobs | `SystemJob.correlationId` |
| Mortgage leads | Domain `correlationId` (`ml_…`) |

---

## 8. Communications template (SEV1)

```
Status: Investigating | Identified | Monitoring | Resolved
Impact: <checkout | login | discovery | all>
Started: <ISO>
Correlation: <x-request-id / incident id>
Next update: <time>
```

User-facing: honest status — no fake “all systems operational.”

---

## 9. Post-incident

1. Timeline with correlation ids  
2. Root cause + blast radius  
3. Action items (code / cron / runbook)  
4. Update this doc if RTO/RPO or playbooks changed  

Reliability exercises: `docs/RELIABILITY_TEST_MATRIX.md`.
