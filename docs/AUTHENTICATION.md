# Authentication — Majetio.cz

## Stack

- **Auth.js (NextAuth v5)** with **Credentials** provider (e-mail + password)
- **JWT sessions** (14 days), Prisma adapter for account linkage
- Password hashing: **bcryptjs** (12 rounds)
- Rate limiting: `AuthRateLimit` table (IP + e-mail keys)

## Routes

| Route | Purpose |
| --- | --- |
| `/registrace` | E-mail, heslo, povinný souhlas TERMS+PRIVACY |
| `/prihlaseni` | Credentials login + `callbackUrl` (open-redirect guarded) |
| `/zapomenute-heslo` | Request reset |
| `/obnovit-heslo` | Confirm reset via token |
| `/overeni-emailu` | Confirm pending e-mail change |

## Rules

- Role is **always** `USER` at registration — never taken from the client
- Role in session JWT is refreshed from DB on sign-in
- Marketing consent is **not** part of registration and must never be pre-checked
- Password policy: ≥8 chars, letter + digit

## Env

- `AUTH_SECRET` (required)
- `DATABASE_URL` (required)
- `AUTH_URL` / `NEXT_PUBLIC_APP_URL` for reset/confirm links
- `AUTH_CREDENTIALS_ENABLED` — set `false` to disable credentials provider

## Audit

Sensitive auth events go to `AuditLog`: `auth.register`, `auth.login.success|failure`, `auth.password_reset.*`, `auth.password_change`, `auth.logout`. Login failure meta uses **e-mail fingerprint**, not raw e-mail.
