import { describe, expect, it } from "vitest";

import { propertyAlertConfig } from "@/config/property-alerts";
import {
  buildPriceChangeCopy,
  buildSavedSearchBatchCopy,
  classifyStatusAlert,
  isMeaningfulPriceChange,
  priceAlertDedupeKey,
  resolveTransactionalChannels,
} from "@/domains/notifications";

describe("isMeaningfulPriceChange", () => {
  it("ignores INITIAL / CORRECTED / REMOVED", () => {
    for (const changeType of propertyAlertConfig.price.ignoreChangeTypes) {
      expect(
        isMeaningfulPriceChange({
          previousCzk: 6_790_000,
          currentCzk: 6_490_000,
          changeType,
        }),
      ).toBe(false);
    }
  });

  it("accepts a real decrease like −300k (−4,4 %)", () => {
    expect(
      isMeaningfulPriceChange({
        previousCzk: 6_790_000,
        currentCzk: 6_490_000,
        changeType: "DECREASED",
      }),
    ).toBe(true);
  });

  it("accepts a meaningful price increase", () => {
    expect(
      isMeaningfulPriceChange({
        previousCzk: 6_000_000,
        currentCzk: 6_400_000,
        changeType: "INCREASED",
      }),
    ).toBe(true);
  });

  it("rejects tiny technical noise under thresholds", () => {
    expect(
      isMeaningfulPriceChange({
        previousCzk: 6_790_000,
        currentCzk: 6_785_000,
        changeType: "DECREASED",
      }),
    ).toBe(false);
  });
});

describe("classifyStatusAlert", () => {
  it("does not alert on freshness-only silence", () => {
    expect(
      classifyStatusAlert({
        propertyId: "p1",
        previousStatus: "ACTIVE",
        newStatus: "UNAVAILABLE",
        freshnessOnly: true,
      }),
    ).toBeNull();
  });

  it("alerts on reserved / sold lifecycle", () => {
    expect(
      classifyStatusAlert({
        propertyId: "p1",
        previousStatus: "ACTIVE",
        newStatus: "RESERVED",
      }),
    ).toBe("STATUS_CHANGED");
    expect(
      classifyStatusAlert({
        propertyId: "p1",
        previousStatus: "ACTIVE",
        newStatus: "SOLD",
      }),
    ).toBe("STATUS_CHANGED");
  });

  it("classifies return to ACTIVE as RELISTED", () => {
    expect(
      classifyStatusAlert({
        propertyId: "p1",
        previousStatus: "SOLD",
        newStatus: "ACTIVE",
      }),
    ).toBe("RELISTED");
  });

  it("does not alert on UNAVAILABLE without freshnessOnly when not noteworthy", () => {
    // UNAVAILABLE removed from noteworthy — source silence ≠ sold
    expect(
      classifyStatusAlert({
        propertyId: "p1",
        previousStatus: "ACTIVE",
        newStatus: "UNAVAILABLE",
      }),
    ).toBeNull();
  });
});

describe("alert copy", () => {
  it("builds Czech price decrease copy", () => {
    const copy = buildPriceChangeCopy({
      propertyTitle: "Byt 3+kk Vinohrady",
      dispositionHint: "bytu",
      previousCzk: 6_790_000,
      currentCzk: 6_490_000,
      decreased: true,
    });
    expect(copy.body).toContain("klesla o");
    expect(copy.body).toContain("300");
    expect(copy.body).toMatch(/−|-4/);
  });

  it("batches saved-search matches", () => {
    const copy = buildSavedSearchBatchCopy({
      searchName: "Praha 3+kk",
      count: 3,
    });
    expect(copy.title).toBe("3 nové nabídky odpovídají hledání");
  });
});

describe("channels & consent", () => {
  it("never uses marketing prefs for property alerts", () => {
    expect(
      resolveTransactionalChannels(
        { transactionalEmail: false, transactionalInApp: true },
        true,
      ),
    ).toEqual(["IN_APP"]);
    expect(
      resolveTransactionalChannels(
        { transactionalEmail: true, transactionalInApp: false },
        true,
      ),
    ).toEqual(["EMAIL"]);
  });
});

describe("dedupe keys", () => {
  it("is stable for the same price observation day", () => {
    const at = new Date("2026-07-20T12:00:00.000Z");
    expect(
      priceAlertDedupeKey({
        propertyId: "p1",
        direction: "down",
        amountCzk: 6_490_000,
        observedAt: at,
      }),
    ).toBe("price:p1:down:6490000:2026-07-20");
  });

  it("price down and price up produce different keys (no cross-direction duplicate)", () => {
    const at = new Date("2026-07-20T12:00:00.000Z");
    const down = priceAlertDedupeKey({
      propertyId: "p1",
      direction: "down",
      amountCzk: 6_000_000,
      observedAt: at,
    });
    const up = priceAlertDedupeKey({
      propertyId: "p1",
      direction: "up",
      amountCzk: 6_000_000,
      observedAt: at,
    });
    expect(down).not.toBe(up);
  });

  it("duplicate same-day same-direction same-amount collapses to one key", () => {
    const at1 = new Date("2026-07-20T08:00:00.000Z");
    const at2 = new Date("2026-07-20T22:00:00.000Z");
    expect(
      priceAlertDedupeKey({
        propertyId: "p1",
        direction: "down",
        amountCzk: 5_000_000,
        observedAt: at1,
      }),
    ).toBe(
      priceAlertDedupeKey({
        propertyId: "p1",
        direction: "down",
        amountCzk: 5_000_000,
        observedAt: at2,
      }),
    );
  });
});
