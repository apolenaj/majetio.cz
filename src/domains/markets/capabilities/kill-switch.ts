/**
 * Admin kill switches per market (Rules 209–217).
 * Immediate pause of new listings, valuations, or lead routing.
 */

export type MarketKillSwitchState = {
  marketCode: string;
  pauseNewListings: boolean;
  pauseValuations: boolean;
  pauseLeadRouting: boolean;
  pausePayments: boolean;
  /**
   * Emergency stale-regulation flag — market needs legal/ops review
   * before treating regulatory/tax packs as current.
   */
  reviewRequired: boolean;
  updatedAt: string;
  updatedBy: string | null;
  reason: string | null;
};

export type KillSwitchTarget =
  | "new_listings"
  | "valuations"
  | "lead_routing"
  | "payments"
  | "review_required";

const DEFAULT: Omit<MarketKillSwitchState, "marketCode"> = {
  pauseNewListings: false,
  pauseValuations: false,
  pauseLeadRouting: false,
  pausePayments: false,
  reviewRequired: false,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
  reason: null,
};

/** Process-local store — durable ops may mirror into Market.metadata. */
const STORE = new Map<string, MarketKillSwitchState>();

export function getMarketKillSwitch(marketCode: string): MarketKillSwitchState {
  const code = marketCode.toUpperCase();
  return (
    STORE.get(code) ?? {
      marketCode: code,
      ...DEFAULT,
    }
  );
}

export function listMarketKillSwitches(): MarketKillSwitchState[] {
  return [...STORE.values()];
}

export function setMarketKillSwitch(input: {
  marketCode: string;
  pauseNewListings?: boolean;
  pauseValuations?: boolean;
  pauseLeadRouting?: boolean;
  pausePayments?: boolean;
  reviewRequired?: boolean;
  updatedBy?: string | null;
  reason?: string | null;
}): MarketKillSwitchState {
  const code = input.marketCode.toUpperCase();
  const prev = getMarketKillSwitch(code);
  const next: MarketKillSwitchState = {
    marketCode: code,
    pauseNewListings: input.pauseNewListings ?? prev.pauseNewListings,
    pauseValuations: input.pauseValuations ?? prev.pauseValuations,
    pauseLeadRouting: input.pauseLeadRouting ?? prev.pauseLeadRouting,
    pausePayments: input.pausePayments ?? prev.pausePayments,
    reviewRequired: input.reviewRequired ?? prev.reviewRequired,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy ?? prev.updatedBy,
    reason: input.reason ?? prev.reason,
  };
  STORE.set(code, next);
  return next;
}

/** Flip a single target on/off. */
export function applyKillSwitch(input: {
  marketCode: string;
  target: KillSwitchTarget;
  enabled: boolean;
  updatedBy?: string | null;
  reason?: string | null;
}): MarketKillSwitchState {
  switch (input.target) {
    case "new_listings":
      return setMarketKillSwitch({
        ...input,
        pauseNewListings: input.enabled,
      });
    case "valuations":
      return setMarketKillSwitch({
        ...input,
        pauseValuations: input.enabled,
      });
    case "lead_routing":
      return setMarketKillSwitch({
        ...input,
        pauseLeadRouting: input.enabled,
      });
    case "payments":
      return setMarketKillSwitch({
        ...input,
        pausePayments: input.enabled,
      });
    case "review_required":
      return setMarketKillSwitch({
        ...input,
        reviewRequired: input.enabled,
      });
  }
}

/** Test helper — clear all switches. */
export function resetMarketKillSwitches(): void {
  STORE.clear();
}

export function isNewListingsPaused(marketCode: string): boolean {
  return getMarketKillSwitch(marketCode).pauseNewListings;
}

export function isValuationPaused(marketCode: string): boolean {
  return getMarketKillSwitch(marketCode).pauseValuations;
}

export function isLeadRoutingPaused(marketCode: string): boolean {
  return getMarketKillSwitch(marketCode).pauseLeadRouting;
}

export function isPaymentsPaused(marketCode: string): boolean {
  return getMarketKillSwitch(marketCode).pausePayments;
}

export function isMarketReviewRequired(marketCode: string): boolean {
  return getMarketKillSwitch(marketCode).reviewRequired;
}
