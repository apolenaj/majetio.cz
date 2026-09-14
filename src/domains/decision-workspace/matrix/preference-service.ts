import { prisma } from "@/lib/db";
import type { PassportState } from "@/lib/financial-passport/types";
import {
  parsePriorities,
  prioritiesFromPassport,
  type DecisionPriorities,
} from "./priorities";

export async function getDecisionPrioritiesForUser(
  userId: string,
  passport?: PassportState | null,
): Promise<DecisionPriorities> {
  const row = await prisma.decisionPreference.findUnique({
    where: { userId },
  });
  if (row) return parsePriorities(row.priorities);
  return prioritiesFromPassport(passport);
}

export async function saveDecisionPrioritiesForUser(input: {
  userId: string;
  priorities: DecisionPriorities;
}): Promise<DecisionPriorities> {
  const priorities = parsePriorities(input.priorities);
  await prisma.decisionPreference.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, priorities },
    update: { priorities },
  });
  return priorities;
}

export async function setComparisonManualOrder(input: {
  userId: string;
  comparisonId: string;
  manualOrder: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.comparison.findFirst({
    where: { id: input.comparisonId, userId: input.userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "Porovnání nenalezeno." };

  // Once set, only explicit user calls update — never auto-overwrite elsewhere.
  await prisma.comparison.update({
    where: { id: row.id },
    data: { manualOrder: input.manualOrder.slice(0, 8) },
  });
  return { ok: true };
}

export async function getComparisonManualOrder(input: {
  userId: string;
  comparisonId: string;
}): Promise<string[] | null> {
  const row = await prisma.comparison.findFirst({
    where: { id: input.comparisonId, userId: input.userId },
    select: { manualOrder: true },
  });
  if (!row?.manualOrder) return null;
  if (!Array.isArray(row.manualOrder)) return null;
  return row.manualOrder.filter((x): x is string => typeof x === "string");
}
