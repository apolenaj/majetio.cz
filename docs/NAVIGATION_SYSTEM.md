# Navigation System — Majetio.cz

## Desktop — hlavní navigace

**Levá / střed:**

1. Nemovitosti (megamenu)
2. Analyzovat nemovitost
3. Kalkulačky (megamenu)
4. Lokality
5. Jak to funguje
6. Ceník
7. Průvodce

**Pravá strana:**

- Přihlásit se → `/prihlaseni`
- Primární CTA: **Analyzovat nemovitost** → `/analyza`

Po přihlášení: odkaz na `/ucet` (avatar/ikona připravena v layoutu účtu).

Zdroj pravdy: `src/config/navigation.ts` (`NAV_PRIMARY`).

## Megamenu Nemovitosti

- **Hledat:** všechny, byty, domy, pozemky, investiční příležitosti
- **Podle strategie:** dlouhodobý / krátkodobý pronájem, rekonstrukce, flip, vlastní bydlení
- **Nástroje:** porovnání, uložená hledání, oblíbené (chráněné cesty → login)

## Megamenu Kalkulačky

Přehled + konkrétní kalkulačky se stránkou „Připravujeme“ (bez falešných výsledků).

## Mobilní navigace (veřejná)

- Logo
- Menu button (drawer, Escape, scroll lock, focusable)
- Primární CTA Analyzovat
- Přihlásit se

Drawer seskupuje primární položky + účet.

## Mobilní spodní navigace (po přihlášení / účet)

Max. 5 položek (`MobileBottomNavigation`):

| Položka | URL |
| --- | --- |
| Přehled | `/ucet` |
| Nemovitosti | `/nemovitosti` |
| Porovnání | `/porovnani` |
| Oblíbené | `/ucet/oblibene` |
| Účet | ostatní `/ucet/*` (aktivní mimo přehled/oblíbené/porovnání) |

Safe-area inset: `pb-[env(safe-area-inset-bottom)]`.

## Footer

Skupiny: Produkt, Investování, Společnost, Důvěra a právo + HypotekaJasne.cz.
Bez nefunkčních sociálních ikon.

## Breadcrumbs

- Komponenta `Breadcrumbs` + volitelně JSON-LD v `PageHeader`
- Ne na homepage
- Poslední položka neklikací (`aria-current="page"`)

## CTA hierarchie

1. **Primary** — jedna hlavní akce stránky
2. **Secondary** — porovnání, uložení, metodika
3. **Tertiary** — zpět, zdroj, sdílení

## Analytika navigace

Typované eventy v `src/lib/analytics/events.ts` (bez PII).
