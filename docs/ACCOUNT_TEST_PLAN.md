# Account Test Plan — Majetio.cz

## Unit (Vitest)

| File | Coverage |
| --- | --- |
| `src/lib/auth/password.test.ts` | Password policy |
| `src/lib/auth/callback-url.test.ts` | Open redirect |
| `src/lib/analytics/events.test.ts` | No-PII account events |
| `src/lib/financial-passport/progress.test.ts` | Progress + indicative tips |
| `src/lib/privacy/handoff.test.ts` | Shareable fields minimisation |
| `src/lib/email/templates.test.ts` | Templates without finance PII |
| `src/lib/security/idor.test.ts` | Session-bound action contracts |

```bash
npm test
```

## E2E (Playwright)

| File | Coverage |
| --- | --- |
| `e2e/account-auth.spec.ts` | Register/login/reset UI, no marketing checkbox, protected redirect, a11y labels |

```bash
npm run build && npx playwright test e2e/account-auth.spec.ts
```

Uses port **3010** (`reuseExistingServer: false`).

## Manual

- [ ] Seed test user → login → onboarding already complete → dashboard  
- [ ] Edit Finanční pas in two windows → conflict message  
- [ ] Marketing toggle OFF by default on `/ucet/upozorneni`  
- [ ] HJ preview does not send until confirm  
- [ ] Export JSON/CSV; delete flow requires typed e-mail
