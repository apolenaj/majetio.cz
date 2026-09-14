/**
 * IDOR access helpers for AnalysisScenario rows.
 */

import type { AnalysisScenario, PrismaClient } from "@prisma/client";
import { isStaff, type Role } from "@/lib/auth/roles";

export type ScenarioAccessUser = {
  id: string;
  role: Role;
};

export function canReadScenario(
  scenario: Pick<
    AnalysisScenario,
    "ownerUserId" | "profile" | "isPublicShareEnabled"
  >,
  user: ScenarioAccessUser | null,
): boolean {
  // Private sharing is disabled in Part 2/B — ignore isPublicShareEnabled for USER rows.
  if (scenario.profile === "SYSTEM_NEUTRAL") return true;
  if (!user) return false;
  if (isStaff(user.role)) return true;
  if (scenario.profile === "ANALYST") {
    return isStaff(user.role);
  }
  return scenario.ownerUserId === user.id;
}

export function canWriteScenario(
  scenario: Pick<AnalysisScenario, "ownerUserId" | "profile">,
  user: ScenarioAccessUser,
): boolean {
  if (isStaff(user.role) && scenario.profile === "ANALYST") return true;
  if (scenario.profile === "SYSTEM_NEUTRAL") return false;
  if (scenario.profile === "ANALYST") return isStaff(user.role);
  return scenario.ownerUserId === user.id;
}

export async function findOwnedScenario(
  db: PrismaClient,
  scenarioId: string,
  user: ScenarioAccessUser,
): Promise<AnalysisScenario | null> {
  const row = await db.analysisScenario.findUnique({
    where: { id: scenarioId },
  });
  if (!row) return null;
  if (!canReadScenario(row, user)) return null;
  return row;
}

export async function findWritableScenario(
  db: PrismaClient,
  scenarioId: string,
  user: ScenarioAccessUser,
): Promise<AnalysisScenario | null> {
  const row = await db.analysisScenario.findUnique({
    where: { id: scenarioId },
  });
  if (!row) return null;
  if (!canWriteScenario(row, user)) return null;
  return row;
}
