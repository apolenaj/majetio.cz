# Release Process — Majetio.cz

**Prompt:** 20.9 · **Owner:** Release Manager / SRE  
**Last verified:** 2026-07-22 (Phase 5)  
**Related:** `docs/PRODUCTION_RUNBOOK.md` · `docs/DISASTER_RECOVERY.md` · `docs/LAUNCH_CHECKLIST.md` · `docs/LAUNCH_MONITORING_PLAN.md` · `docs/OPERATIONS_MONITORING.md` · `docs/FINAL_PRODUCTION_AUDIT.md`

**Current Launch Gate:** **NO-GO** — see `docs/LAUNCH_CHECKLIST.md` (live PSP, email, env boot validation, synthetics/tracker, CI lint/tsc).

---

## 1. Release stages

```
Local  →  CI  →  Preview  →  Staging  →  Production
```

| Stage | Environment | Purpose | Gate |
| --- | --- | --- | --- |
| **Local** | Developer machine | Feature / bugfix | `lint` / `typecheck` / targeted tests green locally |
| **CI** | GitHub Actions `ci.yml` | Merge integrity | lint, typecheck, unit tests, `prisma migrate deploy` (service DB), `build` |
| **Preview** | PR preview deploy (if enabled) | Visual / product review | Smoke: `/`, `/api/health`, `/api/ready` |
| **Staging** | Prod-like secrets + DB | Full E2E / security / payments sandbox | `test:e2e:security`, SEO check, reconcile dry-run, admin health UP |
| **Production** | Live | User traffic | Launch Gate + checklist below |

Never promote with unresolved **P0** or **P1** in Security / Data / Payment / Deployment (see Launch Gate).

---

## 2. Pre-release checklist

### Code & CI
- [ ] `npm run lint` — 0 errors  
- [ ] `npm run typecheck` — PASS  
- [ ] `npm test` / release-gates — PASS  
- [ ] `npm run build` — PASS  
- [ ] CI on target branch green  
- [ ] No `PAYMENTS_ALLOW_MOCK` / `HYPOTEKAJASNE_ALLOW_MOCK` / `ALLOW_DEMO_PROPERTY_CONTENT` in prod env  

### Database migrations
- [ ] New migrations reviewed for **destructive** SQL (`DROP TABLE/COLUMN`, `TRUNCATE`, mass `DELETE`)  
- [ ] Expand → migrate → contract for breaking changes (additive first; dual-write if needed)  
- [ ] `prisma migrate deploy` on staging succeeded before prod  
- [ ] Rollback plan documented (restore backup / forward-fix) — **no** `migrate reset` on prod  
- [ ] App version compatible with **both** pre- and post-migration schema during rolling deploy  

### Security / privacy
- [ ] `npm run test:security`  
- [ ] Staging `test:e2e:security`  
- [ ] Secrets only in vault / GitHub secrets — not in repo  
- [ ] CSP / HSTS verified on staging HTTPS  

### Commerce & data
- [ ] Payment provider = live (not mock)  
- [ ] Webhook URLs + secrets configured  
- [ ] Revenue reconcile workflow has `DATABASE_URL` (fails loud if missing)  
- [ ] Demo property content hatch OFF  

### Observability
- [ ] Synthetics: `/api/health`, `/api/ready`, `/`, `/prihlaseni`, `/cenik`  
- [ ] `ERROR_TRACKER_WEBHOOK_URL` or equivalent pager wired  
- [ ] Alert rules acknowledged (`alert-rules.ts`)  
- [ ] On-call rotation named for release window  

### Product / legal
- [ ] Counsel or risk-accept on legal docs  
- [ ] Feature flags for unfinished surfaces OFF / noindex  

---

## 3. During release checklist

- [ ] Announce maintenance window if downtime expected (prefer zero-downtime migrate)  
- [ ] Deploy app **after** backward-compatible migrations applied  
- [ ] Watch: `/api/ready`, admin health, error tracker, payment webhooks  
- [ ] Correlation: sample `x-request-id` on a checkout and login path  
- [ ] Abort criteria: ready 503 > 2m, payment error storm, auth outage alert  

---

## 4. Post-release checklist

- [ ] Smoke: homepage, search, property detail, login, pricing, checkout start (sandbox amount OK)  
- [ ] Admin `/admin/monitoring` overall not DOWN  
- [ ] Nightly reconcile scheduled (next run noted)  
- [ ] No unexpected DLQ growth (15m)  
- [ ] Tag release / note in changelog  
- [ ] Update `docs/FINAL_PRODUCTION_AUDIT.md` Launch Gate if status changes  
- [ ] 24h watch: SEV alerts, CWV/SEO if part of release  

---

## 5. Migration safety policy

### Allowed without extra ceremony
- `CREATE TABLE IF NOT EXISTS`  
- `ADD COLUMN` nullable or with default  
- New indexes (`CREATE INDEX CONCURRENTLY` when provider supports)  
- Enum **ADD VALUE**  

### Requires expand/contract plan
- Rename column/table  
- Change nullability / type  
- `DROP COLUMN` / `DROP TABLE`  
- Destructive enum remaps  

### Forbidden on production without backup + dual approval
- `TRUNCATE`  
- Unscoped `DELETE FROM`  
- `prisma migrate reset`  
- Force-dropping tables that still have live readers  

### Historical destructive migrations (already applied)
| Migration | Risk |
| --- | --- |
| `20260719100000_valuation_engine_foundation` | `DROP TABLE` Valuation* |
| `20260719010000_property_sources_history_media` | `DROP COLUMN` on history/source |

Pending July-22 migrations are largely **additive** — still run on staging first.

---

## 6. Hotfix / rollback

| Option | When |
| --- | --- |
| Redeploy previous app image/commit | App bug; schema still compatible |
| Forward-fix migration | Preferred over reverse migrate |
| DB restore from backup | Data corruption / loss (see DR) |
| Feature flag / kill switch | Market or integration outage |

---

## 7. Environments & secrets (minimum)

| Variable | Staging | Prod |
| --- | --- | --- |
| `DATABASE_URL` | required | required |
| `AUTH_SECRET` | required | required |
| Payment provider keys | sandbox | live |
| `ERROR_TRACKER_WEBHOOK_URL` | recommended | required before GA |
| Mock / demo hatches | optional | **unset/false** |

---

## 8. Change log

| Date | Change |
| --- | --- |
| 2026-07-22 | Prompt 20.9 — initial release process |
