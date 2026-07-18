# Authorization — Majetio.cz

## Layers

1. **Edge middleware** (`src/middleware.ts`) — JWT gate for `/ucet/*`, `/onboarding/*`, `/admin/*`
2. **Server session** — `auth()` / `requireUser()` / `requireRole()` / `requireMinRole()`
3. **Data scope** — all account mutations use `session.user.id` only (no client-supplied foreign `userId`)

## Roles (`Role` enum)

`USER` → `PAID_CLIENT` → staff/admin roles. Registration always creates `USER`.

Admin routes require `ADMIN` or `SUPER_ADMIN` in JWT (re-checked from DB on login).

## IDOR policy

- Passport, consents, export, handoff, settings: **never** accept `userId` from body/query
- Resource IDs (analysis, comparison) must be filtered by `userId` when implemented in Prompt 7+
- Verified by `src/lib/security/idor.test.ts` (source contract tests)

## Callback URLs

`getSafeCallbackUrl` allows only same-origin relative paths starting with `/` — blocks `//`, `@`, protocols.
