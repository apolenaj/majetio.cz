# PROPERTY_SEARCH — Discovery search architecture

Prompt 8 discovery vrstva. **Není** detail nemovitosti (Prompt 9).

## Architektura

```
URL (?lokalita=…&cena-do=…)
        │
        ▼
parsePropertySearchParams  →  PropertyUrlFilterState
        │
        ├─► applyUrlFiltersToListings (demo / in-memory)
        │
        └─► urlStateToSearchInput → searchDiscovery / PropertySearchService
                 │
                 ├ Zod whitelist filtrů + sort presets
                 ├ always ACTIVE + PUBLIC + CLEAR + WITHIN_LIMIT (anonymous)
                 ├ page / cursor pagination
                 ├ index-backed WHERE (status + city/type/price/…)
                 │
                 ▼
         ┌───────────────────────────────────────┐
         │  organicResults                       │  ← žádný ListingBoost v ORDER BY
         │  sponsoredPlacements (odděleně)       │  ← jen ads, label Sponzorováno
         └───────────────────────────────────────┘
```

### Organic vs sponsored (firewall)

| Kanál | Zdroj řazení | Boost smí ovlivnit? |
| --- | --- | --- |
| `organicResults` | whitelist sort / match score | **NE** |
| `sponsoredPlacements` | `placementWeight` mezi ads | ano (jen tento kanál) |

Placená propagace **nikdy** nemění Majetio Score, valuation, risk ani organický ranking.  
Detail: [LISTING_PROMOTIONS.md](./LISTING_PROMOTIONS.md).

Každé placené zobrazení musí mít `sponsored: true` a label **Sponzorováno**.

### Klíčové soubory

| Vrstva | Cesta |
| --- | --- |
| URL state | `src/domains/properties/search/url-state.ts` |
| Client filters | `src/domains/properties/search/apply-filters.ts` |
| Search service | `src/domains/properties/service/search/` |
| Discovery + sponsored | `…/search/discovery-search.ts` |
| Listing Boost | `src/domains/listing-promotions/` |
| Zod schema | `src/domains/properties/schemas/search.ts` |
| Match score | `src/domains/properties/service/match-score.ts` |
| SEO landings | `src/domains/properties/search/seo-landings.ts` |
| Analytics aggregates | `src/domains/properties/search/analytics-aggregates.ts` |
| UI | `src/components/property/search/*` |

## Bezpečnost query

- Žádný raw SQL `ORDER BY` z klienta — jen whitelist presets (`newest`, `price_asc`, …, `recommended`)
- Enumy property type / condition / ownership whitelistovány
- Page size clamp (`DEFAULT_PAGE_SIZE` / `MAX_PAGE_SIZE`)
- Discovery always scoped na `status=ACTIVE` + `visibility=PUBLIC` + `listingModerationStatus=CLEAR` + `listingQuotaState=WITHIN_LIMIT`
- Boost fields (`placementWeight`, `ListingBoost`) **nesmí** být ve whitelistu organic sortů

## Performance

Migrace `20260719050000_search_discovery_indexes`:

- `(status, propertyType, askingPrice)`
- `(status, publicCity, propertyType)`
- `(status, publishedAt)`, layout, area, ownership, condition

Pagination: offset + optional cursor (`take+1` hasMore). Doporučené řazení je aplikační (match score), DB fallback = `publishedAt desc`.

Sponsored: samostatný query na `ListingBoost` (ACTIVE, time window) + property eligibility — nejoinovat do organic `ORDER BY`.

## Related docs

- [LISTING_PROMOTIONS.md](./LISTING_PROMOTIONS.md)
- [SEARCH_FILTERS.md](./SEARCH_FILTERS.md)
- [PROPERTY_RECOMMENDATIONS.md](./PROPERTY_RECOMMENDATIONS.md)
- [MATCH_SCORE.md](./MATCH_SCORE.md)
- [SEO_ARCHITECTURE.md](./SEO_ARCHITECTURE.md)
