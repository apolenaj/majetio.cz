# Admin API Security Layer

Specs **151–155**, **178–192**, **240–249**.

## Architecture

```
Edge middleware (/api/admin)
  → admin-zone role (401/403)
    → requireAdminApiPermission(key)
      → zod parse (query/body)
        → domain service
          → auditAdminApiAccess (append-only AuditLog)
```

Public DTOs stay in domain `toPublic*` mappers. Admin DTOs live in
`src/domains/administration/api/admin-dtos.ts` (masked PII, no password hashes).

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/search` | `ops.search.read` — results still permission-filtered |
| GET/POST | `/api/admin/notes` | entity notes |
| DELETE | `/api/admin/notes/[id]` | |
| GET/POST | `/api/admin/assignments` | |
| PATCH | `/api/admin/assignments/[id]` | |
| GET | `/api/admin/health` | `ops.health.read` |
| GET/POST | `/api/admin/jobs`… | jobs / DLQ / tick |
| POST | `/api/admin/repair/recalculate` | 202 enqueue |
| POST | `/api/admin/models/[id]/governance` | model lifecycle |
| ANY | `/api/admin/db/**` | **always 403** |

## Mutation helper

`withAdminMutation({ permission, schema, raw, handler })` — permission + zod before side effects; actor from session only.

## Security rules

1. No universal DB editor  
2. Mask email/phone/IBAN on search & admin cards  
3. Actor IDs only from session (IDOR) — reject client `authorUserId` / `assignedByUserId`  
4. Session access audited (path/method; never raw bodies with secrets)  
5. Strict zod schemas (`.strict()`) on mutation bodies  

## Tests

`src/domains/administration/api/admin-security.test.ts`
