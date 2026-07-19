# PROPERTY_DETAIL — Detail nemovitosti

Prompt 9 Decision Cockpit. **Není** Valuation Engine (další prompt).

## Architektura

```
/nemovitosti/[slug]
        │
        ▼
loadPropertyDetailBySlug (React cache)
        │
        ├─► canViewProperty (IDOR → null → 404)
        ├─► toPublicPropertyDto (strip internals)
        │
        ├─► getPropertyFinancialDemo(slug)   // Part 3 overlay
        └─► getPropertyContextDemo(slug)     // Part 4 overlay
                 │
                 ▼
        Decision Cockpit UI + sticky section nav
```

### Klíčové soubory

| Vrstva | Cesta |
| --- | --- |
| Route | `src/app/(discovery)/nemovitosti/[slug]/page.tsx` |
| Loader | `src/domains/properties/service/detail-loader.ts` |
| SEO | `src/domains/properties/service/detail-seo.ts` |
| DTO | `src/domains/properties/service/dto.ts` |
| Financial overlay | `src/content/demo-property-financial.ts` |
| Context overlay | `src/content/demo-property-context.ts` |
| UI | `src/components/property/property-*.tsx` |

## Bezpečnost

- Private visibility: jen owner / staff; cizí uživatel → `null` / 404
- Media: PROHIBITED/RESTRICTED bez URL
- AddressPrecision HIDDEN: žádná mapa, žádná street line
- Analytics: žádné CZK, e-maily, adresy

## Performance

- `cache()` na loader + viewer (metadata + page = 1 load)
- Demo repo je in-memory (žádné N+1); budoucí Prisma: `include` media/history/sources
- Lazy chunks: lokalita/mapa, historie, waterfall
- Mobil: progressive disclosure (`MobileDisclosure`)

## Related docs

- [DECISION_COCKPIT.md](./DECISION_COCKPIT.md)
- [PROPERTY_RISK_PRESENTATION.md](./PROPERTY_RISK_PRESENTATION.md)
- [SEO_ARCHITECTURE.md](./SEO_ARCHITECTURE.md)
- [PROPERTY_SEARCH.md](./PROPERTY_SEARCH.md)
