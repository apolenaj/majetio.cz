-- Ops Control Center phase 1: Incident (126–131), AuditLog enrich (132–138),
-- Dataset Registry (218–227). Additive only — no DROP / no data reset.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditActorType') THEN
    CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'SERVICE', 'ANONYMOUS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentSevLevel') THEN
    CREATE TYPE "IncidentSevLevel" AS ENUM ('SEV1', 'SEV2', 'SEV3', 'SEV4');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentOpsStatus') THEN
    CREATE TYPE "IncidentOpsStatus" AS ENUM (
      'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentTimelineEventType') THEN
    CREATE TYPE "IncidentTimelineEventType" AS ENUM (
      'CREATED', 'STATUS_CHANGE', 'SEVERITY_CHANGE', 'NOTE',
      'OWNER_CHANGE', 'LINK_ADDED', 'LINK_REMOVED', 'SYSTEM'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DatasetHealthStatus') THEN
    CREATE TYPE "DatasetHealthStatus" AS ENUM ('HEALTHY', 'STALE', 'DEGRADED', 'DISABLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DatasetUpdateFrequency') THEN
    CREATE TYPE "DatasetUpdateFrequency" AS ENUM (
      'REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL', 'UNKNOWN'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DatasetLineageKind') THEN
    CREATE TYPE "DatasetLineageKind" AS ENUM (
      'DERIVES_FROM', 'ENRICHES', 'JOINS', 'VALIDATES', 'MIRRORS'
    );
  END IF;
END $$;

-- ── AuditLog enrich (additive columns + indexes) ────────────────────────────
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorType" "AuditActorType" NOT NULL DEFAULT 'USER';
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "beforeSummary" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "afterSummary" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;

-- Backfill entityType from legacy entity where missing
UPDATE "AuditLog" SET "entityType" = "entity" WHERE "entityType" IS NULL;

CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorType_createdAt_idx" ON "AuditLog"("actorType", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_action_createdAt_idx"
  ON "AuditLog"("entityType", "action", "createdAt");

-- Append-only enforcement: block UPDATE/DELETE on AuditLog
CREATE OR REPLACE FUNCTION majetio_audit_log_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only (spec 132–138). UPDATE/DELETE forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
DROP TRIGGER IF EXISTS audit_log_no_delete ON "AuditLog";

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE PROCEDURE majetio_audit_log_append_only();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE PROCEDURE majetio_audit_log_append_only();

COMMENT ON TABLE "AuditLog" IS
  'Append-only security trail. Never store secrets/tokens/passwords in meta or summaries.';
COMMENT ON COLUMN "AuditLog"."beforeSummary" IS 'Redacted before-state summary — no secrets.';
COMMENT ON COLUMN "AuditLog"."afterSummary" IS 'Redacted after-state summary — no secrets.';
COMMENT ON COLUMN "AuditLog"."meta" IS 'Pre-sanitized JSON only — application must redact secrets.';

-- ── Incident (canonical ops) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Incident" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "IncidentSevLevel" NOT NULL DEFAULT 'SEV3',
  "status" "IncidentOpsStatus" NOT NULL DEFAULT 'OPEN',
  "ownerUserId" TEXT,
  "openedByUserId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "affectedSystems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "internalNotes" TEXT,
  "marketCode" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Incident_status_severity_idx" ON "Incident"("status", "severity");
CREATE INDEX IF NOT EXISTS "Incident_ownerUserId_status_idx" ON "Incident"("ownerUserId", "status");
CREATE INDEX IF NOT EXISTS "Incident_startedAt_idx" ON "Incident"("startedAt");
CREATE INDEX IF NOT EXISTS "Incident_resolvedAt_idx" ON "Incident"("resolvedAt");
CREATE INDEX IF NOT EXISTS "Incident_correlationId_idx" ON "Incident"("correlationId");
CREATE INDEX IF NOT EXISTS "Incident_createdAt_idx" ON "Incident"("createdAt");

CREATE TABLE IF NOT EXISTS "IncidentTimelineEvent" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "eventType" "IncidentTimelineEventType" NOT NULL DEFAULT 'NOTE',
  "actorUserId" TEXT,
  "message" TEXT NOT NULL,
  "meta" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentTimelineEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncidentTimelineEvent_incidentId_occurredAt_idx"
  ON "IncidentTimelineEvent"("incidentId", "occurredAt");
CREATE INDEX IF NOT EXISTS "IncidentTimelineEvent_eventType_occurredAt_idx"
  ON "IncidentTimelineEvent"("eventType", "occurredAt");
DO $$ BEGIN
  ALTER TABLE "IncidentTimelineEvent"
    ADD CONSTRAINT "IncidentTimelineEvent_incidentId_fkey"
    FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "IncidentLinkedEntity" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "label" TEXT,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "linkedByUserId" TEXT,
  CONSTRAINT "IncidentLinkedEntity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IncidentLinkedEntity_incidentId_entityType_entityId_key"
  ON "IncidentLinkedEntity"("incidentId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "IncidentLinkedEntity_entityType_entityId_idx"
  ON "IncidentLinkedEntity"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "IncidentLinkedEntity_incidentId_idx"
  ON "IncidentLinkedEntity"("incidentId");
DO $$ BEGIN
  ALTER TABLE "IncidentLinkedEntity"
    ADD CONSTRAINT "IncidentLinkedEntity_incidentId_fkey"
    FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Dataset Registry (218–227) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DatasetRegistry" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ownerUserId" TEXT,
  "stewardUserId" TEXT,
  "source" TEXT NOT NULL,
  "sourceRef" TEXT,
  "updateFrequency" "DatasetUpdateFrequency" NOT NULL DEFAULT 'UNKNOWN',
  "qualitySlaMinutes" INTEGER,
  "qualitySlaScoreMin" DOUBLE PRECISION,
  "healthStatus" "DatasetHealthStatus" NOT NULL DEFAULT 'HEALTHY',
  "lastRefreshedAt" TIMESTAMP(3),
  "marketCode" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DatasetRegistry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatasetRegistry_key_key" ON "DatasetRegistry"("key");
CREATE INDEX IF NOT EXISTS "DatasetRegistry_healthStatus_idx" ON "DatasetRegistry"("healthStatus");
CREATE INDEX IF NOT EXISTS "DatasetRegistry_ownerUserId_idx" ON "DatasetRegistry"("ownerUserId");
CREATE INDEX IF NOT EXISTS "DatasetRegistry_stewardUserId_idx" ON "DatasetRegistry"("stewardUserId");
CREATE INDEX IF NOT EXISTS "DatasetRegistry_source_idx" ON "DatasetRegistry"("source");
CREATE INDEX IF NOT EXISTS "DatasetRegistry_lastRefreshedAt_idx" ON "DatasetRegistry"("lastRefreshedAt");
CREATE INDEX IF NOT EXISTS "DatasetRegistry_marketCode_healthStatus_idx"
  ON "DatasetRegistry"("marketCode", "healthStatus");

CREATE TABLE IF NOT EXISTS "DatasetQualityScore" (
  "id" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "completeness" DOUBLE PRECISION,
  "freshness" DOUBLE PRECISION,
  "consistency" DOUBLE PRECISION,
  "validity" DOUBLE PRECISION,
  "sampleSize" INTEGER,
  "notes" TEXT,
  "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scoredByUserId" TEXT,
  "metrics" JSONB,
  CONSTRAINT "DatasetQualityScore_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DatasetQualityScore_datasetId_scoredAt_idx"
  ON "DatasetQualityScore"("datasetId", "scoredAt");
CREATE INDEX IF NOT EXISTS "DatasetQualityScore_scoredAt_idx" ON "DatasetQualityScore"("scoredAt");
DO $$ BEGIN
  ALTER TABLE "DatasetQualityScore"
    ADD CONSTRAINT "DatasetQualityScore_datasetId_fkey"
    FOREIGN KEY ("datasetId") REFERENCES "DatasetRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "DatasetLineage" (
  "id" TEXT NOT NULL,
  "upstreamDatasetId" TEXT NOT NULL,
  "downstreamDatasetId" TEXT NOT NULL,
  "kind" "DatasetLineageKind" NOT NULL DEFAULT 'DERIVES_FROM',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DatasetLineage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatasetLineage_upstreamDatasetId_downstreamDatasetId_kind_key"
  ON "DatasetLineage"("upstreamDatasetId", "downstreamDatasetId", "kind");
CREATE INDEX IF NOT EXISTS "DatasetLineage_upstreamDatasetId_idx" ON "DatasetLineage"("upstreamDatasetId");
CREATE INDEX IF NOT EXISTS "DatasetLineage_downstreamDatasetId_idx" ON "DatasetLineage"("downstreamDatasetId");
DO $$ BEGIN
  ALTER TABLE "DatasetLineage"
    ADD CONSTRAINT "DatasetLineage_upstreamDatasetId_fkey"
    FOREIGN KEY ("upstreamDatasetId") REFERENCES "DatasetRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DatasetLineage"
    ADD CONSTRAINT "DatasetLineage_downstreamDatasetId_fkey"
    FOREIGN KEY ("downstreamDatasetId") REFERENCES "DatasetRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed core datasets (idempotent)
INSERT INTO "DatasetRegistry" (
  "id", "key", "name", "description", "source", "updateFrequency",
  "qualitySlaMinutes", "qualitySlaScoreMin", "healthStatus", "tags", "updatedAt"
) VALUES
  (
    'ds_properties_canonical',
    'properties.canonical',
    'Canonical properties',
    'Merged listing inventory used by public search and admin property ops.',
    'internal.merge',
    'HOURLY',
    360,
    85,
    'HEALTHY',
    ARRAY['core', 'listings'],
    CURRENT_TIMESTAMP
  ),
  (
    'ds_import_jobs',
    'imports.jobs',
    'Import jobs',
    'Inbound feed job runs and item outcomes.',
    'import.pipeline',
    'REALTIME',
    60,
    90,
    'HEALTHY',
    ARRAY['pipeline'],
    CURRENT_TIMESTAMP
  ),
  (
    'ds_fx_snapshots',
    'fx.snapshots',
    'FX rate snapshots',
    'Persisted exchange-rate observations for historical calculations.',
    'fx.providers',
    'DAILY',
    1440,
    95,
    'HEALTHY',
    ARRAY['fx', 'finance'],
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "DatasetLineage" (
  "id", "upstreamDatasetId", "downstreamDatasetId", "kind", "notes"
)
SELECT
  'dl_imports_to_properties',
  up.id,
  down.id,
  'DERIVES_FROM',
  'Import jobs feed canonical property merge.'
FROM "DatasetRegistry" up, "DatasetRegistry" down
WHERE up.key = 'imports.jobs' AND down.key = 'properties.canonical'
ON CONFLICT ("upstreamDatasetId", "downstreamDatasetId", "kind") DO NOTHING;
