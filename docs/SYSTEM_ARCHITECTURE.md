# System Architecture — Majetio.cz

## Style

**Modular monolith** in a Next.js application.

- One deployable unit
- Domains isolated by folder and dependency rules
- Ready to extract services later if needed

## High-level diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                    │
│  pages (UI) · Server Actions · Route Handlers · Middleware │
└───────────────┬───────────────────────────┬─────────────┘
                │                           │
        ┌───────▼────────┐          ┌───────▼──────────┐
        │ Domain modules │          │  Integrations    │
        │ (business)     │──────────│  HypotekaJasne   │
        └───────┬────────┘          │  (mock → HTTP)   │
                │                   └──────────────────┘
        ┌───────▼────────┐
        │ Prisma + Postgres│
        └────────────────┘
```

## Domain modules (`src/domains/*`)

Each domain may contain:

| Folder / file | Responsibility |
| --- | --- |
| `model` / Prisma mapping notes | Entities |
| `schemas` | Zod validation |
| `service` | Business logic (pure where possible) |
| `server` | Server Actions / data access |
| `components` | Domain UI |
| `tests` | Unit tests |

**International (Prompt 17.1):** `src/domains/markets/` — `MarketRegistry` + per-market `MarketPlugin` (CZ home LIVE; SK/ES/IT/HR/AE/SA/ID planned/research). See `docs/INTERNATIONAL_ARCHITECTURE.md`. Bali is a **region under ID**, not a separate market.

### Domains

`users`, `authentication`, `financial-profile`, `properties`, `property-sources`, `property-analysis`, `valuation`, `investment-calculations`, `financing`, `renovation`, `locations`, `comparisons`, `favourites`, `saved-searches`, `leads`, `orders`, `payments`, `crm`, `notifications`, `content`, `administration`, `analytics`, `integrations`

## Cross-cutting

| Concern | Location |
| --- | --- |
| DB client | `src/lib/db` |
| Auth helpers / RBAC | `src/lib/auth` |
| Pricing & product config | `src/config` |
| UI primitives | `src/components/ui` |
| Layout shell | `src/components/layout` |
| Design tokens | `src/app/globals.css` |

## Authorization

- Roles stored on `User.role`
- Checks run on the **server** (`requireRole`, `requireUser`)
- UI may hide controls, but never as the only gate

## Financial calculations

Live in `domains/investment-calculations` (and related) as pure functions + services. React only renders results. Every calculation path must have Vitest coverage before production use.

## Data flow (paid analysis — future)

1. User selects property / inputs
2. Domain creates `PropertyAnalysis` + scenarios
3. `Order` created from `AppConfiguration` price
4. `Payment` provider webhook confirms
5. Role/entitlement upgrades to `PAID_CLIENT` for that analysis
6. Optional financing lead → HypotekaJasne adapter (with `Consent`)
