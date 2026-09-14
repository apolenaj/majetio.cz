/**
 * B2B lead billing — MODE A (Pay Per Lead) vs MODE B (Success Fee).
 * Driven by Organization.leadBillingMode.
 */

import type { OrganizationLeadBillingMode, Prisma } from "@prisma/client";

import {
  DEFAULT_PAY_PER_LEAD_PRICE_MINOR,
  DEFAULT_SUCCESS_FEE_BPS,
  computeSuccessFeeAmountMinor,
} from "@/config/revenue-attribution";
import { prisma } from "@/lib/db";
import { recordRevenueEvent } from "./ledger";

export type OrgLeadBillingSettings = {
  organizationId: string;
  mode: OrganizationLeadBillingMode;
  payPerLeadPriceMinor: number;
  successFeeBps: number;
  attributionWindowDays: number;
};

export async function getOrgLeadBillingSettings(
  organizationId: string,
): Promise<OrgLeadBillingSettings | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      leadBillingMode: true,
      payPerLeadPriceMinor: true,
      successFeeBps: true,
      attributionWindowDays: true,
    },
  });
  if (!org) return null;
  return {
    organizationId: org.id,
    mode: org.leadBillingMode,
    payPerLeadPriceMinor: org.payPerLeadPriceMinor || DEFAULT_PAY_PER_LEAD_PRICE_MINOR,
    successFeeBps: org.successFeeBps || DEFAULT_SUCCESS_FEE_BPS,
    attributionWindowDays: org.attributionWindowDays,
  };
}

export async function setOrgLeadBillingMode(input: {
  organizationId: string;
  mode: OrganizationLeadBillingMode;
  payPerLeadPriceMinor?: number;
  successFeeBps?: number;
  attributionWindowDays?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        leadBillingMode: input.mode,
        ...(input.payPerLeadPriceMinor != null
          ? { payPerLeadPriceMinor: input.payPerLeadPriceMinor }
          : {}),
        ...(input.successFeeBps != null
          ? { successFeeBps: input.successFeeBps }
          : {}),
        ...(input.attributionWindowDays != null
          ? { attributionWindowDays: input.attributionWindowDays }
          : {}),
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Organizace nenalezena." };
  }
}

/**
 * MODE A — recognize pay-per-lead revenue when a qualified lead is delivered/accepted.
 * Idempotent via RevenueEvent unique key on lead id.
 */
export async function chargePayPerLead(input: {
  organizationId: string;
  qualifiedBuyerLeadId: string;
  now?: Date;
}): Promise<
  | {
      ok: true;
      revenueEventId: string;
      amountGrossMinor: number;
      duplicatePrevented: boolean;
    }
  | { ok: false; error: string; code?: string }
> {
  const settings = await getOrgLeadBillingSettings(input.organizationId);
  if (!settings) return { ok: false, error: "Organizace nenalezena." };
  if (settings.mode !== "PAY_PER_LEAD") {
    return {
      ok: false,
      error: "Organizace není v módu Pay Per Lead.",
      code: "wrong_billing_mode",
    };
  }

  const openDispute = await prisma.leadDispute.findFirst({
    where: {
      qualifiedBuyerLeadId: input.qualifiedBuyerLeadId,
      status: { in: ["OPEN", "EVIDENCE_REQUIRED", "UNDER_REVIEW", "UPHELD"] },
    },
  });
  if (openDispute?.status === "UPHELD") {
    return {
      ok: false,
      error: "Lead byl uznán jako neplatný (dispute UPHELD).",
      code: "dispute_upheld",
    };
  }

  const result = await recordRevenueEvent({
    sourceType: "PAY_PER_LEAD",
    sourceEntityType: "QualifiedBuyerLead",
    sourceEntityId: input.qualifiedBuyerLeadId,
    amountGrossMinor: settings.payPerLeadPriceMinor,
    organizationId: input.organizationId,
    recognize: true,
    now: input.now,
    meta: { billingMode: "PAY_PER_LEAD" },
  });

  if (!result.ok) return result;
  return {
    ok: true,
    revenueEventId: result.revenueEventId,
    amountGrossMinor: settings.payPerLeadPriceMinor,
    duplicatePrevented: result.duplicatePrevented,
  };
}

/**
 * MODE B — create POTENTIAL success fee (no ledger recognition yet).
 */
export async function createSuccessFeePotential(input: {
  organizationId: string;
  qualifiedBuyerLeadId?: string | null;
  propertyId?: string | null;
  agentUserId?: string | null;
  brokerCommissionGrossMinor: number;
  notes?: string | null;
}): Promise<
  | { ok: true; successFeeId: string; feeAmountMinor: number }
  | { ok: false; error: string; code?: string }
