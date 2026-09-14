# Analytics Funnels — Majetio.cz

**Owner:** Data / Product  
**Last verified against code:** 2026-07-22 (Phase 5)  
**Canonical events:** `src/lib/analytics/events.ts`  
**Taxonomy:** `docs/ANALYTICS_EVENT_TAXONOMY.md`  
**Provider:** `src/lib/analytics/provider.ts` — **prod default = noop** (console in dev / `ANALYTICS_PROVIDER=console`)

---

## 1. Rules (non-negotiable)

- No email, phone, notes, or **money amounts** in analytics props.  
- Client payment “success” alone must **not** emit paid completion.  
- Revenue SoT = `RevenueEvent` ledger, not `track()`.  
- Client product events require analytics cookie consent; marketing CTAs need analytics **and** marketing.

---

## 2. B2C discovery → decision

| Step | Preferred event(s) | Notes |
| --- | --- | --- |
| Land | `homepage_viewed` | `trackOnce` |
| Search | `filter_applied`, search views | Client |
| Detail | `property_detail_viewed` | |
| Save | `property_saved` / `property_favorited` | Server ownership preferred |
| Shortlist | `decision_funnel_step` (`shortlisted`) | Decision Workspace |
| Compare | `decision_funnel_step` (`compared`) | |
| Analysis | `investment_analysis_viewed` / `valuation_viewed` | |

Code regression: `prompt-20-8-analytics-regression.test.ts`, `decision-metrics.ts`.

---

## 3. B2C monetization

| Step | Event | Props (allowed) |
| --- | --- | --- |
| View pricing | `pricing_viewed` | none / segment keys only |
| CTA | `pricing_cta_clicked` | needs marketing+analytics consent |
| Start checkout | `checkout_started` | `product_key`, `has_promo` |
| Complete paid | `checkout_completed` | `product_key`, `billing_kind` — **server only after grant path** |

Deep Analysis / Buyer Pass: product keys on `/cenik`; grant after webhook/free path — not client redirect.

---

## 4. Auth / account

| Step | Event |
| --- | --- |
| Signup | `signup_completed` (`consents: terms_privacy`) |
| Login success/fail | ledger-safe auth events (see taxonomy) |
| Password reset request | `password_reset_requested` |
| Consent grant/revoke | ledger category — always allowed |

---

## 5. Financing / HJ

| Step | Event |
| --- | --- |
| Financing CTA | `hypotekajasne_cta_clicked` (marketing+analytics) |
| Lead submit | Server funnel / lead domain — use correlation id, not PII in analytics |

Partner may be **dev adapter** — do not treat offer impressions as live bank quotes in reporting.

---

## 6. B2B (agents)

| Step | Event family |
| --- | --- |
| Org / publish / lead | B2B funnel events in `events.ts` (no addresses/PII) |

Gated by B2B plan feature flags (defaults ON in code).

---

## 7. Pipeline reality

| Layer | Status |
| --- | --- |
| Typed `track()` + scrubber | LIVE |
| Consent gate | LIVE |
| Prod export to vendor | **DISABLED / noop** |
| Warehouse / dashboards | **PLANNED** — not in repo |

Until a real provider is configured, funnel “dashboards” are local/dev console only. Do not claim GA4/PostHog live.
