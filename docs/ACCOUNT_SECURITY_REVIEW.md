# Account Security Review — Majetio.cz (Prompt 6)

## Controls verified

| Area | Status |
| --- | --- |
| Password hashing (bcrypt 12) | OK |
| JWT session; role from DB | OK |
| Open redirect guard on callbackUrl | OK |
| Rate limits on auth / password / delete | OK |
| Middleware + server auth on `/ucet`, `/onboarding` | OK |
| IDOR: session-bound mutations (no client userId) | OK (contract tests) |
| Marketing not pre-checked | OK |
| HJ handoff requires explicit consent preview | OK |
| Analytics without PII/amounts | OK (assert + tests) |
| AuditLog for login / password / consent / export / delete | OK |
| Login failure audit uses e-mail fingerprint | OK |

## Residual risks / limitations

- Live e-mail provider not wired — templates logged in development only
- Live HypotekaJasne API is mock by default
- Full E2E register→passport needs migrated DB + seed
- Admin RBAC UI not fully productized
- Property-scoped IDOR for analyses/listings deferred to Prompt 7

## Recommendations before production

1. Wire transactional mail provider (Resend/SES) using `src/lib/email/templates.ts`  
2. `AUTH_SECRET` rotation + HTTPS only cookies  
3. Consider hashing or redacting more audit meta fields  
4. Run `npm run db:migrate` + `npm run db:seed:test-user` in staging
