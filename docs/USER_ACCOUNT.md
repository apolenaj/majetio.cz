# User Account — Majetio.cz

## Shell

- Layout: `src/app/(account)/layout.tsx`
- Desktop: `AccountSidebar` from `ACCOUNT_NAV`
- Mobile: `MobileBottomNavigation`

## Routes

| Route | Status |
| --- | --- |
| `/ucet` | Dashboard (passport status, favourites/analyses/comparisons empty states) |
| `/ucet/oblibene` | Oblíbené + shortlist (Decision Workspace) — cena, změna, status, akce |
| `/ucet/financni-profil` | Finanční pas editor + HypotekaJasne handoff card |
| `/ucet/souhlasy` | Consents + handoff history |
| `/ucet/nastaveni` | Profile, password, e-mail change, export, delete |
| `/ucet/upozorneni` | Transactional vs marketing prefs + inbox |
| Other `/ucet/*` | Honest stubs / preparing pages |

## Settings security

- Password change: current password required + rate limit
- E-mail change: password + pending e-mail + verification link (`/overeni-emailu`)
- Delete: consequences list, typed e-mail, password, no dark patterns
- Export: JSON/CSV of own profile; audited as `account.export`

## Seed test user

```bash
npm run db:seed:test-user
```

Creates `test.user@majetio.local` / `TestUser1!` with synthetic Czech data (marketing OFF).
