# Domain: properties

Modular domain boundary for Majetio.

Expected structure (grow as features land):

- `schemas/` — Zod validation (`search.ts` for discovery input)
- `service/` — business logic (pure where possible)
  - `search/` — Prompt 8 discovery (`PropertySearchService`, filters, whitelist sorts)
  - `dto.ts` — public DTOs (strip precise address / notes / audit)
  - `pagination.ts` — page + cursor pagination, sort whitelist
  - `search-provider.ts` — legacy query builder (Prompt 7)
  - `property-service.ts` — public read API over injectable repository
  - dedupe / quality / merge / overrides (Prompt 7)
- `server/` — Server Actions / data access
- `components/` — domain UI
- `tests/` — co-located `*.test.ts`

Do not put financial calculations in React components.
