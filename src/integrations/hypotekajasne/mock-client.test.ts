import { describe, expect, it } from "vitest";

import { DevHypotekaJasneAdapter } from "./adapters/dev-adapter";

describe("DevHypotekaJasneAdapter", () => {
  const client = new DevHypotekaJasneAdapter();

  it("exposes adapter info as non-live dev", () => {
    const info = client.getAdapterInfo();
    expect(info.isLive).toBe(false);
    expect(info.kind).toBe("dev");
  });

  it("returns mock financing preview", async () => {
    const result = await client.getFinancingPreview({
      propertyPriceCzk: 5_000_000,
      availableEquityCzk: 1_000_000,
      termYears: 30,
    });

    expect(result.isMock).toBe(true);
    expect(result.provider).toBe("hypotekajasne");
    expect(result.loanAmountCzk).toBe(4_000_000);
    expect(result.estimatedMonthlyPaymentCzk).toBeGreaterThan(0);
  });

  it("returns demo mortgage offers", async () => {
    const result = await client.getMortgageOffers({});
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.sourceStatus).toBe("ok");
  });

  it("returns current rates aggregate", async () => {
    const rates = await client.getCurrentRates({});
    expect(rates.isLive).toBe(false);
    expect(rates.bestInterestRateFrom).not.toBeNull();
    expect(rates.offerCount).toBeGreaterThan(0);
  });

  it("accepts mock lead handoff", async () => {
    const result = await client.handoffLead({
      email: "demo@majetio.cz",
      schemaVersion: "hypotekajasne-lead.v2026.07",
      correlationId: "ml_test_correlation_001",
      consentVersion: "mortgage-lead-transfer.v2026.07",
      source: "kalkulacky/financovani",
      attribution: {
        channel: "calculator",
        funnelStep: "financovani",
        campaign: null,
      },
    });

    expect(result.isMock).toBe(true);
    expect(result.status).toBe("accepted");
    expect(result.externalLeadId).toContain("dev-hj");
  });
});
