# VALUATION MODEL CARD — residential_apartment_v1

| Field | Value |
| --- | --- |
| **Model code** | `residential_apartment_v1` |
| **Engine version** | `residential_apartment_v1.core.0.2.0` |
| **Type** | Rule-based / statistical comps (no black-box ML) |
| **Supported types** | APARTMENT (primary); HOUSE only when enough local comps |
| **Owner** | Majetio valuation domain |
| **Status** | Production-ready core + demo candidate pool; DB persistence schema ready |

## Intended use

Orientační automatický odhad tržní hodnoty bytu v ČR pro Decision Cockpit (`/nemovitosti/[slug]`).  
**Není** znalecký posudek, bankovní LTV ani Oficiální cena v SEO `Offer.price`.

## Out of scope

- Pozemky, komerce, SHELL, atypické mega-byty
- Black-box ML / neural nets
- Automatický přepis bez audit trailu (analyst overrides → `ValuationAdjustmentAudit`)

## Inputs

- Subject: type, area, layout, condition, floor, elevator/balcony, geo
- Candidates: price, area, layout, condition, geo, `observedAt`, licence flag

## Outputs

- Mid estimate, lower/upper bound, confidence level (+ score for analysts)
- Included/excluded comps with reasons
- Feature adjustments with Czech explanations
- Public vs Analyst DTOs

## Metrics / evaluation (synthetic + demo)

| Scenario | Expectation |
| --- | --- |
| Dense Praha 3+kk | `CALCULATED`, outlier excluded, mid in bounds |
| Sparse village house | `INSUFFICIENT_DATA` or appraisal required — no invented mid |
| Licence ANONYMIZE | Public comps anonymized |
| Public viewer | No weights / score / snapshot |

## Ethical / legal

- Disclaimer: „Odhad Majetio je orientační…“
- Analytics: no CZK amounts, no street addresses
- Comparables respect source licence anonymization

## Limitations

- Demo candidate pool ≠ live cadastral / transaction feed
- Confidence reflects **data density & dispersion**, not legal certainty
- Asking price in schema.org Offer ≠ Majetio estimate

## Changelog

| Version | Notes |
| --- | --- |
| 0.1.0 | Core selection, outliers, base, adjustments |
| 0.2.0 | Range, confidence, edge cases, staleness |
| Part 4 | Public/Analyst DTOs + UI |
| Part 5 | Synthetic tests, analytics, docs, model card |
