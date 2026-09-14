/**
 * Mortgage lead orchestration — create, submit, track, dedupe.
 * Prompt 13/5: never expose internal IDs to partners; strict DTO mapping.
 */

import {
  LeadStatus,
  LeadType,
  type MortgageLeadWorkflowStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import type { HypotekaJasneLeadPayload } from "@/domains/leads/schemas/mortgage-lead";
import {
  type CreateMortgageLeadInput,
  type MortgageLeadDetailDto,
  type MortgageLeadDuplicateInfo,
  type MortgageLeadListItemDto,
  type MortgageLeadStatusDto,
  type SubmitMortgageLeadInput,
} from "@/domains/leads/schemas/mortgage-lead";
import {
  buildExternalPropertyReference,
  parseLeadSourceAttribution,
} from "@/domains/leads/service/attribution";
import { generateMortgageLeadCorrelationId } from "@/domains/leads/service/correlation-id";
import {
  buildMortgageLeadIdempotencyKey,
  isActiveMortgageLeadStatus,
  isWithinDedupeWindow,
} from "@/domains/leads/service/idempotency";
import {
  assertMortgageLeadTransition,
  mortgageLeadStatusLabel,
} from "@/domains/leads/service/workflow";
import {
  buildMortgageLeadTimeline,
  mortgageLeadNextStep,
} from "@/domains/leads/service/timeline";
import { HYPOTEKAJASNE_LEAD_PAYLOAD_SCHEMA_VERSION } from "@/integrations/hypotekajasne/version";
import type { MortgageLeadShareFieldKey } from "@/lib/privacy/mortgage-lead-transfer";
import { executePartnerLeadSubmission } from "@/domains/leads/service/lead-submission";
import { resolveMortgageLeadRouting } from "@/domains/leads/service/routing";
import { initializeMortgageLeadCrm } from "@/domains/leads/service/crm-foundation";
import {
  buildMortgageLeadContextSnapshot,
} from "@/domains/leads/service/context-snapshot";
import { computeMortgageLeadRetentionExpiresAt } from "@/domains/leads/service/retention";
import { sanitizeLeadActivityMeta } from "@/domains/leads/service/privacy-guards";

export type MortgageLeadServiceResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code?: "DUPLICATE" | "NOT_FOUND" | "FORBIDDEN" | "PARTNER_REJECTED";
      existingLead?: MortgageLeadDuplicateInfo;
    };

function toStatusDto(
  lead: {
    correlationId: string;
    partner: string | null;
    source: string | null;
    createdAt: Date;
    updatedAt: Date;
    payload: Prisma.JsonValue;
    mortgageProfile: {
      workflowStatus: MortgageLeadWorkflowStatus;
      externalLeadId: string | null;
      isMockSubmission: boolean;
    } | null;
  },
  attributionChannel: string | null,
): MortgageLeadStatusDto {
  const workflowStatus =
    lead.mortgageProfile?.workflowStatus ?? ("CREATED" as const);
  const payload =
    lead.payload && typeof lead.payload === "object" && !Array.isArray(lead.payload)
      ? (lead.payload as Record<string, unknown>)
      : {};

  return {
    correlationId: lead.correlationId,
    workflowStatus,
    statusLabel: mortgageLeadStatusLabel(workflowStatus),
    partner: lead.partner,
    externalLeadId: lead.mortgageProfile?.externalLeadId ?? null,
    source: lead.source,
    attributionChannel,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    isMock: Boolean(
      lead.mortgageProfile?.isMockSubmission ?? payload.isMock ?? false,
    ),
  };
}

function resolveAttributionChannel(lead: {
  source: string | null;
  payload: Prisma.JsonValue;
}): string | null {
  const payload =
    lead.payload && typeof lead.payload === "object" && !Array.isArray(lead.payload)
      ? (lead.payload as Record<string, unknown>)
      : {};
  if (
    payload.attribution &&
    typeof payload.attribution === "object" &&
    payload.attribution !== null &&
    "channel" in payload.attribution
  ) {
    return String((payload.attribution as { channel: unknown }).channel);
  }
  return lead.source ? parseLeadSourceAttribution(lead.source).channel : null;
}

