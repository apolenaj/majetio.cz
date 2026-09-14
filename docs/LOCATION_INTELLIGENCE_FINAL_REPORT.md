# Location Intelligence — Závěrečný report (Definition of Done)

**Datum:** 2026-07-20  
**Modul:** Location & Market Intelligence Engine  
**Stav:** **HOTOV** — Definition of Done splněna.

> **Poznámka pro další práci:** Implementace tohoto modulu je dokončena. **Nezačínejte Prompt 15** — ten bude následovat zvlášť.

---

## 1. Shrnutí

Location Intelligence dodává geografickou hierarchii, precomputed tržní metriky, Location Score / Match Score, SEO stránky lokalit, mapové vrstvy, integraci do property kontextu a ingestion pipeline. Syntetická demo data (Praha, Brno, Liberec + Vinohrady) slouží pouze k vývoji a QA — nejsou produkční statistikou a nejsou indexována.

---

## 2. Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│  Public UI  /lokality, /lokality/[...slug], porovnání, mapy     │
│  Components: src/components/locations/*                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ read-only page DTOs
┌────────────────────────────▼────────────────────────────────────┐
│  Service layer                                                  │
│  location-page / market / metric / score / comparison /         │
│  resolution / intelligence                                      │
│  Cache: location-cache (no live GROUP BY on request)            │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
┌───────────────▼──────────────┐  ┌───────────▼───────────────────┐
│  Metrics & scoring           │  │  Integration (property)       │
│  registry, statistics,       │  │  percentiles, opportunities,  │
│  confidence, trends          │  │  risks, STR/regulatory,       │
│  Location Score + Match      │  │  valuation / investment ctx   │
└───────────────┬──────────────┘  └───────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│  Ingestion (batch / cron)                                        │
│  sources → dedupe → outlier filter → aggregate → quality → store │
│  Fallback na parent hierarchy (nikdy fake hodnoty)               │
└───────────────┬──────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│  Prisma: Location, hierarchy, LocationMetric(+History),          │
│  snapshots, quality issues, watched locations, data sources      │
└──────────────────────────────────────────────────────────────────┘
```

**Principy:**

- Asking ≠ transaction; segmenty se nemíchají; medián je primární.
- Chybějící data → `null` / suppress, nikdy falešná nula.
- Agregace jen v ingestion/jobs; page load čte snapshoty.
- Demo: `isDemo: true`, noindex, UI label „Demo data“.
- Scoring guardrails blokují diskriminační vstupy.

---

## 3. Syntetická demo data

| Profil | Slug | Confidence tier | Účel |
|--------|------|-----------------|------|
| Praha | `praha` | high | Plná UI + metriky |
| Brno | `brno` | medium-high | Plná UI, bez STR |
| Praha–Vinohrady | `praha/vinohrady` | high | Nested hierarchy |
| Liberec | `liberec` | low | Thin samples, suppress, noindex QA |

Zdroj: `src/domains/locations/content/demo-profiles.ts` (`LOCATION_DEMO_PROFILES`, `DEMO_CONFIDENCE_TIERS`).

**Nejsou produkce** — nesmí se brát jako živé tržní statistiky.

---

## 4. Implementované metriky

Registry: `src/domains/locations/metrics/registry.ts`  
Metodika: `location-metrics.v2026.07`  
Detail (zdroj / agregace / min. vzorek / limity): `docs/LOCATION_METRICS.md`

| Klíč | Kategorie | Preferovaná statistika |
|------|-----------|------------------------|
| `property_market.median_asking_price_sqm` | PROPERTY_MARKET | median |
| `property_market.mean_asking_price_sqm` | PROPERTY_MARKET | mean (doplněk) |
| `property_market.median_transaction_price_sqm` | PROPERTY_MARKET | median |
| `property_market.active_listings_count` | PROPERTY_MARKET | count |
| `property_market.median_days_on_market` | PROPERTY_MARKET | median |
| `property_market.price_reduction_rate` | PROPERTY_MARKET | rate |
| `rental_market.median_asking_rent_sqm` | RENTAL_MARKET | median |
| `rental_market.rent_listings_turnover` | RENTAL_MARKET | rate |
| `investment.gross_rental_yield` | INVESTMENT | median (páry) |
| `infrastructure.transit_score` | INFRASTRUCTURE | index 0–100 |
| `development.units_under_construction` | DEVELOPMENT | count |

Doplňkově: quartily / percentily vs lokalita (min. vzorek 30), MoM/QoQ/YoY trendy per segment, Location Score dimenze + personalizovaný Match Score.

---

## 5. Testování

### Unit / integration (Vitest)

| Soubor | Pokrytí |
|--------|---------|
| `location-intelligence.dod.test.ts` | DoD: hierarchie, fallback, outliery, median/quartiles, score determinismus, personalizace, SEO, A11y kontrakty, anti-patterns |
| `ingestion/location-ingestion.test.ts` | Pipeline, agregace, fallback bez fake hodnot, null value |
| `metrics/location-metrics.test.ts` | Statistiky, confidence, segmenty |
| `scoring/location-score.test.ts` | Score, guardrails |
| `seo/location-frontend.test.ts` | noindex, JSON-LD bez AggregateRating |
| `service/location-resolution-service.test.ts` | Resolution |
| `service/location-service-layer.test.ts` | Service vrstva |
| `integration/location-integration.test.ts` | Property kontext |

**Ověřeno 2026-07-20:** `npx vitest run src/domains/locations` — **8 souborů, 76 testů OK** (včetně opravy syntaxe v `ingestion/pipeline.ts`).

### E2E (Playwright)

`e2e/locations.spec.ts` — hub, Praha noindex/JSON-LD/A11y tabulka, Vinohrady nested, Liberec, porovnání.

---

## 6. Dokumentace (10+ Markdown v `docs/`)

| # | Soubor | Obsah |
|---|--------|--------|
| 1 | `LOCATION_INTELLIGENCE.md` | Přehled modulu, cíle, hranice |
| 2 | `LOCATION_DATA_MODEL.md` | Prisma entity, vztahy |
| 3 | `LOCATION_HIERARCHY.md` | Typy lokalit, fallback, rank |
| 4 | `LOCATION_METRICS.md` | Katalog metrik: zdroj, agregace, min. vzorek, limity |
| 5 | `LOCATION_SCORING.md` | Location Score, Match Score, guardrails |
| 6 | `LOCATION_INGESTION.md` | Pipeline, kvalita, anomálie |
| 7 | `LOCATION_SERVICES.md` | Service API a DTO |
| 8 | `LOCATION_INTEGRATION.md` | Napojení na analýzy / search |
| 9 | `LOCATION_PROPERTY_CONTEXT.md` | Percentily, opportunity, rizika |
| 10 | `LOCATION_FRONTEND.md` | UI, SEO, mapy, A11y |
| + | `LOCATION_ANTI_PATTERNS.md` | BOD 183 checklist |
| + | `LOCATION_INTELLIGENCE_FINAL_REPORT.md` | Tento report |

---

## 7. Anti-patterns (BOD 183) — audit

| Anti-pattern | Výsledek | Opatření |
|--------------|----------|----------|
| Fake lokální statistiky jako produkce | **PASS** | `isDemo` až do nahrazení reálnými `LocationMetric`; label v UI |
| `0` místo chybějících dat | **PASS** | `AggregatedMetricCandidate.value: null`; skip persist/anomaly při null |
| Programmatic SEO spam | **PASS** | Demo `noindex`; sitemap jen hub + porovnání |
| Live agregace při page load | **PASS** | Čtení precomputed metrik/snapshotů |
| Diskriminační data | **PASS** | `scoring/guardrails.ts` + testy |

---

## 8. Inventář souborů (modul)

### Dokumentace

- `docs/LOCATION_INTELLIGENCE.md`
- `docs/LOCATION_DATA_MODEL.md`
- `docs/LOCATION_HIERARCHY.md`
- `docs/LOCATION_METRICS.md`
- `docs/LOCATION_SCORING.md`
- `docs/LOCATION_INGESTION.md`
- `docs/LOCATION_SERVICES.md`
- `docs/LOCATION_INTEGRATION.md`
- `docs/LOCATION_PROPERTY_CONTEXT.md`
- `docs/LOCATION_FRONTEND.md`
- `docs/LOCATION_ANTI_PATTERNS.md`
- `docs/LOCATION_INTELLIGENCE_FINAL_REPORT.md`

### Doména `src/domains/locations/`

- **content:** `demo-profiles.ts` (Praha, Brno, Vinohrady, Liberec)
- **metrics:** registry, statistics, confidence, trends, segment, liquidity
- **ingestion:** pipeline, aggregate, outlier-filter, fallback, anomalies, quality, sources, service, …
- **scoring:** compute-location-score, match score, dimensions, amenities, environment, guardrails
- **seo:** location-urls, json-ld, dynamic-summary
- **service:** page/market/metric/score/comparison/resolution/intelligence/repository/…
- **integration:** percentiles, opportunities, risks, STR, valuation, market context
- **maps / cache / jobs / watch / analytics / observability**
- **testy:** `location-intelligence.dod.test.ts` + suite výše

### UI `src/components/locations/`

Hero, market summary, trends, supply/demand, investment, transport, development, risks, neighbors, comparison client, maps, charts, watch button, …

### App routes / SEO

- `src/app/(public)/lokality/**`
- `src/app/sitemap.ts` (bez demo city URL)
- `e2e/locations.spec.ts`

### Prisma

Migrace geospatial hierarchy, market metrics, ingestion/orchestration související s lokalitami (viz `prisma/migrations/*location*`, `prisma/schema.prisma`).

### DoD pass — klíčové změny (2026-07-20)

- Demo Liberec + `DEMO_CONFIDENCE_TIERS`
- `aggregate.ts` / `pipeline.ts`: null místo 0; skip anomaly při null
- `location-page-service.ts`: neoznačovat demo jako produkci při merge
- `location-urls.ts` + sitemap: noindex všech `isDemo`
- Hub UI: label „Demo data“
- DoD test suite + E2E locations
- Dokumentace + anti-pattern checklist

---

## 9. Definition of Done — checklist

| Požadavek | Stav |
|-----------|------|
| Syntetická dema (Praha, Brno, menší město) s různou confidence | ✅ |
| Unit / Integration / E2E testy (hierarchie, fallback, outliery, metriky, score, personalizace, SEO, A11y) | ✅ |
| 10 Markdown souborů v `docs/` s definicemi metrik | ✅ (+ anti-patterns + tento report) |
| Anti-pattern audit BOD 183 | ✅ |
| Závěrečný report (soubory, metriky, architektura) | ✅ |
| Modul hotov; **nepokračovat na Prompt 15** | ✅ |

---

## 10. Závěr

**Implementace Location Intelligence je hotova.** Všechny položky Definition of Done z tohoto promptu jsou splněny. Další práce na Prompt 15 se v této větvi **nesmí zahajovat** — Prompt 15 bude zadán zvlášť.
