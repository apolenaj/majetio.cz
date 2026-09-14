# Testing Architecture — Majetio

**Stack:** Vitest (Jest-compatible unit/integration) + Playwright (E2E)  
**Datum:** 2026-07-22

## Layers

| Layer | Tool | Location | Purpose |
| --- | --- | --- | --- |
| Unit / contract | Vitest | `src/**/*.{test,spec}.ts` | Pure logic, IDOR source contracts, webhook crypto, SEO rules |
| Security stubs | Vitest | `src/testing/security/*.spec.ts` | Rate-limit, IDOR, MIME, webhook signature scenarios |
| E2E | Playwright | `e2e/**/*.spec.ts` | Auth gates, privacy CMP, access denied, SEO DOM |
| SEO CI script | `tsx` | `scripts/seo/check-seo-quality.ts` | Canonical, headers, JSON-LD against live/base URL |
| Release checklists | Markdown | `docs/*_REVIEW_CHECKLIST.md` | Human audit before deploy |

Vitest is the Jest replacement in this repo (`@testing-library/jest-dom` for DOM matchers). Prefer Vitest APIs; do not add a second Jest runner.

## Commands

```bash
npm test                          # all Vitest
npm run test:security             # security stubs/specs only
npm run test:e2e                  # all Playwright
npm run test:e2e:security         # security + privacy E2E
npm run test:seo-check            # SEO quality script (needs BASE_URL or default)
npm run test:release-gates        # security unit + thin-page SEO tests
```

## Auth / fixtures for E2E

Authenticated privacy flows need a seeded user:

```bash
npm run db:seed:test-user
# then:
E2E_USER_EMAIL=... E2E_USER_PASSWORD=... npm run test:e2e:security
```

Without credentials, privacy account specs **skip** authenticated cases and still run anonymous gates (redirects, CMP).

## Security stubs (must stay green)

1. **Rate limiting** — login + password reset call `assertNotRateLimited` / lock after N failures  
2. **IDOR** — user A cannot mutate user B (session-bound `userId`)  
3. **Upload MIME** — reject non-allowlisted content types  
4. **Webhook signatures** — payments + HypotekaJasne reject tampered bodies  

## Privacy & Trust E2E

1. Account deletion request, data export, marketing preference change (auth required)  
2. Cookie consent: reject non-essential → cookie persists → analytics stays off  

## SEO gates

1. Script: canonical URL, security/cache headers on private paths, JSON-LD parse + no fake ratings  
2. Thin pages → `robots: noindex` via `decideProgrammaticIndexability` + metadata builder  

## Related

- `docs/SECURITY_REVIEW_CHECKLIST.md`
- `docs/LEGAL_REVIEW_CHECKLIST.md`
- `docs/SEO_REVIEW_CHECKLIST.md`
- `docs/PRIVACY_BY_DEFAULT.md`
- `docs/SECURITY_HARDENING.md`
