# Oprava produktu — checklist 19. 9. 2026

## Problémy ze screenshotů

| Vada | Stav |
| --- | --- |
| Galerie přetéká vysokým snímkem a odsouvá nadpis | **hotovo** — pevná výška ~416 px, `object-cover` |
| Nesourodá sada fotek (různé domy, pole, pokoj) | **hotovo** u Krnova 1 ilustrace; bez párování pred/po |
| Technické věty v kontaktním panelu | **hotovo** — Ukázka prezentace + Přidat nemovitost |
| Nadpis a cena pod galerií | **hotovo** — nadpis nad galerií |
| Premium prezentace v parametrech nemovitosti | **hotovo** — pryč z tabulky |
| 11 prázdných investičních polí | **hotovo** — bydlení / investice + předpoklady |
| Podobné: prodej + pronájem | **hotovo** — stejná transakce i typ |
| Cena/plocha a štítky na kartách | **hotovo** — oddělené řádky, vyplněné štítky |
| Spekulativní štítky bez metodiky | **hotovo** — skryté ve veřejném UI |

## Režimy

- Živá nabídka: stávající produkční detail (mimo tento diff).
- Veřejná ukázka: `/nemovitosti/ukazka-*`, štítek Ukázková nabídka, CTA Přidat nemovitost.
- Interní test: seed katalog mimo SEO (noindex už je).

## Etapy

- A texty a režimy: hotovo v tomto diffu
- B responzivní detail: hotovo v kódu; vizuální kontrola v prohlížeči dle dostupnosti
- C–F: částečně existuje / zbývá mimo tento diff
