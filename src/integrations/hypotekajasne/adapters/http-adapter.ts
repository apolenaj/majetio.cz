/**
 * Production HTTP adapter for HypotekaJasne partner API.
 * PII in POST body over HTTPS only — never query parameters.
 */

import type {
  FinancingPreviewRequest,
  FinancingPreviewResponse,
  HandoffLeadRequest,
  HandoffLeadResponse,
  ExternalMortgageOffersResponse,
} from "../schemas";
import {
  externalMortgageOffersResponseSchema,
  financingPreviewRequestSchema,
  handoffLeadRequestSchema,
  handoffLeadResponseSchema,
} from "../schemas";
import type {
  GetCurrentRatesRequest,
  GetMortgageOffersRequest,
  HypotekaJasneClient,
} from "../client/interface";
import type { HypotekaJasneAuthMode } from "../config";
import { assertNoPiiInUrl } from "../config";
import {
  buildSignedRequestHeaders,
  MAJETIO_SIGNATURE_HEADER,
  MAJETIO_TIMESTAMP_HEADER,
} from "../security/request-signing";
import {
  classifyFetchError,
  hypotekaJasneApiErrorFromResponse,
} from "../security/api-errors";
import { Money } from "@/domains/finance";
import { calculateAnnuityPayment } from "@/domains/investment/engine/calculations/financing";
import { nominalInterestRateFromPercentPoints } from "@/domains/finance/primitives/rates";
import { HYPOTEKAJASNE_INTEGRATION_VERSION } from "../version";

export type HttpHypotekaJasneAdapterOptions = {
  apiUrl: string;
  apiKey?: string | null;
  signingSecret?: string | null;
  authMode?: HypotekaJasneAuthMode;
  fetchFn?: typeof fetch;
};

export class HttpHypotekaJasneAdapter implements HypotekaJasneClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly signingSecret: string | null;
  private readonly authMode: HypotekaJasneAuthMode;
  private readonly fetchFn: typeof fetch;

  constructor(options: HttpHypotekaJasneAdapterOptions) {
    this.baseUrl = options.apiUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey ?? null;
    this.signingSecret = options.signingSecret ?? null;
    this.authMode = options.authMode ?? "bearer";
    this.fetchFn = options.fetchFn ?? fetch;
  }

  getAdapterInfo() {
    return {
      kind: "http" as const,
      isLive: true,
      integrationVersion: HYPOTEKAJASNE_INTEGRATION_VERSION,
      message: "Live HypotekaJasne HTTP API (signed server-to-server)",
    };
  }

  async getMortgageOffers(
    input?: GetMortgageOffersRequest,
  ): Promise<ExternalMortgageOffersResponse> {
    const params = new URLSearchParams();
    if (input?.ltvPct != null) params.set("ltvPct", String(input.ltvPct));
    if (input?.loanAmountCzk != null) {
      params.set("loanAmountCzk", String(input.loanAmountCzk));
    }
    const query = params.toString();
    const path = query ? `/offers?${query}` : "/offers";
    const payload = await this.requestJson(path);
    return externalMortgageOffersResponseSchema.parse(payload);
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
      isLive: response.sourceStatus === "ok",
      sourceStatus: response.sourceStatus,
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
        : Math.round(
            calculateAnnuityPayment({
              principal: Money.fromMajor(loanAmountCzk, "CZK"),
              nominalInterestRate: nominalInterestRateFromPercentPoints(
                estimatedRatePct,
              ),
              termYears: data.termYears,
            }).monthlyPayment.value.major.toNumber(),
          );

    return {
      estimatedMonthlyPaymentCzk,
      estimatedRatePct,
      loanAmountCzk,
      disclaimer:
        "Orientační odhad HypotekaJasne podle aktuálních sazeb partnera. Nejde o závaznou nabídku financování.",
      provider: "hypotekajasne",
      isMock: false,
    };
  }

  async handoffLead(input: HandoffLeadRequest): Promise<HandoffLeadResponse> {
    const data = handoffLeadRequestSchema.parse(input);
    const payload = await this.requestJson("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return handoffLeadResponseSchema.parse(payload);
  }

  private async requestJson(
    path: string,
    init?: RequestInit,
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    assertNoPiiInUrl(url);

    const body = init?.body ?? "";
    const bodyText = typeof body === "string" ? body : "";

    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (bodyText) headers.set("Content-Type", "application/json");

    if (
      (this.authMode === "bearer" || this.authMode === "bearer_and_signed") &&
      this.apiKey
    ) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    if (
      (this.authMode === "signed" || this.authMode === "bearer_and_signed") &&
      this.signingSecret &&
      init?.method === "POST" &&
      bodyText
    ) {
      const signed = buildSignedRequestHeaders({
        secret: this.signingSecret,
        body: bodyText,
      });
      headers.set(MAJETIO_TIMESTAMP_HEADER, signed[MAJETIO_TIMESTAMP_HEADER]);
      headers.set(MAJETIO_SIGNATURE_HEADER, signed[MAJETIO_SIGNATURE_HEADER]);
    }

    try {
      const response = await this.fetchFn(url, {
        ...init,
        headers,
      });

      if (!response.ok) {
        throw hypotekaJasneApiErrorFromResponse({
          status: response.status,
          statusText: response.statusText,
        });
      }

      return response.json() as Promise<unknown>;
    } catch (error) {
      throw classifyFetchError(error);
    }
  }
}
