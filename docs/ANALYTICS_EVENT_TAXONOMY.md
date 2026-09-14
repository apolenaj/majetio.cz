# Analytics Event Taxonomy — Majetio.cz

**Prompt:** 20.8 — Analytics Architecture & Metrics definition  
**Owner:** Data Architecture  
**Canonical code:** `src/lib/analytics/events.ts` · `consent-gate.ts` · `scrub-pii.ts` · `provider.ts` · `decision-metrics.ts`  
**Related:** `docs/HOMEPAGE_ANALYTICS.md` · `docs/ACCOUNT_ANALYTICS.md` · `docs/REVENUE_LEDGER.md`

---

## 1. Naming convention

| Layer | Convention | Example |
| --- | --- | --- |
| **Event name** | `snake_case` · **`noun_action`** (object + past/participle verb) | `property_detail_viewed`, `checkout_started`, `filter_applied` |
| **Props** | `snake_case` only (new events); legacy camelCase (`hasQuery`, `isDemo`, `questionId`) is **deprecated** — do not extend |
| **Forbidden** | Verb-first (`viewed_property`), camelCase event names, spaces |

**Allowed action suffixes:** `_viewed`, `_started`, `_completed`, `_clicked`, `_opened`, `_submitted`, `_applied`, `_changed`, `_saved`, `_created`, `_shared`, `_failed`, `_requested`, `_given`, `_revoked`, `_updated`, `_shown`.

**Aliases (report as one funnel step):**

| Canonical funnel step | Preferred event | Alias / related |
| --- | --- | --- |
| Save | `property_saved` | `property_favorited` (same moment) |
| Analysis | `investment_analysis_viewed` / `valuation_viewed` | `analysis_started`, `decision_funnel_step.analysis` |

---

## 2. Event envelope (every send)

`track()` enriches payloads before the provider. Call sites only pass typed `AnalyticsEvent`.

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `ts` | ISO-8601 | clock | Event time |
| `source` | `client` \| `server` | runtime | Client = browser; server = RSC/actions/webhooks |
| `market` | string \| null | market pref cookie / header | e.g. `CZ` — not inferred from IP alone in analytics |
| `locale` | string \| null | locale pref cookie | e.g. `cs-CZ` |
| `anon_id` | string \| null | `majetio_consent_vid` when present | Opaque visitor id — **never** email/user id |

**Never in envelope or props:** email, phone, name, address, password, token, raw CZK amounts, note bodies, rodné číslo.

---

## 3. Consent & PII rules

| Category | Client | Server |
| --- | --- | --- |
| **Ledger** (auth, consent grant/revoke, account export/delete, password flows) | Always allowed | Always allowed |
| **Product / behavioral** | Requires `analytics` cookie | Allowed as first-party (except pure page-view names blocked on server) |
| **Marketing CTAs** (`hypotekajasne_cta_clicked`, `pricing_cta_clicked`) | Requires `analytics` **and** `marketing` | N/A (client) |

Scrubber: `scrubPii` + `assertAnalyticsSafe` strip/forbid PII keys before send.

---

## 4. Client vs server sources

| Source | Use for | Examples |
| --- | --- | --- |
| **Client** | UX, page views, filters, calculator mounts | `homepage_viewed`, `property_detail_viewed`, `filter_applied` |
| **Server** | Auth outcomes, ownership mutations, **revenue-adjacent commerce** | `signup_completed`, `property_saved`, `checkout_started`, `checkout_completed` |

### Revenue rule (hard)

| Signal | System of record | Analytics `track` |
| --- | --- | --- |
| Money recognized | **`RevenueEvent` ledger** (`recognizeCommerceRevenueForPaidOrder`) | Optional `checkout_completed` with `{ product_key, billing_kind }` **only** — no amounts |
| GMV / MRR | `domains/revenue/metrics.ts` | Never from client |
| Fake success | Client redirect alone | **Forbidden** — must not emit paid completion |

Client must never emit payment success / amounts.

---

## 5. Duplicate prevention

| Mechanism | Where |
| --- | --- |
| `trackOnce(key, event)` | SessionStorage (client) / process Set (server) — page views, analysis mount |
| IntersectionObserver + ref | Homepage sample analysis, location sections |
| Ledger idempotency | Payment webhook / revenue recognition (not analytics) |
| Filter spam | Prefer debounce at UI; taxonomy does not auto-debounce `filter_applied` |

---

## 6. B2C funnel

**Path:** Landing → Search → View → Save → Analysis → Pricing → Checkout

