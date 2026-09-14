# Domain: favourites

Property Decision Workspace — uložené nemovitosti a shortlist („Ve výběru“).

## Layout

| Path | Role |
|------|------|
| `status.ts` | `FavouriteStatus` + české UI labely |
| `guest-storage.ts` | Bezpečné localStorage pro hosty |
| `service/favourite-service.ts` | Prisma CRUD, shortlist, merge |
| `server/actions.ts` | Server Actions |
| `client/save.ts` | Optimistic toggle + rollback |

## Pravidla

- UI nikdy nezobrazuje raw enum (`SAVED` → „Uloženo“, `SHORTLISTED` → „Ve výběru“, `REJECTED` → „Vyřazeno“).
- Shortlist je logicky oddělený od běžného „Uloženo“.
- Guest data neobsahují PII kromě veřejných metadat inzerátu.
- Selhání uložení → rollback + hláška „Nemovitost se nepodařilo uložit.“
