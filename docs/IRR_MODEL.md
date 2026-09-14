# IRR Model

## Definice

IRR je diskontní míra, při které NPV equity cash flow řady = 0:

\[
\sum_{t=0}^{T} \frac{CF_t}{(1+\text{IRR})^t} = 0
\]

Implementace: Newton–Raphson + bisekce fallback (`calculateIrr`).

## Sestavení řady

`buildEquityCashFlowSeries(equity, annualFlows)`:

- \( CF_0 = -\text{equity} \)
- \( CF_1 \ldots CF_T \) = roční equity CF (leveraged + případný exit v posledním roce dle scénáře)

## Edge cases (Part 2/C)

| Situace | Chování |
|---------|---------|
| Žádná změna znaménka | `converged: false`, value `null`, warning `irr_undefined` |
| ≥ 2 změny znaménka | `multipleRootsPossible: true`, warning `irr_multiple_roots` (vrácen jeden kořen) |
| Záporný IRR | value &lt; 0, warning `irr_negative` — validní výsledek |
| Nekonvergence | `null` + reason |

## Equity multiple a ROI

- **Equity multiple** = součet kladných CF / |počáteční equity|
- **Kumulativní ROI (orientačně)** ≈ equity multiple − 1
- **CoC** = jednoroční ROI na equity (jiná metrika)

Samostatný formulový klíč `roi` v registry není — dokumentujte CoC / EM / IRR podle kontextu UI.

## Golden series

| Series | Očekávání |
|--------|-----------|
| −100 → +110 | IRR ≈ 10 % |
| −100k + 40k + 40k + 50k | IRR ≈ 13.7 % |
| −100k + 10k×3 | IRR &lt; 0 |

## Omezení

- IRR předpokládá reinvestici při IRR (klasická kritika)
- Multi-root u nestandardních CF — UI varuje, negarantuje „jediný správný“
- Ephemeral kalkulačka může modelovat IRR z projekce; není investiční doporučení
