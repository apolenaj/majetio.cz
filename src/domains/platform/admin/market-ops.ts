/**
 * Market Admin ops — LIVE requires readiness validation; emergency PAUSED.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  assertCanSetLaunchStatus,
  canMarketGoLive,
} from "@/domains/markets/launch-readiness";
import { marketRegistry } from "@/domains/markets/registry/market-registry";
import type { LaunchStatus } from "@/domains/markets/types";

export type MarketAdminReadinessRow = {
  marketCode: string;
  displayNameLocal: string;
  launchStatus: LaunchStatus;
  enabled: boolean;
  canGoLive: boolean;
  supportedLocales: string[];
  defaultLocale: string;
  hasMinimumPublicData: boolean;
  regulatoryConfigVersion: string;
};

export function buildMarketReadinessRows(): MarketAdminReadinessRow[] {
  return marketRegistry.listAll().map((entry) => ({
    marketCode: entry.marketCode,
    displayNameLocal: entry.displayNameLocal,
    launchStatus: entry.launchStatus,
    enabled: entry.enabled,
    canGoLive: canMarketGoLive(entry.marketCode),
    supportedLocales: [...entry.supportedLocales],
    defaultLocale: entry.defaultLocale,
    hasMinimumPublicData: entry.hasMinimumPublicData,
    regulatoryConfigVersion: entry.regulatoryConfigVersion,
  }));
}

/**
 * Persist launchStatus to Market row. LIVE/BETA blocked without readiness.
 * Caller must enforce sensitive step-up for LIVE.
 */
export async function setMarketLaunchStatus(input: {
  marketCode: string;
  nextStatus: LaunchStatus;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 12) {
    return { ok: false, error: "Reason min. 12 characters." };
  }

  const code = input.marketCode.toUpperCase();

  try {
    assertCanSetLaunchStatus({
      marketCode: code,
      nextStatus: input.nextStatus,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Launch blocked.",
    };
  }

  const enabled =
    input.nextStatus === "LIVE" || input.nextStatus === "BETA"
      ? true
      : input.nextStatus === "PAUSED"
        ? false
        : undefined;

  const entry = marketRegistry.get(code);

  try {
    await prisma.market.upsert({
      where: { marketCode: code },
      create: {
        marketCode: code,
        countryCode: entry?.countryCode ?? code.slice(0, 2),
        displayNameEn: entry?.displayNameEn ?? code,
        displayNameLocal: entry?.displayNameLocal ?? code,
        defaultLocale: entry?.defaultLocale ?? "en",
        supportedLocales: [...(entry?.supportedLocales ?? ["en"])],
        defaultCurrency: entry?.defaultCurrency ?? "EUR",
        timezone: entry?.timezone ?? "UTC",
        enabled: enabled ?? false,
        launchStatus: input.nextStatus,
        regulatoryConfigVersion: entry?.regulatoryConfigVersion ?? "pending",
        hasMinimumPublicData: entry?.hasMinimumPublicData ?? false,
      },
      update: {
        launchStatus: input.nextStatus,
        ...(enabled !== undefined ? { enabled } : {}),
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Market update failed",
    };
  }

  await writeAuditLog({
    action:
      input.nextStatus === "PAUSED"
        ? "admin.market.emergency_pause"
        : "admin.market.launch_status",
    entity: "Market",
    entityId: code,
    actorId: input.actorUserId,
    meta: {
      nextStatus: input.nextStatus,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}

export async function emergencyPauseMarket(input: {
  marketCode: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return setMarketLaunchStatus({
    ...input,
    nextStatus: "PAUSED",
  });
}
