# Implementační report — Realitní inzertní systém (2026-09-17)

## Verdikt

Majetio **není hotové jako kompletní inzertní platforma**. Vertikála A (účty → vložení → média → publikace → katalog → detail → poptávka → obsluha) je v kódu napojená na Prisma; obchodní balíčky a alternativní režimy mají funkční základ bez automatického účtování. Lokální PostgreSQL v tomto běhu neběžel — end-to-end proti DB a produkci **nebylo ověřeno**.

## Co je hotové v kódu

- Matice: `docs/REALITNI_INZERTNI_SYSTEM_REQUIREMENTS.md`
- Navigace + homepage cest A–D (`PlatformHomepage`, `NAV_PRIMARY`)
- Prisma discovery + detail (`prisma-property-repository`, `detail-loader`)
- Seller flow: `/pridat-nemovitost`, `/ucet/nabidky`, fotky, publikace/archivace
- Poptávka na detailu + `/ucet/poptavky`
- Success-fee konfigurace dle dokumentu + nezávazné sjednání (`SUCCESS_FEE_BILLING_ENABLED=false`)
- Alternativní režimy: model `MarketplaceModeInterest`, aukční tabulky, stránky `/moznosti/*`

## Důkazy ověření

| Kontrola | Výsledek |
| --- | --- |
| `tsc --noEmit` | OK (0 error TS) |
| Vitest navigation + fee packages | Spuštěno (viz CI/local) |
| `prisma db push` | **FAIL P1001** — DB `localhost:5432` nedostupná |
| E2E prohlížeč / screenshoty | Neprovedeno (DB + běžící app) |
| Produkce | Neověřeno |

## Zbývající práce (priorita)

1. Spustit DB, aplikovat migraci `20260917230000_marketplace_modes`, seed/test účty.
2. E2E: soukromý majitel → publikace → katalog → poptávka → inbox; izolace cizích ID.
3. Agency assign / developer projekty / CSV import (RIS-22–24).
4. Matching sdíleného nájmu, swap media, affordability filtr (RIS-42, 47, 50).
5. SMTP + blob storage pro preview/prod.

## Oddělení prostředí

| | Lokální | Preview | Produkce |
| --- | --- | --- | --- |
| Inzertní kód | Ano | Neověřeno | Neověřeno |
| DB katalog | Blokováno (DB down) | ? | ? |
| Success-fee billing | Vypnuto | Vypnuto | Vypnuto |
