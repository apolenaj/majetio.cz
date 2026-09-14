import {
  getApplicableMaxLtvPct,
  resolveActiveMortgageRegulatoryConfig,
} from "@/domains/financing/regulatory/regulatory-config";
import type { MortgagePropertyPurpose } from "@/config/mortgage-regulatory/types";

export type LtvScenarioAssessment = {
  matches: boolean;
  ltvOnAskingPricePct: number;
  applicableMaxLtvPct: number;
  propertyPurpose: MortgagePropertyPurpose;
  regulatoryConfigVersion: string;
  /** User-safe message — never implies bank approval. */
  userMessage: string;
};

function formatPct(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/**
 * Compares a modelled LTV against orientační tržní limit.
 * Does NOT perform DSTI/DTI or black-box approval.
 */
export function evaluateLtvScenarioMatch(input: {
  ltvOnAskingPricePct: number | null;
  propertyPurpose?: MortgagePropertyPurpose;
  marketCountry?: string;
  at?: Date;
}): LtvScenarioAssessment | null {
  if (input.ltvOnAskingPricePct == null) return null;

  const propertyPurpose = input.propertyPurpose ?? "investment";
  const config = resolveActiveMortgageRegulatoryConfig({
    marketCountry: input.marketCountry,
    at: input.at,
  });
  const maxLtv = getApplicableMaxLtvPct({
    propertyPurpose,
    marketCountry: input.marketCountry,
    at: input.at,
  });

  if (!config || maxLtv == null) return null;

  const ltv = input.ltvOnAskingPricePct;
  const matches = ltv <= maxLtv;

  const userMessage = matches
    ? `Tento scénář odpovídá zadanému LTV (${formatPct(ltv)} % ≤ orientační limit ${maxLtv} % pro ${
        propertyPurpose === "primary_residence" ? "vlastní bydlení" : "investiční účel"
      }).`
    : `Scénář překračuje orientační limit LTV (${formatPct(ltv)} % > ${maxLtv} %). Zvažte vyšší vlastní kapitál nebo jiný produkt.`;

  return {
    matches,
    ltvOnAskingPricePct: ltv,
    applicableMaxLtvPct: maxLtv,
    propertyPurpose,
    regulatoryConfigVersion: config.version,
    userMessage,
  };
}
