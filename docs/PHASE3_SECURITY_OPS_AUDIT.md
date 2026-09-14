# Phase 3 Production Audit — Security, Concurrency, Ops Cleanliness

**Datum:** 2026-07-22  
**Scope:** DB concurrency · chaos/recovery · seeds/localhost · retention · webhook/IDOR/XSS/SSRF · super-admin bootstrap  
**Režim:** Report + izolované P1/P2 fixy  
**Související:** `docs/PHASE1_INFRA_AUDIT.md` · `docs/PHASE2_FRONTEND_AUDIT.md` · `docs/DISASTER_RECOVERY.md`

---

## Verdikt Phase 3

| Oblast | Stav po fixech |
| --- | --- |
| Concurrency / idempotence | **PASS** po fixech (webhook claim, merge claim, promo cap, checkout idem key) |
| Chaos / maintenance | **PASS** po fixech (`MAINTENANCE_MODE` + `global-error` + kill.payments wired) |
| Seed / localhost hygiene | **PASS** po fixech (prod refuse, `getPublicAppUrl`) |
| Retention / cleanup | **PARTIAL** — skript + npm script; cron schedule stále ABSENT (ops) |
| Webhook / IDOR / XSS / SSRF | **PASS** (regresní kontrakty 20.7 + Phase 3); residual viz níže |
| Super-admin bootstrap | **PASS** — CLI force-gated; veřejná registrace = USER only |

**Phase 3 kódové P1/P2:** opraveny. Launch Gate zůstává **NO-GO** kvůli Phase 1 (mail/PSP/cron) + L-01/L-02.

---

## 1. Concurrency a databáze

### Idempotentní operace (zdokumentováno)

| Operace | Mechanismus |
| --- | --- |
| Payment webhook | Unique `(provider, eventId)` + atomic `updateMany` claim na `processedAt: null`; clear claim on failure |
| Checkout order | `Order.idempotencyKey` unique; UI key ve `sessionStorage` (ne nový UUID per click) |
| Property merge | Claim `PropertyDuplicateCandidate` `PENDING` → `MERGED` přes `updateMany` |
| Promo redemption | Atomic `redemptionCount` increment s `lt: maxRedemptions` ve stejné transakci jako Order |
| Favourites create | Unique `(userId, propertyId)` + catch `P2002` |
| Free checkout grant | Entitlement grant paths remain idempotent (existující) |

### Nálezy → fixy

| ID | Nález | Stav |
| --- | --- | --- |
| C-01 | Webhook TOCTOU (dva workery) | **FIXED** — claim `processedAt` |
| C-02 | Merge bez PENDING claim | **FIXED** |
| C-03 | Checkout UI nový UUID každý click | **FIXED** — `sessionStorage` |
| C-04 | Promo `maxRedemptions` race | **FIXED** — atomic claim v transakci |
| C-05 | Favourites check-then-create | **FIXED** — P2002 tolerant |
| C-06 | `kill.payments` FeatureFlag newired | **FIXED** — `create-order` |
| C-07 | Usage metering race | **OPEN P3** — mimo Phase 3 scope |

---

## 2. Chaos a recovery

| ID | Nález | Stav |
| --- | --- | --- |
| R-01 | Žádný maintenance mode | **FIXED** — `MAINTENANCE_MODE` + middleware 503 HTML |
| R-02 | Chyběl `global-error.tsx` | **FIXED** |
| R-03 | Segment `error.tsx` existoval | **PASS** (graceful copy) |
| R-04 | Payments kill switch jen in-memory market | **FIXED** — DB `kill.payments` + market pause |
| R-05 | DR runbook | **PASS** — `docs/DISASTER_RECOVERY.md` |

Bypass při údržbě: `/api/ready`, `/api/health`, `/admin`, `/prihlaseni`, `/api/auth`, static assets.

---

## 3. Datová čistota

