# Account Analytics — Majetio.cz

Typed events in `src/lib/analytics/events.ts`. Adapter: `track()` (+ `assertAnalyticsSafe`).

## Account events (examples)

| Event | Allowed props |
| --- | --- |
| `signup_completed` | `consents: "terms_privacy"` |
| `login_succeeded` / `login_failed` | reason enum only |
| `onboarding_*` | step / goal id / booleans |
| `financial_profile_updated` | completion level + **percent bucket** (not raw %) |
| `consent_given` / `consent_revoked` | type + source |
| `partner_handoff_*` | partner id, field_count, is_mock |
| `account_export_requested` | format json/csv |

## Forbidden in analytics

E-mails, passwords, phones, tokens, raw CZK amounts, birth numbers.

Runtime guard rejects e-mail-like strings and forbidden prop key prefixes.
