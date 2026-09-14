import type { MortgageLeadWorkflowStatus } from "@prisma/client";

/** Active workflow states — duplicate guard applies within the dedupe window. */
export const ACTIVE_MORTGAGE_LEAD_STATUSES: readonly MortgageLeadWorkflowStatus[] = [
  "CREATED",
  "SUBMISSION_PENDING",
  "SUBMITTED",
  "RECEIVED",
  "CONTACTED",
  "QUALIFICATION_IN_PROGRESS",
  "DOCUMENTS_NEEDED",
  "SOLUTION_PROPOSED",
  "APPROVED",
] as const;

/** Default duplicate prevention window (72 hours). */
export const MORTGAGE_LEAD_DEDUPE_WINDOW_MS = 72 * 60 * 60 * 1000;

export function buildMortgageLeadIdempotencyKey(input: {
  userId?: string | null;
  guestEmail?: string | null;
  propertyId?: string | null;
  analysisId?: string | null;
}): string {
  const owner =
    input.userId ??
    (input.guestEmail
      ? `guest:${input.guestEmail.toLowerCase().trim()}`
      : "anonymous");
  return [
    "mortgage-lead",
    owner,
    input.propertyId ?? "_",
    input.analysisId ?? "_",
  ].join(":");
}

export function isWithinDedupeWindow(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() <= MORTGAGE_LEAD_DEDUPE_WINDOW_MS;
}

export function isActiveMortgageLeadStatus(
  status: MortgageLeadWorkflowStatus,
): boolean {
  return (ACTIVE_MORTGAGE_LEAD_STATUSES as readonly string[]).includes(status);
}
