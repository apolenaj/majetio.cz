# Architecture Decision Records — Majetio.cz

## ADR-001: Modular monolith on Next.js

- **Status:** Accepted
- **Context:** Greenfield product; small team; need speed and cohesion.
- **Decision:** Single Next.js app with domain folders; deploy on Vercel.
- **Consequences:** Simple ops; clear extraction boundaries later.

## ADR-002: PostgreSQL + Prisma 6

- **Status:** Accepted
- **Context:** Strong relational needs (users, orders, analyses, audit). Prisma 7 changes datasource/config; keep a stable baseline for Phase 1.
- **Decision:** Prisma ORM **v6** with PostgreSQL + initial SQL migration under `prisma/migrations`.
- **Consequences:** Typed schema, migrations; avoid Mongo-style document sprawl for financial entities.

## ADR-003: Auth.js (next-auth v5)

- **Status:** Accepted
- **Context:** Need production auth with sessions and Prisma adapter.
- **Decision:** Auth.js with credentials/OAuth-ready config.
- **Consequences:** Standard session model; role stored on User.

## ADR-004: Central commercial configuration

- **Status:** Accepted
- **Context:** Prices and commissions must not be hardcoded across UI.
- **Decision:** `src/config/commerce.ts` defaults + `AppConfiguration` table for runtime overrides.
- **Consequences:** Single source of truth; admin can change without redeploy (Phase 4 UI).

## ADR-005: HypotekaJasne behind interface + mock

- **Status:** Accepted
- **Context:** Must design for integration without calling production API yet.
- **Decision:** `HypotekaJasneClient` interface + `MockHypotekaJasneClient`.
- **Consequences:** Domains depend on contract; swap HTTP adapter later.

## ADR-006: Calculations outside React

- **Status:** Accepted
- **Context:** Financial logic must be testable and trustworthy.
- **Decision:** Pure functions/services in domain modules; Vitest required.
- **Consequences:** Slightly more files; higher confidence.

## ADR-007: Lightweight UI primitives instead of full shadcn install

- **Status:** Accepted
- **Context:** Need shadcn-quality patterns without generating many unused components.
- **Decision:** `cn` + `cva` + hand-rolled Button/Input primitives; expand as needed.
- **Consequences:** Smaller surface; can adopt more shadcn pieces later.

## ADR-008: Czech primary locale in UI copy

- **Status:** Accepted
- **Context:** Product is Majetio.cz for Czech market.
- **Decision:** Czech UI strings in Phase 1; `preferredLocale` on profile for future i18n.
- **Consequences:** Docs may stay bilingual (CZ product / EN engineering) for clarity.

## ADR-009: Brand identity — Layered Asset + Sage/Guide

- **Status:** Accepted
- **Context:** Prompt 2 brand system required for product trust and UI consistency.
- **Decision:** Concept C logo, claim „Než koupíte, mějte jasno.“, Source Serif 4 + DM Sans, Lucide-only icons. Details in `docs/BRAND_GUIDE.md` and `docs/BRAND_DECISIONS.md`.
- **Consequences:** Shared `Logo` / `BrandSymbol` components; concept SVGs stay out of production UI.

## ADR-010: Design system + Recharts + Radix primitives

- **Status:** Accepted
- **Context:** Prompt 3 requires a production UI library for data-heavy proptech.
- **Decision:** Semantic CSS tokens; component folders under `src/components/*`; forms/metrics/tables native+Radix; charts via Recharts; `/dev/design-system` gated in production.
- **Consequences:** Faster feature UI in Prompt 4+; chart bundle only on client chart pages.
