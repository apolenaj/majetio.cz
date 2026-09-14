# CLEARPROPERTYPATH_INTEGRATION_BOUNDARY

Architectural boundary between **Majetio** (analytics / discovery) and **ClearPropertyPath.com** (future purchase-process product).

**Related:** [`REGULATORY_CONFIGURATION.md`](./REGULATORY_CONFIGURATION.md) · [`PRODUCT_VISION.md`](./PRODUCT_VISION.md)

## Product split (Rules 231–232)

| | Majetio | ClearPropertyPath |
| --- | --- | --- |
| Hosts | majetio.cz / majetio.com | clearpropertypath.com |
| Job | Discovery, analytics, decision workspace, risk facts, DD checklists | Guided purchase / closing workflow (future) |
| Financing lead (CZ) | Explicit consent → **HypotekaJasne** | Out of scope unless separate CPP partner |

## Hard rules

1. **No shared database** — no Prisma relation / FK from Majetio tables to CPP tables (or vice versa).
2. **No shared user foreign keys** across products.
3. Integration channels only: **HTTPS API**, **deep links**, **webhooks**.
4. Identity handoff = **signed token / opaque correlation id** — never require CPP to store Majetio `Property.id` as a foreign key.

## Code

`src/domains/integrations/clearpropertypath/boundary.ts`

```ts
MAJETIO_CPP_INTEGRATION_POLICY.sharedDatabase === false
buildClearPropertyPathDeepLink({ correlationId, marketCode, listingPublicRef })
assertNoSharedDbWithClearPropertyPath({ proposesSharedDbRelation: true }) // throws
```

## What Majetio must not do

- Embed CPP purchase escrow state in Majetio DB
- Treat CPP as “just another Prisma model”
- Auto-forward leads to CPP without a separate, named consent recipient (when that product exists)

## What CPP must not do

- Read Majetio Postgres directly
- Reuse HypotekaJasne consent as blanket “partner” consent
