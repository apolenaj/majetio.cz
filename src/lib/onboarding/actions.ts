"use server";

import { PropertyType } from "@prisma/client";
import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { track } from "@/lib/analytics/events";
import {
  emptyOnboardingState,
  getVisibleSteps,
  needsInvestmentSteps,
  type FinancingModeId,
  type OnboardingGoalId,
  type OnboardingState,
  type OnboardingStepId,
} from "@/lib/onboarding/types";

export type OnboardingActionResult =
  | { ok: true; state: OnboardingState }
  | { ok: false; error: string };

const goalSchema = z.enum(["OWN_HOME", "INVESTMENT", "RENOVATION", "FLIP", "EXPLORING"]);
const financingSchema = z.enum(["MORTGAGE", "MIXED", "CASH"]);
const stepSchema = z.enum([
  "goal",
  "propertyType",
  "location",
  "budget",
  "equity",
  "financing",
  "strategy",
  "investmentPrefs",
  "complete",
]);

const saveSchema = z.object({
  step: stepSchema,
  goal: goalSchema.nullable().optional(),
  propertyTypes: z.array(z.nativeEnum(PropertyType)).optional(),
  preferredCity: z.string().max(120).optional(),
  regions: z.array(z.string().max(80)).max(8).optional(),
  maxPriceCzk: z.number().int().positive().max(500_000_000).nullable().optional(),
  availableEquityCzk: z.number().int().nonnegative().max(500_000_000).nullable().optional(),
  equityPercent: z.number().min(0).max(100).nullable().optional(),
  financingMode: financingSchema.nullable().optional(),
  strategies: z.array(z.string().max(64)).max(6).optional(),
  targetGrossYieldPct: z.number().min(0).max(50).nullable().optional(),
  targetCashFlowMonthlyCzk: z.number().int().min(-1_000_000).max(5_000_000).nullable().optional(),
});

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function mapState(input: {
  profile: {
    onboardingGoal: string | null;
    onboardingStep: number;
    onboardingCompletedAt: Date | null;
    onboardingSkippedAt: Date | null;
  } | null;
  property: {
    propertyTypes: PropertyType[];
    preferredCity: string | null;
    regions: string[];
    maxPriceCzk: number | null;
  } | null;
  financial: {
    availableEquityCzk: number | null;
    equityPercent: number | null;
    financingMode: string | null;
  } | null;
  investment: {
    strategies: string[];
    targetGrossYieldPct: number | null;
    targetCashFlowMonthlyCzk: number | null;
  } | null;
}): OnboardingState {
  const base = emptyOnboardingState();
  const goal = (input.profile?.onboardingGoal as OnboardingGoalId | null) ?? null;
  const steps = getVisibleSteps(goal);
  const stepIndex = Math.max(0, (input.profile?.onboardingStep ?? 1) - 1);
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? "goal";

  return {
    ...base,
    goal,
    propertyTypes: input.property?.propertyTypes ?? [],
    preferredCity: input.property?.preferredCity ?? "",
    regions: input.property?.regions ?? [],
    maxPriceCzk: input.property?.maxPriceCzk ?? null,
    availableEquityCzk: input.financial?.availableEquityCzk ?? null,
    equityPercent: input.financial?.equityPercent ?? null,
    financingMode: (input.financial?.financingMode as FinancingModeId | null) ?? null,
    strategies: input.investment?.strategies ?? [],
    targetGrossYieldPct: input.investment?.targetGrossYieldPct ?? null,
    targetCashFlowMonthlyCzk: input.investment?.targetCashFlowMonthlyCzk ?? null,
    step,
    completed: Boolean(input.profile?.onboardingCompletedAt),
    skipped: Boolean(input.profile?.onboardingSkippedAt),
  };
}

export async function loadOnboardingState(): Promise<OnboardingActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const [profile, property, financial, investment] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.propertyPreference.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.investmentPreference.findUnique({ where: { userId } }),
  ]);

  return {
    ok: true,
    state: mapState({ profile, property, financial, investment }),
  };
}

