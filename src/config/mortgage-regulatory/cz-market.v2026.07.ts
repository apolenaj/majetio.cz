import type { MortgageRegulatoryConfig } from "./types";

/**
 * ČR trh — verzovaná regulační reference (Prompt 13/9).
 * Hodnoty slouží pro orientační LTV scénáře, ne pro bankovní underwriting.
 */
export const CZ_MORTGAGE_REGULATORY_V2026_07: MortgageRegulatoryConfig = {
  version: "cz-mortgage-regulatory.v2026.07",
  marketCountry: "CZ",
  validFrom: "2026-07-01",
  validTo: null,
  limits: {
    maxLtvPctPrimaryResidence: 90,
    maxLtvPctInvestment: 80,
    referenceMaxDtiRatio: 0.45,
    referenceMaxDstiRatio: 0.45,
    minBorrowerAge: 18,
    maxBorrowerAgeAtTermEnd: 70,
  },
  disclaimers: {
    orientationalReadinessOnly:
      "Jde o orientační připravenost podkladů. Majetio neposkytuje bankovní posouzení bonity.",
    noOfficialDstiDti:
      "Oficiální DSTI/DTI bez aktuální metodiky konkrétní banky nepočítáme.",
    ltvScenarioMatchingOnly:
      "Scénáře porovnáváme se zadaným LTV a orientačními limity trhu — nikoli se schválením banky.",
  },
};

export const CZ_MORTGAGE_REGULATORY_CATALOG: readonly MortgageRegulatoryConfig[] = [
  CZ_MORTGAGE_REGULATORY_V2026_07,
] as const;
