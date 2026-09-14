/**
 * Maximum Offer Price Engine — reverse purchase price from investor targets.
 */

import type { CostBand } from "../costs/bands";

export const MAX_OFFER_MODEL_VERSION = "max-offer.v2026.07";

export type OfferBand = CostBand;

export type MaxOfferStrategy = "flip" | "rental";

export type FlipOfferTarget = {
  strategy: "flip";
  /** Required gross profit (CZK major) at base scenario. */
  targetProfitCzk: number;
};

export type RentalOfferTarget = {
  strategy: "rental";
  targetNetYieldPct?: number;
  targetMonthlyCashFlowCzk?: number;
  targetCashOnCashPct?: number;
  targetIrrPct?: number;
  holdYears?: number;
};

export type MaxOfferTarget = FlipOfferTarget | RentalOfferTarget;

export type MaxOfferCostContext = {
  renovationCost: OfferBand;
  holdingCosts: OfferBand;
  resaleValue: OfferBand;
  /** Post-renovation annual EGI (for rental). */
  annualEgiCzk?: number | null;
  /** Post-renovation annual opex. */
  annualOpexCzk?: number | null;
  acquisitionCostRatePct?: number;
  feesRatePct?: number;
  sellingCostRatePct?: number;
  loanLtvPct?: number;
  nominalInterestRatePp?: number;
  termYears?: number;
  holdMonths?: number;
};

export type MaxOfferBandSet = {
  /** Safest cap — conservative ARV, high costs. */
  conservative: number;
  base: number;
  /** Reference only — optimistic ARV, low costs. */
  optimistic: number;
};

export type AskingPriceComparison = {
  askingPriceCzk: number;
  modeledLimitCzk: number;
  /** Positive = asking above limit (needs discount). */
  gapCzk: number;
  gapPct: number;
  withinLimit: boolean;
  negotiationAnchor: {
    discountRequiredCzk: number;
    discountRequiredPct: number;
    message: string;
  };
  marginOfSafety: {
    /** conservative max − asking (positive = headroom). */
    amountCzk: number;
    pctOfAsking: number;
    message: string;
  };
};

export type MaxOfferResult = {
  strategy: MaxOfferStrategy;
  maximumOffer: MaxOfferBandSet;
  bindingTarget: string;
  offerModelVersion: string;
  comparison: AskingPriceComparison | null;
};

export type MaxOfferInput = {
  target: MaxOfferTarget;
  costs: MaxOfferCostContext;
  askingPriceCzk?: number | null;
};
