# Domain: finance (primitives)

Prompt 11A Phase 1 — foundational financial types used by later calculation engines.

## Scope (this phase)

| Module | Role |
| --- | --- |
| `currency.ts` | ISO 4217 codes + minor-unit scale |
| `money.ts` | Safe `Money` wrapper over `decimal.js` |
| `percentage.ts` | Ratio-based `Percentage` (5.4 % → 0.054) |
| `rates.ts` | Distinct rate kinds: nominal interest, APR, appreciation |
| `rounding.ts` | Central internal vs display rounding policy |

**Out of scope here:** Prisma models, API, UI, scenarios, assumptions, calculation outputs.

## Stack decision

- **Next.js / TypeScript / Prisma** stack (see `docs/TECH_STACK.md`).
- Domain uses **`decimal.js`** directly (not `number` floats, not coupling domain imports to `@prisma/client` runtime).
- Prisma `Decimal` remains fine for DB columns in later phases; convert at the repository boundary via `Money` / `Percentage` factories.

## Null vs zero

- **Missing** value → `null` (or omit), never invent `0`.
- **Zero** amount → `Money.zero(currency)` / `Percentage.zero()`.
- Helpers: `isMissingMoney`, `isZeroMoney`.

## Rounding

See `rounding.ts`: high-precision **internal** math vs **display** (currency minor units / percent points).
