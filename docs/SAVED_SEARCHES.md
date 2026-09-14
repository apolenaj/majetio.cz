# SAVED_SEARCHES — Uložená hledání

## Model

`SavedSearch`: `name`, `filters` (JSON versioned), `sort`, `filtersVersion`, `alertFrequency` (`OFF`|`INSTANT`|`DAILY`|`WEEKLY`).

Filters payload v1:

```json
{ "version": 1, "state": { /* PropertyUrlFilterState */ } }
```

## Actions

`listSavedSearches`, `createSavedSearch`, `renameSavedSearch`, `deleteSavedSearch`, `setSavedSearchAlertFrequency`.

UI: `/ucet/ulozena-hledani` + „Uložit hledání“ na katalogu.

## Matching & alerts

`PropertyAlertSubscription` + `PropertyAlertEvent` + `PropertyAlert` inbox + **`SavedSearchMatch`**.

### “Nové” (BOD 70)

Nová shoda = řádek `SavedSearchMatch` vytvořený **po** `lastCheckedAt`. Baseline při prvním checku označí historický stock jako `notifiedAt` (nejsou „nové“).

### Reverse matching (BOD 148, 149)

Event / batch: nové nebo změněné `propertyIds` → `batchMatchChangedProperties` → test proti aktivním hledáním po dávkách. Nikdy kartézský součin všech nabídek × všech hledání.

### Frekvence (BOD 72, 141)

| Frequency | Chování |
| --- | --- |
| OFF | žádné notifikace |
| INSTANT | IN_APP + EMAIL ihned (batched per search/day) |
| DAILY | IN_APP batch + EMAIL digest (`user` + `savedSearch` + den) |
| WEEKLY | stejně, ISO week bucket |

Jobs: `npm run alerts:digest`, `npm run alerts:email-retry`. Detail: `docs/SEARCH_NOTIFICATIONS.md`.

Analytika: `saved_search_created`, `saved_search_alert_updated` (jen agregáty: filter_count, sort, frequency).
