# REGULATORY_CONFIGURATION

Versioned regulatory rules, International Risk Model, due diligence checklists, and data-source licensing.

**Related:** [`REGULATORY_AND_FINANCING.md`](./REGULATORY_AND_FINANCING.md) · [`CLEARPROPERTYPATH_INTEGRATION_BOUNDARY.md`](./CLEARPROPERTYPATH_INTEGRATION_BOUNDARY.md) · [`CONSENT_MANAGEMENT.md`](./CONSENT_MANAGEMENT.md)

## Principles (Rules 138, 153–154, 163–174)

1. **No single risk score** — never “UAE risk 4/10”. Use multi-dimensional **facts** (legal, currency, financing, tax, …).
2. **Version + reviewedAt** on rules and DD checklists.
3. **Do not hallucinate** production legal config. Unverified packs are `isDemo: true`.
4. Data sources are **market-licensed** — refuse cross-market / disallowed usage.

## RegulatoryRule

```ts
{ code, marketCode, kind, version, status, validFrom, validTo,
  verifiedAt, verifiedBy, payload, requiresLegalVerificationNotice, isDemo }
```

| Pack | `isDemo` | Notes |
| --- | --- | --- |
| `CZ_REGULATORY_RULES_V2026_07` | `false` | Orientational, reviewed seed |
| `AE_REGULATORY_RULES_V2026_07` | `true` | Research until counsel verifies |
| `DEMO_HALLUCINATED_REGULATORY_RULES` | `true` | Test isolation only |

`listActiveRegulatoryRules({ allowDemo: false })` excludes demo (default).

## International Risk Model

`src/domains/risk/international/`

- Dimensions: MARKET · CURRENCY · LEGAL · FINANCING · TAX · LIQUIDITY · OPERATIONAL · DATA_QUALITY
- `aggregateScore: null` always — `assertNoAggregateRiskScore` throws on numeric score misuse
- CZ production pack + AE **demo** pack

## Due Diligence checklists

`src/domains/risk/due-diligence/checklists.ts`

```ts
{ marketCode, version, reviewedAt, reviewedBy, isDemo, items[] }
```

Prisma mirror: `DueDiligenceChecklistPack`.

## Data source licensing

`assertDataSourceAllowedForMarket({ sourceKey, marketCode, usage })`

Fails when:

- source market ≠ consumer market (except `*`)
- usage not in `allowedUsage`
- scraped / unverified for commercial use

## Consent recipients

Lead sharing must name **HypotekaJasne** (or another registered recipient) — never “our partners”.  
See `src/domains/consent/recipients.ts`.
