-- Prompt 13/6: submission retry + webhook idempotency

ALTER TYPE "MortgageLeadWorkflowStatus" ADD VALUE IF NOT EXISTS 'SUBMISSION_PENDING' BEFORE 'SUBMITTED';

CREATE TYPE "MortgageLeadSubmissionAttemptStatus" AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED_TRANSIENT',
  'FAILED_PERMANENT',
  'DEAD_LETTER'
);

ALTER TABLE "MortgageLeadProfile"
  ADD COLUMN "submissionAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastSubmissionError" TEXT,
  ADD COLUMN "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN "deadLetterAt" TIMESTAMP(3);

CREATE INDEX "MortgageLeadProfile_workflowStatus_nextRetryAt_idx"
  ON "MortgageLeadProfile"("workflowStatus", "nextRetryAt");

CREATE TABLE "MortgageLeadSubmissionAttempt" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" "MortgageLeadSubmissionAttemptStatus" NOT NULL,
  "httpStatus" INTEGER,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "nextRetryAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MortgageLeadSubmissionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MortgageLeadSubmissionAttempt_leadId_attemptNumber_key"
  ON "MortgageLeadSubmissionAttempt"("leadId", "attemptNumber");
CREATE INDEX "MortgageLeadSubmissionAttempt_status_nextRetryAt_idx"
  ON "MortgageLeadSubmissionAttempt"("status", "nextRetryAt");

ALTER TABLE "MortgageLeadSubmissionAttempt"
  ADD CONSTRAINT "MortgageLeadSubmissionAttempt_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HypotekaJasneWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "leadId" TEXT,
  "payload" JSONB NOT NULL,
  "signatureValid" BOOLEAN NOT NULL DEFAULT true,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HypotekaJasneWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HypotekaJasneWebhookEvent_eventId_key"
  ON "HypotekaJasneWebhookEvent"("eventId");
CREATE INDEX "HypotekaJasneWebhookEvent_correlationId_createdAt_idx"
  ON "HypotekaJasneWebhookEvent"("correlationId", "createdAt");
CREATE INDEX "HypotekaJasneWebhookEvent_eventType_createdAt_idx"
  ON "HypotekaJasneWebhookEvent"("eventType", "createdAt");

ALTER TABLE "HypotekaJasneWebhookEvent"
  ADD CONSTRAINT "HypotekaJasneWebhookEvent_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
