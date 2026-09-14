-- Phase 2 monetization: checkout, payments, entitlements, promos, price versions.

-- Extend enums
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CHARGEBACK';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_ACTION';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CHARGEBACK';

DO $$ BEGIN
  CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED', 'PENDING_GRANT', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENT', 'FIXED_CZK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order columns (additive; amountCzk kept for back-compat)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "priceVersionKey" TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountGrossMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountNetMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountVatMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "vatRateBp" INTEGER NOT NULL DEFAULT 2100;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingCompany" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingStreet" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingZip" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT DEFAULT 'CZ';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingVatId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCodeId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCodeSnapshot" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Order_userId_status_createdAt_idx" ON "Order"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_productKey_priceVersionKey_idx" ON "Order"("productKey", "priceVersionKey");

-- Backfill gross from legacy amountCzk
UPDATE "Order" SET "amountGrossMinor" = "amountCzk" * 100 WHERE "amountGrossMinor" = 0 AND "amountCzk" > 0;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountGrossMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerCheckoutUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failureCode" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failureMessage" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "rawProviderStatus" TEXT;
UPDATE "Payment" SET "amountGrossMinor" = "amountCzk" * 100 WHERE "amountGrossMinor" = 0 AND "amountCzk" > 0;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerPaymentId_key" ON "Payment"("provider", "providerPaymentId");
CREATE INDEX IF NOT EXISTS "Payment_orderId_status_idx" ON "Payment"("orderId", "status");

CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "signatureOk" BOOLEAN NOT NULL DEFAULT false,
  "processedAt" TIMESTAMP(3),
  "processError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_eventId_key" ON "PaymentWebhookEvent"("provider", "eventId");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_processedAt_idx" ON "PaymentWebhookEvent"("processedAt");

CREATE TABLE IF NOT EXISTS "PaymentRefund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentId" TEXT,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "reason" TEXT,
  "providerRefundId" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'refund',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PaymentRefund_orderId_createdAt_idx" ON "PaymentRefund"("orderId", "createdAt");
ALTER TABLE "PaymentRefund" DROP CONSTRAINT IF EXISTS "PaymentRefund_orderId_fkey";
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRefund" DROP CONSTRAINT IF EXISTS "PaymentRefund_paymentId_fkey";
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Entitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "analysisId" TEXT,
  "productKey" TEXT NOT NULL,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokeReason" TEXT,
  "grantAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastGrantError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Entitlement_userId_productKey_analysisId_key" ON "Entitlement"("userId", "productKey", "analysisId");
CREATE INDEX IF NOT EXISTS "Entitlement_userId_status_idx" ON "Entitlement"("userId", "status");
CREATE INDEX IF NOT EXISTS "Entitlement_status_grantAttempts_idx" ON "Entitlement"("status", "grantAttempts");
ALTER TABLE "Entitlement" DROP CONSTRAINT IF EXISTS "Entitlement_userId_fkey";
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Entitlement" DROP CONSTRAINT IF EXISTS "Entitlement_orderId_fkey";
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Entitlement" DROP CONSTRAINT IF EXISTS "Entitlement_analysisId_fkey";
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PriceVersion" (
  "id" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "versionKey" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "amountGrossMinor" INTEGER NOT NULL,
  "vatRateBp" INTEGER NOT NULL DEFAULT 2100,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PriceVersion_productKey_versionKey_key" ON "PriceVersion"("productKey", "versionKey");
CREATE INDEX IF NOT EXISTS "PriceVersion_productKey_activeFrom_idx" ON "PriceVersion"("productKey", "activeFrom");

CREATE TABLE IF NOT EXISTS "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "discountType" "PromoDiscountType" NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "productKeys" TEXT[],
  "maxRedemptions" INTEGER,
  "redemptionCount" INTEGER NOT NULL DEFAULT 0,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");

CREATE TABLE IF NOT EXISTS "PromoRedemption" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PromoRedemption_promoCodeId_userId_idx" ON "PromoRedemption"("promoCodeId", "userId");
ALTER TABLE "PromoRedemption" DROP CONSTRAINT IF EXISTS "PromoRedemption_promoCodeId_fkey";
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" DROP CONSTRAINT IF EXISTS "PromoRedemption_userId_fkey";
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_promoCodeId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed catalog price versions
INSERT INTO "PriceVersion" ("id", "productKey", "versionKey", "currency", "amountGrossMinor", "vatRateBp", "activeFrom")
VALUES
  ('pv_full_v2026_07', 'full_analysis', 'v2026.07', 'CZK', 499000, 2100, CURRENT_TIMESTAMP),
  ('pv_basic_v2026_07', 'basic_analysis', 'v2026.07', 'CZK', 0, 2100, CURRENT_TIMESTAMP)
ON CONFLICT ("productKey", "versionKey") DO NOTHING;
