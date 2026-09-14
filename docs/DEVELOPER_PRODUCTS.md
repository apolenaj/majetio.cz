# DEVELOPER_PRODUCTS

B2B produkty pro developery nemovitostí (katalog segment `developers`).

## Produkt

| key | Název | Billing | Cena (vč. DPH) | Flag |
| --- | --- | --- | --- | --- |
| `developer_standard` | Developer Standard | SUBSCRIPTION | 9 999 Kč / měsíc | `B2B_DEVELOPER_PLANS_ENABLED` (default ON) |

Zdroj: `pricingCatalog` v `src/config/pricing-architecture.ts`.

## Co zahrnuje (katalog)

- `PROJECT_UNITS` — projekty a jednotky pod organizací  
- `ORG_BADGE` — ověřený org badge  
- `LISTING_PROMO` — přístup k listing promotions (Boost samostatně placený)  
- `LEAD_INBOX` — marketplace / QBL inbox  

**Limity (katalog):** `maxActiveListings: 500`, `seats: 25`, `projectsMax: 20`.

## Organizace

Developer plán se váže na `Organization` + seats (`docs/ORGANIZATIONS_B2B.md`, `docs/B2B_PLANS.md`).  
Downgrade nesmí tiše mazat aktivní listingy — UX pravidlo 125.

## Co není součástí

- Purchase Concierge / consumer success fee (OFF — `docs/SUCCESS_FEE_MODEL.md`)  
- Partner marketplace revenue share (OFF — `docs/PARTNER_MONETIZATION.md`)  
- Automatické daňové doklady (OFF — LEGAL_REVIEW 215)

## Checkout

`/checkout?product=developer_standard` — vyžaduje auth, Terms (211), serverovou cenu.  
Ceník: `/cenik` segment Developeři.

## Související

- `docs/PRODUCT_CATALOG.md`  
- `docs/MONETIZATION_ARCHITECTURE.md`  
- `docs/SELLER_LISTING_PRODUCTS.md` (Boost ≠ developer plan)
