# Privacy-by-Default — Majetio

**Datum:** 2026-07-22  
**Scope:** HTTP cache, CORS, XSS/CSV/SSRF, consent, transactional mail, audit, soft delete

## 1. HTTP & caching

Private zones get strict `Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate` via middleware (`src/lib/security/http-privacy.ts`):

- `/ucet`, `/onboarding`, `/admin`, `/profi`, `/checkout`
- `/api/account`, `/api/admin`, `/api/payments`, `/api/integrations`

Shared CDN must not cache profiles, private analyses, or leads.

## 2. CORS

Webhook endpoints (`/api/payments/webhook`, `/api/integrations/hypotekajasne/webhook`):

- **No** `Access-Control-Allow-Origin`
- `OPTIONS` → `405` (`rejectCorsPreflight`)
- Responses strip accidental CORS headers

## 3. Client / RSC payloads

- Exact Financial Passport CZK fields must not be passed into Client Components that only need readiness signals — use `toClientSafePassportSummary` (`src/lib/financial-passport/client-safe.ts`).
- Edit forms that need exact amounts remain server-owned / owner-only.
- Logger redacts FP keys (`src/lib/security/logger.ts`).

## 4. Inputs & exports

| Control | Module |
| --- | --- |
| XSS plain text | `sanitizePlainText` / `sanitizeUserContentField` |
| Admin notes | sanitized on create |
| CSV formula injection | `escapeCsvCell` in account `export-csv` + admin CSV |
| SSRF | `assertSafeOutboundUrl` + `safeFetch`; market-alert webhooks block localhost / RFC1918 |

## 5. Consent & e-mail

- CMP: analytics/marketing off until consent (`consent-gate.ts`).
- Transactional e-mail **does not** require marketing consent (`transactional-policy.ts`).
- Templates never put FP amounts in the body — only deep links into `/ucet…` (`templates.ts` + tests).

## 6. Audit & soft delete

| Event | Action |
| --- | --- |
| Webhook signature failure | `security.webhook.forgery` |
| Auth lockout burst | `security.auth.failure_burst` |
| Admin role change helper | `auditAdminRightsChange` |
| Soft erasure | `privacy.soft_erasure.requested` — clears FP values + `deletionRequestedAt` / `DELETION_REQUESTED` |

Admin entity notes use `deletedAt` soft-delete. Leads use retention redaction fields.

## Related

- `docs/PRIVACY_ARCHITECTURE.md` — CMP, export tokens, legal docs
- `docs/SECURITY_HARDENING.md` — CSP, rate limits, IDOR
