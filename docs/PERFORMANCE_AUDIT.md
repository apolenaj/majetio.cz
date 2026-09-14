# Performance Audit — Majetio.cz

**Owner:** Frontend / SRE  
**Last verified:** 2026-07-22 (Phase 5)  
**Related:** `docs/DATABASE_PERFORMANCE.md` · `docs/SCALABILITY_RISKS.md` · `docs/OBSERVABILITY.md`  
**SLO constants:** `PERFORMANCE_SLO_BASELINES` in `support-taxonomy.ts`

---

## 1. Executive summary

| Item | Reality |
| --- | --- |
| Documented p95 targets | **Yes** (code + this doc) |
| Measured prod RUM / Lighthouse baseline | **NOT EXECUTED** — no CI Lighthouse / RUM vendor |
| App architecture | SSR/RSC Next.js + Prisma; middleware CSP/auth |
| Known quality gates | Lint/tsc **FAIL** (Phase 4) — not a perf metric but blocks trust in builds |

**Verdict:** Performance **targets defined**; production **measurement ABSENT**. Do not claim CWV PASS.

---

## 2. Target SLOs (aspirational until measured)

| Surface | p95 target |
| --- | --- |
| Homepage | 800 ms |
| Search | 1200 ms |
| Property detail | 1500 ms |
| Checkout | 1000 ms |
| `/api/ready` | 300 ms |
| 5xx rate (5m) | warn ≥1% · critical ≥5% |
| LCP p75 | 2500 ms |
| CLS p75 | 0.1 |
| INP p75 | 200 ms |

---

## 3. Code-level observations (not load-test results)

| Area | Observation | Risk |
| --- | --- | --- |
| Middleware | Auth JWT on account/admin paths; security headers; www redirect | Extra work on every matched request — acceptable |
| Search | Prisma queries + filters in `property-search-service` | Needs DB indexes + pagination discipline |
| Valuation / investment | Pure CPU engines — unit-tested; cost grows with comps count | Cap comps / timeouts if exposed to heavy API |
| Images | Remote listing `<img>` without full Next Image allowlist in places | LCP risk on detail |
| Analytics | Prod noop — negligible client cost today | Vendor later may add weight |
| Rate limit | Upstash optional; else in-memory | Multi-instance memory RL ineffective |

---

## 4. Recommended measurement plan (not done)

1. Staging Lighthouse CI on `/`, `/hledat`, sample detail  
2. Synthetic timing on `/api/ready` and search HTML  
3. After launch: platform RUM or OpenTelemetry web Vitals  
4. Compare to SLO table weekly (`docs/LAUNCH_MONITORING_PLAN.md`)

---

## 5. Status legend for launch

| Check | Status |
| --- | --- |
| SLO constants exist | PASS |
| Prod p95 measured | **FAIL** (not executed) |
| CWV field data | **FAIL** (not executed) |
| Obvious N+1 eradicated globally | **N/A** — requires query audit per release |
