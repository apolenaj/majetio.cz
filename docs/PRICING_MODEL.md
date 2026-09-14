# PRICING_MODEL

Fáze 1 monetizace — Pricing Architecture (checklist **221**, UX **124–128**, rollout **165–166**, integrity **171–172**).

## Zdroj pravdy

| Vrstva | Účel |
| --- | --- |
| `src/config/pricing-architecture.ts` | Kanonický katalog listových cen (haléře, DPH v ceně) + segmenty |
| `PricingPlan` (DB) | Runtime checkout — verzovaný plán, ze kterého se fakticky účtuje |
| `src/config/pricing-ux.ts` | B2C/B2B UX pravidla + tvrdý zákaz dark patterns |
| `src/config/feature-flags.ts` | Postupné spouštění produktů |

UI **nesmí** hardcodovat Kč. Stránka `/cenik` bere ceny z `buildPricingPageModel` (DB plán + katalog). Homepage preview používá `getCatalogProductByKey`.

`ensureDefaultPricingPlans()` a DB fallback seedují z `pricingCatalog` — jedna tabulka cen.

## Segmenty (vizuálně oddělené na `/cenik`)

1. **Kupující** — Free, Deep Analysis, Buyer Pass  
2. **Investoři** — Investor Pro (měsíční / roční)  
3. **Prodávající** — Boost 7 / 30 dní  
4. **Makléři** — Agent Free / Pro, Agency Growth  
5. **Developeři** — Developer Standard  
6. **Profesionální služby** — Expert Review, Investment Audit, Purchase Concierge (flag)

## Ceník (bod 221) — listové ceny

Částky v Kč včetně DPH (v kódu × 100 = `priceGrossMinor`):

| Produkt | Segment | Cena |
| --- | --- | --- |
| Majetio Free / Základní analýza | Kupující | 0 |
| Deep Analysis / Kompletní analýza | Kupující | 4 990 |
| Buyer Pass (30 dní) | Kupující | 1 499 |
| Investor Pro měsíční / roční | Investoři | 999 / 9 990 |
| Boost 7 / 30 dní | Prodávající | 499 / 1 499 |
| Agent Free / Pro | Makléři | 0 / 1 499 |
| Agency Growth | Makléři | 4 999 |
| Developer Standard | Developeři | 9 999 |
| Expert Review / Investment Audit | Služby | 2 990 / 7 990 |
| Purchase Concierge | Služby | Individuálně (flag OFF) |

## Feature flags (165 / 166)

Defaultní stav (`FEATURE_FLAG_DEFAULTS`):

| Flag | Default |
| --- | --- |
| `TRANSACTION_SUCCESS_FEE_ENABLED` | **OFF** |
| `PARTNER_MARKETPLACE_ENABLED` | **OFF** |
| `INVESTOR_PRO_ENABLED` | ON |
| `LISTING_BOOST_ENABLED` | ON |
| `B2B_*_PLANS_ENABLED` | ON |
| `EXPERT_REVIEW_ENABLED` / `INVESTMENT_AUDIT_ENABLED` | ON |

Přepínání přes env (viz `.env.example`).

## UX pravidla (124–128)

- **124 B2C** — free tier první, jasné jednorázové vs. předplatné  
- **125 B2B** — seat + listing limity vpředu; downgrade → `OVER_LIMIT` (ne mazání)  
- **126 Services** — human-in-the-loop, bez „automatické analýzy“  
- **127** — matice limitů/funkcí na `/cenik`  
- **128 Dark patterns** — zakázáno: tiché auto-renew, předzaškrtnutý souhlas s obnovou, fake odpočty / umělá nedostupnost, skryté poplatky  

`autoRenewDefault` u všech katalogových produktů je `false`. Obnova předplatného vyžaduje výslovný souhlas (`requiresRenewConsent`). UI volá `renewConsentInitialChecked()` → vždy `false`.

## Integrita ceny (171 / 172)

1. Klient **nesmí** poslat `amountGrossMinor` / `priceCzk` / `amountCzk` — `parseCheckoutOrderInput` (`.strict()` + `z.never()`).  
2. `resolveCanonicalCheckoutAmount` vždy vrací cenu z `PricingPlan`; klientská částka se ignoruje.  
3. `createCheckoutOrder` ověří, že `unitListGrossMinor` = kanonická cena plánu.

Testy: `src/config/pricing-architecture.test.ts`.

## Související

- `docs/PRODUCT_CATALOG.md` — produktový katalog  
- `docs/PROFESSIONAL_SERVICES.md` — Concierge / HITL  
- `docs/ORGANIZATIONS_B2B.md` — B2B limity  
- `docs/SUBSCRIPTIONS.md` — obnova bez dark patterns  
