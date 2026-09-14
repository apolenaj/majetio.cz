-- Safe comparison sharing (BOD 78–81)

CREATE TYPE "ComparisonShareMode" AS ENUM ('INVITED_USERS', 'SECRET_LINK');

CREATE TABLE "ComparisonShare" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "mode" "ComparisonShareMode" NOT NULL,
    "tokenHash" TEXT,
    "tokenPrefix" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "includeFlags" JSONB NOT NULL,
    "safePayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "ComparisonShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComparisonShare_tokenHash_key" ON "ComparisonShare"("tokenHash");
CREATE INDEX "ComparisonShare_comparisonId_mode_idx" ON "ComparisonShare"("comparisonId", "mode");
CREATE INDEX "ComparisonShare_expiresAt_idx" ON "ComparisonShare"("expiresAt");
CREATE INDEX "ComparisonShare_createdById_createdAt_idx" ON "ComparisonShare"("createdById", "createdAt");

ALTER TABLE "ComparisonShare" ADD CONSTRAINT "ComparisonShare_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComparisonShare" ADD CONSTRAINT "ComparisonShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ComparisonShareInvite" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonShareInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComparisonShareInvite_shareId_userId_key" ON "ComparisonShareInvite"("shareId", "userId");
CREATE INDEX "ComparisonShareInvite_userId_idx" ON "ComparisonShareInvite"("userId");

ALTER TABLE "ComparisonShareInvite" ADD CONSTRAINT "ComparisonShareInvite_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "ComparisonShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComparisonShareInvite" ADD CONSTRAINT "ComparisonShareInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
