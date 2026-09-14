-- Ops Admin API: private notes + assignments (151–155). Additive only.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminEntityKind') THEN
    CREATE TYPE "AdminEntityKind" AS ENUM (
      'PROPERTY', 'USER', 'ORGANIZATION', 'LEAD', 'ORDER', 'INCIDENT', 'DATASET', 'IMPORT_JOB'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminAssignmentStatus') THEN
    CREATE TYPE "AdminAssignmentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AdminEntityNote" (
  "id" TEXT NOT NULL,
  "entityKind" "AdminEntityKind" NOT NULL,
  "entityId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AdminEntityNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminEntityNote_entityKind_entityId_createdAt_idx"
  ON "AdminEntityNote"("entityKind", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminEntityNote_authorUserId_createdAt_idx"
  ON "AdminEntityNote"("authorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminEntityNote_deletedAt_idx" ON "AdminEntityNote"("deletedAt");

CREATE TABLE IF NOT EXISTS "AdminAssignment" (
  "id" TEXT NOT NULL,
  "entityKind" "AdminEntityKind" NOT NULL,
  "entityId" TEXT NOT NULL,
  "assigneeUserId" TEXT NOT NULL,
  "assignedByUserId" TEXT NOT NULL,
  "status" "AdminAssignmentStatus" NOT NULL DEFAULT 'OPEN',
  "dueAt" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AdminAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminAssignment_assigneeUserId_status_idx"
  ON "AdminAssignment"("assigneeUserId", "status");
CREATE INDEX IF NOT EXISTS "AdminAssignment_entityKind_entityId_status_idx"
  ON "AdminAssignment"("entityKind", "entityId", "status");
CREATE INDEX IF NOT EXISTS "AdminAssignment_assignedByUserId_createdAt_idx"
  ON "AdminAssignment"("assignedByUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAssignment_dueAt_status_idx"
  ON "AdminAssignment"("dueAt", "status");
