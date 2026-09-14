# Phase 1 Production Audit — Infrastructure, Cron, Email, Integrations

**Datum:** 2026-07-22  
**Scope:** Environment & logs · Cron & jobs · Email · External integrations & AI  
**Režim:** Brutálně upřímný — chybějící věc = **FAIL**, ne „planned“  
**Zdroj pravdy:** codebase only (žádné vymyšlené DNS/SPF/Sentry)

---

## Verdikt Phase 1

| Oblast | Stav |
| --- | --- |
| Environment & logy | **FAIL** — žádná boot-time validace required env |
| Cron & jobs | **FAIL** — 1 scheduled job; 8+ operational scripts bez cronu; SystemJob tick neschedulovaný; stub workery |
| E-maily | **FAIL** — produkční send = silent no-op; žádný provider |
| Externí integrace | **FAIL** — žádný live PSP; HJ HTTP bez timeoutu; analytics/error tracker prod noop |
| AI | **N/A (ABSENT)** — žádný LLM runtime (není co guardrailovat) |

**Phase 1 celkově: NEPROŠLO — blokuje produkční launch.**

---

## 1. Environment a logy

### 1.1 Startup validace env

| Check | Výsledek | Evidence |
| --- | --- | --- |
| Zod / `createEnv` / `validateEnv` při startu | **FAIL — chybí** | Žádný match v `src/`; žádný `instrumentation.ts` |
| Fail-closed při bootu když chybí `DATABASE_URL` / `AUTH_SECRET` | **FAIL** | App se spustí; selže až při prvním DB/auth použití |
| Runtime fail-closed (lazy) | **PASS (částečně)** | Mock PSP/HJ/demo gated: `payments/config.ts`, `hypotekajasne/config.ts`, `demo-content-gate.ts` |
| Admin „configured?“ dashboard | **PASS (observability only)** | `config-center.ts` — neabortuje boot |

### 1.2 Required vs optional

**REQUIRED pro reálný prod deploy (de facto, není enforceováno při bootu):**

| Variable | Proč |
| --- | --- |
| `DATABASE_URL` | Prisma; GHA reconcile fail-loud |
| `AUTH_SECRET` | Auth.js / middleware JWT |
| `NEXT_PUBLIC_APP_URL` | Canonical links (jinak localhost / hardcode majetio.cz) |

**OPTIONAL (s defaulty / feature-off):**  
`AUTH_URL`, `AUTH_CREDENTIALS_ENABLED`, `HYPOTEKAJASNE_*`, `PAYMENTS_*`, feature flags, `ERROR_TRACKER*`, `UPSTASH_*`, `ALLOW_DEMO_PROPERTY_CONTENT`, `ANALYTICS_PROVIDER`, market overrides.

**Gaps v `.env.example` (použito v kódu, chybí v example):**  
`ALLOW_DESIGN_SYSTEM`, `HYPOTEKAJASNE_SIGNING_SECRET`, `HYPOTEKAJASNE_WEBHOOK_SECRET`, `HYPOTEKAJASNE_AUTH_MODE`, `HYPOTEKAJASNE_STORE`, `NEXT_PUBLIC_SITE_URL`, `APP_URL`, `NEXT_PUBLIC_I18N_CACHE_VERSION`.

**Falešné / aspirativní klíče v config-center (nejsou v send/payment path):**  
`STRIPE_*`, `RESEND_API_KEY`, `S3_SECRET_ACCESS_KEY`, `OPENAI_API_KEY` — status list jen, **žádný consumer**.

### 1.3 Production debug

| Check | Výsledek |
| --- | --- |
| `logger.debug` vypnutý v production | **PASS** — `logger.ts` |
| Prisma logs prod = `["error"]` only | **PASS** — `src/lib/db/index.ts` |
| Dedicated `LOG_LEVEL` / `DEBUG` env | **ABSENT** (ne nutně FAIL, ale žádná provozní kontrola) |
| Design system `/dev` v prod | Hatch `ALLOW_DESIGN_SYSTEM` — OK pokud unset |

### 1.4 Source maps

