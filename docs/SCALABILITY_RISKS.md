# Scalability Risks — Majetio.cz

**Owner:** Tech Lead / SRE  
**Last verified:** 2026-07-22 (Phase 5)  
**Related:** `docs/PERFORMANCE_AUDIT.md` · `docs/DATABASE_PERFORMANCE.md` · `docs/EXTERNAL_DEPENDENCY_REGISTER.md`

Honest list of what breaks first as traffic or data grows. Severity = impact if unmitigated at launch scale.

| ID | Risk | Evidence | Severity | Mitigation |
| --- | --- | --- | --- | --- |
| S-01 | **No live PSP** — cannot scale paid conversion | `payments` = none/mock | Launch blocker | Wire PSP before GO |
| S-02 | **No transactional email** — auth/recovery UX breaks at volume | Email noop | Launch blocker | Wire provider |
| S-03 | **In-memory rate limit** without Upstash | `rate-limit.ts` | High on multi-instance | Set Upstash in prod |
| S-04 | **SystemJob workers incomplete / unscheduled** | Phase 1 audit | High | Cron + real workers |
| S-05 | **Retention jobs unscheduled** | Only reconcile GHA | High | Schedule `db:cleanup-retention` |
| S-06 | **Property import volume** without DQ gates ops | Import + DQ models | Medium–High | Quotas, admin stop switch |
| S-07 | **AuditLog / webhook / metrics growth** | Append-heavy tables | Medium | Retention + partitioning later |
| S-08 | **Search without dedicated search engine** | Prisma Postgres | Medium | Indexes now; OpenSearch later if needed |
| S-09 | **Valuation comps explosion** | CPU engine | Medium | Cap comps; cache estimates |
| S-10 | **SSR + middleware on all matched routes** | Next middleware | Low–Medium | Keep matchers tight |
| S-11 | **Single-region assume** | No multi-region in code | Medium | DR RTO 1h redeploy |
| S-12 | **Analytics noop** — no capacity planning data | provider noop | Medium | Wire analytics before growth bets |
| S-13 | **Error tracker noop** | Missing webhook | High for ops | Set `ERROR_TRACKER_WEBHOOK_URL` |
| S-14 | **Favourites cap 200** | Code hard limit | Low | Intentional; document UX |
| S-15 | **International markets RESEARCH/PLANNED** | Market plugins | Low until enabled | LIVE barrier in registry |
| S-16 | **CI lint/tsc red** | Phase 4 | High process risk | Fix before scale hiring/ship |

### Explicit non-risks (today)

- AI token spend — **ABSENT**  
- Multi-currency commerce — CZ CZK-centric commerce config  
- Live HJ bank API quota — default is **dev adapter**

### Review cadence

Re-read this file after: first 1k MAU, first paid PSP week, first import source at full volume.
