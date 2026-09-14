# Security Hardening — Majetio

**Datum:** 2026-07-22  
**Scope:** Threat Model · Security Controls · Risk Register · Remaining Risks · Security Performance (UX)  
**Kód:** `src/middleware.ts`, `src/lib/security/*`, `src/lib/auth/*`, `src/app/api/**`

Tento dokument je **kanonický AppSec threat model**. Operativní detaily:

| Téma | Dokument |
| --- | --- |
| Autentizace | `docs/AUTH_SECURITY.md` |
| API / IDOR | `docs/API_SECURITY.md` |
| SSRF | `docs/SSRF_PROTECTION.md` |
| Privacy / cache | `docs/PRIVACY_BY_DEFAULT.md`, `docs/PRIVACY_HARDENING.md` |
| Admin RBAC | `docs/ADMIN_API_SECURITY.md`, `docs/AUTHORIZATION.md` |
| Baseline klasifikace | `docs/SECURITY_BASELINE.md` |
| Pre-release checklist | `docs/SECURITY_REVIEW_CHECKLIST.md` |

**Hodnocení Likelihood / Impact:** Low · Medium · High · Critical  
**Residual Risk:** riziko po aplikaci stávajících mitigací.

---

## 1. Threat Model

### 1.1 Threat Actors

| Actor | Motivace | Schopnosti | Typické cíle |
| --- | --- | --- | --- |
| **Unauthenticated attacker** | Účet, data, fraud, defacement | Internet scanning, credential stuffing, webhook probing | Login, reset, veřejné API, webhooks |
| **Malicious user** | Cizí data, abuse entitlements | Platný účet, IDOR pokusy, export abuse | `/ucet`, Server Actions, share linky |
| **Malicious seller / broker** | Manipulace nabídky, XSS v listingu, ranking fraud | Přístup `/profi` / listing CMS | Property content, média, sponsored |
| **Compromised partner** | Replay webhooků, exfiltrace leadů | Platné/ukradené signing secrets, IP partnera | Payments / HJ webhooks, outbound handoff |
| **Low-privilege admin** | Privilege escalation, FP peek, masové exporty | Admin-zone role s úzkými permissions | `/admin`, `/api/admin`, reveal FP |
| **Bot / scraper** | Bulk property data, price intel, DoS | High QPS, headless, distributed IP | `/nemovitosti`, search, sitemaps, JSON |

### 1.2 Assets

| Asset | Citlivost | Proč kritické |
| --- | --- | --- |
| **Accounts** | High | Identita, session, role, `accountStatus` |
| **PII** | High | Email, jméno, telefon leadů, IP v auditu |
| **Financial Passport** | Critical | Příjem, závazky, equity, credit band |
| **Payment state** | Critical | Orders, entitlements, webhook ledger, refunds |
| **Property data** | Medium–High | Listings, valuace, interní quality scores |
| **Admin access** | Critical | RBAC, impersonation, DB ops, config |
| **Partner integrations** | High | HJ leads, payment PSP, signed webhooks |

### 1.3 Threat Scenarios (minimální sada)

| ID | Scénář | Actor | Asset | Popis útoku |
| --- | --- | --- | --- | --- |
| T1 | **Account takeover** | Unauth / bot | Accounts | Credential stuffing, reset flood, session theft |
| T2 | **IDOR** | Malicious user | PII, FP, orders | Mutace/čtení resource jiného `userId` |
| T3 | **Payment fraud** | Unauth / user | Payment state | Falešné „paid“ bez PSP, replay, client-side price |
| T4 | **Webhook spoofing** | Compromised partner / unauth | Payment, leads | Podvržený POST bez platného podpisu |
| T5 | **Listing XSS** | Malicious seller | Property, sessions | Script v title/description/HTML médií |
| T6 | **SSRF** | Malicious user / seller | Infra, secrets | `fetch` na localhost / metadata / RFC1918 |
| T7 | **Data scraping** | Bot | Property data | Masové čtení katalogu / API |
| T8 | **Admin privilege abuse** | Low-priv admin | Admin, FP | Rights change, FP reveal, impersonation |
| T9 | **Sensitive file leak** | Unauth / user | Secrets, exports | `.env`, export URL, source maps, signed media |

---

## 2. Security Controls

### 2.1 Mapování scénář → control

| Scenario | Primární controls (implementováno) |
| --- | --- |
| T1 Account takeover | Auth.js session; password hash; rate limit 8/15min + lock; reset rate limit; `accountStatus` gate; audit lockout |
| T2 IDOR | Session-bound `userId`; `assertOwnedRecord` → 404; `pickDto`; source contracts ve Vitest |
| T3 Payment fraud | Server-side pricing; entitlement až po verified webhook; idempotent `eventId`; no client amount authority |
| T4 Webhook spoofing | HMAC/signed headers; timestamp tolerance; IP rate limit; body size cap; no CORS; audit `security.webhook.forgery` |
| T5 Listing XSS | `sanitizePlainText` / `sanitizeRichHtml`; React text nodes; MIME allowlist uploadů |
| T6 SSRF | `assertSafeOutboundUrl` + `safeFetch` (`redirect: error`); listing URL + market-alert webhooks |
| T7 Scraping | `robots` disallow private; partial search RL helper (viz Remaining); sitemap quotas; no private in sitemap |
| T8 Admin abuse | Admin-zone role + permission keys; FP masked + step-up reveal audit; impersonation reason + deny staff targets |
| T9 Sensitive leak | Env-only secrets; export one-time token 15min + POST; `no-store` private zones; logger redaction; media-public gate |

