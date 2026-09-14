/**
 * Dev adapter — default until HypotekaJasne HTTP API exists.
 * Never pretends to be a live production feed.
 */

import type {
  FinancingPreviewRequest,
  FinancingPreviewResponse,
  HandoffLeadRequest,
  HandoffLeadResponse,
} from "../schemas/legacy";
import type {
  GetCurrentRatesRequest,
  GetMortgageOffersRequest,
  HypotekaJasneClient,
} from "../client/interface";
import {
  financingPreviewRequestSchema,
  handoffLeadRequestSchema,
  type ExternalMortgageOffersResponse,
} from "../schemas";
import { Money, nominalInterestRateFromPercentPoints } from "@/domains/finance";
import { calculateAnnuityPayment } from "@/domains/investment/engine/calculations/financing";
import { DEMO_MORTGAGE_OFFERS } from "./demo-mortgage-offers";
import { HYPOTEKAJASNE_INTEGRATION_VERSION } from "../version";

export class DevHypotekaJasneAdapter implements HypotekaJasneClient {
  getAdapterInfo() {
    return {
      kind: "dev" as const,
      isLive: false,
      integrationVersion: HYPOTEKAJASNE_INTEGRATION_VERSION,
      message:
        "Dev adapter — demo mortgage data only. Production HypotekaJasne API is not connected.",
    };
  }

  async getFinancingPreview(
    input: FinancingPreviewRequest,
  ): Promise<FinancingPreviewResponse> {
    const data = financingPreviewRequestSchema.parse(input);
    const loanAmountCzk = Math.max(
      data.propertyPriceCzk - data.availableEquityCzk,
      0,
    );

    const rates = await this.getCurrentRates({});
    const estimatedRatePct = rates.bestInterestRateFrom ?? 5.19;
    const estimatedMonthlyPaymentCzk =
      loanAmountCzk === 0
        ? 0
        : Number(
            calculateAnnuityPayment({
              principal: Money.fromMajor(loanAmountCzk, "CZK"),
              nominalInterestRate:
                nominalInterestRateFromPercentPoints(estimatedRatePct),
              termYears: data.termYears,
            }).monthlyPayment.value.major.toNumber(),
          );

    return {
      estimatedMonthlyPaymentCzk: Math.round(estimatedMonthlyPaymentCzk),
      estimatedRatePct,
      loanAmountCzk,
      disclaimer:
        "Demonstrační odhad HypotekaJasne (dev adapter). Nejde o závaznou nabídku financování.",
      provider: "hypotekajasne" as const,
      isMock: true,
    };
  }

  async handoffLead(input: HandoffLeadRequest): Promise<HandoffLeadResponse> {
    const data = handoffLeadRequestSchema.parse(input);
    return {
      externalLeadId: `dev-hj-${data.correlationId}`,
      status: "accepted" as const,
      isMock: true,
    };
  }

  async getMortgageOffers(
    input?: GetMortgageOffersRequest,
  ): Promise<ExternalMortgageOffersResponse> {
    let offers = [...DEMO_MORTGAGE_OFFERS];

    if (input?.ltvPct != null) {
      offers = offers.filter(
        (o) =>
          o.ltv?.maxPct == null || input.ltvPct! <= o.ltv.maxPct,
      );
    }

    return {
      offers,
      fetchedAt: new Date(),
      sourceStatus: "ok",
    };
  }

  async getCurrentRates(input?: GetCurrentRatesRequest) {
    const response = await this.getMortgageOffers({});
    let offers = response.offers;

    if (input?.fixationYears != null) {
      offers = offers.filter(
        (o) => o.rates.fixationYears === input.fixationYears,
      );
    }

    const activeRates = offers
      .map((o) => o.rates.interestFromPct)
      .filter((r) => Number.isFinite(r));
    const aprRates = offers
      .map((o) => o.rates.aprFromPct)
      .filter((r): r is number => r != null && Number.isFinite(r));

    return {
      bestInterestRateFrom:
        activeRates.length > 0 ? Math.min(...activeRates) : null,
      bestAprFrom: aprRates.length > 0 ? Math.min(...aprRates) : null,
      offerCount: offers.length,
      fetchedAt: response.fetchedAt,
      isLive: false,
      sourceStatus: response.sourceStatus,
    };
  }
}

/** @deprecated Use DevHypotekaJasneAdapter */
export class MockHypotekaJasneClient extends DevHypotekaJasneAdapter {}
