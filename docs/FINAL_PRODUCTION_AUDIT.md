# Final Production Audit ? Majetio.cz (Prompt 20 Definition of Done)

**Datum:** 2026-07-22  
**Role:** Principal QA Architect / Release Manager  
**Re?im:** AUDIT ? TEST ? FIX ? VERIFY ? **??dn? fake sk?re, fake load testy, mockovan? PASS**  
**Evidence base:** Phase 1?5 reports + live `lint`/`tsc`/`vitest` runs + codebase

| Field | Value |
| --- | --- |
| **Overall score** | **5.9 / 10** |
| **Status** | **NOT READY** |
| **Launch Gate** | **NO-GO** |
| **Ortel** | Volba **C** (viz konec) |

**Pravidlo sk?re:** jak?koliv unresolved **P0** ? max status **NOT READY** (&lt; 7.0). Toto sk?re **nesm?** b?t zaokrouhleno nahoru p?es 6.9.

Souvisej?c?: `docs/LAUNCH_CHECKLIST.md` ? `docs/PHASE1_INFRA_AUDIT.md` ? `docs/PHASE2_FRONTEND_AUDIT.md` ? `docs/PHASE3_SECURITY_OPS_AUDIT.md` ? `docs/PHASE4_CODE_HEALTH_AUDIT.md` ? `docs/PHASE5_DOCS_SYNC.md`

---

## 1. Production Readiness Score (v??en?)

| Category | Weight | Score (0?10) | Weighted | Rationale (honest) |
| --- | --- | --- | --- | --- |
| Security | 15% | **7.5** | 1.13 | CSP, RBAC, webhook HMAC+claim, SSRF/MIME/IDOR tests, mock fail-closed; Upstash optional; CI not green |
| Functional correctness | 15% | **6.0** | 0.90 | Golden engines PASS; paid checkout blocked without PSP; email noop; Playwright **NOT EXECUTED** |
| Data correctness | 15% | **6.5** | 0.98 | Demo fail-closed; merge/promo concurrency fixed; import workers/cron incomplete; search diacritics residual |
| Reliability | 10% | **5.0** | 0.50 | `/api/ready`, DR docs, kill switches; jobs/cron mostly unscheduled; reliability drills mostly **NOT EXECUTED** |
| Performance | 10% | **3.0** | 0.30 | SLO constants exist; **no** RUM/Lighthouse/load evidence |
| Privacy | 10% | **7.5** | 0.75 | CMP, consent gates, scrubber, marketing default OFF; mortgage consent E2E ABSENT |
| UX | 10% | **6.0** | 0.60 | Error Reference IDs; checkout/pricing gates; risk of false certainty (HJ/PSP) if misconfigured |
| SEO | 5% | **7.0** | 0.35 | robots/sitemap/www/canonical Phase 2; GSC token often unset |
| Analytics | 5% | **4.0** | 0.20 | Taxonomy + funnels documented; **prod provider noop** |
| Ops | 5% | **4.0** | 0.20 | Runbooks Phase 5; error tracker noop; synthetics not vendor-wired; no boot env validation |
| **TOTAL** | **100%** | ? | **5.9** | **NOT READY** |

### Banding

| Band | Range | Meaning |
| --- | --- | --- |
| READY | ? 8.5 and zero P0 and zero launch-blocking P1 | Public launch |
| CONDITIONALLY READY | 7.0?8.4, no P0, residual P1 with plan | Soft launch / limited |
| **NOT READY** | **&lt; 7.0 or any P0** | **No public production launch** |

---

## 2. Definition of Done ? verification

| DoD item | Required | Result | Evidence |
| --- | --- | --- | --- |
| E2E journeys (guest/user/purchase/mortgage consent/admin DQ) | All exist + executed on staging | **FAIL** | Guest/compare/Deep Analysis surfaces exist; mortgage consent E2E **ABSENT**; Playwright suite **NOT EXECUTED** (Phase 4) |
| Valuation / mortgage / investment / max-offer tests | Golden / regression PASS | **PASS** | Phase 4: 74/74 in golden bundle |
| DB audit (concurrency, retention, backups) | Documented + critical races fixed | **PARTIAL** | Phase 3 claims fixed; retention **unscheduled**; EXPLAIN baseline **NOT EXECUTED** |
| No fake/demo-as-real in prod paths | Fail-closed | **PASS** | `ALLOW_DEMO_PROPERTY_CONTENT` gate; seed refuses prod |
| Observability | Ready + correlation + alerts + tracker | **PARTIAL** | `/api/ready`, `x-request-id`, alert catalogue; tracker **noop** without webhook; synthetics not configured |
| Security checklist | Headers, RBAC, webhooks, IDOR | **PARTIAL** | Strong code + tests; lint/tsc **FAIL** blocks release integrity |
| `npm run typecheck` | PASS | **FAIL** | Confirmed 2026-07-22 ? `tsc` exit 2 |
| `npm run lint` | 0 errors | **FAIL** | Confirmed 2026-07-22 ? **67 errors**, 40 warnings |
| `npm run build` | PASS | **NOT EXECUTED** this final pass | Treat as open until green |
| Live PSP | Production provider ? none/mock | **FAIL** | Code: `none` \| `mock` only |
| Transactional email | Real send in prod | **FAIL** | Silent no-op (Phase 1) |
| Docs without drift | Phase 5 set | **PASS** | Runbook, DR, checklist, matrices |

