# Privacy Architecture — Majetio

## Principles

1. **No false certainty / no blanket partner consent** — každě předání dat má přesného příjemce, účel a `sharedScope`.
2. **AI is not source of truth** — AI shrnuje; negeneruje právní fakta.
3. **Financial Passport is protected** — admin default masked; reveal = permission + step-up + audit event.
4. **Cookies without dark patterns** — Accept all / Reject / Customize with equal weight; analytics/marketing off until consent.
5. **Export is not a public URL** — one-time authenticated token (15 min), POST download, `Cache-Control: no-store`.

## Routes

| Path | Role |
| --- | --- |
| `/podminky` | LegalDocument TERMS (canonical) |
| `/ochrana-soukromi` | LegalDocument PRIVACY |
| `/cookies` | LegalDocument COOKIES + CMP policy |
| `/ucet/soukromi` | Privacy Center (consents, ledger, export, deletion request) |
| `/obchodni-podminky`, `/ochrana-osobnich-udaju`, `/ucet/souhlasy` | Permanent redirects to canonical |

## Data model

### `LegalDocument`

`type` · `version` · `status` (DRAFT/PUBLISHED/ARCHIVED) · `content` · locale/market.

UI loads PUBLISHED row; falls back to `src/domains/privacy/legal-content.ts` until counsel publishes DB rows.

### `ConsentRecord`

Purpose-scoped ledger: cookies (`COOKIE_*`), `PARTNER_DATA_SHARE`, legal. Fields: `user`/`visitorId`, `purpose`, `recipient`, `sharedScope`, `version`, timestamps.

`assertPartnerShareConsent` rejects generic recipients (“partneři”).

### Legacy `Consent` / `ConsentVersion`

Account TERMS/PRIVACY/MARKETING and mortgage handoff continue to write `Consent`. Handoff also writes `ConsentRecord` PARTNER_DATA_SHARE.

### `PrivacyExportToken`

Hashed one-time token; consumed on download via `POST /api/account/privacy-export`.

## Cookie CMP

- Component: `ConsentBanner` in root layout
- Cookie: `majetio_cookie_consent` (versioned JSON)
- Categories: Necessary (locked), Preferences, Analytics, Marketing
- Gate: `src/lib/analytics/consent-gate.ts` — client product telemetry blocked without analytics/marketing consent

## Financial Passport audits

- `loadAdminUserDetail({ includeFinancialPassport: false })` → masked
- `adminRevealFinancialPassportAction` → `users.financial_passport.read` + `assertSensitiveAction` + `admin.financial_passport.read` audit
- Owner updates audit via `financial_passport.update`

## Related docs

- `docs/PRIVACY_BY_DEFAULT.md`
- `docs/CONSENT_MANAGEMENT.md`
- `docs/FINANCIAL_PASSPORT.md`
- `docs/AUDIT_LOG.md`
- `docs/HARDENING_PLAN.md`
- `docs/SECURITY_HARDENING.md`
