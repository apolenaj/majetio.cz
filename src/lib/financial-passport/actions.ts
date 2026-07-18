"use server";

import { PropertyType } from "@prisma/client";
import { z } from "zod";

import { writeAuditLog } from "@/lib/auth/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { percentBucket, track } from "@/lib/analytics/events";
import { computePassportProgress } from "@/lib/financial-passport/progress";
import { buildPassportRecommendations } from "@/lib/financial-passport/recommendations";
import {
  emptyPassportState,
  latestPassportTimestamp,
  type FinancingModeId,
  type OnboardingGoalId,
  type PassportState,
  type PassportTimestamps,
  type RiskToleranceId,
} from "@/lib/financial-passport/types";

export type PassportActionResult =
  | {
      ok: true;
      state: PassportState;
      progress: ReturnType<typeof computePassportProgress>;
      recommendations: ReturnType<typeof buildPassportRecommendations>;
    }
  | {
      ok: false;
      error: string;
      code?: "CONFLICT" | "UNAUTHORIZED" | "VALIDATION";
      state?: PassportState;
      progress?: ReturnType<typeof computePassportProgress>;
      recommendations?: ReturnType<typeof buildPassportRecommendations>;
    };

const goalSchema = z.enum(["OWN_HOME", "INVESTMENT", "RENOVATION", "FLIP", "EXPLORING"]);
const financingSchema = z.enum(["MORTGAGE", "MIXED", "CASH"]);
const riskSchema = z.enum(["CONSERVATIVE", "BALANCED", "DYNAMIC"]);

const timestampsSchema = z.object({
  profile: z.string().nullable(),
  financial: z.string().nullable(),
  property: z.string().nullable(),
  investment: z.string().nullable(),
});

const saveSchema = z.object({
  expectedTimestamps: timestampsSchema,
  goal: goalSchema.nullable(),
  maxPriceCzk: z.number().int().positive().max(500_000_000).nullable(),
  availableEquityCzk: z.number().int().nonnegative().max(500_000_000).nullable(),
  equityPercent: z.number().min(0).max(100).nullable(),
  financingMode: financingSchema.nullable(),
  monthlyIncomeCzk: z.number().int().positive().max(50_000_000).nullable(),
  monthlyLiabilitiesCzk: z.number().int().nonnegative().max(50_000_000).nullable(),
  riskTolerance: riskSchema.nullable(),
  strategies: z.array(z.string().max(64)).max(6),
  targetGrossYieldPct: z.number().min(0).max(50).nullable(),
  targetCashFlowMonthlyCzk: z.number().int().min(-1_000_000).max(5_000_000).nullable(),
  preferredCity: z.string().max(120),
  regions: z.array(z.string().max(80)).max(8),
  propertyTypes: z.array(z.nativeEnum(PropertyType)).max(5),
  dispositions: z.array(z.string().max(32)).max(12),
  minAreaSqm: z.number().min(0).max(10_000).nullable(),
  maxAreaSqm: z.number().min(0).max(10_000).nullable(),
});

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function sameTimestamp(expected: string | null, actual: Date | null | undefined): boolean {
  if (!expected && !actual) return true;
  if (!expected || !actual) return false;
  return new Date(expected).getTime() === actual.getTime();
}

