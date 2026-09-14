# Domain: notifications

Property alerts for favourites & saved searches — transactional, event-driven.

## Models

- `PropertyAlert` — user-facing inbox row (dedupe, batch, channels IN_APP/EMAIL)
- `PropertyAlertSubscription` — saved-search alert prefs
- `PropertyAlertEvent` — delivery event log
- `Notification` — legacy mirror for IN_APP (created once; never on e-mail retry)

## Services

| API | Role |
| --- | --- |
| `recordPropertyPriceObservation` | Write history → `PropertyPriceChanged` |
| `recordPropertyStatusChange` | Write history → `PropertyStatusChanged` |
| `recordPropertyPublished` | → `PropertyCreated` reverse match |
| `emitPropertyDomainEvent` | Favourite alerts + reverse saved-search match |
| `deliverPropertyAlert` | Dedupe, fatigue, safe href, telemetry |
| `routeSavedSearchMatchAlert` | INSTANT / DAILY / WEEKLY / OFF |
| `runDigestJob` / `processPendingAlertEmails` | Digest + e-mail retry (no spam by default) |
| `notifySavedSearchMatch` | Batched IN_APP (+ optional EMAIL) |

## Docs

See `docs/SEARCH_NOTIFICATIONS.md` and `docs/SAVED_SEARCHES.md`.
