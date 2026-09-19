# Audit katalogu — 19. 9. 2026

Živě pozorovaný katalog je ukázkový, protože publikované nabídky chybí. Detail `ukazka-1` je byt ve Vysočanech, ne dům v Krnově.

| Ovládání | Pole | Zdroj | Operace | Bez dat | Stav |
| --- | --- | --- | --- | --- | --- |
| Prodej / Pronájem | `nabidka` | URL | serverový filtr | — | existuje |
| Cash flow alespoň 0 Kč | `cashflow-od=0`, `nabidka=prodej`, `jen-vypoctene` | dopočet, ne štítek | vyloučí chybějící | není shoda | opraveno |
| Bez rekonstrukce | `uroven-rekonstrukce=bez` | `technicky_stav` | vyloučí před rekonstrukcí a neuvedeno | není shoda | opraveno |
| Výtah a příslušenství | `prislusenstvi` | features | neznámé není shoda | ukázka bez polí vypadne | opraveno u živého filtru |
| Radius, dražba, podíl | URL | chybí střed / typ ceny | nesmí se tvářit jako hotové | — | radius stále jen v URL, v checklistu jako zbývá |
| Rozpočet | vstupy v katalogu | anuita 5 % / 30 let | jen koupě | prázdné pole se nepočítá | implementováno v ukázce, není v URL |

## Checklist

- Cash flow preset už nečte štítek „Pozitivní cashflow“: hotovo
- Krnov nemá zároveň „Před rekonstrukcí“ a „Bez rekonstrukce“: hotovo
- Podobné k Vysočanům je jen Praha, ne Brno/Plzeň/Ostrava: hotovo
- Rozpočet koupě: implementováno, neověřeno v prohlížeči
- Checklist prohlídky: implementováno, neodesílá poptávku
- Osobní výběr, sdílení, rent roll, komerční specifika, e-mailové hlídání: zbývá nebo existuje jinde a nebylo v tomto diffu přestavěno
Cash-on-cash vychází −2,7368 % po zaokrouhlení poměru na 6 desetinných míst; nezávislý podíl před tímto zaokrouhlením je přibližně −2,73681 %. Splátka 24 425,38 Kč a CF −4 675,38 Kč/měsíc sedí.
