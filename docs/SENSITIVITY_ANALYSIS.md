# Sensitivity Analysis

## Účel

Ukázat, jak se year-1 metriky mění při šoku jednoho nebo dvou faktorů. Běží **pure in-memory** (`runOneWaySensitivity`, `runTwoWaySensitivity`) — žádné DB dotazy, žádné N+1.

## Faktory

| Factor | Význam šoku |
|--------|-------------|
| `interest_rate_pp` | Absolutní změna nominální sazby v procentních bodech (např. −1, 0, +1, +2) |
| `egi` | Relativní změna EGI (např. −10 %, 0, +10 %) |
| `opex` | Relativní změna opex |

## Metriky ve gridu

`annualCashFlow` · `monthlyCashFlow` · `noi` · `dscr`

## Monotónnost (testováno)

- ↑ úrok ⇒ ↓ annual CF (striktně)
- ↑ EGI ⇒ ↑ annual CF
- ↑ opex ⇒ ↓ annual CF

## UI (heatmap)

- Každá buňka obsahuje **číslo** (ne jen barvu) — WCAG
- `<caption class="sr-only">` + per-cell sr-only popis
- Analytics: `sensitivity_opened` (bez CZK částek)

## Performance NFR

- 21 one-way shocks &lt; 500 ms v unit testu
- Citlivost se nepersistuje jako cache veřejného CDN

## Canonical scenarios vs sensitivity

Canonical conservative/optimistic = diskrétní spreads z assumption config.  
Sensitivity = spojitý / multi-step grid kolem base case.
