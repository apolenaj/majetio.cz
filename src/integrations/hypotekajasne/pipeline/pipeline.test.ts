/**
 * Prompt 13 Part 1 — rate ingestion pipeline & anomaly detection.
 */

import { describe, expect, it } from "vitest";

import { DevHypotekaJasneAdapter } from "../adapters/dev-adapter";
import type { HypotekaJasneClient } from "../client/interface";
import {
  detectRateAnomalies,
  deduplicateOffers,
  normalizeExternalOffers,
  resolveMortgageFreshness,
  runRateIngestionPipeline,
  validateExternalOffers,
} from "../pipeline";
import { InMemoryMortgageOfferStore } from "../service/mortgage-offer-store";

describe("Mortgage rate pipeline", () => {
  it("validates and flags apr below interest", () => {
    const result = validateExternalOffers([
      {
        externalId: "x1",
        bank: { name: "Bank X" },
        product: { name: "Prod" },
        rates: { interestFromPct: 6, aprFromPct: 5, fixationYears: 5 },
      },
    ]);

    expect(result.valid).toHaveLength(1);
    expect(result.anomalies.some((a) => a.code === "apr_below_interest")).toBe(
      true,
    );
  });

  it("deduplicates by bank/product/fixation keeping lowest rate", () => {
    const fetchedAt = new Date();
    const drafts = normalizeExternalOffers(
      [
        {
          externalId: "a1",
          bank: { name: "Bank A" },
          product: { name: "Fix 5" },
          rates: { interestFromPct: 5.5, aprFromPct: 5.7, fixationYears: 5 },
        },
        {
          externalId: "a2",
          bank: { name: "Bank A" },
          product: { name: "Fix 5" },
          rates: { interestFromPct: 5.1, aprFromPct: 5.3, fixationYears: 5 },
        },
      ],
      { fetchedAt, dataTier: "cached" },
    );

    const deduped = deduplicateOffers(drafts);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]!.interestRateFrom).toBe(5.1);
  });

  it("detects rate jump anomalies", () => {
    const anomalies = detectRateAnomalies({
      offers: [
        {
          id: "1",
          bankName: "Bank",
          productName: "P",
          interestRateFrom: 7,
          aprFrom: 7.2,
          fixationYears: 5,
          ltvMaxPct: 80,
          ltvMinPct: null,
          source: "hypotekajasne",
          status: "active",
          dataTier: "cached",
          retrievedAt: new Date(),
          verifiedAt: null,
          schemaVersion: "v1",
          dedupeKey: "Bank::P::5",
          anomalies: [],
        },
      ],
      comparisons: [
        {
          offerKey: "Bank::P::5",
          previousInterestRateFrom: 4.5,
          interestRateFrom: 7,
          rateChanged: true,
          deltaPp: 2.5,
        },
      ],
    });

    expect(anomalies.some((a) => a.code === "rate_jump")).toBe(true);
  });

  it("runs full ingestion and writes history only on first ingest", async () => {
    const store = new InMemoryMortgageOfferStore();
    const client = new DevHypotekaJasneAdapter();

    const first = await runRateIngestionPipeline({ client, store });
    expect(first.stored.length).toBeGreaterThan(0);
    expect(first.historyRowsCreated).toBeGreaterThan(0);
    expect(first.stored.some((o) => o.status === "review_required")).toBe(true);

    const second = await runRateIngestionPipeline({
      client,
      store,
      runId: "second-run",
    });
    expect(second.historyRowsCreated).toBe(0);
  });

  it("returns verified fallback on source outage without zero rates", async () => {
    const store = new InMemoryMortgageOfferStore();
    const client = new DevHypotekaJasneAdapter();

    await runRateIngestionPipeline({ client, store });

    const failingClient: HypotekaJasneClient = {
      getAdapterInfo: client.getAdapterInfo.bind(client),
      getFinancingPreview: client.getFinancingPreview.bind(client),
      handoffLead: client.handoffLead.bind(client),
      getCurrentRates: client.getCurrentRates.bind(client),
      getMortgageOffers: async () => {
        throw new Error("source down");
      },
    };

    const result = await runRateIngestionPipeline({
      client: failingClient,
      store,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.stored.length).toBeGreaterThan(0);
    expect(result.stored[0]!.interestRateFrom).toBeGreaterThan(0);
    expect(result.stored[0]!.dataTier).toBe("verified");
  });
});

describe("Mortgage freshness labels", () => {
  it("shows Aktualizováno dnes for same-day live data", () => {
    const now = new Date("2026-07-20T10:00:00");
    const label = resolveMortgageFreshness({
      dataTier: "live",
      retrievedAt: new Date("2026-07-20T08:00:00"),
      verifiedAt: null,
      now,
    });
    expect(label.label).toBe("Aktualizováno dnes");
  });

  it("shows last verified label for older verified data", () => {
    const label = resolveMortgageFreshness({
      dataTier: "verified",
      retrievedAt: new Date("2026-06-01T08:00:00"),
      verifiedAt: new Date("2026-06-15T08:00:00"),
      now: new Date("2026-07-20T10:00:00"),
    });
    expect(label.label).toContain("Poslední ověřená sazba");
  });
});
