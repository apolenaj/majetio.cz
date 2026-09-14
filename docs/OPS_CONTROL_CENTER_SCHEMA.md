# Ops Control Center — Schema phase 1 (126–138, 218–227)

Additive Prisma migration: `20260722040000_ops_incident_audit_dataset` (no DB reset).

## Incident Management (126–131)

| Model | Role |
| --- | --- |
| `Incident` | title, description, severity (`SEV1`–`SEV4`), status, owner, startedAt, resolvedAt, affectedSystems, internalNotes |
| `IncidentTimelineEvent` | Chronological ops notes / status changes |
| `IncidentLinkedEntity` | Polymorphic links (`entityType` + `entityId`) |

Typed API: `src/domains/administration/incidents/incident-ops.ts`

> `PlatformIncident` (Prompt 6 lightweight category board) remains; canonical ops model is `Incident`.

## Audit Log (132–138, 275–276, 280–281)

Extended `AuditLog` columns: `actorType`, `entityType`, `reason`, `beforeSummary`, `afterSummary`, `correlationId`.

- **Append-only:** Postgres `BEFORE UPDATE/DELETE` triggers + app helpers `updateAuditLog` / `deleteAuditLog` throw.
- **No secrets:** `sanitizeAuditMeta` / `assertNoSecretsInText` before insert.
- **Indexes:** entityType+entityId, action+createdAt, correlationId, actorType+createdAt.

Typed API: `src/domains/administration/audit/ops-audit-log.ts`

## Dataset Registry (218–227)

| Model | Role |
| --- | --- |
| `DatasetRegistry` | owner, steward, source, updateFrequency, quality SLA, healthStatus |
| `DatasetQualityScore` | score 0–100 + dimension metrics |
| `DatasetLineage` | upstream → downstream dependencies |

Health: `HEALTHY` | `STALE` | `DEGRADED` | `DISABLED`.

Typed API: `src/domains/administration/datasets/dataset-registry.ts`
