# Investment Engine

Interní dokumentace výpočetního jádra Majetio (Prompt 11 / Part 2/E).

## Účel

Investment Engine počítá **investiční metriky** (výnosy, NOI, cash flow, financování, IRR, citlivost, stress) pro české nemovitosti. Je **čistý** (pure): bez Reactu, bez Prisma I/O, bez skrytých předpokladů v UI.

## Verze

| Konstanta | Hodnota | Soubor |
|-----------|---------|--------|
| `INVESTMENT_ENGINE_VERSION` | `0.4.0-risk` | `src/domains/investment/engine/index.ts` |
| `FORMULA_REGISTRY_VERSION` | `1.3.0` | `src/domains/investment/engine/formulas/registry.ts` |
| `ASSUMPTION_CONFIG_VERSION` | `assumptions.v2026.07` | `src/config/investment-assumptions.ts` |

Historické výsledky v DB **zmrazují** `calculationEngineVersion` + `formulaRegistryVersion`. Změna vzorce → nová verze, staré řádky se nepřepisují.

## Architektura

```
src/domains/investment/
  engine/           ← pure math (Money/Percentage, formulas, scenarios, risk, validation)
  service/          ← orchestration: snapshot → assumptions → engine → result DTO / cache
  hooks/            ← useInvestmentCalculation (ephemeral UI)
  server/           ← Server Actions (save / clone / IDOR)
  scenarios/        ← access helpers, variant apply, name sanitize
  observability/    ← latency + missing-input telemetry (bez PII/CZK)
  plugins/          ← tax stub (pre-tax only)
```

**Anti-patterns (zakázáno):**

- výpočty přímo v React komponentách
- falešné nuly za chybějící vstupy
- skryté user assumptions mimo `assumptionSet` / config verzi
- veřejná cache citlivých uživatelských scénářů

## Tok výpočtu

1. `PropertyInvestmentSnapshot` + `AssumptionSet` → `mergeSnapshotWithAssumptions`
2. Domain validation (`validateDomainInputs`) → issues / result warnings
3. `executeEngineCalculation` / scénářové runnery → metriky
4. Envelope: `availableMetrics` + `unavailableMetrics` + `resultWarnings` + `issues`
5. Volitelně persist: `AnalysisScenario` + append-only `InvestmentCalculation` (cache dle `inputHash` + `engineVersion`)

## Související dokumenty

- [INVESTMENT_FORMULAS.md](./INVESTMENT_FORMULAS.md)
- [INVESTMENT_ASSUMPTIONS.md](./INVESTMENT_ASSUMPTIONS.md)
- [INVESTMENT_SCENARIOS.md](./INVESTMENT_SCENARIOS.md)
- [CASH_FLOW_MODEL.md](./CASH_FLOW_MODEL.md)
- [MORTGAGE_CALCULATION.md](./MORTGAGE_CALCULATION.md)
- [IRR_MODEL.md](./IRR_MODEL.md)
- [SENSITIVITY_ANALYSIS.md](./SENSITIVITY_ANALYSIS.md)
- [STRESS_TESTING.md](./STRESS_TESTING.md)
- [INVESTMENT_ENGINE_LIMITATIONS.md](./INVESTMENT_ENGINE_LIMITATIONS.md)
- [INVESTMENT_ENGINE_TEST_PLAN.md](./INVESTMENT_ENGINE_TEST_PLAN.md)
- [INVESTMENT_ENGINE_PART2E_REPORT.md](./INVESTMENT_ENGINE_PART2E_REPORT.md) — závěrečný DoD report

## Explicitně mimo scope (Prompt 12+)

- Samostatný **rekonstrukční engine** (odhad CapEx)
- Model **ARV** (After Repair Value)
- Produktová **maximální nabídková cena**

Engine scénář `renovation_rent` / `flip` pracuje s **uživatelskými** vstupy (náklady, prodejní cena), neodhaduje je.
