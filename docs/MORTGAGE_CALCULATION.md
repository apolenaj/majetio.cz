# Mortgage Calculation

## Pravidla

1. Splátku pohání **nominální úroková sazba**, ne APR/RPSN.
2. APR je volitelný disclosure field — nesmí vstoupit do anuity.
3. Výpočet: `calculateAnnuityPayment` + `buildAmortizationSchedule` (pure).

## Annuity formula

Pro měsíční sazbu \( r = i_{\text{nom}} / 12 \) a \( n = \text{termYears} \times 12 \):

\[
M = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1}
\]

- \( r = 0 \): \( M = P / n \)
- \( r < 0 \): stejný vzorec (podporováno); UI warning `negative_interest_rate`
- \( 1 + r/12 ≤ 0 \): numerical failure (příliš záporná sazba)

Zaokrouhlení peněz: **ROUND_HALF_UP** na minor units (haléře) při display/persist.

## Amortizace

Každý měsíc:

1. `interest = balance × r`
2. `principal = payment − interest` (poslední měsíc dorovná zůstatek)
3. `balance` se nesmí stát nonsensically negative (clamp na 0)

Invariant (testováno property-based): ending balance ≈ 0 po plné splatnosti; mezizůstatky ≥ 0; monotónní pokles.

## Golden / Excel alignment

| Case | Očekávání |
|------|-----------|
| 0 % / 30y / 3.6M | Měsíčně přesně 10_000 Kč |
| 5 % / 30y / 3.6M | ≈ Excel PMT, balance ≈ 0 |
| 5 % / 5y short | Balance ≈ 0 |
| 1 mld. Kč | Bez overflow, finite payment |

## LTV a custom financing

- LTV = jistina / hodnota (typicky TAC)
- LTV > 100 % = validní custom financing + warning `ltv_over_100`
- Záporná jistina = `invalid_input`

## DSCR

`DSCR = NOI / annual debt service`

- ADS = 0 → `null` / `not_applicable` (cash)
- Nikdy nevracet `Infinity`
