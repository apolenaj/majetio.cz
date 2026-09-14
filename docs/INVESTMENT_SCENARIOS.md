# Investment Scenarios

## Dvě vrstvy scénářů

### A) Engine scenario kinds (pure runners)

`src/domains/investment/engine/scenarios/`

| Kind | Účel | Klíčové vstupy | Výstupy |
|------|------|----------------|---------|
| `long_term_rental` | Stabilní dlouhodobý pronájem + horizont | TAC, nájem, vacancy, opex, úvěr, růsty, hold | Year-1 metriky, projekce, IRR/EM |
| `cash_purchase` | Koupě bez úvěru | TAC, nájem/opex, růsty | CF = NOI; DSCR N/A; IRR z equity CF |
| `short_term_rental` | Sezónní / STR hrubý příjem | Sezónní měsíce / occupancy, opex, úvěr | EGI z sezóny, CF, IRR |
| `flip` | Koupě → (reno) → prodej | Kupní cena, reno (user), salePrice (user), hold | Profit model, IRR — **ne ARV odhad** |
| `renovation_rent` | Reno + následný rent | Pre/post rent, reno cost (user), úvěr | Gap rent, projekce — **ne CapEx engine** |

### B) Persistované AnalysisScenarioType

Prisma / orchestration:

`LONG_TERM_RENTAL` · `CASH_PURCHASE` · `SHORT_TERM_RENTAL` · `FLIP` · `RENOVATION_RENT` · `BASE_METRICS`

`BASE_METRICS` = year-1 orchestrace bez plného holding runneru (kalkulačka).

### C) Variant UI (canonical)

`CONSERVATIVE` · `REALISTIC` · `OPTIMISTIC` · `CUSTOM`

Spreads z `assumptions.v2026.07` — konzervativní snižuje nájem / zvyšuje vacancy / sazbu; optimistický naopak.

### D) Profile (vlastnictví)

| Profile | Význam | Čtení |
|---------|--------|-------|
| `USER` | Privátní scénář uživatele | jen owner (+ staff) |
| `ANALYST` | Interní / analytik | staff |
| `SYSTEM_NEUTRAL` | Veřejný orientační | anonymně čitelný |

`isPublicShareEnabled` je u USER řádků **ignorováno** (Part 2/B) — sdílení vypnuto.

## Vstupy (společné)

- Nemovitost: `propertyId` (nebo ephemeral `calculator-ephemeral`), měna, plocha (volitelně)
- Akvizice: kupní cena + volitelné řádky TAC
- Příjem/náklady: nájem, vacancy, opex, fond oprav
- Financování: `loanAmount` (`null` = neznámé, `0` = cash, `>0` = úvěr), nominální sazba, splatnost
- Trh: appreciation, rent growth
- Horizont: `holdYears`

## Výstupy

- `OrchestratedCalculationResult`: status `CALCULATED` | `PARTIAL` | `FAILED`
- `availableMetrics` / `unavailableMetrics`
- `resultWarnings` (LTV>100, záporný CF, IRR anomálie, …)
- `issues` (kategorie: `invalid_input`, `insufficient_data`, `numerical_failure`, `unsupported_scenario`)
- Zmrazené verze engine + formula registry + assumption config

## Kalkulačka — strategie UI

| Strategy | Intent | Primární metriky |
|----------|--------|------------------|
| `long_term_rental` | rental | net yield, CF, equity, CoC, IRR |
| `owner_occupier` | own_use | měsíční náklad bydlení, equity, DS |
| `flip` | flip | modelovaný profit/marže, TAC, IRR |
