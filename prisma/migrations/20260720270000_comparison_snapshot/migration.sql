-- Comparison snapshots at time T (BOD 76, 77, 146)

CREATE TABLE "ComparisonSnapshot" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "publicMetrics" JSONB NOT NULL,
    "fingerprints" JSONB NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComparisonSnapshot_comparisonId_isCurrent_idx" ON "ComparisonSnapshot"("comparisonId", "isCurrent");
CREATE INDEX "ComparisonSnapshot_comparisonId_createdAt_idx" ON "ComparisonSnapshot"("comparisonId", "createdAt");

ALTER TABLE "ComparisonSnapshot" ADD CONSTRAINT "ComparisonSnapshot_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
