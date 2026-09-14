# Phase 2 Production Audit — Frontend, SEO, Analytics, Edge Cases

**Datum:** 2026-07-22  
**Scope:** SEO/analytika · cross-browser/lokality · edge cases · legal/B2B gating vs ceník  
**Režim:** Report + izolované fixy (bez změny business modelu / default B2B ON flags)  
**Související:** `docs/PHASE1_INFRA_AUDIT.md`

---

## Verdikt Phase 2

| Oblast | Stav po fixech |
| --- | --- |
| SEO / GSC / canonical | **PARTIAL** — robots/sitemap/OG OK; GSC token env hook; www redirect v middleware; HTTP→HTTPS = platforma |
| Consent / analytika | **PASS (first-party)** — CMP + reject; Google Consent Mode ABSENT (žádný gtag) |
| PWA / favicon | **PASS** po fixu — manifest + favicon redirect |
| UTM | **PARTIAL** — sanitizer bez PII; cross-domain atribuce stále ABSENT |
| Trhy / CS formát | **PASS** — jen CZ LIVE; client diacritics OK; server Prisma fold residual |
| Edge cases | **PASS** po fixech (null price/area, favourites cap); overflows/null rent už měly coverage |
| Legal / ceník / checkout | **PASS** po fixech — OFF produkty skryté; checkout gated |

**Phase 2:** opravitelné P0 v kódu **opraveny**; zbývá infra (GSC token, Vercel HTTPS, live analytics vendor).

---

## 1. SEO a analytika

### Nálezy

