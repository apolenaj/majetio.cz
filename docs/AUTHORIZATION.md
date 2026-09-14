# Authorization — Majetio.cz

## Layers

1. **Edge middleware** (`src/middleware.ts`) — JWT gate for `/ucet/*`, `/onboarding/*`, `/admin/*`
2. **Server session** — `auth()` / `requireUser()` / `requireRole()` / `requireMinRole()` / **`requirePermission(key)`**
3. **Data scope** — all account mutations use `session.user.id` only (no client-supplied foreign `userId`)

## Roles (`Role` enum)

`USER` → `PAID_CLIENT` → staff → ops roles → `ADMIN` / `SUPER_ADMIN`.

Registration always creates `USER`.

### Admin zone (`/admin`)

JWT role must be an **admin-zone role**:  
`OPERATIONS_ADMIN` | `DATA_ADMIN` | `PROPERTY_REVIEWER` | `COMMERCE_ADMIN` | `ADMIN` | `SUPER_ADMIN`.

Fine-grained access uses **permission keys** (see [`ADMIN_RBAC.md`](./ADMIN_RBAC.md)).  
Legacy helper `isAdmin()` is still `ADMIN | SUPER_ADMIN` only — prefer `requirePermission` for new code.

Sensitive actions (refund, user delete, entitlement grant) require **step-up**: reason + `CONFIRM_ACTION` token + AuditLog.

## IDOR policy

- Passport, consents, export, handoff, settings: **never** accept `userId` from body/query
- Resource IDs (analysis, comparison) must be filtered by `userId` when implemented in Prompt 7+
- Admin APIs: actor identity always from session (`requirePermission`); client-supplied `authorUserId` / `assignedByUserId` rejected by zod `.strict()` + `assertActorIsSessionUser`
- Verified by `src/lib/security/idor.test.ts` and `src/domains/administration/api/admin-security.test.ts`

## Admin API (`/api/admin/*`)

Edge middleware requires login + admin-zone role (401/403 JSON).

Every route then runs **`requireAdminApiPermission(key)`** (fine-grained). Mutations use zod schemas; private notes/assignments never accept actor IDs from the client.

| Route | Permission |
| --- | --- |
| `GET /api/admin/search` | `ops.search.read` (+ per-type filter) |
| `GET/POST /api/admin/notes` | `ops.notes.read` / `.write` |
| `DELETE /api/admin/notes/[id]` | `ops.notes.write` |
| `GET/POST /api/admin/assignments` | `ops.assignments.read` / `.write` |
| `PATCH /api/admin/assignments/[id]` | `ops.assignments.write` |
| `/api/admin/db/*` | **always 403** (no universal DB editor) |

Access is session-audited via `auditAdminApiAccess` → append-only `AuditLog`.

PII on admin search/cards is **masked** (`maskEmail`, `maskPhone`) — see `src/domains/administration/security/masking.ts`.

## Callback URLs

`getSafeCallbackUrl` allows only same-origin relative paths starting with `/` — blocks `//`, `@`, protocols.