export async function saveOnboardingProgress(
  raw: z.input<typeof saveSchema>,
): Promise<OnboardingActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatná data. Zkontrolujte zadané hodnoty." };
  }

  const data = parsed.data;
  const goal = data.goal ?? null;
  const visible = getVisibleSteps(goal);
  const stepIndex = Math.max(0, visible.indexOf(data.step));
  const onboardingStep = stepIndex + 1;

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredLocale: "cs",
        onboardingGoal: goal,
        onboardingStep,
        investmentGoal: goal,
      },
      update: {
        onboardingGoal: goal ?? undefined,
        onboardingStep,
        investmentGoal: goal ?? undefined,
        onboardingSkippedAt: null,
      },
    });

    if (
      data.propertyTypes !== undefined ||
      data.preferredCity !== undefined ||
      data.regions !== undefined ||
      data.maxPriceCzk !== undefined
    ) {
      await tx.propertyPreference.upsert({
        where: { userId },
        create: {
          userId,
          propertyTypes: data.propertyTypes ?? [],
          preferredCity: data.preferredCity || null,
          regions: data.regions ?? [],
          maxPriceCzk: data.maxPriceCzk ?? null,
        },
        update: {
          ...(data.propertyTypes !== undefined ? { propertyTypes: data.propertyTypes } : {}),
          ...(data.preferredCity !== undefined
            ? { preferredCity: data.preferredCity || null }
            : {}),
          ...(data.regions !== undefined ? { regions: data.regions } : {}),
          ...(data.maxPriceCzk !== undefined ? { maxPriceCzk: data.maxPriceCzk } : {}),
        },
      });
    }

    if (
      data.availableEquityCzk !== undefined ||
      data.equityPercent !== undefined ||
      data.financingMode !== undefined
    ) {
      await tx.financialProfile.upsert({
        where: { userId },
        create: {
          userId,
          availableEquityCzk: data.availableEquityCzk ?? null,
          equityPercent: data.equityPercent ?? null,
          financingMode: data.financingMode ?? null,
        },
        update: {
          ...(data.availableEquityCzk !== undefined
            ? { availableEquityCzk: data.availableEquityCzk }
            : {}),
          ...(data.equityPercent !== undefined ? { equityPercent: data.equityPercent } : {}),
          ...(data.financingMode !== undefined ? { financingMode: data.financingMode } : {}),
        },
      });
    }

    if (
      data.strategies !== undefined ||
      data.targetGrossYieldPct !== undefined ||
      data.targetCashFlowMonthlyCzk !== undefined
    ) {
      await tx.investmentPreference.upsert({
        where: { userId },
        create: {
          userId,
          strategies: data.strategies ?? [],
          targetGrossYieldPct: data.targetGrossYieldPct ?? null,
          targetCashFlowMonthlyCzk: data.targetCashFlowMonthlyCzk ?? null,
          financingPreferred:
            data.financingMode === "MORTGAGE" || data.financingMode === "MIXED"
              ? true
              : data.financingMode === "CASH"
                ? false
                : null,
        },
        update: {
          ...(data.strategies !== undefined ? { strategies: data.strategies } : {}),
          ...(data.targetGrossYieldPct !== undefined
            ? { targetGrossYieldPct: data.targetGrossYieldPct }
            : {}),
          ...(data.targetCashFlowMonthlyCzk !== undefined
            ? { targetCashFlowMonthlyCzk: data.targetCashFlowMonthlyCzk }
            : {}),
          ...(data.financingMode !== undefined
            ? {
                financingPreferred:
                  data.financingMode === "MORTGAGE" || data.financingMode === "MIXED"
                    ? true
                    : data.financingMode === "CASH"
                      ? false
                      : null,
              }
            : {}),
        },
      });
    }
  });

  track({
    name: "onboarding_step_saved",
    props: {
      step: data.step,
      has_goal: Boolean(goal),
      investment_path: needsInvestmentSteps(goal),
    },
  });

  return loadOnboardingState();
}

export async function completeOnboarding(
  step: OnboardingStepId = "complete",
): Promise<OnboardingActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  const visible = getVisibleSteps(
    (
      await prisma.userProfile.findUnique({
        where: { userId },
        select: { onboardingGoal: true },
      })
    )?.onboardingGoal as OnboardingGoalId | null,
  );
  const completeIndex = visible.indexOf("complete") + 1;

  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      preferredLocale: "cs",
      onboardingStep: completeIndex > 0 ? completeIndex : visible.length,
      onboardingCompletedAt: new Date(),
    },
    update: {
      onboardingStep: completeIndex > 0 ? completeIndex : visible.length,
      onboardingCompletedAt: new Date(),
      onboardingSkippedAt: null,
    },
  });

  await writeAuditLog({
    action: "onboarding.complete",
    entity: "UserProfile",
    entityId: userId,
    actorId: userId,
    meta: { step },
  });

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingGoal: true },
  });
  track({
    name: "onboarding_completed",
    props: {
      goal: (profile?.onboardingGoal as OnboardingGoalId | null) ?? null,
      investment_path: needsInvestmentSteps(
        (profile?.onboardingGoal as OnboardingGoalId | null) ?? null,
      ),
    },
  });

  return loadOnboardingState();
}

export async function skipOnboarding(): Promise<OnboardingActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Přihlášení je povinné." };

  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      preferredLocale: "cs",
      onboardingSkippedAt: new Date(),
    },
    update: {
      onboardingSkippedAt: new Date(),
    },
  });

  await writeAuditLog({
    action: "onboarding.skip",
    entity: "UserProfile",
    entityId: userId,
    actorId: userId,
  });

  track({ name: "onboarding_skipped", props: {} });

  return loadOnboardingState();
}

export async function isOnboardingPending(userId: string): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true, onboardingSkippedAt: true },
  });
  if (!profile) return true;
  return !profile.onboardingCompletedAt && !profile.onboardingSkippedAt;
}
