/**
 * Mortgage lead routing — partner selection by market context.
 * Prompt 17.4: delegates to FinancingProviderRegistry.
 * HypotekaJasne is CZ-only — foreign markets must not inherit CZ partners.
 */

import { resolveFinancingLeadRouting } from "@/domains/financing/providers/registry";

export type LeadRoutingDecision = {
  marketCountry: string;
  partner: string;
  routingRuleKey: string;
  reason: string;
  /** When false, do not submit to partner APIs. */
  handoffAllowed?: boolean;
};

export type LeadRoutingInput = {
  marketCountry?: string;
  propertyType?: string | null;
  estimatedLoanAmountCzk?: number | null;
};

export function resolveMortgageLeadRouting(
  input: LeadRoutingInput,
): LeadRoutingDecision {
  const resolved = resolveFinancingLeadRouting({
    marketCode: input.marketCountry,
    propertyType: input.propertyType,
    estimatedLoanAmountMajor: input.estimatedLoanAmountCzk ?? null,
  });

  return {
    marketCountry: resolved.marketCountry,
    partner: resolved.partner,
    routingRuleKey: resolved.routingRuleKey,
    reason: resolved.reason,
    handoffAllowed: resolved.handoffAllowed,
  };
}
