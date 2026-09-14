import type {
  ExternalMortgageOffersResponse,
  FinancingPreviewRequest,
  FinancingPreviewResponse,
  HandoffLeadRequest,
  HandoffLeadResponse,
} from "../schemas";

export type HypotekaJasneAdapterKind = "dev" | "http" | "mock";

export type HypotekaJasneAdapterInfo = {
  kind: HypotekaJasneAdapterKind;
  isLive: boolean;
  integrationVersion: string;
  message: string;
};

export type GetMortgageOffersRequest = {
  ltvPct?: number;
  loanAmountCzk?: number;
};

export type GetCurrentRatesRequest = {
  /** Optional fixation filter in whole years. */
  fixationYears?: number;
};

export type CurrentRatesResponse = {
  /** Best nominal rate from (percent points) among active offers. */
  bestInterestRateFrom: number | null;
  /** Best APR from (percent points) among active offers. */
  bestAprFrom: number | null;
  offerCount: number;
  fetchedAt: Date;
  isLive: boolean;
  sourceStatus: ExternalMortgageOffersResponse["sourceStatus"];
};

/**
 * Integration boundary — Majetio calls this, never HypotekaJasne internals directly.
 * Production HTTP adapter lands in Part 5; until then dev adapter only.
 */
export interface HypotekaJasneClient {
  getAdapterInfo(): HypotekaJasneAdapterInfo;

  /** Legacy orientační preview (Decision Cockpit). */
  getFinancingPreview(
    input: FinancingPreviewRequest,
  ): Promise<FinancingPreviewResponse>;

  /** Lead handoff after explicit consent. */
  handoffLead(input: HandoffLeadRequest): Promise<HandoffLeadResponse>;

  /** Raw partner offers — normalized by ingestion pipeline. */
  getMortgageOffers(
    input?: GetMortgageOffersRequest,
  ): Promise<ExternalMortgageOffersResponse>;

  /** Aggregated rate snapshot for UI badges. */
  getCurrentRates(
    input?: GetCurrentRatesRequest,
  ): Promise<CurrentRatesResponse>;
}
