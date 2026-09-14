/**
 * Qualified lead billing conditions (checklist 183, 216).
 * Defines WHEN MODE A / MODE B may charge — separate from ranking.
 */

import type { OrganizationLeadBillingMode } from "@prisma/client";

export const QUALIFIED_LEAD_BILLING_CONDITIONS = {
  /**
   * MODE A — Pay Per Lead.
   * Charge when agent accepts a product-qualified lead (not on inquiry create).
   */
  PAY_PER_LEAD: {
    mode: "PAY_PER_LEAD" as const satisfies OrganizationLeadBillingMode,
    trigger: "AGENT_ACCEPTED" as const,
    requiresOrganization: true,
    requiresQualifiedStatus: true,
    blockedByDisputeUpheld: true,
    /** Never charge on raw Inquiry without qualification. */
    chargeOnInquiryCreate: false,
    idempotentPerLead: true,
  },
  /**
   * MODE B — Success fee from broker commission.
   * Potential fee on deal close; ledger only after verification.
   */
  SUCCESS_FEE: {
    mode: "SUCCESS_FEE" as const satisfies OrganizationLeadBillingMode,
    trigger: "DEAL_CLOSED_VERIFIED" as const,
    requiresBrokerCommissionGross: true,
    recognizeOnPotentialCreate: false,
    requiresVerificationBeforeInvoice: true,
  },
} as const;

export type QualifiedLeadBillingModeKey = keyof typeof QUALIFIED_LEAD_BILLING_CONDITIONS;

export function describeLeadBillingConditionsCs(
  mode: OrganizationLeadBillingMode,
): string {
  if (mode === "PAY_PER_LEAD") {
    return "Účtování Pay Per Lead při přijetí kvalifikovaného zájemce agentem. Inquiry samotné se neúčtuje. Dispute UPHELD zruší nárok.";
  }
  return "Success fee z provize makléře — nejdřív POTENTIAL, uznání až po ověření. Není to Purchase Concierge / zastoupení kupujícího.";
}

export function shouldChargePayPerLeadOnAccept(input: {
  organizationId: string | null | undefined;
  billingMode: OrganizationLeadBillingMode | null | undefined;
}): boolean {
  if (!input.organizationId) return false;
  if (input.billingMode !== "PAY_PER_LEAD") return false;
  return QUALIFIED_LEAD_BILLING_CONDITIONS.PAY_PER_LEAD.trigger === "AGENT_ACCEPTED";
}
