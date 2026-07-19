# SEARCH_FILTERS — URL schéma a UX filtrů

## URL schéma (české klíče)

| Param | Význam | Příklad |
| --- | --- | --- |
| `q` | fulltext | `?q=vinohrady` |
| `lokalita` | město / oblast | `?lokalita=praha` |
| `cena-od` / `cena-do` | CZK | `?cena-do=8000000` |
| `typ` | byt,dum,… (CSV) | `?typ=byt,dum` |
| `dispozice` | 2+kk,… | `?dispozice=2kk,3+kk` |
| `plocha-od` / `plocha-do` | m² | |
| `pozemek-od` / `pozemek-do` | m² | |
| `stav` | new,good,rekonstrukce,… | |
| `vlastnictvi` | osobni,druzstevni,… | |
| `energie` | A–G | |
| `strategie` | dlouhodoby-pronajem,… | |
| `kvalita` | overena,odhad,… | |
| `razeni` | nejnovejsi,doporucene,cena-… | `?razeni=doporucene` |
| `stranka` | page ≥ 1 | |

Round-trip: `parsePropertySearchParams` ↔ `serializePropertySearchParams` / `buildPropertySearchHref`.

## UX

- Desktop: hlavní filtry + postranní „Pokročilé“
- Mobile: sticky search + **bottom sheet** (`role="dialog"`, `aria-modal`, Escape zavírá, focus na close)
- Active chips: `ActiveFilterChips` — clear jednoho filtru bez ztráty ostatních
- Scroll restore po návratu z detailu (`scroll-restore.ts`)

## Normalizace

- Diakritika + fuzzy text (`text-match.ts`)
- Dispozice aliasy (`2kk` → `2+kk`)
- Typy mapovány na Prisma enums (`byt` → `APARTMENT`)

## SEO

Filtrované kombinace **neindexovat** — viz `seo-landings.ts` + `generateMetadata` na `/nemovitosti`.
