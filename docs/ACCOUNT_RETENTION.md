# ACCOUNT_RETENTION — Smazání účtu, favourites, notes, comparisons

## Po smazání účtu (`deleteAccount`)

Hard delete `User` (po ověření hesla + potvrzení e-mailu). Cascade v Prisma:

| Entita | Chování |
| --- | --- |
| `Favourite` | Cascade delete |
| `Comparison` (+ properties, snapshots, shares) | Cascade delete |
| `ComparisonShare` / invites | Cascade (creator + comparison) |
| `PropertyUserNote` | Cascade delete |
| `PropertyDecisionTask` | Cascade delete |
| `SavedSearch` / matches | Cascade delete |
| `PropertyAlert` | Cascade delete |
| Audit log | Zůstává s `emailHash` (anonymizace identifikátoru) |

**Neanonymizujeme** řádky favourites/notes/comparisons — mažeme je s účtem (není co ponechat bez vlastníka).

## Rate limiting (abuse protection)

`src/lib/security/workspace-rate-limit.ts` + favourites rate-limit:

| Doména | Limit / min | Mutace |
| --- | --- | --- |
| favourite | 40 | save, remove, note, status, meta |
| comparison | 30 | create, delete |
| note | 40 | save, delete |
| share | 15 | create, revoke |

## Sdílení porovnání

Viz `docs/PROPERTY_COMPARISON.md` — secret link, share-safe payload, revokace.

Code: `src/lib/account/settings-actions.ts` → `deleteAccount`.
