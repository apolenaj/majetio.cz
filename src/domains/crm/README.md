# Domain: crm

Internal CRM pipeline + marketplace qualified leads.

## Pipeline (`Lead` / `LeadActivity` / `LeadAssignment`)

- Statuses: NEW → CONTACTED → IN_PROGRESS → QUALIFIED → WON/LOST/HANDED_OFF
- Timeline via `LeadActivity` (`STATUS_CHANGE`, `INTERNAL_NOTE`, `ROUTING`, …)
- Routing: mortgages → HypotekaJasne, inquiries → listing agent, audits → analysts
- XSS-safe notes: `sanitizeCrmPlainText`
- RBAC: agent / agency manager / system admin

## Marketplace

Inquiry vs QualifiedBuyerLead — see `docs/MARKETPLACE_LEADS.md`

## Docs

- `docs/CRM_PIPELINE.md`
- Mortgage handoff: `docs/MORTGAGE_LEAD_FUNNEL.md`
