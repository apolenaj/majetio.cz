/**
 * Effective capability resolution = plugin matrix ⊕ kill switches ⊕ review_required.
 */

import {
  getMarketCapability,
  isMarketFeatureEnabled,
} from "@/domains/markets/capabilities/matrix";
import {
  getMarketKillSwitch,
  isLeadRoutingPaused,
  isNewListingsPaused,
  isValuationPaused,
} from "@/domains/markets/capabilities/kill-switch";
import {
  capabilityUnavailableMessage,
  toUiCapabilityState,
  type UiCapabilityState,
} from "@/domains/markets/capabilities/ui-state";
import type {
  CapabilityStatus,
  MarketCapabilityKey,
} from "@/domains/markets/types";

export type EffectiveCapability = {
  marketCode: string;
  capability: MarketCapabilityKey;
  /** Raw plugin status before kills. */
  pluginStatus: CapabilityStatus;
  /** Status after kill switches (NOT_AVAILABLE when paused). */
  effectiveStatus: CapabilityStatus;
  uiState: UiCapabilityState;
  killSwitchActive: boolean;
  reviewRequired: boolean;
  message: { title: string; body: string } | null;
};

function applyKills(
  marketCode: string,
  capability: MarketCapabilityKey,
  status: CapabilityStatus,
): { status: CapabilityStatus; killSwitchActive: boolean } {
  if (capability === "VALUATION" && isValuationPaused(marketCode)) {
    return { status: "NOT_AVAILABLE", killSwitchActive: true };
  }
  if (
    (capability === "MORTGAGE_LEAD_HANDOFF" ||
      capability === "QUALIFIED_LEADS" ||
      capability === "B2B_CRM") &&
    isLeadRoutingPaused(marketCode)
  ) {
    return { status: "NOT_AVAILABLE", killSwitchActive: true };
  }
  if (
    (capability === "PROPERTY_SEARCH" || capability === "LISTING_BOOST") &&
    isNewListingsPaused(marketCode)
  ) {
    // New listings paused — search may still show existing; boost/create blocked.
    if (capability === "LISTING_BOOST") {
      return { status: "NOT_AVAILABLE", killSwitchActive: true };
    }
  }
  return { status, killSwitchActive: false };
}

/**
 * Resolve what UI should show for a capability on a market.
 * Safe for Spain (ES) — UNAVAILABLE never throws.
 */
export function resolveEffectiveCapability(input: {
  marketCode: string;
  capability: MarketCapabilityKey;
  locale?: string;
}): EffectiveCapability {
  const marketCode = input.marketCode.toUpperCase();
  const pluginStatus = getMarketCapability(marketCode, input.capability);
  const killed = applyKills(marketCode, input.capability, pluginStatus);
  const reviewRequired = getMarketKillSwitch(marketCode).reviewRequired;

  let effectiveStatus = killed.status;
  // Stale regulation: demote FULL valuation/tax/financing-sensitive caps to LIMITED
  if (
    reviewRequired &&
    effectiveStatus === "FULL" &&
    (input.capability === "VALUATION" ||
      input.capability === "TAX_ESTIMATES" ||
      input.capability === "TRANSACTION_COST_ESTIMATES" ||
      input.capability === "MORTGAGE_LEAD_HANDOFF")
  ) {
    effectiveStatus = "LIMITED";
  }

  const uiState = toUiCapabilityState(effectiveStatus);
  const message =
    uiState === "FULL"
      ? null
      : capabilityUnavailableMessage({
          capability: input.capability,
          marketCode,
          locale: input.locale,
          state: uiState,
        });

  return {
    marketCode,
    capability: input.capability,
    pluginStatus,
    effectiveStatus,
    uiState,
    killSwitchActive: killed.killSwitchActive,
    reviewRequired,
    message,
  };
}

export function isCapabilityUiAvailable(input: {
  marketCode: string;
  capability: MarketCapabilityKey;
}): boolean {
  const eff = resolveEffectiveCapability(input);
  return eff.uiState === "FULL" || eff.uiState === "LIMITED";
}

/** Combined flag: plugin + env + kill switch. */
export function isEffectiveValuationEnabled(marketCode: string): boolean {
  if (isValuationPaused(marketCode)) return false;
  return isMarketFeatureEnabled(marketCode, "VALUATION");
}

export function isEffectiveLeadRoutingEnabled(marketCode: string): boolean {
  if (isLeadRoutingPaused(marketCode)) return false;
  return isMarketFeatureEnabled(marketCode, "MORTGAGE_LEAD_HANDOFF");
}

export function isEffectiveNewListingEnabled(marketCode: string): boolean {
  return !isNewListingsPaused(marketCode);
}
