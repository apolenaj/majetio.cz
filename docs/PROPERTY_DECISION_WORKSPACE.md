# Property Decision Workspace — Favourites & Shortlist (Phase 1)

## Statuses (BOD 83)

| Enum | UI |
|------|-----|
| `CONSIDERING` | Zvažuji |
| `VIEWING` | Prohlídka |
| `FAVORITE` | Favorit |
| `REJECTED` | Vyřazeno |

Legacy (`SAVED`, `SHORTLISTED`, …) se mapují přes `normalizeFavouriteStatus`.

## Rejection reasons (BOD 84, 87)

Optional `FavouriteRejectionReason` — never forced modal.

## Recommendation exclusion (BOD 85–89)

`listRejectedPropertyIdsForUser` + `excludeRejectedFromRecommendations` — REJECTED IDs must not reappear in recommended sort.

## Folders (BOD 114–115)

Free-text `folder` (e.g. Investice, Vlastní bydlení) — no hard limits beyond sanitized length.

## Security

- IDOR: mutations scoped `userId` from session + ownership `findFirst`
- XSS: `sanitizeFavouriteNote` strips HTML
- Rate limit: `assertFavouriteMutationAllowed` on save/note/status/meta
- Account delete: Favourite `onDelete: Cascade` (BOD 129)
- Property hard-delete: `onDelete: Restrict` (keeps private rows)

## Lifecycle (BOD 120–122)

- `UNAVAILABLE` / withdrawn → badge „Nabídka již není aktivní“ — row kept
- `SOLD` → badge + optional `archivedAt` (archive or keep for compare)

## Comparison concurrency (BOD 152)

`Comparison.version` + `updateComparisonOptimistic` — no compare UI in this phase.

## Indexes

- `Favourite`: `@@unique([userId, propertyId])`
- `ComparisonProperty`: `@@unique([comparisonId, propertyId])`

## Route

`/ucet/oblibene` — CRUD shortlist (no comparison UI in phase 1).
