/**
 * Partner lead submission with retry / dead-letter handling.
 */

import {
  LeadStatus,
  type MortgageLeadWorkflowStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { createHypotekaJasneClient } from "@/integrations/hypotekajasne";
import { HypotekaJasneApiError } from "@/integrations/hypotekajasne/security/api-errors";
import type { HypotekaJasneLeadPayload } from "@/domains/leads/schemas/mortgage-lead";
import { assertMortgageLeadTransition } from "@/domains/leads/service/workflow";
import {
  computeNextRetryAt,
  shouldMoveToDeadLetter,
} from "@/domains/leads/service/submission-retry";

export type SubmissionExecutionResult =
  | {
      ok: true;
      externalLeadId: string;
      isMock: boolean;
      workflowStatus: MortgageLeadWorkflowStatus;
      pending: boolean;
    }
  | {
      ok: false;
      error: string;
      code: "PARTNER_REJECTED" | "DEAD_LETTER";
    };

type LeadWithProfile = Prisma.LeadGetPayload<{
  include: { mortgageProfile: true };
}>;

export async function executePartnerLeadSubmission(input: {
  lead: LeadWithProfile;
  partnerPayload: HypotekaJasneLeadPayload;
}): Promise<SubmissionExecutionResult> {
  const { lead, partnerPayload } = input;
  const profile = lead.mortgageProfile;
  if (!profile) {
    return { ok: false, error: "Chybí mortgage profil.", code: "PARTNER_REJECTED" };
  }

  if (profile.externalLeadId) {
    return {
      ok: true,
      externalLeadId: profile.externalLeadId,
      isMock: profile.isMockSubmission,
      workflowStatus: profile.workflowStatus,
      pending: false,
    };
  }

  const fromStatus = profile.workflowStatus;
  if (fromStatus !== "CREATED" && fromStatus !== "SUBMISSION_PENDING") {
    assertMortgageLeadTransition(fromStatus, "SUBMITTED");
  } else {
    assertMortgageLeadTransition(fromStatus, "SUBMITTED");
  }

  const attemptNumber = profile.submissionAttempts + 1;
  const now = new Date();

  await prisma.mortgageLeadProfile.update({
    where: { id: profile.id },
    data: {
      workflowStatus: "SUBMITTED",
      submittedAt: profile.submittedAt ?? now,
      submissionAttempts: attemptNumber,
    },
  });

  await prisma.mortgageLeadSubmissionAttempt.create({
    data: {
      leadId: lead.id,
      attemptNumber,
      status: "PENDING",
    },
  });

  try {
    const client = createHypotekaJasneClient();
    const handoff = await client.handoffLead(partnerPayload);

    if (handoff.status !== "accepted") {
      await recordSubmissionFailure({
        leadId: lead.id,
        profileId: profile.id,
        attemptNumber,
        error: "Partner rejected lead",
        httpStatus: null,
        retryable: false,
        correlationId: lead.correlationId,
      });
      return {
        ok: false,
        error: "Partner předání nepřijal. Data nebyla předána.",
        code: "PARTNER_REJECTED",
      };
    }

    await prisma.$transaction([
      prisma.mortgageLeadSubmissionAttempt.updateMany({
        where: { leadId: lead.id, attemptNumber },
        data: { status: "SUCCESS" },
      }),
      prisma.mortgageLeadProfile.update({
        where: { id: profile.id },
        data: {
          workflowStatus: "RECEIVED",
          externalLeadId: handoff.externalLeadId,
          partnerReference: handoff.externalLeadId,
          isMockSubmission: handoff.isMock,
          receivedAt: now,
          lastPartnerSyncAt: now,
          lastSubmissionError: null,
          nextRetryAt: null,
        },
      }),
      prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.HANDED_OFF,
          payload: mergeLeadPayload(lead.payload, {
            externalLeadId: handoff.externalLeadId,
            isMock: handoff.isMock,
            partnerPayloadSentAt: now.toISOString(),
          }),
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "mortgage_lead.submitted",
          note: "Lead odeslán partnerovi HypotekaJasne.",
          meta: {
            correlationId: lead.correlationId,
            externalLeadId: handoff.externalLeadId,
            isMock: handoff.isMock,
            attemptNumber,
          },
        },
      }),
    ]);

    return {
      ok: true,
      externalLeadId: handoff.externalLeadId,
      isMock: handoff.isMock,
      workflowStatus: "RECEIVED",
      pending: false,
    };
  } catch (error) {
    const apiError =
      error instanceof HypotekaJasneApiError
        ? error
        : new HypotekaJasneApiError({
            message: error instanceof Error ? error.message : "Unknown error",
            retryable: true,
          });

    const failure = await recordSubmissionFailure({
      leadId: lead.id,
      profileId: profile.id,
      attemptNumber,
      error: apiError.message,
      httpStatus: apiError.httpStatus,
      retryable: apiError.retryable,
      correlationId: lead.correlationId,
      errorCode: apiError.code,
    });

    if (failure.deadLetter) {
      return {
        ok: false,
        error:
          "Odeslání partnerovi se nepodařilo. Požadavek byl uložen pro ruční zpracování.",
        code: "DEAD_LETTER",
      };
    }

    return {
      ok: true,
      externalLeadId: lead.correlationId,
      isMock: false,
      workflowStatus: "SUBMISSION_PENDING",
      pending: true,
    };
  }
}