function mapState(input: {
  profile: {
    onboardingGoal: string | null;
    updatedAt: Date;
  } | null;
  financial: {
    monthlyIncomeCzk: number | null;
    monthlyLiabilitiesCzk: number | null;
    availableEquityCzk: number | null;
    equityPercent: number | null;
    financingMode: string | null;
    updatedAt: Date;
  } | null;
  property: {
    propertyTypes: PropertyType[];
    preferredCity: string | null;
    regions: string[];
    dispositions: string[];
    maxPriceCzk: number | null;
    minAreaSqm: number | null;
    maxAreaSqm: number | null;
    updatedAt: Date;
  } | null;
  investment: {
    strategies: string[];
    targetGrossYieldPct: number | null;
    targetCashFlowMonthlyCzk: number | null;
    maxRiskLevel: string | null;
    updatedAt: Date;
  } | null;
}): PassportState {
  const base = emptyPassportState();
  return {
    ...base,
    goal: (input.profile?.onboardingGoal as OnboardingGoalId | null) ?? null,
    maxPriceCzk: input.property?.maxPriceCzk ?? null,
    availableEquityCzk: input.financial?.availableEquityCzk ?? null,
    equityPercent: input.financial?.equityPercent ?? null,
    financingMode: (input.financial?.financingMode as FinancingModeId | null) ?? null,
    monthlyIncomeCzk: input.financial?.monthlyIncomeCzk ?? null,
    monthlyLiabilitiesCzk: input.financial?.monthlyLiabilitiesCzk ?? null,
    riskTolerance: (input.investment?.maxRiskLevel as RiskToleranceId | null) ?? null,
    strategies: input.investment?.strategies ?? [],
    targetGrossYieldPct: input.investment?.targetGrossYieldPct ?? null,
    targetCashFlowMonthlyCzk: input.investment?.targetCashFlowMonthlyCzk ?? null,
    preferredCity: input.property?.preferredCity ?? "",
    regions: input.property?.regions ?? [],
    propertyTypes: input.property?.propertyTypes ?? [],
    dispositions: input.property?.dispositions ?? [],
    minAreaSqm: input.property?.minAreaSqm ?? null,
    maxAreaSqm: input.property?.maxAreaSqm ?? null,
    timestamps: {
      profile: iso(input.profile?.updatedAt),
      financial: iso(input.financial?.updatedAt),
      property: iso(input.property?.updatedAt),
      investment: iso(input.investment?.updatedAt),
    },
  };
}

async function loadRows(userId: string) {
  const [profile, financial, property, investment] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.propertyPreference.findUnique({ where: { userId } }),
    prisma.investmentPreference.findUnique({ where: { userId } }),
  ]);
  return { profile, financial, property, investment };
}

function pack(state: PassportState): Extract<PassportActionResult, { ok: true }> {
  return {
    ok: true,
    state,
    progress: computePassportProgress(state),
    recommendations: buildPassportRecommendations(state),
  };
}

export async function loadFinancialPassport(): Promise<PassportActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné.", code: "UNAUTHORIZED" };
  }

  const rows = await loadRows(session.user.id);
  return pack(mapState(rows));
}

export async function saveFinancialPassport(
  raw: z.input<typeof saveSchema>,
): Promise<PassportActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné.", code: "UNAUTHORIZED" };
  }
  const userId = session.user.id;

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Neplatná data. Zkontrolujte zadané hodnoty.",
      code: "VALIDATION",
    };
  }

  const data = parsed.data;
  const current = await loadRows(userId);

  const conflict =
    !sameTimestamp(data.expectedTimestamps.profile, current.profile?.updatedAt) ||
    !sameTimestamp(data.expectedTimestamps.financial, current.financial?.updatedAt) ||
    !sameTimestamp(data.expectedTimestamps.property, current.property?.updatedAt) ||
    !sameTimestamp(data.expectedTimestamps.investment, current.investment?.updatedAt);

  if (conflict) {
    const fresh = mapState(current);
    return {
      ok: false,
      code: "CONFLICT",
      error:
        "Pas byl mezitím upraven v jiném okně. Načetli jsme aktuální verzi — zkontrolujte údaje a uložte znovu.",
      state: fresh,
      progress: computePassportProgress(fresh),
      recommendations: buildPassportRecommendations(fresh),
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredLocale: "cs",
        onboardingGoal: data.goal,
        investmentGoal: data.goal,
      },
      update: {
        onboardingGoal: data.goal,
        investmentGoal: data.goal,
      },
    });

    await tx.financialProfile.upsert({
      where: { userId },
      create: {
        userId,
        monthlyIncomeCzk: data.monthlyIncomeCzk,
        monthlyLiabilitiesCzk: data.monthlyLiabilitiesCzk,
        availableEquityCzk: data.availableEquityCzk,
        equityPercent: data.equityPercent,
        financingMode: data.financingMode,
      },
      update: {
        monthlyIncomeCzk: data.monthlyIncomeCzk,
        monthlyLiabilitiesCzk: data.monthlyLiabilitiesCzk,
        availableEquityCzk: data.availableEquityCzk,
        equityPercent: data.equityPercent,
        financingMode: data.financingMode,
      },
    });

    await tx.propertyPreference.upsert({
      where: { userId },
      create: {
        userId,
        propertyTypes: data.propertyTypes,
        preferredCity: data.preferredCity || null,
        regions: data.regions,
        dispositions: data.dispositions,
        maxPriceCzk: data.maxPriceCzk,
        minAreaSqm: data.minAreaSqm,
        maxAreaSqm: data.maxAreaSqm,
      },
      update: {
        propertyTypes: data.propertyTypes,
        preferredCity: data.preferredCity || null,
        regions: data.regions,
        dispositions: data.dispositions,
        maxPriceCzk: data.maxPriceCzk,
        minAreaSqm: data.minAreaSqm,
        maxAreaSqm: data.maxAreaSqm,
      },
    });

    await tx.investmentPreference.upsert({
      where: { userId },
      create: {
        userId,
        strategies: data.strategies,
        targetGrossYieldPct: data.targetGrossYieldPct,
        targetCashFlowMonthlyCzk: data.targetCashFlowMonthlyCzk,
        maxRiskLevel: data.riskTolerance,
        financingPreferred:
          data.financingMode === "MORTGAGE" || data.financingMode === "MIXED"
            ? true
            : data.financingMode === "CASH"
              ? false
              : null,
      },
      update: {
        strategies: data.strategies,
        targetGrossYieldPct: data.targetGrossYieldPct,
        targetCashFlowMonthlyCzk: data.targetCashFlowMonthlyCzk,
        maxRiskLevel: data.riskTolerance,
        financingPreferred:
          data.financingMode === "MORTGAGE" || data.financingMode === "MIXED"
            ? true
            : data.financingMode === "CASH"
              ? false
              : null,
      },
    });
  });

  await writeAuditLog({
    action: "financial_passport.update",
    entity: "FinancialProfile",
    entityId: userId,
    actorId: userId,
    meta: {
      goal: data.goal,
      financingMode: data.financingMode,
      lastSavedAt: latestPassportTimestamp(data.expectedTimestamps as PassportTimestamps),
    },
  });

  const fresh = mapState(await loadRows(userId));
  const progress = computePassportProgress(fresh);
  track({
    name: "financial_profile_updated",
    props: {
      completion_level: progress.level,
      percent_bucket: percentBucket(progress.percent),
    },
  });
  return pack(fresh);
}

