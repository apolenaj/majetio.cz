# Incident Management

Canonical ops incidents (SEV1–SEV4). Spec **126–131**.

> `PlatformIncident` (Prompt 6 category board) remains for lightweight boards.  
> **Canonical model:** Prisma `Incident` + timeline + linked entities.

## Model

| Entity | Role |
| --- | --- |
| `Incident` | title, description, severity, status, owner, startedAt, resolvedAt, affectedSystems, marketCode, correlationId |
| `IncidentTimelineEvent` | CREATED / STATUS_CHANGE / NOTE / LINK_* / … |
| `IncidentLinkedEntity` | polymorphic `entityType` + `entityId` |

## Severity & status

- Severity: `SEV1` · `SEV2` · `SEV3` · `SEV4`
- Status: `OPEN` → `ACKNOWLEDGED` → `INVESTIGATING` → `MITIGATED` → `RESOLVED` → `CLOSED`
- Terminal (`RESOLVED` / `CLOSED`) sets `resolvedAt`

## API

Domain: `src/domains/administration/incidents/incident-ops.ts`

- `createIncident` — timeline CREATED + `writeOpsAuditLog`
- `updateIncidentStatus` — timeline STATUS_CHANGE + audit
- `appendIncidentTimeline` / `linkIncidentEntity`
- `listIncidents` / `getIncidentDetail`

UI: `/admin/incidenty`  
Permission: `platform.incidents.read` / `.write`

## Rules

- Every status change is timeline + audit (no silent close).
- Internal notes stay internal; public-facing copy must not leak partner/SQL tokens.
- Link entities for import jobs, payments, properties when investigating drift.
