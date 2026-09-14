/**
 * Partner Marketplace — commercial agreements + service offerings.
 */

import type {
  PartnerCompensationModel,
  PartnerServiceCategory,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";

export async function createPartnerCommercialAgreement(input: {
  partnerId: string;
  serviceCategory: PartnerServiceCategory;
  compensationModel: PartnerCompensationModel;
  fixedFeeMinor?: number | null;
  revenueShareBps?: number | null;
  termsVersion: string;
  currency?: string;
}): Promise<
  | { ok: true; agreementId: string }
  | { ok: false; error: string }
> {
  if (input.compensationModel === "FIXED" && !(input.fixedFeeMinor != null && input.fixedFeeMinor > 0)) {
    return { ok: false, error: "FIXED model vyžaduje fixedFeeMinor > 0." };
  }
  if (
    input.compensationModel === "REVENUE_SHARE" &&
    !(input.revenueShareBps != null && input.revenueShareBps > 0)
  ) {
    return { ok: false, error: "REVENUE_SHARE model vyžaduje revenueShareBps > 0." };
  }
  if (input.compensationModel === "HYBRID") {
    if (!(input.fixedFeeMinor != null && input.fixedFeeMinor > 0)) {
      return { ok: false, error: "HYBRID vyžaduje fixedFeeMinor." };
    }
    if (!(input.revenueShareBps != null && input.revenueShareBps > 0)) {
      return { ok: false, error: "HYBRID vyžaduje revenueShareBps." };
    }
  }

  const row = await prisma.partnerCommercialAgreement.create({
    data: {
      partnerId: input.partnerId,
      serviceCategory: input.serviceCategory,
      compensationModel: input.compensationModel,
      fixedFeeMinor: input.fixedFeeMinor ?? null,
      revenueShareBps: input.revenueShareBps ?? null,
      termsVersion: input.termsVersion,
      currency: input.currency ?? "CZK",
      status: "DRAFT",
    },
    select: { id: true },
  });
  return { ok: true, agreementId: row.id };
}

export async function activatePartnerAgreement(
  agreementId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.partnerCommercialAgreement.update({
      where: { id: agreementId },
      data: { status: "ACTIVE", activeFrom: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Dohoda nenalezena." };
  }
}

export async function createPartnerServiceOffering(input: {
  partnerId: string;
  agreementId?: string | null;
  category: PartnerServiceCategory;
  name: string;
  description?: string | null;
}): Promise<{ ok: true; offeringId: string } | { ok: false; error: string }> {
  const name = input.name.trim().slice(0, 200);
  if (!name) return { ok: false, error: "Název služby je povinný." };

  const row = await prisma.partnerServiceOffering.create({
    data: {
      partnerId: input.partnerId,
      agreementId: input.agreementId ?? null,
      category: input.category,
      name,
      description: input.description?.slice(0, 4000) ?? null,
      active: true,
    },
    select: { id: true },
  });
  return { ok: true, offeringId: row.id };
}

/** Public marketplace catalog — no commercial fee internals beyond model label. */
export async function listActivePartnerOfferings(category?: PartnerServiceCategory) {
  return prisma.partnerServiceOffering.findMany({
    where: {
      active: true,
      ...(category ? { category } : {}),
      partner: { active: true },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      partner: { select: { id: true, name: true, slug: true } },
      agreement: {
        select: {
          compensationModel: true,
          status: true,
          // Never expose exact fee amounts on public catalog
        },
      },
    },
  });
}

export type PartnerAgreementPublicSummary = {
  compensationModel: PartnerCompensationModel;
  hasFixedFee: boolean;
  hasRevenueShare: boolean;
};

export function toPublicAgreementSummary(row: {
  compensationModel: PartnerCompensationModel;
  fixedFeeMinor: number | null;
  revenueShareBps: number | null;
}): PartnerAgreementPublicSummary {
  return {
    compensationModel: row.compensationModel,
    hasFixedFee: row.fixedFeeMinor != null && row.fixedFeeMinor > 0,
    hasRevenueShare: row.revenueShareBps != null && row.revenueShareBps > 0,
  };
}

export type PartnerAgreementCreateInput = Prisma.PartnerCommercialAgreementCreateInput;
