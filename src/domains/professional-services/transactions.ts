/**
 * PropertyTransaction — PROTECTED / Sensitive financials.
 * Agreed price is never logged and never returned from public DTOs.
 */

import type { PropertyTransactionStatus, Role } from "@prisma/client";

import {
  assertPurchaseConciergeEnabled,
  isPurchaseConciergeEnabled,
} from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export type PropertyTransactionPublicDto = {
  id: string;
  propertyId: string;
  status: PropertyTransactionStatus;
  sensitivityClass: "PROTECTED";
  currency: string;
  /** Price intentionally omitted — use getProtectedAgreedPrice. */
  hasAgreedPrice: boolean;
  conciergeEnabled: boolean;
  closedAt: Date | null;
  createdAt: Date;
};

const PRICE_ACCESS_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "SALES"];

function toPublicDto(row: {
  id: string;
  propertyId: string;
  status: PropertyTransactionStatus;
  currency: string;
  agreedPriceMinor: number | null;
  conciergeEnabled: boolean;
  closedAt: Date | null;
  createdAt: Date;
}): PropertyTransactionPublicDto {
  return {
    id: row.id,
    propertyId: row.propertyId,
    status: row.status,
    sensitivityClass: "PROTECTED",
    currency: row.currency,
    hasAgreedPrice: row.agreedPriceMinor != null,
    conciergeEnabled: row.conciergeEnabled && isPurchaseConciergeEnabled(),
    closedAt: row.closedAt,
    createdAt: row.createdAt,
  };
}

export async function createPropertyTransaction(input: {
  propertyId: string;
  buyerUserId?: string | null;
  agentUserId?: string | null;
  organizationId?: string | null;
  /** Ignored when TRANSACTION_SUCCESS_FEE_ENABLED is false. */
  enableConcierge?: boolean;
}): Promise<{ ok: true; transaction: PropertyTransactionPublicDto } | { ok: false; error: string }> {
  const concierge =
    Boolean(input.enableConcierge) && isPurchaseConciergeEnabled();

  if (input.enableConcierge && !isPurchaseConciergeEnabled()) {
    // Soft-ignore: create deal without concierge rather than leaking promises
  }

  const row = await prisma.propertyTransaction.create({
    data: {
      propertyId: input.propertyId,
      buyerUserId: input.buyerUserId ?? null,
      agentUserId: input.agentUserId ?? null,
      organizationId: input.organizationId ?? null,
      status: "EXPLORING",
      sensitivityClass: "PROTECTED",
      conciergeEnabled: concierge,
    },
  });

  return { ok: true, transaction: toPublicDto(row) };
}

export async function updatePropertyTransactionStatus(input: {
  transactionId: string;
  status: PropertyTransactionStatus;
  actorUserId: string;
  /** Optional broker commission for MODE B success-fee potential (183/216). */
  brokerCommissionGrossMinor?: number;
}): Promise<
  | { ok: true; transaction: PropertyTransactionPublicDto }
  | { ok: false; error: string }
> {
  const row = await prisma.propertyTransaction.update({
    where: { id: input.transactionId },
    data: {
      status: input.status,
      closedAt:
        input.status === "CLOSED" || input.status === "CANCELLED"
          ? new Date()
          : undefined,
    },
  });

  await prisma.propertyTransactionAccessLog.create({
    data: {
      transactionId: row.id,
      actorUserId: input.actorUserId,
      action: "STATUS_UPDATE",
      fieldsAccessed: ["status"],
    },
  });

  // MODE B — create POTENTIAL success fee on deal close (no ledger yet)
  if (
    input.status === "CLOSED" &&
    row.organizationId &&
    input.brokerCommissionGrossMinor != null &&
    input.brokerCommissionGrossMinor > 0
  ) {
    void import("@/domains/revenue/billing")
      .then(({ createSuccessFeePotential }) =>
        createSuccessFeePotential({
          organizationId: row.organizationId!,
          propertyId: row.propertyId,
          agentUserId: row.agentUserId,
          brokerCommissionGrossMinor: input.brokerCommissionGrossMinor!,
          notes: `PropertyTransaction ${row.id} CLOSED`,
        }),
      )
      .catch(() => undefined);
  }

  return { ok: true, transaction: toPublicDto(row) };
}

