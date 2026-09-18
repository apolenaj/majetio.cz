# Implementační report — ověřený provoz inzertního základu (2026-09-18)

## Verdikt

Inzertní vertikála A je **OVĚŘENO S DB** a **OVĚŘENO V PROHLÍŽEČI** v izolovaném lokálním prostředí.  
**NASAZENO / OVĚŘENO NA PRODUKCI: ne.** Typecheck nestačí — důkazy níže.

Stavy: `IMPLEMENTOVÁNO` · `OVĚŘENO S DB` · `OVĚŘENO V PROHLÍŽEČI` · `NASAZENO` · `OVĚŘENO NA PRODUKCI`

---

## 1. Databáze

| Položka | Výsledek |
| --- | --- |
| Proč localhost:5432 | `.env` / CI / README očekávají PostgreSQL; CI service = `postgres:16` + `majetio/majetio` |
| Docker | **Není nainstalovaný** v tomto Windows prostředí |
| Winget PostgreSQL.16 | Spuštěn, ale instalace zůstala nekompletní (bez data dir / služby) |
| Proveditelné řešení | `embedded-postgres` (devDependency) + `scripts/dev-embedded-postgres.ts` + `docker-compose.yml` (pro Docker Desktop) |
| Schema | `prisma migrate deploy` na čistém clusteru **selhává** na migraci `20260718220000_auth_preferences_consent` (`AuditLog` neexistuje po `init`) → fallback **`prisma db push`** (dokumentováno v README jako prototypování) |
| Seed | `test.user@majetio.local`, `test.buyer@majetio.local` (syntetika) |

**Kroky:** start embedded PG (UTF-8) → db push → seed → `npm run dev` proti stejnému `DATABASE_URL`.

**Blokátor historických migrací:** opravný squash / fix pořadí `AuditLog` v migration chain (neblokuje lokální ověření přes db push; blokuje striktní `migrate deploy` na greenfield).

---

## 2. Fotografie (`/uploads/listings`)

| Otázka | Odpověď |
| --- | --- |
| Co to je | **Místní disk** pod `public/uploads/listings/{propertyId}/…`, URL `/uploads/listings/…` |
| Trvalost lokálně | Ano — soubor přežije refresh; ověřeno HTTP 200 |
| Vercel / ephemeral FS | **Nestačí** — adaptér `src/lib/storage/listing-media-storage.ts` volí `s3` nebo `unavailable` |
| Chybějící konfigurace produkce | `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` nebo `S3_REGION`, volitelně `S3_PUBLIC_BASE_URL`; balíček `@aws-sdk/client-s3` |
| Validace | MIME allowlist + velikost (existující `assertSafeUploadMeta`) |
| Oprávnění | `assertCanManageListing` před upload/delete |
| Titulní / pořadí | `isPrimary` + `sortOrder`; při smazání titulní se posune další |

Růžové karty v screenshotu = **1×1 testovací PNG** roztáhnutý (E2E pixel), ne chybějící soubor.

---

## 3–5. Ověřené cesty (důkazy)

### Majitel (syntetika)

| | |
| --- | --- |
| Prostředí | Lokální embedded PG + `next dev :3000` |
| Kroky | login → `/pridat-nemovitost` → koncept → foto → publikace → katalog |
| Výsledek | **PASS** Playwright `e2e/listing-owner-buyer-flow.spec.ts` test 1 |
| Oprava | Prázdný `privateThreshold` → Zod coerce `0` → fail; opraveno `z.preprocess(emptyToUndef, …)` |

### Zájemce → inbox

| | |
| --- | --- |
| Kroky | druhý browser context → detail → poptávka → owner `/ucet/poptavky` |
| Výsledek | **PASS** (test 2) |
| Izolace | Vitest: stranger nemůže edit/archive/photo; inbox jen owner |

### Oprávnění (server)

| Test | Výsledek |
| --- | --- |
| B neupraví A | PASS (integration) |
| B nepřidá/nesmaže foto A | PASS |
| B nečte poptávky A | PASS (`listSellerInquiries` / `getInquiryForAgent`) |
| Neveřejný práh mimo public DTO | PASS (JSON bez `privateThreshold`) |
| Archiv ≠ ACTIVE katalog | PASS |

Spuštění: `RUN_DB_INTEGRATION=1` → 7/7 vitest PASS.

### Prohlížeč

| | |
| --- | --- |
| Desktop katalog | `test-results/ris-catalog-desktop.png` — badge „Živé nabídky“, E2E + DEMO oddělené; cookie banner překrývá filtry |
| Mobil katalog | `test-results/ris-catalog-mobile.png` — hamburger, karty čitelné |
| Stav | **OVĚŘENO V PROHLÍŽEČI** (katalog); detail/manage screenshoty závisí na serial běhu celého E2E |

---

## 6. Storage / hosting shrnutí

| Prostředí | Driver | Stav |
| --- | --- | --- |
| Lokální persistent disk | `local` | OVĚŘENO S DB + prohlížeč |
| Vercel bez S3_* | `unavailable` (upload odmítnut s jasnou chybou) | IMPLEMENTOVÁNO (fail-closed) |
| Vercel + S3 | `s3` | IMPLEMENTOVÁNO, **neověřeno** (chybí credentials) |

---

## 7. Zbývá (matice)

- Agency assign, developer projekty, CSV import
- Alt režimy nad `MarketplaceModeInterest` (matching, protinabídky, historie)
- Oprava greenfield `migrate deploy`
- SMTP (neblokuje inbox)
- Produkční S3 + deploy ověření

## 8. Oddělení

| | Lokální | Preview | Produkce |
| --- | --- | --- | --- |
| Vertikála A | OVĚŘENO S DB + PROHLÍŽEČ | Neověřeno | Neověřeno |
| Success-fee billing | Vypnuto | Vypnuto | Vypnuto |
