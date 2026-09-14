-- Property Decision Workspace: PropertyAlert inbox + expanded alert types

ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'PRICE_DECREASE';
ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'PRICE_INCREASE';
ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'STATUS_CHANGED';
ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'RELISTED';
ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'NEW_ANALYSIS_AVAILABLE';
ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'FINANCING_CHANGED';

CREATE TYPE "PropertyAlertDeliveryStatus" AS ENUM (
  'PENDING', 'SENT', 'READ', 'FAILED', 'SUPPRESSED'
);

CREATE TABLE "PropertyAlert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT,
  "type" "PropertyAlertType" NOT NULL,
  "eventId" TEXT,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "status" "PropertyAlertDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "body" TEXT,
  "dedupeKey" TEXT,
  "batchKey" TEXT,
  "href" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  CONSTRAINT "PropertyAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyAlert_userId_dedupeKey_key" ON "PropertyAlert"("userId", "dedupeKey");
CREATE INDEX "PropertyAlert_userId_status_createdAt_idx" ON "PropertyAlert"("userId", "status", "createdAt");
CREATE INDEX "PropertyAlert_userId_readAt_createdAt_idx" ON "PropertyAlert"("userId", "readAt", "createdAt");
CREATE INDEX "PropertyAlert_propertyId_type_createdAt_idx" ON "PropertyAlert"("propertyId", "type", "createdAt");
CREATE INDEX "PropertyAlert_batchKey_idx" ON "PropertyAlert"("batchKey");
CREATE INDEX "PropertyAlert_type_createdAt_idx" ON "PropertyAlert"("type", "createdAt");

ALTER TABLE "PropertyAlert"
  ADD CONSTRAINT "PropertyAlert_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyAlert"
  ADD CONSTRAINT "PropertyAlert_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertyAlert"
  ADD CONSTRAINT "PropertyAlert_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "PropertyAlertEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