| ID | Nález | Stav |
| --- | --- | --- |
| D-01 | Seed demo bez prod refuse | **FIXED** — `ALLOW_DEMO_SEED` only |
| D-02 | `seed-test-user` tiskne `TestUser1!` | **FIXED** — hard refuse v production |
| D-03 | Localhost fallback v auth/payments/layout | **FIXED** — `src/lib/app-url.ts` |
| D-04 | Test data v DB | **TOOL** — `npm run db:purge-test-data` (gated) |

---

## 4. Retention a čištění

| Artefakt | Politika | Stav |
| --- | --- | --- |
| Expired `Session` | Smazat `expires < now` | **Skript** `db:cleanup-retention` |
| Expired `VerificationToken` | Smazat | **Skript** |
| `PaymentWebhookEvent` processed | Default 90 dní | **Skript** |
| `SystemJob` SUCCEEDED/CANCELLED | Default 30 dní | **Skript** |
| Requeued DLQ | Default 90 dní | **Skript** |
| Listing boosts | `boosts:expire` | **PASS** (existující) |
| Checkout sessions | Mock PSP ephemeral; žádná DB tabulka | N/A |
| Temporary upload files | Object storage — purge mimo app scope | **ABSENT app job** |
| Cron schedule pro cleanup | GitHub Action / host cron | **ABSENT** — naplánovat ops |
| Backup politika | Managed Postgres ≤24h RPO v DR | **DOCUMENTED** |

### Rychle rostoucí tabulky (riziko)

- `PaymentWebhookEvent`, `SystemJob` / `SystemJobDeadLetter`, `AuditLog`, listing analytics / metric events  
- Mitigace: retention skript + indexy již na `createdAt` / `processedAt`

---

## 5. Bezpečnost

| ID | Check | Stav |
| --- | --- | --- |
| S-01 | Webhook success/cancel URL = public domain | **PASS** po `getPublicAppUrl` (ne localhost v prod) |
| S-02 | Mock complete / dev helpers fail-closed | **PASS** — `isPaymentsMockAllowed` |
| S-03 | `/dev` v produkci | **PASS** — middleware redirect |
| S-04 | Veřejná admin registrace | **PASS** — `role: USER` always |
| S-05 | Super-admin bootstrap | **PASS** — `db:bootstrap-admin` force gates + 16+ char |
| S-06 | Webhook signature + IP RL | **PASS** (20.7 regresní testy) |
| S-07 | IDOR ownership | **PASS** (existující security suite) |
| S-08 | XSS sanitize / CSP nonce | **PASS** (middleware CSP enforce prod) |
| S-09 | SSRF outbound | **PASS** (ssrf.ts + 20.7) |

---

## Izolované fixy (soubory)

- `src/domains/payments/service/webhook-handler.ts` — atomic claim  
- `src/domains/properties/admin/merge-service.ts` — PENDING claim + error map  
- `src/domains/orders/service/create-order.ts` — kill.payments, maintenance, promo claim TX  
- `src/components/checkout/checkout-wizard.tsx` — stable idempotency key  
- `src/lib/app-url.ts`, `src/lib/maintenance.ts`  
- `src/middleware.ts` — maintenance 503  
- `src/app/global-error.tsx`  
- `src/integrations/payments/config.ts`, auth/settings/layout/site-origin  
- `src/domains/favourites/service/favourite-service.ts` — P2002  
- `scripts/seed-*.ts`, `bootstrap-admin.ts`, `cleanup-retention.ts`, `purge-test-data.ts`  
- `src/lib/security/phase3-security-ops-regression.test.ts`

### npm skripty
- `db:bootstrap-admin`
- `db:cleanup-retention`
- `db:purge-test-data`

---

## Zbývá (ops / mimo kód)

1. Naplánovat cron: `npm run db:cleanup-retention` (denně) + existující `revenue:reconcile`  
2. Nastavit produkční `NEXT_PUBLIC_APP_URL=https://www.majetio.cz` + webhook secrets  
3. Super-admin jen přes bootstrap / existující admin promote — nikdy seed  
4. Phase 1: reálný e-mail + PSP (Launch Gate)

**Phase 3 verdikt:** kódové P1/P2 **PASS**; celkový Launch Gate stále **NO-GO** (infra Phase 1).
