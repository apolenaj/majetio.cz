# Domain: saved-searches

Uložená hledání (Prompt 8 Part 4).

## Model

- `SavedSearch`: `name`, `filters` (JSON, versioned), `sort`, `filtersVersion`, `alertFrequency` (`OFF` | `INSTANT` | `WEEKLY`)
- Filters payload: `{ version: 1, state: PropertyUrlFilterState }` via `filters-version.ts`

## Server actions

- `listSavedSearches`, `createSavedSearch`, `renameSavedSearch`, `deleteSavedSearch`, `setSavedSearchAlertFrequency`
- Creating / enabling alerts syncs `PropertyAlertSubscription` rows (no mail jobs yet)

## UI

- Account: `/ucet/ulozena-hledani`
- Discovery: „Uložit hledání“ on `/nemovitosti` (auth-gated)
