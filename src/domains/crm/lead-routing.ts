/**
 * Unified lead routing — mortgages, listing inquiries, property audits.
 * Mortgage path delegates to HypotekaJasne integration (domains/leads/routing).
 */

import type { LeadRoutingTarget, LeadType } from "@prisma/client";

import { resolveMortgageLeadRouting } from "@/domains/leads/service/routing";

export type CrmRoutingDecision = {
  target: LeadRoutingTarget;
  routingRuleKey: string;
  partner: string | null;
  /** Suggested assignee user id (listing agent / analyst). */
  assignToUserId: string | null;
  organizationId: string | null;
  reasonCs: string;
  /** Docs / integration pointer for mortgage handoff. */
  integrationRef: string | null;
};

export type CrmRoutingInput = {
  leadType: LeadType;
  marketCountry?: string | null;
  propertyType?: string | null;
  estimatedLoanAmountCzk?: number | null;
  /** Listing agent from Property.listedByUserId */
  listingAgentUserId?: string | null;
  organizationId?: string | null;
  /** Preferred analyst for audits (optional queue pick). */
  analystUserId?: string | null;
};

/**
 * Route lead to partner / agent / analyst.
 *
 * - FINANCING → MORTGAGE_PARTNER (HypotekaJasne) — see docs/MORTGAGE_LEAD_FUNNEL.md
 * - PROPERTY_INQUIRY / TRANSACTION → LISTING_AGENT
 * - PROPERTY_AUDIT / ANALYSIS_INTEREST → INTERNAL_ANALYST
 */
export function resolveCrmLeadRouting(input: CrmRoutingInput): CrmRoutingDecision {
  switch (input.leadType) {
    case "FINANCING": {
      const mortgage = resolveMortgageLeadRouting({
        marketCountry: input.marketCountry ?? "CZ",
        propertyType: input.propertyType,
        estimatedLoanAmountCzk: input.estimatedLoanAmountCzk,
      });
      return {
        target: "MORTGAGE_PARTNER",
        routingRuleKey: mortgage.routingRuleKey,
        partner: mortgage.partner,
        assignToUserId: null,
        organizationId: input.organizationId ?? null,
        reasonCs: mortgage.reason,
        integrationRef:
          "src/domains/leads/service/routing.ts → HypotekaJasne (docs/MORTGAGE_LEAD_FUNNEL.md)",
      };
    }
    case "PROPERTY_INQUIRY":
    case "TRANSACTION": {
      return {
        target: "LISTING_AGENT",
        routingRuleKey: "listing-agent-from-property",
        partner: null,
        assignToUserId: input.listingAgentUserId ?? null,
        organizationId: input.organizationId ?? null,
        reasonCs: input.listingAgentUserId
          ? "Poptávka směrována na makléře inzerátu."
          : "Poptávka čeká na přiřazení makléře inzerátu.",
        integrationRef: null,
      };
    }
    case "PROPERTY_AUDIT":
    case "ANALYSIS_INTEREST": {
      return {
        target: "INTERNAL_ANALYST",
        routingRuleKey: "internal-analyst-queue",
        partner: null,
        assignToUserId: input.analystUserId ?? null,
        organizationId: null,
        reasonCs: "Audit / zájem o analýzu → interní analytici Majetio.",
        integrationRef: null,
      };
    }
    default:
      return {
        target: "UNASSIGNED",
        routingRuleKey: "unassigned-default",
        partner: null,
        assignToUserId: null,
        organizationId: input.organizationId ?? null,
        reasonCs: "Typ leadu bez specifického routingu.",
        integrationRef: null,
      };
  }
}
