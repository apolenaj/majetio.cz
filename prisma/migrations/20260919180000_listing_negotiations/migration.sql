-- Krátký popis, příznaky spolukoupě a nezávazná jednání.
-- Neveřejný cenový práh zůstává v marketExtensions a do veřejného API se nepřidává.

ALTER TABLE "Property" ADD COLUMN "shortDescription" VARCHAR(220);
ALTER TABLE "Property" ADD COLUMN "acceptsCoPurchaseSeekPartner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "acceptsCoPurchaseSellerRetains" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "offeredOwnershipPercent" INTEGER;

CREATE TYPE "NegotiationKind" AS ENUM ('PRICE_OFFER', 'CO_PURCHASE');
CREATE TYPE "NegotiationStatus" AS ENUM ('NEW', 'IN_DISCUSSION', 'INFO_REQUESTED', 'COUNTERED', 'REJECTED', 'WITHDRAWN', 'CLOSED');
CREATE TYPE "NegotiationFinancing" AS ENUM ('OWN_FUNDS', 'LOAN', 'MIXED', 'UNKNOWN');
CREATE TYPE "CoPurchaseSituation" AS ENUM ('SEEK_PARTNER', 'SELLER_RETAINS');
CREATE TYPE "ShareReference" AS ENUM ('WHOLE_PROPERTY', 'OFFERED_SHARE');
CREATE TYPE "NegotiationActor" AS ENUM ('BUYER', 'SELLER');
CREATE TYPE "NoticeDeliveryStatus" AS ENUM ('STORED_ONLY', 'SENT', 'FAILED');

CREATE TABLE "ListingNegotiation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "kind" "NegotiationKind" NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'NEW',
    "buyerUserId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerTokenHash" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "amountCzk" INTEGER NOT NULL,
    "financing" "NegotiationFinancing" NOT NULL DEFAULT 'UNKNOWN',
    "timeline" TEXT,
    "message" TEXT,
    "situation" "CoPurchaseSituation",
    "sharePercent" INTEGER,
    "shareReference" "ShareReference",
    "cashContributionCzk" INTEGER,
    "proposedTotalPriceCzk" INTEGER,
    "purpose" TEXT,
    "hasCoInvestor" BOOLEAN,
    "noticeStatus" "NoticeDeliveryStatus" NOT NULL DEFAULT 'STORED_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingNegotiation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingNegotiationVersion" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "actor" "NegotiationActor" NOT NULL,
    "actorUserId" TEXT,
    "amountCzk" INTEGER,
    "sharePercent" INTEGER,
    "cashContributionCzk" INTEGER,
    "message" TEXT,
    "status" "NegotiationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingNegotiationVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingNegotiation_propertyId_kind_status_createdAt_idx" ON "ListingNegotiation"("propertyId", "kind", "status", "createdAt");
CREATE INDEX "ListingNegotiation_buyerEmail_propertyId_createdAt_idx" ON "ListingNegotiation"("buyerEmail", "propertyId", "createdAt");
CREATE INDEX "ListingNegotiation_buyerUserId_createdAt_idx" ON "ListingNegotiation"("buyerUserId", "createdAt");
CREATE INDEX "ListingNegotiationVersion_negotiationId_createdAt_idx" ON "ListingNegotiationVersion"("negotiationId", "createdAt");

ALTER TABLE "ListingNegotiation" ADD CONSTRAINT "ListingNegotiation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingNegotiation" ADD CONSTRAINT "ListingNegotiation_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingNegotiationVersion" ADD CONSTRAINT "ListingNegotiationVersion_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "ListingNegotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
