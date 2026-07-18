# Homepage Content — Majetio.cz

Zdroj copy: `src/content/homepage.ts`  
Demo čísla: `src/data/demo/homepage-analysis.ts`, `src/content/demo-properties.ts`

## Jazyk a tón

- Čeština, vykání, věcný tón (`TONE_OF_VOICE.md`)
- Formát čísel: `formatCzk` / `formatPercentPoints` (např. `6 490 000 Kč`, `5,4 %`)
- Žádné garantované výnosy, žádný nátlak

## Hlavní texty (control)

| Prvek | Text |
| --- | --- |
| H1 | Zjistěte, zda se nemovitost skutečně vyplatí koupit. |
| Podnadpis | Majetio není běžný inzertní portál… |
| Primární CTA | Analyzovat nemovitost → `/analyza` |
| Sekundární CTA | Jak Majetio funguje → `/jak-to-funguje` |
| Terciární | Procházet nemovitosti → `/nemovitosti` |

## Sekce a obsah

| Sekce | Účel |
| --- | --- |
| Announcement | Trust + HypotekaJasne |
| Sample analysis | Ukázka metrik, rizik, nejistot (Demo) |
| Skóre & metriky | Složení skóre; princip „výnos ≠ cash flow“ |
| Jak to funguje | 4 kroky |
| Strategie / audience | Cesty podle cíle |
| Financování | Oddělení rolí + mock odhad |
| Rekonstrukce / lokalita / rizika | Max. nabídka, mapa placeholder, rizika |
| Porovnání | Nejlevnější ≠ nejlepší |
| Ceník | Free vs. kompletní z commerce config |
| Metodika | Důvěra bez fake reviews |
| FAQ | 8 otázek |
| Final CTA | Klidný závěr |

## Demo data — pravidla

- Vždy `isDemo: true` nebo vizuální badge „Demo“ / „Ilustrativní“
- Atribut `data-demo="true"` na demonstračních blocích
- Finanční disclaimer pod hero

## Lokalizace

Copy je centralizované v `homepage.ts` — připravené na budoucí i18n bez úprav UI komponent.
