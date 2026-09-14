# SELLER_LISTING_PRODUCTS

Produkty a nástroje pro prodávající / makléře na Majetio (seller + broker side).

## Listing produkty

| Produkt | Typ | Popis |
| --- | --- | --- |
| Organický inzerát | Free (v limitu plánu) | `Property` pod `Organization`, kvóta `listingsLimit` |
| Boost 7 / 30 dní | One-time | Sponzorované umístění — **neovlivní** Majetio Score ani organiku |
| Agent Free / Pro / Agency Growth | B2B plán | Limity nabídek + seatů — viz `docs/B2B_PLANS.md` |

## Ověření inzerce

`listingVerificationStatus` na Property (propagace z Organization):

1. `UNVERIFIED` — bez odznaku  
2. `IDENTITY_VERIFIED` — odznak ověřené identity  
3. `ORGANIZATION_VERIFIED` — odznak ověřené organizace  

Boost vyžaduje ověření (viz `listing-promotions` eligibility).  
Odznak = **ověřená identita/organizace**, ne marketingový „top agent“.

## Broker tools (`/profi`)

- Onboarding + editovatelný profil makléře  
- Agency Dashboard (kvóty, QBL, agregátní metriky)  
- Listing Analytics (impressions / saves / inquiries — bez PII)  
- Qualified Buyer inbox (SLA, anonymizovaný profil, accept / first response)  
- CRM pipeline (owner, next action, expected value interní)

## Lead funnel (seller view)

```
Inquiry (kontakt)
    ↓ qualification rules (non-discriminatory)
QualifiedBuyerLead (anonymized → accept → optional FP share)
    ↓ optional
Lead (CRM pipeline) + expectedValue (interní)
    ↓
RevenueEvent (až při skutečném pay-per-lead / success fee)
```

## Privacy

- Analytics: jen agregáty, `containsPii: false`  
- QBL před accept: bez emailu/telefonu/FinancialProfile  
- Expected value: jen CRM staff/broker — ne buyer UI  
- Žádný veřejný ranking makléřů (`publicRankingEnabled: false`)

## Související

- `docs/CRM_ARCHITECTURE.md`  
- `docs/LISTING_PROMOTIONS.md`  
- `docs/MARKETPLACE_LEADS.md`  
- `docs/REVENUE_ATTRIBUTION.md`  
- `docs/PRODUCT_CATALOG.md` (Boost, Agent plány)  
