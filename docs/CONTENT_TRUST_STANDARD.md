# Content Trust Standard — Majetio

**Datum:** 2026-07-22  
**Účel:** Oddělit fakta, odhady a AI text; stanovit citace a zakázané formulace.  
**Kód:** `src/content/trust.ts`, `src/components/trust/types.ts`, `src/components/seo/json-ld.tsx`, methodology hub

---

## 1. Tři třídy tvrzení

Každý uživatelsky viditelný výrok patří právě do jedné třídy:

| Třída | Definice | Příklad | UI povinnost |
| --- | --- | --- | --- |
| **Fakt** | Ověřitelný údaj ze zdroje nebo zadaný uživatelem jako vstup | Nabídková cena 8 450 000 Kč ze listingu; m² z inzerátu | Provenance `source_record` / `user_provided` |
| **Odhad** | Modelovaný výstup engine / statistiky | Orientační rozpětí hodnoty; hrubý výnos ze scénáře | Badge odhad + confidence + odkaz na metodiku |
| **AI text** | Generovaná sumarizace / vysvětlení | Shrnutí rizik v Decision Workspace | Označit jako AI; nesmí být jediný zdroj fakta |

### Pravidla převodu mezi třídami

- Fakt **nesmí** být přepsán odhadem v SEO title, Offer schema ani v primárním H1 ceny.
- Odhad **nesmí** být prezentován jako fakt („hodnota je…“).
- AI text **nesmí** vymýšlet čísla, právní závěry ani citace, které nejsou ve vstupu.

---

## 2. Zakázané vs. preferované formulace

### Zakázáno (`TRUST_FORBIDDEN_CERTAINTY_PHRASES`)

- „Skutečná hodnota je“
- „Přesná hodnota“
- „Garantovaná hodnota“
- „Skutečná cena nemovitosti“

Rozšířený zákaz v marketing copy:

- „100% bezpečné“, „bank-level security“ jako produktový claim
- „schválená hypotéka“ bez banky
- falešné AggregateRating / počty recenzí v JSON-LD

### Preferováno

- „Modelovaný odhad“
- „Orientační rozpětí“
- „Nabídková cena“
- „Indikativní výpočet ze zadaných předpokladů“
- „AI shrnutí — ověřte ve zdrojích / metodice“

---

## 3. Citace a odkazy

| Situace | Požadavek |
| --- | --- |
| Metodický claim | Odkaz na `/metodika/[section]` nebo interní model card |
| Datový claim | Odkaz / badge zdroje (`/zdroje-dat` nebo provenance) |
| Partner / externí URL | `ExternalLink` + `noopener noreferrer`; sponsored badge pokud placené |
| Právní / regulační text | Jen z PUBLISHED `LegalDocument` nebo counsel-approved fallback — ne z AI |
| Glossary termín | `/slovnik` + konzistentní definice (LTV, RPSN, NOI, IRR, ARV, …) |

### Citace AI

1. AI smí citovat **pouze** fakta dodaná do promptu (listing fields, user assumptions, methodology snippets).
2. Pokud si model „není jistý“, UI musí degradovat na „nedostatek podkladů“, ne halucinovat.
3. AI výstup nesmí obsahovat vymyšlené paragrafy zákonů, IČO, ani „garantované“ výnosy.

---

## 4. Kontextové disclaimery

`DisclaimerContext`: `valuation` | `financing` | `yield` | `location` | `general`.

Každý kontext má krátký, specifický disclaimer (ne generický wall of text v hero).  
Financing: indikace ≠ schválení bankou.  
Valuation: odhad ≠ znalecký posudek.  
Yield: závisí na předpokladech uživatele (nájem, vacancy, opex).

---

## 5. Editorial vs. produktový obsah

| Typ | Standard |
| --- | --- |
| Průvodce / články | Fakta s datem; žádné falešné autority; demo články mimo sitemap |
| Trust pages (`/o-nas`, `/duvera-a-bezpecnost`) | Do/Don’t; žádný fiktivní tým |
| Property SEO copy | Type · layout · m² · místo · asking — bez valuation mid v Offer |
| Admin / interní | Může obsahovat přesnější ops data; neleakovat do veřejného HTML |

---

## 6. Kontrola před publikací obsahu

- [ ] Třída tvrzení určena (fakt / odhad / AI)
- [ ] Žádná zakázaná certainty fráze
- [ ] Confidence + metodika u odhadů
- [ ] Citace / odkaz na zdroj
- [ ] JSON-LD bez AggregateRating
- [ ] Sponsored odděleno od organiky

Automatizace: `docs/SEO_REVIEW_CHECKLIST.md`, `src/content/trust.test.ts`, JSON-LD guard v `json-ld.tsx`.

---

## 7. Související

- `docs/TRUST_ARCHITECTURE.md`
- `docs/DATA_SOURCE_TRANSPARENCY.md`
- `docs/TONE_OF_VOICE.md`
- `docs/CONTENT_PATTERNS.md`
