import { describe, expect, it } from "vitest";
import { GenericJsonPropertySourceAdapter } from "./generic-json-adapter";
import { runAdapter } from "./adapter";
import { areaToSquareMeters, normalizeCurrency } from "./normalize";
import { buildItemIdempotencyKey, buildJobIdempotencyKey } from "./idempotency";
import {
  applyItemOutcome,
  emptyImportCounters,
  finalizeImportJobStatus,
} from "./import-job";
import { runIngestPipeline, markIdempotentSkip } from "./pipeline";

describe("normalize helpers", () => {
  it("maps currency aliases to ISO", () => {
    expect(normalizeCurrency("Kč")).toBe("CZK");
    expect(normalizeCurrency("€")).toBe("EUR");
  });

  it("converts sqft to m²", () => {
    expect(areaToSquareMeters(100, "sqft")).toBeCloseTo(9.29, 1);
  });
});

describe("GenericJsonPropertySourceAdapter", () => {
  it("runs parse → validate → normalize → map → extractMedia", () => {
    const adapter = new GenericJsonPropertySourceAdapter("partner-acme");
    const listing = runAdapter(adapter, {
      id: "ext-1",
      title: "Byt 2+kk",
      price: "4500000",
      currency: "Kc",
      area: 700,
      areaUnit: "sqft",
      city: "Praha",
      photos: ["https://cdn.example/a.jpg"],
    });
    expect(listing.externalPropertyId).toBe("ext-1");
    expect(listing.currency).toBe("CZK");
    expect(listing.usableAreaM2).toBeCloseTo(65.03, 0);
    expect(listing.media).toHaveLength(1);
  });

  it("rejects missing id", () => {
    const adapter = new GenericJsonPropertySourceAdapter();
    expect(() => runAdapter(adapter, { title: "X" })).toThrow(/external id/i);
  });
});

describe("idempotency + import job", () => {
  it("builds stable item keys from external id", () => {
    expect(
      buildItemIdempotencyKey({ provider: "Acme", externalPropertyId: "42" }),
    ).toBe("acme:ext:42");
    expect(buildJobIdempotencyKey({ provider: "Acme", runKey: "2026-07-19" })).toBe(
      "job:acme:2026-07-19",
    );
  });

  it("same payload hash without external id is stable", () => {
    const a = buildItemIdempotencyKey({ provider: "x", payload: { a: 1 } });
    const b = buildItemIdempotencyKey({ provider: "x", payload: { a: 1 } });
    expect(a).toBe(b);
  });

  it("finalizes job status from counters", () => {
    let c = emptyImportCounters();
    c = applyItemOutcome(c, "success");
    c = applyItemOutcome(c, "error");
    expect(finalizeImportJobStatus(c)).toBe("COMPLETED_WITH_WARNINGS");
  });
});

describe("runIngestPipeline", () => {
  it("produces canonical update plan and detects near-duplicates", () => {
    const adapter = new GenericJsonPropertySourceAdapter("portal");
    const result = runIngestPipeline({
      adapter,
      payload: {
        id: "p-9",
        title: "Byt Vinohrady",
        price: 7_500_000,
        area: 62,
        city: "Praha",
        street: "Vinohradská",
        houseNumber: "12",
      },
      candidates: [
        {
          id: "existing-1",
          street: "Vinohradská",
          houseNumber: "12",
          publicCity: "Praha",
          usableArea: 62,
          askingPrice: 7_400_000,
          title: "Byt Vinohrady",
        },
      ],
    });

    expect(result.stages).toContain("canonical_update");
    expect(result.canonical.action).toBe("create");
    expect(result.canonical.canonicalKey).toBe("portal:p-9");
    expect(result.duplicateMatches.length).toBeGreaterThan(0);
    expect(markIdempotentSkip(result.canonical).action).toBe("skip_idempotent");
  });

  it("updates when external id already known", () => {
    const adapter = new GenericJsonPropertySourceAdapter("portal");
    const result = runIngestPipeline({
      adapter,
      payload: { id: "p-9", title: "Byt", price: 1, area: 40, city: "Brno" },
      existingByExternalId: {
        id: "db-1",
        provider: "portal",
        externalPropertyId: "p-9",
        canonicalKey: "portal:p-9",
      },
    });
    expect(result.canonical.action).toBe("update");
  });
});
