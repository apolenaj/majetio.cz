# External Dependency Register — Majetio.cz

**Owner:** SRE / Tech Lead  
**Last verified against code:** 2026-07-22 (Phase 5)  
**Related:** `docs/PRODUCTION_RUNBOOK.md` · `docs/FEATURE_STATUS_MATRIX.md` · `.env.example`

| Provider / system | Purpose | Integration status | Fallback | Owner |
| --- | --- | --- | --- | --- |
| **PostgreSQL** (Neon/Supabase/RDS/etc.) | Primary datastore (Prisma) | **Required** — app fails without it | None; `/api/ready` 503 | SRE |
| **Auth.js / NextAuth** | Sessions, credentials | **In-repo library** | Credentials can be disabled via env | Auth |
| **Hosting (Vercel-class / Node)** | Serve Next.js | Assumed ops choice | Redeploy previous SHA | SRE |
| **GitHub Actions** | CI (`ci.yml`) + nightly `revenue-reconcile.yml` | **Active** in repo | Manual `npm run revenue:reconcile` | SRE |
| **Payment PSP** | Card checkout | **ABSENT** — only `none`/`mock` | Checkout refuses paid when `none`; mock fail-closed in prod | Commerce |
| **HypotekaJasne** | Mortgage offers / lead handoff | **Dev adapter default**; HTTP adapter gated | Demo/dev rates; UI fail-soft | Financing |
| **Transactional email** (Resend/etc.) | Welcome, reset, alerts | **ABSENT** — templates + log/noop | No delivery; aspirational `RESEND_API_KEY` in config-center only | Ops |
| **Object storage (S3-class)** | KYC / uploads metadata | Aspirational keys in config-center; paths expect storage | Block uploads if down | Privacy / SRE |
| **Upstash Redis** | Distributed rate limit | **Optional** | In-memory limiter | Security |
| **Error tracker webhook** | Exception / SEV notify | **Optional** HTTPS URL | Prod noop | SRE |
| **Analytics vendor** | Product analytics | **ABSENT** — first-party `track()` → noop/console | Console in dev | Analytics |
| **Uptime / synthetics vendor** | External probes | **Not in code** — configure externally | Manual curl `/api/ready` | SRE |
| **DNS / CDN / TLS** | Public HTTPS | Platform | Apex→www redirect in middleware (prod) | SRE |
| **AI / LLM APIs** | — | **ABSENT** | N/A | — |

### Secrets policy

- Never commit real secrets.  
- Config Center (`/admin/nastaveni`) shows **configured / not configured only**.  
- Aspirational keys (`STRIPE_*`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `S3_*`) must not be read as “wired.”

### Webhook endpoints (inbound)

| Path | Dependency | Security |
| --- | --- | --- |
| `/api/payments/webhook` | Future PSP / mock | HMAC + timestamp + IP RL |
| `/api/integrations/hypotekajasne/webhook` | HJ | Signed payload + IP RL |
| `/api/payments/mock-complete` | Dev mock only | Forbidden unless mock allowed |

Public base URL for callbacks: `getPublicAppUrl()` — refuses localhost in production-like env.
