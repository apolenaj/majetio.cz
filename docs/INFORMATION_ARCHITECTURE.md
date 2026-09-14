# Information Architecture — Majetio.cz

Majetio pomáhá odpovědět: **vyplatí se tuto nemovitost koupit?** IA odděluje objevování, analýzu, rozhodování, financování, služby a důvěru.

## Produktové oblasti

| Oblast | Účel | Primární URL |
| --- | --- | --- |
| A. Objevování | Hledání a detail nabídek | `/nemovitosti` |
| B. Analýza | Rychlá i kompletní analýza | `/analyza` |
| C. Rozhodování | Porovnání, skóre, uložené analýzy | `/porovnani`, `/ucet/*` |
| D. Financování | Orientační výpočty → HypotekaJasne | `/kalkulacky/financovani` |
| E. Profesionální služby | Placená analýza, pomoc s koupí | `/cenik`, `/kontakt` |
| F. Vzdělávání a důvěra | Metodika, lokality, průvodce | `/metodika`, `/pruvodce`, `/strategie` |
| G. Účet | Profil, oblíbené, objednávky | `/ucet` |
| H. Admin | CRM, data, obsah | `/admin` |

## Principy

1. **Jedna primární cesta na stránku** — jedna hlavní CTA.
2. **Žádné mrtvé odkazy** — pouze reálný obsah nebo označený stav „Připravujeme“.
3. **Demo ≠ živý trh** — demonstrační data jsou vždy označená.
4. **Financování není HypotekaJasne** — Majetio jen orientuje a předává se souhlasem.
5. **Soukromé = noindex + serverová ochrana**.
6. **Mělké URL** — české slugy, filtry přes query parametry.

## Hierarchie obsahu (veřejná)

```
/ (homepage)
├── Nemovitosti (/nemovitosti, /[slug], doporučené, investiční)
├── Analýza (/analyza, /nova, /[id]/…)
├── Porovnání (/porovnani)
├── Kalkulačky (/kalkulacky/…)
├── Lokality (/lokality, /[slug])
├── Strategie (/strategie, /[slug])
├── Jak to funguje, Ceník, Metodika, Zdroje, Skóre
├── Průvodce (/pruvodce, /[slug])
├── O Majetio, Kontakt, Partneři
└── Právní stránky
```

## Persona → vstupní body

| Persona | Vstup | Cíl |
| --- | --- | --- |
| Návštěvník | `/` | Pochopit hodnotu → analýza nebo katalog |
| Kupující bydlení | `/strategie/vlastni-bydleni` | Realistická cena + financování |
| Začínající investor | `/nemovitosti`, `/strategie/dlouhodoby-pronajem` | Výnos a rizika |
| Zkušený investor | `/porovnani`, `/analyza` | Scénáře a verdikt |
| Klient placené analýzy | `/cenik` → objednávka | Kompletní analýza |
| Registrovaný | `/ucet` | Pokračovat v rozpracovaném |
| Admin | `/admin` | Provoz a data |

## Route groups (App Router)

URL nemění route groups:

- `(public)` — marketing, právní, hledání
- `(discovery)` — nemovitosti, porovnání
- `(tools)` — analýza, kalkulačky
- `(auth)` — přihlášení / registrace
- `(account)` — `/ucet/*`
- `(admin)` — `/admin/*`
- `dev/` — design system (prod gated)

Detailní matice: `ROUTE_ACCESS_MATRIX.md`. Cesty: `USER_JOURNEYS.md`. Navigace: `NAVIGATION_SYSTEM.md`.
