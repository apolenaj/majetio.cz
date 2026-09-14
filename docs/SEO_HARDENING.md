# SEO Hardening — Majetio

**Datum:** 2026-07-22  
**Účel:** Kanonická SEO architektura — indexabilita, canonical, sitemap, facety, lifecycle.  
**Kód:** `src/app/robots.ts`, `src/app/sitemap.ts`, `src/domains/seo/*`, `src/domains/properties/search/seo-landings.ts`, `detail-seo.ts`  
**Doplňuje:** `docs/TECHNICAL_SEO.md`, `docs/SEO_ARCHITECTURE.md`, `docs/SEO_REVIEW_CHECKLIST.md`

---

## 1. Indexability matrix

### 1.1 Indexovatelné (allow)

| Surface | Podmínka |
| --- | --- |
| Marketing / trust / legal | Publikované stránky v `STATIC_PAGE_REVISIONS` |
| `/nemovitosti` | Bez aktivních filtrů, `stranka ≤ 1`, **bez** non-default `razeni` |
| SEO city landings | `/nemovitosti/praha\|brno\|ostrava` (path landings) |
| Property detail | `PUBLIC` + `ACTIVE` + `!isDemo` + `listingQuotaState=WITHIN_LIMIT` + `listingModerationStatus=CLEAR` |
| Location profiles | `isLocationPageIndexable` (reálná data, ne thin/demo) |
| Guides | `status === "published"` |
| Methodology | `/metodika`, `/metodika/[section]` |

### 1.2 Noindex (meta / robots)

| Surface | Mechanismus |
| --- | --- |
| `/ucet/*`, `/onboarding/*`, `/profi/*`, `/admin/*` | Layout `robots` + middleware `x-robots-tag: noindex, nofollow` |
| Auth pages | `(auth)/layout` |
| `/checkout/*` | Page/layout noindex |
| `/hledat` | Meta noindex,follow + robots.txt Disallow |
| `/analyza/*` | Tools layout noindex |
| Filtered `/nemovitosti?*` | `shouldNoIndexPropertySearch` → `noIndex` |
| Pagination `?stranka>1` | noindex |
| Sort variants `?razeni=…` (non-default) | noindex |
| Demo / private / non-ACTIVE detail | `isPropertyDetailIndexable` → false |
| Thin / demo locations | `noIndex: !isLocationPageIndexable` |
| CZ content on international host | `buildSeoDocumentMeta` duplicate gate |

### 1.3 robots.txt Disallow

`src/app/robots.ts`: `/ucet`, `/account`, `/prihlaseni`, `/login`, `/registrace`, password flows, `/admin`, `/checkout`, `/profi`, `/onboarding`, `/private`, `/hledat`, `/analyza/`, `/api/`, `/dev`.

**Poznámka:** Disallow ≠ noindex. Citlivé zóny mají **oboje**.

### 1.4 Programmatic thin pages

`decideProgrammaticIndexability` (sample &lt; 20, no real data, demo, unpublished, stale legal) → **nesmí** být indexováno.  
Location routes používají `isLocationPageIndexable`; nové programmatic landings musí volat stejný gate před `buildPageMetadata({ noIndex })`.

---

## 2. Canonical strategy

### 2.1 Pravidla

1. **Jeden canonical path bez query/hash** — `canonicalizePath` + `buildPageMetadata`.
2. Filtered / sorted / paginated discovery URL → canonical **`/nemovitosti`** (ne self-canonical na `?lokalita=`).
3. Property detail → `/nemovitosti/{slug}` vždy (bez query).
4. City landings → vlastní path canonical (`/nemovitosti/praha`, …).
5. Hreflang + `x-default` přes `buildSeoDocumentMeta` / `toNextAlternates`.
6. CZ duplicita na `.com` → noindex + hreflang na majetio.cz.

### 2.2 Zakázáno

- Canonical s `?` parametry
- Self-canonical na facet URL, které jsou noindex
- Valuation midpoint v title / Offer schema (asking only)

### 2.3 Soft-404 / interní search

`/hledat` — vždy noindex; canonical na `/hledat` (čistá path); Disallow v robots.txt.

---

## 3. Sitemap architecture

### 3.1 Segmenty (`generateSitemaps`)

| Segment id | Obsah | lastModified |
| --- | --- | --- |
| `static` | Marketing, legal, methodology slugs | `STATIC_PAGE_REVISIONS` / legal versions — **ne** `Date.now()` |
| `properties` | Prisma eligible listings (cap ~45k) | `updatedAt` \|\| `publishedAt` \|\| `lastSeenAt` |
| `locations` | Jen indexovatelné location paths | Revision date profilu / fixed revision |
| `guides` | Hub + published articles | `updatedAt` \|\| `publishedAt` |

Entry: `src/app/sitemap.ts` → `buildSitemapSegment`.

### 3.2 Properties inclusion (strict)

```text
visibility = PUBLIC
AND status = ACTIVE
AND isDemo = false
AND listingQuotaState = WITHIN_LIMIT
AND listingModerationStatus = CLEAR
```

Detail page indexabilita **musí být sémanticky shodná** s tímto filtrem (viz §5).

### 3.3 Split / scale

- Více sitemap indexů přes Next `generateSitemaps` (segment ids).
- Properties cap chrání před obřími soubory; při růstu: shard podle `updatedAt` / slug prefix (budoucí).
- DB failure → prázdný segment (žádné vymyšlené URL).

---

