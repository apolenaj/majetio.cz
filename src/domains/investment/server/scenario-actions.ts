"use server";

/**
 * Scenario CRUD with IDOR protection (session-bound ownership).
 */

import { z } from "zod";

import { ASSUMPTION_CONFIG_VERSION } from "@/config/investment-assumptions";
import { requireUser, AuthError } from "@/lib/auth/guards";
import { isStaff, type Role } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

import {
  canReadScenario,
  findOwnedScenario,
  findWritableScenario,
} from "../scenarios/access";
import {
  scenarioNameSchema,
} from "../scenarios/sanitize-name";

export type ScenarioActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; requiresAuth?: boolean };

function asRole(role: string | undefined): Role {
  return (role as Role) ?? ("USER" as Role);
}

export async function listMyScenarios(): Promise<
  ScenarioActionResult<
    Array<{
      id: string;
      name: string | null;
      variant: string;
      status: string;
      updatedAt: string;
      profile: string;
      methodologyPackageVersion: string | null;
      calculationEngineVersion: string;
      formulaRegistryVersion: string;
      assumptionConfigVersion: string;
    }>
  >
> {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, requiresAuth: true };
    }
    throw err;
  }

  const rows = await prisma.analysisScenario.findMany({
    where: {
      ownerUserId: user.id,
      profile: "USER",
      status: { not: "ARCHIVED" },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      variant: true,
      status: true,
      updatedAt: true,
      profile: true,
      methodologyPackageVersion: true,
      calculationEngineVersion: true,
      formulaRegistryVersion: true,
      assumptionConfigVersion: true,
    },
  });

  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      variant: r.variant,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
      profile: r.profile,
      methodologyPackageVersion: r.methodologyPackageVersion,
      calculationEngineVersion: r.calculationEngineVersion,
      formulaRegistryVersion: r.formulaRegistryVersion,
      assumptionConfigVersion: r.assumptionConfigVersion,
    })),
  };
}

export async function getMyScenario(
  scenarioId: string,
): Promise<ScenarioActionResult<{
  id: string;
  name: string | null;
  variant: string;
  assumptionSet: unknown;
  results: unknown;
  assumptionConfigVersion: string;
  calculationEngineVersion: string;
  formulaRegistryVersion: string;
  methodologyPackageVersion: string | null;
  isPublicShareEnabled: boolean;
}>> {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, requiresAuth: true };
    }
    throw err;
  }

  const row = await findOwnedScenario(prisma, scenarioId, {
    id: user.id,
    role: asRole(user.role),
  });
  if (!row) {
    return { ok: false, error: "Scénář nenalezen." };
  }

  return {
    ok: true,
    data: {
      id: row.id,
      name: row.name,
      variant: row.variant,
      assumptionSet: row.assumptionSet,
      results: row.results,
      assumptionConfigVersion: row.assumptionConfigVersion,
      calculationEngineVersion: row.calculationEngineVersion,
      formulaRegistryVersion: row.formulaRegistryVersion,
      methodologyPackageVersion: row.methodologyPackageVersion,
      isPublicShareEnabled: false,
    },
  };
}

const renameSchema = z.object({
  scenarioId: z.string().min(1),
  name: scenarioNameSchema,
});

export async function renameScenario(raw: unknown): Promise<
  ScenarioActionResult<{ id: string; name: string }>
> {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, requiresAuth: true };
    }
    throw err;
  }

  const parsed = renameSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatný název scénáře." };
  }

  const row = await findWritableScenario(prisma, parsed.data.scenarioId, {
    id: user.id,
    role: asRole(user.role),
  });
  if (!row) {
    return { ok: false, error: "Scénář nenalezen." };
  }

  const updated = await prisma.analysisScenario.update({
    where: { id: row.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true },
  });

  return { ok: true, data: { id: updated.id, name: updated.name! } };
}

