# SPONSORED_LISTINGS

Fáze 5 — placené Boosty / sponsored placements (checklist **181**, firewall **217 / 218 / 224**, integrity **182 / 219**).

Navazuje na `docs/LISTING_PROMOTIONS.md`.

## Produkty

| productKey | Délka | Expirace |
| --- | --- | --- |
| `boost_7_days` | 7 dní | `endsAt` → status `EXPIRED` |
| `boost_30_days` | 30 dní | totéž |

Aktivace: `activateListingBoost` po `payment.succeeded` (feature flag `LISTING_BOOST_ENABLED`).  
Checkout musí nést `propertyId`.

Expirace:

- Lazy: `fetchSponsoredPlacements` volá `expireListingBoosts` před výběrem ads  
- Cron: `npm run boosts:expire` → `scripts/expire-listing-boosts.ts`

## Commercial firewall (218)

Placené umístění **NESMÍ** ovlivnit:

| Systém | Povoleno? |
| --- | --- |
| Majetio Score | **NE** |
| Valuace | **NE** |
| Risk | **NE** |
| Organický ranking / doporučení | **NE** |

Kód: `src/domains/listing-promotions/commercial-firewall.ts`  
`buildMajetioScoreFeatures` scrubuje forbidden keys (`placementWeight`, `boost`, …).

Search split:

```
organicResults  ← PropertySearchService / demo cards (žádný ListingBoost v ORDER BY)
sponsoredPlacements ← ListingBoost ACTIVE + label „Sponzorováno“
```

UI: `/nemovitosti` renderuje sponzorovanou sekci **nad** organikou (`data-testid="sponsored-placements"`), badge `SponsoredListingBadge`.

## Disclosure

Každý placement: `sponsored: true`, `label: "Sponzorováno"`.  
Disclaimer: „Sponzorované umístění neovlivňuje Majetio Score…“

## Testy

- `ranking-integrity.test.ts` — score fingerprint před/po boostu stejný (182/219)  
- `listing-promotions.test.ts` — eligibility + compose  
- E2E: `e2e/sponsored-listing.spec.ts` (193)

## Související

- `docs/QUALIFIED_BUYER_LEADS.md`  
- `docs/LEAD_BILLING.md`  
- `docs/SUCCESS_FEE_MODEL.md`  
- `docs/PROPERTY_SEARCH.md`  