type LeadWithMortgageContext = Prisma.LeadGetPayload<{
  include: {
    mortgageProfile: true;
    property: { select: { title: true; slug: true } };
  };
}>;

function toListItemDto(lead: LeadWithMortgageContext): MortgageLeadListItemDto {
  if (!lead.mortgageProfile) {
    throw new Error("Lead missing mortgage profile.");
  }
  const status = lead.mortgageProfile.workflowStatus;
  const lastUpdatedAt =
    lead.mortgageProfile.lastPartnerSyncAt ?? lead.updatedAt;

  return {
    ...toStatusDto(lead, resolveAttributionChannel(lead)),
    propertyTitle: lead.property?.title ?? null,
    propertySlug: lead.property?.slug ?? null,
    purchasePriceCzk: lead.mortgageProfile.purchasePriceCzk,
    nextStepLabel: mortgageLeadNextStep(status),
    lastUpdatedAt: lastUpdatedAt.toISOString(),
    submittedAt: lead.mortgageProfile.submittedAt?.toISOString() ?? null,
  };
}

export function buildPartnerPayload(input: {
  correlationId: string;
  email: string;
  phone?: string | null;
  contactName?: string | null;
  source: string;
  consentVersion: string;
  sharedFields: MortgageLeadShareFieldKey[];
  propertyReference?: string;
  purchasePriceCzk?: number | null;
  availableEquityCzk?: number | null;
  monthlyIncomeCzk?: number | null;
  monthlyLiabilitiesCzk?: number | null;
  note?: string;
}): HypotekaJasneLeadPayload {
  const attribution = parseLeadSourceAttribution(input.source);
  const shared = new Set(input.sharedFields);

  return {
    schemaVersion: HYPOTEKAJASNE_LEAD_PAYLOAD_SCHEMA_VERSION,
    correlationId: input.correlationId,
    email: input.email,
    phone: shared.has("phone") ? (input.phone ?? undefined) : undefined,
    contactName: shared.has("name") ? (input.contactName ?? undefined) : undefined,
    propertyReference: shared.has("propertyReference")
      ? input.propertyReference
      : undefined,
    purchasePriceCzk: shared.has("purchasePriceCzk")
      ? (input.purchasePriceCzk ?? undefined)
      : undefined,
    availableEquityCzk: shared.has("availableEquityCzk")
      ? (input.availableEquityCzk ?? undefined)
      : undefined,
    monthlyIncomeCzk: shared.has("monthlyIncomeCzk")
      ? (input.monthlyIncomeCzk ?? undefined)
      : undefined,
    monthlyLiabilitiesCzk: shared.has("monthlyLiabilitiesCzk")
      ? (input.monthlyLiabilitiesCzk ?? undefined)
      : undefined,
    consentVersion: input.consentVersion,
    source: input.source,
    attribution: {
      channel: attribution.channel,
      funnelStep: attribution.funnelStep,
      campaign: attribution.campaign,
    },
    note: input.note,
  };
}

function assertGuestOrUserLeadAccess(
  lead: { userId: string | null; email: string | null },
  input: { userId?: string | null; email: string },
): boolean {
  if (lead.userId != null) {
    return Boolean(input.userId && lead.userId === input.userId);
  }
  return lead.email?.toLowerCase() === input.email.toLowerCase();
}

export class MortgageLeadService {
  async findActiveDuplicate(input: {
    userId: string;
    propertyId?: string | null;
    analysisId?: string | null;
  }): Promise<MortgageLeadDuplicateInfo | null> {
    if (!input.propertyId && !input.analysisId) return null;

    const recent = await prisma.lead.findFirst({
      where: {
        userId: input.userId,
        type: LeadType.FINANCING,
        partner: "hypotekajasne",
        OR: [
          input.propertyId ? { propertyId: input.propertyId } : undefined,
          input.analysisId ? { analysisId: input.analysisId } : undefined,
        ].filter(Boolean) as Prisma.LeadWhereInput[],
      },
      orderBy: { createdAt: "desc" },
      include: { mortgageProfile: true },
    });

    if (!recent?.mortgageProfile) return null;
    if (!isWithinDedupeWindow(recent.createdAt)) return null;
    if (!isActiveMortgageLeadStatus(recent.mortgageProfile.workflowStatus)) {
      return null;
    }

    return {
      correlationId: recent.correlationId,
      statusLabel: mortgageLeadStatusLabel(recent.mortgageProfile.workflowStatus),
      workflowStatus: recent.mortgageProfile.workflowStatus,
      createdAt: recent.createdAt.toISOString(),
    };
  }

