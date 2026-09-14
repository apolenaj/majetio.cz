/**
 * CRM foundation for mortgage leads — internal/admin use only (Prompt 16 prep).
 */

import { MortgageLeadCrmNextAction } from "@prisma/client";

import { prisma } from "@/lib/db";
import { resolveActiveMortgageRegulatoryConfig } from "@/domains/financing/regulatory/regulatory-config";
import { resolveMortgageLeadRouting } from "@/domains/leads/service/routing";
import {
  computeInternalLeadValueMetrics,
  type InternalLeadValueMetrics,
} from "@/domains/leads/service/internal-value-metrics";

export type InitializeMortgageLeadCrmInput = {
  leadId: string;
  ownerUserId?: string | null;
  marketCountry?: string;
  propertyType?: string | null;
  purchasePriceCzk?: number | null;
  availableEquityCzk?: number | null;
};

export type MortgageLeadCrmRecord = {
  leadId: string;
  ownerUserId: string | null;
  nextAction: MortgageLeadCrmNextAction;
  assignedToUserId: string | null;
  assignedAt: Date | null;
  routingCountry: string;
  routingPartner: string;
  routingRuleKey: string;
  regulatoryConfigVersion: string | null;
  /** @internal business reporting only */
  internalMetrics: InternalLeadValueMetrics;
};

export async function initializeMortgageLeadCrm(
  input: InitializeMortgageLeadCrmInput,
): Promise<MortgageLeadCrmRecord> {
  const metrics = computeInternalLeadValueMetrics({
    purchasePriceCzk: input.purchasePriceCzk,
    availableEquityCzk: input.availableEquityCzk,
  });

  const routing = resolveMortgageLeadRouting({
    marketCountry: input.marketCountry,
    propertyType: input.propertyType,
    estimatedLoanAmountCzk: metrics.estimatedLoanAmountCzk,
  });

  const regulatory = resolveActiveMortgageRegulatoryConfig({
    marketCountry: routing.marketCountry,
  });

  const crm = await prisma.mortgageLeadCrm.create({
    data: {
      leadId: input.leadId,
      ownerUserId: input.ownerUserId ?? null,
      nextAction: MortgageLeadCrmNextAction.AWAIT_PARTNER_RESPONSE,
      routingCountry: routing.marketCountry,
      routingPartner: routing.partner,
      routingRuleKey: routing.routingRuleKey,
      regulatoryConfigVersion: regulatory?.version ?? null,
      estimatedLoanAmountCzk: metrics.estimatedLoanAmountCzk,
      estimatedCommissionCzk: metrics.estimatedCommissionCzk,
      valueMetricsUpdatedAt: new Date(),
    },
  });

  return {
    leadId: crm.leadId,
    ownerUserId: crm.ownerUserId,
    nextAction: crm.nextAction,
    assignedToUserId: crm.assignedToUserId,
    assignedAt: crm.assignedAt,
    routingCountry: crm.routingCountry,
    routingPartner: crm.routingPartner,
    routingRuleKey: crm.routingRuleKey,
    regulatoryConfigVersion: crm.regulatoryConfigVersion,
    internalMetrics: metrics,
  };
}

/** Admin/internal loader — never call from user account pages. */
export async function getMortgageLeadCrmInternal(
  leadId: string,
): Promise<MortgageLeadCrmRecord | null> {
  const crm = await prisma.mortgageLeadCrm.findUnique({
    where: { leadId },
  });
  if (!crm) return null;

  return {
    leadId: crm.leadId,
    ownerUserId: crm.ownerUserId,
    nextAction: crm.nextAction,
    assignedToUserId: crm.assignedToUserId,
    assignedAt: crm.assignedAt,
    routingCountry: crm.routingCountry,
    routingPartner: crm.routingPartner,
    routingRuleKey: crm.routingRuleKey,
    regulatoryConfigVersion: crm.regulatoryConfigVersion,
    internalMetrics: {
      estimatedLoanAmountCzk: crm.estimatedLoanAmountCzk,
      estimatedCommissionCzk: crm.estimatedCommissionCzk,
    },
  };
}