### 2.2 Control layers (stack)

```text
Edge middleware: CSP nonce, HSTS, nosniff, frame deny, private Cache-Control, auth redirects
     ↓
AuthN / AuthZ: session, RBAC, ownership queries
     ↓
Input: Zod strictObject, body size, sanitize, MIME
     ↓
Outbound: SSRF guards
     ↓
Webhooks: signature → idempotency → business logic
     ↓
Telemetry: redacted logs + AuditLog
```

### 2.3 HTTP / middleware controls

| Control | Detail |
| --- | --- |
| CSP | nonce + `strict-dynamic`; enforce prod; Report-Only dev |
| HSTS | prod only, preload-capable |
| Auth edge | `/ucet`, `/onboarding`, `/admin`, `/api/admin`, `/profi` |
| Private cache | `private, no-store` na account/admin/broker/checkout + citlivá API |

### 2.4 Rate limits (aktuální)

| Surface | Limit | UX dopad |
| --- | --- | --- |
| Login / reset failures | 8 / 15 min → lock 15 min | Střední — viz §5 |
| Workspace favourite / note | 40 / min | Nízký |
| Comparison | 30 / min | Nízký–střední u power userů |
| Share | 15 / min | Nízký |
| Webhook IP | 120 / min | Žádný (server-to-server) |
| Public search helper | 60 / min | **Zatím newireováno** do search routes |

---

## 3. Risk Register

| Threat | Likelihood | Impact | Mitigation | Residual Risk |
| --- | --- | --- | --- | --- |
| Account takeover (stuffing / reset abuse) | High | Critical | Rate limit + lock + strong hash + status gate + audit burst | **Medium** — bez CAPTCHA/WAF na login; NAT sdílí IP |
| IDOR na account resources | Medium | High | Session ownership + 404 + Vitest contracts | **Low–Medium** — nové actions musí dodržet pattern |
| Payment fraud (fake paid / client price) | Medium | Critical | Server quote + signed webhook + entitlements | **Low** — záleží na PSP config v prod |
| Webhook spoofing | Medium | Critical | Signature + tolerance + idempotency + forgery audit | **Low** — high pokud unikne `WEBHOOK_SECRET` |
| Listing / note XSS | Medium | High | Sanitize + MIME allowlist + CSP | **Low–Medium** — rich HTML allowlist musí zůstat úzký |
| SSRF via user/partner URL | Medium | High | Block private/metadata + optional allowlist + no redirects | **Medium** — DNS rebinding bez IP re-check |
| Property data scraping | High | Medium | robots, sitemap limits; search RL připraven | **High** — public search RL není napojen; chybí bot challenge |
| Admin privilege abuse | Medium | Critical | RBAC + FP mask/step-up + impersonation audits | **Medium** — insider s širokou rolí |
| Sensitive file / export leak | Medium | Critical | No public export URL; token TTL; no-store; env secrets | **Low–Medium** — misconfig CDN/cache mimo app |
| Session fixation / XSS→session | Low–Medium | Critical | HttpOnly cookies + CSP + sanitize | **Low** |
| Partner data misuse post-handoff | Medium | High | Purpose consent + scope + audit; partner DPA | **Medium** — mimo kontrolu Majetio po předání |
| Supply-chain / dependency | Medium | High | Lockfile, CI, least privilege deploy | **Medium** (standard) |

---

## 4. Remaining Risks

Explicitní zbytková rizika po současných controls:

1. **Public scrape / search abuse** — `assertPublicSearchRateLimit` existuje, ale **není napojen** na search/listing hot paths → boti mohou číst katalog agresivně.
2. **Login UX vs. lockout** — po 8 failech hard lock 15 min; zpráva bez `retryAfterSec` (`AUTH` constants: „za chvíli“) → legitimní uživatel neví, jak dlouho čekat; sdílená firemní IP zhoršuje false positives.
3. **SSRF DNS rebinding** — kontrola hostname před fetch nestačí proti změně DNS mezi check a connect; chybí resolve+IP revalidation.
4. **CSP third-party** — po udělení analytics/marketing consent musí být allowlist script hostů synchronní s CMP; jinak buď broken tags, nebo dilema povolit široké `script-src`.
5. **Low-privilege admin horizontal move** — RBAC snižuje, ale špatně přiřazená role (např. široký `OPERATIONS_ADMIN`) = residual insider risk.
6. **Partner webhook secret rotation** — bez documented dual-secret rotation window hrozí outage nebo prodloužené okno se starým secretem.
7. **HARDENING_PLAN P1** — contact form / další veřejné mutace bez jednotného RL (viz `docs/HARDENING_PLAN.md`).
8. **Permissions-Policy `payment=()`** — záměrně vypnuto; pokud by se zavedlo Payment Request API / Wallet, je potřeba cíleně povolit (jinak tiché selhání UX).