**DoD overall:** **NOT MET**

---

## 3. Issues register (P0 / P1 / P2)

### 3.1 Unresolved P0 (launch blockers)

| ID | Issue | Status | Evidence | Fix required |
| --- | --- | --- | --- | --- |
| **P0-EMAIL** | Production transactional email is silent no-op | OPEN | Phase 1; `logEmailInDev` / no provider | Wire real provider; remove fake `{ ok: true }` in prod |
| **P0-PSP** | No live payment provider | OPEN | `integrations/payments` = `none`\|`mock` | Integrate live PSP; keep mock fail-closed |
| **P0-CRON** | Operational jobs largely unscheduled (SystemJob tick, retention, alerts, boosts, HJ?) | OPEN | Phase 1; only `revenue-reconcile.yml` scheduled | Schedule minimum cron set or feature-off dependent flows |
| **P0-ENV** | No boot-time validation of `DATABASE_URL` / `AUTH_SECRET` / public URL | OPEN | Phase 1 ? no `createEnv`/`instrumentation` | Fail closed on boot in production |

### 3.2 Unresolved P1 (launch-blocking / must-fix)

| ID | Issue | Status | Evidence | Fix required |
| --- | --- | --- | --- | --- |
| **L-01** | `tsc --noEmit` FAIL | OPEN | Phase 4 ~43 errors | Clear type errors; CI green |
| **L-02** | ESLint FAIL (65 errors) | OPEN | Phase 4 | Clear errors |
| **L-03** | Production build + full Playwright not verified green | OPEN | Phase 4 NOT EXECUTED | `build` + staging `test:e2e` |
| **P1-TRACKER** | Error tracker prod noop | OPEN | `error-tracker.ts` | Set `ERROR_TRACKER_WEBHOOK_URL` or Sentry |
| **P1-SYNTH** | External synthetics not configured in vendor | OPEN | Phase 5 ops | Wire health/ready/home/login/cenik |
| **P1-UPSTASH** | Multi-instance rate limit weak without Redis | OPEN | Optional Upstash | Configure in prod |
| **P1-HJ-TIMEOUT** | HJ HTTP adapter timeout residual | OPEN | Phase 1 | AbortController/timeouts |
| **P1-JOB-STUBS** | Some SystemJob kinds complete without real work | OPEN | Phase 1 | Implement or refuse enqueue |
| **P1-SEARCH-FOLD** | Server search diacritics (`plzen` vs `Plze?`) | OPEN | Phase 2 residual | Unaccent / folded column |
| **P1-E2E-MORTGAGE** | Mortgage lead consent E2E ABSENT | OPEN | Phase 4 | Add Playwright journey |
| **P1-GSC** | GSC verification often unset | OPEN | Phase 2 | Set env token |

### 3.3 P2 (high, not sole gate if P0 clear)

| ID | Issue | Status | Notes |
| --- | --- | --- | --- |
| P2-ANALYTICS | Prod analytics provider noop | OPEN | Taxonomy OK; warehouse ABSENT |
| P2-PERF-RUM | No field CWV/p95 measurement | OPEN | SLO constants only |
| P2-RETENTION-CRON | Cleanup script unscheduled | OPEN | Overlaps P0-CRON |
| P2-LEGAL-COPY | Counsel sign-off not in code | WAIVED/human | Checklist WAIVED |
| P2-FALSE-CERTAINTY | HJ/PSP misconfig can look ?live? | OPEN | Defaults safer; copy audit |

### 3.4 Fixed during Prompt 20 cycle (sample ? not exhaustive)

