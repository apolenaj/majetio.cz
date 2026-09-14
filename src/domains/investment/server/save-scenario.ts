"use server";

/**
 * Persist calculator scenario (authenticated + ownership-scoped).
 */

import { ASSUMPTION_CONFIG_VERSION } from "@/config/investment-assumptions";
import { getCurrentMethodologyPackageVersion } from "@/content/methodology/versions";
import { requireUser, AuthError } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

import type { InvestmentCalculatorInputs } from "../hooks/calculator-inputs";
import type { SaveScenarioResult } from "../hooks/use-investment-calculation";
import {
  buildAssumptionSetFromInputs,
  buildEphemeralSnapshot,
} from "../hooks/input-mapping";
import { scenarioNameSchema } from "../scenarios/sanitize-name";
import {
  createInvestmentCalculationService,
  createPrismaInvestmentCalculationRepository,
} from "../service";

export async function saveInvestmentScenario(payload: {
  inputs: InvestmentCalculatorInputs;
  scenarioName?: string;
  analysisId?: string | null;
  variant?: "CONSERVATIVE" | "REALISTIC" | "OPTIMISTIC" | "CUSTOM";
}): Promise<SaveScenarioResult> {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: "Pro uložení scénáře se přihlaste.",
        requiresAuth: true,
      };
    }
    throw err;
  }

  if (payload.analysisId) {
    const analysis = await prisma.propertyAnalysis.findFirst({
      where: { id: payload.analysisId, userId: user.id },
      select: { id: true },
    });
    if (!analysis) {
      return { ok: false, error: "Analýza nenalezena." };
    }
  }

  let name: string | undefined;
  if (payload.scenarioName) {
    const parsed = scenarioNameSchema.safeParse(payload.scenarioName);
    if (!parsed.success) {
      return { ok: false, error: "Neplatný název scénáře." };
    }
    name = parsed.data;
  }

  try {
    const service = createInvestmentCalculationService({
      repository: createPrismaInvestmentCalculationRepository(prisma),
    });

    const propertySnapshot = buildEphemeralSnapshot(payload.inputs);
    const assumptionSet = buildAssumptionSetFromInputs(payload.inputs);

    const record = await service.calculateFromSnapshot({
      propertySnapshot,
      assumptionSet,
      scenarioType: "BASE_METRICS",
      analysisId: payload.analysisId ?? null,
      scenarioName: name ?? "Investiční výnos",
      skipCache: true,
      persist: true,
    });

    // Stamp ownership + config version on the created scenario (IDOR boundary).
    await prisma.analysisScenario.update({
      where: { id: record.id },
      data: {
        ownerUserId: user.id,
        profile: "USER",
        variant: payload.variant ?? "CUSTOM",
        assumptionConfigVersion: ASSUMPTION_CONFIG_VERSION,
        methodologyPackageVersion:
          record.methodologyPackageVersion ??
          getCurrentMethodologyPackageVersion(),
        isPublicShareEnabled: false,
        baseCurrency: "CZK",
      },
    });

    return { ok: true, scenarioId: record.id };
  } catch (err) {
    console.error("saveInvestmentScenario failed", err);
    return {
      ok: false,
      error: "Uložení scénáře se nezdařilo.",
    };
  }
}
