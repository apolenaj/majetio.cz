# Production Runbook — Majetio.cz

**Owner:** SRE / Release Manager  
**Last verified against code:** 2026-07-22 (Phase 5)  
**Launch Gate:** **NO-GO** until Phase 1 blockers cleared (`docs/PHASE1_INFRA_AUDIT.md`)  
**Related:** `docs/RELEASE_PROCESS.md` · `docs/DISASTER_RECOVERY.md` · `docs/LAUNCH_CHECKLIST.md` · `docs/OPERATIONS_MONITORING.md`

---

## 1. Stack (as shipped)

| Layer | Reality |
| --- | --- |
| App | Next.js App Router (`next` 16.x), Node runtime for payments/webhooks |
| DB | PostgreSQL via Prisma (`DATABASE_URL`) |
| Auth | Auth.js / NextAuth credentials (+ Prisma adapter sessions) |
| Hosting | Assumed Vercel-class (or Node `next start`); not encoded as vendor lock |
| Payments | `PAYMENTS_PROVIDER=none` \| `mock` only — **no live PSP in code** |
| Email | Templates + `logEmailInDev` — **no production sender** |
| Cron | GitHub Action: `revenue-reconcile.yml` only; other jobs = manual/`npm run` |

---

## 2. Deployment

### Pre-deploy (must be green for GO)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

As of Phase 4 audit: **lint FAIL**, **typecheck FAIL** — do not treat as production-ready.

### Env (minimum)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres |
| `AUTH_SECRET` | Yes | Auth.js |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | Public HTTPS origin — **not** localhost (`src/lib/app-url.ts`) |
| `PAYMENTS_PROVIDER` | Yes | Keep `none` until live PSP; mock forbidden in prod without `PAYMENTS_ALLOW_MOCK` |
| `PAYMENTS_WEBHOOK_SECRET` | If payments on | Webhook HMAC |
| `MAINTENANCE_MODE` | Optional | `true` → public 503 (`src/lib/maintenance.ts`) |
| `ERROR_TRACKER_WEBHOOK_URL` | Optional | Else error tracker = noop in prod |
| `UPSTASH_REDIS_*` | Optional | Else in-memory rate limits |

Full catalogue: `.env.example`. **No boot-time Zod env validation** exists yet (Phase 1 FAIL).

### Migrate + deploy

1. Staging: `npx prisma migrate deploy`
2. Deploy app compatible with **both** pre/post schema during rollout
3. Smoke: `GET /api/health`, `GET /api/ready`, `/`, `/prihlaseni`, `/cenik`
4. Confirm `x-request-id` on responses (middleware)

### Forbidden on production

- `prisma migrate reset`
- `ALLOW_DEMO_PROPERTY_CONTENT=true` / demo seeds without gates
- `PAYMENTS_ALLOW_MOCK` / `HYPOTEKAJASNE_ALLOW_MOCK` on live traffic
- `npm run db:seed:test-user` (hard-refused in production)
- Force-push / `--no-verify` as release practice

---

## 3. Rollback

| Situation | Action |
| --- | --- |
| Bad app build | Redeploy previous Git SHA / platform rollback |
| Bad migration | Prefer **forward-fix**; else restore DB backup to **new** instance (`docs/DISASTER_RECOVERY.md`) |
| Payment/config mistake | Engage `kill.payments` (admin FeatureFlag) + set `MAINTENANCE_MODE` if needed |
| Bad import data | Stop job ticks; quarantine listings; DLQ requeue only after fix |

Abort criteria during deploy: `/api/ready` 503 > 2 minutes, payment failure storm, auth outage alert.

---

## 4. Incidents

| SEV | Examples | First actions |
| --- | --- | --- |
| SEV1 | DB down, login outage, payment burst | Page oncall; status template in DR doc; capture `x-request-id` |
| SEV2 | Import DLQ, reconcile workflow fail, auth lockout burst | Mitigate + ticket; no mock PSP |
| SEV3–4 | Single listing DQ, calculator UI | Support taxonomy (`support-taxonomy.ts`) |

User-facing errors show **Reference: digest · request …** (`error.tsx` / `global-error.tsx`). Ask support for that string.

Maintenance: `MAINTENANCE_MODE=true` → graceful 503 HTML; bypass `/api/ready`, `/admin`, `/prihlaseni`, `/api/auth`.

---

## 5. Operational jobs

### Scheduled (CI)

| Job | Workflow / command | Cadence |
| --- | --- | --- |
| Revenue reconcile | `.github/workflows/revenue-reconcile.yml` → `npm run revenue:reconcile` | Nightly (as configured in workflow) |

### Manual / needs host cron (NOT auto-scheduled in repo)

| Command | Purpose |
| --- | --- |
| `npm run db:cleanup-retention` | Expired sessions, tokens, old webhooks/jobs |
| `npm run boosts:expire` | Listing boost expiry |
| `npm run hj:ingest-rates` | Mortgage rate ingest |
| `npm run hj:retry-submissions` | Retry HJ lead submissions |
| `npm run alerts:digest` | Alert digest |
| `npm run alerts:email-retry` | Alert email retry (no-op sender in prod today) |
| `npm run location:aggregate` / `refresh` / `anomaly-check` | Location metrics |
| `npm run revenue:reconcile:repair` | Repair mode — use only after dry-run review |

### In-app queue

Prisma `SystemJob` + `SystemJobDeadLetter` — tick via admin API (`ops.jobs.write`). **Workers are incomplete / not cron-driven** (Phase 1). Do not assume background processing without manual tick.

Admin UI: `/admin/monitoring`, jobs endpoints under `/api/admin/jobs*`.

---

## 6. Payments runbook (current)

1. Checkout creates `Order` + `Payment` only if provider ≠ `none` for paid plans.
2. With `PAYMENTS_PROVIDER=none`, paid checkout returns configuration error.
3. Entitlements grant **only** on signed webhook success (or free checkout path) — never on client redirect alone.
4. Webhook: `POST /api/payments/webhook` — HMAC + atomic `processedAt` claim.
5. After outage: `npm run revenue:reconcile` (dry-run) then `--repair` if approved.

---

## 7. Super-admin bootstrap

```bash
ALLOW_ADMIN_BOOTSTRAP=true \
CONFIRM_PROD_ADMIN_BOOTSTRAP=I_UNDERSTAND \
BOOTSTRAP_ADMIN_EMAIL=... \
BOOTSTRAP_ADMIN_PASSWORD='…≥16 chars…' \
npm run db:bootstrap-admin
```

Public registration always creates `Role.USER`. Never seed `TestUser1!` in prod.

---

## 8. Quick links

| Doc | Role |
| --- | --- |
| `docs/LAUNCH_CHECKLIST.md` | GO / NO-GO items |
| `docs/LAUNCH_MONITORING_PLAN.md` | 1h / 24h / 7d watch |
| `docs/EXTERNAL_DEPENDENCY_REGISTER.md` | Providers |
| `docs/OBSERVABILITY.md` | Logs / metrics / alerts |
| `docs/FEATURE_STATUS_MATRIX.md` | What is LIVE vs DISABLED |
