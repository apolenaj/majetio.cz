# Admin & Operations Control Center

Operations-first control plane for Majetio (`/admin`). Not a vanity analytics dashboard — attention queues, typed mutations, RBAC, and append-only audit.

## Architecture (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Edge / JWT middleware                            │
│              ADMIN_ZONE_ROLE → /admin · /api/admin/*                     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│                     requirePermission(key)                               │
│              + assertSensitiveAction (reason + CONFIRM_ACTION)           │
└───┬─────────────┬─────────────┬─────────────┬─────────────┬──────────────┘
    │             │             │             │             │
    ▼             ▼             ▼             ▼             ▼
 Properties   Imports/DQ    Users/Orgs    Commerce     Platform
 merge/mod    jobs/repair   leads/KYC     orders/      flags/CMS
 override                   impersonate   entitle      markets/
                                          refunds      incidents
    │             │             │             │             │
    └─────────────┴─────────────┴──────┬──────┴─────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   Append-only AuditLog  │
                          │   (+ Incident timeline) │
                          └─────────────────────────┘

Data plane (existing Postgres — no parallel DB):
  Property · ImportJob · DataQualityIssue · Payment/Order · Entitlement
  Incident · FeatureFlag · ValuationModelRegistry · SystemJob · DatasetRegistry
```

## Entry points

| Surface | Path |
| --- | --- |
| Ops home (role-personalized) | `/admin` |
| Properties | `/admin/nemovitosti` |
| Duplicate merge | `/admin/nemovitosti/duplikaty` |
| Moderation | `/admin/nemovitosti/moderace` |
| Imports | `/admin/importy` |
| Data quality | `/admin/data-quality` |
| Monitoring / jobs | `/admin/monitoring` |
| Users | `/admin/uzivatele` |
| Organizations | `/admin/organizace` |
| Leads | `/admin/leady` |
| Orders / pricing | `/admin/objednavky`, `/admin/cenik` |
| Markets / flags / CMS / incidents | `/admin/trhy`, `/admin/nastaveni`, `/admin/obsah`, `/admin/incidenty` |

## Design principles

1. **Permission keys**, not a single `isAdmin` boolean for new ops code.
2. **Typed admin APIs** — never a universal DB editor (`/api/admin/db/**` → 403).
3. **Sensitive step-up** — reason ≥ 12 + `CONFIRM_ACTION` + audit.
4. **No fake metrics** — empty states when samples missing.
5. **Non-destructive merge** — secondary archived, not hard-deleted.
6. **Payment SUCCEEDED** only via provider reconciliation.

## Related docs (282 set)

See index in `docs/ADMIN_OPS_FINAL_REPORT.md` § Documentation.
