-- Property floor plans (versioned JSON geometry + analysis jobs)

CREATE TYPE "FloorPlanLifecycleStatus" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "FloorPlanAnalysisJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

CREATE TABLE "PropertyFloorPlan" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "status" "FloorPlanLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedRevisionId" TEXT,
    "draftRevisionId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyFloorPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyFloorPlanRevision" (
    "id" TEXT NOT NULL,
    "floorPlanId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "outputKind" TEXT NOT NULL,
    "scaleState" TEXT NOT NULL,
    "disclaimerCs" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "sourceJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyFloorPlanRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyFloorPlanAnalysisJob" (
    "id" TEXT NOT NULL,
    "floorPlanId" TEXT NOT NULL,
    "status" "FloorPlanAnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
    "kind" TEXT NOT NULL,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "errorMessageCs" TEXT,
    "clientRequestId" TEXT,
    "payload" JSONB,
    "resultRevisionId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyFloorPlanAnalysisJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyFloorPlan_publishedRevisionId_key" ON "PropertyFloorPlan"("publishedRevisionId");
CREATE UNIQUE INDEX "PropertyFloorPlan_draftRevisionId_key" ON "PropertyFloorPlan"("draftRevisionId");
CREATE INDEX "PropertyFloorPlan_propertyId_status_idx" ON "PropertyFloorPlan"("propertyId", "status");
CREATE INDEX "PropertyFloorPlan_updatedAt_idx" ON "PropertyFloorPlan"("updatedAt");

CREATE UNIQUE INDEX "PropertyFloorPlanRevision_floorPlanId_version_key" ON "PropertyFloorPlanRevision"("floorPlanId", "version");
CREATE INDEX "PropertyFloorPlanRevision_floorPlanId_createdAt_idx" ON "PropertyFloorPlanRevision"("floorPlanId", "createdAt");

CREATE UNIQUE INDEX "PropertyFloorPlanAnalysisJob_floorPlanId_clientRequestId_key" ON "PropertyFloorPlanAnalysisJob"("floorPlanId", "clientRequestId");
CREATE INDEX "PropertyFloorPlanAnalysisJob_floorPlanId_status_idx" ON "PropertyFloorPlanAnalysisJob"("floorPlanId", "status");
CREATE INDEX "PropertyFloorPlanAnalysisJob_createdAt_idx" ON "PropertyFloorPlanAnalysisJob"("createdAt");

ALTER TABLE "PropertyFloorPlan" ADD CONSTRAINT "PropertyFloorPlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyFloorPlanRevision" ADD CONSTRAINT "PropertyFloorPlanRevision_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "PropertyFloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyFloorPlan" ADD CONSTRAINT "PropertyFloorPlan_publishedRevisionId_fkey" FOREIGN KEY ("publishedRevisionId") REFERENCES "PropertyFloorPlanRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertyFloorPlan" ADD CONSTRAINT "PropertyFloorPlan_draftRevisionId_fkey" FOREIGN KEY ("draftRevisionId") REFERENCES "PropertyFloorPlanRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertyFloorPlanAnalysisJob" ADD CONSTRAINT "PropertyFloorPlanAnalysisJob_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "PropertyFloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
