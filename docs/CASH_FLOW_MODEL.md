# Cash Flow Model

## Princip

Cash flow v Majetio je odvozené od **NOI** a **debt service**. Engine nerozlišuje „účetní zisk“ — pracuje s provozním CF před daní.

```
PGI → (− vacancy) → EGI → (− opex) → NOI
NOI → (− annual debt service) → Annual leveraged CF
NOI / 12 → (− monthly DS) → Monthly leveraged CF
```

## Unlevered vs leveraged

| Typ | Definice | Kdy |
|-----|----------|-----|
| Unlevered | CF bez dluhu (`= NOI`) | Vždy, pokud je NOI |
| Leveraged | NOI minus debt service | Úvěr > 0 a DS spočitatelný |

Cash purchase / `loanAmount = 0`: leveraged CF = unlevered CF; DSCR N/A.

## Záporný cash flow

Záporný CF **není chyba**. Typicky při:

- vysoké LTV
- vysoké sazbě
- vysoké vacancy / opex
- nízkém nájmu

UI zobrazí callout + `resultWarnings.code = negative_cash_flow` (severity).

## Projekce (holding period)

`projectHoldingPeriod`:

- EGI / opex rostou dle `rentGrowth` / `expenseInflation`
- hodnota nemovitosti dle `appreciation` (smí být záporná)
- úvěr: outstanding balance z amortizace
- exit: sale − selling costs − zůstatek úvěru → net sale proceeds

Equity CF řada pro IRR: počáteční −equity, pak roční leveraged CF, v posledním roce + exit equity efekt (podle scénáře).

## Co model záměrně neřeší

- Daň z příjmu / odpis (tax plugin = stub)
- CapEx mimo uživatelský vstup (rekonstrukce jako řádek TAC)
- Rezervy liquidity / cash buffer
- Měnové riziko (FX snapshot pole existuje, výpočet CF je v base currency)

## Null vs 0

| Hodnota | Význam |
|---------|--------|
| `rent = null` | Chybí data → insufficient / N/A dle intent |
| `rent = 0` | Explicitní nula (validní vstup) |
| `loan = null` | Financování neznámé |
| `loan = 0` | Cash purchase |