| Check | Výsledek |
| --- | --- |
| `productionBrowserSourceMaps` v `next.config.ts` | **ABSENT** — spoléhá na Next default (client maps typicky off) |
| Explicitní server source-map policy | **ABSENT** |
| Verdikt | **PASS s výhradou** — není nebezpečně zapnuto; není dokumentováno/ověřeno v CI |

### 1.5 Production logging levels

| Level | Prod chování |
| --- | --- |
| error / warn / info | JSON na console |
| debug | potlačen |
| PII/secret redaction | **PASS** |
| Error tracker prod default | **FAIL provozně** — noop dokud není `ERROR_TRACKER_WEBHOOK_URL` |

---

## 2. Cron & Jobs

### 2.1 Schedulery v repu

| Mechanismus | Stav |
| --- | --- |
| GitHub Actions `schedule` | **1** — `revenue-reconcile.yml` `15 3 * * *` (**UTC**) |
| `vercel.json` crons | **ABSENT** |
| fly/railway/crontab | **ABSENT** |

### 2.2 Inventář jobů

| ID | Účel | Frekvence (zamýšlená) | Owner | Schedule | Idempotence | Failure handling |
| --- | --- | --- | --- | --- | --- | --- |
| REV-1 | Payments ↔ entitlements ↔ ledger reconcile | Daily 03:15 UTC | Revenue | **SCHEDULED** | Dry-run read; repair explicit | Exit 1; alert rule documented |
| ALERT-1 | Digest e-maily | Daily/weekly | Notifications | **MISSING** | UTC batch keys | Counts; sender = stub |
| ALERT-2 | Retry alert e-mailů | Periodic | Notifications | **MISSING** | Retry rows | Max 5 → SUPPRESSED |
| BOOST-1 | Expire listing boosts | Cron | Promotions | **MISSING** | Safe re-run by `endsAt` | Exit 1; no DLQ |
| HJ-1 | Mortgage rate ingest | Daily | Financing | **MISSING** | `runId: daily-YYYY-MM-DD` | Exit 1 |
| HJ-2 | Retry mortgage lead submit | Periodic | Leads | **MISSING** | Lead idempotency module | Limit 50; exit 1 |
| LOC-1/2/3 | Location aggregate / refresh / anomaly | Periodic | Locations | **MISSING** | Idempotency keys | Exit 1 |
| OPS-1 | `SystemJob` worker tick | Continuous/cron | Operations | **MISSING** | Claim status flip | Retry + DLQ **if ticked** |
| OPS-2 | Property recalc/eval | On demand | Ops | Depends on OPS-1 | Queue | DLQ path |
| FX ingest | Live rates | — | FX | **DEFERRED / MISSING** | — | Docs only |
| Property freshness cron | Listing freshness | — | Properties | **MISSING** | Helpers only | Unwired |

**Timezone:** všechny crony/komentáře = **UTC**. Europe/Prague cron config **ABSENT**.

### 2.3 Idempotence & duplicity

| Nález | Severity |
| --- | --- |
| Location / digest / boost expire — rozumná idempotence | OK |
| SystemJob enqueue **bez** payload-hash dedupe → duplicitní QUEUED možné | **FAIL (medium)** |
| `PROPERTY_MERGE` / `MODEL_SHADOW_EVAL` / `GENERIC` tick → `completeSystemJob` **bez práce** (false success) | **FAIL** |
| Komentáře „wire to Vercel Cron“ bez `vercel.json` | **FAIL (ops gap)** |

### 2.4 Failure handling

- SystemJob: transient classifier + DLQ + admin requeue — **PASS architecture**, **FAIL operations** (tick není scheduled → fronta se nezpracuje).
- Alert email retry script — **PASS code**, **FAIL schedule**.
- Jediný scheduled job: revenue reconcile — **PASS**.

---

## 3. E-maily

### 3.1 Provider & send path

| Check | Výsledek |
| --- | --- |
| Resend / SES / SMTP / Nodemailer v `package.json` | **ABSENT** |
| `logEmailInDev` v production | **Early return — nic se neodešle** (`templates.ts`) |
| Alert `defaultAlertEmailSender` | Log + `{ ok: true }` — **fake success** |
| `RESEND_API_KEY` | Jen config-center list — **nepoužito** |

