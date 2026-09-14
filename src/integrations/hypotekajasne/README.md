# HypotekaJasne integration (Prompt 13)

Clean integration layer between **Majetio.cz** and **HypotekaJasne.cz**.

## Responsibility split

| Majetio | HypotekaJasne |
|---------|---------------|
| Property, investment analysis, orientační financing | Mortgage products, live rates, RPSN, application |
| Investment Engine (annuity, IRR, yields) | Real underwriting & offers |

## Layout

```
integrations/hypotekajasne/
  client/          HypotekaJasneClient interface + factory
  schemas/         Canonical MortgageOffer + external wire types
  adapters/        Dev adapter (demo) + HttpHypotekaJasneAdapter (production)
  pipeline/        Rate ingestion: fetch → validate → normalize → …
  service/         Ingestion service + in-memory / Prisma store
  jobs/            Daily scheduled ingestion
  config.ts        Env-driven configuration
  integration-status.ts  Runtime snapshot for health checks
```

## Adapters

| Adapter | When | `isLive` |
|---------|------|----------|
| `DevHypotekaJasneAdapter` | Default local/dev | `false` |
| `HttpHypotekaJasneAdapter` | `HYPOTEKAJASNE_ENABLED=true` + API URL | `true` |

Production HTTP adapter never fakes partner data. On outage, UI uses **verified cache** — never `0`.

## Data tiers

- **live** — fetched today from live partner feed
- **cached** — stored snapshot, may be stale
- **verified** — last human/partner verified rate (fallback on outage)

Never show `0` on source failure — use **„Poslední ověřená sazba (datum)“**.

## Daily job

```bash
npm run hj:ingest-rates
```

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `HYPOTEKAJASNE_USE_MOCK` | `true` (when not enabled) | Dev adapter with demo offers |
| `HYPOTEKAJASNE_ENABLED` | `false` | Enable live HTTP client |
| `HYPOTEKAJASNE_API_URL` | — | Partner API base URL (required for live) |
| `HYPOTEKAJASNE_API_KEY` | — | Bearer token (server env only) |
| `HYPOTEKAJASNE_SIGNING_SECRET` | — | HMAC signing for outbound + webhooks |
| `HYPOTEKAJASNE_WEBHOOK_SECRET` | signing secret | Inbound webhook verification |
| `HYPOTEKAJASNE_AUTH_MODE` | `bearer_and_signed` when secret set | `bearer` / `signed` / `bearer_and_signed` |
| `HYPOTEKAJASNE_WEBHOOK_TOLERANCE_SECONDS` | `300` | Replay protection window |
| `HYPOTEKAJASNE_STORE` | `memory` (dev) / `prisma` (prod) | Offer persistence |

## Security (Part 6)

- Lead DTO includes `schemaVersion` — bump on breaking wire changes
- PII only in HTTPS POST body — never URL query params
- Outbound: Bearer + optional HMAC headers (`x-majetio-signature`, `x-majetio-timestamp`)
- Inbound webhook: `POST /api/integrations/hypotekajasne/webhook`
  - Events: `lead.received`, `lead.status_changed`, `lead.completed`
  - Signature verification + `eventId` idempotency
- Submission failure: `SUBMISSION_PENDING` + exponential retry (`npm run hj:retry-submissions`)
- Dead letter after 5 attempts — lead retained, admin notified via audit log

## UI surfaces (Part 5)

- `/kalkulacky/financovani` — standalone calculator + consent flow
- `/analyza/[id]/financovani` — analysis tab with `analysisId` context
- `/nemovitosti/[slug]` — Decision Cockpit financing section (full calculator)
- `/api/health` — includes `integrations.hypotekajasne` status snapshot

## Consent before lead

Lead creation requires 4-step `DataSharingPreview` wizard + `MORTGAGE_LEAD_DATA_TRANSFER` consent.
See `src/lib/privacy/mortgage-lead-transfer.ts`.
