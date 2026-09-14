# Legal Document Architecture — Majetio

**Datum:** 2026-07-22  
**Účel:** Struktura právních dokumentů, verzování, lokalizace trhů a schvalovací proces.  
**Kód:** `prisma` `LegalDocument` / `ConsentVersion`, `src/domains/privacy/legal-documents.ts`, `legal-content.ts`, `policy-registry.ts`

---

## 1. Canonical routes

| Path | Dokument | Poznámka |
| --- | --- | --- |
| `/podminky` | TERMS | Canonical |
| `/ochrana-soukromi` | PRIVACY | Canonical |
| `/cookies` | COOKIES + CMP policy | Canonical |
| `/ucet/soukromi` | Privacy Center (ne právní text) | Account |
| `/obchodni-podminky` → `/podminky` | Permanent redirect | Legacy |
| `/ochrana-osobnich-udaju` → `/ochrana-soukromi` | Permanent redirect | Legacy |

Typ `LEGAL_NOTICE` existuje ve schématu; veřejná canonical route se přidává jen po counsel schválení.

---

## 2. Datový model

### `LegalDocument`

| Pole | Pravidlo |
| --- | --- |
| `type` | `TERMS` \| `PRIVACY` \| `COOKIES` \| `LEGAL_NOTICE` |
| `status` | `DRAFT` → `PUBLISHED` → `ARCHIVED` |
| `version` | Semver / datumová verze (string); unikátní s trhem a locale |
| `title`, `content`, `summary?` | Schválený text |
| `locale` | Default `cs-CZ` |
| `marketCode` | Default `CZ` |
| `effectiveFrom`, `publishedAt` | Povinné při PUBLISHED |

**Unique:** `[type, version, marketCode, locale]`

### `ConsentVersion` (katalog souhlasů)

Váže UI checkboxy / ledger na konkrétní verzi textu (`TERMS`, `PRIVACY`, `MARKETING`, …) per `marketCode` + `locale`.  
Pole `isCurrent` označuje verzi pro nové granty.

### Fallback

`src/domains/privacy/legal-content.ts` — použit jen když DB nemá PUBLISHED řádek nebo DB selže.  
Fallback je **pre-counsel** a musí být v LEGAL_REVIEW označen jako dočasný.

Loader: `getPublishedLegalDocument` (`legal-documents.ts`).

---

## 3. Verzování — Source of Truth

| Povrch | SoT | Příklad |
| --- | --- | --- |
| Veřejné právní stránky | `LegalDocument` status `PUBLISHED` | TERMS 2026-07-22 |
| Cookie CMP policy string | `COOKIE_POLICY_VERSION` | `2026-07-22` |
| Checkout / account consent grant | `ConsentVersion` + `CURRENT_CONSENT_VERSIONS` | TERMS při nákupu |
| Cross-market policy flags | `policy-registry.ts` | `isCurrent`, reconsent |

**Pravidlo:** změna materialního textu = nová `version` + nový PUBLISHED řádek; starý → `ARCHIVED` (ne mazat).  
Cookie banner: pokud `v` v cookie ≠ `COOKIE_POLICY_VERSION`, banner se znovu zobrazí (`parseCookieConsent`).

`requiresReconsentFromVersion` v policy registry: když counsel vyžaduje re-consent, nastavit a spustit UX reconsent (nesmí být tiché).

---

## 4. Lokalizace a trhy

| Trh | Stav | Pravidlo |
| --- | --- | --- |
| `CZ` / `cs-CZ` | Production path | GDPR + české právo; canonical na majetio.cz |
| International / `AE` drafts | `isCurrent: false` | Ne LIVE, dokud counsel neschválí |
| Locale prefix (`/en/…`) | Rewrite | Právní canonical zůstává na schválené locale verzi dokumentu |

- Každý `marketCode` má vlastní PUBLISHED sadu (nebo explicitní „dědí CZ do schválení“).
- CZ obsah na international hostu: SEO `noindex` duplicit (`docs/SEO_PRIVACY_AND_CROSS_MARKET.md`).
- Nesmí se publikovat trh bez privacy/terms coverage v registry.

---

## 5. Schvalovací proces (release gate)

```text
Draft (ops/legal) → Internal review → Counsel approval
  → PUBLISHED (effectiveFrom) → Notify reconsent if required
  → ARCHIVE previous
```

### Kroky

1. **Draft** v DB (`status: DRAFT`) nebo PR na fallback content — nikdy rovnou PUBLISHED bez review.
2. **Legal review** dle `docs/LEGAL_REVIEW_CHECKLIST.md` (IČO/firma, žádné false security claims).
3. **Counsel sign-off** (tabulka v checklistu).
4. **Publish:** `status: PUBLISHED`, `publishedAt`, `effectiveFrom`; bump souvisejících version konstant.
5. **Reconsent:** pokud material change → banner / account notice; sync `ConsentRecord`.
6. **Archive** předchozí PUBLISHED stejného type+market+locale.
7. **QA:** canonical URL, redirecty, CMP version cookie, checkout TERMS version.

### Zakázáno

- Publikovat AI-generovaný právní text bez counsel.
- Měnit PUBLISHED `content` in-place bez nové verze.
- Bundle marketing souhlasu do nákupu TERMS.

---

## 6. Vztah k souhlasům

- Zobrazení dokumentu ≠ udělení souhlasu.
- Grant ukládá `type` + `version` + timestamp (+ `ConsentRecord` purpose).
- Privacy Center zobrazuje historii; revoke zapisuje audit.

Detail: `docs/CONSENT_HARDENING.md`, `docs/CONSENT_MANAGEMENT.md`.

---

## 7. Provozní identity

Placeholder provozovatele v trust/legal copy musí být nahrazen skutečnými údaji (firma, IČO, sídlo) před produkčním legal claimem.  
Kontakt security: `security@majetio.cz` (responsible disclosure) — ověřit schránku před launch.

---

## 8. Související

- `docs/PRIVACY_ARCHITECTURE.md`
- `docs/LEGAL_REVIEW_CHECKLIST.md`
- `docs/MONETIZATION_LEGAL_REVIEW.md`
- `docs/CONSENT_HARDENING.md`