| ID | Nález | Stav |
| --- | --- | --- |
| SEO-1 | robots.txt + sitemap | **PASS** |
| SEO-2 | GSC verification meta | **FIXED** — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` v `layout.tsx` (nutno nastavit env) |
| SEO-3 | OG + Twitter + apple-touch | **PASS** |
| SEO-4 | favicon.ico chyběl | **FIXED** — redirect → SVG |
| SEO-5 | PWA manifest ABSENT | **FIXED** — `src/app/manifest.ts` |
| SEO-6 | apex ↔ www | **FIXED** — middleware 308 `majetio.cz` → `www.majetio.cz` (prod) |
| SEO-7 | HTTP→HTTPS v app | **ABSENT v kódu** — HSTS + očekávaný Vercel; není bug pokud platforma redirectuje |
| SEO-8 | Google Consent Mode / gtag | **ABSENT** — OK dokud není GA/Ads; first-party CMP **PASS** |
| SEO-9 | Cookie reject → client analytics off | **PASS** (E2E existuje) |
| SEO-10 | UTM capture / cross-domain | **ABSENT pipeline**; **FIXED** sanitizer `utm.ts` (reject e-mail/phone v hodnotách) |
| SEO-11 | `productionBrowserSourceMaps` | **FIXED** — explicit `false` |

### Izolované fixy provedené
- `layout.tsx` verification + manifest link  
- `manifest.ts`, `next.config` favicon + sourceMaps  
- middleware www canonical  
- `lib/analytics/utm.ts`

### Zbývá (infra / produkt)
- Nastavit `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`  
- Ověřit Vercel domain redirect HTTPS  
- Až bude GA4: Google Consent Mode v1/v2 + CSP allowlist  
- Plná UTM session attribution (volitelné)

---

## 2. Cross-browser & lokality

| ID | Nález | Stav |
| --- | --- | --- |
| I18N-1 | `cs-CZ` Intl money/date | **PASS** |
| I18N-2 | Client search diacritics fold | **PASS** |
| I18N-3 | Server Prisma `contains` bez unaccent | **RESIDUAL P1** — `plzen` vs `Plzeň` |
| MKT-1 | Jen CZ LIVE + data | **PASS** |
| MKT-2 | Fake LIVE markets | **PASS** (AE/ES RESEARCH, not public) |
| MKT-3 | Kill-switch payments unwired | **FIXED** — `create-order` volá `isPaymentsPaused` |
| MKT-4 | Kill-switch in-memory only | **RESIDUAL** — multi-instance drift |
| BROWSER | Chrome/Safari/iOS Playwright full matrix | **NEOVĚŘENO v tomto běhu** — doporučen staging smoke |

**Cross-browser:** v tomto auditu nebyly spuštěny Playwright proti Safari/WebKit/Android. Existující E2E (privacy/routing) pokrývá Chromium. **Neprohlašujeme PASS.**

---

## 3. Edge cases a limity

| Case | Před | Po |
| --- | --- | --- |
| Price 0 / ≤0 | DQ CRITICAL | beze změny (**PASS**) |
| Null price + `cenaOd` | treated as 0 (**FAIL**) | **FIXED** — exclude null |
| Area 0 / null + `plochaOd` | null as 0 | **FIXED** — exclude null |
| Huge numbers | investment tests | **PASS** |
| Missing images | placeholder UI | **PASS** |
| Null rent | NEU / no fake 0 | **PASS** |
| Long texts | sanitize max lengths | **PASS** |
| Empty account | EmptyStates | **PASS** |
| Compare max 4 | enforced | **PASS** |
| Guest fav max 50 | soft slice | **PASS** |
| Auth fav unbounded | **FAIL** | **FIXED** — cap 200 |
| Extreme overflow JS Number | residual beyond ~1e15 | document; Money domain preferred |

---

## 4. Business logika (legal / B2B / ceník)

**Bez změny default B2B flags** (stále ON dle `FEATURE_FLAG_DEFAULTS`). Legal OFF flags zůstávají OFF.

| ID | Nález | Fix |
| --- | --- | --- |
| BIZ-1 | Ceník ukazoval OFF legal produkty + „Zeptat se“ | **FIXED** — `isCatalogProductPubliclyListed` filtruje OFF z ceníku; disabled bez kontakt CTA |
| BIZ-2 | Checkout/`create-order` ignorovaly feature flags | **FIXED** — `product-availability.ts` + wire |
| BIZ-3 | `?product=investor_pro…` při flag OFF | **FIXED** — filter + safeInitial |
| BIZ-4 | Paywall hardcode links | **RESIDUAL P2** — entitlement-paywall stále může odkazovat; doporučen stejný helper |
| BIZ-5 | DB seed ACTIVE i při flag OFF | **RESIDUAL P2** — `ensureDefaultPricingPlans` |
| BIZ-6 | CONSUMER_WITHDRAWAL / AUTOMATED_INVOICE | assert-gated (**PASS**); nejsou v ceníku |

---

## 5. Seznam chyb (odhalené) → fix / residual

### Opraveno v této fázi
1. Checkout bez feature-flag gate  
2. Ceník: legal/flag OFF produkty + falešné CTA  
3. Payments kill-switch nepoužitý  
4. Null price/area jako 0 ve filtrech  
5. Auth favourites bez limitu  
6. Chybějící PWA manifest  
7. Chybějící favicon.ico redirect  
8. Chybějící explicit sourceMaps:false  
9. Apex→www redirect (prod)  
10. GSC verification env hook  
11. UTM PII sanitizer  

### Vyžaduje další práci (před GA)
| Priorita | Item |
| --- | --- |
| P1 | Server search diacritics (folded column / unaccent) |
| P1 | Persist market kill-switches (ne in-memory) |
| P1 | Nastavit GSC token + ověřit HTTPS na Vercel |
| P2 | Gate entitlement paywall CTAs |
| P2 | Seed plans INACTIVE when flag OFF |
| P2 | UTM session persistence (bez PII) |
| P2 | WebKit/Safari E2E smoke |
| — | Google Consent Mode až po GA/Ads |

---

## 6. Navržené izolované fixy (pro residual)

1. **Diacritics:** `publicCityFolded` generated column + match ve `buildSearchWhere`.  
2. **Kill-switch store:** Prisma `MarketKillSwitch` nebo Redis; číst v `getMarketKillSwitch`.  
3. **Paywall:** `isCatalogProductCheckoutAllowed` před render CTA.  
4. **Seed:** `ensureDefaultPricingPlans` → `INACTIVE` když `!isCatalogProductFeatureEnabled`.  

---

## 7. Testy

`src/domains/seo/prompt-phase2-frontend-regression.test.ts` — product gates, UTM PII, null price filter, SEO surfaces.

---

## 8. Sign-off Phase 2

| Role | Verdikt |
| --- | --- |
| Frontend / SEO auditor | **PARTIAL PASS** — P0 UI/checkout fixed; GSC/HTTPS/vendor residual |
| Ready with Phase 1? | Phase 1 stále **FAIL** (e-mail/PSP/cron) — Phase 2 to nenahrazuje |

**Jednou větou:** Ceník a checkout už nelžou o vypnutých produktech a edge filtry/favourite limity jsou tvrdší; SEO má manifest + www redirect, ale **bez GSC tokenu, live analytics a Phase 1 mail/PSP stále nejde do GA**.