  /** Guest duplicate guard — same email + property/analysis within dedupe window. */
  async findActiveDuplicateByEmail(input: {
    email: string;
    propertyId?: string | null;
    analysisId?: string | null;
  }): Promise<MortgageLeadDuplicateInfo | null> {
    if (!input.propertyId && !input.analysisId) return null;

    const recent = await prisma.lead.findFirst({
      where: {
        type: LeadType.FINANCING,
        partner: "hypotekajasne",
        email: { equals: input.email, mode: "insensitive" },
        OR: [
          input.propertyId ? { propertyId: input.propertyId } : undefined,
          input.analysisId ? { analysisId: input.analysisId } : undefined,
        ].filter(Boolean) as Prisma.LeadWhereInput[],
      },
      orderBy: { createdAt: "desc" },
      include: { mortgageProfile: true },
    });

    if (!recent?.mortgageProfile) return null;
    if (!isWithinDedupeWindow(recent.createdAt)) return null;
    if (!isActiveMortgageLeadStatus(recent.mortgageProfile.workflowStatus)) {
      return null;
    }

    return {
      correlationId: recent.correlationId,
      statusLabel: mortgageLeadStatusLabel(recent.mortgageProfile.workflowStatus),
      workflowStatus: recent.mortgageProfile.workflowStatus,
      createdAt: recent.createdAt.toISOString(),
    };
  }

  /** Active lead for property/analysis — no dedupe window (for status CTA). */
  async findActiveMortgageLeadForContext(input: {
    userId: string;
    propertyId?: string | null;
    analysisId?: string | null;
  }): Promise<MortgageLeadDuplicateInfo | null> {
    if (!input.propertyId && !input.analysisId) return null;

    const recent = await prisma.lead.findFirst({
      where: {
        userId: input.userId,
        type: LeadType.FINANCING,
        partner: "hypotekajasne",
        OR: [
          input.propertyId ? { propertyId: input.propertyId } : undefined,
          input.analysisId ? { analysisId: input.analysisId } : undefined,
        ].filter(Boolean) as Prisma.LeadWhereInput[],
      },
      orderBy: { createdAt: "desc" },
      include: { mortgageProfile: true },
    });

    if (!recent?.mortgageProfile) return null;
    if (!isActiveMortgageLeadStatus(recent.mortgageProfile.workflowStatus)) {
      return null;
    }

    return {
      correlationId: recent.correlationId,
      statusLabel: mortgageLeadStatusLabel(recent.mortgageProfile.workflowStatus),
      workflowStatus: recent.mortgageProfile.workflowStatus,
      createdAt: recent.createdAt.toISOString(),
    };
  }

  async listMortgageLeadsForUser(input: {
    userId: string;
    limit?: number;
  }): Promise<MortgageLeadListItemDto[]> {
    const leads = await prisma.lead.findMany({
      where: {
        userId: input.userId,
        type: LeadType.FINANCING,
        partner: "hypotekajasne",
        mortgageProfile: { isNot: null },
      },
      orderBy: { updatedAt: "desc" },
      take: input.limit ?? 20,
      include: {
        mortgageProfile: true,
        property: { select: { title: true, slug: true } },
      },
    });

    return leads
      .filter((lead): lead is LeadWithMortgageContext => lead.mortgageProfile != null)
      .map(toListItemDto);
  }

