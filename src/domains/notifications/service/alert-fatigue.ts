import { propertyAlertConfig } from "@/config/property-alerts";
import { prisma } from "@/lib/db";

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Notification fatigue — suppress excess alerts per user / property / day.
 */
export async function shouldSuppressForFatigue(input: {
  userId: string;
  propertyId?: string | null;
}): Promise<{ suppress: boolean; reason?: string }> {
  const since = startOfUtcDay();
  const cfg = propertyAlertConfig.fatigue;

  const userCount = await prisma.propertyAlert.count({
    where: {
      userId: input.userId,
      createdAt: { gte: since },
      status: { not: "SUPPRESSED" },
    },
  });
  if (userCount >= cfg.maxPerUserPerDay) {
    return { suppress: true, reason: "daily_user_cap" };
  }

  if (input.propertyId) {
    const propCount = await prisma.propertyAlert.count({
      where: {
        userId: input.userId,
        propertyId: input.propertyId,
        createdAt: { gte: since },
        status: { not: "SUPPRESSED" },
      },
    });
    if (propCount >= cfg.maxPerPropertyPerDay) {
      return { suppress: true, reason: "daily_property_cap" };
    }
  }

  return { suppress: false };
}
