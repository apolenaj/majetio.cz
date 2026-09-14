# Location Scoring

Methodology: `location-score.v2026.07`

## Dimensions (independent — no single black-box city score)

| Dimension | Use |
|-----------|-----|
| `OWN_USE_FIT` | Own-home fit |
| `RENTAL_INVESTMENT_FIT` | Long-term rental investment |
| `FLIP_FIT` | Flip / renovation |
| `MARKET_LIQUIDITY` | Liquidity / DOM / supply |

Composite only when user selects a primary strategy and required inputs exist.

## Inputs

- Market metrics from Location Engine (medians, DOM, yield, …)
- Accessibility / amenities — Majetio POI proximity (**not** Walk Score)
- Environment — flood / zoning / transit impacts only

## Guardrails (strict)

**Forbidden:** ethnicity, demographics, crime/safety demographic scores, neighborhood “reputation” based on people.

`assertAllowedScoreInput` throws `ProhibitedScoreInputError`.

## Missing data

Dimension `availability: insufficient_data` → `score: null` — **never substitute 0**.

## Personalization

`LocationMatchScore` uses Finanční pas preferences. **Never shared-cache** personalized matches (`assertNotSharedPersonalizedCache`).

## Tests

`src/domains/locations/scoring/location-score.test.ts` + DoD suite determinism / personalization cases.
