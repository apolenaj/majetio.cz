/**
 * Usage metering for entitlements (anti-scrape + Deep Analysis quotas).
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export function usageDayKey(d = new Date()): string {
  // UTC calendar day — documented; market-local windows are a future entitlement config.
  return d.toISOString().slice(0, 10);
}

export function usageWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function getUsageQuantity(input: {
  userId: string;
  featureKey: string;
  metricKey: string;
  windowKey: string;
  propertyId?: string | null;
}): Promise<number> {
  const scopeKey = input.propertyId?.trim() || "_";
  const row = await prisma.usageRecord.findUnique({
    where: {
      userId_featureKey_metricKey_windowKey_scopeKey: {
        userId: input.userId,
        featureKey: input.featureKey,
        metricKey: input.metricKey,
        windowKey: input.windowKey,
        scopeKey,
      },
    },
    select: { quantity: true },
  });
  return row?.quantity ?? 0;
}

export async function recordUsage(input: {
  userId: string;
  featureKey: string;
  metricKey: string;
  quantity?: number;
  propertyId?: string | null;
  windowKey?: string;
  meta?: Record<string, unknown>;
}): Promise<{ quantity: number }> {
  const qty = Math.max(1, Math.round(input.quantity ?? 1));
  const windowKey = input.windowKey ?? usageDayKey();
  const propertyId = input.propertyId?.trim() || null;
  const scopeKey = propertyId || "_";

  const row = await prisma.usageRecord.upsert({
    where: {
      userId_featureKey_metricKey_windowKey_scopeKey: {
        userId: input.userId,
        featureKey: input.featureKey,
        metricKey: input.metricKey,
        windowKey,
        scopeKey,
      },
    },
    create: {
      userId: input.userId,
      featureKey: input.featureKey,
      metricKey: input.metricKey,
      quantity: qty,
      propertyId,
      scopeKey,
      windowKey,
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    update: {
      quantity: { increment: qty },
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    select: { quantity: true },
  });

  return { quantity: row.quantity };
}
