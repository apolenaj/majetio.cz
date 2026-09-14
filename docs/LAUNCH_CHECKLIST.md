# Launch Checklist — Majetio.cz

**Owner:** Release Manager  
**Last verified against code + Phase 1–4 audits:** 2026-07-22 (Phase 5)  
**Overall Launch Gate:** **NO-GO**

Statuses: **PASS** · **FAIL** · **WAIVED** · **N/A**  
Each FAIL/WAIVED must include reason / risk.

**Related:** `docs/PRODUCTION_RUNBOOK.md` · `docs/FEATURE_STATUS_MATRIX.md` · `docs/PHASE1_INFRA_AUDIT.md` · `docs/PHASE4_CODE_HEALTH_AUDIT.md`

---

## Product

| Item | Status | Reason / risk |
| --- | --- | --- |
| CZ market LIVE in registry | PASS | `plugins/cz` launchStatus LIVE |
| Other markets not accidentally public | PASS | RESEARCH/PLANNED + readiness barrier |
| Feature flags for legal-risk OFF | PASS | Success fee / invoices / withdrawal / marketplace default false |
| Purchase Concierge not claimed live | PASS | Flag OFF + scrub copy helpers |
| Deep Analysis / Buyer Pass catalog | PASS | Present on `/cenik`; paid path blocked without PSP |
| Demo inventory off in prod | PASS | Fail-closed without `ALLOW_DEMO_PROPERTY_CONTENT` |
| Product copy promises live bank/PSP | FAIL | HJ default = dev adapter; PSP = none — risk of misleading UX if misconfigured |

---

## Data

| Item | Status | Reason / risk |
| --- | --- | --- |
| Prisma schema + migrations process | PASS | Migrate deploy documented |
| DQ admin + merge concurrency claim | PASS | Phase 3 fixes |
| Import workers fully scheduled | FAIL | SystemJob tick / workers incomplete (Phase 1) |
| Retention cleanup scheduled | FAIL | Script exists; no GHA/cron except reconcile |
| Seed scripts prod-safe | PASS | Refuse / gates (Phase 3) |
| Prod data volume EXPLAIN baseline | N/A | Not executed — risk of surprise slow queries |

---

## Payments

| Item | Status | Reason / risk |
| --- | --- | --- |
| Live PSP integrated | FAIL | Only `none`/`mock` in code — **launch blocker** |
| Mock fail-closed in production | PASS | `isPaymentsMockAllowed` |
| Webhook signature + idempotent claim | PASS | Phase 3 |
| Entitlement not on client redirect | PASS | Server webhook / free path |
| Revenue reconcile job | PASS | GHA + fail-loud without DB |
| `kill.payments` wired | PASS | create-order checks FeatureFlag |
| Checkout idempotency UX | PASS | sessionStorage key (Phase 3) |

---

## Security

| Item | Status | Reason / risk |
| --- | --- | --- |
| CSP / security headers middleware | PASS | Enforce in production |
| Admin RBAC | PASS | Permission model + tests |
| Public admin registration | PASS | Always `Role.USER` |
| Super-admin bootstrap gated | PASS | CLI force flags |
| SSRF / upload MIME / IDOR suites | PASS | Security vitest (Phase 4 subset) |
| Upstash rate limit in prod | FAIL | Optional — multi-instance memory RL weak |
| `/dev` blocked in prod | PASS | Unless `ALLOW_DESIGN_SYSTEM` |
| Lint / typecheck clean | FAIL | Phase 4: 65 eslint errors, ~43 tsc — **process blocker** |

---

## Privacy

| Item | Status | Reason / risk |
| --- | --- | --- |
| Cookie consent CMP | PASS | First-party; marketing default off |
| Analytics consent gate | PASS | Client product events gated |
| Mortgage lead consent paths | PASS | Domain consent (E2E journey ABSENT — residual) |
| Account export / privacy center | PASS | Account routes |
| Google Consent Mode / gtag | N/A | No gtag — OK until GA added |
| PII scrubber on analytics | PASS | `scrub-pii` |

---

## Infrastructure / Ops

| Item | Status | Reason / risk |
| --- | --- | --- |
| Boot-time env validation | FAIL | No Zod/`createEnv` at boot (Phase 1) |
| `/api/health` + `/api/ready` | PASS | Present |
| Error tracker wired | FAIL | Prod noop without webhook — ops blind |
| Alert catalogue | PASS | Code defined |
| Synthetics configured in vendor | FAIL | Not in-repo; ops must configure |
| Maintenance mode | PASS | `MAINTENANCE_MODE` |
| Transactional email provider | FAIL | **Launch blocker** — silent no-op |
| DR runbook | PASS | `docs/DISASTER_RECOVERY.md` updated Phase 5 |
| Production runbook | PASS | `docs/PRODUCTION_RUNBOOK.md` |
| Cron coverage beyond reconcile | FAIL | Most `npm run` jobs unscheduled |

---

## Frontend / SEO

| Item | Status | Reason / risk |
| --- | --- | --- |
| robots / sitemap / canonical basics | PASS | Phase 2 |
| www apex redirect | PASS | Middleware |
| PWA manifest / favicon | PASS | Phase 2 |
| GSC verification token set | FAIL | Env hook only — must set in prod |
| Perf RUM / Lighthouse baseline | FAIL | NOT EXECUTED (Phase 4/5) |

---

## Analytics

| Item | Status | Reason / risk |
| --- | --- | --- |
| Event taxonomy | PASS | Documented + typed |
| Prod analytics provider | FAIL | Noop — no funnel warehouse |
| Revenue not from client analytics | PASS | Ledger SoT |

---

## Testing / QA

| Item | Status | Reason / risk |
| --- | --- | --- |
| Golden financial engines | PASS | Valuation / mortgage / investment / max offer |
| Unit suite (post Phase 3 mock fixes) | PASS | Subset re-verified; full re-run not required for this row if CI green later |
| Playwright E2E executed on staging | FAIL | Phase 4 **NOT EXECUTED** |
| Mortgage lead consent E2E | FAIL | ABSENT dedicated journey |
| Reliability matrix staging drills | FAIL | Mostly NOT EXECUTED |

---

## Legal / Compliance

| Item | Status | Reason / risk |
| --- | --- | --- |
| Success-fee / agency claims OFF | PASS | Flags + copy guards |
| Automated fiscal invoices OFF | PASS | Flag default false |
| Counsel sign-off on ToS/privacy | WAIVED | Not verifiable in code — **requires human counsel**; risk if skipped |
| Multi-market legal packs | N/A | Non-CZ not LIVE |

---

## GO / NO-GO summary

| Gate | Result |
| --- | --- |
| Security P0 clear | PARTIAL — code OK; lint/tsc FAIL |
| Payments live | **FAIL** |
| Email live | **FAIL** |
| Ops visibility (tracker + synthetics) | **FAIL** |
| Data job scheduling | **FAIL** |
| **Launch decision** | **NO-GO** |

Re-run this checklist after clearing Phase 1 blockers and turning CI green. Update statuses in place — do not create parallel outdated copies.
