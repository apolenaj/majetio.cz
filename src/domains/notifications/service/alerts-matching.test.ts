import { describe, expect, it, vi, beforeEach } from "vitest";

import { propertyAlertConfig } from "@/config/property-alerts";
import { isNewMatchAfterLastCheck } from "@/domains/saved-searches/service/match-semantics";
import {
  frequencyAllowsImmediate,
  frequencyIsDigest,
  propertyMatchesSavedSearch,
  type PropertyMatchCandidate,
} from "@/domains/saved-searches/service/reverse-match";
import {
  assertNoFinancingPayload,
  buildPropertyAlertInstantEmail,
  buildPropertyAlertDigestEmail,
  digestBatchKey,
  isMeaningfulPriceChange,
  resetAlertMetricsForTests,
  sanitizeNotificationHref,
  emitAlertTelemetry,
  alertMetrics,
  registerAlertTelemetrySink,
  summarizeDigestItems,
} from "@/domains/notifications";

const processFavouritePriceChange = vi.fn(async () => ({
  notified: 0,
  skipped: "mocked",
}));

vi.mock("@/domains/notifications/service/price-alerts", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/domains/notifications/service/price-alerts")
    >();
  return {
    ...actual,
    processFavouritePriceChange: (...args: never[]) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (processFavouritePriceChange as any)(...args),
  };
});

vi.mock("@/domains/notifications/service/status-alerts", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/domains/notifications/service/status-alerts")
    >();
  return {
    ...actual,
    processFavouriteStatusChange: vi.fn(async () => ({
      notified: 0,
      skipped: "mocked",
    })),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    savedSearch: { findMany: vi.fn(async () => []) },
  },
}));

describe("BOD 70 — new match after last check", () => {
  it("yesterday's match is not new today (already existed)", () => {
    expect(
      isNewMatchAfterLastCheck({
        firstMatchedAt: new Date("2026-07-19T10:00:00Z"),
        lastCheckedAt: new Date("2026-07-20T08:00:00Z"),
        createdNow: false,
      }),
    ).toBe(false);
  });

  it("baseline (never checked) is not new", () => {
    expect(
      isNewMatchAfterLastCheck({
        firstMatchedAt: new Date(),
        lastCheckedAt: null,
        createdNow: true,
      }),
    ).toBe(false);
  });

  it("first create after a prior check is new", () => {
    expect(
      isNewMatchAfterLastCheck({
        firstMatchedAt: new Date("2026-07-20T12:00:00Z"),
        lastCheckedAt: new Date("2026-07-19T12:00:00Z"),
        createdNow: true,
      }),
    ).toBe(true);
  });
});

describe("BOD 72 — alert frequency routing helpers", () => {
  it("INSTANT is immediate; DAILY/WEEKLY are digest; OFF is neither", () => {
    expect(frequencyAllowsImmediate("INSTANT")).toBe(true);
    expect(frequencyAllowsImmediate("DAILY")).toBe(false);
    expect(frequencyIsDigest("DAILY")).toBe(true);
    expect(frequencyIsDigest("WEEKLY")).toBe(true);
    expect(frequencyIsDigest("INSTANT")).toBe(false);
    expect(frequencyIsDigest("OFF")).toBe(false);
  });
});

