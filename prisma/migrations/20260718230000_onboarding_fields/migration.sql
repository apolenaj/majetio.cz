-- AlterTable UserProfile
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "onboardingGoal" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "onboardingSkippedAt" TIMESTAMP(3);

-- AlterTable FinancialProfile
ALTER TABLE "FinancialProfile" ADD COLUMN IF NOT EXISTS "equityPercent" DOUBLE PRECISION;
ALTER TABLE "FinancialProfile" ADD COLUMN IF NOT EXISTS "financingMode" TEXT;

-- AlterTable PropertyPreference
ALTER TABLE "PropertyPreference" ADD COLUMN IF NOT EXISTS "preferredCity" TEXT;

-- AlterTable InvestmentPreference
ALTER TABLE "InvestmentPreference" ADD COLUMN IF NOT EXISTS "targetCashFlowMonthlyCzk" INTEGER;
