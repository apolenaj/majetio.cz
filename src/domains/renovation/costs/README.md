# Costs (C) — Náklady



CapEx estimate from scope + cost/location models.

Must not set or imply after-repair value (that is `arv/`).



## Prompt 3/5



- `RenovationCostCatalog` — versioned unit-rate DB (`catalog/`, demo fixture only)

- `estimateRenovationCosts()` — prices `RenovationScope` → low/base/high bands

- Regional coefficients — Praha vs. zbytek ČR (`regional/`)

- Project costs — architect, permits, supervision (% of construction)

- Furnishing — `built_in_furniture` bucket (separate from construction)

- Confidence — high / medium / low / insufficient

- Version: `cost.v2026.07`

