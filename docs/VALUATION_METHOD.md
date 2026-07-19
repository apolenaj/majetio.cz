# VALUATION_METHOD

Metodika automatického odhadu `residential_apartment_v1` (Prompt 10).

## 1. Výběr comparables

1. Stejný subject ID se přeskočí.
2. Musí jít spočítat Kč/m² (cena + plocha).
3. Geo hierarchie: **MICRO** → **NEIGHBOR** → **BROADER** (OUT_OF_SCOPE drop).
4. Time decay (exponenciální half-life od `observedAt`).
5. Similarity: plocha + dispozice + stav (0–1).
6. `rawWeight = geoWeight × timeDecay × similarity`.
7. Min. similarity default 0.25; max. retained comps default 25.

## 2. Weighting

Po outlier pass se váhy **renormalizují** na includované comps (`weight` suma ≈ 1).  
Základní hodnota = **vážený medián Kč/m²** × plocha subjectu (ne průměr — odolnější vůči šumu).

## 3. Outliers

`detectOutliers` **nikdy nemaže** kandidáty — nastaví `included: false` + `exclusionReason`:

- chybná / chybějící plocha
- plocha mimo realistický bytový interval
- IQR fence na Kč/m² (1.5× / extreme 3×)
- |z-score| > 3 při dostatku vzorků

## 4. Feature adjustments

Explainable korekce vs. typické includované comps (faktor + `amountCzk` + Czech `reason`):

| Code | Směr (příklad) |
| --- | --- |
| `balcony` | zvyšuje |
| `ground_floor` | snižuje |
| `high_floor_elevator` | zvyšuje |
| `condition_better` / `worse` | ± |
| `no_elevator` | snižuje |

Upravená hodnota = base × (1 + Σ faktorů).

## 5. Range

Vážené kvantily Kč/m² (**p20 / p80**) × plocha × adjustment multiplier → `lowerBound` / `upperBound`.  
Široké pásmo ⇒ nižší confidence — nikdy se nevymýšlí falešně úzký interval.

## 6. Edge cases

Automatický odhad se **blokuje** (`REQUIRES_INDIVIDUAL_APPRAISAL`) např. u LAND/COMMERCIAL, SHELL, atypické dispozice, extrémní plochy.  
Sparse market → `INSUFFICIENT_DATA` (žádný vymyšlený mid).
