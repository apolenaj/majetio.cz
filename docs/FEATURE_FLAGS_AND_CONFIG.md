# Feature Flags & Config Center

Platform flags, kill switches, and secret status. Prompt 6 + sensitive `platform.flags.write`.

**Product-level LIVE/DISABLED matrix (incl. env feature flags):** `docs/FEATURE_STATUS_MATRIX.md`  
**Dependency wiring reality:** `docs/EXTERNAL_DEPENDENCY_REGISTER.md`

## Feature flags

Prisma `FeatureFlag` + append-only-ish `FeatureFlagChange` (old/new/reason/actor).

Scopes: `GLOBAL` | `MARKET` | `USER_PERCENTAGE`

Kill switches (`isKillSwitch`):

| Key | Effect |
| --- | --- |
| `kill.payments` | Halt new payment captures |
| `kill.new_listings` | Block new listing publish paths |
| `kill.valuations` | Pause valuation publishes |
| `kill.markets` | Market-level emergency pause signal |

Mutations require reason ≥ 8 + audit (`admin.kill_switch.change` / `admin.feature_flag.change`).

## Config Center

Secrets are shown as **configured / not configured only** — never values.  
UI: `/admin/nastaveni`

## CMS workflow

DRAFT → REVIEW → PUBLISHED (`platform.content.*`; publish is sensitive).

## Related

`docs/PLATFORM_CONFIGURATION.md` — broader platform config notes.
