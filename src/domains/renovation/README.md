# Domain: renovation

Renovation Engine for Majetio (Prompt 12 / Prompt 1 of 5 — architecture scaffold).

## Four concepts (must not mix)

| Code | Concept | Folder | Responsibility |
|------|---------|--------|----------------|
| **A** | Současný stav | `condition/` | Physical / technical condition of the property *before* works |
| **B** | Rozsah rekonstrukce | `scope/` | What will be done (rooms, systems, finish level) — not prices |
| **C** | Náklady | `costs/` | CapEx estimate from scope + location cost tables |
| **D** | Hodnota po rekonstrukci | `arv/` | After-repair value — never derived from cost alone |

Supporting: `timeline/`, `contingency/`, `offer/` (max bid — later), `validation/`, `engine/` (orchestration).

## Layout

```
src/domains/renovation/
  types.ts              ← RenovationAnalysis entity + shared enums
  schemas/              ← Zod (stubs)
  engine/               ← pure orchestration façade (empty)
  condition/            ← A
  scope/                ← B
  costs/                ← C
  arv/                  ← D
  timeline/
  contingency/
  offer/
  validation/
  service/              ← persistence / RenovationAnalysis CRUD stubs
```

## Persistence

- **`RenovationAnalysis`** — primary entity (Prompt 1). Version stamps: `scopeVersion`, `costModelVersion`, `locationCostVersion`.
- **`RenovationEstimate`** — legacy CapEx row; keep until migration of old analyses. New work uses `RenovationAnalysis`.

## Rules

- No renovation math in React components.
- Cost ≠ ARV ≠ scope ≠ condition — separate services and types.
- Missing inputs → unavailable / partial — never invent guaranteed margins.
- Money on wire later via `@/domains/finance` minor-unit DTOs; Prisma stores CZK major `Int` for estimate bands in this scaffold.

## Out of scope (later prompts)

- CapEx line-item engine, ARV comps, contingency algorithms, max offer price, UI.
