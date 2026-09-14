# Investment Assumptions

Centrální konfigurace předpokladů — žádné hardcoded vacancy/spreads v UI.

## Verze

| | |
|--|--|
| **Version key** | `assumptions.v2026.07` |
| **Alias** | `assumptions.v1` |
| **Label** | Výchozí předpoklady Majetio — červenec 2026 |
| **Effective from** | `2026-07-01` |
| **Soubor** | `src/config/investment-assumptions.ts` |

Uložené scénáře zapisují `assumptionConfigVersion`. Změna defaultů → nová verze dokumentu.

## Výchozí hodnoty (v2026.07)

| Pole | Default | Jednotka / poznámka |
|------|---------|---------------------|
| `vacancyRatePp` | 5 | % body |
| `interestRatePp` | 5.25 | nominální p.a. |
| `termYears` | 30 | |
| `annualOpexShareOfRent` | 0.20 | podíl z nájmu (pokud opex není zadán explicitně v UI baseline) |
| `repairFundAnnualShareOfRent` | 0.04 | fond oprav — warning, pokud chybí |
| `acquisitionCostsShareOfPrice` | 0.0128 | podíl z ceny |
| `feesShareOfPrice` | 0.004 | |
| `appreciationPp` | 3 | rů hodnoty (může být záporný) |
| `rentGrowthPp` | 2 | |
| `expenseInflationPp` | 2.5 | |
| `sellingCostPp` | 3 | náklady prodeje |
| `holdYears` | 10 | |
| `defaultEquityShare` | 0.40 | |

Canonical spreads (conservative / optimistic) vycházejí z této konfigurace (`DEFAULT_CANONICAL_SPREADS`), ne z magických konstant v komponentách.

## Provenance (zdroj vstupu)

UI označuje původ pole:

| Zdroj UI | Engine kind |
|----------|-------------|
| listing | `verified_listing` |
| majetio_estimate / hypotekajasne | `market_data` |
| user | `user_estimate` |
| default | `default_assumption` |

Confidence score váží provenance — **neslouží** jako garance výnosu.

## Intent vs předpoklady

| Intent | Kdy | Dopad na chybějící nájem |
|--------|-----|---------------------------|
| `rental_investment` | LTR / default | `insufficient_input` na yield/NOI |
| `own_use` | strategie vlastní bydlení | yield/NOI → `not_applicable` |
| `flip` | flip strategie | rent není nutný pro year-1 yield |

## Meta disclaimers (povinné v UI)

- Výpočty jsou **před zdaněním**.
- Veřejný neutrální scénář = orientační s výchozími předpoklady.
- Právní disclaimer: nejde o investiční doporučení; budoucí nájem/ceny/sazby se mění.

## Co assumptions nesmí dělat

- inventovat garantovaný výnos
- skrývat daňové zjednodušení
- přepisovat historické scénáře novou verzí configu bez nového výpočtu
