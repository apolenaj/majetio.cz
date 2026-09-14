# Admin Anti-Patterns (checklist 289)

Forbidden patterns for Admin & Operations Control Center.  
Each row was verified against the codebase (2026-07-22).

| ID | Forbidden pattern | Enforcement | Status |
| --- | --- | --- | --- |
| `universal_db_editor` | Generic DB / table editor API | `/api/admin/db/**` → `rejectUniversalDbEditor()` 403 + audit `ops.api.db_editor.blocked` | ✅ PASS |
| `fake_slack` | Fake Slack / pretend external pager integration | No Slack SDK, webhook stubs, or fake channel notifiers in admin ops | ✅ PASS |
| `unaudited_override` | Property/field override without audit | `upsertPropertyFieldOverride` always `writeAuditLog` | ✅ PASS |
| `unaudited_flag_change` | Feature flag / kill switch without reason+audit | `setFeatureFlagEnabled` → `FeatureFlagChange` + audit | ✅ PASS |
| `manual_payment_succeeded` | Force `Payment.SUCCEEDED` from admin | `refuseManualPaymentSucceeded` / blocked admin action | ✅ PASS |
| `client_actor_id` | Client-supplied actor / author IDs | zod reject + `assertActorIsSessionUser` | ✅ PASS |
| `audit_mutate` | UPDATE/DELETE on AuditLog | App throws + DB triggers | ✅ PASS |
| `secrets_in_audit` | Persist API keys / Bearer in audit meta | `sanitizeAuditMeta` / `assertNoSecretsInText` | ✅ PASS |
| `hard_delete_merge` | Hard-delete secondary on merge | Secondary `ARCHIVED`; merge event snapshot | ✅ PASS |
| `fake_metrics` | Invented KPI / completeness samples | Null → empty state (`AdminMetricTile`, internal metrics) | ✅ PASS |
| `impersonation_payments` | Payments during impersonation | `assertNotImpersonating` | ✅ PASS |
| `passport_default_visible` | Financial Passport visible by default | Masked until sensitive step-up | ✅ PASS |
| `org_kyc_as_listing_verify` | Confuse org KYC with listing verification | Separate permissions & docs | ✅ PASS |

## How to re-check

```bash
# DB editor ban
rg "rejectUniversalDbEditor|/api/admin/db" src

# No Slack fake
rg -i "slack" src/domains/administration src/app/api/admin src/components/admin

# Manual SUCCEEDED ban
rg "refuseManualPaymentSucceeded|force.*SUCCEEDED" src/domains

# Audit append-only
rg "updateAuditLog|deleteAuditLog|append-only" src/domains/administration
```

## Related tests

- `admin-security.test.ts` — DB editor, IDOR, masking  
- `admin-unit-250-266.test.ts` — append-only, RBAC  
- `actors-governance.test.ts` — refuse manual SUCCEEDED  
- `admin-e2e-operations-267-272.test.ts` — merge non-destructive, entitlement repair
