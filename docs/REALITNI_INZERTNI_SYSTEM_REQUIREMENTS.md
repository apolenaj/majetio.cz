# Realitní inzertní systém — matice požadavků

**Zdroj:** závazné zadání „Realitní inzertní systém“.  
**Stavy:** `chybí` · `pouze_rozhraní` · `implementováno` · `overeno_test` · `overeno_prod` · `blokovano`  
Mapování na report: overeno_test ≈ OVĚŘENO S DB / PROHLÍŽEČ; overeno_prod ≈ OVĚŘENO NA PRODUKCI.

Poslední aktualizace: **2026-09-18** (ověřený provoz vertikály A).

| ID | Požadavek | Současná implementace | Chybějící části | Akceptační scénář | Stav |
| --- | --- | --- | --- | --- | --- |
| RIS-01 | Registrace / přihlášení | NextAuth + seed uživatelé | — | Login owner/buyer | overeno_test |
| RIS-02 | Ověření e-mailu | Tokeny | SMTP doručení | — | blokovano — SMTP |
| RIS-03 | Obnova hesla | Flow + šablona | SMTP | — | blokovano — SMTP |
| RIS-05 | Draft inzerátu | `/pridat-nemovitost` | — | Uložit koncept | overeno_test |
| RIS-06 | Fotografie | local `/uploads` + S3 adaptér | S3 credentials na hostingu | Upload + HTTP 200 | overeno_test (local) / blokovano — prod S3 |
| RIS-07 | Publikace / archivace | Seller controls | — | ACTIVE→ARCHIVED pryč z katalogu | overeno_test |
| RIS-08 | Katalog filtry | Prisma discovery | — | Živé nabídky v UI | overeno_test |
| RIS-09 | Detail | Prisma detail-loader | — | Detail bez privateThreshold | overeno_test |
| RIS-10 | Poptávka | Form + createInquiry | Dedup double-submit | Inbox owner | overeno_test |
| RIS-11 | Správa nabídek / inbox | `/ucet/nabidky`, `/ucet/poptavky` | Odpověď/thread UI | Owner vidí poptávku | overeno_test |
| RIS-15 | IDOR | assertCanManageListing | — | B nemůže spravovat A | overeno_test |
| RIS-20/21 | Prodej / pronájem form | Seller form | — | E2E prodej | overeno_test |
| RIS-22–24 | RK assign / developer / import | Schéma částečně | UI + CSV seller | — | chybí / pouze_rozhraní |
| RIS-30/31 | Success-fee % | Config + `/cenik` | Billing základ | Nezávazné sjednání | implementováno |
| RIS-32 | Ledger po úspěchu | SuccessFeeRecord / Engagement | Private workflow | — | pouze_rozhraní |
| RIS-40–47 | Alt režimy | ModeInterest + stránky | Plné procesy z dokumentu | — | pouze_rozhraní / implementováno (základ) |
| RIS-60/61 | Homepage / nav | Platform homepage | — | A–D cesty | implementováno (bez redesignu) |
| RIS-70 | E2E rolí | Owner+buyer Playwright + vitest | Ostatní role | — | overeno_test (částečně) |
| RIS-71 | Produkce | — | S3, SMTP, migrate, deploy | — | blokovano |

## Blokátory

1. Docker Desktop / nativní Postgres služba v tomto prostředí chyběly → použit embedded PG.  
2. `prisma migrate deploy` greenfield: `AuditLog` po init migraci.  
3. Produkční object storage: chybí `S3_*`.  
4. SMTP.  
5. Právní/obchodní otázky success-fee / aukce / investice.

## Důkazy

Viz `docs/IMPLEMENTATION_REPORT_RIS_2026-09-18.md`.
