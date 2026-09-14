# Prompt 17 — Závěrečný report (Multi-Market Architecture)

**Datum:** 2026-07-21  
**Modul:** Majetio International / Multi-Market (Prompt 17)  
**Stav:** **HOTOV** — architektonická připravenost Majetio.cz + Majetio.com (One Platform — Multiple Markets).

> **Hranice scope:** Tento report uzavírá Prompt 17. **Nezahajuje** kompletní admin/data-quality control center.

---

## 1. Shrnutí

Majetio běží jako **jedna Core platforma** s **MarketPlugin** vrstvou. Domácí trh **CZ** je LIVE na Majetio.cz. Ostatní trhy (SK, ES, IT, HR, AE, SA, ID+Bali) jsou zaregistrované stuby s Capability Matrix, kill switches a launch readiness — bez forků aplikace a bez duplikace core business logiky.

Ověřeno: izolace CZ↛UAE, i18n fallback, public DTO kontrakt (`market` / měna / labely), LIVE QA bariéra, syntetická ES/AE/HR demo data (PRIVATE), E2E regrese Majetio.cz.

---

## 2. Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                     Majetio Core (shared)                       │
│  Next.js · Auth · Properties · Finance · Investment · CRM       │
│  Entitlements · Commerce · Comparisons · Admin                  │
│  (NO country-specific business forks)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ explicit MarketCode (never from currency)
┌────────────────────────────▼────────────────────────────────────┐
│  MarketRegistry + Capability Matrix + Kill switches             │
│  Launch readiness (assertMarketCanGoLive)                       │
└───┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┘
    CZ★   SK    ES    IT    HR    AE    SA    ID(+bali)
    LIVE  stub  stub  stub  stub  stub  stub  stub
