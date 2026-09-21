CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('USER', 'PAID_CLIENT', 'ANALYST', 'SALES', 'EDITOR', 'PARTNER', 'ADMIN', 'SUPER_ADMIN');

CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'ARCHIVED');

CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER');

CREATE TYPE "AnalysisTier" AS ENUM ('BASIC', 'FULL');

CREATE TYPE "AnalysisStatus" AS ENUM ('DRAFT', 'READY', 'PURCHASED', 'ARCHIVED');

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

CREATE TYPE "LeadType" AS ENUM ('ANALYSIS_INTEREST', 'FINANCING', 'TRANSACTION', 'PARTNER_SERVICE', 'OTHER');

CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST', 'HANDED_OFF');

CREATE TYPE "ConsentType" AS ENUM ('TERMS', 'PRIVACY', 'MARKETING', 'HYPOTEKAJASNE_HANDOFF', 'PARTNER_SHARE');

CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

CREATE TABLE "User" (     "id" TEXT NOT NULL,     "email" TEXT NOT NULL,     "emailVerified" TIMESTAMP(3),     "name" TEXT,     "image" TEXT,     "passwordHash" TEXT,     "role" "Role" NOT NULL DEFAULT 'USER',     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "User_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Account" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "type" TEXT NOT NULL,     "provider" TEXT NOT NULL,     "providerAccountId" TEXT NOT NULL,     "refresh_token" TEXT,     "access_token" TEXT,     "expires_at" INTEGER,     "token_type" TEXT,     "scope" TEXT,     "id_token" TEXT,     "session_state" TEXT,      CONSTRAINT "Account_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Session" (     "id" TEXT NOT NULL,     "sessionToken" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "expires" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Session_pkey" PRIMARY KEY ("id") );

CREATE TABLE "VerificationToken" (     "identifier" TEXT NOT NULL,     "token" TEXT NOT NULL,     "expires" TIMESTAMP(3) NOT NULL );

CREATE TABLE "UserProfile" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "phone" TEXT,     "preferredLocale" TEXT NOT NULL DEFAULT 'cs',     "investmentGoal" TEXT,     "notes" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id") );

CREATE TABLE "FinancialProfile" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "monthlyIncomeCzk" INTEGER,     "monthlyLiabilitiesCzk" INTEGER,     "availableEquityCzk" INTEGER,     "employmentType" TEXT,     "creditScoreBand" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "FinancialProfile_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Consent" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "type" "ConsentType" NOT NULL,     "granted" BOOLEAN NOT NULL,     "version" TEXT NOT NULL,     "grantedAt" TIMESTAMP(3),     "revokedAt" TIMESTAMP(3),     "metadata" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "Consent_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Location" (     "id" TEXT NOT NULL,     "slug" TEXT NOT NULL,     "name" TEXT NOT NULL,     "region" TEXT,     "district" TEXT,     "country" TEXT NOT NULL DEFAULT 'CZ',     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Location_pkey" PRIMARY KEY ("id") );

CREATE TABLE "LocationMetric" (     "id" TEXT NOT NULL,     "locationId" TEXT NOT NULL,     "type" TEXT NOT NULL,     "value" DOUBLE PRECISION NOT NULL,     "unit" TEXT,     "period" TEXT,     "source" TEXT,     "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "LocationMetric_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Property" (     "id" TEXT NOT NULL,     "slug" TEXT NOT NULL,     "title" TEXT NOT NULL,     "description" TEXT,     "propertyType" "PropertyType" NOT NULL,     "disposition" TEXT,     "areaSqm" DOUBLE PRECISION,     "priceCzk" INTEGER,     "currency" TEXT NOT NULL DEFAULT 'CZK',     "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',     "city" TEXT,     "street" TEXT,     "zip" TEXT,     "locationId" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Property_pkey" PRIMARY KEY ("id") );

CREATE TABLE "PropertySource" (     "id" TEXT NOT NULL,     "propertyId" TEXT NOT NULL,     "provider" TEXT NOT NULL,     "externalId" TEXT,     "url" TEXT,     "rawPayload" JSONB,     "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "PropertySource_pkey" PRIMARY KEY ("id") );

CREATE TABLE "PropertyImage" (     "id" TEXT NOT NULL,     "propertyId" TEXT NOT NULL,     "url" TEXT NOT NULL,     "alt" TEXT,     "sortOrder" INTEGER NOT NULL DEFAULT 0,     "isPrimary" BOOLEAN NOT NULL DEFAULT false,      CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id") );

CREATE TABLE "PropertyPriceHistory" (     "id" TEXT NOT NULL,     "propertyId" TEXT NOT NULL,     "priceCzk" INTEGER NOT NULL,     "source" TEXT,     "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "PropertyPriceHistory_pkey" PRIMARY KEY ("id") );

CREATE TABLE "PropertyStatusHistory" (     "id" TEXT NOT NULL,     "propertyId" TEXT NOT NULL,     "status" "PropertyStatus" NOT NULL,     "source" TEXT,     "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "PropertyStatusHistory_pkey" PRIMARY KEY ("id") );

CREATE TABLE "PropertyAnalysis" (     "id" TEXT NOT NULL,     "userId" TEXT,     "propertyId" TEXT,     "status" "AnalysisStatus" NOT NULL DEFAULT 'DRAFT',     "tier" "AnalysisTier" NOT NULL DEFAULT 'BASIC',     "majetioScore" DOUBLE PRECISION,     "summary" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "PropertyAnalysis_pkey" PRIMARY KEY ("id") );

CREATE TABLE "AnalysisScenario" (     "id" TEXT NOT NULL,     "analysisId" TEXT NOT NULL,     "name" TEXT NOT NULL,     "assumptions" JSONB NOT NULL,     "results" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "AnalysisScenario_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Valuation" (     "id" TEXT NOT NULL,     "analysisId" TEXT,     "propertyId" TEXT,     "estimatedValueCzk" INTEGER NOT NULL,     "method" TEXT NOT NULL,     "confidence" DOUBLE PRECISION,     "notes" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id") );

CREATE TABLE "ValuationComparable" (     "id" TEXT NOT NULL,     "valuationId" TEXT NOT NULL,     "label" TEXT NOT NULL,     "priceCzk" INTEGER,     "areaSqm" DOUBLE PRECISION,     "distanceMeters" INTEGER,     "externalRef" TEXT,     "propertyId" TEXT,      CONSTRAINT "ValuationComparable_pkey" PRIMARY KEY ("id") );

CREATE TABLE "InvestmentCalculation" (     "id" TEXT NOT NULL,     "analysisId" TEXT NOT NULL,     "engineVersion" TEXT NOT NULL,     "inputs" JSONB NOT NULL,     "outputs" JSONB NOT NULL,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "InvestmentCalculation_pkey" PRIMARY KEY ("id") );

CREATE TABLE "RenovationEstimate" (     "id" TEXT NOT NULL,     "analysisId" TEXT NOT NULL,     "scope" TEXT NOT NULL,     "estimatedCostCzk" INTEGER NOT NULL,     "contingencyPct" DOUBLE PRECISION NOT NULL DEFAULT 10,     "lineItems" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "RenovationEstimate_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Favourite" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "propertyId" TEXT NOT NULL,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "Favourite_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Comparison" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "name" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id") );

CREATE TABLE "ComparisonItem" (     "id" TEXT NOT NULL,     "comparisonId" TEXT NOT NULL,     "propertyId" TEXT NOT NULL,     "sortOrder" INTEGER NOT NULL DEFAULT 0,      CONSTRAINT "ComparisonItem_pkey" PRIMARY KEY ("id") );

CREATE TABLE "SavedSearch" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "name" TEXT NOT NULL,     "criteria" JSONB NOT NULL,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Lead" (     "id" TEXT NOT NULL,     "type" "LeadType" NOT NULL,     "status" "LeadStatus" NOT NULL DEFAULT 'NEW',     "userId" TEXT,     "propertyId" TEXT,     "email" TEXT,     "phone" TEXT,     "payload" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Lead_pkey" PRIMARY KEY ("id") );

CREATE TABLE "LeadActivity" (     "id" TEXT NOT NULL,     "leadId" TEXT NOT NULL,     "type" TEXT NOT NULL,     "note" TEXT,     "meta" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Order" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "analysisId" TEXT,     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',     "productKey" TEXT NOT NULL,     "amountCzk" INTEGER NOT NULL,     "currency" TEXT NOT NULL DEFAULT 'CZK',     "configSnapshot" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Order_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Payment" (     "id" TEXT NOT NULL,     "orderId" TEXT NOT NULL,     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',     "amountCzk" INTEGER NOT NULL,     "currency" TEXT NOT NULL DEFAULT 'CZK',     "provider" TEXT,     "providerPaymentId" TEXT,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Payment_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Partner" (     "id" TEXT NOT NULL,     "name" TEXT NOT NULL,     "type" TEXT NOT NULL,     "email" TEXT,     "phone" TEXT,     "active" BOOLEAN NOT NULL DEFAULT true,     "metadata" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,     "updatedAt" TIMESTAMP(3) NOT NULL,      CONSTRAINT "Partner_pkey" PRIMARY KEY ("id") );

CREATE TABLE "Notification" (     "id" TEXT NOT NULL,     "userId" TEXT NOT NULL,     "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',     "title" TEXT NOT NULL,     "body" TEXT,     "readAt" TIMESTAMP(3),     "meta" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "Notification_pkey" PRIMARY KEY ("id") );

CREATE TABLE "AuditLog" (     "id" TEXT NOT NULL,     "actorId" TEXT,     "action" TEXT NOT NULL,     "entity" TEXT NOT NULL,     "entityId" TEXT,     "ip" TEXT,     "meta" JSONB,     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,      CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id") );

CREATE TABLE "AppConfiguration" (     "id" TEXT NOT NULL,     "key" TEXT NOT NULL,     "value" JSONB NOT NULL,     "description" TEXT,     "updatedAt" TIMESTAMP(3) NOT NULL,     "updatedById" TEXT,      CONSTRAINT "AppConfiguration_pkey" PRIMARY KEY ("id") );

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

CREATE UNIQUE INDEX "FinancialProfile_userId_key" ON "FinancialProfile"("userId");

CREATE INDEX "Consent_userId_type_idx" ON "Consent"("userId", "type");

CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

CREATE INDEX "LocationMetric_locationId_type_idx" ON "LocationMetric"("locationId", "type");

CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

CREATE INDEX "PropertySource_provider_externalId_idx" ON "PropertySource"("provider", "externalId");

CREATE UNIQUE INDEX "Favourite_userId_propertyId_key" ON "Favourite"("userId", "propertyId");

CREATE UNIQUE INDEX "ComparisonItem_comparisonId_propertyId_key" ON "ComparisonItem"("comparisonId", "propertyId");

CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE UNIQUE INDEX "AppConfiguration_key_key" ON "AppConfiguration"("key");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinancialProfile" ADD CONSTRAINT "FinancialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocationMetric" ADD CONSTRAINT "LocationMetric_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Property" ADD CONSTRAINT "Property_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertySource" ADD CONSTRAINT "PropertySource_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyPriceHistory" ADD CONSTRAINT "PropertyPriceHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAnalysis" ADD CONSTRAINT "PropertyAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyAnalysis" ADD CONSTRAINT "PropertyAnalysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalysisScenario" ADD CONSTRAINT "AnalysisScenario_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ValuationComparable" ADD CONSTRAINT "ValuationComparable_valuationId_fkey" FOREIGN KEY ("valuationId") REFERENCES "Valuation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvestmentCalculation" ADD CONSTRAINT "InvestmentCalculation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RenovationEstimate" ADD CONSTRAINT "RenovationEstimate_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComparisonItem" ADD CONSTRAINT "ComparisonItem_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComparisonItem" ADD CONSTRAINT "ComparisonItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AppConfiguration" ADD CONSTRAINT "AppConfiguration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
