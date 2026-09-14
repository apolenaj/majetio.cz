# Property Operations

Admin property list, overrides, publish validation, moderation. Permissions: `property.read` / `.override` / `.moderate` / `.merge`.

## Surfaces

| Route | Purpose |
| --- | --- |
| `/admin/nemovitosti` | List / filters |
| `/admin/nemovitosti/[id]` | Detail + override |
| `/admin/nemovitosti/moderace` | PENDING_REVIEW queue |
| `/admin/nemovitosti/duplikaty` | Duplicate Review Center |

## Field overrides

`upsertPropertyFieldOverride` — locked fields survive imports. **Always audited** (`writeAuditLog`). Reason required.

## Publish validation

`validatePropertyForPublish` — title, type, market, price, area, city; blocks approve when open CRITICAL DQ issues exist.

## Moderation decisions

| Decision | Next status | Reason required |
| --- | --- | --- |
| APPROVE | ACTIVE | no |
| REJECT | REJECTED | yes (≥8) |
| REQUEST_CHANGES | DRAFT | yes |
| SUSPEND | SUSPENDED | yes |

User-facing messages strip internal tokens (`partner`, `sql`, `feed`, …).  
History: `PropertyStatusHistory` + audit `admin.property.moderate.*`.

## Freshness

Stale listings surface in Operations Attention Queue (`stale_property`) — no silent auto-delete of favourites/history.
