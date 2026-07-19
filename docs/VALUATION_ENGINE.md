# VALUATION_ENGINE

Prompt 10 — produkční valuation engine Majetio (residential apartment v1).

## Architektura

```
Property (canonical)
    │
    ▼
ValuationSubject + ComparableCandidates
    │
    ▼
selectAndWeightComparables  →  outliers (mark, never delete)
    │
    ▼
base (weighted median Kč/m²)  →  feature adjustments
    │
    ▼
range (p20/p80) + confidence  →  edge-case gate
    │
    ▼
ValuationService → PublicValuationDto | AnalystValuationDto
    │
    ▼
/nemovitosti/[slug]  (Cena vs odhad, comps, úpravy, disclaimer)
```

## Persistence (Prisma)

| Model | Role |
| --- | --- |
| `Valuation` | Výsledek + frozen `inputSnapshot` |
| `ValuationComparable` | Comps + weights / exclusionReason |
| `ValuationAdjustmentAudit` | Append-only analyst overrides |
| `ValuationModelRegistry` | `residential_apartment_v1` |

## Runtime (aktuálně)

- Math core: pure TS (`src/domains/valuation/service/`)
- Candidates: demo pool `src/content/demo-valuation-comparables.ts` (+ synthetic fixtures for tests)
- Detail load: `loadPropertyValuationBySlug` (React `cache`) — bez recompute N× za request
- Přepočet: `shouldRecalculateValuation` — **ne** na každý page view

## Security

- Public DTO: bez vah, confidence score čísla, input snapshotu, analyst comps
- Licence comps: `ANONYMIZE` → anonymní label + zaokrouhlená cena
- SEO: `Offer.price` = **jen nabídková cena**, nikdy Majetio odhad

## Related

- [VALUATION_METHOD.md](./VALUATION_METHOD.md)
- [VALUATION_CONFIDENCE.md](./VALUATION_CONFIDENCE.md)
- [VALUATION_MODEL_CARD.md](./VALUATION_MODEL_CARD.md)
- Domain README: `src/domains/valuation/README.md`
