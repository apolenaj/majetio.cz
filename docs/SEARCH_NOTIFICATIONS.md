# SEARCH_NOTIFICATIONS — Property alerts, matching & inbox

## Model `PropertyAlert`

| Field | Notes |
| --- | --- |
| id, userId, propertyId | Owner + optional listing |
| type | See alert types below |
| eventId | Optional link to `PropertyAlertEvent` |
| channel | **IN_APP** \| **EMAIL** only |
| status | PENDING \| SENT \| READ \| FAILED \| SUPPRESSED |
| dedupeKey | Unique per user — idempotent delivery |
| batchKey | Groups saved-search digests |
| title, body, href, meta | Inbox content + CTA (href is relative-only) |
| createdAt, sentAt, readAt | Lifecycle timestamps |

Related: `PropertyAlertSubscription`, `PropertyAlertEvent`, legacy `Notification` (mirror for IN_APP only on first deliver).

## Event-driven pipeline (BOD 138)

```
recordPropertyPriceObservation / recordPropertyStatusChange / recordPropertyPublished
  → emitPropertyDomainEvent
    → favourite watchers (price / status)
    → batchMatchChangedProperties (property → saved searches, never cartesian)
      → routeSavedSearchMatchAlert (INSTANT | DAILY | WEEKLY | OFF)
```

Events: `PropertyPriceChanged`, `PropertyCreated`, `PropertyStatusChanged`.

## Alert types

| Type | Trigger |
| --- | --- |
| PRICE_DECREASE / PRICE_INCREASE | Meaningful move in `PropertyPriceHistory` for a favourite |
| STATUS_CHANGED | Lifecycle: rezervováno, prodáno, pronajato, staženo |
| RELISTED | Return to ACTIVE from sold/reserved/… |
| NEW_ANALYSIS_AVAILABLE | New analysis for a watched property |
| FINANCING_CHANGED | Financing inputs/offers changed (in-app only path — never e-mail personal financing) |
| SAVED_SEARCH_MATCH | New listing matches a saved search (batched / digest) |

Deprecated alias: `PRICE_DROP` → normalized to `PRICE_DECREASE`.

## Price alerts & corrections (BOD 139, 182)

- Ignore `INITIAL`, `CORRECTED`, `REMOVED` — corrections never fire alerts
- Same market move → one alert via `dedupeKey`
- Thresholds: `propertyAlertConfig.price`
- Audience: non-`REJECTED` favourites

## Saved search matching (BOD 70, 148, 149)

- **New** = first `SavedSearchMatch` created after `lastCheckedAt` (yesterday’s already-matched listing is not new today)
- Reverse match: iterate new/changed properties → batch active searches (size 50)
## Daily / weekly digest (BOD 141)

- Frequencies: `OFF` \| `INSTANT` \| `DAILY` \| `WEEKLY`
- Daily digest groups by **user + saved search + date** (`digestBatchKey`)
- Summary line: **`5 nových, 2 poklesy`** via `summarizeDigestItems` (also RELISTED)
- E-mail body: title/location, change kind, CTA — **never** personal financing

## Delivery, dedupe, fatigue, retry (BOD 140–142)

- Channels: IN_APP + EMAIL (transactional prefs only — **never** marketing consent)
- Statuses: PENDING → SENT / FAILED / SUPPRESSED (+ READ in inbox)
- Email failures retry via `processPendingAlertEmails` / `npm run alerts:email-retry` — **does not** recreate IN_APP `Notification`
- Digest job: `npm run alerts:digest -- --frequency=DAILY` (default sender does not spam)

## E-mail content & security (BOD 74, 136)

- Minimal: title / location, change line, CTA
- **Never** include personal financing (income, LTV, passport)
- CTA hrefs: relative paths only (`sanitizeNotificationHref`) — no open redirects

## Observability (BOD 143)

`emitAlertTelemetry` + `alertMetrics`: delivered, suppressed/duplicates, failed, job failures.

## Inbox

Route: `/ucet/upozorneni`

## Code map

- `src/config/property-alerts.ts` — thresholds
- `src/domains/notifications/events/property-events.ts` — event bus
- `src/domains/notifications/service/` — deliver, digest, e-mail, frequency router
- `src/domains/saved-searches/service/reverse-match.ts` — property → searches
- `src/domains/saved-searches/service/match-semantics.ts` — “new” definition
