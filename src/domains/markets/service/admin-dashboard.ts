/**
 * Admin / ops view-model for market configuration (Prompt 17.1).
 * New market = plugin + registry entry — no Core code change.
 */

import { marketRegistry } from "@/domains/markets/registry/market-registry";
import {
  buildCapabilityMatrix,
  getMarketFeatureFlagSnapshot,
  isMarketFeatureEnabled,
} from "@/domains/markets/capabilities/matrix";
import { getMarketKillSwitch } from "@/domains/markets/capabilities/kill-switch";
import { resolveEffectiveCapability } from "@/domains/markets/capabilities/effective";
import type { CapabilityStatus, LaunchStatus } from "@/domains/markets/types";
import { MARKET_CAPABILITY_KEYS } from "@/domains/markets/types";
import {
  evaluateMarketLaunchReadiness,
  type MarketLaunchReadinessStatus,
} from "@/domains/markets/launch-readiness";

export type AdminMarketRow = {
  marketCode: string;
  countryCode: string;
  displayNameEn: string;
  displayNameLocal: string;
  defaultLocale: string;
  supportedLocales: readonly string[];
  defaultCurrency: string;
  timezone: string;
  measurementSystem: string;
  enabled: boolean;
  launchStatus: LaunchStatus;
  regulatoryConfigVersion: string;
  hasMinimumPublicData: boolean;
  publiclyActive: boolean;
  hiddenReason: string | null;
  regions: Array<{ regionCode: string; displayNameEn: string }>;
  valuationFlag: boolean;
  capabilitySummary: Partial<Record<string, CapabilityStatus>>;
  /** UI-facing FULL / LIMITED / UNAVAILABLE for key caps. */
  uiCapabilities: Partial<Record<string, string>>;
  killSwitch: {
    pauseNewListings: boolean;
    pauseValuations: boolean;
    pauseLeadRouting: boolean;
    pausePayments: boolean;
    reviewRequired: boolean;
  };
  /** Prompt 17.5 readiness checklist status. */
  launchReadiness: MarketLaunchReadinessStatus;
  launchReadinessBlocking: string[];
};

export type AdminMarketsDashboard = {
  rows: AdminMarketRow[];
  capabilityMatrix: ReturnType<typeof buildCapabilityMatrix>;
  featureFlagSnapshot: Record<string, boolean>;
  counts: {
    total: number;
    live: number;
    beta: number;
    publiclyActive: number;
    plannedOrResearch: number;
  };
};

export function buildAdminMarketsDashboard(): AdminMarketsDashboard {
  const entries = marketRegistry.listAll();
  const rows: AdminMarketRow[] = entries.map((entry) => {
    const surface = marketRegistry.toPublicSurface(entry.marketCode)!;
    const capabilitySummary: Partial<Record<string, CapabilityStatus>> = {};
    const uiCapabilities: Partial<Record<string, string>> = {};
    for (const key of MARKET_CAPABILITY_KEYS) {
      capabilitySummary[key] = entry.plugin.capabilities[key] ?? "NOT_AVAILABLE";
      uiCapabilities[key] = resolveEffectiveCapability({
        marketCode: entry.marketCode,
        capability: key,
      }).uiState;
    }
    const ks = getMarketKillSwitch(entry.marketCode);
    const readiness = evaluateMarketLaunchReadiness(entry.marketCode);
    return {
      marketCode: entry.marketCode,
      countryCode: entry.countryCode,
      displayNameEn: entry.displayNameEn,
      displayNameLocal: entry.displayNameLocal,
      defaultLocale: entry.defaultLocale,
      supportedLocales: entry.supportedLocales,
      defaultCurrency: entry.defaultCurrency,
      timezone: entry.timezone,
      measurementSystem: entry.measurementSystem,
      enabled: entry.enabled,
      launchStatus: entry.launchStatus,
      regulatoryConfigVersion: entry.regulatoryConfigVersion,
      hasMinimumPublicData: entry.hasMinimumPublicData,
      publiclyActive: surface.publiclyActive,
      hiddenReason: surface.reasonIfHidden,
      regions: (entry.regions ?? []).map((r) => ({
        regionCode: r.regionCode,
        displayNameEn: r.displayNameEn,
      })),
      valuationFlag: isMarketFeatureEnabled(entry.marketCode, "VALUATION"),
      capabilitySummary,
      uiCapabilities,
      killSwitch: {
        pauseNewListings: ks.pauseNewListings,
        pauseValuations: ks.pauseValuations,
        pauseLeadRouting: ks.pauseLeadRouting,
        pausePayments: ks.pausePayments,
        reviewRequired: ks.reviewRequired,
      },
      launchReadiness: readiness.status,
      launchReadinessBlocking: readiness.blockingReasons,
    };
  });

  const counts = {
    total: rows.length,
    live: rows.filter((r) => r.launchStatus === "LIVE").length,
    beta: rows.filter((r) => r.launchStatus === "BETA").length,
    publiclyActive: rows.filter((r) => r.publiclyActive).length,
    plannedOrResearch: rows.filter((r) =>
      ["PLANNED", "RESEARCH"].includes(r.launchStatus),
    ).length,
  };

  return {
    rows,
    capabilityMatrix: buildCapabilityMatrix(),
    featureFlagSnapshot: getMarketFeatureFlagSnapshot(),
    counts,
  };
}