export type DashboardSnapshot = {
  email: string;
  displayName: string;
  passport: PassportState;
  progress: ReturnType<typeof computePassportProgress>;
  recommendations: ReturnType<typeof buildPassportRecommendations>;
  favouritesCount: number;
  analysesCount: number;
  comparisonsCount: number;
  recentFavourites: {
    id: string;
    title: string;
    slug: string;
    city: string | null;
    priceCzk: number | null;
  }[];
  recentAnalyses: {
    id: string;
    status: string;
    majetioScore: number | null;
    updatedAt: string;
    propertyTitle: string | null;
  }[];
  recentComparisons: {
    id: string;
    name: string | null;
    itemCount: number;
    updatedAt: string;
  }[];
};

export async function loadAccountDashboard(): Promise<
  { ok: true; data: DashboardSnapshot } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné." };
  }
  const userId = session.user.id;

  const [user, rows, favouritesCount, analysesCount, comparisonsCount, favourites, analyses, comparisons] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      }),
      loadRows(userId),
      prisma.favourite.count({ where: { userId } }),
      prisma.propertyAnalysis.count({ where: { userId } }),
      prisma.comparison.count({ where: { userId } }),
      prisma.favourite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          property: {
            select: { id: true, title: true, slug: true, city: true, priceCzk: true },
          },
        },
      }),
      prisma.propertyAnalysis.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: {
          property: { select: { title: true } },
        },
      }),
      prisma.comparison.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: { _count: { select: { items: true } } },
      }),
    ]);

  const passport = mapState(rows);
  const email = user?.email ?? session.user.email ?? "";
  const displayName =
    user?.name?.trim() ||
    email.split("@")[0] ||
    "uživateli";

  return {
    ok: true,
    data: {
      email,
      displayName,
      passport,
      progress: computePassportProgress(passport),
      recommendations: buildPassportRecommendations(passport).slice(0, 2),
      favouritesCount,
      analysesCount,
      comparisonsCount,
      recentFavourites: favourites.map((f) => ({
        id: f.property.id,
        title: f.property.title,
        slug: f.property.slug,
        city: f.property.city,
        priceCzk: f.property.priceCzk,
      })),
      recentAnalyses: analyses.map((a) => ({
        id: a.id,
        status: a.status,
        majetioScore: a.majetioScore,
        updatedAt: a.updatedAt.toISOString(),
        propertyTitle: a.property?.title ?? null,
      })),
      recentComparisons: comparisons.map((c) => ({
        id: c.id,
        name: c.name,
        itemCount: c._count.items,
        updatedAt: c.updatedAt.toISOString(),
      })),
    },
  };
}