**Verdikt: produkční transakční e-mail = FAIL (silent no-op).**

### 3.2 Šablony (existují)

- `passwordResetEmail`, `emailChangeConfirmEmail`, `welcomeEmail`, `mortgageLeadStatusUpdatedEmail`
- Alert instant/digest templates

Policy deklaruje `order_receipt` / `security_alert` — **šablony ABSENT** (drift).

### 3.3 Produkční domény v odkazech

| Call site | Base URL |
| --- | --- |
| Auth reset/welcome | `AUTH_URL ?? NEXT_PUBLIC_APP_URL ?? http://localhost:3001` |
| Layout / payments | často `…3000` |
| Lead status | `NEXT_PUBLIC_APP_URL ?? https://majetio.cz` |
| Alerts CLI | `NEXT_PUBLIC_SITE_URL` / `https://majetio.cz` |

**FAIL:** nekonzistentní fallbacky (3000 vs 3001); riziko localhost linků pokud env chybí.

### 3.4 Failure handling

| Path | Retry | Bounce |
| --- | --- | --- |
| Alert emails | DB retry max 5 → SUPPRESSED | **ABSENT** |
| Auth / welcome / reset | **ABSENT** | **ABSENT** |

### 3.5 Unsubscribe & marketing

| Check | Výsledek |
| --- | --- |
| Transactional nevyžaduje marketing consent | **PASS** (`transactional-policy.ts`) |
| Marketing vyžaduje consent | **PASS** (policy) |
| Checkout zakazuje marketing bundling | **PASS** |
| Unsubscribe **link v e-mailu** | **ABSENT** |
| Marketing campaign sender | **ABSENT** (prefs existují, send ne) |

Unsubscribe jen u marketingu: **policy OK**, ale marketing send pipeline neexistuje → prakticky N/A.

### 3.6 SPF / DKIM / DMARC

**ABSENT v repu** (žádné DNS/terraform/docs s reálným configem).  
**Nereportujeme jako PASS.** Stav: **neověřeno / není v codebase** — před launch musí existovat u e-mail providera + DNS (mimo repo).

---

## 4. Externí integrace & AI

### 4.1 Inventory

| Integrace | Provider | Účel | Auth | Timeout | Retry | Failover / SPOF |
| --- | --- | --- | --- | --- | --- | --- |
| Payments | `none` / `mock` only | Checkout, webhooks | `PAYMENTS_*` HMAC | N/A (mock) | Webhook idempotency + reconcile | **SPOF: žádný live PSP** |
| HypotekaJasne | HTTP / mock | Offers, leads, webhooks | Bearer/signed | **MISSING na HTTP fetch** | Lead job backoff max 5 | Mock prod-forbidden; live API = SPOF financování |
| Email | **None** | Transactional/alerts | — | — | Alert queue only | **Total gap** |
| Upstash | Redis REST | Rate limit | URL+token | SDK | — | Fallback memory = multi-instance SPOF |
| Analytics | noop / console | Product events | — | — | — | Prod noop |
| Error tracker | webhook / noop | Exceptions | HTTPS webhook | **MISSING** | swallow errors | Prod silent default |
| Object storage | **None** | KYC keys metadata | aspirational S3 key | — | — | Keys without storage client |
| Maps | In-app SVG | Location | — | — | — | No Mapbox (OK) |
| Outbound webhooks | Customer URLs | Location alerts | SSRF `safeFetch` | **8s** | — | OK pattern |
| Postgres | Prisma | Core | `DATABASE_URL` | — | Job transient | Primary SPOF (expected) |

### 4.2 Failovery

| Oblast | Stav |
| --- | --- |
| Payments multi-PSP | **ABSENT** |
| Email secondary provider | **ABSENT** |
| HJ timeout + circuit breaker | **ABSENT** (timeout) |
| Rate-limit multi-instance bez Upstash | **WEAK** (memory) |

### 4.3 AI služby