  async getMortgageLeadDetailForUser(input: {
    userId: string;
    correlationId: string;
  }): Promise<MortgageLeadServiceResult<MortgageLeadDetailDto>> {
    const lead = await prisma.lead.findUnique({
      where: { correlationId: input.correlationId },
      include: {
        mortgageProfile: true,
        property: { select: { title: true, slug: true } },
      },
    });

    if (!lead?.mortgageProfile) {
      return { ok: false, error: "Lead nebyl nalezen.", code: "NOT_FOUND" };
    }
    if (lead.userId !== input.userId) {
      return { ok: false, error: "K tomuto leadu nemáte přístup.", code: "FORBIDDEN" };
    }

    const base = toListItemDto(lead);
    return {
      ok: true,
      data: {
        ...base,
        timeline: buildMortgageLeadTimeline(lead.mortgageProfile.workflowStatus),
      },
    };
  }

  async createLead(
    input: CreateMortgageLeadInput,
  ): Promise<
    MortgageLeadServiceResult<{
      leadId: string;
      correlationId: string;
      idempotencyKey: string;
    }>
  > {
    const idempotencyKey = buildMortgageLeadIdempotencyKey({
      userId: input.userId,
      guestEmail: input.userId ? null : input.email,
      propertyId: input.propertyId,
      analysisId: input.analysisId,
    });

    const existingByKey = await prisma.lead.findUnique({
      where: { idempotencyKey },
      include: { mortgageProfile: true },
    });

    if (existingByKey?.mortgageProfile) {
      return {
        ok: true,
        data: {
          leadId: existingByKey.id,
          correlationId: existingByKey.correlationId,
          idempotencyKey,
        },
      };
    }

    const duplicate = input.userId
      ? await this.findActiveDuplicate({
          userId: input.userId,
          propertyId: input.propertyId,
          analysisId: input.analysisId,
        })
      : await this.findActiveDuplicateByEmail({
          email: input.email,
          propertyId: input.propertyId,
          analysisId: input.analysisId,
        });

    if (duplicate) {
      return {
        ok: false,
        error: "Financování této nemovitosti už řešíte.",
        code: "DUPLICATE",
        existingLead: duplicate,
      };
    }

    const correlationId = generateMortgageLeadCorrelationId();
    const attribution = parseLeadSourceAttribution(input.source);

    const routing = resolveMortgageLeadRouting({
      marketCountry: input.marketCountry,
      propertyType: input.propertyType,
      estimatedLoanAmountCzk:
        input.sensitive.purchasePriceCzk != null &&
        input.sensitive.availableEquityCzk != null
          ? Math.max(
              0,
              input.sensitive.purchasePriceCzk - input.sensitive.availableEquityCzk,
            )
          : (input.contextSnapshot?.requestedLoanCzk ?? null),
    });

    const snapshotData = buildMortgageLeadContextSnapshot({
      propertyId: input.propertyId,
      propertySlug: input.propertySlug,
      propertyTitle: input.propertyTitle,
      askingPriceCzk: input.sensitive.purchasePriceCzk,
      valuationCzk: input.contextSnapshot?.valuationCzk,
      requestedLoanCzk: input.contextSnapshot?.requestedLoanCzk,
      availableEquityCzk: input.sensitive.availableEquityCzk,
      ltvOnAskingPricePct: input.contextSnapshot?.ltvOnAskingPricePct,
      nominalInterestRatePp: input.contextSnapshot?.nominalInterestRatePp,
      aprPp: input.contextSnapshot?.aprPp,
      termYears: input.contextSnapshot?.termYears,
      estimatedMonthlyPaymentCzk: input.contextSnapshot?.estimatedMonthlyPaymentCzk,
      source: input.source,
      marketCountry: routing.marketCountry,
    });

    const retentionExpiresAt = computeMortgageLeadRetentionExpiresAt({
      partnerSubmitted: false,
    });

    const lead = await prisma.lead.create({
      data: {
        type: LeadType.FINANCING,
        status: LeadStatus.NEW,
        userId: input.userId ?? null,
        propertyId: input.propertyId ?? null,
        analysisId: input.analysisId ?? null,
        email: input.email,
        phone: input.phone ?? null,
        source: input.source,
        partner: routing.partner,
        marketCountry: routing.marketCountry,
        consentId: input.consentId ?? null,
        correlationId,
        idempotencyKey,
        retentionExpiresAt,
        payload: {
          sharedFields: input.sharedFields,
          attribution,
          routing: {
            ruleKey: routing.routingRuleKey,
            reason: routing.reason,
          },
          propertyPurpose: input.propertyPurpose ?? "investment",
          guestSubmission: input.userId == null,
          ...(input.consentReceipt
            ? { consentReceipt: input.consentReceipt as Prisma.InputJsonValue }
            : {}),
        } satisfies Prisma.InputJsonValue,
        mortgageProfile: {
          create: {
            workflowStatus: "CREATED",
            purchasePriceCzk: input.sensitive.purchasePriceCzk ?? null,
            availableEquityCzk: input.sensitive.availableEquityCzk ?? null,
            monthlyIncomeCzk: input.sensitive.monthlyIncomeCzk ?? null,
            monthlyLiabilitiesCzk: input.sensitive.monthlyLiabilitiesCzk ?? null,
          },
        },
        contextSnapshot: {
          create: {
            schemaVersion: snapshotData.schemaVersion,
            propertyId: snapshotData.property.propertyId,
            propertySlug: snapshotData.property.propertySlug,
            propertyUrl: snapshotData.property.propertyUrl,
            propertyTitle: snapshotData.property.propertyTitle,
            askingPriceCzk: snapshotData.property.askingPriceCzk,
            valuationCzk: snapshotData.property.valuationCzk,
            requestedLoanCzk: snapshotData.financing.requestedLoanCzk,
            availableEquityCzk: snapshotData.financing.availableEquityCzk,
            ltvOnAskingPricePct: snapshotData.financing.ltvOnAskingPricePct,
            nominalInterestRatePp: snapshotData.financing.nominalInterestRatePp,
            aprPp: snapshotData.financing.aprPp,
            termYears: snapshotData.financing.termYears,
            estimatedMonthlyPaymentCzk:
              snapshotData.financing.estimatedMonthlyPaymentCzk,
            snapshotJson: snapshotData,
          },
        },
        activities: {
          create: {
            type: "mortgage_lead.created",
            note: "Mortgage lead vytvořen po explicitním souhlasu.",
            meta: sanitizeLeadActivityMeta({
              correlationId,
              source: input.source,
              guest: input.userId == null,
            }) as Prisma.InputJsonValue,
          },
        },
      },
    });

    if (input.userId) {
      await initializeMortgageLeadCrm({
        leadId: lead.id,
        ownerUserId: input.userId,
        marketCountry: routing.marketCountry,
        propertyType: input.propertyType,
        purchasePriceCzk: input.sensitive.purchasePriceCzk,
        availableEquityCzk: input.sensitive.availableEquityCzk,
      });
    } else {
      await initializeMortgageLeadCrm({
        leadId: lead.id,
        ownerUserId: null,
        marketCountry: routing.marketCountry,
        propertyType: input.propertyType,
        purchasePriceCzk: input.sensitive.purchasePriceCzk,
        availableEquityCzk: input.sensitive.availableEquityCzk,
      });
    }

    return {
      ok: true,
      data: { leadId: lead.id, correlationId, idempotencyKey },
    };
  }

