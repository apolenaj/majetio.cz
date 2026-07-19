# SAVED_SEARCHES — Uložená hledání

## Model

`SavedSearch`: `name`, `filters` (JSON versioned), `sort`, `filtersVersion`, `alertFrequency` (`OFF`|`INSTANT`|`WEEKLY`).

Filters payload v1:

```json
{ "version": 1, "state": { /* PropertyUrlFilterState */ } }
```

## Actions

`listSavedSearches`, `createSavedSearch`, `renameSavedSearch`, `deleteSavedSearch`, `setSavedSearchAlertFrequency`.

UI: `/ucet/ulozena-hledani` + „Uložit hledání“ na katalogu.

## Alerty (foundation only)

`PropertyAlertSubscription` + `PropertyAlertEvent` — sync při změně frekvence. **Bez mail workerů.**

Analytika: `saved_search_created`, `saved_search_alert_updated` (jen agregáty: filter_count, sort, frequency).
