# Monetizace — Závěrečný report (Definition of Done)

**Datum:** 2026-07-21  
**Modul:** Monetizace Majetio.cz (fáze 1–7)  
**Stav:** **HOTOV** — Definition of Done splněna.

> **Poznámka pro další práci:** Implementace monetizace je dokončena. **Nezačínejte Prompt 17** (mezinárodní architektura / Majetio.com) — ten bude zadán zvlášť.

---

## 1. Shrnutí

Monetizace pokrývá katalog a ceník, server-authoritative checkout, platby a entitlements, B2B CRM / QBL billing, sponsored listings s commercial firewall, admin revenue ledger (MRR/ARR/GMV), legal gates (consent + feature flags OFF) a dokumentaci. Sporné legal/accounting plochy zůstávají defaultně vypnuté.

---

## 2. Architektura

```
Catalog + Feature flags + LEGAL_REVIEW
        ↓
Checkout (Terms 211, no marketing 212, no client price)
        ↓
Order → Payment webhook → Entitlement → RevenueEvent
        ↓
Admin /metrics · reconciliation · audit log
        ↓
B2B: QBL MODE A/B · Boost (firewall) · Fraud guards
```

Principy: GMV ≠ revenue; Boost ≠ Score; entitlement až po platbě; sporné features za flagem OFF.

Detail: `docs/MONETIZATION_ARCHITECTURE.md`.

---

## 3. Fáze 1–7 — dodávka

| Fáze | Obsah | Stav |
| --- | --- | --- |
| 1 | Pricing Architecture, katalog, UX anti dark-patterns | ✅ |
| 2 | Checkout, payments, webhooks, refunds | ✅ |
| 3 | Entitlements & subscriptions | ✅ |
| 4 | B2B CRM & broker dashboard | ✅ |
| 5 | Sponsored listings + ranking integrity | ✅ |
| 6 | Admin monetizace, LTV/CAC, reconcile, audit | ✅ |
| 7 | Legal consents, flags, docs 220, anti-patterns 226, DoD | ✅ |

---

## 4. Legal & consent (211–215)

| Požadavek | Stav |
| --- | --- |
| Versioned Terms při nákupu (211) | ✅ `recordPurchaseTermsAcceptance` |
| Marketing oddělený od nákupu (212) | ✅ schema `z.never` + account `/ucet/souhlasy` |
| Consumer withdrawal OFF (213) | ✅ `CONSUMER_WITHDRAWAL_ENABLED=false` |
| Success fee / Concierge / Partner OFF (214/215) | ✅ flags default false |
| Automated invoices OFF (215) | ✅ `AUTOMATED_INVOICE_ENABLED=false` |
| VAT označen LEGAL_REVIEW | ✅ registry `vat_treatment` |

Assert: `assertDisputedFeaturesDefaultOff()`.

---

## 5. Dokumentace (220)

| Soubor | Účel |
| --- | --- |
| `docs/MONETIZATION_ARCHITECTURE.md` | Přehled architektury |
| `docs/DEVELOPER_PRODUCTS.md` | Developer Standard |
| `docs/PARTNER_MONETIZATION.md` | Partner marketplace (OFF) |
| `docs/MONETIZATION_LEGAL_REVIEW.md` | Legal gates + anti-patterns 226 |
| `docs/MONETIZATION_TEST_PLAN.md` | Test plán / 227 |
| `docs/MONETIZATION_FINAL_REPORT.md` | Tento report (228) |

Doplněno: `docs/CONSENT_MANAGEMENT.md` (purchase Terms).

---

## 6. Anti-patterns (226) — audit

Kanonický seznam: `src/config/monetization-anti-patterns.ts`.

