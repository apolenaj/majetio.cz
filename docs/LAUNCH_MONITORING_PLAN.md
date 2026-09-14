# Launch Monitoring Plan — Majetio.cz

**Owner:** On-call / Release Manager  
**Last verified:** 2026-07-22 (Phase 5)  
**Prerequisite:** Do **not** start this plan for public launch while `docs/LAUNCH_CHECKLIST.md` is NO-GO. Use on staging dress-rehearsal anytime.

**Related:** `docs/OBSERVABILITY.md` · `docs/PRODUCTION_RUNBOOK.md` · `docs/DISASTER_RECOVERY.md`

---

## 0. Tooling to have open

| Tool | Use |
| --- | --- |
| Synthetics | `/api/health`, `/api/ready`, `/`, `/prihlaseni`, `/cenik` |
| Admin | `/admin/monitoring`, payments/orders if live |
| Logs | Platform stdout / error webhook |
| Support | Ask users for **Reference** (digest · request id) |
| Alerts | Fingerprints from `alert-rules.ts` |

---

## 1. First hour (T+0 → T+60m)

| Watch | Threshold / action |
| --- | --- |
| `/api/ready` | Any 503 ≥ 2 consecutive checks → SEV1 |
| `/api/health` | Fail → investigate process |
| Homepage / login / cenik synthetics | Fail → page oncall |
| Error webhook / logs | Spike of 5xx → capture sample `x-request-id` |
| Auth | Failed login storm → `auth.lockout_burst` / outage rules |
| Checkout | If PSP live: webhook rejects, stuck `AWAITING_PAYMENT` |
| Kill switches | Confirm `kill.payments` **off** unless intentional |
| Maintenance | Confirm `MAINTENANCE_MODE` **unset** |
| Demo hatch | Confirm `ALLOW_DEMO_PROPERTY_CONTENT` off |

**Human checklist (every 15m):** smoke one search, one detail, one login, one pricing page.

**Abort:** ready down, auth outage, payment forgery storm → rollback / maintenance.

---

## 2. First 24 hours

| Watch | Cadence | Action |
| --- | --- | --- |
| Synthetic history | Continuous | Page on SLO breach vs `PERFORMANCE_SLO_BASELINES` |
| Payment failures 24h | Hourly | Alert `payments.failed_burst` |
| Revenue reconcile | After first night job | Workflow green; dry-run anomalies |
| Import / DLQ | Every 4h | `import.job_dlq` |
| Support tickets | Continuous | Categorize via `SUPPORT_ISSUE_CATEGORIES` |
| Session/token growth | Once | Plan `db:cleanup-retention` if not cron'd |
| Email (if wired) | Continuous | Bounce/suppress; if still noop — track as known incident |

**End of day-1 review:**  
1. Incident count + SEV  
2. Checkout conversion anomalies (ledger vs analytics — analytics may be noop)  
3. Decide: stay LIVE / partial degrade / rollback  

---

## 3. First 7 days

| Day focus | Checks |
| --- | --- |
| D2 | Reconcile repair only if dry-run clean; review AuditLog spikes |
| D3 | DB size / webhook table growth; schedule retention if missing |
| D4 | Rate-limit effectiveness (Upstash vs memory) |
| D5 | DQ / duplicate merge backlog |
| D6 | Perf: compare synthetic timings to p95 targets |
| D7 | Post-launch retro; update `SCALABILITY_RISKS.md` and checklist WAIVEDs |

**Weekly metrics (manual until dashboards exist)**

- Ready uptime %  
- 5xx rate  
- Paid orders / failed payments (if PSP)  
- Open SEV1/SEV2  
- Support volume by category  

---

## 4. Staging dress-rehearsal (recommended before any GO)

Run the 1h plan against staging with mock payments **only if** `PAYMENTS_ALLOW_MOCK=true` explicitly on staging — never on production.
