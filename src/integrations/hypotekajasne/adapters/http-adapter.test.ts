import { describe, expect, it, vi } from "vitest";

import { HttpHypotekaJasneAdapter } from "./http-adapter";
import { DEMO_MORTGAGE_OFFERS } from "./demo-mortgage-offers";

const sampleOffersResponse = {
  offers: DEMO_MORTGAGE_OFFERS,
  fetchedAt: new Date().toISOString(),
  sourceStatus: "ok" as const,
};

describe("HttpHypotekaJasneAdapter", () => {
  it("exposes live adapter info", () => {
    const client = new HttpHypotekaJasneAdapter({
      apiUrl: "https://api.hypotekajasne.test",
      fetchFn: vi.fn(),
    });
    const info = client.getAdapterInfo();
    expect(info.kind).toBe("http");
    expect(info.isLive).toBe(true);
  });

  it("fetches mortgage offers from partner API", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => sampleOffersResponse,
    });

    const client = new HttpHypotekaJasneAdapter({
      apiUrl: "https://api.hypotekajasne.test",
      apiKey: "secret",
      fetchFn,
    });

    const result = await client.getMortgageOffers({ ltvPct: 80 });
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.sourceStatus).toBe("ok");
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.hypotekajasne.test/offers?ltvPct=80",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const call = fetchFn.mock.calls[0];
    expect(call).toBeDefined();
    const headers = (call![1] as RequestInit).headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer secret");
  });

  it("posts lead handoff to partner API", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          externalLeadId: "hj-live-123",
          status: "accepted",
          isMock: false,
        }),
      });

    const client = new HttpHypotekaJasneAdapter({
      apiUrl: "https://api.hypotekajasne.test",
      fetchFn,
    });

    const result = await client.handoffLead({
      email: "user@example.com",
      schemaVersion: "hypotekajasne-lead.v2026.07",
      correlationId: "ml_test_live_001",
      consentVersion: "mortgage-lead-transfer.v2026.07",
      source: "kalkulacky/financovani",
      attribution: { channel: "calculator", funnelStep: "financovani" },
      purchasePriceCzk: 4_500_000,
    });

    expect(result.status).toBe("accepted");
    expect(result.isMock).toBe(false);
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.hypotekajasne.test/leads",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws on non-OK HTTP responses", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const client = new HttpHypotekaJasneAdapter({
      apiUrl: "https://api.hypotekajasne.test",
      fetchFn,
    });

    await expect(client.getMortgageOffers()).rejects.toThrow("503");
  });
});
