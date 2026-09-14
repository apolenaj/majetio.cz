"use server";

import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/auth/audit";
import { track } from "@/lib/analytics/events";
import { prisma } from "@/lib/db";

export type AccountExportPayload = {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  profile: unknown;
  financialProfile: unknown;
  propertyPreference: unknown;
  investmentPreference: unknown;
  consents: unknown[];
  favourites: unknown[];
  analyses: unknown[];
  comparisons: unknown[];
  leads: unknown[];
  notificationPrefs: unknown;
};

export async function buildAccountExport(
  format: "json" | "csv" = "json",
): Promise<
  { ok: true; data: AccountExportPayload } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };
  const userId = session.user.id;

  const [user, profile, financial, property, investment, consents, favourites, analyses, comparisons, leads] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.financialProfile.findUnique({ where: { userId } }),
      prisma.propertyPreference.findUnique({ where: { userId } }),
      prisma.investmentPreference.findUnique({ where: { userId } }),
      prisma.consent.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.favourite.findMany({
        where: { userId },
        include: { property: { select: { slug: true, title: true, city: true } } },
      }),
      prisma.propertyAnalysis.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          tier: true,
          majetioScore: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.comparison.findMany({
        where: { userId },
        include: {
          properties: { select: { propertyId: true, sortOrder: true } },
        },
      }),
      prisma.lead.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          payload: true,
        },
      }),
    ]);

  if (!user) return { ok: false, error: "Účet nenalezen." };

  await writeAuditLog({
    action: "account.export",
    entity: "User",
    entityId: userId,
    actorId: userId,
  });

  track({ name: "account_export_requested", props: { format } });

  return {
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
      profile,
      financialProfile: financial,
      propertyPreference: property,
      investmentPreference: investment,
      consents,
      favourites,
      analyses,
      comparisons,
      leads,
      notificationPrefs: profile
        ? {
            transactionalEmail: profile.notifyTransactionalEmail,
            transactionalInApp: profile.notifyTransactionalInApp,
            marketingEmail: profile.notifyMarketingEmail,
            marketingInApp: profile.notifyMarketingInApp,
          }
        : null,
    },
  };
}