| Check | Výsledek |
| --- | --- |
| OpenAI / Anthropic / AI SDK v dependencies | **ABSENT** |
| Runtime LLM call sites | **ABSENT** |
| Cost guardrails / rate / structured output / hallucination fallback | **N/A** — není AI path |
| `OPENAI_API_KEY` v config-center | Aspirativní — **žádný consumer** |

**AI: ABSENT. Nehalucinuje při výpadku, protože se nevolá. Není to PASS capability — je to nepřítomnost.**

---

## 5. Co prošlo (PASS)

1. Runtime mock/demo fail-closed gates (payments, HJ, demo content).  
2. Logger PII redaction + debug off v production.  
3. Prisma prod log level omezený.  
4. Browser source maps nejsou explicitně zapnuté.  
5. Revenue reconcile **scheduled** + fail-loud bez `DATABASE_URL`.  
6. SystemJob model: retry/DLQ/requeue (architektura).  
7. Location/digest idempotency helpers.  
8. Transactional vs marketing consent policy (kód).  
9. Checkout nevnucuje marketing.  
10. HJ response Zod schemas + webhook signing/IP RL.  
11. Payment webhook signature + amount guards (z dřívějších fixů).  
12. SSRF `safeFetch` s timeoutem na market alert webhooks.  
13. AI runtime nepřítomen → žádný LLM cost leak.

---

## 6. Co vyžaduje FIX před spuštěním (ordered)

### P0 — launch blockers

| # | Fix |
| --- | --- |
| P0-1 | **Boot-time env validation** — fail start když chybí `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (prod). |
| P0-2 | **Wire live e-mail provider** — auth reset/welcome/change + alerts musí reálně odesílat; odstranit fake `{ ok: true }` v prod. |
| P0-3 | **Live payment provider** — `PAYMENTS_PROVIDER` ≠ mock/none v prod. |
| P0-4 | **Schedule operational crons** — minimálně: SystemJob tick, alert digest, alert email retry, boost expire, HJ rate ingest, HJ lead retry, location aggregate/refresh (nebo explicitní risk-accept + feature-off). |
| P0-5 | **Canonical URL env** — jednotný `NEXT_PUBLIC_APP_URL` / `AUTH_URL`; žádný localhost fallback v production build. |

### P1 — must before GA traffic

| # | Fix |
| --- | --- |
| P1-1 | HJ HTTP adapter: **timeout + AbortController**. |
| P1-2 | Error tracker: prod webhook/Sentry **povinný** před GA (ne noop). |
| P1-3 | SystemJob stubs: MERGE/SHADOW/GENERIC nesmí hlásit SUCCEEDED bez práce (nebo vypnout enqueue). |
| P1-4 | SPF/DKIM/DMARC u e-mail domény (mimo repo, ověřit u DNS + provider). |
| P1-5 | Bounce/suppression handling pro e-mail. |
| P1-6 | Upstash (nebo ekvivalent) pro multi-instance rate limit. |
| P1-7 | Dokončit `.env.example` + odstranit/označit aspirativní `STRIPE_/RESEND_/OPENAI_/S3_` dokud nejsou wired. |
| P1-8 | Object storage client pokud KYC uploady mají fungovat end-to-end. |

### P2 — harden

| # | Fix |
| --- | --- |
| P2-1 | List-Unsubscribe header/link pro marketing (až bude send). |
| P2-2 | SystemJob enqueue idempotency key. |
| P2-3 | Explicit `productionBrowserSourceMaps: false` + CI assert. |
| P2-4 | Dokumentovat Europe/Prague vs UTC pro digest (user-facing „daily“). |
| P2-5 | Implementovat nebo smazat `order_receipt` / `security_alert` policy kinds. |

---

## 7. Sign-off Phase 1

| Role | Verdikt |
| --- | --- |
| Infra auditor | **FAIL** |
| Ready for Phase 2 (app/product)? | Jen s vědomím, že **e-mail, crony a PSP jsou produkčně rozbité/neúplné** |

**Jednou větou:** Majetio má solidní fail-closed *zámky* a job *infrastrukturu*, ale **chybí boot env gate, živý e-mail, živý PSP a téměř všechny crony** — to není „téměř hotovo“, to je **ne-launch** pro Phase 1.
