# Market Operations

Market registry admin — LIVE / PAUSED, kill switches, launch readiness. Permission: `platform.markets.write` (sensitive).

## Surface

`/admin/trhy` — market cards, capability matrix signals, pause/resume with reason.

## Rules

1. Market ≠ Currency ≠ Language (see international architecture).
2. LIVE requires launch readiness asserts — no silent go-live.
3. Kill switches (`kill.markets`, …) are FeatureFlags with audit trail.
4. Cross-market compare / public DTO contracts stay market-scoped.

## Related

`docs/MARKET_REGISTRY.md`, `docs/MARKET_LAUNCH_PROCESS.md`, `docs/INTERNATIONAL_ARCHITECTURE.md`, `docs/FEATURE_FLAGS_AND_CONFIG.md`
