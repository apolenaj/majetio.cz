/**
 * Fallback legal content when LegalDocument table has no PUBLISHED row.
 * Counsel must replace before production go-live — structure is production-ready.
 */

import type { LegalDocumentRecord, LegalDocumentType } from "./consent-record";
import { COOKIE_POLICY_VERSION } from "./cookie-consent";

export const LEGAL_CONTENT_VERSION = {
  TERMS: "2026-07-22",
  PRIVACY: "2026-07-22",
  COOKIES: COOKIE_POLICY_VERSION,
  LEGAL_NOTICE: "2026-07-22",
} as const;

const TERMS_BODY = `
## 1. Provozovatel
Tyto podmínky upravují užívání služby Majetio (majetio.cz). Konkrétní identifikační údaje provozovatele doplní právní tým před spuštěním produkce.

## 2. Charakter služby
Majetio poskytuje informační a analytické nástroje k nemovitostem (modelované odhady, scénáře, kalkulačky). Výstupy jsou orientační — nejde o znalecký posudek, investiční, právní ani daňové poradenství.

## 3. Účet a souhlasy
Registrace vyžaduje souhlas s těmito podmínkami a se zásadami ochrany soukromí. Marketingový souhlas není součástí registrace ani nákupu a není předzaškrtnutý.

## 4. Placené služby
Nákup vyžaduje výslovný souhlas s obchodními podmínkami. Ceny a entitlementy se řídí ceníkem a objednávkou.

## 5. Předání dat partnerům
Jakékoli předání osobních údajů třetí straně (např. hypoteční partner) probíhá jen po zobrazení přesného příjemce, účelu a rozsahu dat a po výslovném souhlasu. Neexistuje obecný souhlas „s partnery“.

## 6. Odpovědnost
Majetio neodpovídá za rozhodnutí učiněná výhradně na základě modelovaných výstupů. Uživatel ověřuje kritická fakta u primárních zdrojů.

## 7. Změny
O podstatných změnách podmínek informujeme a můžeme vyžadovat nový souhlas (reconsent) dle verze dokumentu.
`.trim();

const PRIVACY_BODY = `
## 1. Správce
Správcem osobních údajů je provozovatel Majetio. Kontakt a IČ doplní právní tým před produkcí.

## 2. Kategorie údajů
- Identita účtu (e-mail, jméno)
- Finanční pas (příjem, závazky, kapitál) — zvláště chráněný
- Preference nemovitostí a scénáře analýz
- Souhlasy a záznamy o předání dat (příjemce, účel, rozsah, verze, čas)
- Technická data (IP v auditu, cookies dle kategorií)

## 3. Účely
Provoz služby, bezpečnost, plnění smlouvy, modelované analýzy, plnění právních povinností, marketing jen se souhlasem, předání partnerovi jen s konkrétním souhlasem.

## 4. Právní základy
Smlouva, oprávněný zájem (bezpečnost, fraud), souhlas (marketing, nepovinné cookies, partner share), právní povinnost.

## 5. Finanční pas
Citlivá finanční data se v administraci defaultně maskují. Zobrazení vyžaduje oprávnění, step-up potvrzení a vytváří audit event. Bez oprávnění zůstávají maskovaná.

## 6. AI
AI může shrnovat již spočtené výsledky. Není source of truth a negeneruje právní fakta.

## 7. Práva subjektu
Přístup, oprava, výmaz, omezení, přenositelnost, námitka, odvolání souhlasu — v Privacy Center (\`/ucet/soukromi\`). Export probíhá autentizovaným one-time tokem, ne veřejnou URL.

## 8. Doba uchování
Dle účelu a retence (účet, audit, leady). Po žádosti o výmaz zpracujeme dle interního postupu.

## 9. Příjemci
Poskytovatelé hostingu/infra, platební procesor, hypoteční partner jen po konkrétním souhlasu. Žádný blanket „partner share“.
`.trim();

const COOKIES_BODY = `
## 1. Co jsou cookies
Cookies a podobné technologie ukládáme v prohlížeči. Rozlišujeme čtyři kategorie.

## 2. Kategorie
| Kategorie | Povinné | Účel |
| --- | --- | --- |
| Nezbytné | Ano | Relace, bezpečnost, uložení volby cookies |
| Preferenční | Ne | Jazyk, trh, UI |
| Analytické | Ne | Agregovaná produktová analytika bez PII |
| Marketingové | Ne | Kampaně / remarketing |

## 3. Souhlas
Banner nabízí **Přijmout vše**, **Odmítnout nepovinné** a **Nastavit** se stejnou váhou. Analytika ani marketing se nespouští před souhlasem. Nezbytné cookies nelze vypnout.

## 4. Správa
Volbu změníte kdykoli v banneru (odkaz v patičce) nebo v Privacy Center. Verze politiky: ${COOKIE_POLICY_VERSION}.

## 5. Úložiště souhlasu
Volba se ukládá do first-party cookie a u přihlášených uživatelů do \`ConsentRecord\` (účely COOKIE_*).
`.trim();

const NOTICE_BODY = `
## Informativní charakter
Výstupy Majetio jsou modelované a orientační. Nenahrazují právní, daňové ani investiční poradenství ani oficiální registry.
`.trim();

export const FALLBACK_LEGAL_DOCUMENTS: Record<
  LegalDocumentType,
  LegalDocumentRecord
> = {
  TERMS: {
    type: "TERMS",
    version: LEGAL_CONTENT_VERSION.TERMS,
    status: "PUBLISHED",
    title: "Obchodní podmínky",
    content: TERMS_BODY,
    summary: "Podmínky užívání služby Majetio.",
    locale: "cs-CZ",
    marketCode: "CZ",
    publishedAt: "2026-07-22T00:00:00.000Z",
    effectiveFrom: "2026-07-22T00:00:00.000Z",
  },
  PRIVACY: {
    type: "PRIVACY",
    version: LEGAL_CONTENT_VERSION.PRIVACY,
    status: "PUBLISHED",
    title: "Ochrana soukromí",
    content: PRIVACY_BODY,
    summary: "Jak zpracováváme osobní údaje a jaká máte práva.",
    locale: "cs-CZ",
    marketCode: "CZ",
    publishedAt: "2026-07-22T00:00:00.000Z",
    effectiveFrom: "2026-07-22T00:00:00.000Z",
  },
  COOKIES: {
    type: "COOKIES",
    version: LEGAL_CONTENT_VERSION.COOKIES,
    status: "PUBLISHED",
    title: "Zásady cookies",
    content: COOKIES_BODY,
    summary: "Kategorie cookies a správa souhlasu bez dark patterns.",
    locale: "cs-CZ",
    marketCode: "CZ",
    publishedAt: "2026-07-22T00:00:00.000Z",
    effectiveFrom: "2026-07-22T00:00:00.000Z",
  },
  LEGAL_NOTICE: {
    type: "LEGAL_NOTICE",
    version: LEGAL_CONTENT_VERSION.LEGAL_NOTICE,
    status: "PUBLISHED",
    title: "Právní upozornění",
    content: NOTICE_BODY,
    summary: "Modelované výstupy nejsou právní radou.",
    locale: "cs-CZ",
    marketCode: "CZ",
    publishedAt: "2026-07-22T00:00:00.000Z",
    effectiveFrom: "2026-07-22T00:00:00.000Z",
  },
};