export async function duplicateScenario(raw: {
  scenarioId: string;
  name?: string;
}): Promise<ScenarioActionResult<{ id: string; name: string | null }>> {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, requiresAuth: true };
    }
    throw err;
  }

  const source = await findOwnedScenario(prisma, raw.scenarioId, {
    id: user.id,
    role: asRole(user.role),
  });
  if (!source || !canReadScenario(source, { id: user.id, role: asRole(user.role) })) {
    return { ok: false, error: "Scénář nenalezen." };
  }
  // Only owner (or staff on own user clones) may duplicate into USER profile
  if (source.ownerUserId !== user.id && !isStaff(asRole(user.role))) {
    return { ok: false, error: "Scénář nenalezen." };
  }

  const name = raw.name
    ? scenarioNameSchema.safeParse(raw.name)
    : null;
  if (raw.name && (!name || !name.success)) {
    return { ok: false, error: "Neplatný název scénáře." };
  }
  const cloneName =
    name?.success
      ? name.data
      : scenarioNameSchema.parse(
          `${source.name ?? "Scénář"} (kopie)`.slice(0, 80),
        );

  const created = await prisma.analysisScenario.create({
    data: {
      propertyId: source.propertyId,
      analysisId: source.analysisId,
      ownerUserId: user.id,
      scenarioType: source.scenarioType,
      profile: "USER",
      variant: "CUSTOM",
      status: source.status,
      name: cloneName,
      inputSnapshot: source.inputSnapshot ?? {},
      assumptionSet: source.assumptionSet ?? {},
      assumptionConfigVersion:
        source.assumptionConfigVersion || ASSUMPTION_CONFIG_VERSION,
      calculationEngineVersion: source.calculationEngineVersion,
      formulaRegistryVersion: source.formulaRegistryVersion,
      methodologyPackageVersion: source.methodologyPackageVersion,
      inputHash: source.inputHash,
      results: source.results ?? undefined,
      baseCurrency: source.baseCurrency,
      exchangeRateSnapshot: source.exchangeRateSnapshot ?? undefined,
      isPublicShareEnabled: false,
      clonedFromId: source.id,
      calculatedAt: source.calculatedAt,
    },
    select: { id: true, name: true },
  });

  return { ok: true, data: created };
}

const analystReviewSchema = z.object({
  scenarioId: z.string().min(1),
  status: z.enum(["IN_REVIEW", "REVIEWED", "APPROVED", "REJECTED"]),
  reason: z.string().max(2000).optional(),
});

/** Analyst-only review workflow — separate from user scenarios. */
export async function updateAnalystReview(raw: unknown): Promise<
  ScenarioActionResult<{ id: string; analystReviewStatus: string }>
> {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, requiresAuth: true };
    }
    throw err;
  }

  if (!isStaff(asRole(user.role))) {
    return { ok: false, error: "Nemáte oprávnění k analytickému workflow." };
  }

  const parsed = analystReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné vstupy review." };
  }

  const row = await prisma.analysisScenario.findUnique({
    where: { id: parsed.data.scenarioId },
  });
  if (!row || row.profile !== "ANALYST") {
    return { ok: false, error: "Analytický scénář nenalezen." };
  }

  const reason =
    parsed.data.reason != null
      ? parsed.data.reason.replace(/<\/?[^>]+>/g, "").trim().slice(0, 2000)
      : row.analystReviewReason;

  const now = new Date();
  const updated = await prisma.analysisScenario.update({
    where: { id: row.id },
    data: {
      analystReviewStatus: parsed.data.status,
      analystReviewReason: reason,
      reviewedByUserId: user.id,
      reviewedAt: now,
      approvedByUserId:
        parsed.data.status === "APPROVED" ? user.id : row.approvedByUserId,
      approvedAt: parsed.data.status === "APPROVED" ? now : row.approvedAt,
    },
    select: { id: true, analystReviewStatus: true },
  });

  return {
    ok: true,
    data: {
      id: updated.id,
      analystReviewStatus: updated.analystReviewStatus ?? "DRAFT",
    },
  };
}
