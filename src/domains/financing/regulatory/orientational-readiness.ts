import type { PropertyFinancingSummary } from "@/domains/financing/property-financing";
import {
  computeMortgageReadiness,
  type MortgageReadiness,
  type MortgageReadinessInput,
} from "@/domains/financing/mortgage-readiness";
import {
  evaluateLtvScenarioMatch,
  type LtvScenarioAssessment,
} from "@/domains/financing/regulatory/ltv-scenario-match";
import { resolveActiveMortgageRegulatoryConfig } from "@/domains/financing/regulatory/regulatory-config";
import type { MortgagePropertyPurpose } from "@/config/mortgage-regulatory/types";

export type OrientationalMortgageReadiness = MortgageReadiness & {
  /** Present when financing summary includes LTV — never bank approval. */
  ltvScenarioAssessment: LtvScenarioAssessment | null;
  regulatoryDisclaimer: string;
};

/**
 * Wraps checklist readiness with orientační LTV scenario messaging.
 * Never computes official DSTI/DTI.
 */
export function computeOrientationalMortgageReadiness(input: {
  readinessInput: MortgageReadinessInput;
  financingSummary?: PropertyFinancingSummary | null;
  propertyPurpose?: MortgagePropertyPurpose;
  marketCountry?: string;
}): OrientationalMortgageReadiness {
  const base = computeMortgageReadiness(input.readinessInput);
  const config = resolveActiveMortgageRegulatoryConfig({
    marketCountry: input.marketCountry,
  });

  const ltvScenarioAssessment = input.financingSummary
    ? evaluateLtvScenarioMatch({
        ltvOnAskingPricePct: input.financingSummary.ltvOnAskingPricePct,
        propertyPurpose: input.propertyPurpose,
        marketCountry: input.marketCountry,
      })
    : null;

  let description = base.description;
  if (ltvScenarioAssessment) {
    description = `${base.description} ${ltvScenarioAssessment.userMessage}`;
  }

  return {
    ...base,
    description,
    ltvScenarioAssessment,
    regulatoryDisclaimer:
      config?.disclaimers.orientationalReadinessOnly ??
      "Orientační připravenost — ne bankovní schválení.",
  };
}
