# SAVED_SEARCH_MATCHING

Business pravidla shody uloženého hledání a alertů (Decision Workspace).

## Definice „nové shody“

**Nová shoda** = první `SavedSearchMatch` vytvořený **po** `lastCheckedAt` daného hledání.

| Situace | Alert? |
| --- | --- |
| První sync (baseline, `lastCheckedAt = null`) | Ne — historický stock se jen označí |
| Nabídka už matchovala včera | Ne (`createdNow: false`) |
| Nová nabídka po poslední kontrole | Ano → `NEW_PROPERTY` / `SAVED_SEARCH_MATCH` |
| Pokles ceny u matchující nabídky | Ano → `PRICE_DROP` (jen meaningful DECREASED) |
| Relisting (návrat na ACTIVE) | Ano → `RELISTED` |
| `CORRECTED` / `INITIAL` / `REMOVED` cena | **Ne** |

Helper: `isNewMatchAfterLastCheck` (`src/domains/saved-searches/service/match-semantics.ts`).

## Reverse match (žádný kartézský produkt)

```
PropertyCreated | PropertyPriceChanged(DECREASED) | PropertyStatusChanged(→ACTIVE)
  → batchMatchChangedProperties(propertyIds, eventKind)
    → dávky aktivních SavedSearch (50)
      → propertyMatchesSavedSearch
        → routeSavedSearchMatchAlert(frequency)
```

## Frekvence

| Frequency | Chování |
| --- | --- |
| `OFF` | nic |
| `INSTANT` | ihned IN_APP + EMAIL (dedupe) |
| `DAILY` | digest batch key `user+search+day` — např. „5 nových, 2 poklesy“ |
| `WEEKLY` | ISO week bucket |

## Limity / anti-spam

- `dedupeKey` unique per user → 1 změna = max 1 alert
- Fatigue: `maxPerUserPerDay`, `maxPerPropertyPerDay` (`property-alerts.ts`)
- CORRECTED nikdy nealertuje
- E-mail: title/location/change/CTA — **žádné** financing / notes

## Code map

- `src/domains/saved-searches/service/`
- `src/domains/notifications/service/{frequency-router,digest,saved-search-alerts}.ts`
- Docs: `docs/SAVED_SEARCHES.md`, `docs/SEARCH_NOTIFICATIONS.md`