  async submitLead(
    input: SubmitMortgageLeadInput & {
      userId?: string | null;
      email: string;
      phone?: string | null;
      source: string;
      propertyId?: string | null;
      analysisId?: string | null;
      sensitive: CreateMortgageLeadInput["sensitive"];
    },
  ): Promise<
    MortgageLeadServiceResult<{
      correlationId: string;
      externalLeadId: string;
      isMock: boolean;
      workflowStatus: MortgageLeadWorkflowStatus;
      pending: boolean;
    }>
  > {
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
      include: { mortgageProfile: true },
    });

    if (!lead?.mortgageProfile) {
      return { ok: false, error: "Lead nebyl nalezen.", code: "NOT_FOUND" };
    }
    if (!assertGuestOrUserLeadAccess(lead, input)) {
      return { ok: false, error: "K tomuto leadu nemáte přístup.", code: "FORBIDDEN" };
    }

    const profile = lead.mortgageProfile;

    if (profile.externalLeadId) {
      return {
        ok: true,
        data: {
          correlationId: lead.correlationId,
          externalLeadId: profile.externalLeadId,
          isMock: profile.isMockSubmission,
          workflowStatus: profile.workflowStatus,
          pending: false,
        },
      };
    }

    const propertyReference = buildExternalPropertyReference({
      analysisId: input.analysisId ?? lead.analysisId,
      propertyId: input.propertyId ?? lead.propertyId,
      propertySlug: input.propertySlug,
    });

    const partnerPayload = buildPartnerPayload({
      correlationId: lead.correlationId,
      email: input.email,
      phone: input.phone,
      contactName: input.contactName,
      source: input.source,
      consentVersion: input.consentVersion,
      sharedFields: input.sharedFields as MortgageLeadShareFieldKey[],
      propertyReference,
      purchasePriceCzk: input.sensitive.purchasePriceCzk,
      availableEquityCzk: input.sensitive.availableEquityCzk,
      monthlyIncomeCzk: input.sensitive.monthlyIncomeCzk,
      monthlyLiabilitiesCzk: input.sensitive.monthlyLiabilitiesCzk,
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        payload: {
          ...(typeof lead.payload === "object" && lead.payload && !Array.isArray(lead.payload)
            ? lead.payload
            : {}),
          lastPartnerPayload: partnerPayload,
        },
      },
    });

    const submission = await executePartnerLeadSubmission({
      lead,
      partnerPayload,
    });

    if (!submission.ok) {
      if (submission.code === "DEAD_LETTER") {
        return {
          ok: true,
          data: {
            correlationId: lead.correlationId,
            externalLeadId: lead.correlationId,
            isMock: false,
            workflowStatus: "SUBMISSION_PENDING",
            pending: true,
          },
        };
      }
      return {
        ok: false,
        error: submission.error,
        code: submission.code,
      };
    }

    return {
      ok: true,
      data: {
        correlationId: lead.correlationId,
        externalLeadId: submission.externalLeadId,
        isMock: submission.isMock,
        workflowStatus: submission.workflowStatus,
        pending: submission.pending,
      },
    };
  }

  async getLeadStatusForUser(input: {
    userId: string;
    correlationId: string;
  }): Promise<MortgageLeadServiceResult<MortgageLeadStatusDto>> {
    const lead = await prisma.lead.findUnique({
      where: { correlationId: input.correlationId },
      include: { mortgageProfile: true },
    });

    if (!lead?.mortgageProfile) {
      return { ok: false, error: "Lead nebyl nalezen.", code: "NOT_FOUND" };
    }
    if (lead.userId !== input.userId) {
      return { ok: false, error: "K tomuto leadu nemáte přístup.", code: "FORBIDDEN" };
    }

    const attribution = resolveAttributionChannel(lead);

    return {
      ok: true,
      data: toStatusDto(lead, attribution),
    };
  }

  async transitionWorkflowStatus(input: {
    correlationId: string;
    to: MortgageLeadWorkflowStatus;
    note?: string;
  }): Promise<MortgageLeadServiceResult<MortgageLeadStatusDto>> {
    const lead = await prisma.lead.findUnique({
      where: { correlationId: input.correlationId },
      include: { mortgageProfile: true },
    });

    if (!lead?.mortgageProfile) {
      return { ok: false, error: "Lead nebyl nalezen.", code: "NOT_FOUND" };
    }

    const from = lead.mortgageProfile.workflowStatus;
    assertMortgageLeadTransition(from, input.to);

    const now = new Date();
    await prisma.$transaction([
      prisma.mortgageLeadProfile.update({
        where: { id: lead.mortgageProfile.id },
        data: {
          workflowStatus: input.to,
          contactedAt: input.to === "CONTACTED" ? now : lead.mortgageProfile.contactedAt,
          lastPartnerSyncAt: now,
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "mortgage_lead.status_changed",
          note: input.note ?? `Stav změněn: ${from} → ${input.to}`,
          meta: { from, to: input.to, correlationId: lead.correlationId },
        },
      }),
    ]);

    const updated = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
      include: { mortgageProfile: true },
    });

    return {
      ok: true,
      data: toStatusDto(updated, parseLeadSourceAttribution(updated.source ?? "").channel),
    };
  }
}

export const mortgageLeadService = new MortgageLeadService();
