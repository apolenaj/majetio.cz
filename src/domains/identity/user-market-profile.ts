/**
 * UserMarketProfile + international Financial Passport (Prompt 17.5).
 * Global identity + per-market preferences. Money is currency-tagged — not CZK-only.
 */

import type { CurrencyCode } from "@/domains/finance";
import { assertPassportFieldAllowed } from "@/domains/privacy/policy-registry";

export type UserInvestmentGoal =
  | "OWN_HOME"
  | "INVESTMENT"
  | "RENOVATION"
  | "FLIP"
  | "EXPLORING"
  | null;

export type UserMarketProfile = {
  userId: string;
  marketCode: string;
  /** UI locale for this market context. */
  preferredLocale: string;
  /** Display / budget currency for this market (AED on AE, CZK on CZ). */
  preferredCurrency: CurrencyCode;
  /** Soft preference — never required for browsing. */
  goal: UserInvestmentGoal;
  /** Optional region/community slugs within the market. */
  preferredLocationSlugs: string[];
  /**
   * Budget ceiling in preferredCurrency minor units.
   * Null = not provided (do not invent).
   */
  maxBudgetMinor: number | null;
  availableEquityMinor: number | null;
  /** Monthly income in preferredCurrency — optional. */
  monthlyIncomeMinor: number | null;
  monthlyLiabilitiesMinor: number | null;
  updatedAt: string;
};

/**
 * International Financial Passport — market-agnostic money fields.
 * Legacy CZK fields remain in PassportState for CZ UI back-compat.
 */
export type InternationalFinancialPassport = {
  /** Global user id. */
  userId: string;
  /** Home / primary market. */
  homeMarketCode: string;
  /** Active market profiles (usually 1; multi-market explorers may have more). */
  marketProfiles: UserMarketProfile[];
  riskTolerance: "CONSERVATIVE" | "BALANCED" | "DYNAMIC" | null;
  financingMode: "MORTGAGE" | "MIXED" | "CASH" | null;
  /**
   * Explicitly NOT collected without justification:
   * taxResidenceCountry, nationalId, etc.
   */
  collectedFields: string[];
};

export function createEmptyUserMarketProfile(input: {
  userId: string;
  marketCode: string;
  preferredLocale: string;
  preferredCurrency: CurrencyCode;
}): UserMarketProfile {
  return {
    userId: input.userId,
    marketCode: input.marketCode.toUpperCase(),
    preferredLocale: input.preferredLocale,
    preferredCurrency: input.preferredCurrency,
    goal: null,
    preferredLocationSlugs: [],
    maxBudgetMinor: null,
    availableEquityMinor: null,
    monthlyIncomeMinor: null,
    monthlyLiabilitiesMinor: null,
    updatedAt: new Date().toISOString(),
  };
}

export function createInternationalPassport(input: {
  userId: string;
  homeMarketCode: string;
  homeLocale: string;
  homeCurrency: CurrencyCode;
}): InternationalFinancialPassport {
  return {
    userId: input.userId,
    homeMarketCode: input.homeMarketCode.toUpperCase(),
    marketProfiles: [
      createEmptyUserMarketProfile({
        userId: input.userId,
        marketCode: input.homeMarketCode,
        preferredLocale: input.homeLocale,
        preferredCurrency: input.homeCurrency,
      }),
    ],
    riskTolerance: null,
    financingMode: null,
    collectedFields: [],
  };
}

/**
 * Map legacy CZ PassportState money (major CZK) into a CZ UserMarketProfile.
 */
export function userMarketProfileFromLegacyCzPassport(input: {
  userId: string;
  maxPriceCzk: number | null;
  availableEquityCzk: number | null;
  monthlyIncomeCzk: number | null;
  monthlyLiabilitiesCzk: number | null;
  preferredLocale?: string;
  regions?: string[];
  goal?: UserInvestmentGoal;
}): UserMarketProfile {
  const toMinor = (major: number | null) =>
    major == null ? null : Math.round(major * 100);

  return {
    userId: input.userId,
    marketCode: "CZ",
    preferredLocale: input.preferredLocale ?? "cs-CZ",
    preferredCurrency: "CZK",
    goal: input.goal ?? null,
    preferredLocationSlugs: input.regions ?? [],
    maxBudgetMinor: toMinor(input.maxPriceCzk),
    availableEquityMinor: toMinor(input.availableEquityCzk),
    monthlyIncomeMinor: toMinor(input.monthlyIncomeCzk),
    monthlyLiabilitiesMinor: toMinor(input.monthlyLiabilitiesCzk),
    updatedAt: new Date().toISOString(),
  };
}

export function getMarketProfile(
  passport: InternationalFinancialPassport,
  marketCode: string,
): UserMarketProfile | null {
  return (
    passport.marketProfiles.find(
      (p) => p.marketCode === marketCode.toUpperCase(),
    ) ?? null
  );
}

export function upsertMarketProfile(
  passport: InternationalFinancialPassport,
  profile: UserMarketProfile,
): InternationalFinancialPassport {
  const code = profile.marketCode.toUpperCase();
  const others = passport.marketProfiles.filter((p) => p.marketCode !== code);
  return {
    ...passport,
    marketProfiles: [...others, { ...profile, marketCode: code }],
  };
}

/**
 * Register a collected field — blocks minimized-away PII without justification.
 */
export function registerCollectedField(
  passport: InternationalFinancialPassport,
  field: string,
  justification?: string,
): InternationalFinancialPassport {
  assertPassportFieldAllowed(field, justification);
  if (passport.collectedFields.includes(field)) return passport;
  return {
    ...passport,
    collectedFields: [...passport.collectedFields, field],
  };
}
