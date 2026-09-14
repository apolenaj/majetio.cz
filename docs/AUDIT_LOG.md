# Audit Log

Append-only operational audit trail. Spec **132–138**, **275–276**, **280–281**.

## Principles

1. **Append-only** — application helpers `updateAuditLog` / `deleteAuditLog` throw; Postgres `BEFORE UPDATE/DELETE` triggers also block mutations.
2. **No secrets** — `sanitizeAuditMeta` + `assertNoSecretsInText` before insert (API keys, Bearer tokens, passwords redacted).
3. **Actor from session** — never trust client-supplied `actorId` / `authorUserId`.

## Columns (enriched)

`action`, `entity` / `entityType`, `entityId`, `actorId`, `actorType`, `reason`, `beforeSummary`, `afterSummary`, `correlationId`, `ip`, `userAgent`, `meta` (sanitized JSON).

## Write path

```ts
await writeOpsAuditLog({
  action: "ops.incident.status",
  entityType: "Incident",
  entityId,
  actorId,
  reason,
  beforeSummary,
  afterSummary,
  meta,
});
```

Also: legacy `writeAuditLog` for domain-specific admin actions (moderation, merge, flags).

## Indexes

entityType+entityId · action+createdAt · correlationId · actorType+createdAt

## UI

`/admin/audit-log` — `platform.audit.read`

## Tests

`admin-unit-250-266.test.ts` — update/delete throw; secret hygiene.  
`admin-mutations-250-266.test.ts` — create path redacts `apiKey`.
