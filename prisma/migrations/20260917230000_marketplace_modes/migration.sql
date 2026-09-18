-- AlterTable
-- Additive marketplace modes + success-fee engagement (non-destructive).

CREATE TYPE "MarketplaceModeKind" AS ENUM ('SHARED_INVESTMENT', 'PARTIAL_BUY', 'SHARED_RENT', 'OFFER_PRICE', 'SWAP', 'HOUSING_HELP', 'AUCTION', 'FOREIGN_INFO');
CREATE TYPE "MarketplaceInterestStatus" AS ENUM ('DECLARED', 'WAITLIST', 'ACCEPTED_FOR_NEGOTIATION', 'CONFIRMED_PARTICIPATION', 'SETTLED', 'WITHDRAWN', 'REJECTED');
CREATE TYPE "SuccessFeeEngagementStatus" AS ENUM ('DRAFT', 'REQUESTED', 'ACCEPTED_NONBINDING', 'CANCELLED');

CREATE TABLE "MarketplaceModeInterest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "mode" "MarketplaceModeKind" NOT NULL,
    "userId" TEXT,
    "status" "MarketplaceInterestStatus" NOT NULL DEFAULT 'DECLARED',
    "sharePct" DOUBLE PRECISION,
    "amountMinor" INTEGER,
    "currency" TEXT DEFAULT 'CZK',
    "payload" JSONB,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceModeInterest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuctionConfig" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "minIncrement" INTEGER NOT NULL,
    "reservePrice" INTEGER,
    "rulesMeta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "bidderUserId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "serverReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SuccessFeeEngagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "actorKind" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "ratePct" DOUBLE PRECISION NOT NULL,
    "ratePctMax" DOUBLE PRECISION,
    "transaction" TEXT NOT NULL,
    "status" "SuccessFeeEngagementStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessFeeEngagement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceModeInterest_propertyId_mode_status_idx" ON "MarketplaceModeInterest"("propertyId", "mode", "status");
CREATE INDEX "MarketplaceModeInterest_userId_mode_createdAt_idx" ON "MarketplaceModeInterest"("userId", "mode", "createdAt");
CREATE INDEX "MarketplaceModeInterest_mode_status_createdAt_idx" ON "MarketplaceModeInterest"("mode", "status", "createdAt");
CREATE INDEX "AuctionConfig_propertyId_status_idx" ON "AuctionConfig"("propertyId", "status");
CREATE INDEX "AuctionConfig_endsAt_status_idx" ON "AuctionConfig"("endsAt", "status");
CREATE INDEX "AuctionBid_auctionId_amountMinor_idx" ON "AuctionBid"("auctionId", "amountMinor");
CREATE INDEX "AuctionBid_bidderUserId_createdAt_idx" ON "AuctionBid"("bidderUserId", "createdAt");
CREATE INDEX "SuccessFeeEngagement_userId_status_createdAt_idx" ON "SuccessFeeEngagement"("userId", "status", "createdAt");
CREATE INDEX "SuccessFeeEngagement_propertyId_idx" ON "SuccessFeeEngagement"("propertyId");

ALTER TABLE "MarketplaceModeInterest" ADD CONSTRAINT "MarketplaceModeInterest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceModeInterest" ADD CONSTRAINT "MarketplaceModeInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuctionConfig" ADD CONSTRAINT "AuctionConfig_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "AuctionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_bidderUserId_fkey" FOREIGN KEY ("bidderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SuccessFeeEngagement" ADD CONSTRAINT "SuccessFeeEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
