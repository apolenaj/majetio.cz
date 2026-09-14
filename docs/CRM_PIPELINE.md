# CRM_PIPELINE

Interní CRM pipeline pro správu vztahů se zákazníky (staff / B2B), odděleně od end-user account UI.

## Entity

| Model | Účel |
| --- | --- |
| `Lead` | Canonical CRM záznam (typ, status, routing, nextAction) |
| `LeadActivity` | Timeline log (SYSTEM + INTERNAL poznámky) |
| `LeadAssignment` | Přiřazení OWNER / ASSIGNEE / WATCHER |

Marketplace `Inquiry` / `QualifiedBuyerLead` zůstávají oddělené — viz [MARKETPLACE_LEADS.md](./MARKETPLACE_LEADS.md).  
Hypoteční partner handoff: [MORTGAGE_LEAD_FUNNEL.md](./MORTGAGE_LEAD_FUNNEL.md).

## Statusy + timeline

`NEW` → `CONTACTED` → `IN_PROGRESS` → `QUALIFIED` → `WON` / `LOST` / `HANDED_OFF`

Každý přechod (`transitionLeadStatus`) zapíše `LeadActivity` typu `STATUS_CHANGE`.  
Timeline: `getLeadTimeline` (včetně `INTERNAL` poznámek pro staff).

## Lead routing

`resolveCrmLeadRouting` / `applyLeadRouting`:

| LeadType | Target | Kam |
| --- | --- | --- |
| `FINANCING` | `MORTGAGE_PARTNER` | HypotekaJasne (`domains/leads/service/routing.ts`) |
| `PROPERTY_INQUIRY` / `TRANSACTION` | `LISTING_AGENT` | `Property.listedByUserId` |
| `PROPERTY_AUDIT` / `ANALYSIS_INTEREST` | `INTERNAL_ANALYST` | Interní analytici |

## nextAction

Na `Lead`: `nextActionType`, `nextActionDueAt`, `nextActionOwnerId`, `nextActionNote` (XSS-safe).  
API: `setLeadNextAction`.

## XSS-chráněné poznámky

`addInternalLeadNote` → `sanitizeCrmPlainText` (strip tags, escape entities).  
`visibility = INTERNAL` — nikdy do uživatelského account UI.

## Oprávnění (RBAC)

| Role | Scope |
| --- | --- |
| Makléř (assignee / org AGENT) | Jen své leady (`assignedToUserId` / `LeadAssignment`) |
| Manager agentury (org OWNER/ADMIN) | Všechny leady `organizationId` |
| Systémový admin (`ADMIN` / `SUPER_ADMIN`) + `SALES` | Vše |
| `ANALYST` | Audity / analysis queue + přiřazené |

`buildLeadAccessWhere` / `canActorViewLead` / `listAccessibleLeads`.

## Kód

| Oblast | Path |
| --- | --- |
| Pipeline | `src/domains/crm/pipeline.ts` |
| Routing | `src/domains/crm/lead-routing.ts` |
| Access | `src/domains/crm/access.ts` |
| Sanitize | `src/domains/crm/sanitize-notes.ts` |
| Migrace | `prisma/migrations/20260721070000_crm_pipeline/` |

## Testy

`src/domains/crm/crm-pipeline.test.ts`
