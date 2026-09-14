-- Phase 3: Entitlements & Subscriptions — Order scope + EntitlementSource (manual vs paid)

CREATE TYPE "EntitlementSource" AS ENUM ('PAID_ORDER', 'FREE_CHECKOUT', 'MANUAL_ADMIN');

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "source" "EntitlementSource" NOT NULL DEFAULT 'PAID_ORDER';
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "manualReason" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "manualActorUserId" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "manualGrantedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Order_propertyId_idx" ON "Order"("propertyId");
CREATE INDEX IF NOT EXISTS "Order_organizationId_idx" ON "Order"("organizationId");
CREATE INDEX IF NOT EXISTS "Entitlement_source_status_idx" ON "Entitlement"("source", "status");
CREATE INDEX IF NOT EXISTS "Entitlement_manualActorUserId_idx" ON "Entitlement"("manualActorUserId");

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_manualActorUserId_fkey"
    FOREIGN KEY ("manualActorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
