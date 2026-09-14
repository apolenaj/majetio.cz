/**
 * Czech mortgage market regulatory reference limits.
 * Separate from global Majetio investment-assumptions — CZ market only.
 * Versioned by validFrom/validTo; never hardcode limits in UI/domain logic.
 */

export type MortgageMarketCountry = "CZ";

export type MortgagePropertyPurpose = "primary_residence" | "investment";

export type MortgageRegulatoryLimits = {
  /** Max LTV % — primary residence (orientační referenční limit trhu). */
  maxLtvPctPrimaryResidence: number;
  /** Max LTV % — investment property. */
  maxLtvPctInvestment: number;
  /**
   * Reference DTI ratio ceiling — for internal/compliance notes only.
   * MUST NOT be used for user-facing affordability calculations.
   */
  referenceMaxDtiRatio: number;
  /**
   * Reference DSTI ratio ceiling — for internal/compliance notes only.
   * MUST NOT be used for user-facing affordability calculations.
   */
  referenceMaxDstiRatio: number;
  minBorrowerAge: number;
  maxBorrowerAgeAtTermEnd: number;
};

export type MortgageRegulatoryConfig = {
  version: string;
  marketCountry: MortgageMarketCountry;
  validFrom: string;
  validTo: string | null;
  limits: MortgageRegulatoryLimits;
  /** Fixed copy — regulatory UX guardrails. */
  disclaimers: {
    orientationalReadinessOnly: string;
    noOfficialDstiDti: string;
    ltvScenarioMatchingOnly: string;
  };
};
