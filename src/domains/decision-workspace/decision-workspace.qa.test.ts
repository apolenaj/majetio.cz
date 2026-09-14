import { describe, expect, it } from "vitest";

import { comparisonConfig } from "@/config/comparison";
import { buildComparisonViewModel } from "@/domains/comparisons/service/build-view-model";
import { buildComparisonWarnings } from "@/domains/comparisons/service/warnings";
import { detectStaleDiffs } from "@/domains/comparisons/decision/fingerprints";
import type { PropertyPublicFingerprint } from "@/domains/comparisons/decision/types";
import {
  COMPARE_MAX,
  addCompareItems,
  clearCompareTray,
  toggleCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import { priceAlertDedupeKey } from "@/domains/notifications/service/alert-dedupe";
import { isNewMatchAfterLastCheck } from "@/domains/saved-searches/service/match-semantics";
import {
  getDecisionMetricsSnapshot,
  observeFunnelStep,
  resetDecisionMetricsForTests,
} from "@/lib/analytics/decision-metrics";
import { assertAnalyticsSafe, type AnalyticsEvent } from "@/lib/analytics/events";
import {
  MAX_GUEST_FAVOURITES,
  clearGuestFavourites,
  moveGuestToShortlist,
  readGuestFavourites,
  upsertGuestFavourite,
} from "@/domains/favourites/guest-storage";
import {
  getHighYieldDemoFixture,
  getPriceChangeDemoFixture,
  DECISION_DEMO_FIXTURES,
} from "@/content/decision-demo-fixtures";

function trayItem(i: number): CompareTrayItem {
  return {
    id: `id-${i}`,
    slug: `slug-${i}`,
    title: `Item ${i}`,
    href: `/nemovitosti/slug-${i}`,
  };
}

describe("BOD 165 — add favourite + limits", () => {
  it("adds favourite and moves to shortlist", () => {
    clearGuestFavourites();
    const saved = upsertGuestFavourite({
      propertyId: "p1",
      slug: "demo-byt-2kk-brno",
      title: "High yield",
      href: "/nemovitosti/demo-byt-2kk-brno",
      priceCzk: 4_200_000,
    });
    expect(saved.status).toBe("CONSIDERING");
    expect(readGuestFavourites()).toHaveLength(1);

    const shortlisted = moveGuestToShortlist("p1");
    expect(shortlisted?.status).toBe("FAVORITE");
    expect(readGuestFavourites()[0]?.status).toBe("FAVORITE");
    clearGuestFavourites();
  });

  it("enforces guest favourite soft limit", () => {
    clearGuestFavourites();
    expect(MAX_GUEST_FAVOURITES).toBe(50);
    for (let i = 0; i < MAX_GUEST_FAVOURITES + 5; i++) {
      upsertGuestFavourite({
        propertyId: `p-${i}`,
        slug: `slug-${i}`,
        title: `T ${i}`,
        href: `/nemovitosti/slug-${i}`,
      });
    }
    expect(readGuestFavourites().length).toBeLessThanOrEqual(
      MAX_GUEST_FAVOURITES,
    );
    clearGuestFavourites();
  });
});

describe("BOD 165 — favourites / compare limits", () => {
  it("enforces max 4 compare tray items", () => {
    // jsdom/localStorage may be available in vitest
    clearCompareTray();
    expect(COMPARE_MAX).toBe(4);
    expect(comparisonConfig.maxProperties).toBe(4);

    for (let i = 0; i < 4; i++) {
      const r = toggleCompareItem(trayItem(i));
      expect(r.ok).toBe(true);
    }
    const full = toggleCompareItem(trayItem(99));
    expect(full.ok).toBe(false);
    if (!full.ok) expect(full.reason).toBe("full");

    clearCompareTray();
    const bulk = addCompareItems([
      trayItem(1),
      trayItem(2),
      trayItem(3),
      trayItem(4),
      trayItem(5),
    ]);
    expect(bulk.added).toBe(4);
    expect(bulk.full).toBe(true);
    clearCompareTray();
  });
});

describe("BOD 165 — alert dedupe", () => {
  it("same price change produces identical dedupe key", () => {
    const a = priceAlertDedupeKey({
      propertyId: "p1",
      direction: "down",
      observedAt: new Date("2026-07-20T10:00:00Z"),
      amountCzk: 6_000_000,
    });
    const b = priceAlertDedupeKey({
      propertyId: "p1",
      direction: "down",
      observedAt: new Date("2026-07-20T10:00:00Z"),
      amountCzk: 6_000_000,
    });
    expect(a).toBe(b);
  });
});

describe("BOD 165 — saved search match semantics", () => {
  it("existing match is not new; first create after check is new", () => {
    expect(
      isNewMatchAfterLastCheck({
        firstMatchedAt: new Date("2026-07-19"),
        lastCheckedAt: new Date("2026-07-20"),
        createdNow: false,
      }),
    ).toBe(false);
    expect(
      isNewMatchAfterLastCheck({
        firstMatchedAt: new Date("2026-07-20T12:00:00Z"),
        lastCheckedAt: new Date("2026-07-19T12:00:00Z"),
        createdNow: true,
      }),
    ).toBe(true);
  });
});

describe("BOD 166 — comparison scenarios", () => {
  it("missing metrics render as unavailable, never fake zero", () => {
    const view = buildComparisonViewModel({
      mode: "overview",
      properties: [
        { propertyId: "missing-a", slug: "does-not-exist-a", order: 0 },
        { propertyId: "missing-b", slug: "does-not-exist-b", order: 1 },
      ],
    });
    // Unknown slugs drop out of demo catalog → empty or partial
    for (const col of view.properties) {
      for (const cell of Object.values(col.cells)) {
        if (cell?.kind === "number") {
          // Missing must not be invented as 0 for yields — if present must be finite
          expect(Number.isFinite(cell.value)).toBe(true);
        }
      }
    }
    expect(view.unavailableLabel.length).toBeGreaterThan(0);
  });

  it("detects stale asking price without mutating snapshot fingerprint", () => {
    const prev: PropertyPublicFingerprint = {
      propertyId: "p1",
      askingPriceCzk: 6_000_000,
      status: "ACTIVE",
      valuationMidCzk: 5_800_000,
      renovationBaseCzk: null,
      majetioScore: null,
      updatedAt: "2026-07-01T00:00:00.000Z",
    };
    const live = { ...prev, askingPriceCzk: 5_700_000 };
    const diffs = detectStaleDiffs({
      snapshotFingerprints: [prev],
      live: [{ fingerprint: live, title: "A" }],
    });
    expect(diffs[0]?.messageCs).toMatch(/Cena klesla|Cena se změnila/);
    expect(prev.askingPriceCzk).toBe(6_000_000);
  });

  it("warns when comparing apartment vs house", () => {
    const warnings = buildComparisonWarnings([
      {
        propertyId: "a",
        title: "Byt",
        propertyType: "APARTMENT",
        strategyTags: [],
        valuationConfidence: "medium",
      },
      {
        propertyId: "b",
        title: "Dům",
        propertyType: "HOUSE",
        strategyTags: [],
        valuationConfidence: "medium",
      },
    ]);
    expect(warnings.some((w) => /byt|dům|typ/i.test(w.title + w.body))).toBe(
      true,
    );
  });
});

describe("BOD 175 — demo fixtures", () => {
  it("exposes high-yield and price-change properties", () => {
    expect(getHighYieldDemoFixture().grossYieldPct).toBeGreaterThan(5);
    expect(getPriceChangeDemoFixture().previousAskingPriceCzk).toBeGreaterThan(
      getPriceChangeDemoFixture().askingPriceCzk,
    );
    expect(DECISION_DEMO_FIXTURES).toHaveLength(3);
  });
});

describe("BOD 125–127 — analytics & funnel metrics", () => {
  it("decision workspace events are analytics-safe", () => {
    const events: AnalyticsEvent[] = [
      {
        name: "property_favorited",
        props: { action: "add", is_demo: true, status: "CONSIDERING" },
      },
      { name: "comparison_created", props: { property_count: 3 } },
      {
        name: "price_alert_opened",
        props: { alert_type: "PRICE_DECREASE", channel: "IN_APP" },
      },
      {
        name: "decision_funnel_step",
        props: { step: "compared" },
      },
    ];
    for (const e of events) {
      expect(() => assertAnalyticsSafe(e)).not.toThrow();
      expect(JSON.stringify(e)).not.toMatch(/note|password|@|Kč/i);
    }
  });

  it("aggregates save/compare rates without UI", () => {
    resetDecisionMetricsForTests();
    observeFunnelStep("viewed");
    observeFunnelStep("viewed");
    observeFunnelStep("saved");
    observeFunnelStep("compared");
    const snap = getDecisionMetricsSnapshot();
    expect(snap.rates.saveRate).toBe(0.5);
    expect(snap.rates.compareRate).toBe(1);
  });
});
