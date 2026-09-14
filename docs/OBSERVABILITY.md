# Observability — Majetio.cz

**Owner:** SRE  
**Last verified against code:** 2026-07-22 (Phase 5)  
**Related:** `docs/OPERATIONS_MONITORING.md` · `docs/DISASTER_RECOVERY.md` · `docs/ANALYTICS_FUNNELS.md` · `docs/LAUNCH_MONITORING_PLAN.md`

---

## 1. Logs

| Source | Behaviour |
| --- | --- |
| `src/lib/security/logger.ts` | Structured JSON; `debug` suppressed in production |
| Prisma | Production: `["error"]` only (`src/lib/db`) |
| Correlation | `logger.withCorrelation(level, msg, correlationId, fields)` |
| PII | Redaction helpers — never log passwords, tokens, raw cards |

**Gap:** no centralized log shipper (Datadog/ELK) in-repo — relies on platform stdout.

---

## 2. Correlation IDs

| Layer | Mechanism |
| --- | --- |
| HTTP | Middleware sets `x-request-id` (`src/lib/observability/correlation.ts`) |
| Client | `RequestIdCapture` stores last id in `sessionStorage` |
| Error UI | Shows digest + request id (`error.tsx`, `global-error.tsx`) |
| Jobs | `SystemJob.correlationId` |
| Mortgage leads | External-safe `ml_…` correlation ids |

Support: always collect the on-screen **Reference** string (`docs` support taxonomy).

---

## 3. Metrics & health

| Endpoint | Auth | Meaning |
| --- | --- | --- |
| `GET /api/health` | Public | Liveness |
| `GET /api/ready` | Public | Readiness (Postgres `SELECT 1`) |
| `GET /api/admin/health` | `ops.health.read` | Deep probes: DB, queue, payments, providers |
| UI `/admin/monitoring` | Admin | Ops dashboard |

Statuses: `UP` | `DEGRADED` | `DOWN` | `UNKNOWN`.

### SLO baselines (targets — not live RUM)

Defined in `src/domains/operations/support/support-taxonomy.ts` → `PERFORMANCE_SLO_BASELINES`:

| Signal | Target |
| --- | --- |
| Homepage p95 | 800 ms |
| Search p95 | 1200 ms |
| Property detail p95 | 1500 ms |
| Checkout p95 | 1000 ms |
| `/api/ready` p95 | 300 ms |
| 5xx error rate | warn 1% / critical 5% (5m) |

**Field RUM / Lighthouse CI:** not wired — treat as aspirational until executed (`docs/PERFORMANCE_AUDIT.md`).

---

## 4. Alerts

**Catalogue SoT:** `src/domains/operations/monitoring/alert-rules.ts` (`ALERT_RULES`).

| ID | Severity | Notify |
| --- | --- | --- |
| `payments.failed_burst` | SEV1 | oncall, commerce |
| `payments.webhook_reject_storm` | SEV1 | oncall, security |
| `import.job_dlq` | SEV2 | oncall, data |
| `auth.lockout_burst` | SEV2 | oncall, security |
| `auth.login_outage` | SEV1 | oncall |
| `health.database_down` | SEV1 | oncall |
| `health.overall_down` | SEV1 | oncall |
| `revenue.reconcile_failed` | SEV2 | oncall, commerce |

Dedup windows prevent alert storms (`shouldEmitAlert`).

### Delivery reality

| Channel | Status |
| --- | --- |
| `ERROR_TRACKER_WEBHOOK_URL` | Optional HTTPS POST; else **noop** in prod |
| Email alert digest / retry scripts | Exist; **email provider ABSENT** |
| PagerDuty/Slack native | Not in dependencies — use webhook |

---

## 5. Error tracking

Adapter: `src/lib/observability/error-tracker.ts`

| Env | Behaviour |
| --- | --- |
| Development | Console |
| Production | Noop unless webhook URL set |
| Sentry SDK | **Not installed** |

---

## 6. Synthetics (external)

Configure vendor against:

1. `/api/health` — 1m  
2. `/api/ready` — 1m (page on 2 failures)  
3. `/`, `/prihlaseni`, `/cenik` — 5m  

See `SYNTHETIC_CHECKS` in alert-rules module.

---

## 7. Product analytics vs ops

| System | Role |
| --- | --- |
| First-party `track()` | Product funnels — **not** revenue SoT |
| `RevenueEvent` ledger | Money recognition SoT |
| This doc | Ops health / SEV |

Funnels detail: `docs/ANALYTICS_FUNNELS.md` · taxonomy: `docs/ANALYTICS_EVENT_TAXONOMY.md`.
