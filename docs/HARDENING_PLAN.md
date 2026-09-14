# Majetio Hardening Plan — Trust, Privacy, Security, Legal

**Datum auditu:** 2026-07-22  
**Role:** SEO / Trust & Safety / Privacy / AppSec / Next.js  
**Stav:** KROK 1–3 (audit + plán). Implementace kódu a UI zatím **nezačíná**.

---

## 0. Audit vstupu (KROK 1–2)

### 0.1 Dokumentace

| Soubor | Stav | Poznámka |
| --- | --- | --- |
| `docs/PRODUCT_VISION.md` | ✅ | Discovery → analýza → rozhodnutí → financování (HJ) |
| `docs/SYSTEM_ARCHITECTURE.md` | ✅ | Modular monolith, Prisma, Zod, server auth |
| `docs/SECURITY_BASELINE.md` | ✅ | Least privilege, consent, audit, data classes |
| `docs/PRIVACY_ARCHITECTURE.md` | ✅ | LegalDocument, ConsentRecord, CMP, Privacy Center, FP audits |
| `docs/PROPERTY_DATA_MODEL.md` | ❌ chybí | Částečně: `DATABASE_DESIGN.md`, `PROPERTY_TAXONOMY.md`, `INTERNATIONAL_PROPERTY_MODEL.md` |
| `docs/VALUATION_METHOD.md` | ✅ | Hedonic comps, pásmo p20/p80, outliery |

Doplňkové: `AUTHORIZATION.md`, `ACCOUNT_SECURITY_REVIEW.md`, `ADMIN_ANTI_PATTERNS.md`, `ADMIN_API_SECURITY.md`.

### 0.2 Surface map (zkráceně)

| Zóna | Příklady |
| --- | --- |
| Public | `/`, `/nemovitosti`, `/analyza`, `/cenik`, legal pages, `/sdilene/porovnani/[token]` |
| Auth | `/prihlaseni`, `/registrace`, `/zapomenute-heslo`, … |
| Account | `/ucet/*`, `/checkout/*`, `/onboarding` |
| Broker | `/profi/*` |
| Admin | `/admin/*` (RBAC + step-up) |
| API | `/api/auth/*`, `/api/payments/*`, `/api/integrations/hypotekajasne/*`, `/api/admin/*` (DB editor 403) |

**ORM:** Prisma + Postgres (ne Drizzle / ne Supabase jako primary store).

**Middleware (`src/middleware.ts`):** auth zones včetně `/profi`; **CSP (nonce), HSTS, nosniff, Referrer-Policy, frame-ancestors** přes `lib/security/headers.ts`. Dev = CSP Report-Only.

**`next.config.ts`:** `poweredByHeader: false` + baseline static headers. Detail: `docs/SECURITY_HARDENING.md`.

---

## 1. Data Classification Map

| Třída | Popis | Příklady polí / entit | Kontroly (stav → cíl) |
| --- | --- | --- | --- |
| **PUBLIC** | Veřejně cacheovatelné | Listing summary (cena inzerátu, m², město, metodika, SEO) | Cache OK; žádné PII |
| **INTERNAL_PROPERTY** | Interní property data | `street`, přesná GPS dle `addressPrecision`, sources, DQ issues | Staff permissions; ne do public DTO |
| **ACCOUNT_IDENTITY** | Identita účtu | `User.email`, `name`, `passwordHash`, `pendingEmail`, `UserProfile.phone`, OAuth tokens | Session; bcrypt; rate limit auth |
| **FINANCIAL_PROFILE** | Finanční pas / budget | `FinancialProfile.*Income/Liabilities/Equity*`, `UserMarketProfile` budget/income, `MortgageLeadProfile` | Owner + sensitive admin step-up; maskované v admin listu |
| **BILLING_PII** | Fakturace | `Order.billingName/Email/Street/City/Zip/VatId` | Owner + commerce admin; audit refunds |
| **CRM_LEAD_PII** | Lead / inquiry | `Inquiry.buyer*`, `Lead.email/phone/payload`, CRM notes | Tenant boundaries; redact on retention |
| **PROTECTED_TRANSACTION** | Skutečná transakční cena | `PropertyTransaction.agreedPriceMinor` | Parties + ADMIN/SALES; access log **bez** amount |
| **OPS_RESTRICTED** | Admin notes / impersonation | `AdminEntityNote`, impersonation `reason`/`tokenHash` | Permissions; no client actor IDs |
| **SECRETS** | Infra | `DATABASE_URL`, `AUTH_SECRET`, PSP/HJ keys | Env only; audit meta sanitizace |
| **TELEMETRY** | Provozní | `AuditLog.ip/userAgent`, correlation IDs | Append-only; no secrets in meta |

