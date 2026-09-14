# PRODUCT_CATALOG

Produktový katalog Majetio — mapování na `pricingCatalog` (`src/config/pricing-architecture.ts`) a entitlements / org limity.

Verze katalogu: `v2026.07` (`PRICING_VERSION_KEY`).

## Kupující (B2C)

| key | Název | Typ | Entitlement | Cena (Kč vč. DPH) |
| --- | --- | --- | --- | --- |
| `majetio_free` | Majetio Free | free | BASIC_SCORE, BASIC_RISKS | 0 |
| `basic_analysis` | Základní analýza | free | basic_analysis | 0 |
| `deep_analysis` | Deep Analysis | one-time | deep_analysis (90 dní refresh) | 4 990 |
| `full_analysis` | Kompletní analýza | one-time | full_analysis | 4 990 |
| `buyer_pass` | Buyer Pass | one-time (30 dní) | buyer_pass | 1 499 |

## Investoři

| key | Název | Typ | Cena | Poznámka |
| --- | --- | --- | --- | --- |
| `investor_pro_monthly` | Investor Pro měsíční | subscription | 999 | `requiresRenewConsent`, flag `INVESTOR_PRO_ENABLED` |
| `investor_pro_annual` | Investor Pro roční | subscription | 9 990 | totéž |

## Prodávající

| key | Název | Typ | Cena | Poznámka |
| --- | --- | --- | --- | --- |
| `boost_7_days` | Boost 7 dní | one-time | 499 | sponzorováno ≠ organika / score |
| `boost_30_days` | Boost 30 dní | one-time | 1 499 | flag `LISTING_BOOST_ENABLED` |

## Makléři (B2B)

| key | Název | Cena | Limity (katalog) |
| --- | --- | --- | --- |
| `agent_free` | Agent Free | 0 | 5 nabídek, 1 seat |
| `agent_pro` | Agent Pro | 1 499 | 40 nabídek, 1 seat |
| `agency_growth` | Agency Growth | 4 999 | 200 nabídek, 15 seatů |

## Developeři (B2B)

| key | Název | Cena | Limity (katalog) |
| --- | --- | --- | --- |
| `developer_standard` | Developer Standard | 9 999 | 500 nabídek, 25 seatů, 20 projektů |

## Profesionální služby

| key | Název | Cena | Stav |
| --- | --- | --- | --- |
| `expert_review` | Expert Review | 2 990 | HITL, flag ON |
| `investment_audit` | Investment Audit | 7 990 | HITL, flag ON |
| `purchase_concierge` | Purchase Concierge | individuálně | **OFF** (`TRANSACTION_SUCCESS_FEE_ENABLED`) |

## Checkout a UI

- Veřejná CTA: `/checkout?product=<key>` (ceny z `PricingPlan`)
- Ceník: `/cenik` — segmenty Kupující / Investoři / Prodávající / Makléři / Developeři (+ služby)
- Homepage preview: `getCatalogProductByKey` — žádné hardcoded Kč
- Klient nikdy neposílá částku — viz `docs/PRICING_MODEL.md` § Integrita ceny
- Seed / upsert: `ensureDefaultPricingPlans()` z `pricingCatalog`

## Související dokumentace

- `docs/PRICING_MODEL.md`
- `docs/ENTITLEMENTS_B2C.md`
- `docs/ORGANIZATIONS_B2B.md`
- `docs/LISTING_PROMOTIONS.md`
- `docs/PROFESSIONAL_SERVICES.md`