```

**Principy:** Market ≠ Currency · Market ≠ Language · plugin config místo Core větví · ACTIVE regulatory jen přes review flow · entitlements vázané na `marketScope`.

Detail: `docs/INTERNATIONAL_ARCHITECTURE.md`.

---

## 3. Dodávka Prompt 17 — fáze

| Fáze | Obsah | Stav |
| --- | --- | --- |
| 17.1 | Market Registry, plugins, codes, admin `/admin/trhy` | ✅ |
| 17.2 | Currency / FX / i18n / preference / cache keys | ✅ (engine); copy catalogs PARTIAL |
| 17.3 | Property taxonomy, units, extensions, import adapters | ✅ |
| 17.4 | Regulatory, tax, financing, valuation market gates | ✅ (AE packs PARTIAL/demo) |
| 17.5 | SEO, privacy, launch readiness, cross-market compare | ✅ |
| 17.6 | Capability Matrix, kill switches, marketScope, org coverage | ✅ |
| Final | Test plan, launch process, isolation/E2E, tento report | ✅ |

---

## 4. Stav funkcí — kompletní checklist (pravidlo 247)

### 4.1 Market Registry & Core (17.1)

| Funkce | Stav |
| --- | --- |
| One Platform — Multiple Markets (bez country forků) | ✅ DONE |
| MarketCode / CountryCode / LocaleCode | ✅ DONE |
| Market ≠ Currency (`marketCodeFromCurrency` refuse) | ✅ DONE |
| MarketRegistry + veřejná aktivita (enabled ∩ BETA/LIVE ∩ data) | ✅ DONE |
| Seed CZ LIVE + SK/ES/IT/HR/AE/SA/ID | ✅ DONE |
| Bali jako region pod ID | ✅ DONE |
| MarketPlugin interface | ✅ DONE |
| Prisma `Market` + entity `marketCode` | ✅ DONE |
| Admin dashboard trhů | ✅ DONE |
| majetio.com hub / subdomain routing | ⏳ PARTIAL / DEFERRED |

### 4.2 Currency, FX, i18n (17.2)

| Funkce | Stav |
| --- | --- |
| Locale resolver (Market ≠ Language) | ✅ DONE |
| SEO-safe locale routes (CZ bez prefixu) | ✅ DONE |
| Money same-currency asserts | ✅ DONE |
| FX engine (fresh/stale/pinned) + dual currency UI | ✅ DONE |
| Capital-normalized search | ✅ DONE |
| Translation namespaces + legal APPROVED gate | ✅ DONE |
| Message catalogs + lazy load + fallback EN→CS | ✅ DONE |
| Preference cookies / profile; geo suggest only | ✅ DONE |
| Market/Language selectors + soft banner | ✅ DONE |
| RTL (ar) ready | ✅ DONE |
| International cache keys | ✅ DONE |
| Full next-intl / complete product copy | ⏳ DEFERRED |
| Live FX cron (ECB/CNB) | ⏳ DEFERRED |

### 4.3 Property taxonomy & model (17.3)

| Funkce | Stav |
| --- | --- |
| Canonical property types + aliases | ✅ DONE |
| Dual layout (kk ↔ bedrooms) | ✅ DONE |
| Area sqm/sqft | ✅ DONE |
| Detail section plugins | ✅ DONE |
| Market search filters | ✅ DONE |
| Off-plan / listing channel | ✅ DONE |
| Typed extensions CZ/AE/ES | ✅ DONE |
| Import adapters (style) | ✅ PARTIAL (no live feeds) |
| Public DTO `market` + `currency` + `labels` | ✅ DONE |
| CZ backward compatible fields | ✅ DONE |

### 4.4 Regulatory, financing, tax, valuation (17.4)

| Funkce | Stav |
| --- | --- |
| Tenure types | ✅ DONE |
| RegulatoryRule packs + ACTIVE filter | ✅ DONE (CZ); AE demo |
| Transaction cost packs | ✅ PARTIAL (CZ; AE stub) |
| Payment plans → financial engine | ✅ DONE |
| FinancingProviderRegistry; HypotekaJasne CZ-only | ✅ DONE |
| ValuationModelRegistry (no CZ→AE leak) | ✅ DONE |
| Tax provider by market/taxRegion | ✅ DONE |
| International risk (no single score) | ✅ DONE |
| Due diligence checklists | ✅ DONE |
| Data-source licensing | ✅ DONE |
| Named consent recipients | ✅ DONE |
| ClearPropertyPath boundary (no shared DB) | ✅ DONE |

### 4.5 SEO, privacy, launch (17.5)

| Funkce | Stav |
| --- | --- |
| SEO hosts / hreflang / canonical | ✅ DONE |
| MarketDataSourceRegistry + SEO coverage | ✅ DONE |
| PrivacyPolicyRegistry + terms | ✅ DONE (CZ current) |
| Passport field minimization | ✅ DONE |
| UserMarketProfile | ✅ DONE |
| Cross-market comparison warnings | ✅ DONE |
| Programmatic SEO indexability | ✅ DONE |
| `evaluateMarketLaunchReadiness` | ✅ DONE |
| `assertMarketCanGoLive` (LIVE QA barrier) | ✅ DONE |
| Local PricingPlan (no FX list prices) | ✅ DONE |

### 4.6 Capability Matrix, kill switches, entitlements (17.6)

| Funkce | Stav |
| --- | --- |
| Capability Matrix FULL…NOT_AVAILABLE | ✅ DONE |
| UI FULL / LIMITED / UNAVAILABLE + `MarketCapabilityNotice` | ✅ DONE |
| ES valuation UNAVAILABLE (polite copy) | ✅ DONE |
| Kill switches (listings / valuations / leads / review_required) | ✅ DONE |
| Admin kill UI `/admin/trhy` | ✅ DONE |
| Stale regulation → review_required | ✅ DONE |
| Config review DRAFT→REVIEWED→ACTIVE→RETIRED | ✅ DONE |
| Org `marketCoverage` + `serviceType` | ✅ DONE |
| CRM `marketCode` filter + routing pause | ✅ DONE |
| Entitlement `marketScope` (Buyer Pass CZ ≠ UAE) | ✅ DONE |

### 4.7 Testing & dokumentace (final)

| Funkce | Stav |
| --- | --- |
| `docs/INTERNATIONAL_TEST_PLAN.md` | ✅ DONE |
| `docs/MARKET_LAUNCH_PROCESS.md` | ✅ DONE |
| Isolation Vitest (CZ↛AE, tax, financing, scope) | ✅ DONE |
| i18n fallback Vitest | ✅ DONE |
| Public DTO contract Vitest | ✅ DONE |
| LIVE barrier Vitest (CZ ok, AE/ES blocked) | ✅ DONE |
| Synthetic ES/AE/HR demos PRIVATE `isDemo` | ✅ DONE |
| E2E multi-market + i18n-seo | ✅ DONE |
| Tento závěrečný report (247) | ✅ DONE |

---

## 5. Syntetická demo data (ne public listings)

| Slug | Trh | Měna | Viditelnost |
| --- | --- | --- | --- |
| `demo-es-apartment-barcelona` | ES | EUR | PRIVATE / Demo |
| `demo-ae-apartment-dubai` | AE | AED | PRIVATE / Demo |
| `demo-hr-holiday-split` | HR | EUR | PRIVATE / Demo |

Zdroj: `src/content/international-demo-properties.ts`.  
**Nejsou** v `/nemovitosti` public indexu (E2E negativní assert).

---

## 6. Testování (ověřeno 2026-07-21)

### Unit / isolation (Vitest)

| Suite | Výsledek |
| --- | --- |
| `src/domains/markets/international-final.test.ts` | ✅ 10/10 |
| `src/domains/markets/capabilities/capabilities.test.ts` | ✅ |
| Související markets / i18n / SEO readiness | ✅ |

### E2E (Playwright, `--workers=1`)

| Spec | Výsledek |
| --- | --- |
| `e2e/multi-market.spec.ts` | ✅ 4/4 |
| `e2e/i18n-seo.spec.ts` | ✅ 5/5 |
| `e2e/home.spec.ts` | ✅ 8/8 |

Pozn.: paralelní běh na pomalém `next dev` může timeoutovat; serially (`--workers=1`) green.

---

## 7. Code map (klíčové cesty)

```
src/domains/markets/          registry, plugins, capabilities, launch-readiness
src/domains/i18n/             locales, messages, translation, preference, cache-keys
src/domains/finance/fx/       FX engine, dual currency
src/domains/tax/              tax provider config
src/domains/financing/        provider registry (HypotekaJasne CZ-only)
src/domains/regulatory/       rules, transaction costs
src/domains/privacy/          privacy / terms registry
src/domains/seo/              architecture, programmatic rules
src/domains/entitlements/     marketScope
src/domains/organizations/    marketCoverage, serviceType
src/content/international-demo-properties.ts
src/app/(admin)/admin/trhy/
e2e/multi-market.spec.ts · e2e/i18n-seo.spec.ts
docs/INTERNATIONAL_*.md · MARKET_*.md · CURRENCY_*.md · …
```

---

## 8. Definition of Done — checklist

| Požadavek | Stav |
| --- | --- |
| `INTERNATIONAL_TEST_PLAN.md` + `MARKET_LAUNCH_PROCESS.md` | ✅ |
| Syntetická demo ES/AE/HR, jasně Demo, ne public listings | ✅ |
| Izolace trhů + i18n fallback + E2E regrese CZ | ✅ |
| Public DTO: market, local currency, localized labels (CZ BC) | ✅ |
| LIVE pouze po readiness (currency, legal, privacy, …) | ✅ |
| Závěrečný report dle 247 | ✅ |

---

## 9. Aktuální omezení

1. Non-CZ trhy jsou **plugin stuby** — bez produkčního inventory a bez LIVE.  
2. Message catalogs jsou scaffold — ne kompletní product copy.  
3. Live FX provider cron není zapojený (engine + snapshot model ano).  
4. AE financing = partner pending; HypotekaJasne zůstává CZ-only.  
5. Kill switch hot-path je process store (+ optional DB mirror).  
6. majetio.com hub / market subdomains — architektura připravena, plný hub DEFERRED.  
7. Kompletní admin/data-quality control center — **mimo Prompt 17**.

---

## 10. Dokumentace

| Soubor | Účel |
| --- | --- |
| `docs/INTERNATIONAL_ARCHITECTURE.md` | Core vs plugins |
| `docs/MARKET_REGISTRY.md` | Registry |
| `docs/MARKET_CAPABILITIES.md` | Matrix + kill switches |
| `docs/MARKET_LAUNCH_PROCESS.md` | Checklist nové země |
| `docs/INTERNATIONAL_TEST_PLAN.md` | Test plan |
| `docs/CURRENCY_AND_I18N.md` / `CURRENCY_AND_FX.md` | FX + i18n |
| `docs/LOCALIZATION_ARCHITECTURE.md` | Localization |
| `docs/PROPERTY_TAXONOMY.md` | Taxonomy |
| `docs/INTERNATIONAL_PROPERTY_MODEL.md` | Property model |
| `docs/REGULATORY_AND_FINANCING.md` | Regulatory / financing |
| `docs/SEO_PRIVACY_AND_CROSS_MARKET.md` | SEO / privacy / launch |
| `docs/INTERNATIONAL_FINAL_REPORT.md` | Tento report |

---

## 11. Závěr

Prompt 17 uzavírá multi-market architekturu: Core zůstává sdílený, trhy se přidávají pluginem, izolace a launch gate jsou vynucené testy. Majetio.cz regrese je zelená; mezinárodní trhy čekají na data a legal readiness před LIVE.

Prompt 17 dokončen. Majetio je architektonicky připravené jako multi-market platforma pro Majetio.cz a Majetio.com bez duplikace core business logiky. NEPOKRAČUJI implementací kompletního admin/data-quality control center.