### Koncentrace rizika

Nejkritičtější shluk PII: **FinancialProfile + MortgageLeadProfile + Order billing + Inquiry/Lead** + admin impersonation session. Partner handoff (HypotekaJasne) smí odcházet jen s verzovaným consentem.

---

## 2. User inputs → Zod + XSS sanitizace

Každý řádek = vstup, který **musí** mít server-side Zod (nebo ekvivalentní schema) **a** sanitizaci plain-textu / HTML (cíl: centralizovaný sanitizer; dnes často jen strip-tags regex).

| # | Vstup | Kde | Zod dnes | XSS/sanitize dnes | Priorita |
| --- | --- | --- | --- | --- | --- |
| 1 | Register/login/reset password | `lib/auth/actions.ts` | částečně | N/A (credentials) | P0 |
| 2 | Account name / phone / password change / delete confirm | `lib/account/settings-actions.ts` | částečně | phone trim | P0 |
| 3 | Financial passport fields | `lib/financial-passport/actions.ts` | ano | čísla; text city/regions | P0 |
| 4 | Checkout billing address | `orders/.../checkout-input.ts` | ano | omezená délka | P0 |
| 5 | HJ handoff payload + consent | `lib/financing/handoff-actions.ts` | ano | meta guards | P0 |
| 6 | Inquiry message + buyer contact | CRM / inquiry service | částečně | `sanitizeCrmPlainText` | P0 |
| 7 | Favourite note / folder | favourites actions | délka | `sanitizeFavouriteNote` | P1 |
| 8 | Decision workspace notes (≤8k) | decision-workspace actions | ano | strip/tag allowlist? | P1 |
| 9 | Saved search name / filters | saved-searches | částečně | — | P1 |
| 10 | Broker displayName / bio / phonePublic | org broker actions | částečně | CRM sanitize | P1 |
| 11 | Admin step-up `reason` | admin actions | min length | plain | P1 |
| 12 | Admin entity note body (≤8k) | `/api/admin/notes` | zod DTO | — | P1 |
| 13 | Property search `q` / city | property search schema | ano | `sanitizeText` | P1 |
| 14 | Public `/hledat?q=` | search page | **slabé** | React escape only | P1 |
| 15 | Admin list `?q=` | users/DQ/properties | ad-hoc | — | P2 |
| 16 | `/api/admin/search?q=` | admin search | zod 2–120 | — | P1 |
| 17 | Comparison share flows | comparisons | rate limit | — | P1 |
| 18 | Onboarding goals/prefs | onboarding actions | částečně | — | P2 |
| 19 | Marketing / consent toggles | privacy consents | enum/version | N/A | P1 |
| 20 | Webhook bodies (payments, HJ) | API routes | signature + schema | N/A (JSON) | P0 |
| 21 | CSV export cells (admin) | csv-export | N/A | formula sanitize | P1 |
| 22 | CMS / content fields (admin) | platform content | částečně | **rich HTML riziko** | P0 |
| 23 | Moderation / merge notes | property admin | reason min | plain | P2 |
| 24 | Lead nextActionNote / payload | leads | částečně | CRM sanitize | P1 |