> {
  const settings = await getOrgLeadBillingSettings(input.organizationId);
  if (!settings) return { ok: false, error: "Organizace nenalezena." };
  if (settings.mode !== "SUCCESS_FEE") {
    return {
      ok: false,
      error: "Organizace není v módu Success Fee.",
      code: "wrong_billing_mode",
    };
  }
  if (input.brokerCommissionGrossMinor <= 0) {
    return { ok: false, error: "Provize makléře musí být kladná." };
  }

  const feeAmountMinor = computeSuccessFeeAmountMinor(
    input.brokerCommissionGrossMinor,
    settings.successFeeBps,
  );

  const row = await prisma.successFeeRecord.create({
    data: {
      organizationId: input.organizationId,
      qualifiedBuyerLeadId: input.qualifiedBuyerLeadId ?? null,
      propertyId: input.propertyId ?? null,
      agentUserId: input.agentUserId ?? null,
      status: "POTENTIAL",
      brokerCommissionGrossMinor: input.brokerCommissionGrossMinor,
      feeBps: settings.successFeeBps,
      feeAmountMinor,
      notes: input.notes ?? null,
    },
  });

  return { ok: true, successFeeId: row.id, feeAmountMinor };
}

export async function submitSuccessFeeForVerification(input: {
  successFeeId: string;
  evidenceMeta?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.successFeeRecord.findUnique({
    where: { id: input.successFeeId },
  });
  if (!row || row.status !== "POTENTIAL") {
    return { ok: false, error: "Success fee není ve stavu POTENTIAL." };
  }
  await prisma.successFeeRecord.update({
    where: { id: row.id },
    data: {
      status: "PENDING_VERIFICATION",
      evidenceMeta: (input.evidenceMeta ?? undefined) as Prisma.InputJsonValue,
    },
  });
  return { ok: true };
}

/**
 * Verify success fee → RECOGNIZED RevenueEvent (idempotent).
 */
export async function verifySuccessFee(input: {
  successFeeId: string;
  verifiedByUserId: string;
  brokerCommissionGrossMinor?: number;
  now?: Date;
}): Promise<
  | { ok: true; revenueEventId: string; feeAmountMinor: number }
  | { ok: false; error: string }
> {
  const row = await prisma.successFeeRecord.findUnique({
    where: { id: input.successFeeId },
  });
  if (!row) return { ok: false, error: "SuccessFeeRecord nenalezen." };
  if (!["POTENTIAL", "PENDING_VERIFICATION", "DISPUTED"].includes(row.status)) {
    if (row.revenueEventId) {
      return {
        ok: true,
        revenueEventId: row.revenueEventId,
        feeAmountMinor: row.feeAmountMinor,
      };
    }
    return { ok: false, error: `Nelze ověřit ve stavu ${row.status}.` };
  }

  const commission =
    input.brokerCommissionGrossMinor ?? row.brokerCommissionGrossMinor;
  const feeAmountMinor = computeSuccessFeeAmountMinor(commission, row.feeBps);
  const now = input.now ?? new Date();

  const verified = await prisma.$transaction(async (tx) => {
    const ledger = await recordRevenueEvent({
      sourceType: "SUCCESS_FEE",
      sourceEntityType: "SuccessFeeRecord",
      sourceEntityId: row.id,
      amountGrossMinor: feeAmountMinor,
      organizationId: row.organizationId,
      recognize: true,
      now,
      tx,
      meta: {
        billingMode: "SUCCESS_FEE",
        brokerCommissionGrossMinor: commission,
        feeBps: row.feeBps,
      },
    });
    if (!ledger.ok) {
      throw new Error(ledger.error);
    }

    await tx.successFeeRecord.update({
      where: { id: row.id },
      data: {
        status: "VERIFIED",
        brokerCommissionGrossMinor: commission,
        feeAmountMinor,
        verifiedAt: now,
        verifiedByUserId: input.verifiedByUserId,
        revenueEventId: ledger.revenueEventId,
      },
    });

    return {
      ok: true as const,
      revenueEventId: ledger.revenueEventId,
      feeAmountMinor,
    };
  });

  const { writeMonetizationAuditLog } = await import("./monetization-audit");
  await writeMonetizationAuditLog({
    action: "success_fee.verify",
    entity: "SuccessFeeRecord",
    entityId: input.successFeeId,
    actorId: input.verifiedByUserId,
    meta: {
      revenueEventId: verified.revenueEventId,
      feeAmountMinor: verified.feeAmountMinor,
    },
  }).catch(() => undefined);

  return verified;
}

export async function markSuccessFeeInvoiced(input: {
  successFeeId: string;
  invoiceRef: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.successFeeRecord.findUnique({
    where: { id: input.successFeeId },
  });
  if (!row || row.status !== "VERIFIED") {
    return { ok: false, error: "Success fee musí být VERIFIED." };
  }
  await prisma.successFeeRecord.update({
    where: { id: row.id },
    data: {
      status: "INVOICED",
      invoicedAt: input.now ?? new Date(),
      invoiceRef: input.invoiceRef.slice(0, 120),
    },
  });
  return { ok: true };
}
