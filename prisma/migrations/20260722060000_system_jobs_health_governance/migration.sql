-- Monitoring, jobs, model governance (139–150, 166–177, 233–239). Additive only.

DO $$ BEGIN
  -- ValuationModelLifecycleStatus: add REVIEW_REQUESTED if missing
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ValuationModelLifecycleStatus') THEN
    ALTER TYPE "ValuationModelLifecycleStatus" ADD VALUE IF NOT EXISTS 'REVIEW_REQUESTED';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PG < 15 may not support ADD VALUE IF NOT EXISTS — fallback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ValuationModelLifecycleStatus' AND e.enumlabel = 'REVIEW_REQUESTED'
  ) THEN
    ALTER TYPE "ValuationModelLifecycleStatus" ADD VALUE 'REVIEW_REQUESTED';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "shadowMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "previousActiveModelId" TEXT;
ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "rolledBackAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ValuationModelRegistry_shadowMode_idx" ON "ValuationModelRegistry"("shadowMode");

CREATE TABLE IF NOT EXISTS "ModelGovernanceEvent" (
  "id" TEXT NOT NULL,
  "modelRegistryId" TEXT NOT NULL,
  "fromStatus" TEXT NOT NULL,
  "toStatus" TEXT NOT NULL,
  "actorUserId" TEXT,
  "reason" TEXT NOT NULL,
  "shadowMode" BOOLEAN,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModelGovernanceEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ModelGovernanceEvent_modelRegistryId_createdAt_idx"
  ON "ModelGovernanceEvent"("modelRegistryId", "createdAt");
CREATE INDEX IF NOT EXISTS "ModelGovernanceEvent_createdAt_idx" ON "ModelGovernanceEvent"("createdAt");
DO $$ BEGIN
  ALTER TABLE "ModelGovernanceEvent"
    ADD CONSTRAINT "ModelGovernanceEvent_modelRegistryId_fkey"
    FOREIGN KEY ("modelRegistryId") REFERENCES "ValuationModelRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SystemComponentKind') THEN
    CREATE TYPE "SystemComponentKind" AS ENUM (
      'DATABASE', 'QUEUE', 'PAYMENTS', 'SEARCH', 'EXTERNAL_PROVIDER'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SystemComponentHealthStatus') THEN
    CREATE TYPE "SystemComponentHealthStatus" AS ENUM ('UP', 'DEGRADED', 'DOWN', 'UNKNOWN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SystemJobKind') THEN
    CREATE TYPE "SystemJobKind" AS ENUM (
      'PROPERTY_RECALC', 'PROPERTY_EVALUATION', 'PROPERTY_MERGE', 'MODEL_SHADOW_EVAL', 'GENERIC'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SystemJobStatus') THEN
    CREATE TYPE "SystemJobStatus" AS ENUM (
      'QUEUED', 'RUNNING', 'RETRYING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'DEAD_LETTER'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SystemJob" (
  "id" TEXT NOT NULL,
  "kind" "SystemJobKind" NOT NULL,
  "status" "SystemJobStatus" NOT NULL DEFAULT 'QUEUED',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "payload" JSONB NOT NULL,
  "progressPct" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastError" TEXT,
  "rateLimitKey" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SystemJob_status_scheduledAt_idx" ON "SystemJob"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "SystemJob_kind_status_idx" ON "SystemJob"("kind", "status");
CREATE INDEX IF NOT EXISTS "SystemJob_rateLimitKey_createdAt_idx" ON "SystemJob"("rateLimitKey", "createdAt");
CREATE INDEX IF NOT EXISTS "SystemJob_correlationId_idx" ON "SystemJob"("correlationId");
CREATE INDEX IF NOT EXISTS "SystemJob_createdAt_idx" ON "SystemJob"("createdAt");

CREATE TABLE IF NOT EXISTS "SystemJobDeadLetter" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "kind" "SystemJobKind" NOT NULL,
  "payload" JSONB NOT NULL,
  "error" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requeuedAt" TIMESTAMP(3),
  "meta" JSONB,
  CONSTRAINT "SystemJobDeadLetter_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SystemJobDeadLetter_kind_failedAt_idx" ON "SystemJobDeadLetter"("kind", "failedAt");
CREATE INDEX IF NOT EXISTS "SystemJobDeadLetter_failedAt_idx" ON "SystemJobDeadLetter"("failedAt");
CREATE INDEX IF NOT EXISTS "SystemJobDeadLetter_jobId_idx" ON "SystemJobDeadLetter"("jobId");
DO $$ BEGIN
  ALTER TABLE "SystemJobDeadLetter"
    ADD CONSTRAINT "SystemJobDeadLetter_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "SystemJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SystemHealthProbe" (
  "id" TEXT NOT NULL,
  "component" "SystemComponentKind" NOT NULL,
  "componentKey" TEXT NOT NULL,
  "status" "SystemComponentHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
  "latencyMs" INTEGER,
  "message" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB,
  CONSTRAINT "SystemHealthProbe_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SystemHealthProbe_component_componentKey_key"
  ON "SystemHealthProbe"("component", "componentKey");
CREATE INDEX IF NOT EXISTS "SystemHealthProbe_status_checkedAt_idx"
  ON "SystemHealthProbe"("status", "checkedAt");
