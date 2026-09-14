# Security Review Checklist — Pre-release

Use before production deploy when auth, payments, admin, uploads, or webhooks changed.

## Auth & session

- [ ] Login and password reset rate-limited (`assertNotRateLimited` / lockout after failures)
- [ ] Failed auth bursts write audit (`security.auth.failure_burst`)
- [ ] Suspended / `DELETION_REQUESTED` accounts cannot authenticate
- [ ] Session cookies: `HttpOnly`, `Secure` (prod), `SameSite` appropriate
- [ ] CSRF / Server Actions: no client-supplied `userId` for mutations

## Authorization / IDOR

- [ ] User A cannot read/update/delete User B resources (favourites, passport, export, orders, scenarios)
- [ ] Admin APIs require admin-zone role + permission keys
- [ ] Broker `/profi` and `/admin` redirect anonymous users
- [ ] Impersonation (if enabled): reason required, cannot target admin staff, audited

## HTTP / cache / CORS

- [ ] Private zones: `Cache-Control: private, no-store` (`/ucet`, `/admin`, `/profi`, `/checkout`, account APIs)
- [ ] Security headers: CSP nonce, HSTS (prod), `nosniff`, `frame-ancestors 'none'`, Referrer-Policy
- [ ] Webhooks: **no** `Access-Control-Allow-Origin`; OPTIONS → 405
- [ ] RSC / client props: no exact FP CZK fields on shared/public components (use client-safe summary)

## Inputs / outputs

- [ ] User text (notes, titles, descriptions) sanitized (`sanitizePlainText` / rich allowlist)
- [ ] CSV exports formula-injection safe (`escapeCsvCell`)
- [ ] Uploads MIME allowlisted (`assertAllowedUploadMime`); no HTML/JS executables
- [ ] SSRF: outbound user URLs blocked for localhost / RFC1918 / metadata (`safeFetch`)

## Payments & webhooks

- [ ] Payment + HJ webhook signatures verified; forgeries audited (`security.webhook.forgery`)
- [ ] Webhook idempotency + IP rate limit + body size cap
- [ ] Secrets only in server env — never in client bundles
- [ ] Entitlements granted only after verified paid webhook / trusted mock in non-prod

## Logging & admin

- [ ] Logs redact passwords, tokens, FP fields
- [ ] Admin FP reveal = permission + step-up + audit
- [ ] Soft-delete on admin notes / critical privacy paths
- [ ] `npm run test:security` and `npm run test:e2e:security` green (or documented skips)

## Sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| Engineering | | | |
| Security reviewer | | | |

Related: `docs/SECURITY_HARDENING.md`, `docs/PRIVACY_BY_DEFAULT.md`, `docs/TESTING_ARCHITECTURE.md`