| Step | Event(s) | Source | Status |
| --- | --- | --- | --- |
| Landing | `homepage_viewed` | client | Live |
| Search | `search_query_submitted`, `filter_applied`, `sort_changed` | client | Live (`property_search_started` = dead alias) |
| View | `property_detail_viewed` + `decision_funnel_step.viewed` | client | Live |
| Save | `property_saved` / `property_favorited` + funnel `saved` | server | Live |
| Analysis | `investment_analysis_viewed`, `valuation_viewed`, `analysis_started`, funnel `analysis` | client | Live |
| Pricing | `pricing_viewed`, `pricing_cta_clicked` | client | Live |
| Checkout | `checkout_started` (order create) → `checkout_completed` (server after paid recognition / free grant) | **server** | Live |

Supporting: `quick_analysis_submitted`, `recommendation_sort_viewed`, comparison / alert events.

---

## 7. B2B funnel

**Path:** Signup → Org → Publish → Lead

| Step | Event | Source | Props (safe) | Status |
| --- | --- | --- | --- | --- |
| Signup | `signup_completed` (shared) / broker onboarding completes org | server | `consents` only | Live (consumer); broker uses org step |
| Org | `organization_created` | server | `org_type`, `market_code` | Live |
| Publish | `listing_published` | server | `market_code` (no address) | Live (moderation APPROVE → ACTIVE) |
| Lead | `lead_inquiry_created` | server | `has_message`, `authenticated_buyer` | Live |

Listing **aggregates** (`ListingAnalyticsDaily` impressions/saves/inquiries) remain separate from product `track()` — see CRM / listing-analytics docs.

---

## 8. KPI & metrics

### North Star Metric

**Decision-Ready Property Analyses (DRPA)**  
Count of analyses where a signed-in (or returning) user reaches a **decision-ready** state on a property:

> `investment_analysis_viewed` **OR** `valuation_viewed`  
> **AND** (`property_saved` **OR** `comparison_created` / `property_compared`)  
> within a rolling **7-day** window on the same property slug/id.

**Why:** Majetio’s product job is not traffic or vanity saves — it is helping users leave with a **decision-ready** view of a property. DRPA ties discovery + analysis + commitment without optimizing for checkout alone.

**Not North Star:** raw page views, signup count, GMV (commerce health — secondary).

### Activation metric

A user is **activated** when **either**:

1. **Analyzed:** fires `investment_analysis_viewed` or `valuation_viewed` (or `analysis_started` / funnel `analysis`), **or**
2. **Engaged shortlist:** `property_saved` **and** (`property_compared` / `comparison_created`) within 7 days of first `property_detail_viewed`.

Report activation as **% of new signups** reaching activation within **D7**.

### Supporting KPIs

| KPI | Definition |
| --- | --- |
| Search→View rate | `property_detail_viewed` / sessions with search/filter |
| View→Save rate | saves / views (`decision-metrics` saveRate) |
| Save→Compare rate | comparisons / saves |
| Pricing→Checkout start | `checkout_started` / `pricing_viewed` |
| Checkout completion | `checkout_completed` / `checkout_started` (amounts from **ledger**) |
| B2B publish→lead | `lead_inquiry_created` / `listing_published` (org-scoped) |

---

## 9. Event inventory (summary)

### Live (representative)

Homepage · auth/account · discovery · decision workspace · property detail · valuation · investment · location · monetization (`pricing_*`, `checkout_*`) · B2B (`organization_created`, `listing_published`, `lead_inquiry_created`) · admin dashboards.

### Defined but historically dead (prefer wire or delete in later cleanup)

`property_search_started`, `property_card_opened`, `comparison_opened`, `guide_article_opened`, `similar_property_clicked`, `investment_assumption_changed`, `subscription_renew_consent_shown` — keep out of funnel dashboards until live.

### Parallel systems (not product `track`)

| System | Purpose |
| --- | --- |
| `RevenueEvent` | Money truth |
| `DecisionMetricKey` counters | In-process funnel aggregates |
| `ListingAnalyticsDaily` | B2B listing impressions/saves/inquiries |

---

## 10. Provider

Default production: **noop**. Dev / `ANALYTICS_PROVIDER=console`: console debug.  
Swap warehouse/vendor in `provider.ts` without changing call sites. CSP allowlist required before third-party scripts.

---

## 11. Change log

| Date | Change |
| --- | --- |
| 2026-07-22 | Prompt 20.8 — taxonomy created; funnels, NS/activation, server revenue rule, envelope, consent client-default |
