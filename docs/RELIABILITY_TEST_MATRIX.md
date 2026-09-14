# Reliability Test Matrix — Majetio.cz

**Owner:** SRE / QA  
**Last verified:** 2026-07-22 (Phase 5)  
**Related:** `docs/DISASTER_RECOVERY.md` · `docs/PRODUCTION_RUNBOOK.md` · `docs/LAUNCH_MONITORING_PLAN.md`

Purpose: prove fail-soft behaviour **before** launch. Status uses executed evidence only.

| ID | Scenario | How to test | Expected | Last result | Owner |
| --- | --- | --- | --- | --- | --- |
| R-01 | DB unreachable | Point `DATABASE_URL` at closed port / stop DB | `/api/ready` 503; app does not claim healthy | **NOT EXECUTED** (staging drill) | SRE |
| R-02 | Maintenance mode | `MAINTENANCE_MODE=true` | Public 503 HTML; `/api/ready` + `/admin` reachable | Unit/middleware contract PASS; full staging **NOT EXECUTED** | SRE |
| R-03 | `kill.payments` | Enable FeatureFlag `kill.payments` | `createCheckoutOrder` refuses | Code path PASS (Phase 3); staging **NOT EXECUTED** | Commerce |
| R-04 | Payment webhook replay | Resend same `eventId` | Duplicate OK; single entitlement grant | Unit tests PASS | Commerce |
| R-05 | Payment webhook amount mismatch | Signed payload wrong amount | Reject; no grant | Unit PASS | Commerce |
| R-06 | Mock PSP in prod-like | `PAYMENTS_PROVIDER=mock` without allow | Treated as `none` | Code PASS (`isPaymentsMockAllowed`) | Commerce |
| R-07 | HJ outage / mock forbidden | Disable HJ / force mock in prod env | Fail-soft; no fake live rates | Config gates PASS; live HTTP drill **NOT EXECUTED** | Financing |
| R-08 | Auth lockout | Burst failed logins | Rate limit / lock signals | Unit/rate-limit coverage; load test **NOT EXECUTED** | Security |
| R-09 | Import DLQ | Force failing job | Row in `SystemJobDeadLetter`; alert fingerprint | Partial (code); ops drill **NOT EXECUTED** | Data |
| R-10 | Revenue reconcile missing DB | Unset `DATABASE_URL` in GHA/script | Exit 1 (fail-loud) | Code PASS (20.9) | Commerce |
| R-11 | Corrupt import quarantine | Bad batch → non-public | Discovery hides bad listings | Process doc only — **NOT EXECUTED** | Data |
| R-12 | Session retention cleanup | Seed expired `Session`; run `db:cleanup-retention` | Deleted count > 0 | Script exists; prod schedule **ABSENT** | SRE |
| R-13 | Client critical error UX | Throw in segment / global error | UI shows support Reference (digest/request) | Code PASS (Phase 4); E2E **NOT EXECUTED** | Frontend |
| R-14 | Region / deploy rollback | Redeploy previous SHA | Ready green; no migrate reset | Platform-dependent — **NOT EXECUTED** | SRE |
| R-15 | Email provider down | N/A | No live provider — test deferred until wired | **N/A** (ABSENT) | Ops |

### Cadence

| Environment | Minimum |
| --- | --- |
| Staging | R-02, R-03, R-04, R-06 before each major release |
| Production | R-01, R-14 only with change window + dual approval |
| Quarterly | Full matrix review |

### Pass criteria for “reliability GO”

- R-02, R-03, R-04, R-06 executed on staging within 30 days of launch  
- Synthetic `/api/ready` + alert webhook wired (`docs/OBSERVABILITY.md`)  
- R-15 remains N/A only if product accepts no transactional email (currently **launch blocker**)
