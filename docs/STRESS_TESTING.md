# Stress Testing

## Účel

`runStressTests` aplikuje pojmenované šoky na base case a vyhodnotí year-1 metriky + risk flags. Slouží k odolnosti scénáře, ne k predikci budoucnosti.

## Shock IDs

Definované v `STRESS_SHOCK_IDS` (`engine/risk/stress.ts`) — typicky kombinace:

- vyšší sazba
- vyšší vacancy / nižší EGI
- vyšší opex
- kombinované „recesní“ scénáře

(Přesný seznam konstant udržujte v kódu / testu `risk.test.ts`.)

## Risk flags

Příklady (`RISK_FLAG_CODES`):

- `low_dscr` — pod prahem (default &lt; 1.2; &lt; 1 critical)
- další prahy v `DEFAULT_RISK_THRESHOLDS`

Flags mají `severity` | `warning` | `critical` + lidskou message. **Nejsou** investiční doporučení.

## Break-even jako doplněk stressu

- Break-even occupancy
- Break-even interest rate
- Break-even purchase price (≠ max offer product)

## 100 % vacancy

Validní stress vstup (`full_vacancy_stress` warning) — EGI/NOI mohou být nulové/záporné; výpočet nesmí spadnout.

## Confidence

`calculateConfidenceScore` z provenance polí — indikuje kvalitu vstupů, **ne** jistotu budoucího výnosu.

## Co stress test nedělá

- Negarantuje dolní mez ztráty
- Nemodeluje kreditní default dlužníka / bank run
- Nespojuje se s scoringem banky HypotekaJasne (oddělená integrace)
