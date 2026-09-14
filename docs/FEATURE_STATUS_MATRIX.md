# Feature Status Matrix — Majetio.cz

**Owner:** Product / Tech Lead  
**Last verified against code:** 2026-07-22 (Phase 5)  
**Status values:** `LIVE` · `BETA` · `DISABLED` · `PLANNED`  
**Prod enabled:** whether production config/defaults expose the feature to users today  
**SoT flags:** `src/config/feature-flags.ts` · DB FeatureFlags/kill switches · market plugins

---

## How to read

- **LIVE** = shipped and intended for CZ production traffic (may still be NO-GO for company launch due to infra).  
- **DISABLED** = code present but default/env OFF or fail-closed.  
- **PLANNED** = scaffold / registry only, not public.  
- **BETA** = public-capable market/product with limited readiness (none currently for markets except CZ LIVE).

---

## Markets

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| CZ home market (Majetio.cz) | LIVE | Yes | Markets |
| SK / AE / ID markets | PLANNED | No (`RESEARCH`) | Markets |
| ES / IT / HR / SA markets | PLANNED | No | Markets |
| International.com shell | BETA | Partial (SEO hosts; not full product) | SEO / Markets |

---

## Discovery & property

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| Property search / filters | LIVE | Yes (CZ data dependent) | Properties |
| Property detail + media | LIVE | Yes | Properties |
| Favourites / shortlist / compare | LIVE | Yes | Decision |
| Decision Workspace | LIVE | Yes | Decision |
| Demo property inventory | DISABLED | No (`ALLOW_DEMO_PROPERTY_CONTENT` unset) | Properties |
| Listing boost / sponsored | LIVE | Yes if `LISTING_BOOST_ENABLED` (default true) | Commerce |
| Import pipeline / SystemJob workers | BETA | Partial — queue exists; cron/workers incomplete | Data |

---

## Financial engines

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| Valuation (comps engine) | LIVE | Yes | Valuation |
| Investment yield / IRR engine | LIVE | Yes | Investment |
| Property financing calculator | LIVE | Yes | Financing |
| Max offer / renovation offer | LIVE | Yes | Renovation |
| Legacy `investment-calculations` package | DISABLED | No (dead path) | Investment |

---

## Commerce & payments

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| Pricing page `/cenik` | LIVE | Yes | Commerce |
| Checkout order creation | LIVE | **Blocked for paid** if `PAYMENTS_PROVIDER=none` | Commerce |
| Live PSP (Stripe/etc.) | PLANNED | No — only `none`/`mock` in code | Commerce |
| Mock PSP | DISABLED | No in prod (fail-closed) | Commerce |
| Buyer Pass / Deep Analysis products | LIVE | Catalog yes; paid grant needs PSP | Commerce |
| Promotions / promo codes | LIVE | Yes (server-validated) | Commerce |
| `kill.payments` | LIVE | Ops toggle (default off) | Platform |
| Transaction success fee / Purchase Concierge | DISABLED | No (`TRANSACTION_SUCCESS_FEE_ENABLED=false`) | Legal / Commerce |
| Partner marketplace | DISABLED | No | Commerce |
| Automated invoices | DISABLED | No (`AUTOMATED_INVOICE_ENABLED=false`) | Legal |
| Consumer withdrawal UX | DISABLED | No (`CONSUMER_WITHDRAWAL_ENABLED=false`) | Legal |
| B2B agent / agency / developer plans | LIVE | Yes (flag defaults true) | Commerce |
| Investor Pro | LIVE | Yes | Commerce |
| Expert review / Investment audit products | LIVE | Yes (flags default true) | Commerce |

---

## Financing / leads

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| Mortgage calculator UI | LIVE | Yes | Financing |
| HypotekaJasne live API | DISABLED | No — default **dev adapter** | Integrations |
| Mortgage lead + consent | LIVE | Yes (consent-gated; partner may be mock) | Financing / Privacy |
| Mortgage rate ingest cron | BETA | Script exists; schedule partial | Financing |

---

## Auth, account, admin

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| Registration / login (credentials) | LIVE | Yes | Auth |
| Password reset / email change | LIVE | Links yes; **email send ABSENT** | Auth |
| Account privacy / export | LIVE | Yes | Privacy |
| Admin zone + RBAC | LIVE | Yes | Administration |
| DQ issue resolution | LIVE | Yes (admin) | Data |
| Property merge | LIVE | Yes (admin) | Data |
| Platform FeatureFlags UI | LIVE | Yes | Platform |
| Maintenance mode | LIVE | Ops env (`MAINTENANCE_MODE`) | SRE |
| Super-admin public registration | DISABLED | No — CLI bootstrap only | Security |

---

## Observability & analytics

| Feature | Status | Prod enabled | Owner |
| --- | --- | --- | --- |
| First-party `track()` taxonomy | LIVE | Events fire; **prod provider noop** | Analytics |
| External analytics (GA/PostHog) | PLANNED | No | Analytics |
| Error tracker webhook | BETA | Only if `ERROR_TRACKER_WEBHOOK_URL` set | SRE |
| `/api/health` + `/api/ready` | LIVE | Yes | SRE |
| Alert rules catalogue | LIVE | Defined; pager wiring optional | SRE |
| AI / LLM features | PLANNED | No — **ABSENT** in runtime | — |

---

## Launch implication

Many product surfaces are **LIVE in code**, but company-level production launch remains **NO-GO** while payments, email, cron coverage, and CI lint/tsc fail (`docs/LAUNCH_CHECKLIST.md`).