async function recordSubmissionFailure(input: {
  leadId: string;
  profileId: string;
  attemptNumber: number;
  error: string;
  httpStatus: number | null;
  retryable: boolean;
  correlationId: string;
  errorCode?: string;
}): Promise<{ deadLetter: boolean }> {
  const nextRetryAt = input.retryable
    ? computeNextRetryAt({ attemptNumber: input.attemptNumber })
    : null;
  const deadLetter =
    !input.retryable || shouldMoveToDeadLetter(input.attemptNumber);
  const attemptStatus = deadLetter
    ? "DEAD_LETTER"
    : input.retryable
      ? "FAILED_TRANSIENT"
      : "FAILED_PERMANENT";

  await prisma.$transaction([
    prisma.mortgageLeadSubmissionAttempt.updateMany({
      where: { leadId: input.leadId, attemptNumber: input.attemptNumber },
      data: {
        status: attemptStatus,
        httpStatus: input.httpStatus,
        errorCode: input.errorCode ?? null,
        errorMessage: input.error,
        nextRetryAt,
      },
    }),
    prisma.mortgageLeadProfile.update({
      where: { id: input.profileId },
      data: {
        workflowStatus: deadLetter ? "SUBMISSION_PENDING" : "SUBMISSION_PENDING",
        lastSubmissionError: input.error,
        nextRetryAt: deadLetter ? null : nextRetryAt,
        deadLetterAt: deadLetter ? new Date() : null,
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        type: deadLetter
          ? "mortgage_lead.dead_letter"
          : "mortgage_lead.submission_pending",
        note: deadLetter
          ? "Opakované selhání odeslání — dead letter queue."
          : "Dočasná nedostupnost partnera — naplánován retry.",
        meta: {
          correlationId: input.correlationId,
          attemptNumber: input.attemptNumber,
          httpStatus: input.httpStatus,
          retryable: input.retryable,
          nextRetryAt: nextRetryAt?.toISOString() ?? null,
        },
      },
    }),
  ]);

  return { deadLetter };
}

function mergeLeadPayload(
  existing: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return { ...base, ...patch } as Prisma.InputJsonValue;
}

export async function retryPendingMortgageLeadSubmissions(input?: {
  limit?: number;
}): Promise<{ processed: number; succeeded: number; stillPending: number }> {
  const limit = input?.limit ?? 20;
  const now = new Date();

  const pending = await prisma.mortgageLeadProfile.findMany({
    where: {
      workflowStatus: "SUBMISSION_PENDING",
      deadLetterAt: null,
      nextRetryAt: { lte: now },
    },
    orderBy: { nextRetryAt: "asc" },
    take: limit,
    include: {
      lead: true,
    },
  });

  let succeeded = 0;
  let stillPending = 0;

  for (const profile of pending) {
    const lead = profile.lead;
    const payload = lead.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      stillPending += 1;
      continue;
    }

    const stored = payload as Record<string, unknown>;
    const partnerPayload = stored.lastPartnerPayload as
      | HypotekaJasneLeadPayload
      | undefined;

    if (!partnerPayload) {
      stillPending += 1;
      continue;
    }

    const result = await executePartnerLeadSubmission({
      lead: { ...lead, mortgageProfile: profile },
      partnerPayload,
    });

    if (result.ok && !result.pending) succeeded += 1;
    else stillPending += 1;
  }

  return { processed: pending.length, succeeded, stillPending };
}