describe("BOD 141 — digest grouping key", () => {
  it("groups by frequency + user + saved search + day", () => {
    const at = new Date("2026-07-20T15:00:00Z");
    expect(
      digestBatchKey({
        frequency: "DAILY",
        userId: "u1",
        savedSearchId: "s1",
        at,
      }),
    ).toBe("digest:daily:u1:s1:2026-07-20");

    expect(
      digestBatchKey({
        frequency: "DAILY",
        userId: "u1",
        savedSearchId: "s2",
        at,
      }),
    ).not.toBe(
      digestBatchKey({
        frequency: "DAILY",
        userId: "u1",
        savedSearchId: "s1",
        at,
      }),
    );
  });

  it("weekly key uses ISO week bucket", () => {
    const key = digestBatchKey({
      frequency: "WEEKLY",
      userId: "u1",
      savedSearchId: "s1",
      at: new Date("2026-07-20T12:00:00Z"),
    });
    expect(key).toMatch(/^digest:weekly:u1:s1:2026-W\d{2}$/);
  });

  it("summarizes digest as '5 nových, 2 poklesy'", () => {
    const items = [
      ...Array.from({ length: 5 }, (_, i) => ({
        eventKind: "NEW_PROPERTY" as const,
        id: `n${i}`,
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        eventKind: "PRICE_DROP" as const,
        id: `d${i}`,
      })),
    ];
    expect(summarizeDigestItems(items)).toBe("5 nových, 2 poklesy");
  });

  it("digest e-mail includes kind summary and no financing", () => {
    const tpl = buildPropertyAlertDigestEmail({
      searchName: "Praha 2+kk",
      summary: "5 nových, 2 poklesy",
      items: [
        {
          title: "Byt A",
          city: "Praha",
          eventKind: "NEW_PROPERTY",
          path: "/nemovitosti/a",
        },
        {
          title: "Byt B",
          city: "Praha",
          eventKind: "PRICE_DROP",
          path: "/nemovitosti/b",
        },
      ],
      ctaPath: "/ucet/ulozena-hledani",
      siteOrigin: "https://majetio.cz",
    });
    expect(tpl).not.toBeNull();
    expect(tpl!.subject).toContain("5 nových, 2 poklesy");
    expect(tpl!.text).toContain("Nová nabídka");
    expect(tpl!.text).toContain("Pokles ceny");
    expect(tpl!.text).not.toMatch(/\bLTV\b/);
    expect(tpl!.text).not.toMatch(/příjem/i);
  });
});

describe("BOD 136 — safe notification hrefs", () => {
  it("allows relative app paths only", () => {
    expect(sanitizeNotificationHref("/ucet/upozorneni")).toBe("/ucet/upozorneni");
    expect(sanitizeNotificationHref("/nemovitosti/foo")).toBe("/nemovitosti/foo");
  });

  it("blocks open redirects and schemes", () => {
    expect(sanitizeNotificationHref("https://evil.example/phish")).toBeNull();
    expect(sanitizeNotificationHref("//evil.example")).toBeNull();
    expect(sanitizeNotificationHref("javascript:alert(1)")).toBeNull();
    expect(sanitizeNotificationHref("/\\evil.example")).toBeNull();
    expect(sanitizeNotificationHref("ucet/relative")).toBeNull();
  });
});

describe("BOD 74 — e-mail must not carry financing data", () => {
  it("rejects meta with income / LTV / passport", () => {
    expect(assertNoFinancingPayload({ income: 80_000 })).toBe(false);
    expect(assertNoFinancingPayload({ ltv: 0.8 })).toBe(false);
    expect(assertNoFinancingPayload({ passport: { a: 1 } })).toBe(false);
    expect(assertNoFinancingPayload({ savedSearchId: "s1", items: [] })).toBe(
      true,
    );
  });

  it("instant template is minimal title/location/change/CTA", () => {
    const tpl = buildPropertyAlertInstantEmail({
      eventKind: "PRICE_DROP",
      propertyTitle: "Byt 2+kk Vinohrady",
      city: "Praha",
      changeLine: "Cena klesla o 200 000 Kč.",
      path: "/nemovitosti/byt-vinohrady",
      siteOrigin: "https://majetio.cz",
    });
    expect(tpl).not.toBeNull();
    expect(tpl!.subject).toContain("Byt 2+kk Vinohrady");
    expect(tpl!.text).toContain("Cena klesla");
    expect(tpl!.text).toContain("https://majetio.cz/nemovitosti/byt-vinohrady");
    expect(tpl!.text).not.toMatch(/\bLTV\b/);
    expect(tpl!.text).not.toMatch(/80\s*000/);
  });

  it("rejects absolute CTA path (open redirect)", () => {
    expect(
      buildPropertyAlertInstantEmail({
        eventKind: "NEW_PROPERTY",
        propertyTitle: "X",
        changeLine: "Nová nabídka",
        path: "https://evil.example",
        siteOrigin: "https://majetio.cz",
      }),
    ).toBeNull();
  });
});

