# Route Access Matrix — Majetio.cz

| Route | Účel | Přístup | Role | Index | Layout | Hlavní CTA | Stav |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Homepage | public | — | yes | site | Analyzovat | IA done |
| `/nemovitosti` | Katalog | public | — | yes | site | Filtry / detail | Demo |
| `/nemovitosti/[slug]` | Detail | public | — | yes* | site | Analyzovat | Demo |
| `/porovnani` | Porovnání | public | — | yes | site | Přidat nemovitosti | Empty |
| `/analyza` | Hub analýzy | public | — | yes | site | Začít | Structure |
| `/analyza/[id]/*` | Soukromá analýza | auth† | USER+ | no | site | Pokračovat | Preparing |
| `/kalkulacky/*` | Kalkulačky | public | — | yes | site | Spočítat‡ | Preparing |
| `/strategie/*` | Strategie | public | — | yes | site | Analyzovat | Content |
| `/lokality/*` | Lokality | public | — | yes | site | Nemovitosti | Structure |
| `/cenik` | Ceník | public | — | yes | site | Objednat / kontakt | Content |
| `/jak-to-funguje` | Proces | public | — | yes | site | Vyzkoušet | Content |
| `/pruvodce` | Hub | public | — | yes | site | Články | Hub |
| `/hledat` | Search | public | — | **no** | site | Výsledky | Demo |
| Legal / o nás | Info | public | — | yes | site | Kontakt | Stubs |
| `/prihlaseni` | Auth | guest | — | no | auth | — | Stub |
| `/registrace` | Auth | guest | — | no | auth | — | Stub |
| `/ucet/*` | Účet | auth | USER+ | no | account | Podle stránky | Shell |
| `/admin/*` | Admin | auth | ADMIN/SUPER_ADMIN | no | admin | — | Shell |
| `/dev/*` | Design system | gated | — | no | site | — | Dev |

\* Demo listing — indexovat opatrně; ne RealEstate schema s falešnými tvrzeními.  
† Middleware zatím chrání `/ucet` a `/admin`; soukromé analýzy budou vyžadovat auth ve Fázi auth/engine.  
‡ CTA disabled / preparing dokud není engine.

## Ochrana

1. **Middleware** (`src/middleware.ts`) — JWT edge check, safe `callbackUrl`
2. **Server guards** (`requireUser`, `requireRole`) — znovu na stránkách/API
3. **Headers** — `x-robots-tag: noindex` na účet/admin

## Open redirect

`getSafeCallbackUrl` — pouze relativní cesty začínající `/`, bez `//` a `://`.