## 4. Faceted search SEO (anti crawl-trap)

### 4.1 Indexovatelné kombinace

| URL | Index? |
| --- | --- |
| `/nemovitosti` | Ano |
| `/nemovitosti/praha` (path landing) | Ano |
| `/nemovitosti?lokalita=Praha` | **Ne** — noindex, canonical `/nemovitosti` |
| `/nemovitosti?stranka=2` | **Ne** |
| `/nemovitosti?razeni=cena-sestupne` | **Ne** |
| `/nemovitosti?typ=byt&…` (libovolný filtr) | **Ne** |
| Kombinace filtrů (N×M) | **Ne** — nikdy auto-indexovat všechny combo |

### 4.2 Implementace

- `countActiveFilters(state)` — počet facetů (bez řazení).
- `shouldNoIndexPropertySearch({ filterCount, page, hasNonDefaultSort })`.
- Metadata: `preparePageMeta({ path: "/nemovitosti", noIndex })`.

### 4.3 Pravidla proti trapům

1. Neindexovat query facet URL.
2. Nedávat facet URL do sitemapy.
3. Interní odkazy preferují path landings před `?lokalita=`.
4. Sort není „obsahová“ stránka — vždy noindex pokud non-default.
5. `/hledat` je utility, ne discovery index.

---

## 5. Property lifecycle SEO

| Stav | HTTP | robots | Sitemap | Poznámka |
| --- | --- | --- | --- | --- |
| **ACTIVE** + PUBLIC + clear + quota + !demo | 200 | **index** | **Ano** | Kanonicální live nabídka |
| **ACTIVE** + PUBLIC ale OVER_LIMIT / BANNED | 200 | **noindex** | Ne | Shoda se search filtrem |
| **Demo** (`isDemo`) | 200 (pokud public) | noindex | Ne | Demo badge; ne do indexu |
| **SOLD / RENTED / UNAVAILABLE** + PUBLIC | 200 | noindex | Ne | Soft-serve „nedostupné“; Offer `OutOfStock` |
| **DRAFT / PENDING / REJECTED / SUSPENDED / WITHDRAWN / ARCHIVED** | 404 pro anonym (PRIVATE) nebo 200+noindex pokud ještě PUBLIC | noindex | Ne | Preferovat stažení z PUBLIC |
| **PRIVATE / ACCOUNT_ONLY** (cizí viewer) | **404** | — | Ne | Anti-enumeration |
| **Smazaná / neexistující slug** | **404** + noindex meta | — | Ne | `notFound()` |
| Dočasný outage feedu (`lastSeen` stale) | 200 pokud stále ACTIVE | dle indexability | Ano dokud ACTIVE | Freshness UI; ne měnit slug |
| Změna slug | Budoucí **301** starý → nový | — | Jen nový | Zatím nedělat 200 na orphan slug |

### 5.1 Lifecycle zásady

1. **Nikdy** nenechávat SOLD v sitemapu.
2. Soft-serve SOLD (200+noindex) je OK krátkodobě (UX + branding); dlouhodobě zvážit redirect na city landing.
3. Indexovatelnost detailu = stejná logika jako sitemap eligibility.
4. Asking price v Offer jen při známé ceně; valuation nikdy jako Offer.price.

---

## 6. Code audit (2026-07-22)

| Požadavek | Stav | Náprava |
| --- | --- | --- |
| Indexability matrix vs robots/layouts | ✅ | — |
| Canonical strip query (`canonicalizePath`) | ✅ | — |
| Property detail canonical `/nemovitosti/{slug}` | ✅ | `buildPropertyDetailMetadata` |
| Filtered search noindex + canonical `/nemovitosti` | ✅ | `nemovitosti/page.tsx` |
| Sort-only URL noindex | ✅ (opraveno) | `hasNonDefaultSort` v `shouldNoIndexPropertySearch` |
| Sitemap 4 segmenty + strict properties filter | ✅ | `sitemap-builders.ts` |
| Detail indexability ≈ sitemap (quota/moderation) | ✅ (hardened) | Optional fields na DTO; pokud přítomny, musí CLEAR + WITHIN_LIMIT |
| `/hledat` canonical + noindex | ✅ (opraveno) | `preparePageMeta` |
| Slug 301 history | ❌ residual | Backlog — viz Remaining |
| `decideProgrammaticIndexability` na všech programmatic routes | ⚠️ partial | Locations mají vlastní gate; sjednotit u nových landings |
| `x-robots-tag` na checkout/hledat | ⚠️ meta-only | Header volitelně v middleware (P2) |

### 6.1 Verification commands

```bash
npx vitest run src/app/seo.test.ts src/domains/properties/search/part5-seo-analytics.test.ts src/domains/properties/service/detail-part5.test.ts src/domains/seo/thin-pages-noindex.test.ts
npx playwright test e2e/seo
BASE_URL=… npm run test:seo-check
```

---

## 7. Remaining SEO risks

1. Slug rename bez 301 → dočasné 404 / orphan.
2. Detail loader vs Prisma sitemap (demo vs DB) → drift do sjednocení.
3. Locations sitemap fixed `lastModified` → slabší freshness.
4. Opportunity landings bez thin gate → risk thin index.
5. Agresivní scrapers — public RL napojit jemně (`SECURITY_HARDENING.md`).

---

## 8. Change log

| Datum | Změna |
| --- | --- |
| 2026-07-22 | Vytvořen SEO Hardening + audit; sort noindex; hledat canonical; detail eligibility align |
