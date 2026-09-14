# Route Map — Majetio.cz

Veřejné URL zůstávají české a stabilní. Route groups nemění cestu.

## Domů

| Route | Účel | Stav |
| --- | --- | --- |
| `/` | Homepage (IA struktura Prompt 4) | Implemented |

## Objevování

| Route | Účel | Stav |
| --- | --- | --- |
| `/nemovitosti` | Katalog + filtry (demo data) | Implemented |
| `/nemovitosti/[slug]` | Detail | Demo detail |
| `/nemovitosti/doporucene` | Doporučené | Preparing |
| `/nemovitosti/investicni-prilezitosti` | Investiční | Preparing / filtered |
| `/porovnani` | Porovnání | Empty state |
| `/porovnani/[id]` | Uložené porovnání | Not yet |

## Analýza a nástroje

| Route | Účel | Stav |
| --- | --- | --- |
| `/analyza` | Vstupní hub | Structure + forms |
| `/analyza/nova` | Nová analýza | Preparing |
| `/analyza/[id]` | Výsledek (soukromý) | Preparing, noindex |
| `/analyza/[id]/scenare` | Scénáře | Preparing |
| `/analyza/[id]/financovani` | Financování | Preparing |
| `/analyza/[id]/rekonstrukce` | Rekonstrukce | Preparing |
| `/analyza/[id]/lokalita` | Lokalita | Preparing |
| `/analyza/[id]/rizika` | Rizika | Preparing |
| `/kalkulacky` | Hub | Implemented |
| `/kalkulacky/*` | Jednotlivé nástroje | Preparing shell |

## Marketing a důvěra

| Route | Účel | Stav |
| --- | --- | --- |
| `/jak-to-funguje` | Proces | Content |
| `/cenik` | Ceník z konfigurace | Content |
| `/strategie`, `/strategie/[slug]` | Strategie | Content template |
| `/lokality`, `/lokality/[slug]` | Lokality | Structure / demo |
| `/metodika`, `/zdroje-dat`, `/majetio-skore` | Důvěra | Content stubs |
| `/jak-pocitame-vynos`, `/jak-odhadujeme-hodnotu` | Metodika výpočtů | Content stubs |
| `/pruvodce`, `/pruvodce/[slug]` | Obsahový hub | Hub + model |
| `/o-majetio`, `/kontakt`, `/partneri` | Společnost | Content stubs |
| `/hledat` | Interní hledání | Demo search, noindex |

## Právní

`/obchodni-podminky`, `/ochrana-osobnich-udaju`, `/cookies`, `/pravni-upozorneni`

## Auth

`/prihlaseni`, `/registrace`, `/zapomenute-heslo`, `/obnovit-heslo`, `/overeni-emailu` — noindex

## Účet (login)

`/ucet` (rozhodovací centrum), `/ucet/vyber` (alias shortlist), `/ucet/financni-profil`, `/ucet/financovani`, `/ucet/oblibene`, `/ucet/porovnani`, `/ucet/analyzy`, `/ucet/objednavky`, `/ucet/ulozena-hledani`, `/ucet/upozorneni`, `/ucet/nastaveni`, `/ucet/souhlasy`

## Admin (ADMIN / SUPER_ADMIN)

`/admin` + sekce: nemovitosti, analyzy, leady, objednavky, uzivatele, lokality, obsah, partneri, data-quality, nastaveni, audit-log

## API / Dev

| Route | Poznámka |
| --- | --- |
| `/api/health` | Health |
| `/api/auth/*` | Auth.js |
| `/dev/design-system` | Prod gated |

## Pravidla

- Filtry: query params (`?typ=byt&cena-do=…`), ne explodující URL strom
- Žádné falešné „živé“ nabídky
- CTA buď funguje, nebo je disabled / preparing
- Matice přístupu: `ROUTE_ACCESS_MATRIX.md`
