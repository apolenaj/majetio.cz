-- Property Decision Workspace: private notes, tasks, decision preferences

CREATE TYPE "PropertyDecisionTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "PropertyDecisionTaskType" AS ENUM (
  'VIEWING', 'LEGAL_CHECK', 'SVJ', 'TECHNICAL_INSPECTION',
  'FINANCING', 'RENOVATION_QUOTE', 'DOCUMENTATION', 'NEIGHBORS', 'CUSTOM'
);
CREATE TYPE "DecisionPriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "Comparison" ADD COLUMN IF NOT EXISTS "manualOrder" JSONB;

CREATE TABLE "PropertyUserNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyUserNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyUserNote_userId_propertyId_key" ON "PropertyUserNote"("userId", "propertyId");
CREATE INDEX "PropertyUserNote_userId_updatedAt_idx" ON "PropertyUserNote"("userId", "updatedAt");

ALTER TABLE "PropertyUserNote"
  ADD CONSTRAINT "PropertyUserNote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyUserNote"
  ADD CONSTRAINT "PropertyUserNote_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PropertyDecisionTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "type" "PropertyDecisionTaskType" NOT NULL DEFAULT 'CUSTOM',
  "title" TEXT NOT NULL,
  "status" "PropertyDecisionTaskStatus" NOT NULL DEFAULT 'PENDING',
  "dueDate" TIMESTAMP(3),
  "suggested" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PropertyDecisionTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyDecisionTask_userId_propertyId_status_idx"
  ON "PropertyDecisionTask"("userId", "propertyId", "status");
CREATE INDEX "PropertyDecisionTask_userId_dueDate_idx"
  ON "PropertyDecisionTask"("userId", "dueDate");

ALTER TABLE "PropertyDecisionTask"
  ADD CONSTRAINT "PropertyDecisionTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyDecisionTask"
  ADD CONSTRAINT "PropertyDecisionTask_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DecisionPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "priorities" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionPreference_userId_key" ON "DecisionPreference"("userId");

ALTER TABLE "DecisionPreference"
  ADD CONSTRAINT "DecisionPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
