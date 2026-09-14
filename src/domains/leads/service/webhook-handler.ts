/**
 * Inbound HypotekaJasne webhook processing — signature, idempotency, status sync.
 */

import type { MortgageLeadWorkflowStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  hypotekajasneWebhookPayloadSchema,
  type HypotekaJasneWebhookPayload,
  isSupportedWebhookSchemaVersion,
} from "@/integrations/hypotekajasne/schemas/webhook";
import {
  PARTNER_SIGNATURE_HEADER,
  PARTNER_TIMESTAMP_HEADER,
  verifySignedRequest,
} from "@/integrations/hypotekajasne/security/request-signing";
import { resolveHypotekaJasneConfig } from "@/integrations/hypotekajasne/config";
import {
  assertMortgageLeadTransition,
  mortgageLeadStatusLabel,
} from "@/domains/leads/service/workflow";
import { notifyMortgageLeadStatusChange } from "@/domains/leads/service/status-notifications";

export type WebhookProcessResult =
  | { ok: true; duplicate: boolean; correlationId: string }
  | { ok: false; status: number; error: string };

const PARTNER_STATUS_MAP: Record<string, MortgageLeadWorkflowStatus> = {
  received: "RECEIVED",
  contacted: "CONTACTED",
  qualification_in_progress: "QUALIFICATION_IN_PROGRESS",
  documents_needed: "DOCUMENTS_NEEDED",
  solution_proposed: "SOLUTION_PROPOSED",
  approved: "APPROVED",
  rejected: "REJECTED",
  withdrawn: "WITHDRAWN",
  closed: "CLOSED",
  completed: "CLOSED",
};

export async function processHypotekaJasneWebhook(input: {
  rawBody: string;
  headers: Headers;
}): Promise<WebhookProcessResult> {
  const config = resolveHypotekaJasneConfig();
  const secret = config.webhookSecret;

  if (!secret) {
    return { ok: false, status: 503, error: "Webhook secret not configured." };
  }

  const verification = verifySignedRequest({
    secret,
    body: input.rawBody,
    signatureHeader: input.headers.get(PARTNER_SIGNATURE_HEADER),
    timestampHeader: input.headers.get(PARTNER_TIMESTAMP_HEADER),
    toleranceSeconds: config.webhookToleranceSeconds,
  });

  if (!verification.ok) {
    return { ok: false, status: 401, error: verification.reason };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(input.rawBody);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body." };
  }

  const parsed = hypotekajasneWebhookPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Webhook payload validation failed." };
  }

  const payload = parsed.data;
  if (!isSupportedWebhookSchemaVersion(payload.schemaVersion)) {
    return {
      ok: false,
      status: 422,
      error: `Unsupported schemaVersion: ${payload.schemaVersion}`,
    };
  }

  const existing = await prisma.hypotekaJasneWebhookEvent.findUnique({
    where: { eventId: payload.eventId },
  });

  if (existing?.processedAt) {
    return {
      ok: true,
      duplicate: true,
      correlationId: payload.data.correlationId,
    };
  }

  const lead = await prisma.lead.findUnique({
    where: { correlationId: payload.data.correlationId },
    include: { mortgageProfile: true },
  });

  const event = existing
    ? existing
    : await prisma.hypotekaJasneWebhookEvent.create({
        data: {
          eventId: payload.eventId,
          eventType: payload.eventType,
          correlationId: payload.data.correlationId,
          leadId: lead?.id ?? null,
          payload: payload as object,
          signatureValid: true,
        },
      });

  if (!lead?.mortgageProfile) {
    await prisma.hypotekaJasneWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
    return {
      ok: false,
      status: 404,
      error: "Lead not found for correlationId.",
    };
  }

  const targetStatus = mapWebhookToWorkflowStatus(payload);
  const from = lead.mortgageProfile.workflowStatus;

  if (targetStatus && targetStatus !== from) {
    assertMortgageLeadTransition(from, targetStatus);
    const previousStatusLabel = mortgageLeadStatusLabel(from);
    const nextStatusLabel = mortgageLeadStatusLabel(targetStatus);

    await prisma.$transaction([
      prisma.mortgageLeadProfile.update({
        where: { id: lead.mortgageProfile.id },
        data: {
          workflowStatus: targetStatus,
          externalLeadId:
            payload.data.externalLeadId ?? lead.mortgageProfile.externalLeadId,
          lastPartnerSyncAt: new Date(),
          contactedAt:
            targetStatus === "CONTACTED"
              ? new Date()
              : lead.mortgageProfile.contactedAt,
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "mortgage_lead.webhook",
          note: `Webhook ${payload.eventType}: ${from} → ${targetStatus}`,
          meta: {
            eventId: payload.eventId,
            eventType: payload.eventType,
            correlationId: payload.data.correlationId,
          },
        },
      }),
      prisma.hypotekaJasneWebhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), leadId: lead.id },
      }),
    ]);

    await notifyMortgageLeadStatusChange({
      leadId: lead.id,
      correlationId: payload.data.correlationId,
      statusLabel: nextStatusLabel,
      previousStatusLabel,
    });
  } else {
    await prisma.hypotekaJasneWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date(), leadId: lead.id },
    });
  }

  return {
    ok: true,
    duplicate: false,
    correlationId: payload.data.correlationId,
  };
}

function mapWebhookToWorkflowStatus(
  payload: HypotekaJasneWebhookPayload,
): MortgageLeadWorkflowStatus | null {
  if (payload.eventType === "lead.received") return "RECEIVED";
  if (payload.eventType === "lead.completed") return "CLOSED";
  if (payload.eventType === "lead.status_changed" && payload.data.status) {
    const key = payload.data.status.toLowerCase().replace(/-/g, "_");
    return PARTNER_STATUS_MAP[key] ?? null;
  }
  return null;
}

export { PARTNER_SIGNATURE_HEADER, PARTNER_TIMESTAMP_HEADER };
