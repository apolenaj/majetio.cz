/**
 * Marketplace Inquiry — casual interest. Never a QualifiedBuyerLead.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function createInquiry(input: {
  propertyId: string;
  buyerUserId?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  message?: string | null;
  source?: string | null;
}): Promise<{ ok: true; inquiryId: string } | { ok: false; error: string }> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      organizationId: true,
      listedByUserId: true,
      ownerUserId: true,
      status: true,
    },
  });
  if (!property) {
    return { ok: false, error: "Nemovitost nenalezena." };
  }
  if (property.status !== "ACTIVE") {
    return { ok: false, error: "Na neaktivní nabídku nelze poslat poptávku." };
  }

  const message = input.message?.trim().slice(0, 4000) || null;
  if (!message && !input.buyerUserId) {
    return { ok: false, error: "Zpráva je povinná." };
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      propertyId: property.id,
      organizationId: property.organizationId,
      agentUserId: property.listedByUserId ?? property.ownerUserId,
      buyerUserId: input.buyerUserId ?? null,
      buyerName: input.buyerName?.trim().slice(0, 120) || null,
      buyerEmail: input.buyerEmail?.trim().toLowerCase().slice(0, 200) || null,
      buyerPhone: input.buyerPhone?.trim().slice(0, 40) || null,
      message,
      source: input.source?.slice(0, 120) || null,
      status: "NEW",
    },
    select: { id: true },
  });

  // Listing analytics (136) — aggregate only, no buyer PII
  if (property.organizationId) {
    void import("@/domains/listing-analytics/service")
      .then(({ recordListingMetric }) =>
        recordListingMetric({
          propertyId: property.id,
          metric: "inquiries",
        }),
      )
      .catch(() => undefined);
  }

  const { track } = await import("@/lib/analytics/events");
  track({
    name: "lead_inquiry_created",
    props: {
      has_message: Boolean(message),
      authenticated_buyer: Boolean(input.buyerUserId),
    },
  });

  return { ok: true, inquiryId: inquiry.id };
}

export async function getInquiryForAgent(input: {
  inquiryId: string;
  agentUserId: string;
}): Promise<
  | {
      ok: true;
      inquiry: {
        id: string;
        status: string;
        message: string | null;
        buyerName: string | null;
        createdAt: Date;
        propertyId: string;
        /** Inquiry is NOT qualified — explicit flag for UI. */
        isQualifiedBuyerLead: false;
      };
    }
  | { ok: false; error: string }
> {
  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id: input.inquiryId,
      OR: [
        { agentUserId: input.agentUserId },
        {
          property: {
            OR: [
              { ownerUserId: input.agentUserId },
              { listedByUserId: input.agentUserId },
            ],
          },
        },
        {
          organization: {
            members: {
              some: { userId: input.agentUserId, active: true },
            },
          },
        },
      ],
    },
  });
  if (!inquiry) {
    return { ok: false, error: "Poptávka nenalezena." };
  }

  return {
    ok: true,
    inquiry: {
      id: inquiry.id,
      status: inquiry.status,
      message: inquiry.message,
      buyerName: inquiry.buyerName,
      createdAt: inquiry.createdAt,
      propertyId: inquiry.propertyId,
      isQualifiedBuyerLead: false,
    },
  };
}

export type InquiryCreateData = Prisma.InquiryCreateInput;
