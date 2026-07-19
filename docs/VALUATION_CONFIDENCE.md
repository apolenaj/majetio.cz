# VALUATION_CONFIDENCE

Confidence scoring pro UI i Analyst DTO (Prompt 10 Part 3–5).

## Skóre 0–100

Start 100, penále za:

| Kód | Typický dopad | Důvod (CZ UI) |
| --- | --- | --- |
| `too_few_comps` | → 0 / INSUFFICIENT | &lt; 3 includované comps |
| `sparse_comps` | −15 | 3–4 comps |
| `stale_comps` / `aging_comps` | −10 až −20 | stáří observací |
| `high_dispersion` / `moderate_dispersion` | −12 až −25 | CV Kč/m² |
| široké pásmo | −15 | relativeWidth &gt; 0.35 |
| geo mix | další | málo MICRO comps |

## Level mapping

| Level | Skóre |
| --- | --- |
| HIGH | ≥ 75 |
| MEDIUM | ≥ 50 |
| LOW | ≥ 25 |
| INSUFFICIENT | &lt; 25 nebo blocked / &lt; min comps |

## Public vs Analyst

- **Public:** `confidenceLevel` + Czech `confidenceExplanations` (bez raw score a penalty kódů v DTO).
- **Analyst:** navíc `confidenceScore`, váhy comps, `inputSnapshot`.

## Staleness / přepočet

`shouldRecalculateValuation` — refresh při missing cache, manuální request, změna asking ≥ 3 %, fingerprint subjectu, model version, age ≥ 14 dní, OUTDATED/FAILED.  
**Ne** na každý page view. UI event: `valuation_recalculation_requested`.
