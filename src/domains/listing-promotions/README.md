# Domain: listing-promotions

Paid listing Boost (sponsored placements). Separate from commerce promo codes.

**Firewall:** Boost must never affect Majetio Score, valuation, risk, or organic ranking.
Every paid display is labeled **Sponzorováno**.

- `eligibility.ts` — inactive / banned / unverified gates
- `service.ts` — activate / expire Boost
- `sponsored-search.ts` — `sponsoredPlacements` vs `organicResults`
- Docs: `docs/LISTING_PROMOTIONS.md`, `docs/PROPERTY_SEARCH.md`