describe("BOD 182 / 139 — corrected price does not alert", () => {
  beforeEach(() => {
    resetAlertMetricsForTests();
    processFavouritePriceChange.mockClear();
  });

  it("isMeaningfulPriceChange ignores CORRECTED", () => {
    expect(
      isMeaningfulPriceChange({
        previousCzk: 5_000_000,
        currentCzk: 4_500_000,
        changeType: "CORRECTED",
      }),
    ).toBe(false);
  });

  it("emitPropertyDomainEvent suppresses CORRECTED without favourite alerts", async () => {
    const { emitPropertyDomainEvent } = await import(
      "@/domains/notifications/events/property-events"
    );
    const events: unknown[] = [];
    const unsub = registerAlertTelemetrySink((e) => events.push(e));

    await emitPropertyDomainEvent({
      type: "PropertyPriceChanged",
      propertyId: "p1",
      amount: 4_500_000,
      changeType: "CORRECTED",
      observedAt: new Date(),
    });

    expect(processFavouritePriceChange).not.toHaveBeenCalled();
    expect(alertMetrics.duplicates).toBeGreaterThanOrEqual(1);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "alert_duplicate_suppressed",
          reason: "corrected_price",
        }),
      ]),
    );
    unsub();
  });

  it("config lists INITIAL/CORRECTED/REMOVED as ignore types", () => {
    expect(propertyAlertConfig.price.ignoreChangeTypes).toEqual(
      expect.arrayContaining(["INITIAL", "CORRECTED", "REMOVED"]),
    );
  });
});

describe("BOD 148 — reverse match filter application", () => {
  const base: PropertyMatchCandidate = {
    id: "p1",
    slug: "byt-praha",
    title: "Byt Praha",
    askingPrice: 6_000_000,
    priceCzk: 6_000_000,
    propertyType: "APARTMENT",
    layout: "2+kk",
    usableArea: 55,
    landArea: null,
    condition: null,
    ownershipType: null,
    publicCity: "Praha",
    publicDistrict: null,
    publicRegion: null,
    publicLabel: "Praha",
    status: "ACTIVE",
    visibility: "PUBLIC",
    publishedAt: new Date(),
  };

  it("matches when city filter fits", () => {
    expect(
      propertyMatchesSavedSearch(base, {
        version: 1,
        state: { lokalita: "Praha", typ: [], dispozice: [] },
      }),
    ).toBe(true);
  });

  it("rejects non-public / inactive listings", () => {
    expect(
      propertyMatchesSavedSearch(
        { ...base, status: "SOLD" },
        { version: 1, state: { lokalita: "Praha", typ: [], dispozice: [] } },
      ),
    ).toBe(false);
  });
});

describe("BOD 143 — telemetry counters", () => {
  beforeEach(() => {
    resetAlertMetricsForTests();
  });

  it("counts failed and delivered", () => {
    emitAlertTelemetry({
      type: "alert_delivered",
      channel: "EMAIL",
      alertType: "SAVED_SEARCH_MATCH",
      status: "SENT",
    });
    emitAlertTelemetry({
      type: "alert_failed",
      channel: "EMAIL",
      alertType: "SAVED_SEARCH_MATCH",
      code: "sendgrid_down",
      retryable: true,
    });
    expect(alertMetrics.delivered).toBe(1);
    expect(alertMetrics.failed).toBe(1);
  });
});

describe("BOD 142 — email retry must not recreate IN_APP", () => {
  it("documents that processPendingAlertEmails only updates EMAIL rows", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = await fs.readFile(
      path.join(
        process.cwd(),
        "src/domains/notifications/service/email-delivery.ts",
      ),
      "utf8",
    );
    expect(file).toContain("Intentionally do NOT create Notification");
    expect(file).not.toMatch(/prisma\.notification\.create/);
  });
});
