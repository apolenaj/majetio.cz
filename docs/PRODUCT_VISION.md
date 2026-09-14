# Product Vision — Majetio.cz

## Mission

Majetio.cz je česká realitní a investiční platforma, která uživateli nepomáhá pouze najít nemovitost, ale především odpovědět na otázku:

> **Vyplatí se tuto konkrétní nemovitost koupit?**

## Positioning

Majetio spojuje vyhledávání nemovitostí s investiční a finanční analýzou. Na rozdíl od klasických realitních portálů nedodává jen katalog inzerátů — dodává rozhodnutí podložené daty.

## Target users

| Segment | Potřeba |
| --- | --- |
| Kupující vlastního bydlení | Realistická cena, rizika lokality, financovatelnost |
| Začínající investoři | Srozumitelné výnosy, cash flow, srovnání nabídek |
| Zkušení investoři | Scénáře, renovace, flip, multi-property porovnání |
| Dlouhodobý / krátkodobý pronájem | Yield, occupancy, provozní náklady |
| Investoři do rekonstrukcí / flip | Odhad nákladů, margin, exit cena |
| Klienti hledající financování | Orientace + bezpečný handover do HypotekaJasne.cz |

## Product pillars

1. **Discovery** — vyhledávání a filtrování nemovitostí
2. **Analysis** — hodnota, výnosy, cash flow, rizika, lokalita
3. **Decision support** — doporučená nabídková cena, srovnání, strategie
4. **Transaction support** — placená analýza, leady, partnerské služby
5. **Financing bridge** — integrační vrstva k HypotekaJasne.cz

## Relationship with HypotekaJasne.cz

| Majetio.cz | HypotekaJasne.cz |
| --- | --- |
| Výběr a analýza nemovitosti | Hypoteční kalkulace a sazby |
| Investiční výpočty, odhad, renovace | RPSN, porovnání financování |
| Podpora koupě | Hypoteční poradenství a leady |

Majetio drží kontext nemovitosti a investiční záměr. HypotekaJasne drží financování. Propojení probíhá přes souhlasy uživatele, společný finanční profil a bezpečnou výměnu leadů.

## Business model (high level)

1. Bezplatná základní analýza
2. Placená kompletní analýza (~4 990 Kč)
3. Provize ~1 % z kupní ceny při realizované transakci
4. Hypoteční lead do HypotekaJasne
5. Pozdější partnerské provize (právo, inspekce, odhad, rekonstrukce, správa, pojištění, reality)

Konkrétní částky jsou řízené centrální konfigurací (`AppConfiguration` / `src/config`), nikoli hardcoded hodnotami v UI.

## Brand promise

Důvěryhodný, datově orientovaný, finančně profesionální proptech produkt pro české rozhodování o nemovitostech — prémiový, ale srozumitelný.
