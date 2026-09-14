# Decision Workspace — Závěrečný report

**Datum:** 21. 7. 2026  
**Epik:** Property Decision Workspace (favourites, comparison, sharing, alerts, analytics)  
**Mimo rozsah (záměrně neimplementováno v tomto epiku):** platby, monetizace, CRM / lead orchestration

---

## 1. Implementované modely (Prisma)

| Model | Účel |
| --- | --- |
| `Favourite` (+ collections, rejection, decisionPriority) | Shortlist / stavy |
| `Comparison`, `ComparisonProperty`, `ComparisonSnapshot` | Porovnání + stale fingerprints |
| `ComparisonShare`, `ComparisonShareInvite` | Secret link / pozvaní |
| `PropertyUserNote`, `PropertyDecisionTask` | Soukromé poznámky a úkoly |
| `SavedSearch`, `SavedSearchMatch` | Uložená hledání + shody |
| `PropertyAlert*`, `PropertyAlertEvent` | Inbox alertů + idempotence |
| `PropertyPriceHistory` | Meaningful price moves |

---

## 2. Analytika

**Funnel:** `viewed → saved → shortlisted → compared → analysis → purchase_intent`

| Event | Props (bez PII) |
| --- | --- |
| `property_favorited` | action, is_demo, status? |
| `property_shortlisted` | is_demo |
| `comparison_created` | property_count |
| `price_alert_opened` | alert_type, channel |
| `decision_funnel_step` | step |
| `decision_note_saved` | length_bucket **only** |
| `decision_task_created` | task_type |

`assertAnalyticsSafe` blokuje `note` / `content` / finance keys.  
Agregace: `decision-metrics.ts` (save/compare/shortlist rates).

---

## 3. Pokrytí testy

| Oblast | Soubory |
| --- | --- |
| Analytics + funnel | `decision-analytics.test.ts` |
| Forbidden approaches audit | `forbidden-approaches.audit.test.ts` |
| Share-safe + token access | `share-safe.test.ts`, `share-access.test.ts`, `share-idor*.test.ts` |
| Alerts (CORRECTED, digest, match) | `alerts-matching.test.ts`, `property-alerts.test.ts` |
| Comparison decision / stale | `decision-engine.test.ts` |
| Favourites IDOR | `favourites/idor.test.ts` |
| E2E gates + demo | `e2e/decision-workspace.spec.ts` |
| E2E complex flow | `e2e/decision-workspace-flow.spec.ts` |

---

## 4. Bezpečnost

| Mechanismus | Stav |
| --- | --- |
| Session-scoped `userId` (IDOR) | Actions + services |
| Share-safe payload | Forbidden keys + e-mail guard |
| Secret token | 32 B, hash-only, expiry, revoke |
| Rate limits | favourite / comparison / note / share |
| Account delete | Hard delete + cascade (`ACCOUNT_RETENTION.md`) |
| Alert anti-spam | dedupe + fatigue + CORRECTED ignore |
| Notes / favourites | Owner-only, never public / share |

---

## 5. Audit zakázaných přístupů

| Pravidlo | Výsledek |
| --- | --- |
| Missing data ≠ 0 | `null` / „Není k dispozici“ ve ViewModel |
| Spam notifikací | dedupe + daily limits + CORRECTED off |
| Magický vítěz | Decision Matrix = vážené ranky; žádné „Kupte tuto“ |
| Notes/favourites public | Ne — owner scope + share strip |
| N+1 na shortlistu | Slim `findMany` → hydrate page |
| Open redirect v CTA | `sanitizeNotificationHref` |

---

## 6. Dokumentace

- `docs/DECISION_WORKSPACE.md`
- `docs/PROPERTY_COMPARISON.md`
- `docs/SAVED_SEARCH_MATCHING.md` *(nové)*
- `docs/SAVED_SEARCHES.md`, `docs/SEARCH_NOTIFICATIONS.md`, `docs/NOTIFICATION_RULES.md`
- `docs/ACCOUNT_RETENTION.md`, `docs/COMPARISON_ENGINE.md`

---

## 7. Aktuální omezení

1. Analytics provider je stub (`console.debug` v dev) — připraveno na napojení
2. Plný authenticated Playwright (seed user + DB price alert) vyžaduje test DB seed
3. INVITED_USERS share má server API; UI primárně SECRET_LINK
4. Digest e-mail sender defaultně neodesílá (anti-spam) — job připraven
5. **CRM / payments / monetizace** — záměrně mimo tento report

---

## 8. Code map (rychlá navigace)

```
src/domains/favourites/
src/domains/comparisons/ (+ share/, decision/)
src/domains/decision-workspace/
src/domains/notifications/
src/domains/saved-searches/
src/lib/analytics/{events,decision-metrics}.ts
```