| ID | Was | Fix | Phase |
| --- | --- | --- | --- |
| Webhook TOCTOU | P1 | Atomic `processedAt` claim | 3 |
| Merge race | P1 | PENDING claim | 3 |
| Promo cap race | P1 | Atomic redemption TX | 3 |
| Checkout idempotency UI | P1 | sessionStorage key | 3 |
| Localhost URLs in prod-like | P1 | `getPublicAppUrl` | 3 |
| `kill.payments` unwired | P1 | create-order | 3 |
| Demo seed in prod | P1 | Refuse / gates | 3 |
| Dev HJ float PMT drift | P1 | Canonical annuity | 4 |
| Error UI no correlation | P1 | digest + request id | 4 |
| `/api/ready` missing | P1 | Added | 20.9 |
| `x-request-id` | P1 | Middleware | 20.9 |
| Checkout product gates / null filters / favourites cap | P0/P1 | Phase 2 | 2 |

**Counts**

| | Original (Prompt 20 start inventory + Phase 1 P0 list) | Remaining OPEN |
| --- | --- | --- |
| **P0** | ? 5 (email, PSP, cron, env, + historical payment/demo themes) | **4** (EMAIL, PSP, CRON, ENV) |
| **P1** | ? 15 (L-01/02/03 + infra/ops + residual) | **? 11** listed above |
| **P2** | many | several OPEN |

Exact ?original? count is not a single ticket system ? inventory above is the authoritative remaining set for launch.

---

## 4. Category notes (post Phase 1?5)

| Category | Post-20 score | Delta vs early Prompt 20 |
| --- | --- | --- |
| Security | 7.5 | ? code hardening; CI still hurts release trust |
| Functional | 6.0 | ? golden engines; ? unpaid PSP/email holes |
| Data | 6.5 | ? concurrency; ? ops scheduling |
| Reliability | 5.0 | ? ready/DR/maintenance; ? cron/drills |
| Performance | 3.0 | targets only ? **no fake load numbers** |
| Privacy | 7.5 | strong first-party |
| UX | 6.0 | better errors; conversion blocked honestly when PSP=none |
| SEO | 7.0 | Phase 2 |
| Analytics | 4.0 | taxonomy without vendor |
| Ops | 4.0 | docs strong; runtime visibility weak |

---

## 5. Console report (canonical)

```
============================================================
 MAJETIO ? PROMPT 20 FINAL PRODUCTION READINESS REPORT
 Date: 2026-07-22
============================================================
 Overall score:     5.9 / 10
 Status:            NOT READY  (rule: any P0 => <7.0 / NOT READY)
 Launch Gate:       NO-GO

 Category scores:
   Security ............... 7.5  (w 15%)
   Functional correctness . 6.0  (w 15%)
   Data correctness ....... 6.5  (w 15%)
   Reliability ............ 5.0  (w 10%)
   Performance ............ 3.0  (w 10%)
   Privacy ................ 7.5  (w 10%)
   UX ..................... 6.0  (w 10%)
   SEO .................... 7.0  (w  5%)
   Analytics .............. 4.0  (w  5%)
   Ops .................... 4.0  (w  5%)

 P0: original inventory >=5  |  remaining OPEN = 4
 P1: original inventory >=15 |  remaining OPEN >=11

 Blockers (must clear before public launch):
   P0-EMAIL   Transactional email silent no-op in production
   P0-PSP     No live payment provider (none|mock only)
   P0-CRON    Critical jobs unscheduled (SystemJob/retention/alerts/?)
   P0-ENV     No boot-time required-env validation
   L-01/L-02  typecheck + eslint FAIL
   L-03       build/full E2E not verified PASS
   P1-TRACKER Error tracker prod noop
   P1-SYNTH   Synthetics not vendor-wired
============================================================
```

---

## 6. Ortel (Prompt 20 DoD)

Prompt 20 dokon?en. Majetio zat?m NEN? p?ipraven? na production launch. Launch blokuj? n?sleduj?c? P0/P1 probl?my: P0-EMAIL (produk?n? e-mail silent no-op), P0-PSP (??dn? live platebn? provider ? pouze none/mock), P0-CRON (kritick? joby neschedulovan?), P0-ENV (chyb? boot-time validace required env), L-01/L-02 (`tsc` a ESLint FAIL), L-03 (build/full E2E neov??eny), P1-TRACKER (error tracker prod noop), P1-SYNTH (synthetics nenakonfigurov?ny), plus residual P1 (Upstash, HJ timeout, job stubs, search diacritics, mortgage consent E2E, GSC).

**Overall: 5.9 / 10 ? NOT READY ? Launch Gate NO-GO.**
