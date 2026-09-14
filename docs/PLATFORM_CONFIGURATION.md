# Platform Configuration Center (Prompt 6)

## Feature flags

Prisma `FeatureFlag` — scopes `GLOBAL` | `MARKET` | `USER_PERCENTAGE`.

Kill switches (seeded, `isKillSwitch=true`):

- `kill.payments`
- `kill.new_listings`
- `kill.valuations`
- `kill.markets`

Every change writes `FeatureFlagChange` + `AuditLog` (`old` / `new` / `reason` / `actor`).

Admin: `/admin/nastaveni` (`platform.flags.read` / `.write`).

## Configuration

`AppConfiguration` for business limits. Secret env keys are shown only as **configured / not configured** — never values.

## Content

`CmsContent` workflow: `DRAFT` → `REVIEW` → `PUBLISHED` with Preview (`?preview=`).

Regulatory content requires `sourceLabel` + optional `reviewRequiredAt` (stale → attention queue).

Translations: `MACHINE_DRAFT` → `REVIEWED` → `APPROVED`.

Admin: `/admin/obsah`.

## Markets & incidents

- `/admin/trhy` — readiness, Go LIVE (step-up + readiness gate), emergency PAUSED, per-market kill switches
- `/admin/incidenty` — `DATA` | `SECURITY` | `PAYMENTS` | `AVAILABILITY`
