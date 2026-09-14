import type { MortgageLeadWorkflowStatus } from "@prisma/client";

/** User-facing workflow labels — never imply bank pre-approval. */
export const MORTGAGE_LEAD_STATUS_LABELS: Record<
  MortgageLeadWorkflowStatus,
  string
> = {
  CREATED: "Vytvořeno",
  SUBMISSION_PENDING: "Čeká na odeslání partnerovi",
  SUBMITTED: "Odesláno partnerovi",
  RECEIVED: "Přijato partnerem",
  CONTACTED: "Kontaktován specialista",
  QUALIFICATION_IN_PROGRESS: "Probíhá kvalifikace",
  DOCUMENTS_NEEDED: "Doplnění podkladů",
  SOLUTION_PROPOSED: "Navržené řešení",
  APPROVED: "Schváleno bankou",
  REJECTED: "Zamítnuto",
  WITHDRAWN: "Staženo",
  CLOSED: "Uzavřeno",
};

export const MORTGAGE_LEAD_ALLOWED_TRANSITIONS: Record<
  MortgageLeadWorkflowStatus,
  readonly MortgageLeadWorkflowStatus[]
> = {
  CREATED: ["SUBMITTED", "SUBMISSION_PENDING", "WITHDRAWN"],
  SUBMISSION_PENDING: ["SUBMITTED", "REJECTED", "WITHDRAWN"],
  SUBMITTED: ["RECEIVED", "SUBMISSION_PENDING", "REJECTED", "WITHDRAWN"],
  RECEIVED: ["CONTACTED", "REJECTED", "WITHDRAWN"],
  CONTACTED: ["QUALIFICATION_IN_PROGRESS", "REJECTED", "WITHDRAWN"],
  QUALIFICATION_IN_PROGRESS: [
    "DOCUMENTS_NEEDED",
    "SOLUTION_PROPOSED",
    "REJECTED",
    "WITHDRAWN",
  ],
  DOCUMENTS_NEEDED: [
    "QUALIFICATION_IN_PROGRESS",
    "SOLUTION_PROPOSED",
    "REJECTED",
    "WITHDRAWN",
  ],
  SOLUTION_PROPOSED: ["APPROVED", "REJECTED", "WITHDRAWN", "CLOSED"],
  APPROVED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  WITHDRAWN: ["CLOSED"],
  CLOSED: [],
};

export function assertMortgageLeadTransition(
  from: MortgageLeadWorkflowStatus,
  to: MortgageLeadWorkflowStatus,
): void {
  if (from === to) return;
  const allowed = MORTGAGE_LEAD_ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid mortgage lead transition: ${from} → ${to}`);
  }
}

export function mortgageLeadStatusLabel(
  status: MortgageLeadWorkflowStatus,
): string {
  return MORTGAGE_LEAD_STATUS_LABELS[status];
}
