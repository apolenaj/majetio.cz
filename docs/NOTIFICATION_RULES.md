# NOTIFICATION_RULES

Metodika property alertů a saved-search notifikací (Decision Workspace).

## Kanály a kategorie

| Typ | Kanál | Consent |
| --- | --- | --- |
| Cena / stav / saved search / analýza | IN_APP + EMAIL | **Transakční** prefs |
| Marketing | EMAIL / IN_APP | Marketing consent (odděleně) |

**Zakázáno:** vydávat marketing za transakční alert (BOD 182).

## Co spouští alert

| Událost | Podmínka |
| --- | --- |
| Price change | Meaningful DECREASED/INCREASED; **ne** INITIAL/CORRECTED/REMOVED |
| Status | Lifecycle (SOLD, RESERVED, …); **ne** freshness-only STALE |
| Relisted | Návrat na ACTIVE |
| Saved search | Nový match po `lastCheckedAt` (ne historický stock) |
| Frequency | OFF / INSTANT / DAILY / WEEKLY |

## Deduplikace a stavy

- `dedupeKey` unique per user → stejná změna = max 1 alert
- Stavy: PENDING → SENT / FAILED / SUPPRESSED (+ READ)
- E-mail retry **nevytváří** druhé IN_APP Notification

## Obsah e-mailu

Minimalistický: title/location, změna, CTA.  
**Nikdy:** příjem, LTV, passport, osobní financing.

CTA: pouze relative path (`sanitizeNotificationHref`) — žádný open redirect.

## Daily digest summary

`summarizeDigestItems` → např. **„5 nových, 2 poklesy“** (plus znovu v nabídce).

## Code map

- `src/config/property-alerts.ts`
- `src/domains/notifications/`
- `docs/SEARCH_NOTIFICATIONS.md`