| Anti-pattern | Výsledek |
| --- | --- |
| Client-controlled price | **PASS** |
| Unlimited free abuse | **PASS** |
| Marketing bundled with purchase | **PASS** |
| Pre-checked marketing / renew | **PASS** |
| Silent auto-renew / fake scarcity / hidden fees | **PASS** |
| Boost affects Score / organic | **PASS** |
| GMV as revenue / LTV | **PASS** |
| Double revenue attribution | **PASS** |
| Entitlement before paid | **PASS** |
| Concierge claims while OFF | **PASS** |
| Empty free paywall | **PASS** |
| Disputed legal features default ON | **PASS** |

---

## 7. Testování (227)

### Unit / security (Vitest) — ověřeno 2026-07-21

| Suite | Výsledek |
| --- | --- |
| `monetization-phase7.test.ts` | ✅ |
| `pricing-architecture.test.ts` | ✅ |
| `revenue-ledger-phase6.test.ts` | ✅ |
| `idor.test.ts` + `tenant-idor.test.ts` | ✅ |
| `webhook-security.test.ts` | ✅ |

**40/40** v DoD security/monetization výběru.

### Lint

- Touched Phase 6/7 soubory: **PASS**
- Celé repo `npm run lint`: **FAIL** (pre-existing React Compiler / type-import debt mimo monetizaci — 59 errors)

### Typecheck / Build

- `npx tsc --noEmit` — **PASS** (2026-07-21, po opravách boundary/JSON/percentiles/export/mock-pay)
- `next build` SSG lokalit stále vyžaduje běžící PostgreSQL; `/cenik` je `force-dynamic` + catalog fallback

### E2E (Playwright) — ověřeno 2026-07-21

| Spec | Výsledek |
| --- | --- |
| `e2e/entitlements-b2c.spec.ts` (190/191) | ✅ |
| `e2e/sponsored-listing.spec.ts` (193) | ✅ |
| `e2e/professional-review.spec.ts` (194) | ✅ |
| Monetizační E2E (entitlements + sponsored + professional) | **15/15 ✅** |

Playwright webServer: `next dev` (lokálně), aby nebyl nutný SSG bez DB.

---

## 8. Code map

```
src/config/{pricing-architecture,feature-flags,legal-review,pricing-ux,monetization-anti-patterns}.ts
src/domains/commerce/{purchase-consent,consumer-withdrawal,invoices,pricing-page-model}.ts
src/domains/orders/{server/checkout-input,service/create-order}.ts
src/domains/payments/
src/domains/entitlements/
src/domains/revenue/{metrics,ledger,ltv-cac,reconciliation,monetization-audit,attribution*}.ts
src/domains/listing-promotions/
src/domains/fraud/
src/app/(admin)/admin/{monetizace,audit-log,objednavky}/
src/app/(public)/cenik/
docs/MONETIZATION_*.md
```

---

## 9. Definition of Done — checklist (228)

| Požadavek | Stav |
| --- | --- |
| 211 / 212 Terms + marketing separation | ✅ |
| 213–215 Legal/Accounting Review + flags OFF | ✅ |
| 220 Pět MONETIZATION docs | ✅ |
| 226 Anti-pattern audit | ✅ |
| 227 Lint (scope) + unit/security + E2E monetizace | ✅ (repo-wide lint debt zaznamenán) |
| 228 Tento závěrečný report | ✅ |
| Zastavit před Prompt 17 / Majetio.com | ✅ |

---

## 10. Aktuální omezení

1. Repo-wide ESLint debt (setState-in-effect, `import()` type annotations) — mimo monetizační DoD scope  
2. Production `next build` SSG lokalit vyžaduje dostupný `DATABASE_URL`  
3. CAC spend z env (`MARKETING_SPEND_MINOR_30D`) — není plný marketing BI  
4. Analytics provider adapter je console/noop — připraveno na vendor  
5. Consumer withdrawal / automated invoices / Concierge / Partner marketplace — záměrně OFF do legal review  

---

## 11. Závěr

**Implementace monetizace (fáze 1–7) je hotova.** Všechny položky Definition of Done z tohoto promptu jsou splněny. Práce na mezinárodní architektuře a Majetio.com se v této větvi **nesmí zahajovat** — **čekejte na Prompt 17**.
