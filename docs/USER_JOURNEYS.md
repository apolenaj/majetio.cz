# User Journeys — Majetio.cz

## Cesta A — Investiční nemovitost

| | |
| --- | --- |
| **Vstup** | Homepage CTA / Nemovitosti |
| **Motivace** | Najít a ověřit investiční nabídku |
| **Kroky** | `/` → `/nemovitosti` → filtry → detail → `/analyza` → `/porovnani` → financování → `/cenik` |
| **Opouštění** | Prázdné filtry, nedůvěra k odhadu, cena analýzy |
| **Fallback** | Empty state filtrů, metodika, kontakt |
| **Konverze** | Objednávka kompletní analýzy / pokračování ve scénářích |

## Cesta B — Uživatel má URL inzerátu

| | |
| --- | --- |
| **Vstup** | `/analyza` — vložení URL |
| **Motivace** | Rychle ověřit konkrétní inzerát |
| **Kroky** | Homepage → Analýza → URL form → (budoucí import) → základní analýza → kompletní / financování |
| **Opouštění** | Import zatím disabled — musí být jasně sděleno |
| **Fallback** | Ruční zadání / katalog demo |
| **Konverze** | Dokončená analýza / objednávka |

## Cesta C — Vlastní bydlení

| | |
| --- | --- |
| **Vstup** | `/strategie/vlastni-bydleni` |
| **Motivace** | Bezpečná koupě bydlení |
| **Kroky** | Strategie → nemovitosti → detail → financování → porovnání → `/kontakt` |
| **Opouštění** | Složitost hypotéky |
| **Fallback** | HypotekaJasne odkaz + ceník pomoci s koupí |
| **Konverze** | Konzultace / analýza |

## Cesta D — Rekonstrukce

| | |
| --- | --- |
| **Vstup** | Detail nemovitosti / strategie rekonstrukce |
| **Motivace** | Zjistit, zda se rekonstrukce vyplatí |
| **Kroky** | Detail → scénář rekonstrukce → náklady → hodnota → max. nabídková cena → kompletní analýza |
| **Opouštění** | Nejistota nákladů |
| **Fallback** | Kalkulačka rekonstrukce (shell) + ceník |
| **Konverze** | Profesionální analýza |

## Cesta E — Financování

| | |
| --- | --- |
| **Vstup** | Detail / analýza / kalkulačka financování |
| **Motivace** | Orientační splátka a LTV |
| **Kroky** | Orientační výpočet → souhlas → HypotekaJasne.cz |
| **Opouštění** | Obava ze sdílení dat |
| **Fallback** | Kalkulačka bez předání + právní text |
| **Konverze** | Soft lead do HypotekaJasne |

## Cesta F — Vracející se uživatel

| | |
| --- | --- |
| **Vstup** | `/prihlaseni?callbackUrl=…` |
| **Motivace** | Pokračovat v práci |
| **Kroky** | Login → `/ucet` → oblíbené / analýzy → pokračování |
| **Opouštění** | Auth ještě není dokončené (stub) |
| **Fallback** | Info o připravovaném přihlášení + safe callback |
| **Konverze** | Návrat na původní chráněnou stránku |