/**
 * Set agreed price — PROTECTED write, audited, never logs the amount.
 */
export async function setProtectedAgreedPrice(input: {
  transactionId: string;
  agreedPriceMinor: number;
  actorUserId: string;
  actorRole: Role;
}): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  if (input.agreedPriceMinor <= 0) {
    return { ok: false, error: "Cena musí být kladná." };
  }

  const row = await prisma.propertyTransaction.findUnique({
    where: { id: input.transactionId },
  });
  if (!row) return { ok: false, error: "Transakce nenalezena." };

  const isParty =
    row.buyerUserId === input.actorUserId ||
    row.agentUserId === input.actorUserId;
  if (!isParty && !PRICE_ACCESS_ROLES.includes(input.actorRole)) {
    return { ok: false, error: "Nedostatečné oprávnění.", code: "forbidden" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.propertyTransaction.update({
      where: { id: row.id },
      data: {
        agreedPriceMinor: input.agreedPriceMinor,
        agreedPriceSetAt: new Date(),
        sensitivityClass: "PROTECTED",
      },
    });
    await tx.propertyTransactionAccessLog.create({
      data: {
        transactionId: row.id,
        actorUserId: input.actorUserId,
        action: "SET_AGREED_PRICE",
        // Never persist the price value in the access log
        fieldsAccessed: ["agreedPriceMinor"],
      },
    });
  });

  return { ok: true };
}

/**
 * Read agreed price — PROTECTED, audited. Never use in analytics/public APIs.
 */
export async function getProtectedAgreedPrice(input: {
  transactionId: string;
  actorUserId: string;
  actorRole: Role;
  ip?: string | null;
}): Promise<
  | {
      ok: true;
      agreedPriceMinor: number;
      currency: string;
      sensitivityClass: "PROTECTED";
    }
  | { ok: false; error: string; code?: string }
> {
  const row = await prisma.propertyTransaction.findUnique({
    where: { id: input.transactionId },
  });
  if (!row) return { ok: false, error: "Transakce nenalezena." };
  if (row.agreedPriceMinor == null) {
    return { ok: false, error: "Cena není nastavena.", code: "not_set" };
  }

  const isParty =
    row.buyerUserId === input.actorUserId ||
    row.agentUserId === input.actorUserId;
  if (!isParty && !PRICE_ACCESS_ROLES.includes(input.actorRole)) {
    return { ok: false, error: "Nedostatečné oprávnění.", code: "forbidden" };
  }

  await prisma.propertyTransactionAccessLog.create({
    data: {
      transactionId: row.id,
      actorUserId: input.actorUserId,
      action: "READ_AGREED_PRICE",
      fieldsAccessed: ["agreedPriceMinor"],
      ip: input.ip ?? null,
    },
  });

  return {
    ok: true,
    agreedPriceMinor: row.agreedPriceMinor,
    currency: row.currency,
    sensitivityClass: "PROTECTED",
  };
}

/**
 * Enable concierge on a transaction — blocked unless feature flag is on.
 */
export async function enablePurchaseConciergeOnTransaction(input: {
  transactionId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const gate = assertPurchaseConciergeEnabled();
  if (!gate.ok) return gate;

  await prisma.propertyTransaction.update({
    where: { id: input.transactionId },
    data: { conciergeEnabled: true },
  });

  await prisma.propertyTransactionAccessLog.create({
    data: {
      transactionId: input.transactionId,
      actorUserId: input.actorUserId,
      action: "ENABLE_CONCIERGE",
      fieldsAccessed: ["conciergeEnabled"],
    },
  });

  return { ok: true };
}

/** Strip any accidental price keys from objects before logging / public JSON. */
export function stripProtectedTransactionFields<T extends Record<string, unknown>>(
  record: T,
): Omit<T, "agreedPriceMinor" | "agreedPriceSetAt"> {
  const {
    agreedPriceMinor: _p,
    agreedPriceSetAt: _s,
    ...safe
  } = record;
  return safe;
}
