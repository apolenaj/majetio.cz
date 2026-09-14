/**
 * Comparison optimistic concurrency (BOD 152) — data layer only, no compare UI.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type ComparisonVersionConflict = {
  ok: false;
  code: "VERSION_CONFLICT" | "NOT_FOUND" | "FORBIDDEN";
  error: string;
  currentVersion?: number;
};

export async function updateComparisonOptimistic(input: {
  userId: string;
  comparisonId: string;
  expectedVersion: number;
  data: Prisma.ComparisonUpdateInput;
}): Promise<
  | { ok: true; id: string; version: number }
  | ComparisonVersionConflict
> {
  const existing = await prisma.comparison.findFirst({
    where: { id: input.comparisonId, userId: input.userId },
    select: { id: true, version: true },
  });
  if (!existing) {
    return { ok: false, code: "NOT_FOUND", error: "Porovnání nenalezeno." };
  }

  const updated = await prisma.comparison.updateMany({
    where: {
      id: input.comparisonId,
      userId: input.userId,
      version: input.expectedVersion,
    },
    data: {
      ...input.data,
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    return {
      ok: false,
      code: "VERSION_CONFLICT",
      error:
        "Porovnání bylo upraveno v jiné záložce. Obnovte stránku a zkuste znovu.",
      currentVersion: existing.version,
    };
  }

  return { ok: true, id: existing.id, version: input.expectedVersion + 1 };
}
