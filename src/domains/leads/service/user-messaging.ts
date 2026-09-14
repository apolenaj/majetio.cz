import type { MortgageLeadWorkflowStatus } from "@prisma/client";

/** User-facing confirmation after lead submit — never implies bank approval. */
export function buildMortgageLeadSubmitConfirmation(input: {
  pending: boolean;
  workflowStatus: MortgageLeadWorkflowStatus;
}): { title: string; body: string } {
  const awaitingPartnerReceipt =
    input.pending ||
    input.workflowStatus === "CREATED" ||
    input.workflowStatus === "SUBMISSION_PENDING" ||
    input.workflowStatus === "SUBMITTED";

  if (awaitingPartnerReceipt) {
    return {
      title: "Požadavek jsme přijali",
      body: "Požadavek jsme přijali a předáváme jej ke zpracování.",
    };
  }

  return {
    title: "Požadavek na posouzení financování byl předán",
    body: "Požadavek na posouzení financování byl předán. Stav můžete sledovat v sekci Financování.",
  };
}

export function mortgageLeadFinancingPageHref(correlationId: string): string {
  return `/ucet/financovani/${correlationId}`;
}
