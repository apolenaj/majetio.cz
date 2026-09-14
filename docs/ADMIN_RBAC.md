# Admin RBAC — permission matrix

Granular permissions for `/admin` (code catalog in `src/domains/administration/rbac/`).  
**New ops code uses `requirePermission`.** Legacy `isAdmin()` remains `ADMIN | SUPER_ADMIN` only where not yet migrated.

## Roles

| Role | Intent |
| --- | --- |
| `PROPERTY_REVIEWER` | Property read/merge/moderate/override + DQ resolve |
| `DATA_ADMIN` | Imports, DQ, analytics write (not approve), repair jobs |
| `COMMERCE_ADMIN` | Payments, entitlements grant, orgs billing, pricing, leads |
| `OPERATIONS_ADMIN` | Broad ops (incl. impersonate, model approve, flags) — no `users.delete` |
| `ADMIN` | Operations + commerce + `users.delete` |
| `SUPER_ADMIN` | Wildcard `*` |

Admin zone (JWT middleware): the six roles above only.

## Permission matrix (high-risk keys)

| Permission | PROPERTY_REVIEWER | DATA_ADMIN | COMMERCE_ADMIN | OPERATIONS_ADMIN | ADMIN | SUPER_ADMIN |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ops.dashboard.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `property.merge` | ✓ | — | — | ✓ | ✓ | ✓ |
| `property.moderate` | ✓ | — | — | ✓ | ✓ | ✓ |
| `dataQuality.resolve` | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `import.retry` | — | ✓ | — | ✓ | ✓ | ✓ |
| `payments.refund` | — | — | ✓ | — | ✓ | ✓ |
| `commerce.entitlements.grant` | — | — | ✓ | — | ✓ | ✓ |
| `users.impersonate` | — | — | — | ✓ | ✓ | ✓ |
| `users.delete` | — | — | — | — | ✓ | ✓ |
| `analytics.models.approve` | — | — | — | ✓ | ✓ | ✓ |
| `platform.flags.write` | — | — | — | ✓ | ✓ | ✓ |
| `platform.markets.write` | — | — | — | ✓ | ✓ | ✓ |
| `platform.incidents.write` | — | — | ✓ | ✓ | ✓ | ✓ |

Full key list: `src/domains/administration/rbac/permissions.ts`.  
Maps: `src/domains/administration/rbac/roles.ts`.

## Sensitive step-up

Keys in `SENSITIVE_PERMISSIONS` require:

1. Actor holds the permission  
2. `reason` ≥ 12 characters  
3. `confirmToken === "CONFIRM_ACTION"`  
4. Audit entry (`admin.sensitive.*` / ops audit)

Includes: `property.merge`, `payments.refund`, `commerce.entitlements.grant`, `users.delete`, `users.impersonate`, `users.financial_passport.read`, `analytics.models.approve`, `platform.flags.write`, `platform.markets.write`, `platform.content.publish`, …

## Guards

```ts
await requirePermission("ops.dashboard.read");
await assertSensitiveAction({ permission, reason, confirmToken, actorId, … });
```

Nav: `ADMIN_NAV_SECTIONS` filtered by `hasPermission` in `AdminNav`.
