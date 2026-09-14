# Investment Engine — Limitations

Explicitní omezení produktu. Budoucnost **není jistá**; model je rozhodovací pomůcka, ne prognóza.

## Trh a data

- Nájem, ceny a sazby se mění; historický výnos ≠ budoucí výnos.
- Odhad nájmu / vacancy z Majetio je **odhad**, ne smlouva.
- Chybějící data → partial / N/A; nikdy garantovaný výnos z „tichých“ defaultů bez označení provenance.

## Daně a právo

- Výpočty jsou **před zdaněním** (`nullTaxPlugin`).
- Nezohledňuje DPH, daň z příjmu FO/PO, odpis, solidární sazby, změny legislativy.
- Nejde o daňové ani investiční poradenství.

## Financování

- Model anuity s **nominální** sazbou; reálná nabídka banky se liší (poplatky, pojištění, fixace, LTV limity).
- APR/RPSN je jen disclosure.
- LTV > 100 % je matematicky povolené custom financování — nemusí být dostupné na trhu.

## Rekonstrukce a prodej (Prompt 12)

- **Není** implementován samostatný rekonstrukční engine.
- **Není** ARV model.
- **Není** produktová maximální nabídková cena.
- Flip / renovation_rent vyžadují uživatelské vstupy (náklady, sale price).

## IRR a multi-period metriky

- IRR může být nedefinovaná, záporná nebo nejednoznačná (více kořenů).
- Předpoklad reinvestice při IRR je zjednodušení.
- Projekce růstu cen/nájmů jsou předpoklady, ne forecast.

## Persistence a soukromí

- Uživatelské scénáře nejsou veřejně indexované (`noindex`, robots `/ucet`, `/analyza/`).
- Public share USER scénářů je vypnuté.
- Analytics nenesou CZK částky ani PII.

## Technická omezení

- Měna výpočtu = base currency snapshotu (typicky CZK).
- Float IEEE se nepoužívá pro money wire; display rounding HALF_UP na haléře.
- Cache je vázaná na `inputHash` + `engineVersion` — citlivé ephemeral kalkulace nemají sdílený public cache key s listingem.
