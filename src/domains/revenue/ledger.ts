/**
 * Canonical RevenueEvent ledger — prevents double-counting.
 */

import type { Prisma, RevenueEventSourceType, RevenueEventStatus } from "@prisma/client";

import { revenueIdempotencyKey } from "@/config/revenue-attribution";
import { prisma } from "@/lib/db";

export type RecordRevenueInput = {
  sourceType: RevenueEventSourceType;
  sourceEntityType: string;
  sourceEntityId: string;
  amountGrossMinor: number;
  organizationId?: string | null;
  userId?: string | null;
  orderId?: string | null;
  currency?: string;
  recognize?: boolean;
  meta?: Record<string, unknown>;
  now?: Date;
  tx?: Prisma.TransactionClient | typeof prisma;
};

export type RecordRevenueResult =
  | {
      ok: true;
      revenueEventId: string;
      status: RevenueEventStatus;
      created: boolean;
      /** true when an existing row blocked a second insert. */
      duplicatePrevented: boolean;
    }
  | { ok: false; error: string };

/**
 * Idempotent insert into the canonical ledger.
 * Unique (sourceType, sourceEntityId) + idempotencyKey stop double-counting.
 */
export async function recordRevenueEvent(
  input: RecordRevenueInput,
): Promise<RecordRevenueResult> {
  if (input.amountGrossMinor < 0) {
    return { ok: false, error: "Částka revenue nemůže být záporná." };
  }

  const db = input.tx ?? prisma;
  const now = input.now ?? new Date();
  const idempotencyKey = revenueIdempotencyKey(
    input.sourceType,
    input.sourceEntityId,
  );
  const recognize = input.recognize !== false;
  const status: RevenueEventStatus = recognize ? "RECOGNIZED" : "PENDING";

  const existing = await db.revenueEvent.findUnique({
    where: {
      sourceType_sourceEntityId: {
        sourceType: input.sourceType,
        sourceEntityId: input.sourceEntityId,
      },
    },
  });
  if (existing) {
    return {
      ok: true,
      revenueEventId: existing.id,
      status: existing.status,
      created: false,
      duplicatePrevented: true,
    };
  }

  try {
    const row = await db.revenueEvent.create({
      data: {
        idempotencyKey,
        sourceType: input.sourceType,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        orderId: input.orderId ?? null,
        amountGrossMinor: input.amountGrossMinor,
        currency: input.currency ?? "CZK",
        status,
        recognizedAt: recognize ? now : null,
        meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return {
      ok: true,
      revenueEventId: row.id,
      status: row.status,
      created: true,
      duplicatePrevented: false,
    };
  } catch (err) {
    // Race on unique constraint — re-read
    const again = await db.revenueEvent.findUnique({
      where: { idempotencyKey },
    });
    if (again) {
      return {
        ok: true,
        revenueEventId: again.id,
        status: again.status,
        created: false,
        duplicatePrevented: true,
      };
    }
    const message = err instanceof Error ? err.message : "Revenue insert failed";
    return { ok: false, error: message };
  }
}

export async function reverseRevenueEvent(input: {
  revenueEventId: string;
  reason: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.revenueEvent.findUnique({
    where: { id: input.revenueEventId },
  });
  if (!row) return { ok: false, error: "RevenueEvent nenalezen." };
  if (row.status === "REVERSED") return { ok: true };

  await prisma.revenueEvent.update({
    where: { id: row.id },
    data: {
      status: "REVERSED",
      reversedAt: input.now ?? new Date(),
      reverseReason: input.reason.slice(0, 500),
    },
  });
  return { ok: true };
}

export async function markRevenueDisputed(
  revenueEventId: string,
): Promise<void> {
  await prisma.revenueEvent.updateMany({
    where: { id: revenueEventId, status: { in: ["RECOGNIZED", "PENDING"] } },
    data: { status: "DISPUTED" },
  });
}
