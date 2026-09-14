-- Internal CRM pipeline: LeadAssignment, routing, nextAction, activity visibility

DO $$ BEGIN
  ALTER TYPE "LeadType" ADD VALUE IF NOT EXISTS 'PROPERTY_AUDIT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "LeadType" ADD VALUE IF NOT EXISTS 'PROPERTY_INQUIRY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadNextActionType" AS ENUM (
    'NONE',
    'CONTACT_CLIENT',
    'AWAIT_PARTNER_RESPONSE',
    'REQUEST_DOCUMENTS',
    'FOLLOW_UP',
    'SCHEDULE_VIEWING',
    'INTERNAL_REVIEW',
    'HAND_OFF'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadRoutingTarget" AS ENUM (
    'MORTGAGE_PARTNER',
    'LISTING_AGENT',
    'INTERNAL_ANALYST',
    'UNASSIGNED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadAssignmentRole" AS ENUM ('OWNER', 'ASSIGNEE', 'WATCHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadActivityVisibility" AS ENUM ('SYSTEM', 'INTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "routingTarget" "LeadRoutingTarget" NOT NULL DEFAULT 'UNASSIGNED';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "routingRuleKey" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextActionType" "LeadNextActionType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextActionDueAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextActionOwnerId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextActionNote" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Lead_organizationId_status_createdAt_idx"
  ON "Lead"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_assignedToUserId_status_nextActionDueAt_idx"
  ON "Lead"("assignedToUserId", "status", "nextActionDueAt");
CREATE INDEX IF NOT EXISTS "Lead_status_statusChangedAt_idx"
  ON "Lead"("status", "statusChangedAt");
CREATE INDEX IF NOT EXISTS "Lead_routingTarget_status_idx"
  ON "Lead"("routingTarget", "status");
CREATE INDEX IF NOT EXISTS "Lead_nextActionOwnerId_nextActionDueAt_idx"
  ON "Lead"("nextActionOwnerId", "nextActionDueAt");

ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_organizationId_fkey";
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_assignedToUserId_fkey";
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_assignedToUserId_fkey"
  FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_nextActionOwnerId_fkey";
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_nextActionOwnerId_fkey"
  FOREIGN KEY ("nextActionOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "LeadAssignment" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT,
  "role" "LeadAssignmentRole" NOT NULL DEFAULT 'ASSIGNEE',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedByUserId" TEXT,
  "unassignedAt" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeadAssignment_leadId_userId_role_key"
  ON "LeadAssignment"("leadId", "userId", "role");
CREATE INDEX IF NOT EXISTS "LeadAssignment_userId_active_assignedAt_idx"
  ON "LeadAssignment"("userId", "active", "assignedAt");
CREATE INDEX IF NOT EXISTS "LeadAssignment_organizationId_active_idx"
  ON "LeadAssignment"("organizationId", "active");
CREATE INDEX IF NOT EXISTS "LeadAssignment_leadId_active_idx"
  ON "LeadAssignment"("leadId", "active");

ALTER TABLE "LeadAssignment" DROP CONSTRAINT IF EXISTS "LeadAssignment_leadId_fkey";
ALTER TABLE "LeadAssignment"
  ADD CONSTRAINT "LeadAssignment_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadAssignment" DROP CONSTRAINT IF EXISTS "LeadAssignment_userId_fkey";
ALTER TABLE "LeadAssignment"
  ADD CONSTRAINT "LeadAssignment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadAssignment" DROP CONSTRAINT IF EXISTS "LeadAssignment_organizationId_fkey";
ALTER TABLE "LeadAssignment"
  ADD CONSTRAINT "LeadAssignment_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadAssignment" DROP CONSTRAINT IF EXISTS "LeadAssignment_assignedByUserId_fkey";
ALTER TABLE "LeadAssignment"
  ADD CONSTRAINT "LeadAssignment_assignedByUserId_fkey"
  FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadActivity" ADD COLUMN IF NOT EXISTS "actorUserId" TEXT;
ALTER TABLE "LeadActivity" ADD COLUMN IF NOT EXISTS "visibility" "LeadActivityVisibility" NOT NULL DEFAULT 'SYSTEM';

CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_createdAt_idx"
  ON "LeadActivity"("leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadActivity_actorUserId_createdAt_idx"
  ON "LeadActivity"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadActivity_visibility_createdAt_idx"
  ON "LeadActivity"("visibility", "createdAt");

ALTER TABLE "LeadActivity" DROP CONSTRAINT IF EXISTS "LeadActivity_actorUserId_fkey";
ALTER TABLE "LeadActivity"
  ADD CONSTRAINT "LeadActivity_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