Žádné z výše uvedených **neblokuje** běžný happy-path nákup / prohlížení / účet při normálním použití; #1 a #2 jsou nejbližší k „friction / gap“ opravám (§5).

---

## 5. Security Performance (UX)

Cíl: security controls **nesmí nepřiměřeně zhoršovat** legitimní UX. Audit stávajícího nastavení:

| Control | UX efekt | Verdikt | Úprava (návrh) |
| --- | --- | --- | --- |
| Auth lock 8/15min | Po opakovaných překlepech hesla lock bez přesného času | **Friction** | Zobrazit `retryAfterSec` v chybě („zkuste za X min“); po 3 failech soft warning; CAPTCHA/turnstile před hard lock místo okamžitého 15min lock na sdílené IP |
| Rate limit key `ip+email` | NAT / coworking false positive | **Acceptable s rizikem** | Preferovat email-keyed bucket + oddělený přísnější IP bucket; admin unlock path |
| Workspace 30–40 mut/min | Power user hromadné porovnání | **OK** | Comparison limit 30→45 pokud support uvidí stížnosti; toast už obsahuje srozumitelnou CZ chybu |
| Cookie CMP banner | První návštěva — nutný dialog | **OK (legal)** | Zachovat equal-weight Reject; nezpožďovat LCP hero (banner `fixed` bottom) |
| CSP enforce (prod) | Inline bez nonce selže | **OK** | Dev = Report-Only (už); před prod release CSP report endpoint |
| `Cache-Control: no-store` na `/ucet` | Mírně pomalejší back/forward | **OK (privacy)** | Neměnit; veřejný katalog nechat cacheable |
| `assertOwnedRecord` → 404 | „Záznam nenalezen“ i při cizím id | **OK** | Neměnit (anti-enumeration) |
| Export one-time 15 min | Uživatel musí stáhnout hned | **OK** | Prodloužit na 30 min jen pokud analytics ukážou drop-off |
| Webhook / SSRF timeouts 8s | Partner pomalý endpoint | **OK** | Konfigurovatelný `timeoutMs` per partner, max 15s |
| `payment` Permissions-Policy off | Budoucí Wallet UX | **Watch** | Před zapnutím PSP Wallet explicitně povolit `payment=(self)` |
| Public search RL newireován | Žádný false-positive na UX | **Gap spíš než friction** | Napojit RL **až** s jemným limitem (např. 120/min/IP) + `Retry-After` header, aby SEO boti a lidé nedostávali tvrdé 429 bez kontextu |

### 5.1 Doporučené úpravy (priorita)

| Priorita | Úprava | Důvod |
| --- | --- | --- |
| P0 | Auth error text + `retryAfterSec` (minuty) | **Hotovo** — `rateLimitedMessage()` v registraci/resetu (`src/lib/auth/constants.ts`) |
| P1 | Napojit `assertPublicSearchRateLimit` s vyšší prahem + `Retry-After` | Zavře scrape gap bez bití běžných uživatelů |
| P1 | Progressive auth: warning → challenge → lock | Lepší UX než flat 8→15min |
| P2 | SSRF IP re-check po DNS | Sníží residual SSRF |
| P2 | CSP report-uri / report-to | Viditelnost breakages před tighten |

**Blokující pro launch?** Ne — žádný control aktuálně nerozbíjí registraci, login (do limitu), browse, CMP reject, checkout happy path.  
**Nejbližší UX dluh:** nekonkrétní rate-limit copy (P0) a chybějící jemné public RL (P1 security gap, ne UX block).

---

## 6. Operativní shrnutí controls

### Headers & edge
CSP nonce, HSTS (prod), nosniff, Referrer-Policy, frame deny, Permissions-Policy, COOP, private `Cache-Control`.

### AuthN/Z
Session authority, admin-zone + permissions, ownership queries, impersonation audited.

### Abuse
Prisma auth RL, workspace RL, webhook IP RL; Upstash sliding když nakonfigurováno.

### Data protection
Sanitize, MIME allowlist, CSV escape, FP mask/client-safe, export token, soft erasure, log redaction.

### Integrations
Signed webhooks, no CORS on callbacks, SSRF on outbound user URLs.

### Verification
```bash
npm run test:security
npm run test:e2e:security
npm run test:release-gates
```

---

## 7. Env (produkce)

```
AUTH_SECRET=
DATABASE_URL=
PAYMENTS_WEBHOOK_SECRET=
PAYMENTS_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# HypotekaJasne signing / webhook secrets
```

Secrets nikdy do client bundle, RSC veřejného HTML, ani do marketing emailů.

---

## 8. Change log

| Datum | Změna |
| --- | --- |
| 2026-07-22 | Threat Model + Risk Register + Remaining Risks + Security Performance UX audit |
| 2026-07-22 | Původní hardening inventory sloučen do tohoto kanonického dokumentu |
