/**
 * Emergency stale regulation → market review_required (Rule 220).
 */

import { listRegulatoryRules } from "@/domains/regulatory/rules/registry";
import {
  getMarketKillSwitch,
  setMarketKillSwitch,
} from "@/domains/markets/capabilities/kill-switch";

/** Default: rules older than 180 days without re-verify are stale. */
export const DEFAULT_REGULATION_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type StaleRegulationScanResult = {
  marketCode: string;
  staleRuleCodes: string[];
  reviewRequired: boolean;
  /** True when kill switch reviewRequired was set/updated by this scan. */
  flagApplied: boolean;
};

/**
 * If any non-demo ACTIVE rule has verifiedAt older than maxAge (or null),
 * mark market review_required.
 */
export function evaluateStaleRegulationForMarket(input: {
  marketCode: string;
  asOf?: Date;
  maxAgeMs?: number;
  /** When true, set kill-switch reviewRequired. */
  applyFlag?: boolean;
  updatedBy?: string;
}): StaleRegulationScanResult {
  const market = input.marketCode.toUpperCase();
  const asOf = input.asOf ?? new Date();
  const maxAgeMs = input.maxAgeMs ?? DEFAULT_REGULATION_MAX_AGE_MS;

  const rules = listRegulatoryRules(market, { includeDemo: false }).filter(
    (r) => r.status === "ACTIVE",
  );

  const staleRuleCodes: string[] = [];
  for (const rule of rules) {
    if (!rule.verifiedAt) {
      staleRuleCodes.push(rule.code);
      continue;
    }
    const age = asOf.getTime() - Date.parse(rule.verifiedAt);
    if (age > maxAgeMs) staleRuleCodes.push(rule.code);
  }

  const reviewRequired = staleRuleCodes.length > 0;
  let flagApplied = false;

  if (input.applyFlag && reviewRequired) {
    const prev = getMarketKillSwitch(market);
    if (!prev.reviewRequired) {
      setMarketKillSwitch({
        marketCode: market,
        reviewRequired: true,
        updatedBy: input.updatedBy ?? "stale-regulation-scan",
        reason: `Stale regulation: ${staleRuleCodes.slice(0, 5).join(", ")}`,
      });
      flagApplied = true;
    }
  }

  return {
    marketCode: market,
    staleRuleCodes,
    reviewRequired,
    flagApplied,
  };
}

export function evaluateStaleRegulationAllMarkets(input?: {
  asOf?: Date;
  maxAgeMs?: number;
  applyFlag?: boolean;
}): StaleRegulationScanResult[] {
  const markets = new Set(
    listRegulatoryRules(undefined, { includeDemo: false }).map(
      (r) => r.marketCode,
    ),
  );
  return [...markets].map((marketCode) =>
    evaluateStaleRegulationForMarket({
      marketCode,
      asOf: input?.asOf,
      maxAgeMs: input?.maxAgeMs,
      applyFlag: input?.applyFlag,
    }),
  );
}
