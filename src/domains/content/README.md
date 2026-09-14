# Domain: content

Modular domain boundary for Majetio.

Expected structure (grow as features land):

- `schemas/` — Zod validation
- `service/` — business logic (pure where possible)
- `server/` — Server Actions / data access
- `components/` — domain UI
- `tests/` — unit tests

Do not put financial calculations in React components.
