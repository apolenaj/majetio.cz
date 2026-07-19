# Domain: notifications

Property alert foundation (Prompt 8 Part 4) — data layer only.

## Models

- `PropertyAlertSubscription` — user + optional saved search + `PRICE_DROP` | `NEW_PROPERTY` | `SAVED_SEARCH_MATCH`
- `PropertyAlertEvent` — undelivered events (`deliveredAt` null) for a future worker

## Service

- `enqueuePropertyAlertEvent` — record an event
- `syncAlertSubscriptionsForSavedSearch` — enable/disable subscriptions from saved-search frequency
- `listUndeliveredAlertEvents` — pending queue peek

No email jobs or cron workers in this phase.
