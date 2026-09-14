-- Commerce Data Layer: PricingPlan, Promotion, OrderItem, webhook replay fields

-- Enums
DO $$ BEGIN
  CREATE TYPE "PricingBillingType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'USAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PricingPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PricingPlan
CREATE TABLE IF NOT EXISTS "PricingPlan" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "versionKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "billingType" "PricingBillingType" NOT NULL DEFAULT 'ONE_TIME',
  "status" "PricingPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "priceGrossMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "vatRateBp" INTEGER NOT NULL DEFAULT 2100,
  "entitlesProductKey" TEXT NOT NULL,
  "limits" JSONB,
  "features" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PricingPlan_key_versionKey_key" ON "PricingPlan"("key", "versionKey");
CREATE INDEX IF NOT EXISTS "PricingPlan_status_activeFrom_idx" ON "PricingPlan"("status", "activeFrom");
CREATE INDEX IF NOT EXISTS "PricingPlan_key_status_idx" ON "PricingPlan"("key", "status");
CREATE INDEX IF NOT EXISTS "PricingPlan_sortOrder_idx" ON "PricingPlan"("sortOrder");

-- Promotion
CREATE TABLE IF NOT EXISTS "Promotion" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT,
  "discountType" "PromoDiscountType" NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "planKeys" TEXT[],
  "maxRedemptions" INTEGER,
  "redemptionCount" INTEGER NOT NULL DEFAULT 0,
  "maxPerUser" INTEGER,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Promotion_code_key" ON "Promotion"("code");
CREATE INDEX IF NOT EXISTS "Promotion_active_activeFrom_idx" ON "Promotion"("active", "activeFrom");

CREATE TABLE IF NOT EXISTS "PromotionRedemption" (
  "id" TEXT NOT NULL,
  "promotionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PromotionRedemption_promotionId_userId_idx" ON "PromotionRedemption"("promotionId", "userId");
CREATE INDEX IF NOT EXISTS "PromotionRedemption_userId_createdAt_idx" ON "PromotionRedemption"("userId", "createdAt");

ALTER TABLE "PromotionRedemption"
  DROP CONSTRAINT IF EXISTS "PromotionRedemption_promotionId_fkey";
ALTER TABLE "PromotionRedemption"
  ADD CONSTRAINT "PromotionRedemption_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromotionRedemption"
  DROP CONSTRAINT IF EXISTS "PromotionRedemption_userId_fkey";
ALTER TABLE "PromotionRedemption"
  ADD CONSTRAINT "PromotionRedemption_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order extensions
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pricingPlanId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promotionId" TEXT;

CREATE INDEX IF NOT EXISTS "Order_pricingPlanId_idx" ON "Order"("pricingPlanId");
CREATE INDEX IF NOT EXISTS "Order_promotionId_idx" ON "Order"("promotionId");

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_pricingPlanId_fkey";
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_pricingPlanId_fkey"
  FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_promotionId_fkey";
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- OrderItem
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "pricingPlanId" TEXT,
  "planKey" TEXT NOT NULL,
  "planVersionKey" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "billingType" "PricingBillingType" NOT NULL DEFAULT 'ONE_TIME',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitListGrossMinor" INTEGER NOT NULL,
  "unitPriceGrossMinor" INTEGER NOT NULL,
  "unitPriceNetMinor" INTEGER NOT NULL,
  "unitPriceVatMinor" INTEGER NOT NULL,
  "discountMinor" INTEGER NOT NULL DEFAULT 0,
  "lineGrossMinor" INTEGER NOT NULL,
  "lineNetMinor" INTEGER NOT NULL,
  "lineVatMinor" INTEGER NOT NULL,
  "vatRateBp" INTEGER NOT NULL DEFAULT 2100,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "limitsSnapshot" JSONB,
  "featuresSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_planKey_planVersionKey_idx" ON "OrderItem"("planKey", "planVersionKey");

ALTER TABLE "OrderItem"
  DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  DROP CONSTRAINT IF EXISTS "OrderItem_pricingPlanId_fkey";
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_pricingPlanId_fkey"
  FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Webhook replay fields
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "providerTimestamp" INTEGER;
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "replayRejected" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_providerTimestamp_idx" ON "PaymentWebhookEvent"("providerTimestamp");

-- Seed default plans (idempotent by key+version)
INSERT INTO "PricingPlan" (
  "id", "key", "versionKey", "name", "description", "billingType", "status",
  "priceGrossMinor", "currency", "vatRateBp", "entitlesProductKey",
  "limits", "features", "sortOrder", "activeFrom", "createdAt", "updatedAt"
)
VALUES
(
  'plan_basic_v2026_07',
  'basic_analysis',
  'v2026.07',
  'Základní analýza nemovitosti',
  'Bezplatná orientační analýza.',
  'ONE_TIME',
  'ACTIVE',
  0,
  'CZK',
  2100,
  'basic_analysis',
  '{"analysesPerMonth": 20, "comparisonsMax": 4}'::jsonb,
  '["basic_metrics", "orientacni_vynos"]'::jsonb,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_full_v2026_07',
  'full_analysis',
  'v2026.07',
  'Kompletní analýza nemovitosti',
  'Placená kompletní analýza včetně scénářů a rizik.',
  'ONE_TIME',
  'ACTIVE',
  499000,
  'CZK',
  2100,
  'full_analysis',
  '{"analysesPerMonth": 50, "comparisonsMax": 4}'::jsonb,
  '["valuation", "scenarios", "financing", "renovation", "location", "risks", "verdict"]'::jsonb,
  20,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_enterprise_v2026_07',
  'enterprise',
  'v2026.07',
  'Enterprise',
  'Týmový přístup a vyšší limity — individuální fakturace.',
  'SUBSCRIPTION',
  'ACTIVE',
  0,
  'CZK',
  2100,
  'enterprise',
  '{"analysesPerMonth": null, "comparisonsMax": 4, "seats": null}'::jsonb,
  '["all_full_analysis", "team", "priority_support"]'::jsonb,
  90,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key", "versionKey") DO NOTHING;
