# User Administration

Privacy-first user ops. Permissions: `users.read` / `.suspend` / `.delete` / `.impersonate` / `.financial_passport.read`.

## Surfaces

| Route | Purpose |
| --- | --- |
| `/admin/uzivatele` | Dense table — URL filters/sort/page, bulk, CSV export |
| `/admin/uzivatele/[id]` | Detail + suspend / deletion / passport / impersonation |

## Account statuses

`ACTIVE` · `SUSPENDED` · `DELETION_REQUESTED`

Suspend / deletion require reason; cannot suspend self.

## Financial Passport

**Masked by default.** Reveal requires sensitive permission + step-up + audit. Never render raw passport on list cards.

## Impersonation

- Cookie session + banner
- **Payment actions blocked** while impersonating (`assertNotImpersonating`)
- Cannot impersonate admin-zone staff
- Reason ≥ 12

## Bulk & CSV

- Bulk suspend: dry-run preview + reason + `CONFIRM_ACTION`
- CSV export: formula-injection sanitization (`=`, `+`, `-`, `@` prefixed)

## Manual entitlements

Panel on users page — see `docs/COMMERCE_OPERATIONS.md` (ADMIN / SUPER_ADMIN function gate).
