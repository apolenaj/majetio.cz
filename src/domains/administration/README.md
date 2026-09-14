# Domain: administration

Operations Control Center — RBAC, attention queue, operational KPIs.

## Structure

- `rbac/` — permission keys, role maps, guards, sensitive step-up
- `service/` — `buildOperationsAttentionQueue`, `buildOperationsKpis`
- `server/` — (future) shared admin actions
- `tests` — `rbac/rbac.test.ts`, `service/ops-dashboard.test.ts`

## Entry

```ts
import {
  requirePermission,
  buildOperationsAttentionQueue,
  buildOperationsKpis,
} from "@/domains/administration";
```

Docs: `docs/ADMIN_RBAC.md`, `docs/AUTHORIZATION.md`.
