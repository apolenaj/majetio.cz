# Domain: Leads

Mortgage lead orchestration for HypotekaJasne handoff (Prompt 13/5–10).

## Structure

```
domains/leads/
  schemas/mortgage-lead.ts     HypotekaJasneLeadPayload + status DTOs
  service/
    mortgage-lead-service.ts   createLead, submitLead, getLeadStatus
    context-snapshot.ts        Immutable lead context (13/10)
    lead-linking.ts            Post-auth lead claim (13/10)
    privacy-guards.ts          Safe audit/analytics meta (13/10)
    retention.ts               PII redaction + purge policy (13/10)
    attribution.ts             Funnel source parsing
    correlation-id.ts          External-safe ml_* tokens
    idempotency.ts             Dedupe window + idempotency keys
    workflow.ts                Strict status transitions
```

## Docs

- [MORTGAGE_LEAD_FUNNEL.md](../../docs/MORTGAGE_LEAD_FUNNEL.md)
- [MORTGAGE_LEAD_RETENTION.md](../../docs/MORTGAGE_LEAD_RETENTION.md)

## Data model

- `Lead` — CRM record with attribution, partner, consentId, correlationId, retention
- `MortgageLeadProfile` — sensitive financial fields + workflow status
- `MortgageLeadContextSnapshot` — **immutable** context at creation (13/10)

`APPROVED` workflow status is reserved for real bank credit approval only.

## Idempotency

Same user + property/analysis within 72h → duplicate message in UI.
Same idempotency key on retry → returns existing lead without double submit.
Guest keys use normalized email instead of userId.
