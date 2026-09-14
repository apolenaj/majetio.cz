# Admin Ops Test Plan (checklist 250–281)

## Fixtures (250)

`src/domains/administration/testing/admin-ops-fixtures.ts`

| Fixture | Purpose |
| --- | --- |
| `failedImport` | ImportJob FAILED + items |
| `staleSource` / `staleProperty` | Stale feed + STALE listing |
| `pendingModerationProperty` | PENDING_REVIEW listing |
| `paymentMismatch` | PAID order without entitlement |
| `duplicateCandidate` | Merge A/B pair |
| `openDqIssue` | CRITICAL OPEN DQ |
| `openIncident` | SEV2 OPEN |
| `activeModel` + `previousActiveModelId` | Safe rollback |

## Unit & RBAC (251–266)

| File | Coverage |
| --- | --- |
| `admin-unit-250-266.test.ts` | Permission allow/deny matrix, IDOR guards, AuditLog append-only + secret hygiene, moderation transitions, model lifecycle, flags |
| `admin-mutations-250-266.test.ts` | Mocked mutations: audit write, moderate, flags, rollback, DQ, incident, manual entitlement |

## E2E operations (267–272)

| File | Flows |
| --- | --- |
| `admin-e2e-operations-267-272.test.ts` | DQ resolution, duplicate merge (preview→execute), listing moderation, model governance+rollback, incident resolution, billing entitlement repair |
| `e2e/admin-ops-flows.spec.ts` | Playwright: anonymous gates + route presence for all ops surfaces |

## Related docs

- Full suite index: `docs/ADMIN_OPS_FINAL_REPORT.md` §4
- Anti-patterns (289): `docs/ADMIN_ANTI_PATTERNS.md`
- Architecture: `docs/ADMIN_CONTROL_CENTER.md`

## Run

```bash
npx vitest run src/domains/administration/testing
npx playwright test e2e/admin-ops-flows.spec.ts
```
