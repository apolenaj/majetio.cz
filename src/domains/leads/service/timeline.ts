import type { MortgageLeadWorkflowStatus } from "@prisma/client";

export type MortgageLeadTimelineStepState = "completed" | "current" | "upcoming";

export type MortgageLeadTimelineStep = {
  id: string;
  label: string;
  state: MortgageLeadTimelineStepState;
};

export const MORTGAGE_LEAD_TIMELINE_MILESTONES = [
  { id: "submitted", label: "Odesláno" },
  { id: "received", label: "Přijato" },
  { id: "contacted", label: "Kontakt" },
  { id: "resolution", label: "Řešení" },
  { id: "next", label: "Další krok" },
] as const;

function milestoneIndex(status: MortgageLeadWorkflowStatus): number {
  switch (status) {
    case "CREATED":
    case "SUBMISSION_PENDING":
    case "SUBMITTED":
      return 0;
    case "RECEIVED":
      return 1;
    case "CONTACTED":
      return 2;
    case "QUALIFICATION_IN_PROGRESS":
    case "DOCUMENTS_NEEDED":
    case "SOLUTION_PROPOSED":
      return 3;
    case "APPROVED":
    case "REJECTED":
    case "WITHDRAWN":
    case "CLOSED":
      return 4;
    default:
      return 0;
  }
}

export function buildMortgageLeadTimeline(
  status: MortgageLeadWorkflowStatus,
): MortgageLeadTimelineStep[] {
  const currentIdx = milestoneIndex(status);
  const isTerminal =
    status === "APPROVED" ||
    status === "REJECTED" ||
    status === "WITHDRAWN" ||
    status === "CLOSED";

  return MORTGAGE_LEAD_TIMELINE_MILESTONES.map((step, idx) => {
    if (isTerminal && idx === 4) {
      const label =
        status === "APPROVED"
          ? "Schváleno bankou"
          : status === "REJECTED"
            ? "Uzavřeno — zamítnuto"
            : status === "WITHDRAWN"
              ? "Staženo"
              : "Uzavřeno";

      return { ...step, label, state: "completed" as const };
    }

    let state: MortgageLeadTimelineStepState = "upcoming";
    if (idx < currentIdx) state = "completed";
    else if (idx === currentIdx) state = "current";

    return { ...step, state };
  });
}

/** Plain-language next step for account UI — no PII, no approval promises. */
export function mortgageLeadNextStep(status: MortgageLeadWorkflowStatus): string {
  switch (status) {
    case "CREATED":
    case "SUBMISSION_PENDING":
    case "SUBMITTED":
      return "Čekáme na potvrzení převzetí partnerem HypotekaJasne.";
    case "RECEIVED":
      return "Partner převzal požadavek — brzy vás může kontaktovat specialista.";
    case "CONTACTED":
      return "Specialista vás kontaktoval — pokračujte podle jeho instrukcí.";
    case "QUALIFICATION_IN_PROGRESS":
      return "Probíhá kvalifikace — partner může požádat o další podklady.";
    case "DOCUMENTS_NEEDED":
      return "Doplňte podklady, o které vás partner požádal.";
    case "SOLUTION_PROPOSED":
      return "Partner navrhl řešení — projděte nabídku a rozhodněte se.";
    case "APPROVED":
      return "Banka schválila financování — domluvte finalizaci s partnerem.";
    case "REJECTED":
      return "Partner požadavek ukončil. Můžete zvážit jinou nemovitost nebo scénář.";
    case "WITHDRAWN":
      return "Požadavek byl stažen. Nový požadavek můžete založit později.";
    case "CLOSED":
      return "Proces financování je uzavřen.";
    default:
      return "Sledujte aktualizace stavu v účtu.";
  }
}
