# Security Baseline — Majetio.cz

## Principles

1. **Server-side authorization** for every privileged action
2. **Least privilege** roles
3. **No secrets in git** — only `.env.example` placeholders
4. **Validate all inputs** with Zod on client and server
5. **Consent before partner handoff** (HypotekaJasne, services)
6. **Audit** sensitive mutations

## Auth

- Auth.js (NextAuth v5) session strategy
- Roles on `User.role`; helpers `requireUser` / `requireRole`
- Middleware protects `/ucet/*` and `/admin/*` (defense in depth; pages re-check)

## Data classification

| Class | Examples | Controls |
| --- | --- | --- |
| Public | Listings summary, methodology | Cache OK |
| Authenticated | Favourites, saved searches | Session required |
| Sensitive financial | FinancialProfile | Owner + staff roles |
| **PROTECTED** | `PropertyTransaction.agreedPriceMinor` | Parties + ADMIN/SALES; every read/write audited via `PropertyTransactionAccessLog` (never log the amount) |
| Restricted CRM | Leads | SALES/ADMIN |
| Secrets | DB URL, auth secret, API keys | Env only |

Purchase Concierge / transaction success-fee agency: gated by `TRANSACTION_SUCCESS_FEE_ENABLED` (default **false**) until legal framework exists — see `docs/PROFESSIONAL_SERVICES.md`.

## HypotekaJasne integration

- Phase 1: mock adapter only
- Production: TLS, signed requests, consent check, minimal data export, audit log

## Headers & platform

- Prefer secure cookies (`HttpOnly`, `Secure`, `SameSite`)
- HTTPS everywhere in production
- Dependabot / npm audit in CI over time

## GDPR / privacy (baseline)

- Consent records with version
- Account erasure via `deleteAccount` — hard delete user + cascade favourites, notes, comparisons, shares (see `docs/ACCOUNT_RETENTION.md`)
- Audit keeps anonymized `emailHash` on delete
- No fake tracking claims

## Explicit bans

- No `any` for auth/permission bypasses
- No client-only role checks
- No logging of passwords, tokens, or full FinancialProfile dumps
