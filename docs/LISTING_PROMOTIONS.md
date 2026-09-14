# LISTING_PROMOTIONS

Promotion Engine pro inzeráty (Boost). Oddělené od commerce promo kódů (`Promotion`).

## Zásadní firewall (non-negotiable)

Placená propagace **NIKDY** nesmí ovlivnit:

| Systém | Boost smí? |
| --- | --- |
| Majetio Score | **NE** |
| Valuation | **NE** |
| Risk analýza | **NE** |
| Organický ranking / `ORDER BY` | **NE** |

Boost existuje **jen** jako `sponsoredPlacements` s povinným labolem **Sponzorováno**.

## Produkty

| productKey | Délka | PricingPlan |
| --- | --- | --- |
| `boost_7_days` | 7 dní | seed `v2026.07` |
| `boost_30_days` | 30 dní | seed `v2026.07` |

Config: `src/config/listing-promotions.ts`  
Model: `ListingBoost`  
Aktivace po platbě: `activateListingBoost` ← `grantEntitlementForPaidOrder`

## Eligibility

Nelze promovat, pokud:

- status ≠ `ACTIVE`
- visibility ≠ `PUBLIC`
- `listingVerificationStatus = UNVERIFIED`
- `listingModerationStatus` ∈ `BANNED` | `RESTRICTED`
- `listingQuotaState = OVER_LIMIT`
- `isDemo = true`

## Search split

```
searchDiscovery()
    │
    ├─ organicResults   ← PropertySearchService (žádný boost v sortu)
    └─ sponsoredPlacements ← ListingBoost ACTIVE (placementWeight jen mezi ads)
```

Každý sponsored DTO:

```ts
{ sponsored: true, label: "Sponzorováno", placementId, property, productKey, endsAt }
```

`integrity` na response echo: `boostAffectsOrganicRanking: false`, …

## Docs / kód

| Oblast | Path |
| --- | --- |
| Eligibility | `src/domains/listing-promotions/eligibility.ts` |
| Service | `src/domains/listing-promotions/service.ts` |
| Sponsored search | `src/domains/listing-promotions/sponsored-search.ts` |
| Discovery facade | `src/domains/properties/service/search/discovery-search.ts` |
| Migrace | `prisma/migrations/20260721040000_listing_promotions/` |
| Search arch | `docs/PROPERTY_SEARCH.md` |

## Testy

`src/domains/listing-promotions/listing-promotions.test.ts`  
`src/domains/listing-promotions/ranking-integrity.test.ts`  
E2E: `e2e/sponsored-listing.spec.ts`

Viz také: `docs/SPONSORED_LISTINGS.md`.