### Sanitizační standard (cíl)

1. **Zod first** — typ, max length, email/phone regex, enum.  
2. **Plain text:** strip tags + control chars + max length (sjednotit `sanitizeCrmPlainText` / favourite).  
3. **HTML (pokud kdy povoleno):** allowlist + DOMPurify (nebo ekvivalent) — dnes **DOMPurify v repo není**.  
4. **Nikdy** `dangerouslySetInnerHTML` bez allowlist sanitizace (audit v implementační fázi).

---

## 3. Security headers — stav vs. cíl

### 3.1 Existující

| Header / kontrola | Kde | Stav |
| --- | --- | --- |
| `X-Powered-By` off | `next.config.ts` `poweredByHeader: false` | ✅ |
| `x-robots-tag: noindex` | middleware na `/ucet`, `/admin` | ✅ |
| `Cache-Control: no-store` | `/api/admin/*` | ✅ |
| Auth cookies HttpOnly/Secure/SameSite | Auth.js defaults (ověřit prod) | ⚠️ ověřit |
| Admin zone / i18n custom headers | middleware | ✅ (ne security) |

### 3.2 Chybějící (povinné pro produkční hardening)

| Header | Cílová hodnota (návrh) | Kam |
| --- | --- | --- |
| **Content-Security-Policy** | Strict default-src `'self'`; script-src s nonce/hash; img/font/connect allowlist (PSP, analytics až po consent); `frame-ancestors 'none'` | middleware **nebo** `next.config` `headers()` |
| **Strict-Transport-Security** | `max-age=63072000; includeSubDomains; preload` (jen HTTPS prod) | middleware / platform |
| **X-Content-Type-Options** | `nosniff` | middleware |
| **X-Frame-Options** | `DENY` (nebo CSP frame-ancestors) | middleware |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | middleware |
| **Permissions-Policy** | vypnout `camera`, `microphone`, `geolocation` pokud nepotřeba | middleware |
| **Cross-Origin-Opener-Policy** | `same-origin` (vyhodnotit OAuth popup) | middleware |
| **Cross-Origin-Resource-Policy** | `same-site` / `same-origin` dle assetů | middleware |

**Poznámka:** CSP musí být koordinováno s Auth.js, platebním iframe/redirectem a případným HypotekaJasne; začít Report-Only, pak enforce.

---

## 4. Kritické mezery (souhrn pro další fáze)

1. **Žádné CSP / HSTS / baseline security headers** v middleware ani `next.config`.  
2. **XSS sanitizace** stále nejednotná (bez DOMPurify; CMS/rich text riziko). `PRIVACY_ARCHITECTURE.md` je hotový.  
3. **Vysoká koncentrace finančního PII** (passport + leads + billing) bez jednotného privacy data-map dokumentu a bez plošného input gate na všech free-text vstupech (zejména `/hledat`, admin notes, CMS).

### Další backlog (neblokuje zápis plánu)

- Explicitní CSRF strategie dokumentovat (Server Actions + SameSite).  
- Doplnit `PROPERTY_DATA_MODEL.md` (public vs internal fields).  
- Sjednotit rate limits mimo auth (contact form až vznikne, public search abuse).  
- Live partner webhooks: signature + replay (částečně hotovo, prod adapter).

---

## 5. Navrhované pořadí implementace (až přijde pokyn)

1. Security headers (HSTS + baseline) → CSP Report-Only → enforce.  
2. Central `lib/security/sanitize.ts` + Zod gate checklist z §2.  
3. ~~`docs/PRIVACY_ARCHITECTURE.md`~~ (hotovo) — další: data-flow diagram account → HJ v diagramu.  
4. `docs/PROPERTY_DATA_MODEL.md` (public DTO contract).  
5. Pen-test style regression: IDOR, admin masking, consent before handoff.

---

*Tento dokument je výstup KROKU 1–3. Nevytváří UI ani neaplikuje headers v kódu.*
