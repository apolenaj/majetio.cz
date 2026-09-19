# Audit rozhodování na portálu — 19. 9. 2026

Podklad: screenshoty Sreality (byt Praha) a ukázkového detailu Majetio (dům Krnov) plus stav repozitáře. Nejde o srovnání cen dvou různých nemovitostí.

## Matice

| Požadavek | Co už je | Problém | Změna v této etapě | Závislost | Ověření |
| --- | --- | --- | --- | --- | --- |
| Galerie bez falešného před/po | `CatalogPhotoGallery`, karty | Štítek před/po na různých domech, prázdná buňka | Ilustrační štítek, kompaktní mřížka, lightbox | žádná | vizuálně ne v prohlížeči |
| Technický stav ≠ prezentace | `PropertyCondition` u živých nabídek; u katalogu jen `stav_inzeratu` | UI říkalo „STAV: Premium — před a po“ | `technicky_stav` a oddělená prezentace | žádná | unit test katalogu |
| Text bez interních korekcí | `catalog-listing-details.ts` | „ne za vilu“, „dřevostavba s verandou“, slib dronu | věty pryč, popis médií přepsán | žádná | unit test |
| Kontakt | živý detail má poptávku | ukázka kontakt neměla a nesmí ho předstírat | panel „nic se neodesílá“ | žádná | kód |
| Parametry | velké karty | málo údajů, stav smíchaný | tabulka včetně PENB „Neuvedeno“ | žádná | kód |
| Investiční model | engine v `src/domains/investment` | ukázka slibovala potenciál bez čísel; engine nepočítá oddělenou CAPEX rezervu podle zadání | nový `calculateRentalDecision`, panel až po vyplnění vstupů | žádná | kontrolní příklad |
| Filtry, URL, katalog | serverové filtry a mock katalog | demo se ukáže jen když živý výpis je prázdný | beze změny směšování | DB | existující testy |
| Cenová historie, routing, katastr | živý detail má části valuace; routing/katastr ne | bez zdroje nesmí být graf okolí | nedoplněno, není označeno jako hotovo | licence dat | — |
| Hypotéky | `hypotekajasne` adaptér | nabídky bank ze screenshotu Sreality se nekopírují | neaktivováno | klíč a smlouva | — |

## Checklist

- A důvěryhodnost ukázkového detailu: hotovo v kódu, vizuální kontrola v prohlížeči neproběhla
- A živá inzerce, koncept, publikace: existuje, v této etapě se nepřepisovala
- B filtry a URL: existují, v této etapě se neměnily
- C kontrolní výpočet pronájmu: **ověřeno** — `rental-decision.test.ts` + `mock-properties.test.ts` = 9/9
- C scénáře, refixace, flip, grafy na ukázce: nedokončeno
- D historie cen ukázky, hlídání, routing, katastr, přirozený jazyk, hledání fotkou: blokováno chybějícím poskytovatelem nebo nedokončeno

## Kontrolní příklad (haléře)

| Metrika | Očekáváno | Stav |
| --- | --- | --- |
| Splátka | 16 104,65 Kč/měs. | OK |
| Efektivní nájem | 228 000 Kč/rok | OK |
| NOI | 192 000 Kč/rok | OK |
| CF před rezervou | −1 255,78 Kč/rok | OK |
| CF po rezervě | −13 255,78 Kč/rok | OK |
| Hrubý výnos | 6,00 % | OK |
| NOI / C | 4,4651 % | OK |
| Cash-on-cash | −1,0197 % | OK |
| DSCR | 0,9935 | OK |
| Bod zvratu nájmu | 21 162,79 Kč/měs. | OK |

## Co se nesmí číst jako hotové

Ukázkový katalog není živý trh. Vzdálenosti vybavenosti nejsou routing. Investiční panel nepočítá, dokud uživatel nevyplní chybějící vstupy. PENB „Neuvedeno“ není třída G. Prohlížečová kontrola detailu na 390/768/1440 px v této etapě neproběhla (není dostupný browser tool).
